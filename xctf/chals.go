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
	"fmt"
	"github.com/breadchris/share/deps"
	. "github.com/breadchris/share/html"
	mmodels "github.com/breadchris/share/models"
	"github.com/breadchris/share/xctf/chalgen"
	"github.com/breadchris/share/xctf/models"
	"github.com/google/gopacket"
	"github.com/google/gopacket/layers"
	"github.com/google/gopacket/pcapgo"
	"github.com/google/uuid"
	"github.com/sashabaranov/go-openai"
	"github.com/sashabaranov/go-openai/jsonschema"
	"github.com/yeka/zip"
	"html/template"
	"io"
	"log"
	"log/slog"
	"math/rand"
	"net"
	"net/http"
	"net/url"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"time"
	"unicode"
)

func init() {
	gob.Register(chalgen.User{})
	gob.Register(SessionState{})
	gob.Register(PhoneState{})
}

func New(d deps.Deps) *http.ServeMux {
	m := http.NewServeMux()
	db := d.DB
	m.HandleFunc("/{id...}", func(w http.ResponseWriter, r *http.Request) {
		ctx := context.WithValue(r.Context(), "baseURL", "/xctf")

		u, err := d.Session.GetUserID(r.Context())
		if err != nil {
			http.Redirect(w, r, "/login?next=/xctf", http.StatusFound)
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
				"fileName":  "chal.yaml",
				"code":      competition.Graph,
				"serverURL": fmt.Sprintf("%s/code/ws", d.Config.ExternalURL),
			}
			mp, err := json.Marshal(props)
			if err != nil {
				http.Error(w, err.Error(), http.StatusInternalServerError)
				return
			}

			DefaultLayout(
				Div(
					Class("p-5 max-w-lg mx-auto"),
					Div(Class("text-sm text-center m-10"), T("hello, "+user.Username)),
					Div(Class("divider")),
					Div(Class("text-lg"), Text("competitions")),
					Div(Id("error"), Class("alert alert-error hidden")),
					getGroupList(),
					Div(Class("divider")),
					Form(
						Class("flex flex-col space-y-4"),
						Div(Text("new competition")),
						HxPost("/"+id),
						HxTarget("#competition-list"),
						//BuildFormCtx(BuildCtx{
						//	CurrentFieldPath: "",
						//	Name:             "competition",
						//}, competition),
						Input(Class("input"), Type("text"), Value(competition.Name), Name("name"), Placeholder("Name")),
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
					Ch(func() []*Node {
						var chals []*Node
						for _, n := range g.Nodes {
							chals = append(chals, Li(
								Class("flex items-center justify-between gap-x-6 py-5"),
								Div(
									Class("min-w-0"),
									A(Class("btn"), Href("/"+id+"/"+n.ID), Text(n.Name)),
									A(Class("btn"), Href("/"+id+"/"+n.ID+"/ai"), Text("ai")),
								),
							))
						}
						return chals
					}()),
					Div(
						Script(Attr("src", "/static/leapclient.js")),
						Script(Attr("src", "/static/leap-bind-textarea.js")),
						Link(Rel("stylesheet"), Attr("href", "/static/code/monaco.css")),
						Div(Class("w-full h-full"), Id("monaco-editor"), Attr("data-props", string(mp))),
						Script(Attr("src", "/static/code/monaco.js"), Attr("type", "module")),
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

			if competition.ID == "" {
				if err := db.Create(&competition).Error; err != nil {
					http.Error(w, "Error creating competition: "+err.Error(), http.StatusInternalServerError)
					return
				}
			} else {
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
	})
	m.HandleFunc("/{compid}/{chalid}/ai", func(w http.ResponseWriter, r *http.Request) {
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
	m.HandleFunc("/{compid}/{chalid}", Handle(d))
	m.HandleFunc("/{compid}/{chalid}/{path...}", Handle(d))
	return m
}

func Handle(d deps.Deps) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		compId := r.PathValue("compid")
		chalId := r.PathValue("chalid")
		p := r.PathValue("path")

		baseURL := Fmt("/xctf/%s/%s", compId, chalId)
		ctx := context.WithValue(r.Context(), "baseURL", baseURL)

		//baseURL := fmt.Sprintf("/play/%s/%s", compId, chalId)

		var comp models.Competition
		res := d.DB.Where("id = ?", compId).First(&comp)
		if res.Error != nil {
			http.NotFound(w, r)
			return
		}

		_, err := d.Session.GetUserID(r.Context())
		if err != nil {
			slog.Debug("user not logged in", "err", err)
			http.Error(w, "user not logged in", http.StatusUnauthorized)
			return
		}

		if !comp.Active {
			http.Error(w, "competition is not active", http.StatusNotFound)
			return
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
				view = string(xorEncryptDecrypt([]byte(u.Plaintext), []byte(u.Key)))
			case *chalgen.PassShare:
				view = base64.StdEncoding.EncodeToString([]byte(chalURL))
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

		for _, n := range graph.Nodes {
			if n.ID == chalId {
				switch u := n.Challenge.Value.(type) {
				case *chalgen.CMS:
					DefaultLayout(
						Div(
							Class("p-5 max-w-lg mx-auto"),
							Div(Class("text-lg"), Text("Library Database")),
							//Ch(func() []*Node {
							//	var tc []*Node
							//	for _, t := range tablesAndColumns {
							//		tc = append(
							//			tc, Div(
							//				H2(Text(t.Table)),
							//				Table(
							//					Class("table"),
							//					Thead(Tr(Th(Text("Column")), Th(Text("Type")))),
							//					Tbody(Ch(func() []*Node {
							//						var rows []*Node
							//						for _, c := range t.Columns {
							//							rows = append(rows, Tr(Td(Text(c.Name)), Td(Text(c.Type))))
							//						}
							//						return rows
							//					}())),
							//				),
							//			),
							//		)
							//	}
							//	return tc
							//}()),
							Table(
								Class("table"),
								Thead(Tr(Th(Text("Title")), Th(Text("Content")), Th(Text("Author")), Th(Text("Fees Owed")))),
								Tbody(
									Ch(func() []*Node {
										var rows []*Node
										for _, u := range u.Items {
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
					for _, p := range u.Posts {
						p.Content, err = templChals(p.Content)
						if err != nil {
							http.Error(w, err.Error(), http.StatusInternalServerError)
							return
						}
					}
					RenderTwitter(TwitterState{
						Flag:  n.Flag,
						Posts: u.Posts,
					}).RenderPageCtx(ctx, w, r)
					return
				case *chalgen.FileManager:
					var sess SessionState
					chatState := d.Session.Get(r.Context(), chalId)
					if chatState != nil {
						ss, ok := chatState.(SessionState)
						if !ok {
							http.Error(w, "Failed to parse session", http.StatusInternalServerError)
							return
						}
						sess = ss
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
					if parts[len(parts)-1] == "login" {
						password := r.FormValue("password")
						if u.Password == password {
							sess.User = chalgen.User{
								Username: "user",
							}
							d.Session.Put(r.Context(), chalId, sess)
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

					DefaultLayout(FileManager(FileManagerState{
						Flag:    n.Flag,
						Session: sess,
						URL: FileManagerURL{
							Login: baseURL + "/login",
						},
					}, u)).RenderPageCtx(ctx, w, r)
				case *chalgen.Slack:
					var sess SessionState
					chatState := d.Session.Get(r.Context(), chalId)
					if chatState != nil {
						ss, ok := chatState.(SessionState)
						if !ok {
							http.Error(w, "Failed to parse session", http.StatusInternalServerError)
							return
						}
						sess = ss
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
								sess.User = us
								d.Session.Put(r.Context(), chalId, sess)
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

					if sess.User.Username != "" {
						u.Channels = func() []chalgen.Channel {
							var cs []chalgen.Channel
							for _, c := range u.Channels {
								for _, us := range c.Usernames {
									if us == sess.User.Username {
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
						for _, n := range p.Messages {
							n.Content, err = templChals(n.Content)
							if err != nil {
								http.Error(w, err.Error(), http.StatusInternalServerError)
								return
							}
						}
					}

					userLookup := map[string]chalgen.User{}
					for _, u := range u.Users {
						userLookup[u.Username] = u
					}

					DefaultLayout(Chat(ChatState{
						Flag:       n.Flag,
						UserLookup: userLookup,
						Session:    sess,
						Channel:    c,
					})).RenderPageCtx(ctx, w, r)
					return
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
				/*
					case *Node_Base:
						switch t := u.Base.Type.(type) {
						case *Challenge_Audioplayer:
							t.Audioplayer.Songs = append(t.Audioplayer.Songs, &Song{
								Name:   n.Meta.Flag,
								Artist: "flag",
							})
							templ.Handler(tmpl.Page(tmpl.AudioPlayer(t.Audioplayer))).ServeHTTP(w, r)
							return
						case *Challenge_Data:
							w.Header().Set("Content-Type", "text/plain; charset=UTF-8")
							w.Write([]byte(t.Data.Data))
							return
						case *Challenge_Pdf:
							pdf := fpdf.New("P", "mm", "A4", "")
							pdf.AddPage()
							pdf.SetFont("Arial", "", 12)
							pdf.SetFont("Arial", "", 12)
							pdf.MultiCell(0, 10, t.Pdf.Content, "", "", false)
							pdf.Ln(5)
							w.Header().Set("content-type", "application/pdf")
							err = pdf.Output(w)
							if err != nil {
								slog.Error("failed to generated pdf", "err", err)
								http.Error(w, "failed to generate pdf", http.StatusBadRequest)
								return
							}
							return
						case *Challenge_Maze:
							if err := r.ParseForm(); err != nil {
								http.Error(w, "Failed to parse the form", http.StatusBadRequest)
								return
							}
							var solvedPaths []string
							if p == "solve" {
								for _, path := range t.Maze.Paths {
									solved := true
									for _, coord := range path.Coords {
										b := fmt.Sprintf("%d:%d", coord.Row, coord.Col)
										if r.Form.Get(b) != "on" {
											solved = false
											break
										}
									}
									if solved {
										solvedPaths = append(solvedPaths, path.Result)
									}
								}
							}
							if p == "qr" {
								var (
									png []byte
									ok  bool
								)
								v := r.FormValue("value")
								if png, ok = s.qrMemo[v]; !ok {
									png, err = qrcode.Encode(v, qrcode.Medium, 256)
									if err != nil {
										http.Error(w, "failed to create qr code", http.StatusBadRequest)
										return
									}
								}
								w.Header().Set("Content-Type", "image/png")
								w.Write(png)
								return
							}
							templ.Handler(tmpl.Page(tmpl.Maze(tmpl.MazeState{
								QR: func(s string) string {
									return fmt.Sprintf("%s/qr?value=%s", baseURL, s)
								},
								Solve:       templ.URL(baseURL + "/solve"),
								SolvedPaths: solvedPaths,
							}, t.Maze))).ServeHTTP(w, r)
							return
						case *Challenge_Filemanager:
							var sess tmpl.SessionState
							chatState := s.manager.GetChalState(r.Context(), chalId)
							if chatState != nil {
								ss, ok := chatState.(tmpl.SessionState)
								if !ok {
									http.Error(w, "Failed to parse session", http.StatusInternalServerError)
									return
								}
								sess = ss
							}
							if err := r.ParseForm(); err != nil {
								http.Error(w, "Failed to parse the form", http.StatusBadRequest)
								return
							}
							if p == "logout" {
								s.manager.RemoveChalState(r.Context(), chalId)
								w.Header().Set("Location", baseURL)
								w.WriteHeader(http.StatusFound)
								return
							}
							if p == "login" {
								password := r.FormValue("password")
								if t.Filemanager.Password == password {
									sess.User = &User{
										Username: "user",
									}
									s.manager.SetChalState(r.Context(), chalId, sess)
								}
								w.Header().Set("Location", baseURL)
								w.WriteHeader(http.StatusFound)
								return
							}

							var newUrls []string
							for _, ul := range t.Filemanager.Urls {
								ul, err = templChals(ul)
								if err != nil {
									http.Error(w, err.Error(), http.StatusInternalServerError)
									return
								}
								newUrls = append(newUrls, ul)
							}
							t.Filemanager.Urls = newUrls

							templ.Handler(tmpl.Page(tmpl.FileManager(tmpl.FileManagerState{
								Flag:    n.Meta.Flag,
								Session: sess,
								URL: tmpl.FileManagerURL{
									Login: templ.URL(baseURL + "/login"),
								},
							}, t.Filemanager)), templ.WithErrorHandler(func(r *http.Request, err error) http.Handler {
								slog.Error("failed to template phone", "err", err)
								return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
									w.WriteHeader(http.StatusBadRequest)
									if _, err := io.WriteString(w, err.Error()); err != nil {
										slog.Error("failed to write response", "err", err)
									}
								})
							})).ServeHTTP(w, r)
							return
						case *Challenge_Exif:
							// TODO breadchris generate exif image
							w.Header().Set("Content-Type", "image/jpeg")
							w.Header().Set("Content-Disposition", fmt.Sprintf("attachment; filename=%s.jpg", "image"))
							if err != nil {
								http.Error(w, err.Error(), http.StatusInternalServerError)
								return
							}
							return
						case *Challenge_Pcap:
							w.Header().Set("Content-Type", "application/vnd.tcpdump.pcap")
							w.Header().Set("Content-Disposition", fmt.Sprintf("attachment; filename=%s.pcap", "asdf"))
							err = s.NewPCAP(w, t.Pcap)
							if err != nil {
								http.Error(w, err.Error(), http.StatusInternalServerError)
							}
							return
						case *Challenge_Phone:
							var sess tmpl.PhoneState
							chatState := s.manager.GetChalState(r.Context(), chalId)
							if chatState != nil {
								ss, ok := chatState.(tmpl.PhoneState)
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
								for _, app := range t.Phone.Apps {
									switch t := app.Type.(type) {
									case *App_Tracker:
										if t.Tracker.Password == password {
											// TODO breadchris set message that user is logged in
											sess.TrackerAuthed = true
											s.manager.SetChalState(r.Context(), chalId, sess)
										}
									}
								}
							}
							for _, app := range t.Phone.Apps {
								app.Url, err = templChals(app.Url)
								if err != nil {
									http.Error(w, err.Error(), http.StatusInternalServerError)
									return
								}
							}
							templ.Handler(tmpl.Page(tmpl.Phone(tmpl.PhoneState{
								Flag:          n.Meta.Flag,
								TrackerLogin:  templ.URL(baseURL + "/tracker/login"),
								TrackerAuthed: sess.TrackerAuthed,
							}, t.Phone)), templ.WithErrorHandler(func(r *http.Request, err error) http.Handler {
								slog.Error("failed to template phone", "err", err)
								return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
									w.WriteHeader(http.StatusBadRequest)
									if _, err := io.WriteString(w, err.Error()); err != nil {
										slog.Error("failed to write response", "err", err)
									}
								})
							})).ServeHTTP(w, r)
							return
						case *Challenge_Slack:
						case *Challenge_Twitter:
						case *Challenge_Passshare:
							st := tmpl.PassShareState{
								BaseURL: baseURL,
							}
							if p == "solve" {
								w.Header().Set("Content-Type", "application/json")
								w.WriteHeader(http.StatusOK)
								type req struct {
									Hash string `json:"hash"`
								}
								type res struct {
									Success  bool   `json:"success"`
									Password string `json:"password"`
									Flag     string `json:"flag"`
								}
								writeRes := func(s bool, p string) {
									re := res{
										Success: s,
									}
									if s {
										re.Password = p
										re.Flag = n.Meta.Flag
									}
									b, _ := json.Marshal(re)
									w.Write(b)
								}
								var re req
								if err := json.NewDecoder(r.Body).Decode(&re); err != nil {
									writeRes(false, "")
									return
								}

								for _, sl := range t.Passshare.Solutions {
									if re.Hash == sl.Hash {
										writeRes(true, t.Passshare.Password)
										return
									}
								}
								writeRes(false, t.Passshare.Password)
								return
							}
							templ.Handler(tmpl.Page(tmpl.PassShare(st, t.Passshare)), templ.WithErrorHandler(func(r *http.Request, err error) http.Handler {
								slog.Error("failed to template passshare", "err", err)
								return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
									w.WriteHeader(http.StatusBadRequest)
									if _, err := io.WriteString(w, err.Error()); err != nil {
										slog.Error("failed to write response", "err", err)
									}
								})
							})).ServeHTTP(w, r)
							return
						case *Challenge_Search:
							s := tmpl.SearchState{
								SearchURL: templ.SafeURL(baseURL + "/search"),
							}
							t.Search.Password, err = templChals(t.Search.Password)
							if err != nil {
								http.Error(w, err.Error(), http.StatusInternalServerError)
								return
							}

							var newEntries []string
							for _, se := range t.Search.Entry {
								se, err = templChals(se)
								if err != nil {
									http.Error(w, err.Error(), http.StatusInternalServerError)
									return
								}
								newEntries = append(newEntries, se)
							}
							t.Search.Entry = newEntries

							if p == "search" {
								err := r.ParseForm()
								if err != nil {
									http.Error(w, err.Error(), http.StatusBadRequest)
									return
								}
								q := r.FormValue("query")
								r, err := performSearch(n.Meta.Flag, t.Search, q)
								if err != nil {
									http.Error(w, err.Error(), http.StatusInternalServerError)
									return
								}
								s.Results = r
							}
							templ.Handler(tmpl.Page(tmpl.Search(s, t.Search))).ServeHTTP(w, r)
							return
						case *Challenge_Hashes:
							s := GenerateMD5Hashes(t.Hashes)
							w.Header().Set("Content-Disposition", "attachment; filename=hashes.txt")
							w.Header().Set("Content-Type", "text/plain")
							if p == "rainbow" {
								for _, h := range s {
									_, err := w.Write([]byte(fmt.Sprintf("%s,%s\n", h.Content, h.Hash)))
									if err != nil {
										http.Error(w, err.Error(), http.StatusInternalServerError)
										return
									}
								}
								return
							}
							_, err := w.Write([]byte(n.Meta.Flag + "\n"))
							if err != nil {
								http.Error(w, err.Error(), http.StatusInternalServerError)
								return
							}
							for _, h := range s {
								_, err := w.Write([]byte(h.Hash + "\n"))
								if err != nil {
									http.Error(w, err.Error(), http.StatusInternalServerError)
									return
								}
							}
							return
						}
				*/
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

func ChalURL(scheme, compId, chalID, host string) string {
	path := fmt.Sprintf("/xctf/%s/%s", compId, chalID)
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
