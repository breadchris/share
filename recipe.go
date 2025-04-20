package main

import (
	"bytes"
	"context"
	"encoding/json"
	"encoding/xml"
	"errors"
	"fmt"
	"github.com/breadchris/share/deps"
	. "github.com/breadchris/share/html"
	"github.com/breadchris/share/models"
	"github.com/kkdai/youtube/v2"
	"github.com/sashabaranov/go-openai"
	"github.com/sashabaranov/go-openai/jsonschema"
	"golang.org/x/net/html"
	"gorm.io/datatypes"
	"gorm.io/gorm"
	"io"
	"net/http"
	"net/url"
	"os"
	"strconv"
	"strings"
	"time"
)

const (
	recipeIndex  = "data/recipe.bleve"
	smittenIndex = "data/smitten.bleve"
)

type Direction struct {
	Text      string `json:"text" description:"The direction text."`
	StartTime int    `json:"start_time" description:"The time in seconds when direction starts in the transcript."`
	EndTime   int    `json:"end_time" description:"The time in seconds when direction ends in the transcript."`
}

type Ingredient struct {
	Name    string `json:"name" description:"The name of the ingredient."`
	Amount  string `json:"amount" description:"The amount of the ingredient."`
	Unit    string `json:"unit" description:"The unit of the ingredient."`
	Comment string `json:"comment" description:"The comment of the ingredient."`
}

type Recipe struct {
	ID          string       `json:"id"`
	Name        string       `json:"name"`
	Ingredients []Ingredient `json:"ingredients"`
	Directions  []Direction  `json:"directions"`
	Equipment   []string     `json:"equipment" description:"The equipment used while making the recipe."`
}

type RecipeState struct {
	Recipe     Recipe                  `json:"recipe"`
	Transcript youtube.VideoTranscript `json:"transcript"`
}

type Playlist struct {
	ID     string   `json:"id"`
	Name   string   `json:"name"`
	Videos []string `json:"videos"`
}

type Channel struct {
	ID        string     `json:"id"`
	Name      string     `json:"name"`
	Playlists []Playlist `json:"playlists"`
}

func transcriptToRecipe(ctx context.Context, d deps.Deps, ts youtube.VideoTranscript) (Recipe, error) {
	var rec Recipe

	var prompt string
	for _, t := range ts {
		prompt += fmt.Sprintf("[%d - %d] %s\n", t.StartMs/1000, (t.StartMs+t.Duration)/1000, t.Text)
	}

	schema, err := jsonschema.GenerateSchemaForType(rec)
	if err != nil {
		return rec, err
	}

	resp, err := d.AI.CreateChatCompletion(ctx, openai.ChatCompletionRequest{
		Model: openai.GPT4o20240513,
		Messages: []openai.ChatCompletionMessage{
			{
				Role:    openai.ChatMessageRoleSystem,
				Content: transcriptPrompt,
			},
			{
				Role:    openai.ChatMessageRoleUser,
				Content: prompt,
			},
		},
		Tools: []openai.Tool{
			{
				Type: "function",
				Function: &openai.FunctionDefinition{
					Name:        "createRecipe",
					Description: "",
					Parameters:  schema,
				},
			},
		},
	})
	if err != nil {
		return rec, err
	}

	for _, tc := range resp.Choices[0].Message.ToolCalls {
		if ok := tc.Function.Name == "createRecipe"; ok {
			println("found function")
			err = json.Unmarshal([]byte(tc.Function.Arguments), &rec)
			if err != nil {
				return rec, err
			}
			return rec, nil
		}
	}
	println(resp.Choices[0].Message.Content)
	return rec, errors.New("failed to generate recipe")
}

type Nutrients struct {
	Protein float64 `json:"protein"`
	Fat     float64 `json:"fat"`
	Carbs   float64 `json:"carbs"`
}

func CreateProxyFunction(proxyURL, username, password string) (func(*http.Request) (*url.URL, error), error) {
	parsedURL, err := url.Parse(proxyURL)
	if err != nil {
		return nil, errors.New("invalid proxy URL")
	}
	parsedURL.User = url.UserPassword(username, password)

	proxyFunc := func(req *http.Request) (*url.URL, error) {
		return parsedURL, nil
	}
	return proxyFunc, nil
}

func NewRecipe(d deps.Deps) *http.ServeMux {
	recipes := d.Docs.WithCollection("recipes")
	m := http.NewServeMux()
	ctx := context.WithValue(context.Background(), "baseURL", "/recipe")

	routes := struct {
		Recipe   string
		Playlist string
		Food     string
	}{
		Recipe:   "/",
		Playlist: "/playlist/",
		Food:     "/food/",
	}

	type RecipeStateUpload struct {
		States []RecipeState `json:"states"`
	}

	proxyFunc, err := CreateProxyFunction(d.Config.Proxy.URL, d.Config.Proxy.Username, d.Config.Proxy.Password)
	if err != nil {
		panic(err)
	}

	httpTransport := &http.Transport{
		Proxy:                 proxyFunc,
		IdleConnTimeout:       60 * time.Second,
		TLSHandshakeTimeout:   10 * time.Second,
		ExpectContinueTimeout: 1 * time.Second,
		ForceAttemptHTTP2:     true,
	}

	client := youtube.Client{
		HTTPClient: &http.Client{
			Transport: httpTransport,
		},
	}

	usdaFoodToNutrients := func(item models.Food) (Nutrients, error) {
		var food SRLegacyFood
		if err := json.Unmarshal(item.Raw, &food); err != nil {
			return Nutrients{}, err
		}
		var n Nutrients
		for _, ntr := range food.FoodNutrients {
			switch ntr.Nutrient.ID {
			case 1003:
				n.Protein = ntr.Amount
			case 1004:
				n.Fat = ntr.Amount
			case 1005:
				n.Carbs = ntr.Amount
			}
		}
		return n, nil
	}

	m.HandleFunc("/upload", func(w http.ResponseWriter, r *http.Request) {
		switch r.Method {
		case http.MethodGet:
			DefaultLayout(
				Div(
					A(HxPost("/upload"), Class("btn"), T("Upload")),
				),
			).RenderPageCtx(ctx, w, r)
		case http.MethodPost:
			docs, err := recipes.List()
			if err != nil {
				http.Error(w, err.Error(), http.StatusInternalServerError)
				return
			}

			var rs RecipeStateUpload
			for _, doc := range docs {
				var r RecipeState
				if err := json.Unmarshal(doc.Data, &r); err != nil {
					continue
				}
				rs.States = append(rs.States, r)
			}

			var body []byte
			if body, err = json.Marshal(rs); err != nil {
				http.Error(w, err.Error(), http.StatusInternalServerError)
				return
			}

			req := &http.Request{
				Method: http.MethodPut,
				URL: &url.URL{
					Scheme: "https",
					Host:   "justshare.io",
					Path:   "/recipe/upload",
				},
				Body: io.NopCloser(bytes.NewReader(body)),
			}

			println("uploading")
			rsp, err := http.DefaultClient.Do(req)
			if err != nil {
				http.Error(w, err.Error(), http.StatusInternalServerError)
				return
			}

			io.Copy(w, rsp.Body)
		case http.MethodPut:
			var rsu RecipeStateUpload

			println("handling upload")
			if err := json.NewDecoder(r.Body).Decode(&rsu); err != nil {
				http.Error(w, err.Error(), http.StatusBadRequest)
				return
			}

			for _, rs := range rsu.States {
				if err := recipes.Set(rs.Recipe.ID, rs); err != nil {
					println("failed to set", rs.Recipe.ID, err.Error())
				}
			}
		}
	})

	m.HandleFunc(routes.Playlist, func(w http.ResponseWriter, r *http.Request) {
		switch r.Method {
		case http.MethodPost:
			ur := r.FormValue("url")
			if ur == "" {
				http.Error(w, "missing url", http.StatusBadRequest)
				return
			}

			playlist, err := client.GetPlaylistContext(ctx, ur)
			if err != nil {
				http.Error(w, err.Error(), http.StatusInternalServerError)
				return
			}

			var pl []*Node
			for _, v := range playlist.Videos {
				pl = append(pl, Div(
					Class("flex items-center space-x-4"),
					Img(Class("w-16 h-16"), Src(v.Thumbnails[0].URL)),
					A(Class("flex-1"), Href(fmt.Sprintf("/%s", v.ID)), T(v.Title)),
				))
			}
			Div(Class("space-y-4"), Ch(pl)).RenderPageCtx(ctx, w, r)
		case http.MethodGet:
			DefaultLayout(
				Form(
					Class("container mx-auto p-8"),
					Input(Class("input"), Type("text"), Name("url"), Placeholder("Playlist URL")),
					Button(Class("btn"), T("Submit"), HxPost(routes.Playlist), HxTarget("#results")),
					Div(Id("results")),
				),
			).RenderPageCtx(ctx, w, r)
		}
	})
	m.HandleFunc("/food/{id...}", func(w http.ResponseWriter, r *http.Request) {
		id := r.PathValue("id")

		q := r.URL.Query()
		s := q.Get("search")
		// TODO breadchris lol wat
		searching := q.Get("searching") == "yes"
		b := q.Get("branded") == "on" || q.Get("branded") == "true"
		l := q.Get("legacy") == "on" || q.Get("legacy") == "true"
		off := q.Get("offset")
		if off == "" {
			off = "0"
		}
		offs, err := strconv.Atoi(off)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		renderResults := func(f []models.Food, offset int) *Node {
			var foodItems []*Node
			for _, item := range f {
				n, err := usdaFoodToNutrients(item)
				if err != nil {
					// TODO breadchris how do you report an error here?
					// maybe you return the error and then check if it's nil in the parent function?
					return Div(Class("text-red-500"), T(err.Error()))
				}
				foodItems = append(foodItems, A(
					Class("flex items"),
					Href(fmt.Sprintf("/food/%d", item.FDCID)),
					Div(Class("flex-1"), T(fmt.Sprintf("%f | %f | %f", n.Protein, n.Fat, n.Carbs))),
					Div(Class("flex-1"), T(item.Description)),
				))
			}
			return Div(
				Class("items-center"),
				Div(
					Class("flex flex-row space-x-4"),
					// TODO breadchris lol wat
					Div(T(strconv.Itoa(offset))),
					Div(Class("btn"), T("prev"), HxTarget("#results"), HxGet(fmt.Sprintf("/food/?searching=yes&search=%s&branded=%t&legacy=%t&offset=%d", s, b, l, offset-20))),
					Div(Class("btn"), T("next"), HxTarget("#results"), HxGet(fmt.Sprintf("/food/?searching=yes&search=%s&branded=%t&legacy=%t&offset=%d", s, b, l, offset+20))),
				),
				Ch(foodItems),
			)
		}

		renderAliases := func(aliases []models.FoodName) *Node {
			var aliasItems []*Node
			for _, alias := range aliases {
				aliasItems = append(aliasItems, Div(Class("p-2 bg-gray-500 text-white"), T(alias.Name)))
			}
			return Div(Class("flex flex-col"), Ch(aliasItems))
		}

		switch r.Method {
		case http.MethodPut:
			a := r.FormValue("alias")
			if a == "" {
				http.Error(w, "missing alias", http.StatusBadRequest)
				return
			}

			var f models.Food
			res := d.DB.First(&f, id)
			if res.Error != nil {
				http.Error(w, res.Error.Error(), http.StatusInternalServerError)
				return
			}

			var aliases []models.FoodName
			res = d.DB.Find(&aliases).Where("fdc_id = ?", f.FDCID)
			if res.Error != nil {
				http.Error(w, res.Error.Error(), http.StatusInternalServerError)
				return
			}

			aliases = append(aliases, models.FoodName{
				FDCID: f.FDCID,
				Name:  a,
			})

			res = d.DB.Save(aliases)
			if res.Error != nil {
				http.Error(w, res.Error.Error(), http.StatusInternalServerError)
				return
			}
		case http.MethodGet:
			if id != "" {
				var f models.Food
				res := d.DB.First(&f, id)
				if res.Error != nil {
					http.Error(w, res.Error.Error(), http.StatusInternalServerError)
					return
				}

				var aliases []models.FoodName
				res = d.DB.Where("fdc_id = ?", f.FDCID).Find(&aliases)
				if res.Error != nil {
					http.Error(w, res.Error.Error(), http.StatusInternalServerError)
					return
				}

				var fdc SRLegacyFood
				if err := json.Unmarshal(f.Raw, &fdc); err != nil {
					http.Error(w, err.Error(), http.StatusInternalServerError)
					return
				}

				DefaultLayout(
					Div(
						Class("container mx-auto p-8"),
						H1(Class("text-2xl font-semibold"), T(f.Description)),
						Form(
							Input(Type("text"), Placeholder("alias"), Name("alias")),
							Button(Class("btn"), T("Add Alias"), HxPut(Fmt("/food/%d", f.FDCID)), HxTarget("#aliases")),
							Div(Class("flex flex-col"),
								Id("aliases"),
								renderAliases(aliases),
							),
						),
						Div(Class("bg-gray-100"),
							Div(Id("json-viewer"), Attr("data-value", string(f.Raw))),
						),
						//Div(
						//	Class("grid grid-cols-3 gap-4"),
						//),
						Script(Attr("src", "/static/recipe.js")),
					),
				).RenderPageCtx(ctx, w, r)
				return
			}

			var f []models.Food
			res := d.DB.
				Where("description LIKE ?", "%"+s+"%")
			if b && !l {
				res = res.Where(datatypes.JSONQuery("raw").Equals("Branded", "foodClass"))
			}
			if l && !b {
				res = res.Where(datatypes.JSONQuery("raw").Equals("FinalFood", "foodClass"))
			}
			if b && l {
				res = res.Where(
					d.DB.Where(
						datatypes.JSONQuery("raw").Equals("Branded", "foodClass")).
						Or(datatypes.JSONQuery("raw").Equals("FinalFood", "foodClass")),
				)
			}

			limit := 20
			res = res.Order("description ASC").
				Limit(limit).Offset(offs).Find(&f)
			if res.Error != nil {
				http.Error(w, res.Error.Error(), http.StatusInternalServerError)
				return
			}

			if searching {
				renderResults(f, offs).RenderPageCtx(ctx, w, r)
				return
			}

			DefaultLayout(
				Div(
					Class("container mx-auto p-8 flex flex-col"),
					H1(Class("text-2xl font-semibold"), T("Food Search")),
					Form(
						Class("flex flex-row space-x-3"),
						HxGet("/food/"),
						HxTarget("#results"),
						Id("search-form"),
						Input(Type("hidden"), Name("searching"), Value("yes")),
						Input(
							Class("input"),
							Type("text"),
							Name("search"),
							Placeholder("Search"),
							HxTrigger("search-form, keyup delay:200ms changed"),
						),
						Div(
							Class("form-control"),
							Label(
								Class("label cursor-pointer"),
								Span(Class("label-text"), Text("branded")),
								Input(Type("checkbox"), Name("branded"), Checked(true), Class("checkbox checkbox-primary")),
							),
						),
						Div(
							Class("form-control"),
							Label(
								Class("label cursor-pointer"),
								Span(Class("label-text"), Text("legacy")),
								Input(Type("checkbox"), Name("legacy"), Checked(true), Class("checkbox checkbox-primary")),
							),
						),
					),
					Div(
						Id("results"),
						T("protein | fat | carbs"),
						renderResults(f, 0),
					),
				),
			).RenderPageCtx(ctx, w, r)
		}
	})
	m.HandleFunc("/source/{id}/recipe/{rid...}", func(w http.ResponseWriter, r *http.Request) {
		id := r.PathValue("id")
		rid := r.PathValue("rid")

		renderSource := func(w http.ResponseWriter, r *http.Request, page *Node) {
			ctx := context.WithValue(r.Context(), "baseURL", "/recipe/source/"+id+"/recipe/"+rid)
			page.RenderPageCtx(ctx, w, r)
		}

		var re models.Recipe
		res := d.DB.Preload("Ingredients").Preload("Equipment").Preload("Directions").Where("id = ?", rid).First(&re)
		if res.Error != nil {
			http.Error(w, res.Error.Error(), http.StatusInternalServerError)
			return
		}

		renderRecipe := func(rs models.Recipe) *Node {
			var equipment []*Node
			for _, e := range rs.Equipment {
				equipment = append(equipment, Div(Class("p-2 bg-gray-500 text-white"), T(e.Name)))
			}

			var (
				ingredients []*Node
				protein     float64
				fat         float64
				carbs       float64
			)
			for _, i := range rs.Ingredients {
				var food []models.FoodName
				if err := d.DB.Preload("Food").Where("name = ?", strings.ToLower(i.Name)).Find(&food).Error; err != nil {
					http.Error(w, err.Error(), http.StatusInternalServerError)
					return nil
				}
				var foodItems []*Node
				for _, f := range food {
					foodItems = append(foodItems, Div(Class("p-2 bg-gray-500 text-white"), T(f.Name)))
				}

				var nuts *Node

				a, err := strconv.Atoi(i.Amount)
				if err == nil {
					var grams float64
					switch i.Unit {
					case "pound":
						grams = float64(a) * 453.592
					}

					if len(food) > 0 {
						n, err := usdaFoodToNutrients(*food[0].Food)
						if err != nil {
							http.Error(w, err.Error(), http.StatusInternalServerError)
							return nil
						}
						pg := grams * (n.Protein / 100)
						fg := grams * (n.Fat / 100)
						cg := grams * (n.Carbs / 100)

						protein += pg
						fat += fg
						carbs += cg

						nuts = Div(
							Class("flex flex-row space-x-2 text-gray-500"),
							Div(T(Fmt("%.2fg protein", pg))),
							Div(T(Fmt("%.2fg fat", fg))),
							Div(T(Fmt("%.2fg carbs", cg))),
						)
					}
				}

				ingredients = append(ingredients, Div(
					Class("flex flex-col"),
					Div(T(fmt.Sprintf("%s %s %s %s", i.Amount, i.Unit, i.Name, i.Comment))),
					//Span(Class("text-gray-500"), T(i.Name)),
					nuts,
					//Ch(foodItems),
				))
			}

			var directions []*Node
			for _, d := range rs.Directions {
				directions = append(directions, Div(
					Class("py-2 flex"),
					OnClick("seekToTime("+strconv.Itoa(d.StartTime)+")"),
					Div(
						Class("flex flex-row space-x-2"),
						Div(
							RenderPlay(),
						),
						Div(
							T(fmt.Sprintf("%s", d.Text)),
						),
					),
				))
			}

			servings := 4.0

			id := rs.ID
			return Div(
				Class("md:w-1/2 mx-auto p-8 space-y-4"),
				ytScript(id),
				P(Class("text-4xl font-semibold mb-4"), T(rs.Name)),
				Div(
					P(Class("text-2xl font-semibold mb-4"), T("Ingredients")),
					Ul(Class("space-y-4"), Ch(ingredients)),
				),
				Div(
					Class("flex flex-row space-x-2 text-gray-500"),
					Div(T(Fmt("servings: %.1f", servings))),
				),
				Div(
					Class("flex flex-row space-x-2 text-gray-500"),
					Div(T(Fmt("per serving: "))),
					Div(T(Fmt("%.2fg protein", protein/servings))),
					Div(T(Fmt("%.2fg fat", fat/servings))),
					Div(T(Fmt("%.2fg carbs", carbs/servings))),
				),
				Div(Class("divider")),
				Div(
					Class(""),
					P(Class("text-2xl font-semibold mb-4"), T("Equipment")),
					Div(Class("grid grid-cols-4 gap-4 text-center my-4"), Ch(equipment)),
				),
				Div(Class("divider")),
				//Div(Id("player"), Class("w-full")),
				Div(
					P(Class("text-2xl font-semibold mb-4"), T("Directions")),
					Div(Class(""), Ch(directions)),
				),
				//Div(Class("space-x-2"),
				//	A(Class("btn"), HxTarget("body"), HxPut(fmt.Sprintf("/%s", id)), T("Regenerate")),
				//	A(Class("btn"), HxTarget("body"), HxDelete(fmt.Sprintf("/%s", id)), T("Delete")),
				//),
				//Ch(items),
			)
		}
		renderSource(w, r, DefaultLayout(renderRecipe(re)))
	})
	m.HandleFunc("/source/{id...}", func(w http.ResponseWriter, r *http.Request) {
		id := r.PathValue("id")
		if id == "" {
			id = "smittenkitchen.com"
		}

		renderSource := func(w http.ResponseWriter, r *http.Request, page *Node) {
			ctx := context.WithValue(r.Context(), "baseURL", "/recipe/source/"+id)
			page.RenderPageCtx(ctx, w, r)
		}

		renderRecipes := func(re []models.Recipe) *Node {
			var items []*Node
			for _, rc := range re {
				items = append(items, Div(
					Class("flex items-center"),
					A(Href(fmt.Sprintf("/recipe/%s", rc.ID)), T(rc.Name)),
				))
			}
			return Ch(items)
		}
		switch r.Method {
		case http.MethodPost:
			res, err := d.Search.Recipe.Search(r.FormValue("search"))
			if err != nil {
				fmt.Println("Error:", err)
			}

			var re []models.Recipe
			var ids []string
			for _, h := range res.Hits {
				ids = append(ids, h.ID)
			}
			if err := d.DB.Where("id IN ?", ids).Find(&re).Error; err != nil {
				http.Error(w, err.Error(), http.StatusInternalServerError)
				return
			}
			renderSource(w, r, Div(renderRecipes(re)))
		case http.MethodGet:
			var re []models.Recipe
			res := d.DB.Where("domain = ?", id).Find(&re)
			if res.Error != nil {
				http.Error(w, res.Error.Error(), http.StatusInternalServerError)
				return
			}
			renderSource(w, r, DefaultLayout(
				Div(
					Class("container mx-auto p-8 flex flex-col"),
					H1(Class("text-2xl font-semibold"), T("Recipes")),
					Form(
						HxPost("/"),
						HxTarget("#results"),
						Input(Type("hidden"), Name("source"), Value(id)),
						Input(Class("input"), Type("text"), Name("search"), Placeholder("search")),
						Input(Class("btn"), Type("submit")),
					),
					Div(
						Id("results"),
						renderRecipes(re),
					),
				),
			))
		}
	})

	m.HandleFunc("/{id...}", func(w http.ResponseWriter, r *http.Request) {
		getRecipe := func(rs RecipeState) {
			video, err := client.GetVideoContext(ctx, rs.Recipe.ID)
			if err != nil {
				http.Error(w, err.Error(), http.StatusInternalServerError)
				return
			}

			println("loading transcript")
			ts, err := getYTTranscript(ctx, client, video)
			if err != nil {
				http.Error(w, err.Error(), http.StatusInternalServerError)
				return
			}
			rs.Transcript = ts

			println("generating recipe")
			nr, err := transcriptToRecipe(ctx, d, ts)
			if err != nil {
				http.Error(w, err.Error(), http.StatusInternalServerError)
				return
			}

			nr.Name = video.Title
			// TODO breadchris ID gets overridden by AI call
			id := rs.Recipe.ID
			rs.Recipe = nr
			rs.Recipe.ID = id
			println("saving recipe", rs.Recipe.ID)
			if err = recipes.Set(rs.Recipe.ID, rs); err != nil {
				http.Error(w, err.Error(), http.StatusInternalServerError)
				return
			}
		}

		renderRecipe := func(rs RecipeState, w http.ResponseWriter, r *http.Request) {
			var items []*Node
			for _, t := range rs.Transcript {
				items = append(items, Div(
					Class("flex items-center"),
					OnClick("seekToTime("+strconv.Itoa(t.StartMs/1000)+")"),
					Span(Class("text-gray-500"), T(strconv.Itoa(t.StartMs))),
					Span(Class("ml-2"), T(t.Text)),
				))
			}

			var equipment []*Node
			for _, e := range rs.Recipe.Equipment {
				equipment = append(equipment, Div(Class("p-2 bg-gray-500 text-white"), T(e)))
			}

			var (
				ingredients []*Node
				protein     float64
				fat         float64
				carbs       float64
			)
			for _, i := range rs.Recipe.Ingredients {
				var food []models.FoodName
				if err := d.DB.Preload("Food").Where("name = ?", strings.ToLower(i.Name)).Find(&food).Error; err != nil {
					http.Error(w, err.Error(), http.StatusInternalServerError)
					return
				}
				var foodItems []*Node
				for _, f := range food {
					foodItems = append(foodItems, Div(Class("p-2 bg-gray-500 text-white"), T(f.Name)))
				}

				var nuts *Node

				a, err := strconv.Atoi(i.Amount)
				if err == nil {
					var grams float64
					switch i.Unit {
					case "pound":
						grams = float64(a) * 453.592
					}

					if len(food) > 0 {
						n, err := usdaFoodToNutrients(*food[0].Food)
						if err != nil {
							http.Error(w, err.Error(), http.StatusInternalServerError)
							return
						}
						pg := grams * (n.Protein / 100)
						fg := grams * (n.Fat / 100)
						cg := grams * (n.Carbs / 100)

						protein += pg
						fat += fg
						carbs += cg

						nuts = Div(
							Class("flex flex-row space-x-2 text-gray-500"),
							Div(T(Fmt("%.2fg protein", pg))),
							Div(T(Fmt("%.2fg fat", fg))),
							Div(T(Fmt("%.2fg carbs", cg))),
						)
					}
				}

				ingredients = append(ingredients, Div(
					Class("flex flex-col"),
					Div(T(fmt.Sprintf("%s %s %s %s", i.Amount, i.Unit, i.Name, i.Comment))),
					//Span(Class("text-gray-500"), T(i.Name)),
					nuts,
					//Ch(foodItems),
				))
			}

			var directions []*Node
			for _, d := range rs.Recipe.Directions {
				directions = append(directions, Div(
					Class("py-2 flex"),
					OnClick("seekToTime("+strconv.Itoa(d.StartTime)+")"),
					Div(
						Class("flex flex-row space-x-2"),
						Div(
							RenderPlay(),
						),
						Div(
							T(fmt.Sprintf("%s", d.Text)),
						),
					),
				))
			}

			servings := 4.0

			id := rs.Recipe.ID
			DefaultLayout(
				Div(
					Class("md:w-1/2 mx-auto p-8 space-y-4"),
					ytScript(id),
					P(Class("text-4xl font-semibold mb-4"), T(rs.Recipe.Name)),
					Div(
						P(Class("text-2xl font-semibold mb-4"), T("Ingredients")),
						Ul(Class("space-y-4"), Ch(ingredients)),
					),
					Div(
						Class("flex flex-row space-x-2 text-gray-500"),
						Div(T(Fmt("servings: %.1f", servings))),
					),
					Div(
						Class("flex flex-row space-x-2 text-gray-500"),
						Div(T(Fmt("per serving: "))),
						Div(T(Fmt("%.2fg protein", protein/servings))),
						Div(T(Fmt("%.2fg fat", fat/servings))),
						Div(T(Fmt("%.2fg carbs", carbs/servings))),
					),
					Div(Class("divider")),
					Div(
						Class(""),
						P(Class("text-2xl font-semibold mb-4"), T("Equipment")),
						Div(Class("grid grid-cols-4 gap-4 text-center my-4"), Ch(equipment)),
					),
					Div(Class("divider")),
					Div(Id("player"), Class("w-full")),
					Div(
						P(Class("text-2xl font-semibold mb-4"), T("Directions")),
						Div(Class(""), Ch(directions)),
					),
					Div(Class("space-x-2"),
						A(Class("btn"), HxTarget("body"), HxPut(fmt.Sprintf("/%s", id)), T("Regenerate")),
						A(Class("btn"), HxTarget("body"), HxDelete(fmt.Sprintf("/%s", id)), T("Delete")),
					),
					//Ch(items),
				),
			).RenderPageCtx(ctx, w, r)
		}

		id := r.PathValue("id")
		switch r.Method {
		case http.MethodPut:
			rs := RecipeState{
				Recipe: Recipe{
					ID: id,
				},
			}
			getRecipe(rs)
			renderRecipe(rs, w, r)
		case http.MethodDelete:
			if err := recipes.Delete(id); err != nil {
				http.Error(w, err.Error(), http.StatusInternalServerError)
				return
			}
			Div(T("deleted")).RenderPageCtx(ctx, w, r)
		case http.MethodPost:
			u := r.FormValue("url")
			if u == "" {
				http.Error(w, "missing url", http.StatusBadRequest)
				return
			}

			pu, err := url.Parse(u)
			if err != nil {
				http.Error(w, err.Error(), http.StatusBadRequest)
				return
			}

			if pu.Host != "www.youtube.com" {
				http.Error(w, "invalid host", http.StatusBadRequest)
				return
			}

			vid := pu.Query().Get("v")
			if vid == "" {
				http.Error(w, "missing video id", http.StatusBadRequest)
				return
			}
			rs := RecipeState{
				Recipe: Recipe{
					ID: vid,
				},
			}
			getRecipe(rs)
			http.Redirect(w, r, fmt.Sprintf("/recipe/%s", vid), http.StatusSeeOther)
		case http.MethodGet:
			if id == "" {
				docs, err := recipes.List()
				if err != nil {
					http.Error(w, err.Error(), http.StatusInternalServerError)
					return
				}
				var recp []*Node
				for _, v := range docs {
					var rs RecipeState
					if err := json.Unmarshal(v.Data, &rs); err != nil {
						continue
					}
					recp = append(recp, Div(
						Class("flex items-center text-left p-4 space-x-4 border-b border-gray-200"),
						Img(Class("max-w-32"), Src(fmt.Sprintf("https://img.youtube.com/vi/%s/sddefault.jpg", v.ID))),
						A(
							Href(fmt.Sprintf("/%s", v.ID)),
							T(rs.Recipe.Name),
						),
					))
				}
				DefaultLayout(
					Div(
						Class("mt-8 text-center mx-auto flex flex-col items-center"),
						Div(
							Class("flex flex-row space-x-4 mb-8 text-gray-500"),
							A(Href(routes.Playlist), T("playlist")),
							A(Href(routes.Food), T("food")),
						),
						P(Class("text-lg"), T("make a recipe")),
						Form(
							Method("POST"),
							Action("/"),
							Input(Class("input"), Name("url"), Type("text"), Placeholder("Enter YouTube video")),
							Button(Class("btn"), T("Generate")),
						),
						Div(Class("mt-8 container mx-auto"), Ch(recp)),
					),
				).RenderPageCtx(ctx, w, r)
				return
			}

			rs := RecipeState{
				Recipe: Recipe{
					ID: id,
				},
			}
			if err := recipes.Get(id, &rs); err != nil {
				getRecipe(rs)
			}
			renderRecipe(rs, w, r)
		}
	})

	return m
}

func RenderPlay() *Node {
	return Svg(
		ViewBox("0 0 24 24"),
		StrokeWidth("2"),
		Xmlns("http://www.w3.org/2000/svg"),
		Width("24"),
		Height("24"),
		StrokeLinejoin("round"),
		Class("lucide lucide-circle-play"),
		Fill("none"),
		Stroke("currentColor"),
		StrokeLinecap("round"),
		Circle(Cx("12"), Cy("12"), R("10")),
		Polygon(Points("10 8 16 12 10 16 10 8")),
	)
}

func RenderTimeline() *Node {
	return Ul(
		Class("timeline timeline-vertical"),
		Li(
			Div(Class("timeline-start"), Text("1984")),
			Div(
				Class("timeline-middle"),
				Svg(
					Class("w-5 h-5"),
					Xmlns("http://www.w3.org/2000/svg"),
					ViewBox("0 0 20 20"),
					Fill("currentColor"),
					Path(
						FillRule("evenodd"),
						D(
							"M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z",
						),
						ClipRule("evenodd"),
					),
				),
			),
			Div(Class("timeline-end timeline-box"), Text("First Macintosh computer")),
			Hr(),
		),
		Li(
			Hr(),
			Div(Class("timeline-start"), Text("1998")),
			Div(
				Class("timeline-middle"),
				Svg(
					ViewBox("0 0 20 20"),
					Fill("currentColor"),
					Class("w-5 h-5"),
					Xmlns("http://www.w3.org/2000/svg"),
					Path(
						ClipRule("evenodd"),
						FillRule("evenodd"),
						D(
							"M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z",
						),
					),
				),
			),
			Div(Class("timeline-end timeline-box"), Text("iMac")),
			Hr(),
		),
		Li(
			Hr(),
			Div(Class("timeline-start"), Text("2001")),
			Div(
				Class("timeline-middle"),
				Svg(
					Fill("currentColor"),
					Class("w-5 h-5"),
					Xmlns("http://www.w3.org/2000/svg"),
					ViewBox("0 0 20 20"),
					Path(
						FillRule("evenodd"),
						D(
							"M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z",
						),
						ClipRule("evenodd"),
					),
				),
			),
			Div(Class("timeline-end timeline-box"), Text("iPod")),
			Hr(),
		),
		Li(
			Hr(),
			Div(Class("timeline-start"), Text("2007")),
			Div(
				Class("timeline-middle"),
				Svg(
					Fill("currentColor"),
					Class("w-5 h-5"),
					Xmlns("http://www.w3.org/2000/svg"),
					ViewBox("0 0 20 20"),
					Path(
						FillRule("evenodd"),
						D(
							"M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z",
						),
						ClipRule("evenodd"),
					),
				),
			),
			Div(Class("timeline-end timeline-box"), Text("iPhone")),
			Hr(),
		),
		Li(
			Hr(),
			Div(Class("timeline-start"), Text("2015")),
			Div(
				Class("timeline-middle"),
				Svg(
					Xmlns("http://www.w3.org/2000/svg"),
					ViewBox("0 0 20 20"),
					Fill("currentColor"),
					Class("w-5 h-5"),
					Path(
						D(
							"M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z",
						),
						ClipRule("evenodd"),
						FillRule("evenodd"),
					),
				),
			),
			Div(Class("timeline-end timeline-box"), Text("Apple Watch")),
		),
	)
}

func ytScript(id string) *Node {
	return Script(Raw(`
        let player;

        const tag = document.createElement('script');
        tag.src = "https://www.youtube.com/iframe_api";
        const firstScriptTag = document.getElementsByTagName('script')[0];
        firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

        window.onYouTubeIframeAPIReady = function() {
            player = new YT.Player('player', {
                height: '390',
                width: '640',
                videoId: '` + id + `',
                events: {
                    onReady: onPlayerReady
                }
            });
        };

        // When the player is ready
        function onPlayerReady(event) {
            console.log('Player is ready');
        }

        // Function to seek to a specific time in seconds
        function seekToTime(seconds) {
            if (player && player.seekTo) {
                player.seekTo(seconds, true);
            }
        }
`))
}

type Transcript struct {
	XMLName xml.Name      `xml:"transcript"`
	Texts   []CaptionText `xml:"text"`
}

type CaptionText struct {
	Start string `xml:"start,attr"`
	Dur   string `xml:"dur,attr"`
	Body  string `xml:",chardata"`
}

func parseXML(input string) (youtube.VideoTranscript, error) {
	var transcript Transcript
	err := xml.Unmarshal([]byte(input), &transcript)
	if err != nil {
		return nil, err
	}

	var videoTranscript youtube.VideoTranscript
	for _, text := range transcript.Texts {
		startSeconds, err := strconv.ParseFloat(text.Start, 64)
		if err != nil {
			return nil, fmt.Errorf("invalid start value: %v", err)
		}
		durationSeconds, err := strconv.ParseFloat(text.Dur, 64)
		if err != nil {
			return nil, fmt.Errorf("invalid duration value: %v", err)
		}

		startMs := int(startSeconds * 1000)
		durationMs := int(durationSeconds * 1000)
		offsetText := fmt.Sprintf("%d:%02d", startMs/60000, (startMs/1000)%60)

		videoTranscript = append(videoTranscript, youtube.TranscriptSegment{
			Text:       html.UnescapeString(text.Body),
			StartMs:    startMs,
			OffsetText: offsetText,
			Duration:   durationMs,
		})
	}

	return videoTranscript, nil
}

func getYTTranscript(ctx context.Context, client youtube.Client, video *youtube.Video) (youtube.VideoTranscript, error) {
	for _, f := range video.CaptionTracks {
		if f.LanguageCode == "en-US" {
			r, err := http.Get("https://www.youtube.com" + f.BaseURL)
			if err != nil {
				return nil, err
			}
			defer r.Body.Close()
			a, err := io.ReadAll(r.Body)
			if err != nil {
				return nil, err
			}
			return parseXML(string(a))
		}
	}

	return client.GetTranscriptCtx(ctx, video, "en")
}

func loadFoundationFoodData() (*FoundationFoods, error) {
	f, err := os.Open("data/foundationDownload.json")
	if err != nil {
		return nil, err
	}
	defer f.Close()

	var foundationFood FoundationFoods
	if err = json.NewDecoder(f).Decode(&foundationFood); err != nil {
		return nil, err
	}
	return &foundationFood, nil
}

func loadBrandedFoodData() (*BrandedFoods, error) {
	f, err := os.Open("data/brandedDownload.json")
	if err != nil {
		return nil, err
	}
	defer f.Close()

	var brandedFood BrandedFoods
	if err = json.NewDecoder(f).Decode(&brandedFood); err != nil {
		return nil, err
	}
	return &brandedFood, nil
}

func loadSRData() (*SRLegacyFoods, error) {
	f, err := os.Open("data/FoodData_Central_sr_legacy_food_json_2021-10-28.json")
	if err != nil {
		return nil, err
	}
	defer f.Close()

	var sr SRLegacyFoods
	if err = json.NewDecoder(f).Decode(&sr); err != nil {
		return nil, err
	}
	return &sr, nil
}

func saveFoods(d *gorm.DB, f *BrandedFoods) error {
	for _, item := range f.BrandedFoods {
		s, err := json.Marshal(item)
		if err != nil {
			return err
		}
		r := d.FirstOrCreate(&models.Food{
			FDCID:       item.FDCID,
			Description: item.Description,
			Raw:         s,
		})
		if r.Error != nil {
			return r.Error
		}
		println(item.Description)
	}
	return nil
}

func saveSRFoods(d *gorm.DB, f *SRLegacyFoods) error {
	for _, item := range f.SRLegacyFood {
		s, err := json.Marshal(item)
		if err != nil {
			return err
		}
		r := d.FirstOrCreate(&models.Food{
			FDCID:       item.FDCID,
			Description: item.Description,
			Raw:         s,
		})
		if r.Error != nil {
			return r.Error
		}
		println(item.Description)
	}
	return nil
}

type FoundationFoods struct {
	FoundationFood []FoundationFood `json:"FoundationFoods"`
}

type FoundationFood struct {
	FoodClass                 string                     `json:"foodClass"`
	Description               string                     `json:"description"`
	FoodNutrients             []FoodNutrientElement      `json:"foodNutrients"`
	FoodAttributes            []interface{}              `json:"foodAttributes"`
	NutrientConversionFactors []NutrientConversionFactor `json:"nutrientConversionFactors"`
	IsHistoricalReference     bool                       `json:"isHistoricalReference"`
	NdbNumber                 int64                      `json:"ndbNumber"`
	DataType                  string                     `json:"dataType"`
	FoodCategory              FoodCategory               `json:"foodCategory"`
	FDCID                     int64                      `json:"fdcId"`
	FoodPortions              []FoodPortion              `json:"foodPortions"`
	PublicationDate           string                     `json:"publicationDate"`
	InputFoods                []InputFoodElement         `json:"inputFoods"`
}

type FoodCategory struct {
	Description string `json:"description"`
}

type FoodNutrientElement struct {
	Type                   string                 `json:"type"`
	ID                     int64                  `json:"id"`
	Nutrient               Nutrient               `json:"nutrient"`
	DataPoints             *int64                 `json:"dataPoints,omitempty"`
	FoodNutrientDerivation FoodNutrientDerivation `json:"foodNutrientDerivation"`
	Median                 *float64               `json:"median,omitempty"`
	Amount                 float64                `json:"amount"`
	Max                    *float64               `json:"max,omitempty"`
	Min                    *float64               `json:"min,omitempty"`
}

type FoodNutrientDerivation struct {
	Code               string `json:"code"`
	Description        string `json:"description"`
	FoodNutrientSource Food   `json:"foodNutrientSource"`
}

type Food struct {
	ID          int64  `json:"id"`
	Code        string `json:"code"`
	Description string `json:"description"`
}

type Nutrient struct {
	ID       int64  `json:"id"`
	Number   string `json:"number"`
	Name     string `json:"name"`
	Rank     int64  `json:"rank"`
	UnitName string `json:"unitName"`
}

type FoodPortion struct {
	ID              int64       `json:"id"`
	Value           float64     `json:"value"`
	MeasureUnit     MeasureUnit `json:"measureUnit"`
	Modifier        string      `json:"modifier"`
	GramWeight      float64     `json:"gramWeight"`
	SequenceNumber  int64       `json:"sequenceNumber"`
	Amount          float64     `json:"amount"`
	MinYearAcquired int64       `json:"minYearAcquired"`
}

type MeasureUnit struct {
	ID           int64  `json:"id"`
	Name         string `json:"name"`
	Abbreviation string `json:"abbreviation"`
}

type InputFoodElement struct {
	ID              int64              `json:"id"`
	FoodDescription string             `json:"foodDescription"`
	InputFood       InputFoodInputFood `json:"inputFood"`
}

type InputFoodInputFood struct {
	FoodClass       string `json:"foodClass"`
	Description     string `json:"description"`
	DataType        string `json:"dataType"`
	FoodCategory    Food   `json:"foodCategory"`
	FDCID           int64  `json:"fdcId"`
	PublicationDate string `json:"publicationDate"`
}

type NutrientConversionFactor struct {
	Type              string   `json:"type"`
	ProteinValue      *float64 `json:"proteinValue,omitempty"`
	FatValue          *float64 `json:"fatValue,omitempty"`
	CarbohydrateValue *float64 `json:"carbohydrateValue,omitempty"`
	Value             *float64 `json:"value,omitempty"`
}

type BrandedFoods struct {
	BrandedFoods []BrandedFood `json:"BrandedFoods"`
}

type BrandedFood struct {
	FoodClass                string                   `json:"foodClass"`
	Description              string                   `json:"description"`
	FoodNutrients            []FoodNutrientElement    `json:"foodNutrients"`
	FoodAttributes           []WelcomeFoodAttribute   `json:"foodAttributes"`
	ModifiedDate             string                   `json:"modifiedDate"`
	AvailableDate            string                   `json:"availableDate"`
	MarketCountry            string                   `json:"marketCountry"`
	BrandOwner               string                   `json:"brandOwner"`
	GtinUpc                  string                   `json:"gtinUpc"`
	DataSource               string                   `json:"dataSource"`
	Ingredients              string                   `json:"ingredients"`
	ServingSize              float64                  `json:"servingSize"`
	ServingSizeUnit          string                   `json:"servingSizeUnit"`
	HouseholdServingFullText string                   `json:"householdServingFullText"`
	LabelNutrients           map[string]LabelNutrient `json:"labelNutrients"`
	TradeChannels            []string                 `json:"tradeChannels"`
	Microbes                 []interface{}            `json:"microbes"`
	BrandedFoodCategory      string                   `json:"brandedFoodCategory"`
	FDCID                    int64                    `json:"fdcId"`
	DataType                 string                   `json:"dataType"`
	PublicationDate          string                   `json:"publicationDate"`
	FoodUpdateLog            []FoodUpdateLog          `json:"foodUpdateLog"`
}

type WelcomeFoodAttribute struct {
	ID                int64                   `json:"id"`
	Name              string                  `json:"name"`
	Value             string                  `json:"value"`
	FoodAttributeType PurpleFoodAttributeType `json:"foodAttributeType"`
}

type PurpleFoodAttributeType struct {
	ID          int64  `json:"id"`
	Name        string `json:"name"`
	Description string `json:"description"`
}

type FoodUpdateLog struct {
	FoodClass       string                       `json:"foodClass"`
	Description     string                       `json:"description"`
	FoodAttributes  []FoodUpdateLogFoodAttribute `json:"foodAttributes"`
	FDCID           int64                        `json:"fdcId"`
	DataType        string                       `json:"dataType"`
	PublicationDate string                       `json:"publicationDate"`
}

type FoodUpdateLogFoodAttribute struct {
	ID                int64                   `json:"id"`
	Name              string                  `json:"name"`
	Value             string                  `json:"value"`
	FoodAttributeType FluffyFoodAttributeType `json:"foodAttributeType"`
}

type FluffyFoodAttributeType struct {
	ID int64 `json:"id"`
}

type LabelNutrient struct {
	Value float64 `json:"value"`
}

type SRLegacyFoods struct {
	SRLegacyFood []SRLegacyFood `json:"SRLegacyFoods"`
}

type SRLegacyFood struct {
	FoodClass                 string                     `json:"foodClass"`
	Description               string                     `json:"description"`
	FoodNutrients             []FoodNutrientElement      `json:"foodNutrients"`
	ScientificName            string                     `json:"scientificName"`
	FoodAttributes            []interface{}              `json:"foodAttributes"`
	NutrientConversionFactors []NutrientConversionFactor `json:"nutrientConversionFactors"`
	IsHistoricalReference     bool                       `json:"isHistoricalReference"`
	NdbNumber                 int64                      `json:"ndbNumber"`
	FoodCategory              FoodCategory               `json:"foodCategory"`
	FDCID                     int64                      `json:"fdcId"`
	DataType                  string                     `json:"dataType"`
	InputFoods                []interface{}              `json:"inputFoods"`
	PublicationDate           string                     `json:"publicationDate"`
	FoodPortions              []FoodPortion              `json:"foodPortions"`
}

//
//type Handler struct {
//	index *db.SearchIndex
//}
//
//func (s *Handler) searchHandler(w http.ResponseWriter, r *http.Request) {
//	query := r.URL.Query().Get("q")
//	if query == "" {
//		http.Error(w, "Query parameter 'q' is required", http.StatusBadRequest)
//		return
//	}
//
//	res, err := s.index.Search(query)
//	if err != nil {
//		http.Error(w, err.Error(), http.StatusInternalServerError)
//		return
//	}
//
//	var results []*Node
//	for _, h := range res.Hits {
//		f, err := os.ReadFile(path.Join("data/recipes", h.ID))
//		if err != nil {
//			http.Error(w, err.Error(), http.StatusInternalServerError)
//			return
//		}
//
//		var data map[string]any
//		err = json.Unmarshal(f, &data)
//		if err != nil {
//			http.Error(w, err.Error(), http.StatusInternalServerError)
//			return
//		}
//		results = append(results,
//			Div(Class("border p-4 mb-4 bg-white rounded shadow"),
//				H1(Class("text-xl font-semibold"), T(data["name"].(string))),
//				P(T(data["source"].(string))),
//				A(Class("text-blue-500"), Href(fmt.Sprintf("/data/recipes/%s", h.ID)), T("Read more")),
//			))
//	}
//
//	w.Header().Set("Content-Type", "text/html")
//	if len(results) == 0 {
//		P(T("No results found")).RenderPage(w, r)
//		return
//	}
//	Div(Ch(results)).RenderPage(w, r)
//}

var transcriptPrompt = `
You will take a transcript and generate a recipe from it by calling the generateRecipe function. The generateRecipe function will take the transcript as input and return a recipe object. The recipe object will have the following structure:
Use the following transcript to extract the recipe into the described format.
Replace casual dialogue and narrative with clear and direct recipe language.
Include inferred ingredients and ensure proper structuring of directions with precise timestamps.
The transcript contains timestamps and text in the form: "[start - end] text", timestamps are in seconds.
Each direction should only contain one action. For example, "Whisk egg whites" is one action. "Place a heaping teaspoon of the meat mixture in the center of a dumpling wrapper. Wet the perimeter with water, close it like a taco, pinching it in the middle at the top and pleat both sides three to four times." contains multiple actions.

Here is an example transcript and the resulting timestamps and directions:
Transcript:
[0 - 0] - I'm Frank Proto,
[0 - 2] professional chef and culinary instructor,
[2 - 3] and today I'm gonna show you
[3 - 5] how to make the best
fettuccine Alfredo at home.
[5 - 9] We're talking silky, creamy,
classic fettuccine Alfredo.
[9 - 11] This is Fettuccine Alfredo 101.
[13 - 15] Fettuccine Alfredo is a classic dish
[15 - 17] that you normally don't see
in restaurants in Italy.
[17 - 20] It's basically pasta
with butter and Parmesan,
[20 - 23] pasta al burro or pasta
con parmigiano e burro.
[23 - 26] The American version of
fettuccine Alfredo uses cream.
[26 - 27] This is more the original version
[27 - 29] that came from Italy to America.
[29 - 32] Real fettuccine Alfredo, it
only has three ingredients:
[32 - 36] butter, Parmesan cheese, and pasta.
[36 - 38] It's all about the technique,
and once you get that down,
[38 - 40] you're gonna make it
perfectly every time at home.
[43 - 45] One thing I talk about all
the time is mise en place.
[45 - 47] This dish comes together really quickly,
[47 - 49] so you have to have everything close by.
[49 - 51] One of the main ingredients
in our fettuccine Alfredo
[51 - 53] is Parmigiano Reggiano cheese.
[53 - 55] It is really, really important
[55 - 58] that you use real Parmigiano
Reggiano from Italy.
[58 - 59] You can tell that it's real
[59 - 61] because it's gonna be stamped
[61 - 62] Parmigiano Reggiano on the outside.
[62 - 64] You're gonna see that rind.
[64 - 66] The Parmigiano Reggiano and the butter,
[66 - 67] when you mix it together,
[67 - 69] emulsifies the sauce and makes it creamy.
[69 - 71] One of the key factors of this dish
[71 - 72] is getting good ingredients.
[72 - 74] Because there are so few ingredients,
[74 - 77] getting the best you can afford
is really, really important.
[77 - 79] So I'm gonna start grating my cheese.
[79 - 81] It's really important
that your Parmesan cheese
[81 - 82] be finely grated.
[82 - 83] I'm using a Microplane.
[83 - 86] If you don't have a Microplane,
you can grate it on a grater
[86 - 88] and then sift it or strain it
[88 - 89] just to get the big chunks out.
[89 - 91] But I want this cheese to be nice and fine
[91 - 93] so that it melts once it gets hot.
[93 - 96] So you can see that this
Microplane does that really well.
[96 - 98] Part of the reason I don't
use pre-grated cheese
[98 - 101] is that I can't tell if it's real, right?
[101 - 103] Someone could be selling
me Parmesan cheese
[103 - 105] and I don't see the rind,
so I don't really trust it.
[105 - 108] Second of all, it's usually
not ground fine enough,
[108 - 110] and a lot of times when
you buy pre-grated cheese,
[110 - 112] there are things in the cheese
[112 - 113] that will stop it from clumping,
[113 - 116] like they'll use anti-caking ingredients,
[116 - 117] and that does not do well for us
[117 - 119] when it comes to making the finished dish.
[119 - 122] Sometimes also in pre-grated
cheese, it's very moist,
[122 - 124] and this cheese is usually super dry,
[124 - 126] and that makes our product
a little stringy in the end.
[126 - 128] So grate your own cheese, it's worth it.
[128 - 130] So it does look like a lot of cheese,
[130 - 132] and I'm basically gonna use
like three quarters of a pound
[132 - 134] or a pound of cheese to a pound of pasta.
[134 - 137] It's indulgent. This is a luxurious dish.
[137 - 141] It is cheesy, it is rich.
Don't skimp on the cheese here.
[141 - 142] The cheese is grated.
[142 - 143] And what's funny about this dish
[143 - 145] is this is really the only action
[145 - 147] or the only mise en place you have to do.
[149 - 150] Have a pot of boiling water,
[150 - 152] and usually chefs tell people
[152 - 154] to use a large pot of boiling water.
[154 - 157] In this case, I want a smaller
pot. I want less water.
[157 - 160] When pasta cooks, it gives off starch.
[160 - 161] I want this water to be extra starchy,
[161 - 164] so when we add it to our pasta,
[164 - 166] that starch will help
bring the sauce together.
[166 - 167] Generally, for pasta dishes,
[167 - 170] I would use a larger pot
with a lot more salt,
[170 - 173] but because we're using
Parmesan, it's super salty,
[173 - 175] and I don't want this
dish to be over-salted.
[175 - 178] So I'm just gonna use a little
bit of salt in my water.
[178 - 178] I'm not gonna go crazy.
[178 - 180] I just want some seasoning
to get in the pasta.
[180 - 183] I chose to use dry pasta in the box.
[183 - 184] Now, a lot of people say,
[184 - 187] "Well, in Italy, they all eat
fresh pasta all the time,"
[187 - 188] but that's not really true.
[188 - 190] A lot of people use dry pasta in Italy.
[190 - 193] You could use fresh if
you want. It's up to you.
[193 - 194] But I like to use dry.
[194 - 196] It has a little more starch to it,
[196 - 198] and I like the way it comes
out a little bit better.
[198 - 201] You wanna try and find the
best pasta that you can afford
[201 - 203] because it's gonna make the dish better.
[203 - 205] Because this dish has so few ingredients,
[205 - 206] every ingredient matters.
[206 - 207] A lot of times chefs will say
[207 - 209] they want their pasta al dente.
[209 - 210] Al dente means to the tooth,
[210 - 212] which means there's a little bit of bite.
[212 - 214] You bite into your pasta,
there's no white center,
[214 - 216] but it has some chew to it.
[216 - 218] I'm going just past al dente here.
[218 - 221] So you can see as I stir the
pasta, the water gets cloudy,
[221 - 222] and that's what I want.
[222 - 225] That cloudiness is the starch
washing off of the pasta.
[225 - 227] I'm using a butter with high butter fat.
[227 - 228] It's a little creamier.
[228 - 231] There's less liquid or solids in this.
[231 - 234] I've used this Plugra or
Kerrygold unsalted butter.
[234 - 236] So I would try and find a European butter.
[236 - 238] This will really help the emulsification
[238 - 240] to help the dish come together.
[240 - 241] This pasta comes together really quick.
[241 - 243] Have your plates ready to go.
[243 - 245] Have all of your other
mise en place ready to go
[245 - 249] and serve the pasta to
your guest immediately.
[249 - 251] The best way to check
if your pasta is done
[251 - 252] is to actually taste the piece.
[252 - 254] People will say, "Oh,
throw it against the wall."
[254 - 256] No, it just says our pasta is starchy.
[256 - 257] It's good.
[257 - 259] I think it needs another half a minute,
[259 - 260] and we're good to go.
[260 - 263] Once this pasta is cooked,
we need to go quickly.
[263 - 266] It is not something you can
kind of wait around and chat.
[266 - 267] You wanna have everything ready to go.
[267 - 270] Basically, I'm using the
pound, pound, pound rule.
[270 - 272] I got a pound of pasta, a pound of butter,
[272 - 273] and a pound of cheese.
[273 - 274] And it seems like a lot,
[274 - 276] but again, this dish is super luxurious
[276 - 278] and meant to be eaten
in smaller quantities,
[278 - 280] so we're not gonna skimp on anything.
[280 - 282] We got lots of cheese,
we got lots of butter,
[282 - 284] and we got beautiful starchy pasta.
[284 - 286] Deep cleansing breath. Let's start.
[286 - 289] The pasta is ready to go, so
I'm gonna shut my water off.
[289 - 291] Notice I don't have a colander or a spider
[291 - 292] or anything, strainer.
[292 - 294] What I'm gonna do is take my pasta
[294 - 296] directly out of the water,
[296 - 298] let it drain for like a second,
[298 - 300] and then drop it right into my butter.
[300 - 302] Some of that pasta water
is clinging to my pasta,
[302 - 304] and that's what I want.
[304 - 306] I'm not gonna throw this
pasta water away yet
[306 - 309] because I might need some
to adjust the final dish.
[309 - 312] And this is where we start to mix, right?
[312 - 314] I'm gonna start to melt my butter,
[314 - 316] and this is where the
key of the technique is.
[316 - 318] We're gonna continuously keep it moving.
[318 - 319] We want the butter
[319 - 323] to emulsify with that
pasta water and the pasta,
[323 - 324] and I'm gonna start adding cheese.
[324 - 327] You don't wanna be shy with
this cheese. Go a little crazy.
[327 - 329] I have a little extra
cheese in case I need it,
[329 - 331] but we're gonna mix, mix, mix.
[331 - 333] And because that I use
the Microplane on this,
[333 - 336] you'll see that my cheese
kind of melts right away.
[336 - 339] We gotta keep it moving, keep
it moving, keep it moving,
[339 - 341] and that's what's the most
important thing is here.
[341 - 343] I'm gonna add a little more cheese.
[343 - 344] You could measure this out perfectly,
[344 - 345] but I'm gonna do it by eye
[345 - 348] because I want this to look a certain way.
[348 - 351] I want it to look creamy and delicious.
[351 - 354] The main component here is the
technique, stir, stir, stir.
[354 - 356] We want to continue to stir
[356 - 358] until the sauce starts to look creamy.
[358 - 360] So you can see that my
sauce is kind of tight.
[360 - 362] I can add pasta water,
[362 - 363] but look, once I add that water,
[363 - 366] you'll see that it starts to
look creamier and creamier.
[366 - 368] I use a glass bowl for this
[368 - 370] because a metal bowl
will disperse the heat,
[370 - 373] whereas a glass bowl
holds that heat together.
[373 - 375] Nice, creamy sauce.
[375 - 378] It starts to look like we
added heavy cream to this,
[378 - 380] and we didn't add any heavy cream.
[380 - 381] It's all about the technique.
[381 - 384] That pasta and that cheese is emulsified,
[384 - 385] and that's what we want.
[385 - 387] It's all about the stirring
[387 - 390] and getting our pasta super creamy.
[390 - 392] You might be tempted to do this
in a pan over a heat source.
[392 - 394] And the reason I chose a bowl
[394 - 397] is because if you overheat
this sauce, it breaks.
[397 - 399] So you're gonna have an oily mess
[399 - 400] with the cheeses in clumps,
[400 - 402] and the butter breaks and gets greasy.
[402 - 403] When the butter breaks,
[403 - 405] that means that the fat
and the solids separate,
[405 - 408] so you're gonna get greasy fatty stuff
[408 - 410] and chunks of butter solids and cheese.
[410 - 412] One of the most important
things with fettuccine Alfredo
[412 - 413] is to get it on a plate
[413 - 416] and get it in your mouth
as fast as possible.
[416 - 417] Let's plate this up.
[417 - 420] So we can go on the plate. You
can see this is super creamy.
[420 - 422] Now, if you have guests,
[422 - 423] you don't really have to
put this on a platter,
[423 - 426] you can go directly onto their plates,
[426 - 428] but this is the presentation here.
[428 - 430] Look at how creamy that sauce is.
[430 - 433] And you can see why when this
dish came over to America,
[433 - 435] people thought there was cream in it
[435 - 437] because it does actually look
[437 - 438] like there might be some cream in here,
[438 - 443] but it is just butter, pasta
water, and Parmesan cheese.
[443 - 443] Look at that.
[443 - 445] If that doesn't make you smile,
[446 - 448] you got no joy in your life, people.
[448 - 451] So I do have a little bowl
of cheese here on the side
[451 - 454] in case you or your guests
want to add more cheese,
[454 - 457] but I would suggest tasting
it first the way it is.
[457 - 459] And if you need more
cheese, add more cheese.
[459 - 460] To be honest with you,
[460 - 461] there is so much cheese
in this dish already,
[461 - 463] they probably won't need it,
[463 - 466] but it's always good to
give your guests the option.
[466 - 468] Let me go onto my plate.
[468 - 469] That is gorgeous.
[469 - 472] I'm gonna bring it close so I
don't slop it all over myself.
[472 - 474] I'm not a spoon guy here.
[474 - 476] I just twist it around my fork, right?
[478 - 481] Hmm. It's creamy, it's buttery.
[481 - 484] It's got some really nice
bite from the Parmesan cheese.
[484 - 486] You don't need a big bowl of
this. Give small portions.
[486 - 487] Absolutely delicious.
[487 - 490] Like, who could you serve
this to that would hate this?
[490 - 493] Remember, this is a
super, super simple dish.
[493 - 494] It's all about the technique.
[494 - 497] You get that technique right
and it's gonna be beautiful.
[497 - 500] So you might have to practice,
but it's well worth it.

Directions:
45 Prepare all ingredients and have them close by. The dish comes together quickly.
77 Grate the Parmesan cheese finely using a Microplane.
149 Prepare a pot of boiling water with just a little salt.
180 Use 1 pound of dry fettuccine pasta.
218 Cook the pasta just past al dente.
249 Taste a piece of pasta to check if it’s done.
286 Turn off the water once pasta is cooked.
289 Transfer the cooked pasta directly into a bowl containing the butter.
304 Reserve the pasta water for later use.
306 Start melting the butter and mixing continuously.
318 Emulsify the butter with the pasta water and add cheese gradually.
339 Add more cheese as needed to achieve a creamy consistency.
356 Continue stirring until the sauce looks creamy.
373 Add pasta water if the sauce is too tight until it looks like a cream-based sauce.
385 Keep stirring to get the pasta creamy.
390 Avoid using heat source like a pan to prevent breaking the sauce; use a glass bowl.
413 Plate the dish immediately while it's hot.
451 Serve with extra grated Parmesan cheese on the side, if desired.
`
