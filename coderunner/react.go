package coderunner

import (
	"net/http"
	. "github.com/breadchris/share/html"
)

// ServeReactApp serves a React application with the standard layout and dependencies
// This provides a reusable pattern for hosting React apps with esbuild compilation
func ServeReactApp(w http.ResponseWriter, r *http.Request, componentPath, componentName string) {
	DefaultLayout(
		Script(Type("importmap"), Raw(`
	   {
	       "imports": {
	           "react": "https://esm.sh/react@18",
	           "react-dom": "https://esm.sh/react-dom@18",
	           "react-dom/client": "https://esm.sh/react-dom@18/client",
	           "react/jsx-runtime": "https://esm.sh/react@18/jsx-runtime"
	       }
	   }
`)),
		Script(Src("https://cdn.tailwindcss.com")),
		Div(Id("root")),
		LoadModule(componentPath, componentName),
	).RenderPage(w, r)
}

// ServeReactAppWithProps serves a React application with initial props
// This is useful for passing server-side data to the React component
func ServeReactAppWithProps(w http.ResponseWriter, r *http.Request, componentPath, componentName string, beforeRoot ...*Node) {
	children := []*Node{
		Script(Type("importmap"), Raw(`
	   {
	       "imports": {
	           "react": "https://esm.sh/react@18",
	           "react-dom": "https://esm.sh/react-dom@18",
	           "react-dom/client": "https://esm.sh/react-dom@18/client",
	           "react/jsx-runtime": "https://esm.sh/react@18/jsx-runtime"
	       }
	   }
`)),
		Script(Src("https://cdn.tailwindcss.com")),
	}
	
	// Add any nodes that should appear before the root div
	children = append(children, beforeRoot...)
	
	// Add the root div and module loader
	children = append(children, 
		Div(Id("root")),
		LoadModule(componentPath, componentName),
	)
	
	DefaultLayout(children...).RenderPage(w, r)
}