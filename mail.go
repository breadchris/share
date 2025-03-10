package main

import (
	"bytes"
	"fmt"
	"github.com/breadchris/share/config"
	"log"
	"mime/multipart"
	"net/smtp"
	"net/textproto"
)

type SMTPEmail struct {
	a config.SMTPConfig
}

func NewSMTPEmail(a *config.AppConfig) *SMTPEmail {
	return &SMTPEmail{a: a.SMTP}
}

func (s *SMTPEmail) SendRecoveryEmail(to, subject, body string) error {
	var msg bytes.Buffer
	writer := multipart.NewWriter(&msg)

	msg.WriteString(fmt.Sprintf("From: %s\n", s.a.Username))
	msg.WriteString(fmt.Sprintf("To: %s\n", to))
	msg.WriteString(fmt.Sprintf("Subject: %s\n", subject))
	msg.WriteString("MIME-version: 1.0\n")
	msg.WriteString(fmt.Sprintf("Content-Type: multipart/mixed; boundary=%s\n", writer.Boundary()))

	bodyPart, err := writer.CreatePart(textproto.MIMEHeader{
		"Content-Type": {"text/html; charset=UTF-8"},
	})
	if err != nil {
		return err
	}
	bodyPart.Write([]byte(body))

	//attachmentPart, err := writer.CreatePart(textproto.MIMEHeader{
	//	"Content-Disposition":       {`attachment; filename="qrcode.png"`},
	//	"Content-Type":              {"image/png"},
	//	"Content-Transfer-Encoding": {"base64"},
	//})
	//if err != nil {
	//	return err
	//}
	//
	//m, err := qrcode.NewQRCodeWriter().Encode(code, gozxing.BarcodeFormat_QR_CODE, 256, 256, nil)
	//if err != nil {
	//	return err
	//}
	//
	//var pngBuffer bytes.Buffer
	//err = png.Encode(&pngBuffer, m)
	//if err != nil {
	//	log.Fatal(err)
	//}
	//
	//encodedQRCode := base64.StdEncoding.EncodeToString(pngBuffer.Bytes())
	//attachmentPart.Write([]byte(encodedQRCode))

	writer.Close()

	// Connect to the SMTP server
	auth := smtp.PlainAuth("", s.a.Username, s.a.Password, s.a.Host)
	err = smtp.SendMail(s.a.Host+":"+s.a.Port, auth, s.a.Username, []string{to}, msg.Bytes())
	if err != nil {
		return err
	}
	log.Println("Email sent successfully")
	return nil
}
