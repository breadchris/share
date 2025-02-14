package main

import (
	"fmt"
	"io"
	"net/http"
	"os"
	"slices"
	"strconv"
	"time"
	"unicode/utf8"

	"github.com/breadchris/share/deps"
	. "github.com/breadchris/share/html"
	"github.com/breadchris/share/websocket"
	"github.com/google/uuid"
)

// --- Data Model Types ---

type Card2 struct {
	Id         string   `json:"id"`
	Title      string   `json:"title"`
	QrCodePath string   `json:"qr_code_path"`
	Sections   []string `json:"sections"`
}

type Section2 struct {
	Id   string      `json:"id"`
	Type string      `json:"type"`
	Data interface{} `json:"content"`
}

// --- Main Router and WebSocket Registration ---

func NewCard2(d deps.Deps) *http.ServeMux {
	cardSections := initSections()

	mux := http.NewServeMux()
	// Single endpoint for all card interactions.
	mux.HandleFunc("/{id...}", func(w http.ResponseWriter, r *http.Request) {
		getCardHandler(d, w, r, cardSections)
	})

	mux.HandleFunc("/upload-image", func(w http.ResponseWriter, r *http.Request) {
		fmt.Println("Upload Image Endpoint")

		sectionId := r.FormValue("sectionId")
		cardId := r.FormValue("cardId")

		err := r.ParseMultipartForm(10 << 20) // Limit upload size to 10MB
		if err != nil {
			http.Error(w, "Could not parse multipart form", http.StatusBadRequest)
			return
		}
		file, handler, err := r.FormFile("image")
		if err != nil {
			http.Error(w, "Could not get uploaded file", http.StatusBadRequest)
			return
		}
		defer file.Close()
		// Create the images directory if it doesn't exist
		os.MkdirAll("data/cards/images/", os.ModePerm)
		// Generate a unique filename
		fileName := fmt.Sprintf("%d-%s", time.Now().UnixNano(), handler.Filename)
		// Create the file
		dst, err := os.Create("data/cards/images/" + fileName)
		if err != nil {
			http.Error(w, "Could not create file", http.StatusInternalServerError)
			return
		}
		defer dst.Close()
		// Copy the uploaded file to the destination file
		_, err = io.Copy(dst, file)
		if err != nil {
			http.Error(w, "Could not save file", http.StatusInternalServerError)
			return
		}
		imageSrc := "/data/cards/images/" + fileName

		section := Section2{}
		sectionDb := d.Docs.WithCollection("sections")

		sectionDb.Get(sectionId, &section)
		section.Data = map[string]interface{}{
			"src": imageSrc,
		}

		err = sectionDb.Set(section.Id, section)
		if err != nil {
			http.Error(w, "Could not save section", http.StatusInternalServerError)
			return
		}

		// Render the updated image div
		w.Header().Set("Content-Type", "text/html")
		w.Write([]byte(Div(
			Class("relative grid grid-cols-3"),
			Form(Input(Type("hidden"))),
			cardSections["image"].ViewFunc(imageSrc, section.Id),
			deleteButton(cardId, section.Id),
		).Render()))
	})

	d.WebsocketRegistry.Register2("edit", func(message string, hub *websocket.Hub, msgMap map[string]interface{}) {
		fmt.Println("Edit WebSocket Endpoint")
		// Get the card ID from the message.
		cardId, ok := msgMap["id"].(string)
		if !ok || cardId == "" {
			fmt.Println("No card id provided")
			return
		}
		db := d.Docs.WithCollection("cards")
		var card Card2
		err := db.Get(cardId, &card)
		if err != nil {
			fmt.Println("Card not found:", cardId)
			return
		}

		navButtons := []*Node{}

		//iterate over cardSections
		for _, val := range cardSections {
			navButtons = append(navButtons, Form(
				Attr("ws-send", "submit"),
				Input(
					Type("hidden"),
					Name("id"),
					Value(cardId),
				),
				Button(
					Class("bg-cyan-600 text-white px-4 py-2 rounded-lg"),
					T("Add "+val.Name),
					Name(val.EndpointName),
				),
			))
		}

		hub.Broadcast <- []byte(
			Nav(
				Id("navbar"),
				Class("flex justify-center space-x-4 mb-4"),
				Ch(navButtons),
			).Render())

		hub.Broadcast <- []byte(
			Form(
				Id("edit-button"),
				Attr("ws-send", "submit"),
				Class("fixed top-4 right-4 rounded-full"),
				Input(
					Type("hidden"),
					Name("id"),
					Value(card.Id),
				),
				Input(
					Type("hidden"),
					Name("view"),
					Value("view"),
				),
				Div(Input(
					Id("edit-button-input"),
					Type("submit"),
					Value("View"),
					Class("btn btn-primary btn-circle"),
				)),
			).Render(),
		)
		hub.Broadcast <- []byte(
			Button(
				Id("save-all-button"),
				OnClick(`
					const updatedSectionsJson = sessionStorage.getItem('updatedSections');
					const updatedSections = JSON.parse(updatedSectionsJson);;
					if (updatedSections) {
						updatedSections.forEach(sectionId => {
							const button = document.getElementById(sectionId+"-button");
							if (button) {
								button.click();
							}
							else {
								console.log("No button found for section:", sectionId);
							}
						});
					}
					sessionStorage.removeItem('updatedSections');
					document.getElementById('edit-button-input').click();
					`),
				T("Save"),
				Class("btn btn-primary btn-circle fixed top-4 right-4 rounded-full"),
			).Render(),
		)

		sections := renderSections(card, true, d, cardSections)
		for _, section := range sections.Children {
			hub.Broadcast <- []byte(section.Render())
		}
	})

	d.WebsocketRegistry.Register2("view", func(message string, hub *websocket.Hub, msgMap map[string]interface{}) {
		fmt.Println("View WebSocket Endpoint")
		cardId, ok := msgMap["id"].(string)
		if !ok || cardId == "" {
			fmt.Println("No card id provided")
			return
		}
		db := d.Docs.WithCollection("cards")
		var card Card2
		err := db.Get(cardId, &card)
		if err != nil {
			fmt.Println("Card not found:", cardId)
			return
		}

		hub.Broadcast <- []byte(navbar().Render())

		cardView := renderViewCard(card, d, cardSections)
		for _, section := range cardView.Children {
			hub.Broadcast <- []byte(section.Render())
		}

	})

	d.WebsocketRegistry.Register2("savesection", func(message string, hub *websocket.Hub, msgMap map[string]interface{}) {
		fmt.Println("Save Text Section WebSocket Endpoint")
		// Get the card ID from the message.
		textSectionId, ok := msgMap["textSectionId"].(string)
		if !ok || textSectionId == "" {
			fmt.Println("No text section id provided")
			return
		}
		cardId := msgMap["cardId"].(string)
		if cardId == "" {
			fmt.Println("No card id provided")
			return
		}
		sectionType := msgMap["sectionType"].(string)
		if sectionType == "" {
			fmt.Println("No section type provided")
			return
		}

		db := d.Docs.WithCollection("cards")
		var card Card2
		err := db.Get(cardId, &card)
		if err != nil {
			fmt.Println("Card not found:", cardId)
			return
		}

		sectionDb := d.Docs.WithCollection("sections")
		section := Section2{}

		if sectionType == "text" {
			section = Section2{
				Id:   textSectionId,
				Type: "text",
				Data: map[string]interface{}{
					"content": message,
				},
			}
		} else if sectionType == "heading" {
			section = Section2{
				Id:   textSectionId,
				Type: "heading",
				Data: map[string]interface{}{
					"content": message,
				},
			}
		} else if sectionType == "image" {
			section = Section2{
				Id:   textSectionId,
				Type: "image",
				Data: map[string]interface{}{
					"src": message,
				},
			}
		}
		sectionDb.Set(textSectionId, section)

		if !slices.Contains(card.Sections, textSectionId) {
			card.Sections = append(card.Sections, textSectionId)
		}
		db.Set(cardId, card)
	})

	d.WebsocketRegistry.Register2("delete", func(message string, hub *websocket.Hub, msgMap map[string]interface{}) {
		fmt.Println("Delete Text Section WebSocket Endpoint")
		textSectionId, ok := msgMap["textSectionId"].(string)
		if !ok || textSectionId == "" {
			fmt.Println("No text section id provided")
			return
		}
		cardId := msgMap["cardId"].(string)
		if cardId == "" {
			fmt.Println("No card id provided")
			return
		}

		db := d.Docs.WithCollection("cards")
		var card Card2
		err := db.Get(cardId, &card)
		if err != nil {
			fmt.Println("Card not found:", cardId)
			return
		}

		sectionDb := d.Docs.WithCollection("sections")

		// Remove the section from the card.
		for i, sectionId := range card.Sections {
			if sectionId == textSectionId {
				card.Sections = append(card.Sections[:i], card.Sections[i+1:]...)
				break
			}
		}
		// Delete the section.
		err = sectionDb.Delete(textSectionId)
		if err != nil {
			fmt.Println("Error deleting section:", err)
		}

		hub.Broadcast <- []byte(Div(
			Attr("hx-swap", "delete"),
			Id(textSectionId),
		).Render())
	})

	for _, val := range cardSections {
		d.WebsocketRegistry.Register2(val.EndpointName, val.EndpointFunc(d))
	}

	return mux
}

// --- HTTP Handler ---

func getCardHandler(d deps.Deps, w http.ResponseWriter, r *http.Request, cardSections map[string]CardSection) {
	// Extract card ID from the URL path.
	id := r.PathValue("id")
	fmt.Println("ID:", id)

	if id == "" {
		fmt.Println("No ID provided.")
		// Create a new card and redirect.
		id = "c" + uuid.NewString()
		fmt.Println("Redirecting to:", fmt.Sprintf("/card/%s", id))
		http.Redirect(w, r, fmt.Sprintf("/card/%s", id), http.StatusSeeOther)
		return
	}

	db := d.Docs.WithCollection("cards")
	var card Card2
	err := db.Get(id, &card)
	if err != nil {
		// If not found, create a new blank card.
		titleSection := Section2{
			Id:   "s" + uuid.NewString(),
			Type: "heading",
			Data: map[string]interface{}{
				"content": "My Custom Card",
			},
		}

		sectionDb := d.Docs.WithCollection("sections")
		sectionDb.Set(titleSection.Id, titleSection)

		card = Card2{
			Id:       id,
			Title:    "Share Card",
			Sections: []string{titleSection.Id},
		}
		// Generate a QR code for sharing.
		qrcodeUrl, err := GenerateQRCode("https://justshare.io/card/" + id)
		if err != nil {
			fmt.Println("Error generating QR code:", err)
		}
		card.QrCodePath = qrcodeUrl
		db.Set(id, card)
	}

	buildPage(
		Div(
			navbar(),
			renderViewCard(card, d, cardSections),
		),
		card.Title,
	).RenderPage(w, r)
}

func buildPage(content *Node, title string) *Node {
	// Wrap the content in a responsive flex container that starts at the top and is centered horizontally.
	return Html(
		Attr("data-theme", "dark"),
		Head(
			Title(T(title)),
			Script(
				Src("https://unpkg.com/htmx.org@1.9.12"),
			),
			Script(
				Src("https://unpkg.com/htmx.org@1.9.12/dist/ext/ws.js"),
			),
			TailwindCSS,
			DaisyUI,
		),
		Body(
			Class("min-h-screen"),
			Div(
				Attr("hx-ext", "ws"),
				Attr("ws-connect", "/websocket/ws"),
				Class("flex flex-col items-center justify-start min-h-screen pt-8"),
				Div(
					Id("content-container"),
					Class("w-full max-w-7xl px-4 sm:px-6 lg:px-8"),
					Ch(content.Children),
				),
			),
		),
	)
}

func renderViewCard(card Card2, d deps.Deps, cardSections map[string]CardSection) *Node {
	editButton := Form(
		Id("edit-button"),
		Attr("ws-send", "submit"),
		Class("fixed top-4 right-4 rounded-full"),
		Input(
			Type("hidden"),
			Name("id"),
			Value(card.Id),
		),
		Input(
			Type("hidden"),
			Name("edit"),
			Value("edit"),
		),
		Div(Input(
			Type("submit"),
			Value("Edit"),
			Class("btn btn-primary btn-circle"),
		)),
	)

	saveAllButton := Button(
		Id("save-all-button"),
	)

	shareButton := Button(
		Attr("onclick", "document.getElementById('qr-modal').classList.remove('hidden')"),
		Class("fixed top-4 left-4 rounded-full btn btn-primary btn-circle"),
		T("Share"),
	)
	shareSection := Div(
		shareButton,
		Div(
			Id("qr-modal"),
			Class("fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center hidden"),
			Div(
				Class("bg-white dark:bg-gray-700 p-6 rounded-lg"),
				Img(Attr("src", card.QrCodePath), Class("w-48 h-48")),
				Button(
					Attr("onclick", "document.getElementById('qr-modal').classList.add('hidden')"),
					Class("mt-4 inline-flex items-center rounded-lg bg-cyan-600 px-4 py-2 text-white hover:bg-cyan-700"),
					T("Close"),
				),
			),
		),
	)

	sections := renderSections(card, false, d, cardSections)

	cardContainer := Div(
		Id("card-container"),
	)

	cardContainer.Children = append(cardContainer.Children, sections.Children...)

	return Div(
		Class("flex flex-col items-center"),
		cardContainer,
		editButton,
		saveAllButton,
		Chl(shareSection.Children...),
	)
}

// --- Helper Functions ---

func GenerateQRCode(data string) (string, error) {
	qrcodeUrl := "https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=" + data
	now := strconv.Itoa(time.Now().Nanosecond())
	imagePath, err := downloadImage(qrcodeUrl, fmt.Sprintf("qrcode%s.png", now))
	if err != nil {
		return "", err
	}
	_, i := utf8.DecodeRuneInString(imagePath)
	imagePath = imagePath[i:]
	return imagePath, nil
}

func downloadImage(imageURL, outputName string) (string, error) {
	imageResp, err := http.Get(imageURL)
	if err != nil {
		return "", err
	}
	defer imageResp.Body.Close()

	outputPath := fmt.Sprintf("./data/images/" + outputName)
	file, err := os.Create(outputPath)
	if err != nil {
		return "", err
	}
	defer file.Close()

	_, err = io.Copy(file, imageResp.Body)
	if err != nil {
		return "", err
	}
	return outputPath, nil
}

func getSection(sectionId string, d deps.Deps) Section2 {
	sectionDb := d.Docs.WithCollection("sections")
	var section Section2
	err := sectionDb.Get(sectionId, &section)
	if err != nil {
		fmt.Println("Error getting section:", err)
	}
	return section
}

func deleteButton(cardId, textSectionId string) *Node {
	return Form(
		// Class("absolute top-0 right-0"),
		Attr("ws-send", "submit"),
		Input(
			Type("hidden"),
			Name("textSectionId"),
			Value(textSectionId),
		),
		Input(
			Type("hidden"),
			Name("cardId"),
			Value(cardId),
		),
		Input(
			Type("hidden"),
			Name("delete"),
			Value("delete"),
		),
		Input(
			Class("rounded-full btn btn-primary btn-circle"),
			Type("submit"),
			Value("×"),
		),
	)
}

func navbar() *Node {
	return Div(
		Id("navbar"),
		Class("flex justify-center space-x-4 mb-4"),
		A(
			Href("/card"),
			Class("bg-cyan-600 text-white px-4 py-2 rounded-lg"),
			T("New Card"),
		),
	)
}

func imageSection2(imageSrc string, id string) *Node {
	return Div(
		Id(id),
		Class("w-full h-[60%] bg-gray-200 rounded-t-lg overflow-hidden relative"),
		Img(
			Class("max-w-full w-full h-full object-cover"),
			Attr("src", imageSrc),
			Attr("alt", "Card Image"),
		),
		Div(
			Id("toggle-image-form"),
		),
	)
}
