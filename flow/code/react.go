package code

import (
	. "github.com/breadchris/share/html"
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
	           "react/jsx-runtime": "https://esm.sh/react@18/jsx-runtime",
               "@connectrpc/connect-web": "https://esm.sh/@connectrpc/connect-web",
               "@connectrpc/connect": "https://esm.sh/@connectrpc/connect"
	       }
	   }
`)),
		Script(Src("https://cdn.tailwindcss.com")),
		Div(Id("root")),
		LoadModule(componentPath, componentName),
	).RenderPage(w, r)
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
