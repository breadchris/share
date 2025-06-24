import React, { useEffect, useState, useRef, MutableRefObject, useCallback } from 'react';
import MonacoEditor, { type Monaco, loader } from '@monaco-editor/react';
import { createRoot } from 'react-dom/client';
import * as monaco from 'monaco-editor';

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

configureMonacoLoader();

interface CodeRunnerProps {
    initialCode?: string;
    darkMode?: boolean;
    language?: string;
    initialFilePath?: string;
}

interface FileItem {
    name: string;
    path: string;
    isDir: boolean;
    size: number;
    lastModified: string;
}

const CodeRunner: React.FC<CodeRunnerProps> = ({ 
    initialCode = '', 
    darkMode = true,
    language = 'typescript'
}) => {
    // State management
    const [code, setCode] = useState(initialCode || `import React from 'react';
import ReactDOM from 'react-dom/client';

const App = () => {
  return (
    <div className="p-6 max-w-md mx-auto bg-white rounded-xl shadow-lg">
      <h1 className="text-2xl font-bold text-gray-900 mb-4">Welcome!</h1>
      <p className="text-gray-600">
        Edit the code on the left to see changes here. Use Tailwind CSS classes for styling!
      </p>
    </div>
  );
};

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);`);
    
    const [esbuildReady, setEsbuildReady] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [files, setFiles] = useState<FileItem[]>([]);
    const [currentFile, setCurrentFile] = useState<FileItem | null>(null);
    const [expandedDirs, setExpandedDirs] = useState<Set<string>>(new Set());
    const [isLoading, setIsLoading] = useState(false);
    const [isBuildLoading, setIsBuildLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isMobile, setIsMobile] = useState(false);
    const [isFileLoading, setIsFileLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [saveStatus, setSaveStatus] = useState<string>('');
    const [username, setUsername] = useState<string>('');
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [showLogin, setShowLogin] = useState(false);
    const [activeTab, setActiveTab] = useState<'chat' | 'code'>('chat');
    const [chatMessages, setChatMessages] = useState<Array<{id: string, role: 'user' | 'assistant', content: string, timestamp: Date}>>([]);
    const [chatInput, setChatInput] = useState('');
    const [isChatLoading, setIsChatLoading] = useState(false);
    const [outputHeight, setOutputHeight] = useState(isMobile ? 250 : 300);
    const [isDragging, setIsDragging] = useState(false);
    const [dragStartY, setDragStartY] = useState(0);
    const [dragStartHeight, setDragStartHeight] = useState(0);
    
    const editorRef: MutableRefObject<monaco.editor.IStandaloneCodeEditor | null> = useRef(null);
    const outputFrameRef: MutableRefObject<HTMLIFrameElement | null> = useRef(null);
    const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const saveStatusTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const chatMessagesRef = useRef<HTMLDivElement | null>(null);

    // Directory expansion functionality
    const toggleDirExpansion = (dirPath: string) => {
        setExpandedDirs(prev => {
            const newSet = new Set(prev);
            if (newSet.has(dirPath)) {
                newSet.delete(dirPath);
            } else {
                newSet.add(dirPath);
            }
            return newSet;
        });
    };

    const organizeFilesByDirectory = (files: FileItem[]) => {
        const organized: { [key: string]: FileItem[] } = {};
        const rootFiles: FileItem[] = [];
        
        files.forEach(file => {
            if (file.isDir) {
                organized[file.path] = [];
            } else {
                const dirPath = file.path.includes('/') ? file.path.substring(0, file.path.lastIndexOf('/')) : '';
                if (dirPath && organized[dirPath] !== undefined) {
                    organized[dirPath].push(file);
                } else {
                    rootFiles.push(file);
                }
            }
        });
        
        return { organized, rootFiles };
    };

    // Login/logout functionality
    const handleLogin = (inputUsername: string) => {
        if (inputUsername.trim()) {
            setUsername(inputUsername.trim());
            setIsLoggedIn(true);
            setShowLogin(false);
            localStorage.setItem('coderunner_username', inputUsername.trim());
        }
    };

    const handleLogout = () => {
        setUsername('');
        setIsLoggedIn(false);
        setShowLogin(false);
        localStorage.removeItem('coderunner_username');
    };

    // File management functions
    const saveFile = async (filePath: string, content: string) => {
        try {
            let finalPath = filePath;
            if (isLoggedIn && !filePath.startsWith('@')) {
                finalPath = `@${username}/${filePath}`;
            } else if (!isLoggedIn && !filePath.startsWith('@')) {
                finalPath = `@guest/${filePath}`;
            }
            
            const response = await fetch('/coderunner/api/files', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    path: finalPath,
                    content: content
                })
            });

            if (!response.ok) {
                const errorData = await response.text();
                throw new Error(errorData || `Failed to save file: ${response.statusText}`);
            }

            const result = await response.json();
            return result;
        } catch (err) {
            console.error('Failed to save file:', err);
            throw err;
        }
    };

    const createNewFile = () => {
        const timestamp = new Date().toISOString().slice(0, -5).replace(/[T:]/g, '-');
        const userPrefix = isLoggedIn ? `@${username}` : '@guest';
        const newFile: FileItem = {
            name: `untitled-${timestamp}.tsx`,
            path: `${userPrefix}/untitled-${timestamp}.tsx`,
            isDir: false,
            size: 0,
            lastModified: new Date().toISOString()
        };
        
        const defaultContent = `import React from 'react';
import ReactDOM from 'react-dom/client';

const App = () => {
  return (
    <div className="p-4">
      <h1 className="text-xl font-bold">New Component</h1>
      <p>Start building something amazing!</p>
    </div>
  );
};

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);`;
        
        setCurrentFile(newFile);
        setCode(defaultContent);
        if (editorRef.current) {
            editorRef.current.setValue(defaultContent);
        }
        setIsSidebarOpen(false);
        setActiveTab('code');
    };

    // Load files
    const loadFiles = async () => {
        try {
            const response = await fetch('/coderunner/api/files');
            if (!response.ok) {
                throw new Error(`Failed to load files: ${response.statusText}`);
            }
            const data = await response.json();
            setFiles(data || []);
        } catch (err) {
            console.error('Failed to load files:', err);
        }
    };

    const openFile = async (file: FileItem) => {
        if (file.isDir) return;
        
        try {
            const response = await fetch(`/coderunner/api/files/${encodeURIComponent(file.path)}`);
            if (!response.ok) {
                throw new Error(`Failed to load file: ${response.statusText}`);
            }
            
            const content = await response.text();
            setCurrentFile(file);
            setCode(content);
            if (editorRef.current) {
                editorRef.current.setValue(content);
            }
            setIsSidebarOpen(false);
        } catch (err) {
            console.error('Failed to load file:', err);
        }
    };

    // Initialize esbuild
    useEffect(() => {
        const initEsbuild = async () => {
            try {
                const esbuild = (window as any).esbuild;
                if (esbuild) {
                    await esbuild.initialize({
                        wasmURL: 'https://unpkg.com/esbuild-wasm@0.25.5/esbuild.wasm',
                        worker: true,
                    });
                    setEsbuildReady(true);
                }
            } catch (err) {
                console.error('Failed to initialize esbuild:', err);
            }
        };
        
        setTimeout(initEsbuild, 100);
        loadFiles();
    }, []);

    // Chat functionality
    const sendChatMessage = async (message: string) => {
        if (!message.trim() || isChatLoading) return;
        
        const newMessage = {
            id: Date.now().toString(),
            role: 'user' as const,
            content: message,
            timestamp: new Date()
        };
        
        setChatMessages(prev => [...prev, newMessage]);
        setChatInput('');
        setIsChatLoading(true);
        
        try {
            const response = await fetch('/ai', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    message: message,
                    context: {
                        currentFile: currentFile?.path,
                        code: code
                    }
                })
            });
            
            if (!response.ok) {
                throw new Error('Failed to send message');
            }
            
            const data = await response.json();
            
            const assistantMessage = {
                id: (Date.now() + 1).toString(),
                role: 'assistant' as const,
                content: data.response || 'Sorry, I encountered an error.',
                timestamp: new Date()
            };
            
            setChatMessages(prev => [...prev, assistantMessage]);
        } catch (error) {
            console.error('Chat error:', error);
            const errorMessage = {
                id: (Date.now() + 1).toString(),
                role: 'assistant' as const,
                content: 'Sorry, I encountered an error processing your message.',
                timestamp: new Date()
            };
            setChatMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsChatLoading(false);
        }
    };

    // Auto-save functionality
    const triggerAutoSave = useCallback(() => {
        if (currentFile && code && (currentFile.path.includes(username) || username === '')) {
            if (autoSaveTimeoutRef.current) {
                clearTimeout(autoSaveTimeoutRef.current);
            }
            
            autoSaveTimeoutRef.current = setTimeout(async () => {
                try {
                    setIsSaving(true);
                    await saveFile(currentFile.path, code);
                    setSaveStatus('✓ Saved');
                    
                    if (saveStatusTimeoutRef.current) {
                        clearTimeout(saveStatusTimeoutRef.current);
                    }
                    saveStatusTimeoutRef.current = setTimeout(() => {
                        setSaveStatus('');
                    }, 2000);
                } catch (error) {
                    console.error('Auto-save failed:', error);
                    setSaveStatus('⚠ Failed to save');
                    setTimeout(() => setSaveStatus(''), 3000);
                } finally {
                    setIsSaving(false);
                }
            }, 1000);
        }
    }, [currentFile, code, username]);

    // Initialize from localStorage and URL params
    useEffect(() => {
        const savedUsername = localStorage.getItem('coderunner_username');
        if (savedUsername) {
            setUsername(savedUsername);
            setIsLoggedIn(true);
        }

        // Check for mobile
        const checkMobile = () => {
            setIsMobile(window.innerWidth <= 1024);
        };
        checkMobile();
        window.addEventListener('resize', checkMobile);

        return () => {
            window.removeEventListener('resize', checkMobile);
            if (autoSaveTimeoutRef.current) {
                clearTimeout(autoSaveTimeoutRef.current);
            }
            if (saveStatusTimeoutRef.current) {
                clearTimeout(saveStatusTimeoutRef.current);
            }
        };
    }, []);

    // Trigger auto-save when code changes
    useEffect(() => {
        triggerAutoSave();
    }, [code, triggerAutoSave]);

    // Auto-scroll chat messages
    useEffect(() => {
        if (chatMessagesRef.current) {
            chatMessagesRef.current.scrollTop = chatMessagesRef.current.scrollHeight;
        }
    }, [chatMessages]);

    // Auto-run when esbuild is ready or code changes
    useEffect(() => {
        if (esbuildReady && activeTab === 'code') {
            const timeoutId = setTimeout(() => {
                buildAndRun();
            }, 1000); // Debounce for 1 second
            
            return () => clearTimeout(timeoutId);
        }
    }, [esbuildReady, code, activeTab]);

    // Auto-run when esbuild is ready or code changes (works for both tabs)
    useEffect(() => {
        if (esbuildReady && code.trim()) {
            const timeoutId = setTimeout(() => {
                buildAndRun();
            }, 1500); // Debounce for 1.5 seconds to allow for typing
            
            return () => clearTimeout(timeoutId);
        }
    }, [esbuildReady, code]);

    // Initial run when esbuild becomes ready
    useEffect(() => {
        if (esbuildReady && code.trim()) {
            buildAndRun();
        }
    }, [esbuildReady]);

    // Handle output panel resizing
    const handleDragStart = (e: React.MouseEvent) => {
        setIsDragging(true);
        setDragStartY(e.clientY);
        setDragStartHeight(outputHeight);
        e.preventDefault();
    };

    const handleDragMove = useCallback((e: MouseEvent) => {
        if (!isDragging) return;
        
        const deltaY = dragStartY - e.clientY; // Negative because we're dragging up to increase height
        const newHeight = Math.max(150, Math.min(window.innerHeight * 0.7, dragStartHeight + deltaY));
        setOutputHeight(newHeight);
    }, [isDragging, dragStartY, dragStartHeight]);

    const handleDragEnd = useCallback(() => {
        setIsDragging(false);
    }, []);

    // Add global mouse event listeners for dragging
    useEffect(() => {
        if (isDragging) {
            document.addEventListener('mousemove', handleDragMove);
            document.addEventListener('mouseup', handleDragEnd);
            document.body.style.cursor = 'ns-resize';
            document.body.style.userSelect = 'none';
            
            return () => {
                document.removeEventListener('mousemove', handleDragMove);
                document.removeEventListener('mouseup', handleDragEnd);
                document.body.style.cursor = '';
                document.body.style.userSelect = '';
            };
        }
    }, [isDragging, handleDragMove, handleDragEnd]);

    // Build and run code
    const buildAndRun = async () => {
        if (!esbuildReady) {
            setError('esbuild is not ready yet');
            return;
        }

        setIsBuildLoading(true);
        setError(null);

        try {
            const esbuild = (window as any).esbuild;
            
            // Transform the code
            const result = await esbuild.transform(code, {
                loader: 'tsx',
                target: 'es2020',
                format: 'esm',
                jsx: 'automatic',
                jsxImportSource: 'react',
            });

            // Create the HTML content
            const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Code Output</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        body { margin: 0; padding: 16px; font-family: system-ui, -apple-system, sans-serif; }
        #root { min-height: 100vh; }
        .error { 
            background: #fee; 
            border: 1px solid #fcc; 
            color: #c33; 
            padding: 16px; 
            border-radius: 8px; 
            margin: 16px;
            font-family: monospace;
            white-space: pre-wrap;
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
        window.onerror = function(msg, url, line, col, error) {
            document.getElementById('root').innerHTML = 
                '<div class="error">Runtime Error: ' + msg + '\\n\\nLine: ' + line + '</div>';
            return false;
        };
        
        window.addEventListener('unhandledrejection', function(event) {
            document.getElementById('root').innerHTML = 
                '<div class="error">Promise Rejection: ' + event.reason + '</div>';
        });

        // try {
        ${result.code}
        // } catch (error) {
        //     document.getElementById('root').innerHTML = 
        //         '<div class="error">Compilation Error: ' + error.message + '</div>';
        // }
    </script>
</body>
</html>`;


            // Update the iframe
            if (outputFrameRef.current) {
                const iframe = outputFrameRef.current;
                iframe.srcdoc = htmlContent;
            }

        } catch (error) {
            console.error('Build failed:', error);
            setError(`Build failed: ${error.message}`);
        } finally {
            setIsBuildLoading(false);
        }
    };

    const renderSidebar = () => (
        <div 
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '280px',
                height: '100vh',
                backgroundColor: darkMode ? '#252526' : '#f8f9fa',
                borderRight: `1px solid ${darkMode ? '#3e3e42' : '#e1e4e8'}`,
                zIndex: 1000,
                transform: isSidebarOpen ? 'translateX(0)' : 'translateX(-100%)',
                transition: 'transform 0.3s ease',
                display: 'flex',
                flexDirection: 'column'
            }}>
            
            {/* Header */}
            <div style={{
                padding: '16px',
                borderBottom: `1px solid ${darkMode ? '#3e3e42' : '#e1e4e8'}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
            }}>
                <div style={{
                    color: darkMode ? '#cccccc' : '#24292e',
                    fontSize: '14px',
                    fontWeight: 600
                }}>
                    CodeRunner
                </div>
                <button
                    onClick={() => setIsSidebarOpen(false)}
                    style={{
                        background: 'none',
                        border: 'none',
                        color: darkMode ? '#cccccc' : '#24292e',
                        cursor: 'pointer',
                        fontSize: '18px',
                        padding: '4px'
                    }}
                >
                    ×
                </button>
            </div>

            {/* File Browser with Expandable Directories */}
            <div style={{
                flex: 1,
                overflow: 'auto',
                padding: '8px'
            }}>
                {(() => {
                    const { organized, rootFiles } = organizeFilesByDirectory(files);
                    const allDirectories = Object.keys(organized);
                    
                    return (
                        <div>
                            {/* Root files first */}
                            {rootFiles.map((file, index) => (
                                <button
                                    key={`root-${index}`}
                                    onClick={() => openFile(file)}
                                    style={{
                                        width: '100%',
                                        padding: '8px 12px',
                                        background: currentFile?.path === file.path 
                                            ? (darkMode ? '#37373d' : '#e8f4fd') 
                                            : 'none',
                                        border: 'none',
                                        color: currentFile?.path === file.path 
                                            ? (darkMode ? '#ffffff' : '#0366d6')
                                            : (darkMode ? '#cccccc' : '#24292e'),
                                        cursor: 'pointer',
                                        fontSize: '13px',
                                        textAlign: 'left',
                                        borderRadius: '4px',
                                        transition: 'background-color 0.2s',
                                        marginBottom: '2px'
                                    }}
                                    onMouseEnter={(e) => {
                                        if (currentFile?.path !== file.path) {
                                            e.currentTarget.style.backgroundColor = darkMode ? '#3e3e42' : '#f0f0f0';
                                        }
                                    }}
                                    onMouseLeave={(e) => {
                                        if (currentFile?.path !== file.path) {
                                            e.currentTarget.style.backgroundColor = 'transparent';
                                        }
                                    }}
                                >
                                    📄 {file.name}
                                </button>
                            ))}
                            
                            {/* Directories and their files */}
                            {allDirectories.map((dirPath) => {
                                const dirName = dirPath.split('/').pop() || dirPath;
                                const isExpanded = expandedDirs.has(dirPath);
                                const dirFiles = organized[dirPath];
                                
                                return (
                                    <div key={dirPath} style={{ marginBottom: '4px' }}>
                                        {/* Directory header */}
                                        <button
                                            onClick={() => toggleDirExpansion(dirPath)}
                                            style={{
                                                width: '100%',
                                                padding: '8px 12px',
                                                background: 'none',
                                                border: 'none',
                                                color: darkMode ? '#888' : '#666',
                                                cursor: 'pointer',
                                                fontSize: '13px',
                                                textAlign: 'left',
                                                borderRadius: '4px',
                                                transition: 'background-color 0.2s',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '6px',
                                                fontWeight: 500
                                            }}
                                            onMouseEnter={(e) => {
                                                e.currentTarget.style.backgroundColor = darkMode ? '#3e3e42' : '#f0f0f0';
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.backgroundColor = 'transparent';
                                            }}
                                        >
                                            <span style={{ fontSize: '12px', width: '12px', textAlign: 'center' }}>
                                                {isExpanded ? '▼' : '▶'}
                                            </span>
                                            📁 {dirName}
                                            <span style={{ 
                                                marginLeft: 'auto', 
                                                fontSize: '11px', 
                                                opacity: 0.6,
                                                color: darkMode ? '#666' : '#999'
                                            }}>
                                                ({dirFiles.length})
                                            </span>
                                        </button>
                                        
                                        {/* Directory files - shown when expanded */}
                                        {isExpanded && dirFiles.map((file, fileIndex) => (
                                            <button
                                                key={`${dirPath}-${fileIndex}`}
                                                onClick={() => openFile(file)}
                                                style={{
                                                    width: '100%',
                                                    padding: '6px 12px 6px 20px',
                                                    background: currentFile?.path === file.path 
                                                        ? (darkMode ? '#37373d' : '#e8f4fd') 
                                                        : 'none',
                                                    border: 'none',
                                                    borderLeft: `2px solid ${darkMode ? '#4a4a4a' : '#d0d7de'}`,
                                                    marginLeft: '12px',
                                                    color: currentFile?.path === file.path 
                                                        ? (darkMode ? '#ffffff' : '#0366d6')
                                                        : (darkMode ? '#cccccc' : '#24292e'),
                                                    cursor: 'pointer',
                                                    fontSize: '12px',
                                                    textAlign: 'left',
                                                    borderRadius: '0 4px 4px 0',
                                                    transition: 'background-color 0.2s',
                                                    marginBottom: '1px'
                                                }}
                                                onMouseEnter={(e) => {
                                                    if (currentFile?.path !== file.path) {
                                                        e.currentTarget.style.backgroundColor = darkMode ? '#3e3e42' : '#f0f0f0';
                                                    }
                                                }}
                                                onMouseLeave={(e) => {
                                                    if (currentFile?.path !== file.path) {
                                                        e.currentTarget.style.backgroundColor = 'transparent';
                                                    }
                                                }}
                                            >
                                                📄 {file.name}
                                            </button>
                                        ))}
                                    </div>
                                );
                            })}
                        </div>
                    );
                })()}
            </div>
        </div>
    );

    // Main layout
    return (
        <div style={{
            height: '100vh',
            backgroundColor: darkMode ? '#1e1e1e' : '#ffffff',
            color: darkMode ? '#cccccc' : '#24292e',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            display: 'flex',
            flexDirection: 'column'
        }}>
            <style>{`
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            `}</style>
            
            {/* Sidebar */}
            {renderSidebar()}
            
            {/* Sidebar Overlay */}
            {isSidebarOpen && (
                <div 
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        width: '100vw',
                        height: '100vh',
                        backgroundColor: 'rgba(0, 0, 0, 0.5)',
                        zIndex: 999
                    }}
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* Header */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 16px',
                backgroundColor: darkMode ? '#252526' : '#f8f9fa',
                borderBottom: `1px solid ${darkMode ? '#3e3e42' : '#e1e4e8'}`,
                fontSize: '14px',
                minHeight: '48px',
                boxSizing: 'border-box'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    {/* Hamburger Menu */}
                    <button
                        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                        style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            color: darkMode ? '#cccccc' : '#24292e',
                            padding: '4px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '3px',
                            width: '20px',
                            height: '16px'
                        }}
                    >
                        <div style={{
                            width: '100%',
                            height: '2px',
                            backgroundColor: 'currentColor',
                            borderRadius: '1px'
                        }}></div>
                        <div style={{
                            width: '100%',
                            height: '2px',
                            backgroundColor: 'currentColor',
                            borderRadius: '1px'
                        }}></div>
                        <div style={{
                            width: '100%',
                            height: '2px',
                            backgroundColor: 'currentColor',
                            borderRadius: '1px'
                        }}></div>
                    </button>
                    
                    <h3 style={{ margin: 0, fontWeight: 600, fontSize: '14px' }}>
                        CodeRunner
                    </h3>

                    {/* Tab Navigation */}
                    <div style={{ display: 'flex', gap: '4px' }}>
                        <button
                            onClick={() => setActiveTab('chat')}
                            style={{
                                background: activeTab === 'chat' 
                                    ? (darkMode ? '#37373d' : '#e8f4fd')
                                    : 'none',
                                border: `1px solid ${darkMode ? '#4a4a4a' : '#d0d7de'}`,
                                color: activeTab === 'chat'
                                    ? (darkMode ? '#ffffff' : '#0366d6')
                                    : (darkMode ? '#cccccc' : '#24292e'),
                                cursor: 'pointer',
                                padding: '6px 12px',
                                borderRadius: '6px',
                                fontSize: '12px',
                                fontWeight: 500
                            }}
                        >
                            💬 Chat
                        </button>
                        <button
                            onClick={() => setActiveTab('code')}
                            style={{
                                background: activeTab === 'code' 
                                    ? (darkMode ? '#37373d' : '#e8f4fd')
                                    : 'none',
                                border: `1px solid ${darkMode ? '#4a4a4a' : '#d0d7de'}`,
                                color: activeTab === 'code'
                                    ? (darkMode ? '#ffffff' : '#0366d6')
                                    : (darkMode ? '#cccccc' : '#24292e'),
                                cursor: 'pointer',
                                padding: '6px 12px',
                                borderRadius: '6px',
                                fontSize: '12px',
                                fontWeight: 500
                            }}
                        >
                            📝 Code
                        </button>
                    </div>
                    
                    {/* Current File Indicator */}
                    {currentFile && activeTab === 'code' && (
                        <div style={{
                            fontSize: '12px',
                            color: darkMode ? '#888' : '#666',
                            backgroundColor: darkMode ? '#37373d' : '#e8f4fd',
                            padding: '2px 8px',
                            borderRadius: '12px',
                            border: `1px solid ${darkMode ? '#4a4a4a' : '#c8e1ff'}`
                        }}>
                            {currentFile.name}
                        </div>
                    )}

                    {/* Save Status */}
                    {saveStatus && (
                        <div style={{
                            fontSize: '12px',
                            color: saveStatus.includes('✓') ? '#28a745' : '#dc3545',
                            fontWeight: 500
                        }}>
                            {saveStatus}
                        </div>
                    )}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {/* New File Button */}
                    <button
                        onClick={createNewFile}
                        style={{
                            background: darkMode ? '#0e4429' : '#238636',
                            color: '#ffffff',
                            border: 'none',
                            padding: '6px 12px',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '12px',
                            fontWeight: 500
                        }}
                    >
                        + New File
                    </button>

                    {/* Login/Logout */}
                    {isLoggedIn ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontSize: '12px', color: darkMode ? '#888' : '#666' }}>
                                @{username}
                            </span>
                            <button
                                onClick={handleLogout}
                                style={{
                                    background: 'none',
                                    border: `1px solid ${darkMode ? '#4a4a4a' : '#d0d7de'}`,
                                    color: darkMode ? '#cccccc' : '#24292e',
                                    padding: '4px 8px',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    fontSize: '12px'
                                }}
                            >
                                Logout
                            </button>
                        </div>
                    ) : (
                        <button
                            onClick={() => setShowLogin(true)}
                            style={{
                                background: darkMode ? '#1f2937' : '#f8f9fa',
                                border: `1px solid ${darkMode ? '#4a4a4a' : '#d0d7de'}`,
                                color: darkMode ? '#cccccc' : '#24292e',
                                padding: '6px 12px',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontSize: '12px',
                                fontWeight: 500
                            }}
                        >
                            Login
                        </button>
                    )}
                </div>
            </div>

            {/* Main Content */}
            <div style={{
                flex: 1,
                minHeight: 0,
                position: 'relative',
                display: 'flex',
                flexDirection: 'column'
            }}>
                {/* Chat/Code Content Area */}
                <div style={{
                    flex: 1,
                    minHeight: 0,
                    display: 'flex',
                    flexDirection: 'column'
                }}>
                    {activeTab === 'chat' ? (
                        /* Chat Interface */
                        <div style={{
                            flex: 1,
                            display: 'flex',
                            flexDirection: 'column',
                            maxHeight: '100%'
                        }}>
                            {/* Chat Messages */}
                            <div 
                                ref={chatMessagesRef}
                                style={{
                                    flex: 1,
                                    overflow: 'auto',
                                    padding: '16px',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '16px'
                                }}
                            >
                                {chatMessages.length === 0 ? (
                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        height: '100%',
                                        color: darkMode ? '#666' : '#999',
                                        textAlign: 'center'
                                    }}>
                                        <div>
                                            <div style={{ fontSize: '24px', marginBottom: '8px' }}>💬</div>
                                            <div>Start a conversation with the AI assistant</div>
                                            <div style={{ fontSize: '12px', marginTop: '4px' }}>
                                                Ask questions about your code or request help
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    chatMessages.map((message) => (
                                        <div
                                            key={message.id}
                                            style={{
                                                alignSelf: message.role === 'user' ? 'flex-end' : 'flex-start',
                                                maxWidth: '80%',
                                                padding: '12px 16px',
                                                borderRadius: '16px',
                                                backgroundColor: message.role === 'user'
                                                    ? (darkMode ? '#0366d6' : '#0366d6')
                                                    : (darkMode ? '#37373d' : '#f0f0f0'),
                                                color: message.role === 'user'
                                                    ? '#ffffff'
                                                    : (darkMode ? '#cccccc' : '#24292e'),
                                                wordBreak: 'break-word'
                                            }}
                                        >
                                            <div style={{ fontSize: '14px', lineHeight: '1.5' }}>
                                                {message.content}
                                            </div>
                                            <div style={{
                                                fontSize: '11px',
                                                opacity: 0.7,
                                                marginTop: '4px'
                                            }}>
                                                {message.timestamp.toLocaleTimeString()}
                                            </div>
                                        </div>
                                    ))
                                )}
                                
                                {isChatLoading && (
                                    <div style={{
                                        alignSelf: 'flex-start',
                                        maxWidth: '80%',
                                        padding: '12px 16px',
                                        borderRadius: '16px',
                                        backgroundColor: darkMode ? '#37373d' : '#f0f0f0',
                                        color: darkMode ? '#cccccc' : '#24292e'
                                    }}>
                                        <div style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '8px'
                                        }}>
                                            <div style={{
                                                width: '16px',
                                                height: '16px',
                                                border: `2px solid ${darkMode ? '#666' : '#ccc'}`,
                                                borderTop: `2px solid ${darkMode ? '#cccccc' : '#666'}`,
                                                borderRadius: '50%',
                                                animation: 'spin 1s linear infinite'
                                            }}></div>
                                            AI is thinking...
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Chat Input */}
                            <div style={{
                                padding: '16px',
                                borderTop: `1px solid ${darkMode ? '#3e3e42' : '#e1e4e8'}`,
                                backgroundColor: darkMode ? '#252526' : '#f8f9fa'
                            }}>
                                <div style={{
                                    display: 'flex',
                                    gap: '8px',
                                    alignItems: 'flex-end'
                                }}>
                                    <textarea
                                        value={chatInput}
                                        onChange={(e) => setChatInput(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' && !e.shiftKey) {
                                                e.preventDefault();
                                                sendChatMessage(chatInput);
                                            }
                                        }}
                                        placeholder="Ask the AI assistant about your code..."
                                        style={{
                                            flex: 1,
                                            minHeight: '40px',
                                            maxHeight: '120px',
                                            padding: '8px 12px',
                                            border: `1px solid ${darkMode ? '#4a4a4a' : '#d0d7de'}`,
                                            borderRadius: '8px',
                                            backgroundColor: darkMode ? '#1e1e1e' : '#ffffff',
                                            color: darkMode ? '#cccccc' : '#24292e',
                                            fontSize: '14px',
                                            resize: 'vertical',
                                            fontFamily: 'inherit'
                                        }}
                                    />
                                    <button
                                        onClick={() => sendChatMessage(chatInput)}
                                        disabled={!chatInput.trim() || isChatLoading}
                                        style={{
                                            background: darkMode ? '#0366d6' : '#0366d6',
                                            color: '#ffffff',
                                            border: 'none',
                                            padding: '10px 16px',
                                            borderRadius: '8px',
                                            cursor: chatInput.trim() && !isChatLoading ? 'pointer' : 'not-allowed',
                                            fontSize: '14px',
                                            fontWeight: 500,
                                            opacity: chatInput.trim() && !isChatLoading ? 1 : 0.6
                                        }}
                                    >
                                        Send
                                    </button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        /* Code Editor */
                        <div style={{
                            flex: 1,
                            display: 'flex',
                            flexDirection: 'column',
                            minHeight: 0
                        }}>
                            {error && (
                                <div style={{
                                    backgroundColor: '#fee',
                                    border: '1px solid #fcc',
                                    color: '#c33',
                                    padding: '12px',
                                    margin: '8px',
                                    borderRadius: '4px',
                                    fontSize: '14px',
                                    fontFamily: 'monospace'
                                }}>
                                    {error}
                                </div>
                            )}
                            <MonacoEditor
                                language={language}
                                theme={darkMode ? 'vs-dark' : 'vs-light'}
                                value={code}
                                onChange={(value) => setCode(value || '')}
                                onMount={(editor) => {
                                    editorRef.current = editor;
                                    editor.focus();
                                }}
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
                                }}
                            />
                        </div>
                    )}
                </div>

                {/* Horizontal Divider */}
                <div style={{
                    width: '100%',
                    height: '2px',
                    backgroundColor: darkMode ? '#5c5c5c' : '#d0d7de',
                    flexShrink: 0
                }} />

                {/* Drag Handle for Resizing Output */}
                <div 
                    onMouseDown={handleDragStart}
                    style={{
                        width: '100%',
                        height: '8px',
                        backgroundColor: isDragging ? (darkMode ? '#7c7c7c' : '#a0a7ae') : (darkMode ? '#5c5c5c' : '#d0d7de'),
                        cursor: 'ns-resize',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: isDragging ? 'none' : 'background-color 0.2s',
                        position: 'relative',
                        flexShrink: 0
                    }}
                >
                    {/* Drag Handle Visual Indicator */}
                    <div style={{
                        width: '40px',
                        height: '3px',
                        backgroundColor: isDragging ? (darkMode ? '#ffffff' : '#666666') : (darkMode ? '#888888' : '#999999'),
                        borderRadius: '2px',
                        transition: isDragging ? 'none' : 'background-color 0.2s'
                    }} />
                </div>

                {/* Output Panel - Always at Bottom */}
                <div style={{
                    height: outputHeight,
                    minHeight: outputHeight,
                    display: 'flex',
                    flexDirection: 'column',
                    backgroundColor: darkMode ? '#1a1a1a' : '#f9f9f9',
                    border: `1px solid ${darkMode ? '#4a4a4a' : '#d0d7de'}`,
                    borderTop: 'none',
                    borderRadius: '0 0 8px 8px',
                    overflow: 'hidden',
                    boxShadow: darkMode ? '0 4px 12px rgba(0,0,0,0.3)' : '0 4px 12px rgba(0,0,0,0.1)'
                }}>
                    {/* Output Header */}
                    <div style={{
                        padding: '12px 16px',
                        backgroundColor: darkMode ? '#2d2d2d' : '#e8f4fd',
                        borderBottom: `2px solid ${darkMode ? '#4a4a4a' : '#c8e1ff'}`,
                        fontSize: '14px',
                        fontWeight: 700,
                        color: darkMode ? '#ffffff' : '#0366d6',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        position: 'relative'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontSize: '16px' }}>📺</span>
                            <span>Live Output</span>
                            <span style={{ 
                                fontSize: '11px', 
                                opacity: 0.6,
                                color: darkMode ? '#888' : '#666' 
                            }}>
                                (auto-updates on code changes)
                            </span>
                        </div>
                        {isBuildLoading ? (
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                fontSize: '11px',
                                color: darkMode ? '#ffa500' : '#e65100',
                                fontWeight: 500,
                                background: darkMode ? 'rgba(255,165,0,0.1)' : 'rgba(230,81,0,0.1)',
                                padding: '2px 6px',
                                borderRadius: '4px'
                            }}>
                                <div style={{
                                    width: '10px',
                                    height: '10px',
                                    border: '2px solid rgba(255,165,0,0.3)',
                                    borderTop: '2px solid currentColor',
                                    borderRadius: '50%',
                                    animation: 'spin 1s linear infinite'
                                }}></div>
                                Building...
                            </div>
                        ) : !esbuildReady ? (
                            <span style={{
                                fontSize: '11px',
                                color: darkMode ? '#ffa500' : '#e65100',
                                fontWeight: 500,
                                background: darkMode ? 'rgba(255,165,0,0.1)' : 'rgba(230,81,0,0.1)',
                                padding: '2px 6px',
                                borderRadius: '4px'
                            }}>
                                Initializing...
                            </span>
                        ) : (
                            <span style={{
                                fontSize: '11px',
                                color: darkMode ? '#4caf50' : '#2e7d32',
                                fontWeight: 500,
                                background: darkMode ? 'rgba(76,175,80,0.1)' : 'rgba(46,125,50,0.1)',
                                padding: '2px 6px',
                                borderRadius: '4px'
                            }}>
                                Live
                            </span>
                        )}
                    </div>

                    {/* Output Content */}
                    <div style={{ 
                        flex: 1, 
                        minHeight: 0,
                        position: 'relative',
                        background: darkMode ? '#1e1e1e' : '#ffffff'
                    }}>
                        <iframe
                            ref={outputFrameRef}
                            style={{
                                width: '100%',
                                height: '100%',
                                border: 'none',
                                backgroundColor: 'transparent'
                            }}
                            title="Code Output"
                            // sandbox="allow-scripts allow-same-origin"
                            srcDoc={`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Code Output</title>
    <style>
        body { 
            margin: 0; 
            padding: 16px; 
            font-family: system-ui, -apple-system, sans-serif;
            background: ${darkMode ? '#1e1e1e' : '#ffffff'};
            color: ${darkMode ? '#cccccc' : '#24292e'};
            min-height: 100vh;
        }
        #root { min-height: calc(100vh - 32px); }
    </style>
</head>
<body>
    <div style="
        display: flex; 
        align-items: center; 
        justify-content: center; 
        height: ${isMobile ? '180px' : '220px'}; 
        background: ${darkMode ? 'linear-gradient(135deg, #2a2a2a 0%, #1e1e1e 100%)' : 'linear-gradient(135deg, #f0f8ff 0%, #ffffff 100%)'};
        border: 2px dashed ${darkMode ? '#555' : '#ddd'};
        border-radius: 12px;
        color: ${darkMode ? '#888' : '#666'};
        text-align: center;
        flex-direction: column;
        gap: ${isMobile ? '8px' : '12px'};
        margin: ${isMobile ? '8px' : '16px'};
    ">
        <div style="font-size: ${isMobile ? '24px' : '32px'}; opacity: 0.7;">⚡</div>
        <div style="font-size: ${isMobile ? '14px' : '16px'}; font-weight: 500;">Waiting for code...</div>
        <div style="font-size: ${isMobile ? '11px' : '13px'}; opacity: 0.7;">Output will appear automatically when you write code</div>
    </div>
</body>
</html>
                            `}
                        />
                    </div>
                </div>
            </div>

            {/* Login Modal */}
            {showLogin && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    width: '100vw',
                    height: '100vh',
                    backgroundColor: 'rgba(0, 0, 0, 0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 2000
                }}>
                    <div style={{
                        backgroundColor: darkMode ? '#252526' : '#ffffff',
                        padding: '24px',
                        borderRadius: '8px',
                        width: '90%',
                        maxWidth: '400px',
                        border: `1px solid ${darkMode ? '#3e3e42' : '#e1e4e8'}`
                    }}>
                        <h3 style={{
                            margin: '0 0 16px 0',
                            fontSize: '18px',
                            fontWeight: 600
                        }}>
                            Login to CodeRunner
                        </h3>
                        <p style={{
                            margin: '0 0 16px 0',
                            fontSize: '14px',
                            color: darkMode ? '#888' : '#666',
                            lineHeight: '1.5'
                        }}>
                            Enter a username to save and manage your files. Your files will be stored with your username prefix.
                        </p>
                        <input
                            type="text"
                            placeholder="Enter username..."
                            style={{
                                width: '100%',
                                padding: '12px',
                                border: `1px solid ${darkMode ? '#4a4a4a' : '#d0d7de'}`,
                                borderRadius: '6px',
                                backgroundColor: darkMode ? '#1e1e1e' : '#ffffff',
                                color: darkMode ? '#cccccc' : '#24292e',
                                fontSize: '14px',
                                marginBottom: '16px',
                                boxSizing: 'border-box'
                            }}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    const target = e.target as HTMLInputElement;
                                    handleLogin(target.value);
                                }
                            }}
                            autoFocus
                        />
                        <div style={{
                            display: 'flex',
                            gap: '8px',
                            justifyContent: 'flex-end'
                        }}>
                            <button
                                onClick={() => setShowLogin(false)}
                                style={{
                                    background: 'none',
                                    border: `1px solid ${darkMode ? '#4a4a4a' : '#d0d7de'}`,
                                    color: darkMode ? '#cccccc' : '#24292e',
                                    padding: '8px 16px',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    fontSize: '14px'
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={(e) => {
                                    const input = e.currentTarget.parentElement?.parentElement?.querySelector('input') as HTMLInputElement;
                                    if (input) {
                                        handleLogin(input.value);
                                    }
                                }}
                                style={{
                                    background: darkMode ? '#0366d6' : '#0366d6',
                                    color: '#ffffff',
                                    border: 'none',
                                    padding: '8px 16px',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    fontSize: '14px',
                                    fontWeight: 500
                                }}
                            >
                                Login
                            </button>
                        </div>
                    </div>
                </div>
            )}
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