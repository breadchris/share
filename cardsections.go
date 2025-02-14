package main

import (
	"fmt"

	"github.com/breadchris/share/deps"
	. "github.com/breadchris/share/html"
	"github.com/breadchris/share/websocket"
	"github.com/google/uuid"
)

func initSections() map[string]CardSection {
	return map[string]CardSection{
		"text":    createTextSection(),
		"image":   createImageSection(),
		"heading": createHeadingSection(),
	}
}

type CardSection struct {
	Name         string
	EndpointName string
	ViewFunc     func(string, string) *Node
	EditFunc     interface{}
	EndpointFunc func(d deps.Deps) func(string, *websocket.Hub, map[string]interface{})
}

func createImageSection() CardSection {
	viewFunction := func(imageSrc string, id string) *Node {
		return Div(
			Id(id),
			Class("w-full h-full bg-gray-200 rounded-t-lg overflow-hidden relative"),
			Img(
				Class("max-w-full w-full h-full object-cover"),
				Attr("src", imageSrc),
				Attr("alt", "Card Image"),
			),
		)
	}

	editFunction := func(cardId, sectionId string) *Node {
		return Div(
			Id(sectionId),
			Class("relative grid grid-cols-3"),
			Form(Input(Type("hidden"))),
			Form(
				Class("text-right"),
				Attr("enctype", "multipart/form-data"),
				Attr("method", "POST"),
				Attr("hx-swap", "outerHTML"),
				Attr("hx-post", "/card/upload-image"),
				Attr("hx-target", "#"+sectionId),
				Div(
					Class("mt-2"),
					Input(
						Type("hidden"),
						Name("sectionId"),
						Value(sectionId),
					),
					Input(
						Type("hidden"),
						Name("cardId"),
						Value(cardId),
					),
					Input(
						Class("block w-full border shadow-sm rounded-lg text-sm focus:z-10 focus:border-blue-500 focus:ring-blue-500 disabled:opacity-50 disabled:pointer-events-none file:bg-gray-50 file:border-0 file:me-4 file:py-3 file:px-4"),
						Type("file"),
						Name("image"),
						Attr("accept", "image/*"),
					),
				),
				Input(
					Class("mt-2 bg-green-500 hover:bg-green-700 font-bold rounded"),
					Type("submit"),
					Value("Upload Image"),
				),
			),
			deleteButton(cardId, sectionId),
		)
	}

	endpointFunction := func(d deps.Deps) func(string, *websocket.Hub, map[string]interface{}) {
		return func(message string, hub *websocket.Hub, msgMap map[string]interface{}) {
			fmt.Println("New Image Section WebSocket Endpoint")

			sectionDb := d.Docs.WithCollection("sections")
			imageSectionId := "s" + uuid.NewString()
			section := Section2{
				Id:   imageSectionId,
				Type: "image",
			}
			sectionDb.Set(imageSectionId, section)

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

			card.Sections = append(card.Sections, imageSectionId)
			db.Set(cardId, card)

			hub.Broadcast <- []byte(Div(
				Id("card-container"),
				Attr("hx-swap-oob", "beforeend"),
				editFunction(cardId, imageSectionId),
			).Render())
		}
	}

	type ImageSectionEditFunc func(string, Card2, deps.Deps) *Node

	return CardSection{
		Name:         "Image",
		EndpointName: "newImageSection",
		ViewFunc:     viewFunction,
		EditFunc:     editFunction,
		EndpointFunc: endpointFunction,
	}
}

func createTextSection() CardSection {
	viewFunction := func(content string, id string) *Node {
		return Div(
			Id(id),
			Class("mt-4 flex justify-center text-[2rem]"),
			T(content),
		)
	}

	editFunction := func(textSectionId string, card Card2, d deps.Deps) *Node {
		cardId := card.Id
		textContent := "Enter text content..."

		sectionDb := d.Docs.WithCollection("sections")
		var section Section2
		err := sectionDb.Get(textSectionId, &section)
		if err != nil {
			fmt.Println("Error getting section:", err)
		}

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

		return Div(
			Id(textSectionId),
			Class("relative grid grid-cols-3"),
			Form(
				Class("grid grid-cols-2 "),
				Id(textSectionId+"-form"),
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
					Name("sectionType"),
					Value("text"),
				),
				Input(
					Id(textSectionId+"-input"),
					Type("hidden"),
					Name("savesection"),
					Value(textContent),
				),
				Button(
					Id(textSectionId+"-button"),
					Type("submit"),
				),
			),
			Span(
				Id(textSectionId+"-content"),
				Class("flex justify-center text-[2rem]"),
				T(textContent),
				Attr("contenteditable", "true"),
			),
			deleteButton(cardId, textSectionId),
			Script(Raw(
				fmt.Sprintf(`document.getElementById('%s-content').addEventListener('input', function(e) {
					const content = document.getElementById('%s-content').innerText;
					document.getElementById('%s-input').value = content;
	
					const updatedSectionsJson = sessionStorage.getItem('updatedSections');
					const updatedSections = JSON.parse(updatedSectionsJson);
					if (updatedSections) {
						updatedSections.push('%s');
						sessionStorage.setItem('updatedSections', JSON.stringify(updatedSections));
					} else {
						sessionStorage.setItem('updatedSections', JSON.stringify(['%s']));
					}
				});`, textSectionId, textSectionId, textSectionId, textSectionId, textSectionId))),
		)
	}

	endpointFunction := func(d deps.Deps) func(string, *websocket.Hub, map[string]interface{}) {
		return func(message string, hub *websocket.Hub, msgMap map[string]interface{}) {
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
				editFunction(textSectionId, card, d),
			)

			hub.Broadcast <- []byte(textEditSection.Render())
		}
	}

	return CardSection{
		Name:         "Text",
		EndpointName: "addTextSection",
		ViewFunc:     viewFunction,
		EditFunc:     editFunction,
		EndpointFunc: endpointFunction,
	}
}

func createHeadingSection() CardSection {
	viewFunction := func(content string, id string) *Node {
		return Div(
			Id(id),
			Class("text-4xl font-medium tracking-tight"),
			H1(Class("flex justify-center"), T(content)),
		)
	}

	editFunction := func(textSectionId string, card Card2, d deps.Deps) *Node {
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

		return Div(
			Id(textSectionId),
			Class("relative grid grid-cols-3"),
			Form(
				Id(textSectionId+"-form"),
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
					Name("sectionType"),
					Value("heading"),
				),
				Input(
					Id(textSectionId+"-input"),
					Type("hidden"),
					Name("savesection"),
					Value(textContent),
				),
				Button(
					Id(textSectionId+"-button"),
					Type("submit"),
				),
			),
			H1(
				Class("text-4xl font-medium tracking-tight flex justify-center"),
				Id(textSectionId+"-content"),
				T(textContent),
				Attr("contenteditable", "true"),
			),
			deleteButton(cardId, textSectionId),
			Script(Raw(
				fmt.Sprintf(`document.getElementById('%s-content').addEventListener('input', function(e) {
				const content = document.getElementById('%s-content').innerText;
				document.getElementById('%s-input').value = content;

				const updatedSectionsJson = sessionStorage.getItem('updatedSections');
				const updatedSections = JSON.parse(updatedSectionsJson);
				if (updatedSections) {
					updatedSections.push('%s');
					sessionStorage.setItem('updatedSections', JSON.stringify(updatedSections));
				} else {
					sessionStorage.setItem('updatedSections', JSON.stringify(['%s']));
				}
			});`, textSectionId, textSectionId, textSectionId, textSectionId, textSectionId))),
		)
	}

	endpointFunction := func(d deps.Deps) func(string, *websocket.Hub, map[string]interface{}) {
		return func(message string, hub *websocket.Hub, msgMap map[string]interface{}) {
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
				Type: "heading",
			}
			sectionDb.Set(textSectionId, section)

			card.Sections = append(card.Sections, textSectionId)
			db.Set(cardId, card)

			headingEditSection := Div(
				Id("card-container"),
				Attr("hx-swap-oob", "beforeend"),
				editFunction(textSectionId, card, d),
			)

			hub.Broadcast <- []byte(headingEditSection.Render())
		}
	}

	return CardSection{
		Name:         "Heading",
		EndpointName: "newHeadingSection",
		ViewFunc:     viewFunction,
		EditFunc:     editFunction,
		EndpointFunc: endpointFunction,
	}
}

func renderSections(card Card2, editMode bool, d deps.Deps, cardSections map[string]CardSection) *Node {
	sectionDb := d.Docs.WithCollection("sections")
	sections := Div()
	for _, sectionId := range card.Sections {
		var section Section2
		err := sectionDb.Get(sectionId, &section)
		if err != nil {
			fmt.Println("Error getting section:", err)
		}

		if section.Type == "text" {
			//TODO: use a type switch to convert raw json data to the correct type
			dataMap, ok := section.Data.(map[string]interface{})
			if !ok {
				// handle error: unexpected data type
				fmt.Println("Error: section.Data is not a map")
			}
			content, ok := dataMap["content"].(string)
			if !ok {
				fmt.Println("Error: content not found or not a string")
			}

			textSection := cardSections["text"]

			if editMode {
				sections.Children = append(sections.Children, textSection.EditFunc.(func(textSectionId string, card Card2, d deps.Deps) *Node)(sectionId, card, d))
			} else {
				sections.Children = append(sections.Children, textSection.ViewFunc(content, sectionId))
			}
		} else if section.Type == "heading" {
			//TODO: use a type switch to convert raw json data to the correct type
			dataMap, ok := section.Data.(map[string]interface{})
			if !ok {
				// handle error: unexpected data type
				fmt.Println("Error: section.Data is not a map")
			}
			content, ok := dataMap["content"].(string)
			if !ok {
				fmt.Println("Error: content not found or not a string")
			}

			headingSection := cardSections["heading"]

			if editMode {
				sections.Children = append(sections.Children, headingSection.EditFunc.(func(textSectionId string, card Card2, d deps.Deps) *Node)(sectionId, card, d))
			} else {
				sections.Children = append(sections.Children, headingSection.ViewFunc(content, sectionId))
			}
		} else if section.Type == "image" {
			dataMap, ok := section.Data.(map[string]interface{})
			if !ok {
				// handle error: unexpected data type
				fmt.Println("Error: section.Data is not a map")
			}
			src, ok := dataMap["src"].(string)
			if !ok {
				fmt.Println("Error: src not found or not a string")
			}

			imageSection := cardSections["image"]

			if editMode {
				sections.Children = append(sections.Children, imageSection.EditFunc.(func(cardId string, sectionId string) *Node)(card.Id, sectionId))
			} else {
				sections.Children = append(sections.Children, imageSection.ViewFunc(src, sectionId))
			}
		}
	}

	return sections
}
