package main

import (
	"bytes"
	"log"
	"net/http"
	"net/http/httputil"
	"net/url"
)

type ResponseCaptureWriter struct {
	http.ResponseWriter
	body       *bytes.Buffer
	statusCode int
}

func (w *ResponseCaptureWriter) WriteHeader(statusCode int) {
	w.statusCode = statusCode
	w.ResponseWriter.WriteHeader(statusCode)
}

func (w *ResponseCaptureWriter) Write(b []byte) (int, error) {
	w.body.Write(b)
	return w.ResponseWriter.Write(b)
}

func lm(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		/*
		   captureWriter := &ResponseCaptureWriter{
		       ResponseWriter: w,
		       body:           new(bytes.Buffer),
		       statusCode:     http.StatusOK,
		   }
		*/

		next.ServeHTTP(w, r)

		/*
		   log.Printf("Host: %s, Method: %s, Path: %s, Status: %d, Response: %s\n",
		       r.Host, r.Method, r.URL.Path, captureWriter.statusCode, captureWriter.body.String())
		*/
	})
}

func main() {
	// Define the routing map
	routingMap := map[string]http.Handler{
		"camp.mcpshsf.com":     http.FileServer(http.Dir(".")),
		"inn.camp.mcpshsf.com": http.FileServer(http.Dir("InnWebsite/root")),
		"police.camp.mcpshsf.com": http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			http.ServeFile(w, r, "PoliceInterview/index.html")
		}),
		"fred.camp.mcpshsf.com": createReverseProxy("http://localhost:9000/"),
	}

	http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		host := r.Host
		if handler, found := routingMap[host]; found {
			lm(handler).ServeHTTP(w, r)
		} else {
			lm(http.NotFoundHandler()).ServeHTTP(w, r)
		}
	})

	// Start the HTTP server
	log.Println("Starting server on HTTP port: 80")
	err := http.ListenAndServe(":80", nil)
	if err != nil {
		log.Fatal(err)
	}
}

func createReverseProxy(target string) http.Handler {
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
