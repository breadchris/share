package coderunner

import (
	. "github.com/breadchris/share/html"
)

// ReactImportMap returns a script tag with React import mappings
func ReactImportMap() *Node {
	return Script(Type("importmap"), Raw(`
    {
        "imports": {
            "react": "https://esm.sh/react@18",
            "react-dom": "https://esm.sh/react-dom@18",
            "react-dom/client": "https://esm.sh/react-dom@18/client",
            "react/jsx-runtime": "https://esm.sh/react@18/jsx-runtime",
			"@connectrpc/connect": "https://esm.sh/@connectrpc/connect",
			"@connectrpc/connect-web": "https://esm.sh/@connectrpc/connect-web"
        }
    }
    `))
}

// ComponentPageLayout creates the standard layout for component pages
func ComponentPageLayout(title string, children ...*Node) *Node {
	return Html(
		Head(
			Meta(Charset("UTF-8")),
			Meta(Name("viewport"), Content("width=device-width, initial-scale=1.0")),
			Title(T(title)),
		),
		Body(children...),
	)
}

// ErrorDisplay creates an error display div
func ErrorDisplay(title, message string, details []string) *Node {
	errorItems := make([]*Node, len(details))
	for i, detail := range details {
		errorItems[i] = Div(Class("error-item"), T(detail))
	}

	return Div(Class("error"),
		H1(T(title)),
		If(message != "", P(T(message)), Nil()),
		Div(Class("error-list"), Ch(errorItems)),
	)
}

// ComponentErrorStyles returns CSS styles for error displays
func ComponentErrorStyles() *Node {
	return Style(Raw(`
        body { font-family: monospace; margin: 20px; background: #fff5f5; }
        .error { background: #fed7d7; border: 1px solid #fc8181; padding: 15px; border-radius: 5px; }
        .error h1 { color: #c53030; margin-top: 0; }
        .error-list { margin: 10px 0; }
        .error-item { margin: 5px 0; padding: 5px; background: #ffffff; border-radius: 3px; }
    `))
}

// ComponentRuntimeStyles returns CSS styles for component runtime
func ComponentRuntimeStyles() *Node {
	return Style(Raw(`
        body { margin: 0; padding: 0; font-family: system-ui, -apple-system, sans-serif; }
        #root { width: 100%; height: 100vh; }
        .error { 
            padding: 20px; 
            color: #dc2626; 
            background: #fef2f2; 
            border: 1px solid #fecaca; 
            margin: 20px; 
            border-radius: 8px;
            font-family: monospace;
        }
    `))
}

// ComponentLoader creates the JavaScript module loader for a component
func ComponentLoader(componentPath, componentName string, useModuleEndpoint bool) *Node {
	var jsCode string

	if useModuleEndpoint {
		importPath := "/coderunner/module/" + componentPath
		jsCode = `
        try {
            // Import the compiled component module from the /module/ endpoint
            const componentModule = await import('` + importPath + `');
            
            // Import React and ReactDOM
            const React = await import('react');
            const ReactDOM = await import('react-dom/client');
            
            // Try to get the component to render
            let ComponentToRender;
            
            // First try the specified component name
            if (componentModule.` + componentName + `) {
                console.log('Rendering component:', componentModule.` + componentName + `);
                ComponentToRender = componentModule.` + componentName + `;
            }
            // Then try default export
            else if (componentModule.default) {
                console.log('Rendering default component:', componentModule.default);
                ComponentToRender = componentModule.default;
            }
            else {
                throw new Error('No component found. Make sure to export a component named "` + componentName + `" or a default export.');
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
        }`
	} else {
		// For fullrender, we need to fetch the JS file and create a blob URL
		jsCode = `
        try {
            // Read the generated JavaScript file
            const response = await fetch('/coderunner/fullrender/js/` + componentPath + `/` + componentName + `.js');
            const jsCode = await response.text();
            
            // Create a blob URL for the module
            const blob = new Blob([jsCode], { type: 'application/javascript' });
            const moduleUrl = URL.createObjectURL(blob);
            
            // Import the module
            const componentModule = await import(moduleUrl);
            
            // Import React and ReactDOM
            const React = await import('react');
            const ReactDOM = await import('react-dom/client');
            
            // Try to get the component to render
            let ComponentToRender;
            
            // First try the specified component name
            if (componentModule.` + componentName + `) {
                console.log('Rendering component:', componentModule.` + componentName + `);
                ComponentToRender = componentModule.` + componentName + `;
            }
            // Then try default export
            else if (componentModule.default) {
                console.log('Rendering default component:', componentModule.default);
                ComponentToRender = componentModule.default;
            }
            else {
                throw new Error('No component found. Make sure to export a component named "` + componentName + `" or a default export.');
            }
            
            // Render the component
            const root = ReactDOM.createRoot(document.getElementById('root'));
            root.render(React.createElement(ComponentToRender));
            
            // Clean up blob URL
            URL.revokeObjectURL(moduleUrl);
            
        } catch (error) {
            console.error('Runtime Error:', error);
            document.getElementById('root').innerHTML = 
                '<div class="error">' +
                '<h3>Runtime Error:</h3>' +
                '<pre>' + error.message + '</pre>' +
                '<pre>' + (error.stack || '') + '</pre>' +
                '</div>';
        }`
	}

	return Script(Type("module"), Raw(jsCode))
}

// CSSLinks generates link tags for CSS files
func CSSLinks(componentPath string, cssFiles []string) []*Node {
	links := make([]*Node, len(cssFiles))
	for i, cssFile := range cssFiles {
		links[i] = Link(
			Rel("stylesheet"),
			Type("text/css"),
			Href("/coderunner/fullrender/css/"+componentPath+"/"+cssFile),
		)
	}
	return links
}

// BuildErrorPage creates a complete error page for build failures
func BuildErrorPage(componentPath string, errorMessages []string) *Node {
	return ComponentPageLayout("Build Error",
		ComponentErrorStyles(),
		ErrorDisplay(
			"Build Error",
			"Failed to build component from "+componentPath,
			errorMessages,
		),
	)
}

// ReactComponentPage creates a page that renders a React component
func ReactComponentPage(componentName string, additionalHeadNodes ...*Node) *Node {
	headNodes := []*Node{
		Meta(Charset("UTF-8")),
		Meta(Name("viewport"), Content("width=device-width, initial-scale=1.0")),
		Title(T("React Component - " + componentName)),
		ReactImportMap(),
		Link(Rel("stylesheet"), Type("text/css"), Href("https://cdn.jsdelivr.net/npm/daisyui@5")),
		Script(Src("https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4")),
		ComponentRuntimeStyles(),
	}
	headNodes = append(headNodes, additionalHeadNodes...)

	return Html(
		Head(Ch(headNodes)),
		Body(
			Div(Id("root")),
		),
	)
}

// ReactComponentPageWithCSS creates a page that renders a React component with additional CSS files
func ReactComponentPageWithCSS(componentName, componentPath string, jsFileName string, cssFiles []string) *Node {
	cssLinks := CSSLinks(componentPath, cssFiles)

	headNodes := []*Node{
		Meta(Charset("UTF-8")),
		Meta(Name("viewport"), Content("width=device-width, initial-scale=1.0")),
		Title(T("React Component - " + componentName)),
		ReactImportMap(),
	}
	headNodes = append(headNodes, cssLinks...)
	headNodes = append(headNodes, ComponentRuntimeStyles())

	return Html(
		Head(Ch(headNodes)),
		Body(
			Div(Id("root")),
			ComponentLoader(componentPath+"/"+jsFileName, componentName, false),
		),
	)
}
