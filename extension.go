package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	. "github.com/breadchris/share/html"
	"github.com/go-shiori/dom"
	"github.com/go-shiori/go-readability"
	"go/format"
	"go/printer"
	"go/token"
	"log/slog"
	"net/http"
	"net/url"
	"os"
	"os/exec"
	"strings"
	"sync"
	"time"
)

type ExtensionRequest struct {
	Name    string `json:"name"`
	Element string `json:"element"`
}

var (
	state  State
	stream []string
	smu    sync.Mutex
)

func init() {
	loadState()
}

func loadState() {
	state = State{
		PageInfos: make(map[string]PageInfo),
	}
	b, err := os.ReadFile("data/state.json")
	if err != nil {
		slog.Error("failed to read state", "error", err)
		return
	}

	err = json.Unmarshal(b, &state)
	if err != nil {
		slog.Error("failed to unmarshal state", "error", err)
		return
	}
}

func saveState() {
	b, err := json.Marshal(state)
	if err != nil {
		slog.Error("failed to marshal state", "error", err)
		return
	}

	err = os.WriteFile("data/state.json", b, 0644)
	if err != nil {
		slog.Error("failed to write state", "error", err)
		return
	}
}

func NewExtension() *http.ServeMux {
	m := http.NewServeMux()
	m.HandleFunc("/save", func(w http.ResponseWriter, r *http.Request) {
		if r.Method == http.MethodPost {
			var pageInfo PageInfo
			err := json.NewDecoder(r.Body).Decode(&pageInfo)
			if err != nil {
				http.Error(w, err.Error(), http.StatusBadRequest)
				return
			}
			pageInfo.CreatedAt = time.Now().Unix()

			getArticle := func(pageInfo PageInfo) (*readability.Article, error) {
				r := strings.NewReader(pageInfo.HTML)

				doc, err := dom.Parse(r)
				if err != nil {
					return nil, err
				}

				u, err := url.Parse(pageInfo.URL)
				if err != nil {
					return nil, err
				}

				a, err := readability.FromDocument(doc, u)
				if err != nil {
					return nil, err
				}
				return &a, nil
			}

			println("getting article", pageInfo.URL)
			article, err := getArticle(pageInfo)
			if err != nil {
				slog.Debug("failed to get article", "error", err)
			} else {
				pageInfo.Article = article.TextContent
			}

			prevPageInfo, ok := state.PageInfos[pageInfo.URL]
			if ok {
				pageInfo.HitCount = prevPageInfo.HitCount + 1
			} else {
				pageInfo.HitCount = 1
			}

			state.PageInfos[pageInfo.URL] = pageInfo

			var documents []any
			for _, pageInfo := range state.PageInfos {
				pageInfo.ID = pageInfo.URL
				documents = append(documents, pageInfo)
			}
			//err = pageCol.index(documents)
			//if err != nil {
			//	println(err.Error())
			//}

			smu.Lock()
			stream = append(stream, pageInfo.URL)
			smu.Unlock()

			saveState()

			j, err := json.Marshal(pageInfo)
			if err != nil {
				http.Error(w, err.Error(), http.StatusInternalServerError)
				return
			}

			if err = writeMarkdown(state); err != nil {
				http.Error(w, err.Error(), http.StatusInternalServerError)
				return
			}

			w.Header().Set("Content-Type", "application/json")
			w.Write(j)
		} else {
			http.Error(w, "Invalid request method", http.StatusMethodNotAllowed)
		}
	})

	m.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		if r.Method == "GET" {
			pages := Div()
			for _, pageInfo := range state.PageInfos {
				pages.Children = append(pages.Children, Div(
					Div(
						Attrs(map[string]string{"class": "page"}),
						A(
							Attrs(map[string]string{"href": pageInfo.URL}),
							T(pageInfo.Title),
						),
					),
				))
			}
			DefaultLayout(
				RenderMasonry(state),
			).RenderPage(w, r)
			return
		}
		if r.Method == "POST" {
			var req ExtensionRequest
			if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
				http.Error(w, fmt.Sprintf("Failed to decode request: %v", err), http.StatusBadRequest)
				return
			}

			if req.Element == "" {
				http.Error(w, "Element is required", http.StatusBadRequest)
				return
			}

			n, err := ParseHTMLString(req.Element)
			if err != nil {
				http.Error(w, fmt.Sprintf("Failed to parse element: %v", err), http.StatusInternalServerError)
				return
			}

			var buf bytes.Buffer

			fset := token.NewFileSet()

			// TODO breadchris https://github.com/segmentio/golines
			cfg := &printer.Config{
				Mode:     printer.TabIndent,
				Tabwidth: 4,
			}

			gf := RenderGoFunction(fset, "Render"+strings.Title(req.Name), n.RenderGoCode(fset))
			err = cfg.Fprint(&buf, fset, gf)
			if err != nil {
				http.Error(w, fmt.Sprintf("Failed to format code: %v", err), http.StatusInternalServerError)
				return
			}

			formattedCode, err := format.Source(buf.Bytes())
			if err != nil {
				http.Error(w, fmt.Sprintf("Failed to format code: %v", err), http.StatusInternalServerError)
				w.Write(buf.Bytes())
				return
			}

			f, err := os.OpenFile("scratch.go", os.O_APPEND|os.O_CREATE|os.O_WRONLY, 0644)
			if err != nil {
				http.Error(w, fmt.Sprintf("Failed to open scratch.go: %v", err), http.StatusInternalServerError)
				return
			}

			if _, err = f.Write([]byte("\n" + string(formattedCode))); err != nil {
				http.Error(w, fmt.Sprintf("Failed to write to scratch.go: %v", err), http.StatusInternalServerError)
				return
			}

			if _, err := exec.LookPath("golines"); err != nil {
				println("golines is not installed: go install github.com/segmentio/golines@latest")
				http.Error(w, fmt.Sprintf("golines is not installed: %v", err), http.StatusInternalServerError)
				return
			}

			cmd := exec.Command("golines", "-w", "scratch.go")
			if err := cmd.Run(); err != nil {
				http.Error(w, fmt.Sprintf("Failed to run golines: %v", err), http.StatusInternalServerError)
				return
			}

			w.WriteHeader(http.StatusOK)
		}
	})
	return m
}

func writeMarkdown(state State) error {
	filePath := "/Users/hacked/Documents/GitHub/notes/pages/justshare.md"
	file, err := os.Create(filePath)
	if err != nil {
		return fmt.Errorf("failed to create file: %w", err)
	}
	defer file.Close()

	_, err = file.WriteString("## 🔖 Articles\n")
	if err != nil {
		return fmt.Errorf("failed to write header: %w", err)
	}

	for _, page := range state.PageInfos {
		createdAt := time.Unix(page.CreatedAt, 0).Format("Jan 2nd, 2006")
		siteDomain := extractDomain(page.URL)

		entry := fmt.Sprintf("        - [%s](%s)\n", page.Title, page.URL) +
			"          collapsed:: true\n" +
			fmt.Sprintf("          site:: [%s](%s)\n", siteDomain, page.URL) +
			fmt.Sprintf("          date-saved:: [[%s]]\n", createdAt)
		_, err = file.WriteString(entry)
		if err != nil {
			return fmt.Errorf("failed to write entry for %s: %w", page.ID, err)
		}
	}

	return nil
}

func extractDomain(rawURL string) string {
	parsedURL, err := url.Parse(rawURL)
	if err != nil {
		return "" // return an empty string if URL parsing fails
	}

	domain := strings.TrimPrefix(parsedURL.Host, "www.")
	return domain
}

type PageInfo struct {
	ID        string `json:"id"`
	URL       string `json:"url"`
	Title     string `json:"title"`
	HTML      string `json:"html"`
	CreatedAt int64  `json:"created_at"`
	Article   string `json:"article"`
	HitCount  int    `json:"hit_count"`
}

type State struct {
	PageInfos map[string]PageInfo
}

func shortText(n int, s string) string {
	if n < len(s) {
		return s[:n]
	}
	return s
}

func RenderMasonry(state State) *Node {
	var cards []*Node
	for _, pageInfo := range state.PageInfos {
		card := Div(
			Class("bg-white rounded-lg shadow-md hover:shadow-lg card"),
			Style_("grid-row-end: span 8;"),
			Div(
				Class("flex flex-col"),
				Div(
					Class("w-full aspect-video p-4"),
					P(T(shortText(200, pageInfo.Article))),
				),
				Div(
					Class("text-gray-800 p-2 basis-14"),
					Div(
						Class("flex justify-between"),
						P(Class("text-md font-bold leading-6 "), Text(pageInfo.Title)), // Dynamic Title
						Div(
							Class("flex items-center justify-between text-sm text-gray-500 space-x-1"),
							Div(
								Class("flex gap-1 mt-1"),
								Span(Text(fmt.Sprintf("%d", pageInfo.HitCount))), // Dynamic HitCount
								Svg(
									StrokeWidth("1.5"),
									Stroke("currentColor"),
									Class("w-5 h-5"),
									Xmlns("http://www.w3.org/2000/svg"),
									Fill("none"),
									ViewBox("0 0 24 24"),
									Path(
										StrokeLinecap("round"),
										StrokeLinejoin("round"),
										D("M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"),
									),
								),
							),
						),
					),
				),
			),
		)
		cards = append(cards, card)
	}

	return Div(
		Style(T(`
.board-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, 300px);
  grid-auto-rows: 20px;
  grid-row-gap: 10px;
  grid-column-gap: 16px;
}

.card {
  grid-row-end: span 10;
  margin-bottom: 10px;
}
`)),
		Class("board-grid justify-center mt-6"),
		Ch(cards),
	)
}
