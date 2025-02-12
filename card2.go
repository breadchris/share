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

type TextSection struct {
	Content string `json:"content"`
}

// --- Main Router and WebSocket Registration ---

func NewCard2(d deps.Deps) *http.ServeMux {
	mux := http.NewServeMux()
	// Single endpoint for all card interactions.
	mux.HandleFunc("/{id...}", func(w http.ResponseWriter, r *http.Request) {
		getCardHandler(d, w, r)
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

		hub.Broadcast <- []byte(
			Nav(
				Id("edit-nav"),
				Class("flex justify-center space-x-4"),
				Form(
					Attr("ws-send", "submit"),
					Input(
						Type("hidden"),
						Name("id"),
						Value(cardId),
					),
					Button(
						Class("bg-cyan-600 text-white px-4 py-2 rounded-lg"),
						T("Add Text Section"),
						Name("newtextsection"),
					),
				),
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
					Type("submit"),
					Value("View"),
					Class("btn btn-primary btn-circle"),
				)),
			).Render(),
		)

		sections := renderSections(card, true, d)

		hub.Broadcast <- []byte(
			Div(
				Id("card-container"),
				sections).Render(),
		)
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

		hub.Broadcast <- []byte(Div(
			Id("content-container"),
			Div(Id("edit-nav")),
			renderViewCard(card, d),
		).Render())

	})

	d.WebsocketRegistry.Register2("newtextsection", func(message string, hub *websocket.Hub, msgMap map[string]interface{}) {
		fmt.Println("New Text Section WebSocket Endpoint")
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

		sectionDb := d.Docs.WithCollection("sections")
		textSectionId := "s" + uuid.NewString()
		section := Section2{
			Id:   textSectionId,
			Type: "text",
		}
		sectionDb.Set(textSectionId, section)

		card.Sections = append(card.Sections, textSectionId)
		db.Set(cardId, card)

		textEditSection := Div(
			Id("card-container"),
			Attr("hx-swap-oob", "beforeend"),
			createTextEditSectionForm(textSectionId, card, d),
		)

		hub.Broadcast <- []byte(textEditSection.Render())
	})

	d.WebsocketRegistry.Register2("savetextsection", func(message string, hub *websocket.Hub, msgMap map[string]interface{}) {
		fmt.Println("Edit Text Section WebSocket Endpoint")
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

		db := d.Docs.WithCollection("cards")
		var card Card2
		err := db.Get(cardId, &card)
		if err != nil {
			fmt.Println("Card not found:", cardId)
			return
		}

		sectionDb := d.Docs.WithCollection("sections")
		section := Section2{
			Id:   textSectionId,
			Type: "text",
			Data: TextSection{
				Content: message,
			},
		}
		sectionDb.Set(textSectionId, section)
		
		if !slices.Contains(card.Sections, textSectionId) {
			card.Sections = append(card.Sections, textSectionId)
		} 
		db.Set(cardId, card)
	})
	return mux
}


// --- HTTP Handler ---

func getCardHandler(d deps.Deps, w http.ResponseWriter, r *http.Request) {
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
		card = Card2{
			Id:    id,
			Title: "My Custom Card",
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
			Div(Id("edit-nav")),
			renderViewCard(card, d),
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
			Class("min-h-screen bg-white dark:bg-gray-900 text-black dark:text-white"),
			Div(
				Attr("hx-ext", "ws"),
				Attr("ws-connect", "/websocket/ws"),
				Class("flex flex-col items-center justify-start min-h-screen pt-8"),
				Div(
					Id("content-container"),
					Class("w-full max-w-7xl px-4 sm:px-6 lg:px-8"),
					content,
				),
			),
		),
	)
}

func renderViewCard(card Card2, d deps.Deps) *Node {
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

	shareButton := Button(
		Attr("onclick", "document.getElementById('qr-modal').classList.remove('hidden')"),
		Class("mt-4 inline-flex items-center rounded-lg bg-gray-800 px-4 py-2 text-white hover:bg-gray-900"),
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

	sections := renderSections(card, false, d)

	return Div(
		Class("flex flex-col items-center"),
		Div(
			Id("card-container"),
			H1(T(card.Title), Class("text-4xl font-medium tracking-tight text-black dark:text-white")),
			sections,
		),
		editButton,
		shareSection,
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

func createTextEditSectionForm(textSectionId string, card Card2, d deps.Deps) *Node {
	cardId := card.Id
	textContent := "Enter text content..."
	section := getSection(textSectionId, d)
	if section.Data != nil {
		dataMap, ok := section.Data.(map[string]interface{})
		if !ok {
			fmt.Println("Error: section.Data is not a map")
		}
		content, ok := dataMap["content"].(string)
		if !ok {
			fmt.Println("Error: content not found or not a string")
		}
		textContent = content
	}

	return Form(
		Id(textSectionId),
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
		Div(
			Class("mt-4"),
			TextArea(
				Name("savetextsection"),
				Placeholder(textContent),
			),
			Div(
				Input(
					Type("submit"),
					Value("Save"),
				),
			),
		),
	)
}

func createTextViewSection(textSectionId, content string) *Node {
	return Div(
		Id(textSectionId),
		Class("mt-4"),
		T(content),
	)
}


func renderSections(card Card2, editMode bool, d deps.Deps) *Node {
	sectionDb := d.Docs.WithCollection("sections")
	sections := Div()
	for _, sectionId := range card.Sections {
		var section Section2
		err := sectionDb.Get(sectionId, &section)
		if err != nil {
			fmt.Println("Error getting section:", err)
		}
		if section.Type == "text" {
			fmt.Println("Text Section", section.Data)
			// Convert section.Data (which is map[string]interface{}) to TextSection
			dataMap, ok := section.Data.(map[string]interface{})
			if !ok {
				// handle error: unexpected data type
				fmt.Println("Error: section.Data is not a map")
			}
			content, ok := dataMap["content"].(string)
			if !ok {
				fmt.Println("Error: content not found or not a string")
			}
			textSection := TextSection{Content: content}
			if editMode {
				sections.Children = append(sections.Children, createTextEditSectionForm(sectionId, card, d))
			} else {
				sections.Children = append(sections.Children, createTextViewSection(sectionId, textSection.Content))
			}
		}
		
	}

	return sections
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
