package main

import (
	"fmt"
	"io"
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/breadchris/share/deps"
	. "github.com/breadchris/share/html"
	"github.com/google/uuid"
)

type Card struct {
	ID      string
	Message string
	Image   string
}

func RegisterCardWebsocketHandlers(d deps.Deps, collection string) {
	db := d.Docs.WithCollection(collection)

	d.WebsocketRegistry.Register("edit", func(message string, pageId string) []string {
		fmt.Println("Edit: ", message, pageId)
		return []string{
			Div(
				Id("content"),
				Attr("hx-swap-oob", "innerHTML"),
				Form(
					Id("save-form"),
					Attr("ws-send", "submit"),
					P(
						Class("mt-2"),
						TextArea(
							Class("w-full"),
							Attr("rows", "4"),
							Attr("autofocus", ""),
							Name("save"),
							T(message),
						),
					),
					Input(
						Type("hidden"),
						Name("id"),
						Value(pageId),
					),
					Input(
						Id("save-form-button"),
						Attr("hidden", ""),
						Class("mt-4 w-full bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"),
						Type("submit"),
						Value("Save"),
					),
				)).Render(),
			Div(
				Id("edit-form"),
				Class("mt-4 bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded md:w-[250px] mx-auto my-10"),
				Attr("onclick", "document.getElementById('save-form-button').click()"),
				T("Save"),
			).Render(),
			uploadImageForm(pageId).Render(),
		}
	})

	d.WebsocketRegistry.Register(("save"), func(message string, cardId string) []string {
		card := Card{}
		if err := db.Get(cardId, &card); err != nil {

			fmt.Println(fmt.Sprintf("Failed to get card with id %s: ", cardId), err)
		}
		card.Message = message
		if err := db.Set(cardId, card); err != nil {
			fmt.Println("DB failed to set:", err)
		}
		return []string{
			contentSection(message).Render(),
			editCardForm(cardId, message).Render(),
			Div(
				Id("upload-image-form"),
			).Render(),
		}
	})
}

func NewCard(d deps.Deps) *http.ServeMux {
	db := d.Docs.WithCollection("card")

	RegisterCardWebsocketHandlers(d, "card")

	mux := http.NewServeMux()
	mux.HandleFunc("/{id...}", func(w http.ResponseWriter, r *http.Request) {
		isMobile := strings.Contains(r.Header.Get("User-Agent"), "Android") || strings.Contains(r.Header.Get("User-Agent"), "iPhone")
		id := r.PathValue("id")
		if id == "" {
			id = NewCardId()
			card := Card{
				ID:      id,
				Message: "This is the text on the card!",
				Image:   "/data/cards/images/default.png",
			}
			if err := db.Set(id, card); err != nil {
				http.Error(w, "Could not create card", http.StatusInternalServerError)
				return
			}
			http.Redirect(w, r, "/card/"+id, http.StatusSeeOther)
			return
		}
		var card Card
		if err := db.Get(id, &card); err != nil {
			http.Error(w, "Could not get card", http.StatusNotFound)
			return
		}
		NewWebsocketPage(CardEditor(isMobile, card).Children).RenderPage(w, r)
	})

	mux.HandleFunc("/upload-image", func(w http.ResponseWriter, r *http.Request) {
		pageId := r.FormValue("id")
		if pageId == "" {
			if currentURL, ok := r.Header["Hx-Current-Url"]; ok {
				pageId = strings.Split(currentURL[0], "/card/")[1]
			}
		}

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
		// Generate the updated image HTML
		card := Card{}
		imageSrc := "/data/cards/images/" + fileName

		if err := db.Get(pageId, &card); err != nil {
			fmt.Println("Failed with: ", err)
			http.Error(w, "Could not get card!", http.StatusInternalServerError)
			return
		}
		card.Image = imageSrc
		if err := db.Set(pageId, card); err != nil {
			http.Error(w, "Could not save image", http.StatusInternalServerError)
			return
		} else {
			fmt.Println("Saved image to:", imageSrc)
		}
		// Render the updated image div
		w.Header().Set("Content-Type", "text/html")
		w.Write([]byte(imageSection(imageSrc, true, card.ID).Render()))
	})

	return mux
}
func NewCardId() string {
	return "c" + uuid.NewString()
}
func CreateCardData(id string, message string, image string) Card {
	if id == "" {
		id = NewCardId()
	}
	if message == "" {
		message = "This is the text on the card!"
	}
	if image == "" {
		image = "/data/cards/images/default.png"
	}
	return Card{
		ID:      id,
		Message: message,
		Image:   image,
	}
}

func CardEditor(isMobile bool, card Card) *Node {
	return Div(
		createCard(isMobile, card),
		editCardForm(card.ID, card.Message),
	)
}

func createCard(isMobile bool, card Card) *Node {
	cardStyle := Class("mx-auto my-10 rounded-lg shadow-lg md:w-[250px] md:h-[350px] md:aspect-auto")
	if isMobile {
		cardStyle = Class("mx-auto my-10 w-[90vw] aspect-[5/7] rounded-lg shadow-lg")
	}

	return Div(
		Id(card.ID),
		cardStyle,
		imageSection(card.Image, false, card.ID),
		contentSection(card.Message),
	)
}

func imageSection(imageSrc string, isEditing bool, pageId string) *Node {
	imageForm := Div(
		Id("upload-image-form"),
	)
	if isEditing {
		imageForm = uploadImageForm(pageId)
	}
	return Div(
		Id("card-image"),
		Class("w-full h-[60%] bg-gray-200 rounded-t-lg overflow-hidden relative"),
		Img(
			Class("w-full h-full object-cover"),
			Attr("src", imageSrc),
			Attr("alt", "Card Image"),
		),
		// Upload Image form
		imageForm,
	)
}

func contentSection(message string) *Node {
	return Div(
		Id("content"),
		Class("p-4"),
		P(
			Class("mt-2"),
			T(message),
		),
	)
}

func uploadImageForm(pageId string) *Node {
	return Div(
		Id("upload-image-form"),
		Class("absolute top-2 right-0 m-2"),
		Form(
			Class("text-right"),
			Attr("enctype", "multipart/form-data"),
			Attr("method", "POST"),
			Attr("hx-post", "/card/upload-image"),
			Attr("hx-target", "#card-image"),
			Attr("hx-swap", "outerHTML"),
			Div(
				Class("mt-2"),
				Input(
					Type("hidden"),
					Name("id"),
					Value(pageId),
				),
				Input(
					Class("block w-full border shadow-sm rounded-lg text-sm focus:z-10 focus:border-blue-500 focus:ring-blue-500 disabled:opacity-50 disabled:pointer-events-none file:bg-gray-50 file:border-0 file:me-4 file:py-3 file:px-4"),
					Type("file"),
					Name("image"),
					Attr("accept", "image/*"),
				),
			),
			Input(
				Class("mt-2 bg-green-500 hover:bg-green-700 text-white font-bold rounded"),
				Type("submit"),
				Value("Upload Image"),
			),
		),
	)
}

func editCardForm(id, message string) *Node {
	return Div(
		Id("edit-form"),
		Div(Class("mt-4 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded md:w-[250px] mx-auto my-10"),
			Attr("onclick", "document.getElementById('edit-form-button').click()"),
			T("Edit Card")),
		Form(
			Class("mx-auto my-10 rounded-lg shadow-lg md:w-[250px]"),
			Attr("ws-send", "submit"),
			Input(
				Type("hidden"),
				Name("id"),
				Value(id),
			),
			Input(
				Type("hidden"),
				Name("edit"),
				Attr("readonly", ""),
				Value(message),
			),
			Input(
				Id("edit-form-button"),
				Attr("hidden", ""),
				Type("submit"),
				Value("Edit Card"),
			),
		))
}

type Zine2 struct {
	ID    string
	Cards []string
}

func NewZine(d deps.Deps) *http.ServeMux {

	cardDb := d.Docs.WithCollection("card")
	zineDb := d.Docs.WithCollection("zine")

	RegisterCardWebsocketHandlers(d, "card")

	mux := http.NewServeMux()
	mux.HandleFunc("/{id...}", func(w http.ResponseWriter, r *http.Request) {
		isMobile := strings.Contains(r.Header.Get("User-Agent"), "Android") || strings.Contains(r.Header.Get("User-Agent"), "iPhone")

		id := r.PathValue("id")
		if id == "" {
			id = NewCardId()

			var cardIds []string
			for i := 1; i <= 6; i++ {
				cardData := CreateCardData("", fmt.Sprintf("%d", i), "")
				cardIds = append(cardIds, cardData.ID)

				//save the card
				if err := cardDb.Set(cardData.ID, cardData); err != nil {
					http.Error(w, "Could not create card", http.StatusInternalServerError)
					return
				}
			}

			zine := Zine2{
				ID:    id,
				Cards: cardIds,
			}

			if err := zineDb.Set(id, zine); err != nil {
				http.Error(w, "Could not create zine", http.StatusInternalServerError)
				return
			}
			http.Redirect(w, r, "/zine/"+id, http.StatusSeeOther)
			return
		}

		var zine Zine2
		if err := zineDb.Get(id, &zine); err != nil {
			http.Error(w, "Could not get zine", http.StatusNotFound)
			return
		}

		content := Div(Id("content-container"))
		for _, cardId := range zine.Cards {
			card := Card{}
			if err := cardDb.Get(cardId, &card); err != nil {
				http.Error(w, "Could not get card", http.StatusNotFound)
				return
			}
			page := createCard(isMobile, card)
			page.Attrs["hx-on:click"] = fmt.Sprintf("htmx.ajax('GET', '/zine/card/%s', '#content-container')", card.ID)
			content.Children = append(content.Children, page)
		}
		body := Div(content)
		NewWebsocketPage(body.Children).RenderPage(w, r)
	})

	mux.HandleFunc("/card/{id...}", func(w http.ResponseWriter, r *http.Request) {
		isMobile := strings.Contains(r.Header.Get("User-Agent"), "Android") || strings.Contains(r.Header.Get("User-Agent"), "iPhone")
		id := r.PathValue("id")
		if id == "" {
			http.Redirect(w, r, "/zine/", http.StatusSeeOther)
			return
		}
		var card Card
		if err := cardDb.Get(id, &card); err != nil {
			http.Error(w, "Could not get card", http.StatusNotFound)
			return
		}
		CardEditor(isMobile, card).RenderPage(w, r)
	})
	return mux
}

func zineNavBar(id string) *Node {
	return Div(
		Class("flex justify-between"),
		A(
			Class("text-blue-500 hover:text-blue-700"),
			Attr("href", fmt.Sprintf("/zine/%s", id)),
			T("Back"),
		),
	)
}

func NewWebsocketPage(children []*Node) *Node {
	return Html(
		Head(
			Title(T("Websocket Test")),
			Script(
				Src("https://unpkg.com/htmx.org@1.9.12"),
			),
			Script(
				Src("https://unpkg.com/htmx.org@1.9.12/dist/ext/ws.js"),
			),
			TailwindCSS,
		),
		Body(Div(
			Attr("hx-ext", "ws"),
			Attr("ws-connect", "/websocket/ws"),
			Ch(children),
		)),
	)
}
