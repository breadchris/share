package code

import (
	"github.com/breadchris/flow/config"
	. "github.com/breadchris/share/html"
)

// ReactImportMap returns a script tag with React import mappings
func ReactImportMap(c config.AppConfig) *Node {
	return Script(Type("importmap"), Raw(`
    {
        "imports": {
            "react": "https://esm.sh/react@18",
            "react-dom": "https://esm.sh/react-dom@18",
            "react-dom/client": "https://esm.sh/react-dom@18/client",
            "react/jsx-runtime": "https://esm.sh/react@18/jsx-runtime",
			"supabase-kv": "`+c.ExternalURL+`/code/module/flow/supabase-kv.ts",
			"@connectrpc/connect-web": "https://esm.sh/@connectrpc/connect-web",
			"@connectrpc/connect": "https://esm.sh/@connectrpc/connect"
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
		importPath := "/code/module/" + componentPath
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
	}

	return Script(Type("module"), Raw(jsCode))
}

// CommonJSLoader creates a script that loads and renders a bundled React component using CommonJS
func CommonJSLoader(componentName, compiledJS string) *Node {
	jsCode := `
        try {
            // Create a CommonJS environment for the browser
            (function() {
                // Set up module system shim
                const module = { exports: {} };
                const exports = module.exports;
                const require = function(id) {
                    // For CommonJS bundles, we need to handle built-in requires
                    throw new Error('require() not implemented for: ' + id);
                };
                
                // Execute the CommonJS bundle
                ` + compiledJS + `
                
                // Get the exported component
                const componentModule = module.exports;
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
                // If it's a function itself, use it directly
                else if (typeof componentModule === 'function') {
                    console.log('Rendering module as component:', componentModule);
                    ComponentToRender = componentModule;
                }
                else {
                    throw new Error('No component found. Make sure to export a component named "` + componentName + `" or a default export. Found: ' + Object.keys(componentModule).join(', '));
                }
                
                // We need React and ReactDOM - try to get them from the bundle or CDN
                if (typeof React === 'undefined' || typeof ReactDOM === 'undefined') {
                    // Load React from CDN if not bundled
                    const reactScript = document.createElement('script');
                    reactScript.src = 'https://unpkg.com/react@18/umd/react.development.js';
                    const reactDOMScript = document.createElement('script');
                    reactDOMScript.src = 'https://unpkg.com/react-dom@18/umd/react-dom.development.js';
                    
                    // Load React first, then ReactDOM, then render
                    reactScript.onload = function() {
                        document.head.appendChild(reactDOMScript);
                        reactDOMScript.onload = function() {
                            renderComponent();
                        };
                    };
                    document.head.appendChild(reactScript);
                } else {
                    renderComponent();
                }
                
                function renderComponent() {
                    try {
                        const root = ReactDOM.createRoot(document.getElementById('root'));
                        root.render(React.createElement(ComponentToRender));
                    } catch (renderError) {
                        console.error('Render Error:', renderError);
                        document.getElementById('root').innerHTML = 
                            '<div class="error">' +
                            '<h3>Render Error:</h3>' +
                            '<pre>' + renderError.message + '</pre>' +
                            '<pre>' + (renderError.stack || '') + '</pre>' +
                            '</div>';
                    }
                }
            })();
            
        } catch (error) {
            console.error('Runtime Error:', error);
            document.getElementById('root').innerHTML = 
                '<div class="error">' +
                '<h3>Runtime Error:</h3>' +
                '<pre>' + error.message + '</pre>' +
                '<pre>' + (error.stack || '') + '</pre>' +
                '</div>';
        }`

	return Script(Raw(jsCode))
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
func ReactComponentPage(c config.AppConfig, componentName string, additionalHeadNodes ...*Node) *Node {
	headNodes := []*Node{
		Meta(Charset("UTF-8")),
		Meta(Name("viewport"), Content("width=device-width, initial-scale=1.0")),
		Title(T("React Component - " + componentName)),
		ReactImportMap(c),
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

// CommonJSComponentPage creates a page that renders a React component using CommonJS/IIFE bundle
func CommonJSComponentPage(c config.AppConfig, componentName, compiledJS string) *Node {
	return Html(
		Head(
			Meta(Charset("UTF-8")),
			Meta(Name("viewport"), Content("width=device-width, initial-scale=1.0")),
			Title(T("React Component - "+componentName)),
			Link(Rel("stylesheet"), Type("text/css"), Href("https://cdn.jsdelivr.net/npm/daisyui@5")),
			Script(Src("https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4")),
			ComponentRuntimeStyles(),
		),
		Body(
			Div(Id("root")),
			CommonJSLoader(componentName, compiledJS),
		),
	)
}
