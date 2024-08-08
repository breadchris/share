package main

import (
	"bytes"
	"encoding/base64"
	"fmt"
	"github.com/makiuchi-d/gozxing"
	"github.com/makiuchi-d/gozxing/qrcode"
	"image/png"
	"log"
	"mime/multipart"
	"net/smtp"
	"net/textproto"
)

type SMTPEmail struct {
	a SMTPConfig
}

func NewSMTPEmail(a *AppConfig) *SMTPEmail {
	return &SMTPEmail{a: a.SMTP}
}

func (s *SMTPEmail) SendRecoveryEmail(to, subject, body, code string) error {
	var msg bytes.Buffer
	writer := multipart.NewWriter(&msg)

	msg.WriteString(fmt.Sprintf("From: %s\n", s.a.Username))
	msg.WriteString(fmt.Sprintf("To: %s\n", to))
	msg.WriteString(subject)
	msg.WriteString("MIME-Version: 1.0\n")
	msg.WriteString(fmt.Sprintf("Content-Type: multipart/mixed; boundary=%s\n", writer.Boundary()))
	msg.WriteString("\n")

	// Write the plain text part
	bodyPart, err := writer.CreatePart(textproto.MIMEHeader{
		"Content-Type": {"text/plain; charset=UTF-8"},
	})
	if err != nil {
		return err
	}
	bodyPart.Write([]byte(body))

	attachmentPart, err := writer.CreatePart(textproto.MIMEHeader{
		"Content-Disposition":       {`attachment; filename="qrcode.png"`},
		"Content-Type":              {"image/png"},
		"Content-Transfer-Encoding": {"base64"},
	})
	if err != nil {
		return err
	}

	m, err := qrcode.NewQRCodeWriter().Encode(code, gozxing.BarcodeFormat_QR_CODE, 256, 256, nil)
	if err != nil {
		return err
	}

	var pngBuffer bytes.Buffer
	err = png.Encode(&pngBuffer, m)
	if err != nil {
		log.Fatal(err)
	}

	encodedQRCode := base64.StdEncoding.EncodeToString(pngBuffer.Bytes())
	attachmentPart.Write([]byte(encodedQRCode))

	writer.Close()

	// Connect to the SMTP server
	auth := smtp.PlainAuth("", s.a.Username, s.a.Password, s.a.Port)
	err = smtp.SendMail(s.a.Host+":"+s.a.Port, auth, s.a.Username, []string{to}, msg.Bytes())
	if err != nil {
		log.Fatal(err)
	}

	log.Println("Email sent successfully")
	return nil
}
