package xctf

import (
	"bytes"
	"context"
	"crypto/md5"
	"database/sql"
	"encoding/base64"
	"encoding/gob"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"github.com/breadchris/share/breadchris/posts"
	"github.com/breadchris/share/deps"
	. "github.com/breadchris/share/html"
	mmodels "github.com/breadchris/share/models"
	"github.com/breadchris/share/xctf/chalgen"
	"github.com/breadchris/share/xctf/models"
	"github.com/dsoprea/go-exif/v3"
	jis "github.com/dsoprea/go-jpeg-image-structure/v2"
	"github.com/google/gopacket"
	"github.com/google/gopacket/layers"
	"github.com/google/gopacket/pcapgo"
	"github.com/google/uuid"
	"github.com/russross/blackfriday/v2"
	"github.com/sashabaranov/go-openai"
	"github.com/sashabaranov/go-openai/jsonschema"
	"github.com/yeka/zip"
	"gorm.io/gorm"
	"html/template"
	"io"
	"log"
	"log/slog"
	"math/rand"
	"net"
	"net/http"
	"net/url"
	"os"
	"path"
	"path/filepath"
	"strconv"
	"strings"
	"time"
	"unicode"
)

func init() {
	gob.Register(PhoneState{})
}

type GroupState struct {
	Graph  Graph      `json:"graph"`
	Report posts.Post `json:"report"`
}

// TODO add base url
func New(d deps.Deps) *http.ServeMux {
	m := http.NewServeMux()
	db := d.DB

	// TODO breadchris fix this
	if d.BaseURL == "" {
		d.BaseURL = "/xctf"
	}
	if d.BaseURL == "/" {
		d.BaseURL = ""
	}

	render := func(w http.ResponseWriter, r *http.Request, page *Node) {
		ctx := context.WithValue(r.Context(), "baseURL", func() string {
			if d.BaseURL == "/" {
				return ""
			}
			return d.BaseURL
		}())
		page.RenderPageCtx(ctx, w, r)
	}

	groupM := NewGroup(d)
	m.Handle("/group/", http.StripPrefix("/group", groupM))

	m.HandleFunc("/report/", func(w http.ResponseWriter, r *http.Request) {
		var c models.Competition
		if err := db.First(&c, "active = true").Error; err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		switch r.Method {
		case http.MethodPut:
			u, err := d.Session.GetUserID(r.Context())
			if err != nil {
				http.Error(w, err.Error(), http.StatusUnauthorized)
				return
			}

			g, err := io.ReadAll(r.Body)
			if err != nil {
				http.Error(w, err.Error(), http.StatusBadRequest)
				return
			}

			var (
				cr models.CompetitionGroup
			)
			er := db.
				Model(&models.CompetitionGroup{}).
				Joins("JOIN groups ON groups.id = competition_groups.group_id").
				Joins("JOIN group_memberships ON group_memberships.group_id = groups.id").
				Where("competition_groups.competition_id = ? AND group_memberships.user_id = ?", c.ID, u).
				First(&cr).Error
			if er != nil {
				if !errors.Is(er, gorm.ErrRecordNotFound) {
					http.Error(w, er.Error(), http.StatusInternalServerError)
					return
				}
			}

			cr.Report = string(g)
			if err := db.Save(&cr).Error; err != nil {
				http.Error(w, err.Error(), http.StatusInternalServerError)
				return
			}
			w.WriteHeader(http.StatusNoContent)
		}
	})

	m.HandleFunc("/graph/", func(w http.ResponseWriter, r *http.Request) {
		var c models.Competition
		if err := db.First(&c, "active = true").Error; err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		var gr chalgen.Graph
		if err := json.Unmarshal([]byte(c.Graph), &gr); err != nil {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}
		switch r.Method {
		case http.MethodPut:
			u, err := d.Session.GetUserID(r.Context())
			if err != nil {
				http.Error(w, fmt.Errorf("unable to get user id: %w", err).Error(), http.StatusUnauthorized)
				return
			}

			var g Graph
			if err := json.NewDecoder(r.Body).Decode(&g); err != nil {
				http.Error(w, fmt.Errorf("unable to decode graph: %w", err).Error(), http.StatusBadRequest)
				return
			}

			for i, n := range g.Nodes {
				for _, gn := range gr.Nodes {
					if gn.Flag == n.Data["label"] {
						g.Nodes[i].Data["flag"] = gn.Flag
					}
				}
			}

			var (
				cr models.CompetitionGroup
			)
			er := db.
				Model(&models.CompetitionGroup{}).
				Joins("JOIN groups ON groups.id = competition_groups.group_id").
				Joins("JOIN group_memberships ON group_memberships.group_id = groups.id").
				Where("competition_groups.competition_id = ? AND group_memberships.user_id = ?", c.ID, u).
				First(&cr).Error
			if er != nil {
				if !errors.Is(er, gorm.ErrRecordNotFound) {
					http.Error(w, er.Error(), http.StatusInternalServerError)
					return
				}
			}

			cg, err := json.Marshal(g)
			if err != nil {
				http.Error(w, err.Error(), http.StatusInternalServerError)
				return
			}
			cr.Graph = string(cg)
			if err := db.Save(&cr).Error; err != nil {
				http.Error(w, err.Error(), http.StatusInternalServerError)
				return
			}
			w.Header().Set("Content-Type", "application/json")
			w.Write(cg)
		}
	})

	m.HandleFunc("/shell", func(w http.ResponseWriter, r *http.Request) {
		Iframe(Src("https://shell.mcpshsf.com"), Attr("style", "width: 100%; height: 600px;")).RenderPage(w, r)
	})

	m.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		routingMap := map[string]http.Handler{
			"g3tl0st.2025.mcpshsf.com": CreateReverseProxy("http://localhost:9000/"),
		}

		host := r.Host
		if handler, found := routingMap[host]; found {
			handler.ServeHTTP(w, r)
			return
		}
		inviteCode := r.URL.Query().Get("invite")
		u, err := d.Session.GetUserID(r.Context())
		if err != nil {
			ru := "/login?next="
			if inviteCode != "" {
				ru += url.QueryEscape(d.BaseURL + "?invite=" + inviteCode)
			}
			http.Redirect(w, r, ru, http.StatusFound)
			return
		}

		var comp models.Competition
		res := d.DB.Where("active = true").First(&comp)
		if res.Error != nil {
			http.NotFound(w, r)
			return
		}

		var (
			gs models.CompetitionGroup
		)
		er := db.
			Model(&models.CompetitionGroup{}).
			// Join the groups table via the CompetitionGroup.GroupID relation.
			Joins("JOIN groups ON groups.id = competition_groups.group_id").
			// Join the group_memberships table to filter on userID.
			Joins("JOIN group_memberships ON group_memberships.group_id = groups.id").
			Where("competition_groups.competition_id = ? AND group_memberships.user_id = ?", comp.ID, u).
			First(&gs).Error
		if er != nil {
			if !errors.Is(er, gorm.ErrRecordNotFound) {
				http.Error(w, er.Error(), http.StatusInternalServerError)
				return
			}
		}

		authorized := inviteCode == comp.ID

		now := time.Now().UTC()
		if gs.ID == "" && (!comp.Active || !authorized) && (now.Before(comp.Start) || now.After(comp.End)) {
			render(
				w, r, DefaultLayout(
					Div(
						Class("flex items-center"),
						Div(Class("text-xl text-center m-10"), T("competition starts:")),
						Input(
							Class("input"),
							Type("datetime-local"),
							Name("start"),
							Placeholder("Start"),
							Attr("disabled", "true"),
							Value(comp.Start.Format("2006-01-02T15:04")),
						),
					),
				),
			)
			return
		}

		var graph chalgen.Graph
		if err := json.Unmarshal([]byte(comp.Graph), &graph); err != nil {
			slog.Error("unable to unmarshal graph", "error", err)
			http.NotFound(w, r)
			return
		}

		entrypointURL := (func() string {
			for _, n := range graph.Nodes {
				if n.Entrypoint {
					return fmt.Sprintf("/competition/%s/%s", comp.ID, n.ID)
				}
			}
			return ""
		})()

		user := mmodels.User{}
		if err := db.First(&user, "id = ?", u).Error; err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		var (
			tabs  []*Node
			group mmodels.Group
		)
		if gs.ID != "" {
			if err := db.Preload("Members.User").First(&group, "id = ?", gs.GroupID).Error; err != nil {
				http.Error(w, err.Error(), http.StatusInternalServerError)
				return
			}

			var (
				g  Graph
				ps posts.Post
			)
			if err := json.Unmarshal([]byte(gs.Graph), &g); err != nil {
				http.Error(w, err.Error(), http.StatusInternalServerError)
				return
			}
			if err := json.Unmarshal([]byte(gs.Report), &ps); err != nil {
				http.Error(w, err.Error(), http.StatusInternalServerError)
				return
			}

			type Props struct {
				Id      string `json:"id"`
				Graph   Graph  `json:"graph"`
				SaveURL string `json:"saveURL"`
			}

			p := Props{
				Id:      group.ID,
				Graph:   g,
				SaveURL: d.BaseURL + "/graph/",
			}
			sg, err := json.Marshal(p)
			if err != nil {
				http.Error(w, err.Error(), http.StatusInternalServerError)
				return
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
				Username:    u,
				Post:        ps,
			}
			editorProps, err := json.Marshal(props)
			if err != nil {
				http.Error(w, err.Error(), http.StatusInternalServerError)
				return
			}

			tabs = append(tabs,
				Input(AriaLabel("graph"), Class("tab"), Type("radio"), Id("tab1"), Name("tabs"), Checked(true)),
				Div(
					Class("tab-content border-base-300 bg-base-100 p-10"),
					Link(Attr("rel", "stylesheet"), Attr("type", "text/css"), Attr("href", "/static/xctf/graph.css")),
					Style(Text(style)),
					Div(Id("graph"), Attr("data-props", string(sg))),
					Script(Attr("src", "/static/xctf/graph.js"), Attr("type", "module")),
				),
				Input(AriaLabel("report"), Class("tab"), Type("radio"), Id("tab2"), Name("tabs")),
				Div(
					Class("tab-content border-base-300 bg-base-100 p-10"),
					Div(Id("editor"), Attrs(map[string]string{
						"props": string(editorProps),
					})),
				),
				Input(AriaLabel("shell"), Class("tab"), Type("radio"), Id("tab2"), Name("tabs")),
				Div(
					Class("tab-content border-base-300 bg-base-100 p-10"),
					P(Class("text-gray-400"), T("NOTE! when you lose this connection, you will lose your data. don't get too attached, take notes and save them.")),
					Button(Class("btn"), HxGet("/shell"), HxTarget("#shell"), Text("connect")),
					Div(Id("shell")),
				),
			)
		}

		renderer := blackfriday.NewHTMLRenderer(blackfriday.HTMLRendererParameters{})
		b := blackfriday.Run([]byte(graph.Message), blackfriday.WithRenderer(renderer))
		render(w, r, DefaultLayout(
			Div(
				Class("p-5 max-w-7xl mx-auto"),
				Div(Class("flex items-center justify-between gap-x-6 py-5"),
					Div(Class("text-sm text-center m-10"), T("hello, "+user.Username)),
					A(Class("btn btn-ghost"), Attr("href", "/logout"), Text("logout")),
				),
				Div(Class("divider")),
				If(entrypointURL != "", Div(
					Class("text-md text-center"),
					Raw(string(b)),
					P(Class("m-4")),
					A(Class("btn"), Href(entrypointURL), Text("start here")),
					Div(Class("divider")),
				), Nil()),
				P(Class("text-gray-400"), T("the evidence builder isn't perfect, it is recommended that only one team member makes changes to the graph and report at a time.")),
				Div(
					Class("tabs tabs-border"),
					Ch(tabs),
					Input(AriaLabel("group"), Class("tab"), Type("radio"), Id("tab3"), Name("tabs"), If(len(tabs) == 0, Checked(true), Nil())),
					Div(
						Class("tab-content border-base-300 bg-base-100 p-10"),
						groupComponent(GroupCompState{
							Group:         group,
							CompetitionID: comp.ID,
						}),
					),
					Input(AriaLabel("chat"), Class("tab"), Type("radio"), Id("tab4"), Name("tabs")),
					Div(
						Class("tab-content border-base-300 bg-base-100 p-10"),
						Iframe(Src("https://irc.mcpshsf.com"), Attr("style", "width: 100%; height: 600px;")),
					),
					Input(AriaLabel("music"), Class("tab"), Type("radio"), Id("tab5"), Name("tabs")),
					Div(
						Class("tab-content border-base-300 bg-base-100 p-10"),
						Iframe(Src("https://music.mcpshsf.com"), Attr("style", "width: 100%; height: 600px;")),
					),
				),
			),
		))
	})

	m.HandleFunc("/gps", func(w http.ResponseWriter, r *http.Request) {
		switch r.Method {
		case http.MethodPost:
		case http.MethodGet:
			DefaultLayout(
				Div(
					Link(Attr("rel", "stylesheet"), Attr("href", "https://unpkg.com/leaflet/dist/leaflet.css")),
					Div(
						Class("flex"),
						Div(
							Id("map"),
							Attr("style", "height: 400px; width: 70%;"),
						),
						Div(
							Id("sidebar"),
							Attr("style", "width: 30%; padding-left: 10px;"),
							H3(Text("Points List")),
							Ul(Id("pointsList")),
							P(Text("Click a point to select it for insertion of the next marker.")),
						),
					),
					Button(
						Id("saveBtn"),
						Class("btn"),
						Text("Save GPX"),
					),
					Script(
						Attr("src", "https://unpkg.com/leaflet/dist/leaflet.js"),
					),
					Script(Attr("src", "https://cdnjs.cloudflare.com/ajax/libs/leaflet-gpx/1.7.0/gpx.min.js")),
					Script(Raw(`
document.addEventListener('DOMContentLoaded', function() {
    // Initialize the map.
    var map = L.map('map').setView([51.505, -0.09], 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    //var gpxLayer = new L.GPX("/path/to/your.gpx", {
    //    async: true
    //}).on('loaded', function(e) {
    //    // Adjust the map's view to the bounds of the GPX track.
    //    map.fitBounds(e.target.getBounds());
    //}).addTo(map);

    // Array to store marker objects in order.
    var markers = [];
    // Index of the currently selected point for insertion (-1 means no selection).
    var selectedIndex = -1;
    // Create a polyline that will connect the marker points.
    var polyline = L.polyline([], { color: 'blue' }).addTo(map);

    // Function to update the polyline connecting all markers.
    function updatePolyline() {
        var latlngs = markers.map(function(marker) {
            return marker.getLatLng();
        });
        polyline.setLatLngs(latlngs);
    }

    // Function to update the sidebar list of points.
    function updatePointsList() {
        var list = document.getElementById('pointsList');
        list.innerHTML = '';
        markers.forEach(function(marker, index) {
            var li = document.createElement('li');
            var latlng = marker.getLatLng();
            li.textContent = 'Point ' + (index + 1) + ': (' + latlng.lat.toFixed(4) + ', ' + latlng.lng.toFixed(4) + ')';
            li.style.cursor = 'pointer';
            li.style.padding = '4px';
            li.style.border = '1px solid #ccc';
            li.style.marginBottom = '4px';
            li.style.backgroundColor = (index === selectedIndex) ? '#ddd' : '';
            li.addEventListener('click', function() {
                // Toggle selection: clicking an already-selected point deselects it.
                selectedIndex = (selectedIndex === index) ? -1 : index;
                updatePointsList();
            });
            list.appendChild(li);
        });
    }

    // Map click event: add a new marker.
    map.on('click', function(e) {
        var latlng = e.latlng;
        var marker = L.marker(latlng).addTo(map);
        
        // If a point is selected in the list, insert after that point.
        if (selectedIndex >= 0 && selectedIndex < markers.length) {
            markers.splice(selectedIndex + 1, 0, marker);
            // Reset selection after insertion.
            selectedIndex = -1;
        } else {
            // Otherwise, add the marker to the end.
            markers.push(marker);
        }
        
        // Attach a click handler to remove the marker.
        marker.on('click', function(ev) {
            // Prevent the map click event from firing.
            ev.originalEvent.stopPropagation();
            var idx = markers.indexOf(marker);
            if (idx !== -1) {
                markers.splice(idx, 1);
                // Adjust selectedIndex if needed.
                if (selectedIndex === idx) {
                    selectedIndex = -1;
                } else if (selectedIndex > idx) {
                    selectedIndex--;
                }
                map.removeLayer(marker);
                updatePolyline();
                updatePointsList();
            }
        });
        
        updatePolyline();
        updatePointsList();
    });

    // Save GPX button: build GPX XML and post it to the backend.
    document.getElementById('saveBtn').addEventListener('click', function() {
        var gpx = '<?xml version="1.0" encoding="UTF-8"?>\n';
        gpx += '<gpx version="1.1" creator="LeafletGPXApp">\n';
        gpx += '<trk><name>Track</name><trkseg>\n';
        markers.forEach(function(marker) {
            var latlng = marker.getLatLng();
            gpx += '<trkpt lat="' + latlng.lat + '" lon="' + latlng.lng + '"></trkpt>\n';
        });
        gpx += '</trkseg></trk>\n';
        gpx += '</gpx>';
        
        fetch('/savegpx', {
            method: 'POST',
            headers: { 'Content-Type': 'application/xml' },
            body: gpx
        }).then(function(response) {
            if (response.ok) {
                alert('GPX saved successfully!');
            } else {
                alert('Error saving GPX.');
            }
        });
    });
});
			`)),
				),
			).RenderPageCtx(r.Context(), w, r)
		}
	})

	m.HandleFunc("/map", func(w http.ResponseWriter, r *http.Request) {
		http.ServeFile(w, r, "xctf/index.html")
	})

	m.HandleFunc("/map/main.css", func(w http.ResponseWriter, r *http.Request) {
		http.ServeFile(w, r, "xctf/main.css")
	})

	m.HandleFunc("/map/script.js", func(w http.ResponseWriter, r *http.Request) {
		http.ServeFile(w, r, "xctf/script.js")
	})

	uploadDir := func(id string) string {
		return path.Join("data/xctf/", id)
	}

	m.HandleFunc("/competition/{id}/upload", func(w http.ResponseWriter, r *http.Request) {
		id := r.PathValue("id")
		switch r.Method {
		case http.MethodPost:
			r.ParseMultipartForm(10 << 20)

			f, h, err := r.FormFile("file")
			if err != nil {
				http.Error(w, err.Error(), http.StatusInternalServerError)
				return
			}
			defer f.Close()

			if h.Size > 10*1024*1024 {
				http.Error(w, "File is too large must be < 10mb", http.StatusBadRequest)
				return
			}

			ext := filepath.Ext(h.Filename)

			ud := uploadDir(id)
			if err = os.MkdirAll(ud, os.ModePerm); err != nil {
				http.Error(w, err.Error(), http.StatusInternalServerError)
				return
			}

			name := path.Join(ud, uuid.NewString()+ext)
			o, err := os.Create(name)
			if err != nil {
				http.Error(w, err.Error(), http.StatusInternalServerError)
				return
			}
			defer o.Close()

			if _, err = io.Copy(o, f); err != nil {
				http.Error(w, err.Error(), http.StatusInternalServerError)
				return
			}

			// TODO https
			http.Redirect(w, r, d.BaseURL+"/competition/"+id, http.StatusFound)
			return
		}
		w.Write([]byte("invalid method"))
	})

	adminRouteMiddleware := func(next http.HandlerFunc) http.HandlerFunc {
		return func(w http.ResponseWriter, r *http.Request) {
			u, err := d.Session.GetUserID(r.Context())
			if err != nil {
				http.Redirect(w, r, fmt.Sprintf("/login?next=%s/admin", d.BaseURL), http.StatusFound)
				return
			}

			var user mmodels.User
			if err := db.Preload("GroupMemberships.Group").First(&user, "id = ?", u).Error; err != nil {
				http.Error(w, err.Error(), http.StatusInternalServerError)
				return
			}

			for _, gm := range user.GroupMemberships {
				if gm.Group.Name == "xctf-2025" {
					next(w, r)
					return
				}
			}
			http.Error(w, "unauthorized", http.StatusUnauthorized)
		}
	}
	m.HandleFunc("/competition/{id...}", adminRouteMiddleware(func(w http.ResponseWriter, r *http.Request) {
		// TODO breadchris sweet jesus
		baseURL := d.BaseURL
		if baseURL == "" {
			baseURL = "/"
		}
		ctx := context.WithValue(r.Context(), "baseURL", path.Join(baseURL, "competition"))

		u, err := d.Session.GetUserID(r.Context())
		if err != nil {
			http.Redirect(w, r, "/login?next="+d.BaseURL, http.StatusFound)
			return
		}
		var user mmodels.User
		if err := db.First(&user, "id = ?", u).Error; err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		getGroupList := func() *Node {
			var competitions []models.Competition
			if err := db.Find(&competitions).Error; err != nil {
				return Div(Text(err.Error()))
			}
			var competitionList []*Node
			for _, g := range competitions {
				competitionList = append(competitionList, Li(
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
							HxTarget("#competition-list"),
							Text("delete"),
						),
					),
				))
			}
			return Ul(
				Id("competition-list"),
				Class(""),
				Ch(competitionList),
			)
		}

		id := r.PathValue("id")

		switch r.Method {
		case http.MethodGet:
			var (
				competition models.Competition
				g           chalgen.Graph
			)
			if id != "" {
				if err := db.First(&competition, "id = ?", id).Error; err != nil {
					// TODO breadchris
					w.Header().Set("HX-Target", "#error")
					w.Write([]byte(err.Error()))
					return
				}

				if err := json.Unmarshal([]byte(competition.Graph), &g); err != nil {
					http.Error(w, err.Error(), http.StatusInternalServerError)
					return
				}
			}

			props := map[string]string{
				"fileName": "chal.yaml",
				"code":     competition.Graph,
				//"serverURL": fmt.Sprintf("%s/code/ws", d.Config.ExternalURL),
			}
			mp, err := json.Marshal(props)
			if err != nil {
				http.Error(w, err.Error(), http.StatusInternalServerError)
				return
			}

			ud := uploadDir(id)
			if err = os.MkdirAll(ud, os.ModePerm); err != nil {
				http.Error(w, err.Error(), http.StatusInternalServerError)
				return
			}

			files, err := os.ReadDir(ud)
			if err != nil {
				http.Error(w, err.Error(), http.StatusInternalServerError)
				return
			}

			DefaultLayout(
				Div(
					Class("p-5 max-w-7xl mx-auto"),
					Div(Class("text-sm text-center m-10"), T("hello, "+user.Username)),
					Div(Class("divider")),
					Div(Class("text-lg"), Text("competitions")),
					Div(Id("error"), Class("alert alert-error hidden")),
					Div(Class("divider")),
					Form(
						Class("flex flex-col space-y-4"),
						Div(Text("new competition")),
						HxPost("/"),
						HxTarget("#competition-list"),
						Input(Class("input"), Type("text"), Value(competition.Name), Name("name"), Placeholder("Name")),
						Button(Class("btn"), Type("submit"), Text("Save")),
					),
					Div(Class("divider")),
					getGroupList(),
					Div(Class("divider")),
					Div(
						Form(
							Class("flex flex-col space-y-4"),
							Div(Text("update competition")),
							HxPost("/"+id),
							HxTarget("#competition-list"),
							A(Href(d.BaseURL+"/?invite="+competition.ID), T("invite")),
							//BuildFormCtx(BuildCtx{
							//	CurrentFieldPath: "",
							//	Name:             "competition",
							//}, competition),
							Input(Class("input"), Type("text"), Value(competition.Name), Name("name"), Placeholder("Name")),
							P(T("times in UTC, est is UTC-4, pst is UTC-7")),
							Input(Class("input"), Type("datetime-local"), Value(competition.Start.Format("2006-01-02T15:04")), Name("start"), Placeholder("Start")),
							Input(Class("input"), Type("datetime-local"), Value(competition.End.Format("2006-01-02T15:04")), Name("end"), Placeholder("End")),
							Div(
								Class("form-control"),
								Label(
									Class("label cursor-pointer"),
									Span(Class("label-text"), Text("active")),
									Input(Type("checkbox"), Name("active"), Checked(competition.Active), Class("checkbox checkbox-primary")),
								),
							),
							Input(Class("input"), Id("competition-graph"), Type("hidden"), Value(competition.Graph), Name("graph")),
							Button(Class("btn"), Type("submit"), Text("Save")),
						),
						Div(
							Script(Attr("src", "/static/leapclient.js")),
							Script(Attr("src", "/static/leap-bind-textarea.js")),
							Link(Rel("stylesheet"), Attr("href", "/static/code/monaco.css")),
							Div(Class("w-full h-full"), Id("monaco-editor"), Attr("data-props", string(mp))),
							Script(Attr("src", "/static/code/monaco.js"), Attr("type", "module")),
						),
						Div(
							Class("grid grid-cols-4 gap-4"),
							Ch(func() []*Node {
								var chals []*Node
								for _, n := range g.Nodes {
									chals = append(chals, Div(
										Class("card shadow-xl"),
										Div(
											Class("card-body"),
											Div(Class("card-title"), Text(n.Name)),
											Div(Class("card-actions justify-end"),
												A(Class("btn"), Href("/"+id+"/"+n.ID), Text("view")),
												A(Class("btn"), Href("/"+id+"/"+n.ID+"/ai"), Text("ai")),
											),
										),
									))
								}
								return chals
							}()),
						),
					),
					Div(Class("divider")),
					Div(
						H1(T("Upload a File")),
						Form(Method("POST"), Action("/"+id+"/upload"), Attr("enctype", "multipart/form-data"),
							Input(Type("file"), Id("file"), Name("file"), Attr("required", "true")),
							Button(Type("submit"), T("Submit")),
						),
						Ul(
							func() *Node {
								var nodes []*Node
								for _, f := range files {
									nodes = append(nodes, Li(A(Attr("href", "/data/xctf/"+id+"/"+f.Name()), Text(f.Name()))))
								}
								return Ch(nodes)
							}(),
						),
					),
				),
			).RenderPageCtx(ctx, w, r)
		case http.MethodPost:
			if err := r.ParseForm(); err != nil {
				http.Error(w, err.Error(), http.StatusInternalServerError)
				return
			}

			var competition models.Competition
			if id != "" {
				if err := db.First(&competition, "id = ?", id).Error; err != nil {
					// TODO breadchris
					w.Header().Set("HX-Target", "#error")
					w.Write([]byte(err.Error()))
					return
				}
			} else {
				g, err := json.MarshalIndent(chalgen.Graph{
					Nodes: []chalgen.GraphNode{
						{
							ID:   "start",
							Name: "start",
							Challenge: &chalgen.Challenge{
								Type: "base64",
								Value: &chalgen.Base64{
									Data: "start",
								},
							},
						},
					},
				}, "", "  ")
				if err != nil {
					http.Error(w, err.Error(), http.StatusInternalServerError)
					return
				}
				competition = models.Competition{
					ID:    uuid.NewString(),
					Graph: string(g),
				}
			}

			competition.Name = r.FormValue("name")
			if r.FormValue("graph") != "" {
				if err := json.Unmarshal([]byte(r.FormValue("graph")), &chalgen.Graph{}); err != nil {
					w.Header().Set("HX-Target", "#error")
					w.Write([]byte(err.Error()))
					return
				}
				competition.Graph = r.FormValue("graph")
			}
			if r.FormValue("active") == "on" {
				competition.Active = true
			} else {
				competition.Active = false
			}

			if id == "" {
				competition.Start = time.Now().Add(time.Hour * 24)
				competition.End = time.Now().Add(time.Hour * 24 * 2)
				if err := db.Create(&competition).Error; err != nil {
					http.Error(w, "Error creating competition: "+err.Error(), http.StatusInternalServerError)
					return
				}
			} else {
				competition.Start, err = time.Parse("2006-01-02T15:04", r.FormValue("start"))
				if err != nil {
					http.Error(w, err.Error(), http.StatusInternalServerError)
					return
				}
				competition.End, err = time.Parse("2006-01-02T15:04", r.FormValue("end"))
				if err != nil {
					http.Error(w, err.Error(), http.StatusInternalServerError)
					return
				}
				if err := db.Save(&competition).Error; err != nil {
					http.Error(w, "Error updating competition: "+err.Error(), http.StatusInternalServerError)
					return
				}
			}
			getGroupList().RenderPageCtx(ctx, w, r)
		case http.MethodDelete:
			if id == "" {
				http.Error(w, "Missing competition ID", http.StatusBadRequest)
				return
			}

			if err := db.Delete(&models.Competition{
				ID: id,
			}).Error; err != nil {
				http.Error(w, "Error deleting competition: "+err.Error(), http.StatusInternalServerError)
				return
			}
			getGroupList().RenderPageCtx(ctx, w, r)
		}
	}))
	m.HandleFunc("/competition/{compid}/{chalid}/ai", func(w http.ResponseWriter, r *http.Request) {
		var t chalgen.CMS
		schema, err := jsonschema.GenerateSchemaForType(t)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		msgParts := []openai.ChatMessagePart{
			{
				Type: openai.ChatMessagePartTypeText,
				Text: fmt.Sprintf(`
Consider the following story:
A library database was hacked and the hacker deleted all the records of the library database. The library database contained information about the books, authors, and the users who borrowed the books. The library database was used by the library staff to manage the library. The library staff noticed that the library database was hacked when they tried to access the library database and found that all the records were deleted. The library staff contacted the cyber forensic team to investigate the incident. The cyber forensic team investigated the incident and found that the hacker used a malware to hack the library database. The cyber forensic team analyzed the malware and found that the malware was designed to delete all the records of the library database. The cyber forensic team traced the IP address of the hacker to a foreign country. The cyber forensic team contacted the law enforcement agencies in the foreign country and provided them with the IP address of the hacker. The law enforcement agencies in the foreign country investigated the incident and arrested the hacker. The hacker confessed to hacking the library database and deleting all the records. The law enforcement agencies recovered the deleted records of the library database and restored the library database.

Based on this story, generate a cyber forensic chat evidence for the library database. Include the book Hacker Recipes.
Add real books about cybersecurity and programming adjacent topics to the library database. Include 30 books.
`),
			},
		}

		request := openai.ChatCompletionRequest{
			Model: openai.GPT4oMini,
			Messages: []openai.ChatCompletionMessage{
				{
					Role: "system",
					Content: `you are an expert story teller who specializes in telling cyber forensic stories.
You will generate cyber forensic evidence based on a provided story line and type of evidence to generate.`,
				},
				{
					Role:         "user",
					MultiContent: msgParts,
				},
			},
			ResponseFormat: &openai.ChatCompletionResponseFormat{
				Type: openai.ChatCompletionResponseFormatTypeJSONSchema,
				JSONSchema: &openai.ChatCompletionResponseFormatJSONSchema{
					Name:   "schema",
					Schema: schema,
					Strict: true,
				},
			},
		}

		res, err := d.AI.CreateChatCompletion(context.Background(), request)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		for _, choice := range res.Choices {
			if choice.Message.Role == "assistant" {
				err := json.Unmarshal([]byte(choice.Message.Content), &t)
				if err != nil {
					http.Error(w, err.Error(), http.StatusInternalServerError)
					return
				}
			}
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(t)
	})
	m.HandleFunc("/competition/{compid}/{chalid}", Handle(d))
	m.HandleFunc("/competition/{compid}/{chalid}/{path...}", Handle(d))

	//g := NewGraph(d)
	m.HandleFunc("/graph", func(w http.ResponseWriter, r *http.Request) {
		switch r.Method {
		case http.MethodPost:
			var g chalgen.Graph
			if err := json.NewDecoder(r.Body).Decode(&g); err != nil {
				http.Error(w, err.Error(), http.StatusBadRequest)
				return
			}
		}
	})

	return m
}

func neuter(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if strings.HasSuffix(r.URL.Path, "/") {
			http.NotFound(w, r)
			return
		}

		next.ServeHTTP(w, r)
	})
}

func Handle(d deps.Deps) http.HandlerFunc {
	ChalURL := func(scheme, compId, chalID, host string) string {
		path := fmt.Sprintf("%s/competition/%s/%s", d.BaseURL, compId, chalID)
		if host == "" {
			return path
		}
		u := url.URL{
			// TODO breadchris check if the original request was https
			Scheme: scheme,
			Host:   host,
			Path:   path,
		}
		return u.String()
	}
	return func(w http.ResponseWriter, r *http.Request) {
		compId := r.PathValue("compid")
		chalId := r.PathValue("chalid")
		p := r.PathValue("path")

		baseURL := Fmt("%s/competition/%s/%s", d.BaseURL, compId, chalId)
		ctx := context.WithValue(r.Context(), "baseURL", baseURL)

		//baseURL := fmt.Sprintf("/play/%s/%s", compId, chalId)

		var comp models.Competition
		res := d.DB.Where("id = ?", compId).Take(&comp)
		if res.Error != nil {
			http.NotFound(w, r)
			return
		}

		u, err := d.Session.GetUserID(r.Context())
		if err != nil {
			slog.Debug("user not logged in", "err", err)
			http.Error(w, "user not logged in", http.StatusUnauthorized)
			return
		}

		now := time.Now().UTC()
		if !comp.Active || now.Before(comp.Start) || now.After(comp.End) {
			var (
				gs models.CompetitionGroup
			)
			er := d.DB.
				Model(&models.CompetitionGroup{}).
				Joins("JOIN groups ON groups.id = competition_groups.group_id").
				Joins("JOIN group_memberships ON group_memberships.group_id = groups.id").
				Where("competition_groups.competition_id = ? AND group_memberships.user_id = ?", comp.ID, u).
				First(&gs).Error
			if er != nil {
				if !errors.Is(er, gorm.ErrRecordNotFound) {
					http.Error(w, er.Error(), http.StatusInternalServerError)
					return
				}
				http.Error(w, "competition is not active", http.StatusNotFound)
				return
			} else {
				if gs.ID == "" {
					http.Error(w, "competition is not active", http.StatusNotFound)
					return
				}
			}
		}

		var graph chalgen.Graph
		if err := json.Unmarshal([]byte(comp.Graph), &graph); err != nil {
			slog.Error("unable to unmarshal graph", "error", err)
			http.NotFound(w, r)
			return
		}

		// TODO breadchris find dependencies of referenced challenge and build those
		challenges := map[string]string{}
		for _, n := range graph.Nodes {
			view := ""
			// TODO breadchris make sure scheme is right
			chalURL := ChalURL("http", compId, n.ID, r.Host)
			switch u := n.Challenge.Value.(type) {
			case *chalgen.Base64:
				c := u.Data
				if n.Flag != "" {
					c += " " + n.Flag
				}
				view = base64.StdEncoding.EncodeToString([]byte(c))
			case *chalgen.CaesarCipher:
				c := u.Plaintext
				if n.Flag != "" {
					c += " " + n.Flag
				}
				view = caesarCipher(c, int(u.Shift))
			case *chalgen.Xor:
				view = hex.EncodeToString(xorEncryptDecrypt([]byte(u.Plaintext), []byte(u.Key)))
			case *chalgen.PassShare:
				view = base64.StdEncoding.EncodeToString([]byte(chalURL))
			case *chalgen.CMS:
				view = chalURL
			case *chalgen.UrlEncode:
				view = url.QueryEscape(u.Value)
			case *chalgen.File:
				view = path.Join("/data/xctf", compId, u.Path)
			}
			if view != "" {
				challenges[n.Name] = view
			} else {
				challenges[n.Name] = chalURL
			}
		}

		templChals := func(tl string) (string, error) {
			nt, err := template.New("challenges").Parse(tl)
			if err != nil {
				return "", err
			}
			var buf bytes.Buffer
			err = nt.Execute(&buf, struct {
				Challenges map[string]string
			}{
				Challenges: challenges,
			})
			if err != nil {
				return "", err
			}
			return buf.String(), nil
		}

		db, err := sql.Open("sqlite3", ":memory:")
		if err != nil {
			log.Fatalf("Failed to open database: %v", err)
		}
		defer db.Close()

		// TODO breadchris challenge can have code scripts
		fillers := defaultFillerContent()
		logEntries := generateAccessLogEntries(10000, fillers)
		ae := AccessLogEntry{
			Timestamp:      time.Now().Format(time.RFC3339),
			UserID:         "g3tl0st",
			IPAddress:      "g3tl0st.2025.mcpshsf.com",
			Method:         "GET",
			URL:            "/cms?search=SELECT%20title,%20content,%20author,%20fees_owed%20FROM%20books%20WHERE%20deleted%20=%20false",
			Status:         "200",
			ResponseTimeMs: "100",
			Referrer:       "ZmxhZ3tpbl90aGVfbG9nc30=",
			UserAgent:      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 Safari/605.1.15",
		}

		// insert ae into random position in logEntries
		re := rand.Intn(len(logEntries))
		logEntries = append(logEntries[:re], append([]AccessLogEntry{ae}, logEntries[re:]...)...)

		for _, n := range graph.Nodes {
			if n.ID == chalId {
				switch u := n.Challenge.Value.(type) {
				case *chalgen.Text:
					t, err := templChals(u.Value)
					if err != nil {
						http.Error(w, err.Error(), http.StatusInternalServerError)
						return
					}
					renderer := blackfriday.NewHTMLRenderer(blackfriday.HTMLRendererParameters{})
					b := blackfriday.Run([]byte(t), blackfriday.WithRenderer(renderer))
					DefaultLayout(
						Div(
							Class("p-5 max-w-4xlg mx-auto"),
							Raw(string(b)),
						),
					).RenderPageCtx(ctx, w, r)
					return
				case *chalgen.Site:
					if u.Game == "http" {
						var levels map[string]struct {
							Instructions string
							Handler      http.HandlerFunc
						}

						levels = map[string]struct {
							Instructions string
							Handler      http.HandlerFunc
						}{
							"thefirstlevel": {
								Instructions: fmt.Sprintf("Run this js fetch code: fetch(\"%s/nicejobnowdothis\") in the code editor below.", baseURL),
								Handler: func(writer http.ResponseWriter, r *http.Request) {
									Div(T("You've completed Level 1! Next: "+levels["nicejobnowdothis"].Instructions)).RenderPageCtx(ctx, writer, r)
								},
							},
							"nicejobnowdothis": {
								Instructions: fmt.Sprintf("Change URL path to \"%s/tooeasywhataboutthisone\"", baseURL),
								Handler: func(writer http.ResponseWriter, r *http.Request) {
									Div(T("You've completed Level 2! Next: "+levels["tooeasywhataboutthisone"].Instructions)).RenderPageCtx(ctx, writer, r)
								},
							},
							"tooeasywhataboutthisone": {
								Instructions: fmt.Sprintf("Make a request to \"%s/tooeasywhataboutthisone\" and add the query parameter \"item\" and set its value to \"book\" to the URL path", baseURL),
								Handler: func(writer http.ResponseWriter, r *http.Request) {
									if r.URL.Query().Get("item") == "book" {
										Div(T("You've completed Level 3! Next: "+levels["surelytherearenomore"].Instructions)).RenderPageCtx(ctx, writer, r)
									} else {
										Div(T("Oops! You need that query parameter set!")).RenderPageCtx(ctx, writer, r)
									}
								},
							},
							"surelytherearenomore": {
								Instructions: fmt.Sprintf("Make a POST request to \"%s/surelytherearenomore\"", baseURL),
								Handler: func(writer http.ResponseWriter, r *http.Request) {
									if r.Method == http.MethodPost {
										Div(T("You've completed Level 4! Next: "+levels["oklastoneipromise"].Instructions)).RenderPageCtx(ctx, writer, r)
									} else {
										Div(T("Wrong method! Please use POST.")).RenderPageCtx(ctx, writer, r)
									}
								},
							},
							"oklastoneipromise": {
								Instructions: fmt.Sprintf("Make a POST request to \"%s/oklastoneipromise\" with the \"Authorization\" header set to \"Token123\"", baseURL),
								Handler: func(w http.ResponseWriter, r *http.Request) {
									if r.Header.Get("Authorization") == "Token123" {
										Div(T("You've completed Level 5! You've mastered headers! flag{http_is_neat}")).RenderPageCtx(ctx, w, r)
									} else {
										Div(T("Missing or incorrect Authorization header.")).RenderPageCtx(ctx, w, r)
									}
								},
							},
						}
						if level, ok := levels[p]; ok {
							level.Handler(w, r)
							return
						}
						if p == "intercept-worker.js" {
							c := `
self.addEventListener('fetch', event => {
  const requestClone = event.request.clone();

  event.respondWith(
    fetch(event.request).then(response => {
      const responseClone = response.clone();

      Promise.all([
        requestClone.text(),
        responseClone.text()
      ]).then(([reqBody, resBody]) => {
        self.clients.matchAll().then(clients => {
          clients.forEach(client => {
            client.postMessage({
              url: requestClone.url,
              method: requestClone.method,
              requestHeaders: [...requestClone.headers],
              requestBody: reqBody,
              responseStatus: responseClone.status,
              responseHeaders: [...responseClone.headers],
              responseBody: resBody
            });
          });
        });
      });

      return response;
    })
  );
});
`
							w.Header().Set("Content-Type", "application/javascript")
							w.Write([]byte(c))
							return
						}
						DefaultLayout(
							Script(Src("https://cdnjs.cloudflare.com/ajax/libs/ace/1.32.6/ace.js")),
							//Script(Src("/worker.js"), Attr("type", "module")),
							Div(Class("container mx-auto p-4 space-y-4"),
								H1(Class("text-3xl font-bold"), T("HTTP Request Game")),
								Div(Id("game-area text-lg"), T(levels["thefirstlevel"].Instructions)),
								Div(Class("mt-6"),
									Div(Id("editor"), Style_("height: 200px; width: 100%; border: 1px solid #ccc;")),
									Button(Class("btn btn-secondary mt-2"), Attr("onclick", "runCode()"), T("Run Fetch Request")),
								),
								Div(Id("logs"), Class("p-4 bg-gray-100 rounded mt-4")),
							),
							Script(Raw(`
				const editor = ace.edit("editor", { mode: "ace/mode/javascript", theme: "ace/theme/monokai" });
				//const worker = new Worker('./request-interceptor.js');

				function runCode() {
					const code = editor.getValue();
					eval(code);
					//worker.postMessage({ code });
				}

				//worker.onmessage = (e) => {
				//	const output = document.getElementById("fetch-output");
				//	output.textContent = JSON.stringify(e.data, null, 2);
				//};

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register("intercept-worker.js").then(reg => {
        console.log('Service Worker registered', reg);
      }).catch(err => {
        console.error('Service Worker registration failed:', err);
      });

      navigator.serviceWorker.addEventListener('message', event => {
        const logContainer = document.getElementById('logs');
        const { url, method, requestHeaders, requestBody, responseStatus, responseHeaders, responseBody } = event.data;

        const entry = document.createElement('div');
        entry.style.overflowX = 'scroll';
        entry.style.marginBottom = '1rem';
        entry.style.padding = '0.5rem';
        entry.style.border = '1px solid #ccc';

        entry.innerHTML = `+"`"+`
						<strong>URL:</strong> ${url}<br>
						<strong>Method:</strong> ${method}<br>
						<strong>Status:</strong> ${responseStatus}<br>
						<details><summary><strong>Request Headers</strong></summary><pre>${JSON.stringify(requestHeaders, null, 2)}</pre></details>
						<details><summary><strong>Request Body</strong></summary><pre>${requestBody}</pre></details>
						<details><summary><strong>Response Headers</strong></summary><pre>${JSON.stringify(responseHeaders, null, 2)}</pre></details>
						<details><summary><strong>Response Body</strong></summary><pre>${responseBody}</pre></details>
							`+"`"+`

        logContainer.prepend(entry);
      });
    } else {
      console.error('Service Workers are not supported in this browser.');
    }
			`)),
						).RenderPageCtx(ctx, w, r)
					}
					if u.Path != "" {
						//pa := path.Join("data/xctf", compId, u.Path)

						//println(r.URL.Path)
						//http.StripPrefix(r.URL.Path, http.FileServer(http.Dir(pa))).ServeHTTP(w, r)

						filePath := path.Join("data/xctf", compId, u.Path, p)

						if filepath.Ext(filePath) == ".jpg" || filepath.Ext(filePath) == ".jpeg" || filepath.Ext(filePath) == ".png" {
							f, err := os.Open(filePath)
							if err != nil {
								http.NotFound(w, r)
								return
							}
							defer f.Close()

							stat, err := f.Stat()
							if err != nil || stat.IsDir() {
								http.NotFound(w, r)
								return
							}

							etag := generateETag(stat)

							if match := r.Header.Get("If-None-Match"); match == etag {
								w.WriteHeader(http.StatusNotModified)
								return
							}

							w.Header().Set("ETag", etag)
						}
						http.ServeFile(w, r, filePath)
						return
					}
					for _, ro := range u.Routes {
						if ro.Route == p {
							DefaultLayout(
								Div(
									Class("p-5 max-w-4xlg mx-auto"),
									Raw(ro.HTML),
								),
							).RenderPageCtx(ctx, w, r)
							return
						}
					}
				case *chalgen.CMS:
					if p == "log" {
						if err := writeAccessLogCSV(w, logEntries); err != nil {
							http.Error(w, err.Error(), http.StatusInternalServerError)
							return
						}
						return
					}
					if p == "backups" {
						DefaultLayout(
							Div(
								Class("p-5 max-w-lg mx-auto"),
								Div(
									Class("navbar bg-base-100"),
									Div(Class("flex-1"), A(Class("btn btn-ghost text-xl"), Text("Library Database"))),
									Div(
										Class("flex-none"),
										Ul(
											Class("menu menu-horizontal px-1"),
											Li(A(Href("/backups"), Text(""))),
										),
									),
								),
								Div(
									Class("p-5"),
									Ul(
										Li(A(Href("/log"), Text("access log"))),
									),
								),
							),
						).RenderPageCtx(ctx, w, r)
						return
					}

					_, err := db.Exec("CREATE TABLE IF NOT EXISTS books (id INTEGER PRIMARY KEY, title TEXT, content TEXT, author TEXT, fees_owed REAL, deleted BOOLEAN DEFAULT FALSE)")
					if err != nil {
						http.Error(w, err.Error(), http.StatusInternalServerError)
						return
					}

					// batch insert u.Items into db
					stmt, err := db.Prepare("INSERT INTO books(title, content, author, fees_owed, deleted) values(?, ?, ?, ?, ?)")
					if err != nil {
						http.Error(w, err.Error(), http.StatusInternalServerError)
						return
					}

					for _, item := range u.Items {
						_, err := stmt.Exec(item.Title, item.Content, item.Author, item.FeesOwed, item.Deleted)
						if err != nil {
							http.Error(w, err.Error(), http.StatusInternalServerError)
							return
						}
					}

					formatResults := func(items []chalgen.CMSItem) *Node {
						return Table(
							Id("results"),
							Class("table"),
							Thead(Tr(Th(Text("Title")), Th(Text("Content")), Th(Text("Author")), Th(Text("Fees Owed")))),
							Tbody(
								Ch(func() []*Node {
									var rows []*Node
									for _, u := range items {
										rows = append(rows, Tr(
											Td(Text(u.Title)),
											Td(Text(u.Content)),
											Td(Text(u.Author)),
											Td(Text(fmt.Sprintf("%0.2f", u.FeesOwed))),
										))
									}
									return rows
								}()),
							),
						)
					}

					query := r.URL.Query().Get("search")
					if query == "" {
						http.Redirect(w, r, baseURL+"?search=SELECT title, content, author, fees_owed FROM books WHERE deleted = false", http.StatusFound)
						return
					}

					items := u.Items
					rows, err := db.Query(query)
					if err != nil {
						http.Error(w, err.Error(), http.StatusInternalServerError)
						return
					}
					defer rows.Close()

					items = []chalgen.CMSItem{}
					for rows.Next() {
						var item chalgen.CMSItem
						if err := rows.Scan(&item.Title, &item.Content, &item.Author, &item.FeesOwed); err != nil {
							http.Error(w, err.Error(), http.StatusInternalServerError)
							return
						}
						items = append(items, item)
					}
					DefaultLayout(
						Div(
							Class("p-5 max-w-lg mx-auto"),
							Div(
								Class("navbar bg-base-100"),
								Div(Class("flex-1"), A(Class("btn btn-ghost text-xl"), Text("Library Database"))),
								Div(
									Class("flex-none"),
									Ul(
										//Class("menu menu-horizontal px-1"),
										Li(A(Href("/backups"), Text(""))),
									),
								),
							),
							Form(
								//HxGet("/search"),
								//HxTarget("#results"),
								//Input(Class("input w-full"), Type("text"), Name("search"), Value(query), Placeholder("search")),
								//Button(Class("btn"), Type("submit"), Text("search")),
								formatResults(items),
							),
						),
					).RenderPageCtx(ctx, w, r)
					return
				case *chalgen.Xor:
					DefaultLayout(
						Div(T(string(xorEncryptDecrypt([]byte(u.Plaintext), []byte(u.Key))))),
					).RenderPageCtx(ctx, w, r)
					return
				case *chalgen.Base64:
					DefaultLayout(
						Div(T(base64.StdEncoding.EncodeToString([]byte(u.Data)))),
					).RenderPageCtx(ctx, w, r)
					return
				case *chalgen.CaesarCipher:
					DefaultLayout(
						Div(T(caesarCipher(u.Plaintext, int(u.Shift)))),
					).RenderPageCtx(ctx, w, r)
					return
				case *chalgen.Twitter:
					for i, p := range u.Posts {
						u.Posts[i].Content, err = templChals(p.Content)
						if err != nil {
							http.Error(w, err.Error(), http.StatusInternalServerError)
							return
						}
						renderer := blackfriday.NewHTMLRenderer(blackfriday.HTMLRendererParameters{})
						b := blackfriday.Run([]byte(u.Posts[i].Content), blackfriday.WithRenderer(renderer))
						u.Posts[i].Content = string(b)
					}
					RenderTwitter(TwitterState{
						Flag:  n.Flag,
						Posts: u.Posts,
					}).RenderPageCtx(ctx, w, r)
					return
				case *chalgen.FileManager:
					var username string
					chatState := d.Session.Get(r.Context(), chalId)
					if chatState != nil {
						ss, ok := chatState.(string)
						if !ok {
							http.Error(w, "Failed to parse session", http.StatusInternalServerError)
							return
						}
						username = ss
					}
					if err := r.ParseForm(); err != nil {
						http.Error(w, "Failed to parse the form", http.StatusBadRequest)
						return
					}
					parts := strings.Split(p, "/")
					if parts[len(parts)-1] == "logout" {
						d.Session.Remove(r.Context(), chalId)
						w.Header().Set("Location", baseURL)
						w.WriteHeader(http.StatusFound)
						return
					}
					if parts[len(parts)-1] == "logout" {
						d.Session.Remove(r.Context(), chalId)
						w.Header().Set("Location ", baseURL)
						w.WriteHeader(http.StatusFound)
						return
					}
					if parts[len(parts)-1] == "login" {
						password := r.FormValue("password")
						if u.Password == password {
							d.Session.Put(r.Context(), chalId, "user")
						}
						w.Header().Set("Location", baseURL)
						w.WriteHeader(http.StatusFound)
						return
					}

					var newUrls []string
					for _, ul := range u.URLs {
						ul, err = templChals(ul)
						if err != nil {
							http.Error(w, err.Error(), http.StatusInternalServerError)
							return
						}
						newUrls = append(newUrls, ul)
					}
					u.URLs = newUrls

					DefaultLayout(
						Div(Class("p-5 max-w-lg mx-auto"),
							FileManager(FileManagerState{
								Flag:     n.Flag,
								Username: username,
								URL: FileManagerURL{
									Login: baseURL + "/login",
								},
							}, u),
						),
					).RenderPageCtx(ctx, w, r)
				case *chalgen.Slack:
					var username string
					chatState := d.Session.Get(r.Context(), chalId)
					if chatState != nil {
						ss, ok := chatState.(string)
						if !ok {
							http.Error(w, "Failed to parse session", http.StatusInternalServerError)
							return
						}
						username = ss
					}
					if err := r.ParseForm(); err != nil {
						http.Error(w, "Failed to parse the form", http.StatusBadRequest)
						return
					}
					if p == "logout" {
						d.Session.Remove(r.Context(), chalId)

						w.Header().Set("Location", baseURL)
						w.WriteHeader(http.StatusFound)
						return
					}
					if p == "login" {
						username := r.FormValue("username")
						password := r.FormValue("password")
						for _, us := range u.Users {
							if us.Username == username && us.Password == password {
								username = us.Username
								d.Session.Put(r.Context(), chalId, username)
							}
						}
						w.Header().Set("Location", baseURL)
						w.WriteHeader(http.StatusFound)
						return
					}
					cID := 0
					if cv := r.FormValue("channel_id"); cv != "" {
						cID, err = strconv.Atoi(cv)
						if err != nil {
							http.Error(w, "failed to parse channel id", http.StatusBadRequest)
							return
						}
					}

					if username != "" {
						u.Channels = func() []chalgen.Channel {
							var cs []chalgen.Channel
							for _, c := range u.Channels {
								for _, us := range c.Usernames {
									if us == username {
										cs = append(cs, c)
									}
								}
							}
							return cs
						}()
					} else {
						u.Channels = []chalgen.Channel{}
					}

					var c chalgen.Channel
					if len(u.Channels)-1 >= cID {
						c = u.Channels[cID]
					}

					for _, p := range u.Channels {
						for i, n := range p.Messages {
							p.Messages[i].Content, err = templChals(n.Content)
							if err != nil {
								http.Error(w, err.Error(), http.StatusInternalServerError)
								return
							}
							renderer := blackfriday.NewHTMLRenderer(blackfriday.HTMLRendererParameters{})
							b := blackfriday.Run([]byte(p.Messages[i].Content), blackfriday.WithRenderer(renderer))
							p.Messages[i].Content = string(b)
						}
					}

					userLookup := map[string]chalgen.User{}
					for _, u := range u.Users {
						userLookup[u.Username] = u
					}

					DefaultLayout(Chat(u, ChatState{
						Flag:       n.Flag,
						UserLookup: userLookup,
						Username:   username,
						Channel:    c,
					})).RenderPageCtx(ctx, w, r)
					return
				case *chalgen.Zip:
					err := CreateEncryptedZip("data/zip", "password", "data/zipout.zip")
					if err != nil {
						http.Error(w, err.Error(), http.StatusInternalServerError)
						return
					}

					f, err := os.Open("data/zipout.zip")
					if err != nil {
						http.Error(w, err.Error(), http.StatusInternalServerError)
						return
					}

					w.Header().Set("Content-Type", "application/zip")
					w.Header().Set("Content-Disposition", "attachment; filename=files.zip")
					io.Copy(w, f)
					return
				case *chalgen.Exif:
					fi := "/Users/hacked/Downloads/1999 Happy Meal Lego.jpg"

					intfc, _ := jis.NewJpegMediaParser().ParseFile(fi)
					sl := intfc.(*jis.SegmentList)
					ib, _ := sl.ConstructExifBuilder()
					ifd0Ib, _ := exif.GetOrCreateIbFromRootIb(ib, "IFD0")
					ifdIb, _ := exif.GetOrCreateIbFromRootIb(ib, "IFD")

					//g := exif.GpsDegrees{
					//	Degrees: 0,
					//	Minutes: 0,
					//	Seconds: 0,
					//}
					//gi := exif.GpsInfo{
					//	Latitude:  g,
					//	Longitude: g,
					//}
					_ = ifd0Ib.SetStandardWithName("Comment", u.Value)
					_ = ifdIb.SetStandardWithName("DateTimeOriginal", time.Date(2021, time.January, 1, 0, 0, 0, 0, time.UTC))
					//err := ib.AddStandard(exifcommon.IfdPathStandardGps.TagId(), gi)
					//if err != nil {
					//	http.Error(w, err.Error(), http.StatusInternalServerError)
					//	return
					//}

					_ = sl.SetExif(ib)
					//f, _ := os.OpenFile("/tmp/1999 Happy Meal Lego.jpg", os.O_RDWR|os.O_CREATE, 0755)
					//defer f.Close()
					//_ = sl.Write(f)

					w.Header().Set("Content-Type", "image/jpeg")
					w.Header().Set("Content-Disposition", "attachment; filename=file.jpg")
					_ = sl.Write(w)
				case *chalgen.Phone:
					var sess PhoneState
					chatState := d.Session.Get(r.Context(), chalId)
					if chatState != nil {
						ss, ok := chatState.(PhoneState)
						if !ok {
							http.Error(w, "Failed to parse session", http.StatusInternalServerError)
							return
						}
						sess = ss
					}
					if p == "tracker/login" {
						password := r.FormValue("password")
						if sess.NextAttempt.After(time.Now()) {
							http.Error(w, "You must wait 1 minute before trying again", http.StatusBadRequest)
							return
						}
						for _, app := range u.Apps {
							switch t := app.App.Value.(type) {
							case *chalgen.Tracker:
								if t.Password == password {
									// TODO breadchris set message that user is logged in
									sess.TrackerAuthed = true
									d.Session.Put(r.Context(), chalId, sess)
								}
							}
						}
					}
					for _, app := range u.Apps {
						app.URL, err = templChals(app.URL)
						if err != nil {
							http.Error(w, err.Error(), http.StatusInternalServerError)
							return
						}
					}
					DefaultLayout(
						RenderPhone(PhoneState{
							Flag:          n.Flag,
							TrackerLogin:  baseURL + "/tracker/login",
							TrackerAuthed: sess.TrackerAuthed,
						}, u),
					).RenderPageCtx(ctx, w, r)
					return
				default:
					slog.Error("challenge type not defined", "compId", compId, "chalId", chalId, "name", n.Name)
					http.NotFound(w, r)
					return
				}
				return
			}
		}
		slog.Error("challenge not found", "compId", compId, "chalId", chalId)
		http.NotFound(w, r)
	}
}

func serveFiles(dir string) http.HandlerFunc {
	fileServer := neuter(http.FileServer(http.Dir(dir)))

	return func(w http.ResponseWriter, r *http.Request) {
		filePath := filepath.Join(dir, r.URL.Path)

		if filepath.Ext(filePath) == ".jpg" || filepath.Ext(filePath) == ".jpeg" || filepath.Ext(filePath) == ".png" {
			f, err := os.Open(filePath)
			if err != nil {
				http.NotFound(w, r)
				return
			}
			defer f.Close()

			stat, err := f.Stat()
			if err != nil || stat.IsDir() {
				http.NotFound(w, r)
				return
			}

			etag := generateETag(stat)

			if match := r.Header.Get("If-None-Match"); match == etag {
				w.WriteHeader(http.StatusNotModified)
				return
			}

			w.Header().Set("ETag", etag)
		}

		http.StripPrefix("/"+dir, fileServer).ServeHTTP(w, r)
	}
}

func generateETag(info os.FileInfo) string {
	h := md5.New()
	io.WriteString(h, info.Name())
	io.WriteString(h, strconv.FormatInt(info.Size(), 10))
	io.WriteString(h, info.ModTime().String())
	return `"` + hex.EncodeToString(h.Sum(nil)) + `"`
}

func setupDatabase(db *sql.DB) {
	queries := []string{
		`CREATE TABLE IF NOT EXISTS authors (
		    author_id INTEGER PRIMARY KEY,
		    name TEXT NOT NULL,
		    birth_year INTEGER
		);`,
		`CREATE TABLE IF NOT EXISTS books (
		    book_id INTEGER PRIMARY KEY,
		    title TEXT NOT NULL,
		    author_id INTEGER NOT NULL,
		    publication_year INTEGER,
		    FOREIGN KEY (author_id) REFERENCES authors(author_id)
		);`,
	}

	for _, query := range queries {
		if _, err := db.Exec(query); err != nil {
			log.Fatalf("Failed to execute query: %v", err)
		}
	}
}

type DbColumn struct {
	ColumnID     int
	Name         string
	Type         string
	NotNull      bool
	DefaultValue string
	PrimaryKey   bool
}

type DbTable struct {
	Table   string
	Columns []DbColumn
}

func inspectSchemas(db *sql.DB) []DbTable {
	tablesQuery := "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%';"
	tables, err := db.Query(tablesQuery)
	if err != nil {
		log.Fatalf("Failed to fetch tables: %v", err)
	}
	defer tables.Close()

	var dbTables []DbTable
	for tables.Next() {
		var tableName string
		if err := tables.Scan(&tableName); err != nil {
			log.Fatalf("Failed to scan table name: %v", err)
		}

		columnsQuery := fmt.Sprintf("PRAGMA table_info('%s');", tableName)
		columns, err := db.Query(columnsQuery)
		if err != nil {
			log.Fatalf("Failed to fetch columns for table %s: %v", tableName, err)
		}
		defer columns.Close()

		var columnDetails []DbColumn

		for columns.Next() {
			var cid int
			var name, colType, defaultValue sql.NullString
			var notNull, pk int

			if err := columns.Scan(&cid, &name, &colType, &notNull, &defaultValue, &pk); err != nil {
				log.Fatalf("Failed to scan column info: %v", err)
			}

			columnDetails = append(columnDetails, DbColumn{
				ColumnID:     cid,
				Name:         name.String,
				Type:         colType.String,
				NotNull:      notNull == 1,
				DefaultValue: defaultValue.String,
				PrimaryKey:   pk == 1,
			})
		}
		dbTables = append(dbTables, DbTable{
			Table:   tableName,
			Columns: columnDetails,
		})
	}
	return dbTables
}

func NewPCAP(wr io.Writer, p *chalgen.PCAP) error {
	w := pcapgo.NewWriter(wr)
	err := w.WriteFileHeader(65536, layers.LinkTypeEthernet) // Adjust the snaplen and link type as needed
	if err != nil {
		return err
	}

	// TODO breadchris simulate http traffic?
	for _, p := range p.Packets {
		// Create a simple Ethernet/IP/TCP packet with payload
		// You would typically want to construct the packet based on the actual data and protocol
		// This is a simplification for demonstration purposes
		eth := layers.Ethernet{
			SrcMAC:       net.HardwareAddr{0x00, 0x00, 0x00, 0x00, 0x00, 0x00},
			DstMAC:       net.HardwareAddr{0x00, 0x00, 0x00, 0x00, 0x00, 0x01},
			EthernetType: layers.EthernetTypeIPv4,
		}
		ip := layers.IPv4{
			SrcIP:    net.ParseIP(p.Source),
			DstIP:    net.ParseIP(p.Destination),
			Protocol: layers.IPProtocolTCP,
		}
		tcp := layers.TCP{
			SrcPort: layers.TCPPort(80),
			DstPort: layers.TCPPort(80),
		}
		tcp.SetNetworkLayerForChecksum(&ip)

		// Stack the layers
		buf := gopacket.NewSerializeBuffer()
		opts := gopacket.SerializeOptions{
			ComputeChecksums: true,
			FixLengths:       true,
		}

		gopacket.SerializeLayers(buf, opts, &eth, &ip, &tcp, gopacket.Payload(p.Data))

		// Create a custom packet
		ci := gopacket.CaptureInfo{
			Timestamp:     time.Unix(0, p.Timestamp),
			CaptureLength: len(buf.Bytes()),
			Length:        len(buf.Bytes()),
		}

		err := w.WritePacket(ci, buf.Bytes())
		if err != nil {
			return err
		}
	}
	return nil
}

func performSearch(flag string, s *chalgen.Search, query string) ([]string, error) {
	db, err := sql.Open("sqlite3", ":memory:")
	if err != nil {
		return nil, err
	}
	defer db.Close()

	createTableSQL := `CREATE TABLE entries (
		"id" integer NOT NULL PRIMARY KEY AUTOINCREMENT, 
		"value" TEXT
	);`

	_, err = db.Exec(createTableSQL)
	if err != nil {
		return nil, err
	}

	insertSQL := `INSERT INTO entries (value) VALUES (?);`
	for _, e := range s.Entry {
		_, err := db.Exec(insertSQL, e)
		if err != nil {
			return nil, err
		}
	}
	_, err = db.Exec(insertSQL, flag)
	if err != nil {
		return nil, err
	}

	var q string
	if query == "" {
		q = "SELECT value FROM entries"
	} else {
		q = fmt.Sprintf("SELECT value FROM entries WHERE value = '%s'", query)
	}

	rows, err := db.Query(q)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var results []string
	for rows.Next() {
		var value string
		err := rows.Scan(&value)
		if err != nil {
			return nil, err
		}
		results = append(results, value)
	}
	err = rows.Err()
	if err != nil {
		log.Fatal("Error in query rows:", err)
	}
	return results, nil
}

type MD5Hash struct {
	Hash    string
	Content string
}

func GenerateMD5Hashes(hashes *chalgen.Hashes) []MD5Hash {
	r := rand.New(rand.NewSource(int64(hashCode(hashes.Seed))))

	var result []MD5Hash
	for i := int32(0); i < hashes.Count; i++ {
		str := generateRandomStringFromFormat(r, int(hashes.Length))
		for _, override := range hashes.Overrides {
			if override.Index == i {
				str = override.Text
				break
			}
		}
		hash := md5.Sum([]byte(str))
		result = append(result, MD5Hash{
			Hash:    fmt.Sprintf(hashes.Format, i, hex.EncodeToString(hash[:])),
			Content: str,
		})
	}

	return result
}

func createEncryptedZip(directory, password string, w io.Writer) error {
	zipWriter := zip.NewWriter(w)
	defer zipWriter.Close()

	err := filepath.Walk(directory, func(path string, info os.FileInfo, err error) error {
		if err != nil {
			return err
		}

		if info.IsDir() {
			return nil
		}

		relPath, err := filepath.Rel(directory, path)
		if err != nil {
			return err
		}

		file, err := os.Open(path)
		if err != nil {
			return err
		}
		defer file.Close()

		zipFile, err := zipWriter.Encrypt(relPath, password, zip.AES256Encryption)
		if err != nil {
			return err
		}

		if _, err = io.Copy(zipFile, file); err != nil {
			return err
		}
		return nil
	})

	if err != nil {
		return err
	}
	return nil
}

func CreateEncryptedZip(directory, password, outputPath string) error {
	outputFile, err := os.Create(outputPath)
	if err != nil {
		return err
	}
	defer outputFile.Close()

	zipWriter := zip.NewWriter(outputFile)
	defer zipWriter.Close()

	err = filepath.Walk(directory, func(path string, info os.FileInfo, err error) error {
		if err != nil {
			return err
		}

		if info.IsDir() {
			return nil
		}

		relPath, err := filepath.Rel(directory, path)
		if err != nil {
			return err
		}

		file, err := os.Open(path)
		if err != nil {
			return err
		}
		defer file.Close()

		zipFile, err := zipWriter.Encrypt(relPath, password, zip.AES256Encryption)
		if err != nil {
			return err
		}

		if _, err = io.Copy(zipFile, file); err != nil {
			return err
		}
		return nil
	})

	if err != nil {
		return err
	}
	return nil
}

func generateRandomStringFromFormat(r *rand.Rand, l int) string {
	var result strings.Builder
	for i := 0; i < l; i++ {
		result.WriteByte(randomChar(r))
	}
	return result.String()
}

func randomChar(r *rand.Rand) byte {
	charSet := "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
	return charSet[r.Intn(len(charSet))]
}

func hashCode(s string) int {
	h := 0
	for i := 0; i < len(s); i++ {
		h = 31*h + int(s[i])
	}
	return h
}

func caesarCipher(input string, shift int) string {
	shift = shift % 26 // Normalize the shift to ensure it's within the alphabet range
	runeShift := rune(shift)

	return string(mapRune([]rune(input), func(r rune) rune {
		if unicode.IsLetter(r) {
			offset := 'A'
			if unicode.IsLower(r) {
				offset = 'a'
			}

			// Shift character and wrap around if necessary
			return ((r-offset+runeShift)+26)%26 + offset
		}
		return r
	}))
}

func xorEncryptDecrypt(input, key []byte) []byte {
	output := make([]byte, len(input))
	keyLen := len(key)

	for i := range input {
		output[i] = input[i] ^ key[i%keyLen]
	}

	return output
}

// mapRune applies a function to each rune in a slice of runes.
func mapRune(runes []rune, f func(rune) rune) []rune {
	var result []rune
	for _, r := range runes {
		result = append(result, f(r))
	}
	return result
}
