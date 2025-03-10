package main

import (
	"encoding/json"
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

type CardDisplay struct {
	Id         string
	Name       string
	ImageURL   string
	QrImageURL string
}
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

	mux.HandleFunc("/sheet", func(w http.ResponseWriter, r *http.Request) {
		getSheetHandler(d, w, r)
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

	d.WebsocketRegistry.Register2("removesection", func(message string, hub *websocket.Hub, msgMap map[string]interface{}) {
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

	d.WebsocketRegistry.Register2("sheet", func(message string, hub *websocket.Hub, msgMap map[string]interface{}) {
		fmt.Println("Sheet WebSocket Endpoint")
		displayCards := []CardDisplay{}
		displayCardDb := d.Docs.WithCollection("display_cards")
		keys := msgMap["1"]
		for _, key := range keys.([]interface{}) {
			var displayCard CardDisplay
			err := displayCardDb.Get(key.(string), &displayCard)
			if err != nil {
				fmt.Println("Error getting display card:", err)
			}
			displayCards = append(displayCards, displayCard)
		}

		sheetFront := Div(Id("sheet-front"), ZinePage())

		for _, displayCard := range displayCards {
			sheetFront.Children = append(sheetFront.Children, Div(
				ZinePanel(),
				Img(
					Attr("style", "max-width: 100%; object-fit: contain;"),
					Attr("src", displayCard.ImageURL),
					Class("")),
			),
			)
		}

		hub.Broadcast <- []byte(sheetFront.Render())
		hub.Broadcast <- []byte(makeQRCodeSheet(displayCards).Render())

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
			renderViewCard(card, d, cardSections),
			navbar(),
		),
		card.Title,
	).RenderPage(w, r)
}

func buildPage(content *Node, title string) *Node {
	// Wrap the content in a responsive flex container that starts at the top and is centered horizontally.
	return ThemedLayout("dark",
		Body(
			Script(
				Src("https://unpkg.com/htmx.org@1.9.12/dist/ext/ws.js"),
			),
			Class("min-h-screen"),
			Div(
				Attr("hx-ext", "ws"),
				Attr("ws-connect", "/websocket/ws"),
				Class("flex flex-col items-center justify-start min-h-screen pt-8"),
				Style(T("touch-action: manipulation;")),
				Div(
					Id("content-container"),
					// Class("w-full max-w-7xl px-4 sm:px-6 lg:px-8"),
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

	themeButton := Label(
		Class("swap flex justify-center fixed top-4"),
		Input(
			Type("checkbox"),
			Class("theme-controller"),
			Attr("value", "light"),
			OnClick("document.documentElement.setAttribute('data-theme', this.checked ? 'light' : 'dark')"),

		),
		Svg(
			Class("swap-off h-10 w-10 fill-current"),
			Attr("xmlns", "http://www.w3.org/2000/svg"),
			Attr("viewBox", "0 0 24 24"),
			Path(
				Attr("d", "M5.64,17l-.71.71a1,1,0,0,0,0,1.41,1,1,0,0,0,1.41,0l.71-.71A1,1,0,0,0,5.64,17ZM5,12a1,1,0,0,0-1-1H3a1,1,0,0,0,0,2H4A1,1,0,0,0,5,12Zm7-7a1,1,0,0,0,1-1V3a1,1,0,0,0-2,0V4A1,1,0,0,0,12,5ZM5.64,7.05a1,1,0,0,0,.7.29,1,1,0,0,0,.71-.29,1,1,0,0,0,0-1.41l-.71-.71A1,1,0,0,0,4.93,6.34Zm12,.29a1,1,0,0,0,.7-.29l.71-.71a1,1,0,1,0-1.41-1.41L17,5.64a1,1,0,0,0,0,1.41A1,1,0,0,0,17.66,7.34ZM21,11H20a1,1,0,0,0,0,2h1a1,1,0,0,0,0-2Zm-9,8a1,1,0,0,0-1,1v1a1,1,0,0,0,2,0V20A1,1,0,0,0,12,19ZM18.36,17A1,1,0,0,0,17,18.36l.71.71a1,1,0,0,0,1.41,0,1,1,0,0,0,0-1.41ZM12,6.5A5.5,5.5,0,1,0,17.5,12,5.51,5.51,0,0,0,12,6.5Zm0,9A3.5,3.5,0,1,1,15.5,12,3.5,3.5,0,0,1,12,15.5Z"),
			),
		),
		Svg(
			Class("swap-on h-10 w-10 fill-current"),
			Attr("xmlns", "http://www.w3.org/2000/svg"),
			Attr("viewBox", "0 0 24 24"),
			Path(
				Attr("d", "M21.64,13a1,1,0,0,0-1.05-.14,8.05,8.05,0,0,1-3.37.73A8.15,8.15,0,0,1,9.08,5.49a8.59,8.59,0,0,1,.25-2A1,1,0,0,0,8,2.36,10.14,10.14,0,1,0,22,14.05,1,1,0,0,0,21.64,13Zm-9.5,6.69A8.14,8.14,0,0,1,7.08,5.22v.27A10.15,10.15,0,0,0,17.22,15.63a9.79,9.79,0,0,0,2.1-.22A8.11,8.11,0,0,1,12.14,19.73Z"),
			),
		),
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
		Class("w-full aspect-[2.5/3.5] border-2 border-solid mt-2 p-2"),
	)

	cardContainer.Children = append(cardContainer.Children, sections.Children...)

	return Div(
		Class("flex flex-col items-center w-screen p-6"),
		cardContainer,
		editButton,
		saveAllButton,
		themeButton,
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
		Class("absolute top-0 right-0"),
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
			Name("removesection"),
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

func getSheetHandler(d deps.Deps, w http.ResponseWriter, r *http.Request) {
	db := d.Docs.WithCollection("cards")
	sectionDb := d.Docs.WithCollection("sections")
	displayCardDb := d.Docs.WithCollection("display_cards")

	cardsDoc, err := db.List()
	if err != nil {
		fmt.Println("Error getting cards:", err)
	}
	allCards := Form(
		Attr("ws-send", "submit"),
		Input(
			Type("hidden"),
			Name("sheet"),
			Value("sheet"),
		),
		Input(
			Class("btn btn-primary btn-circle"),
			Type(("submit")),
			Value("Create Sheet"),
		),
	)

	display := []CardDisplay{}

	for _, c := range cardsDoc {
		card := Card2{}
		json.Unmarshal(c.Data, &card)

		displayCard := CardDisplay{
			QrImageURL: card.QrCodePath,
			Id:         "d" + uuid.NewString(),
		}

		sectionKeys := card.Sections
		for i, sectionId := range sectionKeys {
			section := Section2{}
			err := sectionDb.Get(sectionId, &section)
			if err != nil {
				break
			}

			if section.Data != nil {
				if i == 0 {
					if section.Type == "heading" {
						displayCard.Name = section.Data.(map[string]interface{})["content"].(string)
					}
				} else if i == 1 {
					if section.Type == "image" {
						displayCard.ImageURL = section.Data.(map[string]interface{})["src"].(string)
					}
				}

				if displayCard.Name != "" && displayCard.ImageURL != "" {
					displayCardDb.Set(displayCard.Id, displayCard)

					display = append(display, displayCard)
					allCards.Children = append(allCards.Children, Div(Input(
						Type("checkbox"),
						Name(fmt.Sprintf("%d", i)),
						Value(displayCard.Id),
					),
						Label(
							Attr("for", fmt.Sprintf("%d", i)),
							T(displayCard.Name),
						)))
					break
				}
				if i > 1 {
					break
				}
			}
		}
	}
	buildPage(
		Div(
			allCards,
			Div(Id("sheet-front")),
			Div(Id("sheet-back")),
		),
		"Sheet Maker",
	).RenderPage(w, r)
}

func makeQRCodeSheet(displayCards []CardDisplay) *Node {
	qrSheet := Div(
		Id("sheet-back"),
		ZinePage(),
	)
	panels := []*Node{}
	for i := 4; i < 8; i++ {
		var displayCard CardDisplay
		if i >= len(displayCards) {
			displayCard = CardDisplay{
				QrImageURL: "",
			}
		} else {
			displayCard = displayCards[i]
		}

		panels = append(panels, Div(
			ZinePanel(),
			Img(
				Attr("style", "max-width: 100%; object-fit: contain;"),
				Attr("src", displayCard.QrImageURL),
			),
		))
	}
	for i := 0; i < 4; i++ {
		if i >= len(displayCards) {
			break
		}
		displayCard := displayCards[i]
		panels = append(panels, Div(
			ZinePanel(),
			Img(
				Attr("style", "max-width: 100%; object-fit: contain;"),
				Attr("src", displayCard.QrImageURL),
				Class(""),
			),
		))
	}

	for _, panel := range panels {
		qrSheet.Children = append(qrSheet.Children, panel)
	}

	return qrSheet
}

func ThemedLayout(theme string, n ...*Node) *Node {
	return Html(
		Head(
			Meta(Charset("UTF-8")),
			Meta(Attrs(map[string]string{
				"name":    "viewport",
				"content": "width=device-width, initial-scale=1.0",
			})),
			DaisyUI,
			Script(Src("https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4")),
			//TailwindCSS,
			HTMX,
		),
		Attr("data-theme", theme),
		Body(
			Ch(n),
		),
	)
}
