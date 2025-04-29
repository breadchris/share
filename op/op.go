package op

import (
	"context"
	"encoding/json"
	"fmt"
	"github.com/breadchris/share/breadchris/posts"
	"github.com/breadchris/share/deps"
	. "github.com/breadchris/share/html"
	"github.com/breadchris/share/models"
	"github.com/google/uuid"
	"net/http"
)

type Op struct {
	ID          string
	Name        string
	Description string
	Image       string
}

func New(d deps.Deps) *http.ServeMux {
	mux := http.NewServeMux()

	op := d.Docs.WithCollection("ops")

	render := func(w http.ResponseWriter, r *http.Request, page *Node) {
		ctx := context.WithValue(r.Context(), "baseURL", "/op")
		page.RenderPageCtx(ctx, w, r)
	}

	mux.HandleFunc("/print", func(w http.ResponseWriter, r *http.Request) {
		type MusicCard struct {
			Name, Description, Image, GameMechanic string
		}

		cheeses := []MusicCard{
			{
				Name:         "Brass Band",
				Description:  "This vibrant ensemble brings together bold and brassy tones, perfect for energizing the game. It's loud, it's proud, and it fills the room with a rich, full sound.",
				Image:        "https://upload.wikimedia.org/wikipedia/commons/f/f0/Kyrgyz_Military_Band.jpg",
				GameMechanic: "Can be used to increase the tempo of a song or overpower a slow-paced melody, boosting the intensity of your team's rhythm.",
			},
			{
				Name:         "Electric Guitar",
				Description:  "The electric guitar is a powerful instrument that can unleash a range of emotions, from the raw intensity of rock to the smooth rhythms of blues. It can influence the tempo and mood of any musical piece.",
				Image:        "https://news.iu.edu/live/image/gid/2/width/500/height/452/crop/1/src_region/268,557,3180,3189/20003_Jimi_Hendrix_-_GettyImages-84894709.jpg",
				GameMechanic: "Can change the mood of the song, either by adding sharp, edgy riffs or by calming down the intensity, affecting your opponents’ gameplay.",
			},
			{
				Name:         "Synthesizer",
				Description:  "A key to modern music, the synthesizer provides a wide range of sounds, from atmospheric pads to sharp leads. It adds texture and futuristic vibes to the gameplay.",
				Image:        "https://upload.wikimedia.org/wikipedia/commons/6/60/Minimoog-Synthesizer.jpg",
				GameMechanic: "Adds an unexpected twist to the game, either creating a futuristic vibe or altering the soundscape to throw off the opponent.",
			},
			{
				Name:         "Drum Kit",
				Description:  "A foundational part of rhythm, the drum kit drives the tempo of any musical genre. Its beats set the pace and keep everything in sync.",
				Image:        "https://upload.wikimedia.org/wikipedia/commons/3/3d/Drum_kit_1.jpg",
				GameMechanic: "Determines the pace of a round. The faster the beats, the more actions the player can take within a turn.",
			},
			{
				Name:         "Orchestra Strings",
				Description:  "This ensemble brings elegance and depth with rich string arrangements. Perfect for adding grandeur and emotion to any game scenario.",
				Image:        "https://upload.wikimedia.org/wikipedia/commons/2/2b/Orchestra_strings.jpg",
				GameMechanic: "Alters the game’s emotional setting, giving players a chance to dramatically change the tone of their current piece.",
			},
			{
				Name:         "Piano",
				Description:  "The piano is one of the most versatile instruments in music, capable of both melody and harmony. It sets the emotional tone, from delicate ballads to dramatic pieces.",
				Image:        "https://upload.wikimedia.org/wikipedia/commons/1/15/Grand_Piano.jpg",
				GameMechanic: "A versatile tool that can either harmonize or introduce a melody, depending on the situation in the game. It can help players gain control of more than one aspect of the round.",
			},
			{
				Name:         "Vocals",
				Description:  "The human voice is the most expressive instrument of all. It can sing words, tell a story, and convey deep emotions that resonate with the heart.",
				Image:        "https://upload.wikimedia.org/wikipedia/commons/9/9b/Singer_mic.jpg",
				GameMechanic: "Influences the lyrics or the theme of a song, enabling players to guide the direction of their performance or control the narrative.",
			},
			{
				Name:         "Acoustic Guitar",
				Description:  "This instrument evokes warmth and intimacy. It’s perfect for soothing melodies or lively folk music, providing a rich foundation for storytelling.",
				Image:        "https://upload.wikimedia.org/wikipedia/commons/3/3f/Acoustic_Guitar.jpg",
				GameMechanic: "Used for building harmony or enhancing melodies in a laid-back, classic fashion, bringing calm to tense moments.",
			},
			{
				Name:         "Percussion Instruments",
				Description:  "From maracas to tambourines, percussion instruments add rhythm and fun to the music. They're the life of the party, driving movement and energy.",
				Image:        "https://upload.wikimedia.org/wikipedia/commons/7/74/Percussion_instruments.jpg",
				GameMechanic: "Introduces a spontaneous and fun element, encouraging players to act quickly, disrupting their opponents’ strategies.",
			},
		}

		// Create front cards (with image and title) and back cards (with title and description)
		var frontCards []*Node
		var backCards []*Node

		var reverseRow []*Node
		for _, cheese := range cheeses {
			frontCard := Div(
				Class("border-1 border-gray-200"),
				Div(
					Class("card mx-auto text-black grid place-content-center rounded-box border-8 border-black"),
					Style_("width: 2.5in; height: 3.5in;"),
					Figure(
						Img(Src(cheese.Image)),
					),
					Div(
						Class("card-body"),
						H2(Class("card-title justify-center"), Text(cheese.Name)),
					),
				),
			)
			backCard := Div(
				Class("border-1 border-gray-200"),
				Div(
					Class("card mx-auto text-black grid place-content-center rounded-box border-8 border-black"),
					Style_("width: 2.5in; height: 3.5in;"),
					Div(
						Class("card-body"),
						//H2(Class("card-title text-center"), Text(cheese.Name)),
						P(Class("card-text text-center"), Text(cheese.GameMechanic)),
					),
				),
			)
			frontCards = append(frontCards, frontCard)
			if len(reverseRow) <= 2 {
				reverseRow = append(reverseRow, backCard)
			} else {
				for i := len(reverseRow) - 1; i >= 0; i-- {
					backCards = append(backCards, reverseRow[i])
				}
				reverseRow = []*Node{backCard}
			}
		}

		if len(reverseRow) > 0 {
			backCards = append(backCards, reverseRow...)
		}

		// Wrap the cards in grid containers with three columns
		frontCardGrid := Div(
			Class("grid grid-cols-3 gap-4"),
			Ch(frontCards),
		)
		backCardGrid := Div(
			Class("grid grid-cols-3 gap-4"),
			Ch(backCards),
		)

		// Render the complete HTML page with print styling and page breaks.
		// Two separate "page" divs are used:
		//   - The first page displays the card fronts.
		//   - The second page displays the card backs.
		render(w, r, DefaultLayout(Body(
			Style(Text(`
			.card {
				width: 2.5in !important;
				height: 3.5in !important;
			}
			@page {
				size: 8.5in 11in;
				margin: 1in;
			}
			@media print {
				body {
					-webkit-print-color-adjust: exact;
					print-color-adjust: exact;
				}
				.card {
					width: 2.5in !important;
					height: 3.5in !important;
				}
				.grid {
					gap: 0in;
				}
				.page {
					page-break-after: always;
				}
			}
		`)),
			Div(
				Class("p-4 space-y-64"),
				// Front page for card fronts:
				Div(
					Class("page"),
					frontCardGrid,
				),
				// Back page for card backs:
				Div(
					Class("page mt-4"),
					backCardGrid,
				),
			),
		)))
	})

	mux.HandleFunc("/{id...}", func(w http.ResponseWriter, r *http.Request) {
		u, err := d.Session.GetUserID(r.Context())
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		var user models.User
		if err := d.DB.First(&user, "id = ?", u).Error; err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		getOpList := func() *Node {
			opsL, err := op.List()
			if err != nil {
				return Div(Class("alert alert-error"), Text("Error fetching ops: "+err.Error()))
			}

			var groupList []*Node
			for _, e := range opsL {
				var g Op
				if err = json.Unmarshal(e.Data, &g); err != nil {
					return Div(Class("alert alert-error"), Text("Error fetching ops: "+err.Error()))
				}
				groupList = append(groupList, Li(
					Id("g_"+g.ID),
					Class("flex items-center justify-between gap-x-6 py-5"),
					Div(
						Class("min-w-0"),
						A(Href("/"+g.ID), Text(g.Name)),
					),
					Div(
						Class("flex flex-none- items-center gap-x-4"),
						A(
							Class("btn"),
							HxDelete("/"+g.ID),
							HxTarget("#group-list"),
							Text("delete"),
						),
					),
				))
			}
			return Ul(
				Id("group-list"),
				Class(""),
				Ch(groupList),
			)
		}

		id := r.PathValue("id")
		if id == "" {
			id = uuid.NewString()
			c := Op{
				ID:          id,
				Name:        "",
				Description: "",
				Image:       "",
			}
			if err := op.Set(id, c); err != nil {
				http.Error(w, "Error creating op", http.StatusInternalServerError)
				return
			}
			http.Redirect(w, r, fmt.Sprintf("/op/%s", id), http.StatusSeeOther)
			return
		}

		var o Op
		if id != "" {
			if err := op.Get(id, &o); err != nil {
				http.Error(w, "Error fetching op", http.StatusInternalServerError)
				return
			}
		}

		type ReportProps struct {
			ProviderURL string     `json:"provider_url"`
			Room        string     `json:"room"`
			Username    string     `json:"username"`
			Post        posts.Post `json:"post"`
		}
		props := ReportProps{
			ProviderURL: d.Config.Blog.YJSURL,
			Room:        "blog",
			Username:    user.Username,
			Post:        posts.Post{},
		}
		editorProps, err := json.Marshal(props)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		renderCards := func(o Op) *Node {
			return Div(
				Class("tabs tabs-border"),
				Input(AriaLabel("front"), Class("tab"), Type("radio"), Id("tab1"), Name("tabs"), Checked(true)),
				Div(
					Class("tab-content border-base-300 bg-base-100 p-10"),
					Div(
						Class("bg-black p-16"),
						Div(
							Class("mx-auto w-60 h-80 bg-rose-100 text-black grid grow place-content-center rounded-box border-8 border-white rounded-2xl"),
							Figure(
								Img(Src("https://img.daisyui.com/images/stock/photo-1606107557195-0e29a4b5b4aa.webp")),
							),
							Div(
								Class("card-body"),
								H2(Class("card-title justify-center"), Text(o.Name)),
								//P(Class("text-sm"), Text(o.Description)),
								//Div(
								//	Class("card-actions justify-end"),
								//	Div(
								//		Class("badge badge-outline"),
								//		Text("ID: "+o.ID),
								//	),
								//),
							),
						),
					),
				),
				Input(AriaLabel("back"), Class("tab"), Type("radio"), Id("tab2"), Name("tabs"), Checked(false)),
				Div(
					Class("tab-content border-base-300 bg-base-100 p-10"),
					Div(
						Class("bg-black p-16"),
						Div(
							Class("mx-auto w-60 h-80 bg-white text-black grid grow place-content-center rounded-box border-8 border-white rounded-2xl"),
							Div(
								Class("card-body"),
								P(Class("text-sm"), Text(o.Description)),
							),
						),
					),
				),
			)
		}

		switch r.Method {
		case http.MethodGet:
			render(w, r, DefaultLayout(
				Link(Attr("href", "/breadchris/static/editor.css"), Rel("stylesheet"), Type("text/css")),
				Div(
					Class("p-5 max-w-lg mx-auto"),
					Div(Class("text-sm text-center m-10"), T("hello, "+user.Username)),
					Div(Class("divider")),
					Form(
						Class("flex flex-col space-y-4"),
						HxPost("/"+id),
						HxTarget("#group-list"),
						Input(Class("input w-full"), Type("text"), Value(o.Name), Name("name"), Placeholder("Name")),
						Input(Class("input w-full"), Type("text"), Value(o.Description), Name("description"), Placeholder("Description")),
						renderCards(o),
						Button(Class("btn"), Type("submit"), Text("Save")),
					),
					Div(Class("divider")),
					Div(
						Input(Type("hidden"), Name("markdown"), Id("markdown")),
						Input(Type("hidden"), Name("blocknote"), Id("blocknote")),
						Input(Type("hidden"), Name("html"), Id("html")),
						Div(Id("editor"), Attrs(map[string]string{
							"props": string(editorProps),
						})),
					),
					Div(Id("error"), Class("alert alert-error hidden")),
					getOpList(),
				),
				Script(Attr("src", "/breadchris/static/editor.js"), Type("module")),
			))
		case http.MethodPost:
			if err := r.ParseForm(); err != nil {
				http.Error(w, err.Error(), http.StatusInternalServerError)
				return
			}
			if id == "" {
				id = uuid.NewString()
			}
			o = Op{
				ID:          id,
				Name:        r.FormValue("name"),
				Description: r.FormValue("description"),
			}

			if err := op.Set(id, o); err != nil {
				http.Error(w, err.Error(), http.StatusInternalServerError)
				return
			}

			render(w, r, getOpList())
		case http.MethodPut:
			if id == "" {
				http.Error(w, "Missing group ID", http.StatusBadRequest)
				return
			}

			render(w, r, getOpList())
		case http.MethodDelete:
			if id == "" {
				http.Error(w, "Missing group ID", http.StatusBadRequest)
				return
			}

			if err := op.Delete(id); err != nil {
				http.Error(w, err.Error(), http.StatusInternalServerError)
				return
			}
			render(w, r, getOpList())
		}
	})
	return mux
}
