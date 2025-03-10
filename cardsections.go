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
			Class("w-full h-full rounded-t-lg overflow-hidden relative"),
			Img(
				Class("w-full h-full object-contain object-top"),
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
			sectionId := "s" + uuid.NewString()
			section := Section2{
				Id:   sectionId,
				Type: "image",
			}
			sectionDb.Set(sectionId, section)

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

			card.Sections = append(card.Sections, sectionId)
			db.Set(cardId, card)

			hub.Broadcast <- websocket.Message{
				Room: cardId,
				Content: []byte(Div(
					Id("card-container"),
					Attr("hx-swap", "innerHTML"),
					Attr("hx-swap-oob", "beforeend"),
					editFunction(cardId, sectionId),
				).Render()),
			}

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

		cardDb := d.Docs.WithCollection("cards")
		var card2 Card2
		err = cardDb.Get(cardId, &card2)
		if err != nil {
			fmt.Println("Error getting card:", err)
		}
		sectionNum := 0
		for i, sectionId := range card2.Sections {
			if sectionId == textSectionId {
				sectionNum = i
				break
			}
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
			Class("relative mt-4 flex justify-center text-[2rem]"),
			Attr("data-id", fmt.Sprintf("%d", sectionNum)),
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
			sectionId := "s" + uuid.NewString()
			section := Section2{
				Id:   sectionId,
				Type: "text",
			}
			sectionDb.Set(sectionId, section)

			card.Sections = append(card.Sections, sectionId)
			db.Set(cardId, card)

			textEditSection := Div(
				Id("card-container"),
				Attr("hx-swap", "innerHTML"),
				Attr("hx-swap-oob", "beforeend"),
				editFunction(sectionId, card, d),
			)

			hub.Broadcast <- websocket.Message{
				Room:    cardId,
				Content: []byte(textEditSection.Render()),
			}
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
			Class("relative text-4xl font-medium tracking-tight"),
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
			sectionId := "s" + uuid.NewString()
			section := Section2{
				Id:   sectionId,
				Type: "heading",
			}
			sectionDb.Set(sectionId, section)

			card.Sections = append(card.Sections, sectionId)
			db.Set(cardId, card)

			headingEditSection := Div(
				Id("card-container"),
				Attr("hx-swap", "innerHTML"),
				Attr("hx-swap-oob", "beforeend"),
				editFunction(sectionId, card, d),
			)

			hub.Broadcast <- websocket.Message{
				Room:    cardId,
				Content: []byte(headingEditSection.Render()),
			}
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
	for i, sectionId := range card.Sections {
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
				sectionNode := textSection.EditFunc.(func(textSectionId string, card Card2, d deps.Deps) *Node)(sectionId, card, d)
				sectionNode.Attrs["data-id"] = fmt.Sprintf("%d", i)

				sections.Children = append(sections.Children, sectionNode)
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

			sectionNode := headingSection.EditFunc.(func(textSectionId string, card Card2, d deps.Deps) *Node)(sectionId, card, d)
			sectionNode.Attrs["data-id"] = fmt.Sprintf("%d", i)
			if editMode {
				sections.Children = append(sections.Children, sectionNode)
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
			sectionNode := imageSection.EditFunc.(func(cardId string, sectionId string) *Node)(card.Id, sectionId)
			sectionNode.Attrs["data-id"] = fmt.Sprintf("%d", i)
			if editMode {
				sections.Children = append(sections.Children, sectionNode)
			} else {
				sections.Children = append(sections.Children, imageSection.ViewFunc(src, sectionId))
			}
		}
	}

	return sections
}
