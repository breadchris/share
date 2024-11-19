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

func NewCard(d deps.Deps, registry *CommandRegistry) *http.ServeMux {
	db := d.Docs.WithCollection("card")

	registry.Register("edit", func(message string, pageId string) []string {
		return []string{
			Div(
				Script(Raw(`
				// log the query string route
				console.log(window.location.pathname);
				`)),
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
			uploadImageForm().Render(),
		}
	})

	registry.Register(("save"), func(message string, pageId string) []string {
		fmt.Printf("%+q", pageId)
		card := Card{}
		if err := db.Get(pageId, &card); err != nil {
			fmt.Println("Failed: ", err)
		}
		card.Message = message
		if err := db.Set(pageId, card); err != nil {
			fmt.Println(err)
		}
		return []string{
			contentSection(message).Render(),
			editCardForm(message).Render(),
			Div(
				Id("upload-image-form"),
			).Render(),
		}
	})

	mux := http.NewServeMux()
	mux.HandleFunc("/{id...}", func(w http.ResponseWriter, r *http.Request) {
		isMobile := strings.Contains(r.Header.Get("User-Agent"), "Android") || strings.Contains(r.Header.Get("User-Agent"), "iPhone")
		id := r.PathValue("id")
		if id == "" {
			id = uuid.NewString()
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
		fmt.Printf("%+q", id)
		if err := db.Get(id, &card); err != nil {
			http.Error(w, "Could not get card", http.StatusNotFound)
			return
		}
		NewWebsocketPage(createCard(isMobile, card).Children).RenderPage(w, r)
	})

	mux.HandleFunc("/upload-image", func(w http.ResponseWriter, r *http.Request) {
		pageId := ""
		if currentURL, ok := r.Header["Hx-Current-Url"]; ok {
			pageId = strings.Split(currentURL[0], "/card/")[1]
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
		doc, err := db.List()
		fmt.Println("db list:", doc)
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
		w.Write([]byte(imageSection(imageSrc, true).Render()))
	})

	return mux
}

func createCard(isMobile bool, card Card) *Node {
	cardStyle := Class("mx-auto my-10 rounded-lg shadow-lg md:w-[250px] md:h-[350px] md:aspect-auto")
	if isMobile {
		cardStyle = Class("mx-auto my-10 w-[90vw] aspect-[5/7] rounded-lg shadow-lg")
	}
	message := card.Message
	imageSrc := card.Image

	return Div(
		Div(
			ReloadNode("websocket.go"),
			cardStyle,
			// Image Section
			imageSection(imageSrc, false),
			// Content Section
			contentSection(message),
		),
		// Edit Button
		editCardForm(message),
	)
}

func imageSection(imageSrc string, isEditing bool) *Node {
	imageForm := Div(
		Id("upload-image-form"),
	)
	if isEditing {
		imageForm = uploadImageForm()
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

func uploadImageForm() *Node {
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

func editCardForm(message string) *Node {
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
				Name("edit"),
				Attr("readonly", ""),
				Value(message),
			),
			Input(
				Id("edit-form-button"),
				Class("mt-4 w-full bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"),
				Attr("hidden", ""),
				Type("submit"),
				Value("Edit Card"),
			),
		))
}
