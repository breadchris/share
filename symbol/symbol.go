//go:generate go install github.com/traefik/yaegi/cmd/yaegi@v0.16.1
//go:generate yaegi extract github.com/breadchris/share/html2
//go:generate yaegi extract github.com/gosimple/slug
//go:generate yaegi extract github.com/samber/lo
//go:generate yaegi extract github.com/yuin/goldmark
//go:generate yaegi extract github.com/yuin/goldmark/parser
//go:generate yaegi extract go.abhg.dev/goldmark/frontmatter
package symbol

import "reflect"

var Symbols = map[string]map[string]reflect.Value{}
