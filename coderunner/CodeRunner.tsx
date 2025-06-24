import React, { useEffect, useState, useRef, MutableRefObject } from 'react';
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
    
    const editorRef: MutableRefObject<monaco.editor.IStandaloneCodeEditor | null> = useRef(null);

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
                        Code Editor
                    </h3>
                    
                    {/* Current File Indicator */}
                    {currentFile && (
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