package xctf

import (
	. "github.com/breadchris/share/html"
	"github.com/breadchris/share/xctf/chalgen"
)

type Post struct {
	Username string
	Content  string
}

type TwitterState struct {
	Flag  string
	Posts []chalgen.EvidencePost
}

func RenderTwitter(s TwitterState) *Node {
	var posts []*Node
	for _, post := range s.Posts {
		posts = append(posts, Div(Class("card my-3"),
			Div(Class("card-body d-flex"),
				Img(Src("https://randomuser.me/api/portraits/lego/1.jpg"), Alt("Profile Image"), Class("profile-img mr-3")),
				Div(
					H5(Class("card-title mb-0"), T(post.Username)),
					P(Class("card-text mt-2"), Raw(post.Content)),
				),
			),
		))
	}
	return Html(
		Head(
			Meta(Charset("UTF-8")),
			Meta(Attrs(map[string]string{
				"name":    "viewport",
				"content": "width=device-width, initial-scale=1.0",
			})),
			Title(T("x^2")),
			Link(
				Href("https://stackpath.bootstrapcdn.com/bootstrap/4.5.2/css/bootstrap.min.css"),
				Attr("rel", "stylesheet"),
			),
			Style(T(`
				body {
					background-color: #000000;
					color: #ffffff;
				}
				.navbar {
					background-color: #000000;
				}
				.navbar-brand {
					color: #fff;
				}
				.navbar-text {
					color: #fff;
				}
				.card {
					border: none;
					background-color: #222222;
				}
				.card-body {
					padding: 0.5rem 1rem;
				}
				.profile-img {
					width: 50px;
					height: 50px;
					border-radius: 50%;
				}
				.comment {
					padding-left: 3rem;
					font-size: 0.9rem;
				}
				.comment-form {
					padding-left: 3rem;
					padding-top: 1rem;
				}
			`)),
		),
		Body(
			Nav(Class("navbar border-bottom border-secondary navbar-expand"),
				Ul(Class("navbar-nav mr-auto"),
					Li(Class("nav-item active"),
						P(Class("navbar-brand mb-0"), T("X^2")),
					),
				),
			),
			Div(Class("container mt-3"),
				Ch(posts),
			),
			Script(Src("https://code.jquery.com/jquery-3.5.1.slim.min.js")),
			Script(Src("https://cdn.jsdelivr.net/npm/@popperjs/core@2.0.5/dist/umd/popper.min.js")),
			Script(Src("https://stackpath.bootstrapcdn.com/bootstrap/4.5.2/js/bootstrap.min.js")),
		),
	)
}
