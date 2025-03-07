package xctf

import (
	"log"
	"net/http"
	"net/http/httputil"
	"net/url"
)

func main() {
	routingMap := map[string]http.Handler{
		"hacker.2025.mcpshsf.com": CreateReverseProxy("http://localhost:9000/"),
	}

	http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		host := r.Host
		if handler, found := routingMap[host]; found {
			handler.ServeHTTP(w, r)
		} else {
			http.NotFoundHandler().ServeHTTP(w, r)
		}
	})

	log.Println("Starting server on HTTP port: 80")
	err := http.ListenAndServe(":80", nil)
	if err != nil {
		log.Fatal(err)
	}
}

func CreateReverseProxy(target string) http.Handler {
	url, err := url.Parse(target)
	if err != nil {
		log.Fatal(err)
	}
	proxy := httputil.NewSingleHostReverseProxy(url)
	proxy.ModifyResponse = func(response *http.Response) error {
		log.Printf("response: %v", response)
		if response.StatusCode == http.StatusUnauthorized {
			log.Printf("401 Unauthorized from downstream service: %s", response.Request.URL)
		}
		return nil
	}
	return proxy
}
