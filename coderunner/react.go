package coderunner

import (
	"encoding/json"
	"fmt"
	"log"
	"os"
	"path/filepath"

	. "github.com/breadchris/share/html"
	"github.com/evanw/esbuild/pkg/api"
	"net/http"
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

// LoadModule creates a script node that loads and renders a React component module
// componentPath: path to the component file (e.g., "claudemd/ClaudeDocApp.tsx")
// componentName: name of the component to render (e.g., "ClaudeDocApp")
func LoadModule(componentPath, componentName string) *Node {
	return Script(Type("module"), Raw(`
        try {
            // Import the compiled component module from the /module/ endpoint
            const componentModule = await import('/code/module/`+componentPath+`');
            
            // Import React and ReactDOM
            const React = await import('react');
            const ReactDOM = await import('react-dom/client');
            
            // Try to get the component to render
            let ComponentToRender;
            
            // First try the specified component name
            if (componentModule.`+componentName+`) {
				console.log('Rendering component:', componentModule.`+componentName+`);
                ComponentToRender = componentModule.`+componentName+`;
            }
            // Then try default export
            else if (componentModule.default) {
				console.log('Rendering default component:', componentModule.default);
                ComponentToRender = componentModule.default;
            }
            else {
                throw new Error('No component found. Make sure to export a component named "`+componentName+`" or a default export.');
            }
            
            // Render the component
            const root = ReactDOM.createRoot(document.getElementById('root'));
            root.render(React.createElement(ComponentToRender));
            
        } catch (error) {
            console.error('Runtime Error:', error);
            document.getElementById('root').innerHTML = 
                '<div class="error">' +
                '<h3>Runtime Error:</h3>' +
                '<pre>' + error.message + '</pre>' +
                '<pre>' + (error.stack || '') + '</pre>' +
                '</div>';
        }
    </script>
`))
}

// BuildComponentResult holds the result of building a React component
type BuildComponentResult struct {
	JSFileName string
	CSSFiles   []string
	ErrorMsgs  []string
	HasErrors  bool
}

// buildComponentWithCSS builds a React component with esbuild and returns build results
func buildComponentWithCSS(componentPath, componentName string) *BuildComponentResult {
	result := &BuildComponentResult{}

	// Check if file exists
	if _, err := os.Stat(componentPath); os.IsNotExist(err) {
		result.ErrorMsgs = []string{fmt.Sprintf("Component file not found: %s", componentPath)}
		result.HasErrors = true
		return result
	}

	// Create output directory for fullrender
	outputDir := filepath.Join("data/fullrender", componentPath)
	if err := os.MkdirAll(outputDir, 0755); err != nil {
		result.ErrorMsgs = []string{fmt.Sprintf("Failed to create output directory: %v", err)}
		result.HasErrors = true
		return result
	}

	// Build with esbuild using the same configuration as handleFullRenderComponent
	buildResult := api.Build(api.BuildOptions{
		EntryPoints: []string{componentPath},
		Outdir:      outputDir,
		Loader: map[string]api.Loader{
			".js":    api.LoaderJS,
			".jsx":   api.LoaderJSX,
			".ts":    api.LoaderTS,
			".tsx":   api.LoaderTSX,
			".css":   api.LoaderCSS,
			".woff":  api.LoaderFile,
			".woff2": api.LoaderFile,
		},
		Format:          api.FormatESModule,
		Bundle:          true,
		Write:           true,
		Sourcemap:       api.SourceMapInline,
		TreeShaking:     api.TreeShakingTrue,
		Target:          api.ESNext,
		JSX:             api.JSXAutomatic,
		JSXImportSource: "react",
		LogLevel:        api.LogLevelSilent,
		External:        []string{"react", "react-dom", "react-dom/client", "react/jsx-runtime"},
		AssetNames:      "[name]-[hash]",
		EntryNames:      "[name]",
		TsconfigRaw: `{
			"compilerOptions": {
				"jsx": "react-jsx",
				"allowSyntheticDefaultImports": true,
				"esModuleInterop": true,
				"moduleResolution": "node",
				"target": "ESNext",
				"lib": ["ESNext", "DOM", "DOM.Iterable"],
				"allowJs": true,
				"skipLibCheck": true,
				"strict": false,
				"forceConsistentCasingInFileNames": true,
				"noEmit": true,
				"incremental": true,
				"resolveJsonModule": true,
				"isolatedModules": true
			}
		}`,
	})

	// Check for build errors
	if len(buildResult.Errors) > 0 {
		errorMessages := make([]string, len(buildResult.Errors))
		for i, err := range buildResult.Errors {
			errorMessages[i] = fmt.Sprintf("%s:%d:%d: %s", err.Location.File, err.Location.Line, err.Location.Column, err.Text)
		}
		result.ErrorMsgs = errorMessages
		result.HasErrors = true
		return result
	}

	// Find generated files in the output directory
	files, err := os.ReadDir(outputDir)
	if err != nil {
		result.ErrorMsgs = []string{fmt.Sprintf("Failed to read output directory: %v", err)}
		result.HasErrors = true
		return result
	}

	var jsFiles, cssFiles []string
	for _, file := range files {
		if !file.IsDir() {
			fileName := file.Name()
			ext := filepath.Ext(fileName)
			if ext == ".js" {
				jsFiles = append(jsFiles, fileName)
			} else if ext == ".css" {
				cssFiles = append(cssFiles, fileName)
			}
		}
	}

	if len(jsFiles) == 0 {
		result.ErrorMsgs = []string{"No JavaScript output generated"}
		result.HasErrors = true
		return result
	}

	result.JSFileName = jsFiles[0]
	result.CSSFiles = cssFiles

	return result
}

// ServeFullRenderComponent serves a React component using the full render approach
// This extracts the core logic from handleFullRenderComponent and makes it reusable
func ServeFullRenderComponent(w http.ResponseWriter, r *http.Request, componentPath, componentName string) {
	// Build the component with CSS extraction
	buildResult := buildComponentWithCSS(componentPath, componentName)

	// Handle build errors
	if buildResult.HasErrors {
		errorPage := BuildErrorPage(componentPath, buildResult.ErrorMsgs)
		w.Header().Set("Content-Type", "text/html")
		w.Write([]byte(errorPage.Render()))
		return
	}

	// Create the complete HTML page with CSS links and component loader
	page := ReactComponentPageWithCSS(
		componentName,
		componentPath,
		buildResult.JSFileName,
		buildResult.CSSFiles,
	)

	// Serve the page
	w.Header().Set("Content-Type", "text/html")
	w.Write([]byte(page.Render()))
}

// ServeFullRenderComponentWithProps serves a React component with server-side props
func ServeFullRenderComponentWithProps(w http.ResponseWriter, r *http.Request, componentPath, componentName string, props interface{}) {
	// Build the component
	buildResult := buildComponentWithCSS(componentPath, componentName)

	if buildResult.HasErrors {
		errorPage := BuildErrorPage(componentPath, buildResult.ErrorMsgs)
		w.Header().Set("Content-Type", "text/html")
		w.Write([]byte(errorPage.Render()))
		return
	}

	// Serialize props to JSON
	var propsScript *Node
	if props != nil {
		propsJSON, err := json.Marshal(props)
		if err != nil {
			log.Printf("Error marshaling props: %v", err)
			propsScript = Script(Type("text/javascript"), Raw("window.__PROPS__ = {};"))
		} else {
			propsScript = Script(Type("text/javascript"), Raw(fmt.Sprintf("window.__PROPS__ = %s;", string(propsJSON))))
		}
	} else {
		propsScript = Script(Type("text/javascript"), Raw("window.__PROPS__ = {};"))
	}

	// Create page with props injection
	cssLinks := CSSLinks(componentPath, buildResult.CSSFiles)

	headNodes := []*Node{
		Meta(Charset("UTF-8")),
		Meta(Name("viewport"), Content("width=device-width, initial-scale=1.0")),
		Title(T("React Component - " + componentName)),
		ReactImportMap(),
		Link(Rel("stylesheet"), Type("text/css"), Href("https://cdn.jsdelivr.net/npm/daisyui@5")),
		Script(Src("https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4")),
		propsScript,
	}
	headNodes = append(headNodes, cssLinks...)
	headNodes = append(headNodes, ComponentRuntimeStyles())

	page := Html(
		Head(Ch(headNodes)),
		Body(
			Div(Id("root")),
			ComponentLoader(componentPath+"/"+buildResult.JSFileName, componentName, false),
		),
	)

	w.Header().Set("Content-Type", "text/html")
	w.Write([]byte(page.Render()))
}
