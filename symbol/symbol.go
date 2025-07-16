//go:generate go install github.com/breadchris/yaegi/cmd/yaegi
//go:generate yaegi extract github.com/breadchris/share/html
//go:generate yaegi extract github.com/breadchris/share/deps
//go:generate yaegi extract github.com/breadchris/share/config
//go:generate yaegi extract github.com/breadchris/share/ai
//go:generate yaegi extract github.com/breadchris/share/session
//go:generate yaegi extract github.com/breadchris/share/breadchris/posts
//go:generate yaegi extract github.com/breadchris/share/coderunner
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
//go:generate yaegi extract github.com/google/go-github/v66/github
//go:generate yaegi extract github.com/gorilla/sessions
//go:generate yaegi extract github.com/markbates/goth/gothic
//go:generate yaegi extract github.com/go-git/go-git/v5/plumbing
//go:generate yaegi extract golang.org/x/oauth2
//go:generate yaegi extract gorm.io/gorm
//go:generate yaegi extract gorm.io/gorm/clause
//go:generate yaegi extract github.com/breadchris/share/models
//go:generate yaegi extract github.com/pkg/errors
//go:generate yaegi extract github.com/kkdai/youtube/v2
//go:generate yaegi extract golang.org/x/net/http/httpproxy
//go:generate yaegi extract gorm.io/datatypes
//go:generate yaegi extract github.com/breadchris/share/xctf/models
//go:generate yaegi extract github.com/google/gopacket
//go:generate yaegi extract github.com/google/gopacket/pcapgo
//go:generate yaegi extract github.com/google/gopacket/layers
//go:generate yaegi extract github.com/breadchris/share/xctf/chalgen
//go:generate yaegi extract github.com/yeka/zip
//go:generate yaegi extract github.com/dsoprea/go-exif/v2/common
//go:generate yaegi extract github.com/dsoprea/go-exif/v3
//go:generate yaegi extract github.com/dsoprea/go-jpeg-image-structure/v2
//go:generate yaegi extract github.com/breadchris/share/db
//go:generate yaegi extract github.com/evanw/esbuild/pkg/api
//go:generate yaegi extract github.com/breadchris/share/gen/proto/kanban/kanbanconnect
//go:generate yaegi extract github.com/breadchris/share/gen/proto/kanban

// Slack and Flow module dependencies for yaegi interpretation
//go:generate yaegi extract github.com/slack-go/slack
//go:generate yaegi extract github.com/slack-go/slack/slackevents
//go:generate yaegi extract github.com/slack-go/slack/socketmode
//go:generate yaegi extract github.com/breadchris/flow/claude
//go:generate yaegi extract github.com/breadchris/flow/config
//go:generate yaegi extract github.com/breadchris/flow/deps
//go:generate yaegi extract github.com/breadchris/flow/worklet
//go:generate yaegi extract github.com/breadchris/flow/slackbot
//go:generate yaegi extract context
//go:generate yaegi extract sync
//go:generate yaegi extract time
//go:generate yaegi extract encoding/json
//go:generate yaegi extract strings
//go:generate yaegi extract fmt
//go:generate yaegi extract log/slog

/*
TODO breadchris, problematic collision of http package name
go:generate yaegi extract github.com/go-git/go-git/v5/plumbing/transport/http
*/

package symbol

import "reflect"

var Symbols = map[string]map[string]reflect.Value{}
