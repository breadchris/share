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
		type Cheese struct {
			Name, Description, Image string
		}
		cheeses := []Cheese{
			{
				Name:        "brie",
				Description: "This French cow's milk cheese is rich, mild, and creamy, and it's soft enough to spread easily on crackers or bread. Look for French Bries. The rind is edible. For best flavor, wait until it's perfectly ripe and warmed to room temperature before serving it.",
				Image:       "https://files.foodsubs.com/photos/Photos/brie.jpg",
			},
			{
				Name:        "cheddar",
				Description: "The curds of many English cow's milk cheeses are \"cheddared\" or cut them into slabs and stacked to allow whey to drain off. Some cheddars have more lactose in them, making them \"sharp\" or acidic. England supplies many fine Cheddars, as does Vermont and Tillamook, Oregon.",
				Image:       "https://files.foodsubs.com/photos/Photos/cheddar.jpg",
			},
			{
				Name:        "gouda",
				Description: "This Dutch cow's milk cheese has a mild, nutty flavor. Varieties include smoked Gouda, the diminutive baby Gouda, and Goudas flavored with garlic and spices. Goudas are also classed by age. A young Gouda is mild, an aged Gouda is more assertive, and an old Gouda is downright pungent.",
				Image:       "https://files.foodsubs.com/photos/Photos/goudacheese.jpg",
			},
			{
				Name:        "swiss",
				Description: "This popular cow's milk cheese is an American knock-off of Switzerland's Emmentaler cheese. This difference is that our domestic version usually has smaller eyes (making it easier to slice) and is made from pasteurized milk. Emmentaler has a richer, nuttier flavor.",
				Image:       "https://files.foodsubs.com/photos/Photos/swisscheese.jpg",
			},
			{
				Name:        "blue cheese",
				Description: "Cheese was left to age in some moldy cave and became streaked with bluish-green mold. The mold gave it a pungent and distinctive flavor, and blue cheese was born. Since then, cheese-makers learned to inject or stir mold spores into different cheeses, and many still use caves to age them.",
				Image:       "https://files.foodsubs.com/photos/Photos/roquefortcheese.jpg",
			},
			{
				Name:        "parmesan",
				Description: "This firm cow's milk cheese is pungent, nutty, and salty, and it's terrific grated on salads, pasta, or pizzas, or served simply with figs, pears, or crusty bread. The best parmesan is the Northern Italian Parmigiano-Reggiano, but less pricy domestic parmesans are also well regarded. Aging increases the price and flavor.",
				Image:       "https://files.foodsubs.com/photos/Photos/parmesan3.jpg",
			},
			{
				Name:        "camembert",
				Description: "This popular soft-ripened cow's milk cheese is buttery rich and wonderful to spread on hot French bread. Try to get a French raw milk Camembert--our pasteurized domestic versions are bland in comparison. Use within a few days after purchasing. For best flavor, serve at room temperature.",
				Image:       "https://files.foodsubs.com/photos/Photos/camembertcheese.jpg",
			},
			{
				Name:        "feta",
				Description: "This salty, crumbly cheese is common in Greek cuisine. It is made from sheep's milk sometimes combined with goat's milk. It's often stored in brine; if so, you might want to rinse it before using to remove some of the saltiness. Use within a few days after purchasing. For best flavor, serve at room temperature.",
				Image:       "https://files.foodsubs.com/photos/Photos/greekfetacheese.jpg",
			},
			{
				Name:        "mozzarella",
				Description: "Soft, white Italian cheese. The most common type is low-moisture mozzarella, which is often sold in bricks or firm balls, or is shredded and sold in bags. Don't confuse it with fresh mozzarella = high-moisture mozzarella, which is a fresh cheese used for salads and appetizers, and is often sold in tubs of water",
				Image:       "https://files.foodsubs.com/photos/j8ZY69xFaVZVi9T2",
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
						P(Class("card-text text-center"), Text(cheese.Description)),
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
