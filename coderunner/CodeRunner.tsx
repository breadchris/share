import React, { useEffect, useState, useRef, MutableRefObject } from 'react';
import MonacoEditor, { type Monaco, loader } from '@monaco-editor/react';
import { createRoot } from 'react-dom/client';
import * as monaco from 'monaco-editor';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';

let loaderConfigured = false;
export const configureMonacoLoader = () => {
    if (loaderConfigured) {
        return;
    }
    loader.config({ monaco });
    loaderConfigured = true;
};

const nodeModules = '/static/node_modules/monaco-editor/esm/vs/';
window.MonacoEnvironment = {
    getWorkerUrl: function (moduleId, label) {
        if (label === 'json') {
            return nodeModules + 'language/json/json.worker.js';
        }
        if (label === 'css' || label === 'scss' || label === 'less') {
            return nodeModules + 'language/css/css.worker.js';
        }
        if (label === 'html' || label === 'handlebars' || label === 'razor') {
            return nodeModules + 'language/html/html.worker.js';
        }
        if (label === 'typescript' || label === 'javascript') {
            return nodeModules + 'language/typescript/ts.worker.js';
        }
        return nodeModules + 'editor/editor.worker.js';
    },
};

// Configure Monaco loader
configureMonacoLoader();

interface CodeRunnerProps {
    initialCode?: string;
    darkMode?: boolean;
    language?: string;
}

const CodeRunner: React.FC<CodeRunnerProps> = ({ 
    initialCode = '', 
    darkMode = true,
    language = 'typescript'
}) => {
    const [code, setCode] = useState(initialCode || `import React, { useState } from 'react';
import ReactDOM from 'react-dom/client';

const App = () => {
  // TODO: Add state for managing a list of tasks
  // TODO: Add state for managing the current input value
  
  // TODO: Implement function to add a new task
  
  // TODO: Implement function to toggle task completion
  
  // TODO: Implement function to delete a task
  
  return (
    <div className="p-6 max-w-md mx-auto bg-white rounded-xl shadow-lg">
      <h1 className="text-2xl font-bold text-gray-900 mb-4">Task Manager</h1>
      
      {/* TODO: Add input form for new tasks */}
      
      {/* TODO: Display list of tasks with completion status */}
      
      <p className="text-gray-600 mt-4">
        Edit the code on the left to see changes here. Use Tailwind CSS classes for styling!
      </p>
    </div>
  );
};

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);`);
    
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isMobile, setIsMobile] = useState(false);
    const [esbuildReady, setEsbuildReady] = useState(false);
    
    const editorRef: MutableRefObject<monaco.editor.IStandaloneCodeEditor | null> = useRef(null);
    const outputFrameRef: MutableRefObject<HTMLIFrameElement | null> = useRef(null);

    // Initialize esbuild-wasm
    useEffect(() => {
        const initEsbuild = async () => {
            try {
                // Check if esbuild is already loaded from the script tag
                const esbuild = (window as any).esbuild;
                if (!esbuild) {
                    setError('esbuild not loaded - please refresh the page');
                    return;
                }
                
                await esbuild.initialize({
                    wasmURL: 'https://unpkg.com/esbuild-wasm@0.25.5/esbuild.wasm',
                    worker: true,
                });
                setEsbuildReady(true);
            } catch (err) {
                console.error('Failed to initialize esbuild:', err);
                setError('Failed to initialize code transformer');
            }
        };
        
        // Small delay to ensure the script is loaded
        setTimeout(initEsbuild, 100);
    }, []);

    // Check if mobile on mount and resize
    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 768);
        };
        
        checkMobile();
        window.addEventListener('resize', checkMobile);
        
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // Update iframe when code changes
    useEffect(() => {
        if (esbuildReady) {
            updateOutput();
        }
    }, [code, esbuildReady]);

    const updateOutput = async () => {
        if (!outputFrameRef.current || !esbuildReady) return;

        try {
            const esbuild = (window as any).esbuild;
            
            // Transform TSX to JS
            const result = await esbuild.transform(code, {
                loader: 'tsx',
                target: 'es2017',
                format: 'esm',
                jsx: 'automatic',
                jsxImportSource: 'react'
            });
            

            const iframeContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Code Output</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }
    .error {
      color: red;
      padding: 20px;
      white-space: pre-wrap;
      font-family: monospace;
    }
  </style>
</head>
<body>
  <div id="root"></div>
  
  <script type="importmap">
  {
    "imports": {
      "react": "https://esm.sh/react@18",
      "react/": "https://esm.sh/react@18/",
      "react/jsx-runtime": "https://esm.sh/react@18/jsx-runtime",
      "react/jsx-dev-runtime": "https://esm.sh/react@18/jsx-dev-runtime",
      "react-dom": "https://esm.sh/react-dom@18",
      "react-dom/": "https://esm.sh/react-dom@18/",
      "react-dom/client": "https://esm.sh/react-dom@18/client"
    }
  }
  </script>
  
  <script type="module">
      ${result.code}
  </script>
</body>
</html>`;

            const blob = new Blob([iframeContent], { type: 'text/html' });
            const blobUrl = URL.createObjectURL(blob);
            
            outputFrameRef.current.src = blobUrl;
            
            // Clean up blob URL after a short delay
            setTimeout(() => {
                URL.revokeObjectURL(blobUrl);
            }, 1000);
            
        } catch (err) {
            console.error('Error updating output:', err);
            setError(err instanceof Error ? err.message : 'Failed to transform code');
        }
    };

    const handleEditorDidMount = (editor: monaco.editor.IStandaloneCodeEditor, monacoInstance: Monaco) => {
        editorRef.current = editor;
        
        // Add custom actions
        editor.addAction({
            id: 'run-code',
            label: 'Run Code',
            contextMenuGroupId: 'navigation',
            keybindings: [monacoInstance.KeyMod.CtrlCmd | monacoInstance.KeyCode.Enter],
            run: () => updateOutput(),
        });

        editor.addAction({
            id: 'complete-with-ai',
            label: 'Complete with AI',
            contextMenuGroupId: 'navigation',
            keybindings: [monacoInstance.KeyMod.CtrlCmd | monacoInstance.KeyMod.Shift | monacoInstance.KeyCode.KeyA],
            run: () => completeWithAI(),
        });

        editor.focus();
    };

    const completeWithAI = async () => {
        if (!editorRef.current) return;
        
        setIsLoading(true);
        setError(null);
        
        try {
            const currentCode = editorRef.current.getValue();
            
            // Define the expected response schema as a proper JSON Schema
            const responseSchema = {
                type: "object",
                properties: {
                    code: {
                        type: "string",
                        description: "The complete, valid TSX/TypeScript code that can be executed"
                    },
                    implementedComments: {
                        type: "array",
                        items: {
                            type: "string"
                        },
                        description: "Array of comment descriptions that were implemented in the code"
                    },
                    explanation: {
                        type: "string",
                        description: "Brief explanation of the changes made and functionality implemented"
                    }
                },
                required: ["code", "implementedComments", "explanation"],
                additionalProperties: false
            };
            
            const response = await fetch('https://justshare.io/ai/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    systemPrompt: `You are an expert React/TypeScript developer. Your task is to:

1. Analyze the provided TSX/TypeScript code
2. Identify any comments that describe functionality but lack implementation
3. Generate complete, valid TSX code that implements all described functionality
4. Use ONLY Tailwind CSS classes for styling (no inline styles, no CSS modules)
5. Ensure all code is production-ready and follows React best practices
6. Return valid TypeScript/TSX syntax that will compile without errors

EXAMPLE OUTPUT FORMAT:
The code should follow this structure and format:

\`\`\`tsx
import React from 'react';
import ReactDOM from 'react-dom/client';

const App = () => (
  <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
    <h1>Hello from TSX!</h1>
    <p>Edit the code on the left to see changes here.</p>
    <button onClick={() => alert('Button clicked!')}>
      Click me!
    </button>
  </div>
);

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
\`\`\`

However, replace all inline styles with Tailwind CSS classes. For example:
- \`style={{ padding: '20px' }}\` becomes \`className="p-5"\`
- \`style={{ fontFamily: 'Arial, sans-serif' }}\` becomes \`className="font-sans"\`

Rules:
- Always return complete, runnable code that includes React imports and ReactDOM.render
- Use proper TypeScript types and interfaces when needed
- Implement React hooks correctly (useState, useEffect, etc.)
- Use Tailwind CSS classes exclusively for styling
- Handle edge cases and add proper error handling
- Follow React component composition patterns
- Ensure accessibility with proper ARIA attributes when needed
- Always include the ReactDOM.createRoot and render call at the bottom

You must respond with a JSON object containing the code, implementedComments array, and explanation.`,
                    userMessage: `Please analyze this TSX code and implement any functionality described in comments. Also improve the code quality and ensure it uses only Tailwind CSS classes for styling:

\`\`\`tsx
${currentCode}
\`\`\`

Focus on:
1. Implementing any TODO comments or functionality described in comments
2. Converting any inline styles to Tailwind CSS classes
3. Adding proper TypeScript types
4. Improving React patterns and performance
5. Ensuring the code is complete and runnable
6. Making sure the final code follows the example format provided in the system prompt`,
                    responseSchema: responseSchema
                }),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            
            // Handle structured response with function calling
            if (result.aiResponse) {
                try {
                    // Parse the AI response as JSON (it should be the function arguments)
                    const aiData = typeof result.aiResponse === 'string' 
                        ? JSON.parse(result.aiResponse) 
                        : result.aiResponse;
                        
                    if (aiData.code) {
                        editorRef.current.setValue(aiData.code);
                        setCode(aiData.code);
                        
                        // Show what was implemented
                        if (aiData.implementedComments && aiData.implementedComments.length > 0) {
                            console.log('Implemented comments:', aiData.implementedComments);
                        }
                        if (aiData.explanation) {
                            console.log('AI explanation:', aiData.explanation);
                        }
                    } else {
                        throw new Error('No code field in structured response');
                    }
                } catch (parseError) {
                    console.error('Failed to parse structured response:', parseError);
                    // Fallback: treat as plain text if JSON parsing fails
                    const cleanCode = (typeof result.aiResponse === 'string' ? result.aiResponse : JSON.stringify(result.aiResponse))
                        .replace(/^```(?:tsx?|typescript|javascript)?\n?/gm, '')
                        .replace(/\n?```$/gm, '')
                        .trim();
                    
                    editorRef.current.setValue(cleanCode);
                    setCode(cleanCode);
                }
            } else if (typeof result === 'string') {
                // Handle direct string response (function calling result)
                try {
                    const aiData = JSON.parse(result);
                    if (aiData.code) {
                        editorRef.current.setValue(aiData.code);
                        setCode(aiData.code);
                        
                        if (aiData.implementedComments && aiData.implementedComments.length > 0) {
                            console.log('Implemented comments:', aiData.implementedComments);
                        }
                        if (aiData.explanation) {
                            console.log('AI explanation:', aiData.explanation);
                        }
                    } else {
                        throw new Error('No code field in response');
                    }
                } catch (parseError) {
                    // Fallback: treat as code directly
                    const cleanCode = result
                        .replace(/^```(?:tsx?|typescript|javascript)?\n?/gm, '')
                        .replace(/\n?```$/gm, '')
                        .trim();
                    
                    editorRef.current.setValue(cleanCode);
                    setCode(cleanCode);
                }
            } else if (result.content) {
                // Handle alternative response format
                const cleanCode = result.content
                    .replace(/^```(?:tsx?|typescript|javascript)?\n?/gm, '')
                    .replace(/\n?```$/gm, '')
                    .trim();
                
                editorRef.current.setValue(cleanCode);
                setCode(cleanCode);
            } else {
                throw new Error('Unexpected response format from AI service');
            }
            
        } catch (err) {
            console.error('AI completion error:', err);
            setError(err instanceof Error ? err.message : 'Failed to complete with AI');
        } finally {
            setIsLoading(false);
        }
    };

    const handleCodeChange = (value: string | undefined) => {
        if (value !== undefined) {
            setCode(value);
        }
    };

    const containerStyle: React.CSSProperties = {
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    };

    const headerStyle: React.CSSProperties = {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 16px',
        backgroundColor: darkMode ? '#252526' : '#f8f9fa',
        borderBottom: `1px solid ${darkMode ? '#3e3e42' : '#e1e4e8'}`,
        fontSize: '14px',
        color: darkMode ? '#cccccc' : '#24292e',
        minHeight: '48px',
        boxSizing: 'border-box'
    };

    const buttonStyle: React.CSSProperties = {
        padding: '6px 12px',
        fontSize: '12px',
        backgroundColor: isLoading ? '#6b7280' : '#0366d6',
        color: 'white',
        border: 'none',
        borderRadius: '6px',
        cursor: isLoading ? 'not-allowed' : 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        fontWeight: 500,
        transition: 'background-color 0.2s'
    };

    const refreshButtonStyle: React.CSSProperties = {
        ...buttonStyle,
        backgroundColor: '#28a745',
        cursor: 'pointer'
    };

    const errorStyle: React.CSSProperties = {
        padding: '12px 16px',
        backgroundColor: '#ffeaea',
        borderBottom: '1px solid #fecaca',
        color: '#d73a49',
        fontSize: '12px',
        fontFamily: 'SFMono-Regular, Consolas, "Liberation Mono", Menlo, monospace'
    };

    const editorContainerStyle: React.CSSProperties = {
        flex: 1,
        minHeight: 0, // Important for Monaco to size properly
        position: 'relative'
    };

    const resizeHandleStyle: React.CSSProperties = {
        backgroundColor: darkMode ? '#3e3e42' : '#e1e4e8',
        transition: 'background-color 0.2s',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
    };

    const resizeIndicatorStyle: React.CSSProperties = {
        backgroundColor: darkMode ? '#6b7280' : '#9ca3af',
        borderRadius: '2px'
    };

    const renderEditor = () => (
        <div style={containerStyle}>
            <div style={headerStyle}>
                <h3 style={{ margin: 0, fontWeight: 600, fontSize: '14px' }}>Code Editor</h3>
                <button
                    onClick={completeWithAI}
                    disabled={isLoading}
                    style={buttonStyle}
                    onMouseEnter={(e) => {
                        if (!isLoading) {
                            e.currentTarget.style.backgroundColor = '#0256cc';
                        }
                    }}
                    onMouseLeave={(e) => {
                        if (!isLoading) {
                            e.currentTarget.style.backgroundColor = '#0366d6';
                        }
                    }}
                >
                    {isLoading ? (
                        <>
                            <div style={{
                                width: '12px',
                                height: '12px',
                                border: '2px solid transparent',
                                borderTop: '2px solid white',
                                borderRadius: '50%',
                                animation: 'spin 1s linear infinite'
                            }}></div>
                            Completing...
                        </>
                    ) : (
                        <>
                            ⚡ Complete with AI
                        </>
                    )}
                </button>
            </div>
            {error && (
                <div style={errorStyle}>
                    Error: {error}
                </div>
            )}
            <div style={editorContainerStyle}>
                <MonacoEditor
                    language={language}
                    theme={darkMode ? 'vs-dark' : 'vs-light'}
                    value={code}
                    onChange={handleCodeChange}
                    onMount={handleEditorDidMount}
                    options={{
                        minimap: { enabled: false },
                        scrollBeyondLastLine: false,
                        fontSize: 14,
                        lineNumbers: 'on',
                        roundedSelection: false,
                        scrollbar: {
                            vertical: 'visible',
                            horizontal: 'visible',
                        },
                        automaticLayout: true,
                        wordWrap: 'on',
                        tabSize: 2,
                        insertSpaces: true,
                        padding: { top: 16, bottom: 16 },
                        folding: true,
                        lineDecorationsWidth: 10,
                        lineNumbersMinChars: 3,
                        glyphMargin: false
                    }}
                    loading={
                        <div style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center', 
                            height: '100%',
                            color: darkMode ? '#cccccc' : '#586069'
                        }}>
                            Loading Monaco Editor...
                        </div>
                    }
                />
            </div>
        </div>
    );

    const renderOutput = () => (
        <div style={containerStyle}>
            <div style={headerStyle}>
                <h3 style={{ margin: 0, fontWeight: 600, fontSize: '14px' }}>Output</h3>
                <button
                    onClick={updateOutput}
                    style={refreshButtonStyle}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#22863a';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = '#28a745';
                    }}
                >
                    🔄 Refresh
                </button>
            </div>
            <div style={editorContainerStyle}>
                <iframe
                    ref={outputFrameRef}
                    title="Code Output"
                    style={{ 
                        width: '100%', 
                        height: '100%', 
                        border: 'none',
                        backgroundColor: 'white'
                    }}
                    sandbox="allow-scripts allow-same-origin"
                />
            </div>
        </div>
    );

    if (!esbuildReady) {
        return (
            <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                height: '100vh',
                fontSize: '16px',
                color: darkMode ? '#cccccc' : '#586069',
                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
            }}>
                <div style={{ textAlign: 'center' }}>
                    <div style={{
                        width: '32px',
                        height: '32px',
                        border: '3px solid #f3f3f3',
                        borderTop: '3px solid #0366d6',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite',
                        margin: '0 auto 16px'
                    }}></div>
                    Initializing code transformer...
                </div>
            </div>
        );
    }

    const layoutStyle: React.CSSProperties = {
        height: '100vh',
        backgroundColor: darkMode ? '#1e1e1e' : '#ffffff',
        color: darkMode ? '#cccccc' : '#24292e',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    };

    if (isMobile) {
        // Mobile layout: vertical stack
        return (
            <div style={layoutStyle}>
                <style>{`
                    @keyframes spin {
                        0% { transform: rotate(0deg); }
                        100% { transform: rotate(360deg); }
                    }
                `}</style>
                <PanelGroup direction="vertical">
                    <Panel defaultSize={60} minSize={30}>
                        {renderEditor()}
                    </Panel>
                    <PanelResizeHandle style={{
                        ...resizeHandleStyle,
                        height: '8px',
                        cursor: 'row-resize'
                    }}>
                        <div style={{ 
                            ...resizeIndicatorStyle,
                            width: '32px', 
                            height: '4px' 
                        }}></div>
                    </PanelResizeHandle>
                    <Panel defaultSize={40} minSize={20}>
                        {renderOutput()}
                    </Panel>
                </PanelGroup>
            </div>
        );
    }

    // Desktop layout: horizontal split
    return (
        <div style={layoutStyle}>
            <style>{`
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            `}</style>
            <PanelGroup direction="horizontal">
                <Panel defaultSize={50} minSize={30}>
                    {renderEditor()}
                </Panel>
                <PanelResizeHandle style={{
                    ...resizeHandleStyle,
                    width: '8px',
                    cursor: 'col-resize'
                }}>
                    <div style={{ 
                        ...resizeIndicatorStyle,
                        height: '32px', 
                        width: '4px' 
                    }}></div>
                </PanelResizeHandle>
                <Panel defaultSize={50} minSize={30}>
                    {renderOutput()}
                </Panel>
            </PanelGroup>
        </div>
    );
};

// Auto-initialize if there's a container element
const container = document.getElementById('code-runner');
if (container) {
    const root = createRoot(container);
    const propsAttr = container.getAttribute('data-props');
    const props = propsAttr ? JSON.parse(propsAttr) : {};
    
    root.render(<CodeRunner {...props} />);
}

export default CodeRunner; 