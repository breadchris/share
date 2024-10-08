package main

import (
	"context"
	"crypto/tls"
	"github.com/PuerkitoBio/goquery"
	"github.com/chromedp/cdproto/cdp"
	"github.com/chromedp/cdproto/fetch"
	"github.com/chromedp/cdproto/network"
	"github.com/chromedp/chromedp"
	"github.com/pkg/errors"
	"io"
	"log/slog"
	"net/http"
	"strings"
	"time"
)

type Scraper interface {
	Scrape(url string) (*Response, error)
}

type scraper struct {
	httpClient     *http.Client
	browserDomains []string
	config         ScrapeConfig
	chromeCtx      context.Context
}

func NewScraper(config ScrapeConfig) *scraper {
	tr := &http.Transport{
		TLSClientConfig: &tls.Config{InsecureSkipVerify: true},
	}

	client := &http.Client{Timeout: time.Second * 5, Transport: tr}

	parsedBrowserDomains := strings.Split(strings.ReplaceAll(config.BrowserDomains, " ", ""), ",")

	o := chromedp.DefaultExecAllocatorOptions[:]
	if config.Proxy.Host != "" {
		o = append(o,
			chromedp.ProxyServer(config.Proxy.Host),
		)
	}

	o = append(o,
		chromedp.Flag("headless", true),
		chromedp.Flag("disable-gpu", true),
		chromedp.Flag("no-sandbox", true),
	)

	ctx, cancel := chromedp.NewExecAllocator(
		context.Background(), o...)
	defer cancel()

	chromeCtx, cancel := chromedp.NewContext(
		ctx,
		chromedp.WithDebugf(slog.Debug),
	)
	defer cancel()

	return &scraper{
		config:         config,
		httpClient:     client,
		browserDomains: parsedBrowserDomains,
		chromeCtx:      chromeCtx,
	}
}

func (p *scraper) Scrape(url string) (*Response, error) {
	var (
		resp *Response
		err  error
	)

	if p.config.UseCache {
		// TODO breadchris use cache
	}

	if p.config.Client == "chrome" {
		resp, err = p.scrapeWithChrome(url)
	} else if p.config.Client == "http" {
		resp, err = p.scrapeWithClient(url)
	} else {
		return nil, errors.Errorf("unknown client %s", p.config.Client)
	}

	if err == nil {
		return resp, nil
	}

	// If we failed to scrape with the configured client, try the fallback
	if p.config.Fallback && p.config.Client != "http" {
		return p.scrapeWithClient(url)
	}
	return nil, err
}

func (p *scraper) scrapeWithClient(url string) (*Response, error) {
	req, err := http.NewRequest(http.MethodGet, url, nil)
	if err != nil {
		return nil, errors.Wrapf(err, "failed to create request for %s", url)
	}
	req.Header.Set("User-Agent", "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/107.0.0.0 Safari/537.36")

	resp, err := p.httpClient.Do(req)
	if err != nil {
		return nil, errors.Wrapf(err, "failed to fetch reference Host %s", url)
	}
	defer resp.Body.Close()

	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}

	// TODO parse header out of respBody
	return &Response{
		Title:       "",
		Content:     string(respBody),
		ContentType: resp.Header.Get("Content-Type"),
	}, nil
}

func (p *scraper) scrapeWithChrome(url string) (*Response, error) {
	//whenPromptedLoginToProxy(ctx, p.config.Proxy.Username, p.config.Proxy.Password)

	timeoutCtx, timeoutCancel := context.WithTimeout(p.chromeCtx, 10*time.Second)
	defer timeoutCancel()

	start := time.Now()

	var (
		html  string
		title string
	)
	err := chromedp.Run(timeoutCtx,
		//fetch.Enable().WithHandleAuthRequests(true),
		//navigateWithError(url),
		chromedp.Navigate(url),
		chromedp.Sleep(1*time.Second),
		chromedp.OuterHTML("html", &html),
		chromedp.Title(&title),
	)
	if err != nil {
		return nil, errors.Wrapf(err, "failed to scrape Host with Chrome: %s", url)
	}

	slog.Debug("scraped Host with Chrome", "url", url, "duration", time.Since(start).Seconds())
	return &Response{
		Title:       title,
		Content:     html,
		ContentType: "text/html",
	}, nil
}

type Response struct {
	Title       string
	Content     string
	ContentType string
}

func listenForNetworkEvent(ctx context.Context) {
	chromedp.ListenTarget(ctx, func(ev interface{}) {
		switch ev := ev.(type) {

		case *network.EventResponseReceived:
			resp := ev.Response
			if len(resp.Headers) != 0 {
				slog.Debug("received headers", "headers", resp.Headers)
			}
		}
	})
}
func navigateWithError(url string) chromedp.ActionFunc {
	return func(ctx context.Context) error {
		resp, err := chromedp.RunResponse(ctx, chromedp.Navigate(url))
		if err != nil {
			return err
		}
		if resp.Status != 200 {
			return err
		}
		return nil
	}
}

func whenPromptedLoginToProxy(ctx context.Context, username, password string) {
	chromedp.ListenTarget(ctx, func(ev interface{}) {
		go func() {
			switch ev := ev.(type) {
			case *fetch.EventAuthRequired:
				c := chromedp.FromContext(ctx)
				execCtx := cdp.WithExecutor(ctx, c.Target)

				resp := &fetch.AuthChallengeResponse{
					Response: fetch.AuthChallengeResponseResponseProvideCredentials,
					Username: username,
					Password: password,
				}

				err := fetch.ContinueWithAuth(ev.RequestID, resp).Do(execCtx)
				if err != nil {
					slog.Debug("failed to continue with auth", "err", err)
				}

			case *fetch.EventRequestPaused:
				c := chromedp.FromContext(ctx)
				execCtx := cdp.WithExecutor(ctx, c.Target)
				err := fetch.ContinueRequest(ev.RequestID).Do(execCtx)
				if err != nil {
					slog.Error("failed to continue request", "err", err)
				}
			}
		}()
	})
}

func CleanRawHTML(content string) (string, error) {
	contentReader := strings.NewReader(content)
	doc, err := goquery.NewDocumentFromReader(contentReader)
	if err == nil {
		// Remove tags that provide no value
		doc.Find("script,style,iframe,nav,head").Each(func(i int, s *goquery.Selection) {
			s.Remove()
		})

		// Select text from body
		normalText := ""
		doc.Find("body").Each(func(i int, s *goquery.Selection) {
			// For each item found, get the Title
			normalText += strings.Join(strings.Fields(s.Text()), " ") + " "
		})
		return normalText, nil
	}
	return "", errors.Wrapf(err, "unable to parse html body")
}

type ScrapeClient string

const (
	ClientHTTP   ScrapeClient = "http"
	ClientChrome ScrapeClient = "chrome"
)

type ProxyConfig struct {
	Host     string `yaml:"host"`
	Username string `yaml:"username"`
	Password string `yaml:"password"`
}

type ScrapeConfig struct {
	BrowserDomains string       `yaml:"browser_domains"`
	Workers        int          `yaml:"workers"`
	Proxy          ProxyConfig  `yaml:"proxy"`
	Client         ScrapeClient `yaml:"client"`
	Fallback       bool         `yaml:"fallback"`
	UseCache       bool         `yaml:"use_cache"`
}
