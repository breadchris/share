package main

//import (
//	"fmt"
//	"net/http"
//	"strings"
//
//	"github.com/breadchris/share/deps"
//	. "github.com/breadchris/share/html"
//)
//
//type Zine2 struct {
//	ID      string
//	Cards   map[int]string
//	CurPage int
//}
//
//func NewZine(d deps.Deps) *http.ServeMux {
//	//d.WebsocketRegistry.Register("zine", func(message string, pageId string, isMobile bool) []string {
//	//	zine := Zine2{}
//	//	if err := d.Docs.WithCollection("zine").Get(pageId, &zine); err != nil {
//	//		fmt.Println("Failed to get zine with id:", pageId)
//	//		return []string{}
//	//	}
//	//	var cards []Card
//	//	for pageNum := 1; pageNum <= 8; pageNum++ {
//	//		cardId, exists := zine.Cards[pageNum]
//	//		if !exists {
//	//			fmt.Println("No card for page", pageNum)
//	//			continue
//	//		}
//	//		var card Card
//	//		if err := d.Docs.WithCollection("card").Get(cardId, &card); err != nil {
//	//			fmt.Println("Failed to get card with id:", cardId)
//	//			return []string{}
//	//		}
//	//		cards = append(cards, card)
//	//	}
//	//
//	//	return []string{
//	//		Div(Id("content-container"), zineNavBar(pageId, false), makeZine(pageId, cards, false)).Render(),
//	//	}
//	//})
//	//
//	//d.WebsocketRegistry.Register("card", func(message string, pageId string, isMobile bool) []string {
//	//	zine := Zine2{}
//	//	if err := d.Docs.WithCollection("zine").Get(message, &zine); err != nil {
//	//		fmt.Println("Failed to get zine with id:", message)
//	//		return []string{}
//	//	}
//	//
//	//	// for each card in the zine, get the card data
//	//	for pageNum := 1; pageNum <= 8; pageNum++ {
//	//		if cardId, exists := zine.Cards[pageNum]; exists {
//	//			if cardId == pageId {
//	//				zine.CurPage = pageNum
//	//				if err := d.Docs.WithCollection("zine").Set(message, zine); err != nil {
//	//					fmt.Println("Failed to update zine with id:", message)
//	//					return []string{}
//	//				}
//	//				break
//	//			}
//	//		}
//	//	}
//	//
//	//	card := Card{}
//	//	if err := d.Docs.WithCollection("card").Get(pageId, &card); err != nil {
//	//		fmt.Println("Failed to get card with id: ", pageId)
//	//		return []string{}
//	//	}
//	//	cardConetainer := Div(Id("content-container"), zineNavBar(message, true), Div(Id("card-container"), Class("flex justify-center"), CardEditor(false, card)))
//	//	if isMobile {
//	//		cardConetainer.Attrs["Class"] = "origin-top scale-[3]"
//	//	}
//	//	return []string{
//	//		cardConetainer.Render(),
//	//		editCardForm(pageId, card.Message).Render(),
//	//	}
//	//})
//	//
//	//d.WebsocketRegistry.Register("next", func(message string, zineId string, isMobile bool) []string {
//	//	zine := Zine2{}
//	//	if err := d.Docs.WithCollection("zine").Get(zineId, &zine); err != nil {
//	//		fmt.Println("Failed to get zine with id:", zineId)
//	//		return []string{}
//	//	}
//	//
//	//	if message == "Next Page" {
//	//		zine.CurPage++
//	//		if zine.CurPage > len(zine.Cards) {
//	//			zine.CurPage = 1
//	//		}
//	//	} else if message == "Prev Page" {
//	//		zine.CurPage--
//	//		if zine.CurPage < 1 {
//	//			zine.CurPage = len(zine.Cards)
//	//		}
//	//	}
//	//
//	//	if err := d.Docs.WithCollection("zine").Set(zineId, zine); err != nil {
//	//		fmt.Println("Failed to update zine with id:", zineId)
//	//		return []string{}
//	//	}
//	//
//	//	// Get the new current card
//	//	cardId := zine.Cards[zine.CurPage]
//	//	var card Card
//	//	if err := d.Docs.WithCollection("card").Get(cardId, &card); err != nil {
//	//		fmt.Println("Failed to get card with id:", cardId)
//	//		return []string{}
//	//	}
//	//
//	//	// Render the new card view
//	//	return []string{
//	//		Div(
//	//			Id("card-container"),
//	//			Class("flex justify-center"),
//	//			CardEditor(false, card),
//	//		).Render(),
//	//	}
//	//})
//
//	cardDb := d.Docs.WithCollection("card")
//	zineDb := d.Docs.WithCollection("zine")
//
//	//RegisterCardWebsocketHandlers(d, "card")
//
//	mux := http.NewServeMux()
//	mux.HandleFunc("/{id...}", func(w http.ResponseWriter, r *http.Request) {
//		isMobile := strings.Contains(r.Header.Get("User-Agent"), "Android") || strings.Contains(r.Header.Get("User-Agent"), "iPhone")
//
//		id := r.PathValue("id")
//		if id == "" {
//			id = NewCardId()
//
//			cardIds := make(map[int]string)
//			for pageNum := 1; pageNum <= 8; pageNum++ {
//				cardData := CreateCardData("", fmt.Sprintf("%d", pageNum), "")
//				cardIds[pageNum] = cardData.ID
//
//				// Save the card
//				if err := cardDb.Set(cardData.ID, cardData); err != nil {
//					http.Error(w, "Could not create card", http.StatusInternalServerError)
//					return
//				}
//			}
//
//			zine := Zine2{
//				ID:      id,
//				Cards:   cardIds,
//				CurPage: 1, // Initialize current page
//			}
//
//			if err := zineDb.Set(id, zine); err != nil {
//				http.Error(w, "Could not create zine", http.StatusInternalServerError)
//				return
//			}
//			http.Redirect(w, r, "/zine/"+id, http.StatusSeeOther)
//			return
//		}
//
//		var zine Zine2
//		if err := zineDb.Get(id, &zine); err != nil {
//			http.Error(w, "Could not get zine", http.StatusNotFound)
//			return
//		}
//
//		var cards []Card
//		for pageNum := 1; pageNum <= 8; pageNum++ {
//			cardId, exists := zine.Cards[pageNum]
//			if !exists {
//				http.Error(w, fmt.Sprintf("No card for page %d", pageNum), http.StatusNotFound)
//				return
//			}
//			var card Card
//			if err := cardDb.Get(cardId, &card); err != nil {
//				http.Error(w, "Could not get card", http.StatusNotFound)
//				return
//			}
//			cards = append(cards, card)
//		}
//		body := Div(
//			Div(
//				Class("grid justify-center"),
//				Div(
//					Id("content-container"),
//					zineNavBar(id, false),
//					makeZine(id, cards, isMobile),
//				),
//			),
//		)
//		NewWebsocketPage(body.Children).RenderPage(w, r)
//	})
//
//	mux.HandleFunc("/card/{id...}", func(w http.ResponseWriter, r *http.Request) {
//		isMobile := strings.Contains(r.Header.Get("User-Agent"), "Android") || strings.Contains(r.Header.Get("User-Agent"), "iPhone")
//		id := r.PathValue("id")
//		if id == "" {
//			http.Redirect(w, r, "/zine/", http.StatusSeeOther)
//			return
//		}
//		var card Card
//		if err := cardDb.Get(id, &card); err != nil {
//			http.Error(w, "Could not get card", http.StatusNotFound)
//			return
//		}
//		CardEditor(isMobile, card).RenderPage(w, r)
//	})
//	return mux
//}
//
//func makeZine(id string, cards []Card, isMobile bool) *Node {
//	content := Div(
//		Class("h-[51rem] w-[66rem] grid grid-cols-4"),
//	)
//	for _, card := range cards {
//		page := createCard(isMobile, card)
//		page.Attrs["onclick"] = fmt.Sprintf("document.getElementById('button-%s').click()", card.ID)
//
//		cardButton := Form(
//			Attr("ws-send", "submit"),
//			Input(
//				Type("hidden"),
//				Name("id"),
//				Value(card.ID),
//			),
//			Input(
//				Type("hidden"),
//				Name("card"),
//				Value(id),
//			),
//			Input(
//				Id(fmt.Sprintf("button-%s", card.ID)),
//				Attr("hidden", ""),
//				Type("submit"),
//			),
//		)
//		page.Children = append(page.Children, cardButton)
//		content.Children = append(content.Children, page)
//	}
//	return Div(
//		Id("card-container"),
//		Class("flex justify-center"),
//		content,
//	)
//}
//
//func zineNavBar(id string, hasNextButtons bool) *Node {
//	next := Form(
//		Id("next-button"),
//		Class("rounded-lg shadow-lg bg-blue-500 hover:bg-blue-700 text-white font-bold m-1 py-2 px-4 rounded my-10 mt-4"),
//		Attr("ws-send", "submit"),
//		Input(
//			Type("submit"),
//			Name("next"),
//			Value("Next Page"),
//		),
//	)
//	prev := Form(
//		Id("prev-button"),
//		Class("rounded-lg shadow-lg bg-blue-500 hover:bg-blue-700 text-white font-bold m-1 py-2 px-4 rounded my-10 mt-4"),
//		Attr("ws-send", "submit"),
//		Input(
//			Type("submit"),
//			Name("next"),
//			Value("Prev Page"),
//		),
//	)
//
//	nav := Div(
//		Id("nav-bar"),
//		Class("flex justify-center p-2"),
//		Form(
//			Class("rounded-lg shadow-lg bg-blue-500 hover:bg-blue-700 text-white font-bold m-1 py-2 px-4 rounded my-10 mt-4"),
//			Attr("ws-send", "submit"),
//			Input(
//				Type("hidden"),
//				Name("id"),
//				Value(id),
//			),
//			Input(
//				Type("hidden"),
//				Name("zine"),
//				Attr("readonly", ""),
//			),
//			Input(
//				Id("back-button"),
//				Type("submit"),
//				Value("Back"),
//			),
//		),
//	)
//
//	if hasNextButtons {
//		nav.Children = append(nav.Children, prev, next)
//	}
//	return nav
//}
