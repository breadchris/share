package coderunner

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

// ServeReactAppProduction serves a React application with self-contained production assets
// This generates a minimal HTML page that loads a pre-built bundle with no external dependencies
func ServeReactAppProduction(w http.ResponseWriter, r *http.Request, bundlePath string) {
	htmlContent := `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Supabase CLAUDE.md Platform</title>
    
    <!-- Self-contained styling -->
    <style>
        /* Reset and base styles */
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body { 
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            background-color: #f9fafb;
            color: #111827;
            line-height: 1.6;
        }
        
        #root { 
            width: 100%; 
            min-height: 100vh; 
        }
        
        /* Loading styles */
        .loading {
            display: flex;
            align-items: center;
            justify-content: center;
            height: 100vh;
            gap: 12px;
            flex-direction: column;
        }
        
        .spinner {
            border: 3px solid #e5e7eb;
            border-top: 3px solid #3b82f6;
            border-radius: 50%;
            width: 40px;
            height: 40px;
            animation: spin 1s linear infinite;
        }
        
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        
        /* Error styles */
        .error { 
            padding: 24px; 
            color: #dc2626; 
            background: #fef2f2; 
            border: 2px solid #fecaca; 
            margin: 20px; 
            border-radius: 12px;
            font-family: 'Monaco', 'Menlo', monospace;
            max-width: 800px;
            margin: 20px auto;
        }
        
        .error h3 {
            margin-bottom: 16px;
            font-size: 18px;
        }
        
        .error pre {
            background: #ffffff;
            padding: 12px;
            border-radius: 6px;
            overflow-x: auto;
            margin: 12px 0;
            border: 1px solid #fca5a5;
        }
        
        .error ul {
            margin: 16px 0;
            padding-left: 20px;
        }
        
        .error li {
            margin: 8px 0;
        }
        
        /* Basic utility styles for components */
        .btn {
            padding: 8px 16px;
            border-radius: 6px;
            border: 1px solid #d1d5db;
            background: #ffffff;
            cursor: pointer;
            font-size: 14px;
            transition: all 0.2s;
        }
        
        .btn:hover {
            background: #f3f4f6;
        }
        
        .btn-primary {
            background: #3b82f6;
            color: white;
            border-color: #3b82f6;
        }
        
        .btn-primary:hover {
            background: #2563eb;
        }
        
        .card {
            background: white;
            border-radius: 8px;
            padding: 24px;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
            border: 1px solid #e5e7eb;
        }
        
        .input {
            padding: 8px 12px;
            border: 1px solid #d1d5db;
            border-radius: 6px;
            font-size: 14px;
            width: 100%;
        }
        
        .input:focus {
            outline: none;
            border-color: #3b82f6;
            box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }
        
        /* Layout utilities */
        .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 0 16px;
        }
        
        .flex {
            display: flex;
        }
        
        .flex-col {
            flex-direction: column;
        }
        
        .gap-4 {
            gap: 16px;
        }
        
        .p-4 {
            padding: 16px;
        }
        
        .mt-4 {
            margin-top: 16px;
        }
        
        .mb-4 {
            margin-bottom: 16px;
        }
        
        .text-lg {
            font-size: 18px;
        }
        
        .text-xl {
            font-size: 20px;
        }
        
        .text-2xl {
            font-size: 24px;
        }
        
        .font-bold {
            font-weight: 700;
        }
        
        .text-gray-600 {
            color: #6b7280;
        }
        
        .text-center {
            text-align: center;
        }
        
        .min-h-screen {
            min-height: 100vh;
        }
        
        .bg-gray-50 {
            background-color: #f9fafb;
        }
        
        .bg-white {
            background-color: #ffffff;
        }
        
        .rounded {
            border-radius: 6px;
        }
        
        .shadow {
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }
    </style>
</head>
<body>
    <div id="root">
        <div class="loading">
            <div class="spinner"></div>
            <div>Loading Supabase CLAUDE.md Platform...</div>
        </div>
    </div>
    
    <!-- Self-contained bundled application -->
    <script src="` + bundlePath + `"></script>
</body>
</html>`

	w.Header().Set("Content-Type", "text/html")
	w.Write([]byte(htmlContent))
}

// LoadModule creates a script node that loads and renders a React component module
// componentPath: path to the component file (e.g., "claudemd/ClaudeDocApp.tsx")
// componentName: name of the component to render (e.g., "ClaudeDocApp")
func LoadModule(componentPath, componentName string) *Node {
	return Script(Type("module"), Raw(`
        try {
            // Import the compiled component module from the /module/ endpoint
            const componentModule = await import('/coderunner/module/`+componentPath+`');
            
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
