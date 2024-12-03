//go:generate go install github.com/breadchris/yaegi/cmd/yaegi
//go:generate yaegi extract github.com/breadchris/share/html
//go:generate yaegi extract github.com/breadchris/share/config
//go:generate yaegi extract github.com/snabb/sitemap
//go:generate yaegi extract github.com/yuin/goldmark
//go:generate yaegi extract github.com/yuin/goldmark/parser
//go:generate yaegi extract go.abhg.dev/goldmark/frontmatter
//go:generate yaegi extract golang.org/x/net/html
//go:generate yaegi extract gopkg.in/yaml.v3
//go:generate yaegi extract github.com/gosimple/slug
//go:generate yaegi extract syscall/js
package symbol

import "reflect"

var Symbols = map[string]map[string]reflect.Value{}
