package main

import (
	"html/template"
	"image/png"
	"io"
	"net/http"

	qrcode "github.com/skip2/go-qrcode"
)

var t = template.Must(template.ParseFiles("qr.html"))

func handleQR(w http.ResponseWriter, r *http.Request) {
	if r.Method == http.MethodPost {
		r.ParseForm()
		text := r.FormValue("text")
		err := generateQRCode(text, w)
		if err != nil {
			http.Error(w, "Unable to generate QR code", http.StatusInternalServerError)
			return
		}
		w.Header().Set("Content-Type", "image/png")
	} else {
		tmpl.Execute(w, nil)
	}
}

func generateQRCode(text string, w io.Writer) error {
	qr, err := qrcode.New(text, qrcode.Medium)
	if err != nil {
		return err
	}
	return png.Encode(w, qr.Image(256))
}
