//go:generate go install github.com/traefik/yaegi/cmd/yaegi@v0.16.1
//go:generate yaegi extract github.com/breadchris/share/html
//go:generate yaegi extract github.com/breadchris/share/deps
//go:generate yaegi extract github.com/breadchris/share/config
//go:generate yaegi extract github.com/breadchris/share/llm
//go:generate yaegi extract github.com/gosimple/slug
//go:generate yaegi extract github.com/samber/lo
//go:generate yaegi extract github.com/yuin/goldmark
//go:generate yaegi extract github.com/yuin/goldmark/parser
//go:generate yaegi extract go.abhg.dev/goldmark/frontmatter
//go:generate yaegi extract net/http
//go:generate yaegi extract github.com/snabb/sitemap
//go:generate yaegi extract gopkg.in/yaml.v3
//go:generate yaegi extract github.com/google/uuid
//go:generate yaegi extract os/exec
//go:generate yaegi extract github.com/go-git/go-git/v5
//go:generate yaegi extract github.com/sashabaranov/go-openai/jsonschema
//go:generate yaegi extract github.com/sashabaranov/go-openai
package symbol

import "reflect"

var Symbols = map[string]map[string]reflect.Value{}
