//go:generate go install github.com/cogentcore/yaegi/cmd/yaegi
//go:generate yaegi extract github.com/breadchris/share/html
//go:generate yaegi extract github.com/breadchris/share/deps
//go:generate yaegi extract github.com/breadchris/share/calendar
//go:generate yaegi extract github.com/breadchris/share/config
//go:generate yaegi extract github.com/breadchris/share/llm
//go:generate yaegi extract github.com/breadchris/share/session
//go:generate yaegi extract github.com/breadchris/share/breadchris/posts
//go:generate yaegi extract github.com/gosimple/slug
//go:generate yaegi extract github.com/samber/lo
//go:generate yaegi extract github.com/yuin/goldmark
//go:generate yaegi extract github.com/yuin/goldmark/parser
//go:generate yaegi extract go.abhg.dev/goldmark/frontmatter
//go:generate yaegi extract net/http
//go:generate yaegi extract golang.org/x/net/html
//go:generate yaegi extract github.com/snabb/sitemap
//go:generate yaegi extract gopkg.in/yaml.v3
//go:generate yaegi extract github.com/google/uuid
//go:generate yaegi extract os/exec
//go:generate yaegi extract github.com/go-git/go-git/v5
//go:generate yaegi extract github.com/sashabaranov/go-openai/jsonschema
//go:generate yaegi extract github.com/sashabaranov/go-openai
//go:generate yaegi extract golang.org/x/oauth2/clientcredentials
//go:generate yaegi extract github.com/zmb3/spotify/v2
//go:generate yaegi extract github.com/zmb3/spotify/v2/auth
//go:generate yaegi extract github.com/evanphx/json-patch/v5
//go:generate yaegi extract github.com/stripe/stripe-go/v80
//go:generate yaegi extract github.com/stripe/stripe-go/v80/checkout/session
//go:generate yaegi extract github.com/PuerkitoBio/goquery
//go:generate yaegi extract github.com/gorilla/websocket
//go:generate yaegi extract github.com/russross/blackfriday/v2
//go:generate yaegi extract github.com/go-shiori/dom
//go:generate yaegi extract github.com/go-shiori/go-readability
//go:generate yaegi extract github.com/markbates/goth/providers/github
//go:generate yaegi extract github.com/google/go-github/v55/github
//go:generate yaegi extract github.com/gorilla/sessions
//go:generate yaegi extract github.com/markbates/goth/gothic
//go:generate yaegi extract golang.org/x/oauth2

package symbol

import "reflect"

var Symbols = map[string]map[string]reflect.Value{}
