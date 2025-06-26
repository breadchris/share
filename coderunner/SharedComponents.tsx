import React, { useRef, MutableRefObject, useState, useEffect, useCallback } from 'react';
import MonacoEditor, { loader } from '@monaco-editor/react';
import * as monaco from 'monaco-editor';

// Shared interfaces
export interface FileItem {
    name: string;
    path: string;
    isDir: boolean;
    size: number;
    lastModified: string;
}

export interface BaseCodeRunnerProps {
    initialCode?: string;
    darkMode?: boolean;
    language?: string;
    initialFilePath?: string;
}

// Shared Monaco loader configuration
let loaderConfigured = false;
export const configureMonacoLoader = () => {
    if (loaderConfigured) {
        return;
    }
    loader.config({ monaco });
    loaderConfigured = true;
};

const nodeModules = '/static/node_modules/monaco-editor/esm/vs/';
if (typeof window !== 'undefined') {
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
}

// Shared Header Component
interface HeaderProps {
    darkMode: boolean;
    isMobile: boolean;
    title?: string;
    onBackToLobby?: () => void;
    activeTab: 'chat' | 'code';
    onTabChange: (tab: 'chat' | 'code') => void;
    additionalInfo?: React.ReactNode;
    rightActions?: React.ReactNode;
    showViewDropdown?: boolean;
    viewMode?: 'ai-chat' | 'collaborative';
    onViewModeChange?: (mode: 'ai-chat' | 'collaborative') => void;
    onToggleViewDropdown?: () => void;
}

export const CodeRunnerHeader: React.FC<HeaderProps> = ({
    darkMode,
    isMobile,
    title = 'CodeRunner',
    onBackToLobby,
    activeTab,
    onTabChange,
    additionalInfo,
    rightActions,
    showViewDropdown,
    viewMode,
    onViewModeChange,
    onToggleViewDropdown
}) => {
    return (
        <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: isMobile ? '8px 12px' : '12px 16px',
            backgroundColor: darkMode ? '#252526' : '#f8f9fa',
            borderBottom: `1px solid ${darkMode ? '#3e3e42' : '#e1e4e8'}`,
            fontSize: '14px',
            minHeight: isMobile ? '44px' : '48px',
            boxSizing: 'border-box'
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '8px' : '12px' }}>
                {/* Back Button */}
                {onBackToLobby && (
                    <button
                        onClick={onBackToLobby}
                        style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            color: darkMode ? '#cccccc' : '#24292e',
                            padding: '4px',
                            fontSize: '16px'
                        }}
                        title="Back"
                    >
                        ←
                    </button>
                )}
                
                {/* Hamburger Menu for original CodeRunner */}
                {!onBackToLobby && (
                    <button
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
                )}
                
                {/* Title */}
                {!isMobile && (
                    <h3 style={{ margin: 0, fontWeight: 600, fontSize: '14px' }}>
                        {title}
                    </h3>
                )}

                {/* View Mode Dropdown */}
                {onViewModeChange && (
                    <div style={{ position: 'relative' }} onClick={(e) => e.stopPropagation()}>
                        <button
                            onClick={onToggleViewDropdown}
                            style={{
                                background: darkMode ? '#37373d' : '#f8f9fa',
                                border: `1px solid ${darkMode ? '#4a4a4a' : '#d0d7de'}`,
                                color: darkMode ? '#cccccc' : '#24292e',
                                cursor: 'pointer',
                                padding: isMobile ? '6px 8px' : '6px 12px',
                                borderRadius: '6px',
                                fontSize: isMobile ? '12px' : '12px',
                                fontWeight: 500,
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px'
                            }}
                            title="Switch View Mode"
                        >
                            {viewMode === 'ai-chat' ? '🤖 AI Chat' : '👥 Collaborative'}
                            <span style={{ fontSize: '10px' }}>▼</span>
                        </button>
                        
                        {showViewDropdown && (
                            <div style={{
                                position: 'absolute',
                                top: '100%',
                                left: 0,
                                zIndex: 1000,
                                backgroundColor: darkMode ? '#2d2d30' : '#ffffff',
                                border: `1px solid ${darkMode ? '#4a4a4a' : '#d0d7de'}`,
                                borderRadius: '6px',
                                boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
                                minWidth: '150px',
                                marginTop: '4px'
                            }}>
                                <button
                                    onClick={() => onViewModeChange('ai-chat')}
                                    style={{
                                        width: '100%',
                                        padding: '8px 12px',
                                        border: 'none',
                                        background: viewMode === 'ai-chat' ? (darkMode ? '#37373d' : '#e8f4fd') : 'transparent',
                                        color: viewMode === 'ai-chat' ? (darkMode ? '#ffffff' : '#0366d6') : (darkMode ? '#cccccc' : '#24292e'),
                                        cursor: 'pointer',
                                        fontSize: '12px',
                                        textAlign: 'left',
                                        borderRadius: '4px',
                                        margin: '2px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '6px'
                                    }}
                                >
                                    🤖 AI Chat
                                </button>
                                <button
                                    onClick={() => onViewModeChange('collaborative')}
                                    style={{
                                        width: '100%',
                                        padding: '8px 12px',
                                        border: 'none',
                                        background: viewMode === 'collaborative' ? (darkMode ? '#37373d' : '#e8f4fd') : 'transparent',
                                        color: viewMode === 'collaborative' ? (darkMode ? '#ffffff' : '#0366d6') : (darkMode ? '#cccccc' : '#24292e'),
                                        cursor: 'pointer',
                                        fontSize: '12px',
                                        textAlign: 'left',
                                        borderRadius: '4px',
                                        margin: '2px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '6px'
                                    }}
                                >
                                    👥 Collaborative
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {/* Tab Navigation */}
                <div style={{ display: 'flex', gap: '4px' }}>
                    <button
                        onClick={() => onTabChange('chat')}
                        style={{
                            background: activeTab === 'chat' 
                                ? (darkMode ? '#37373d' : '#e8f4fd')
                                : 'none',
                            border: `1px solid ${darkMode ? '#4a4a4a' : '#d0d7de'}`,
                            color: activeTab === 'chat'
                                ? (darkMode ? '#ffffff' : '#0366d6')
                                : (darkMode ? '#cccccc' : '#24292e'),
                            cursor: 'pointer',
                            padding: isMobile ? '6px 8px' : '6px 12px',
                            borderRadius: '6px',
                            fontSize: isMobile ? '16px' : '12px',
                            fontWeight: 500,
                            display: 'flex',
                            alignItems: 'center',
                            gap: isMobile ? '0' : '4px'
                        }}
                        title="Chat"
                    >
                        {isMobile ? '💬' : '💬 Chat'}
                    </button>
                    <button
                        onClick={() => onTabChange('code')}
                        style={{
                            background: activeTab === 'code' 
                                ? (darkMode ? '#37373d' : '#e8f4fd')
                                : 'none',
                            border: `1px solid ${darkMode ? '#4a4a4a' : '#d0d7de'}`,
                            color: activeTab === 'code'
                                ? (darkMode ? '#ffffff' : '#0366d6')
                                : (darkMode ? '#cccccc' : '#24292e'),
                            cursor: 'pointer',
                            padding: isMobile ? '6px 8px' : '6px 12px',
                            borderRadius: '6px',
                            fontSize: isMobile ? '16px' : '12px',
                            fontWeight: 500,
                            display: 'flex',
                            alignItems: 'center',
                            gap: isMobile ? '0' : '4px'
                        }}
                        title="Code"
                    >
                        {isMobile ? '📝' : '📝 Code'}
                    </button>
                </div>
                
                {/* Additional Info */}
                {additionalInfo}
            </div>

            {/* Right Actions */}
            <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '6px' : '8px' }}>
                {rightActions}
            </div>
        </div>
    );
};

// Shared Monaco Editor Component
interface SharedMonacoEditorProps {
    height?: string;
    language?: string;
    theme?: string;
    onMount?: (editor: monaco.editor.IStandaloneCodeEditor) => void;
    options?: monaco.editor.IStandaloneEditorConstructionOptions;
    value?: string;
    onChange?: (value: string) => void;
}

export const SharedMonacoEditor: React.FC<SharedMonacoEditorProps> = ({
    height = "100%",
    language = "typescript",
    theme = "vs-dark",
    onMount,
    options,
    value,
    onChange
}) => {
    return (
        <MonacoEditor
            height={height}
            language={language}
            theme={theme}
            onMount={onMount}
            value={value}
            onChange={onChange}
            options={{
                fontSize: 14,
                lineNumbers: 'on',
                wordWrap: 'on',
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                automaticLayout: true,
                ...options
            }}
        />
    );
};

// Shared Output Panel Component
interface OutputPanelProps {
    darkMode: boolean;
    isBuildLoading: boolean;
    error: string | null;
    outputFrameRef: MutableRefObject<HTMLIFrameElement | null>;
}

export const OutputPanel: React.FC<OutputPanelProps> = ({
    darkMode,
    isBuildLoading,
    error,
    outputFrameRef
}) => {
    return (
        <div style={{ 
            width: '100%', 
            height: '100%',
            backgroundColor: '#ffffff',
            position: 'relative'
        }}>
            <style>{`
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            `}</style>
            
            {isBuildLoading && (
                <div style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    zIndex: 10,
                    backgroundColor: 'rgba(255, 255, 255, 0.9)',
                    padding: '20px',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px'
                }}>
                    <div style={{
                        width: '20px',
                        height: '20px',
                        border: '2px solid #e1e4e8',
                        borderTop: '2px solid #0366d6',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite'
                    }}></div>
                    Building...
                </div>
            )}
            
            {error && (
                <div style={{
                    padding: '20px',
                    backgroundColor: '#ffeaea',
                    color: '#d73a49',
                    fontFamily: 'Monaco, Consolas, monospace',
                    fontSize: '12px',
                    whiteSpace: 'pre-wrap',
                    maxHeight: '200px',
                    overflowY: 'auto'
                }}>
                    {error}
                </div>
            )}
            
            <iframe
                ref={outputFrameRef}
                style={{
                    width: '100%',
                    height: '100%',
                    border: 'none',
                    backgroundColor: '#ffffff'
                }}
                title="Output"
            />
        </div>
    );
};

// Shared esbuild utilities
export const initializeEsbuild = async () => {
    try {
        if (!(window as any).esbuild) {
            const esbuild = await import('https://unpkg.com/esbuild-wasm@0.19.12/lib/browser.js');
            await esbuild.initialize({
                wasmURL: 'https://unpkg.com/esbuild-wasm@0.19.12/esbuild.wasm',
                worker: true
            });
            (window as any).esbuild = esbuild;
        }
        return true;
    } catch (err) {
        throw new Error('Failed to initialize esbuild: ' + (err as Error).message);
    }
};

export const buildAndRunCode = async (
    code: string,
    outputFrameRef: MutableRefObject<HTMLIFrameElement | null>
) => {
    const esbuild = (window as any).esbuild;
    if (!esbuild) {
        throw new Error('esbuild is not ready yet');
    }

    const result = await esbuild.transform(code, {
        loader: 'tsx',
        target: 'es2020',
        format: 'esm',
        jsx: 'automatic',
        jsxImportSource: 'react',
    });

    const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Code Output</title>
            <script src="https://unpkg.com/react@18/umd/react.development.js"></script>
            <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
            <script src="https://cdn.tailwindcss.com"></script>
            <style>
                body { margin: 0; padding: 0; font-family: system-ui, -apple-system, sans-serif; }
                #root { width: 100%; height: 100vh; }
            </style>
        </head>
        <body>
            <div id="root"></div>
            <script>
                try {
                    ${result.code}
                } catch (error) {
                    document.getElementById('root').innerHTML = \`
                        <div style="padding: 20px; color: red; font-family: monospace;">
                            <h3>Runtime Error:</h3>
                            <pre>\${error.message}</pre>
                            <pre>\${error.stack}</pre>
                        </div>
                    \`;
                }
            </script>
        </body>
        </html>
    `;

    if (outputFrameRef.current) {
        const blob = new Blob([htmlContent], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        outputFrameRef.current.src = url;
        setTimeout(() => URL.revokeObjectURL(url), 1000);
    }
};

// Shared mobile detection hook
export const useIsMobile = () => {
    const [isMobile, setIsMobile] = useState(false);
    
    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);
    
    return isMobile;
};

// AI Service Hook for extracting AI logic from original CodeRunner
export const useAIService = () => {
    const [isChatLoading, setIsChatLoading] = useState(false);
    const [chatMessages, setChatMessages] = useState<Array<{id: string, role: 'user' | 'assistant', content: string, timestamp: Date}>>([]);
    
    const sendMessage = useCallback(async (message: string, code: string) => {
        if (!message.trim()) return;
        
        const userMessage = {
            id: Date.now().toString(),
            role: 'user' as const,
            content: message,
            timestamp: new Date()
        };
        
        setChatMessages(prev => [...prev, userMessage]);
        setIsChatLoading(true);
        
        try {
            const response = await fetch('/ai/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: message,
                    code: code,
                    history: chatMessages.slice(-10)
                })
            });
            
            if (!response.ok) throw new Error('Failed to send message');
            
            const reader = response.body?.getReader();
            if (!reader) throw new Error('No response reader');
            
            const assistantMessage = {
                id: (Date.now() + 1).toString(),
                role: 'assistant' as const,
                content: '',
                timestamp: new Date()
            };
            
            setChatMessages(prev => [...prev, assistantMessage]);
            
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                
                const chunk = new TextDecoder().decode(value);
                assistantMessage.content += chunk;
                
                setChatMessages(prev => 
                    prev.map(msg => 
                        msg.id === assistantMessage.id 
                            ? { ...msg, content: assistantMessage.content }
                            : msg
                    )
                );
            }
        } catch (error) {
            console.error('Chat error:', error);
            const errorMessage = {
                id: (Date.now() + 1).toString(),
                role: 'assistant' as const,
                content: 'Sorry, I encountered an error. Please try again.',
                timestamp: new Date()
            };
            setChatMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsChatLoading(false);
        }
    }, [chatMessages]);
    
    return {
        chatMessages,
        setChatMessages,
        isChatLoading,
        sendMessage
    };
};

// Chat Panel Component for AI chat
interface AIChatPanelProps {
    darkMode: boolean;
    isMobile: boolean;
    chatMessages: Array<{id: string, role: 'user' | 'assistant', content: string, timestamp: Date}>;
    chatInput: string;
    setChatInput: (value: string) => void;
    onSendMessage: (message: string) => void;
    isChatLoading: boolean;
}

export const AIChatPanel: React.FC<AIChatPanelProps> = ({
    darkMode,
    isMobile,
    chatMessages,
    chatInput,
    setChatInput,
    onSendMessage,
    isChatLoading
}) => {
    const chatMessagesRef = useRef<HTMLDivElement>(null);
    
    // Auto-scroll chat messages
    useEffect(() => {
        if (chatMessagesRef.current) {
            chatMessagesRef.current.scrollTop = chatMessagesRef.current.scrollHeight;
        }
    }, [chatMessages]);
    
    const handleSendMessage = () => {
        if (!chatInput.trim() || isChatLoading) return;
        onSendMessage(chatInput.trim());
        setChatInput('');
    };
    
    return (
        <>
            {/* Chat Messages */}
            <div 
                ref={chatMessagesRef}
                style={{
                    flex: 1,
                    overflowY: 'auto',
                    padding: '12px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px'
                }}
            >
                {chatMessages.length === 0 ? (
                    <div style={{
                        textAlign: 'center',
                        color: darkMode ? '#888' : '#666',
                        fontSize: '14px',
                        marginTop: '20px'
                    }}>
                        <div style={{ fontSize: '24px', marginBottom: '8px' }}>🤖</div>
                        <div>Ask me anything about your code!</div>
                        <div style={{ fontSize: '12px', marginTop: '4px' }}>I can help with debugging, optimization, and explanations.</div>
                    </div>
                ) : (
                    chatMessages.map((message) => (
                        <div key={message.id} style={{ display: 'flex', gap: '8px' }}>
                            <div 
                                style={{
                                    width: '24px',
                                    height: '24px',
                                    borderRadius: '50%',
                                    backgroundColor: message.role === 'user' ? '#0366d6' : '#28a745',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: '#ffffff',
                                    fontSize: '10px',
                                    fontWeight: 'bold',
                                    flexShrink: 0
                                }}
                            >
                                {message.role === 'user' ? '👤' : '🤖'}
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    gap: '6px',
                                    marginBottom: '2px'
                                }}>
                                    <span style={{ 
                                        fontSize: '12px', 
                                        fontWeight: 600,
                                        color: message.role === 'user' ? '#0366d6' : '#28a745'
                                    }}>
                                        {message.role === 'user' ? 'You' : 'Assistant'}
                                    </span>
                                    <span style={{ 
                                        fontSize: '10px', 
                                        color: darkMode ? '#888' : '#666'
                                    }}>
                                        {message.timestamp.toLocaleTimeString([], { 
                                            hour: '2-digit', 
                                            minute: '2-digit' 
                                        })}
                                    </span>
                                </div>
                                <div style={{ 
                                    fontSize: '13px',
                                    lineHeight: '1.4',
                                    whiteSpace: 'pre-wrap',
                                    wordBreak: 'break-word',
                                    fontFamily: message.role === 'assistant' && message.content.includes('```') 
                                        ? 'Monaco, Consolas, monospace' 
                                        : 'inherit'
                                }}>
                                    {message.content}
                                </div>
                            </div>
                        </div>
                    ))
                )}
                
                {isChatLoading && (
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <div 
                            style={{
                                width: '24px',
                                height: '24px',
                                borderRadius: '50%',
                                backgroundColor: '#28a745',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: '#ffffff',
                                fontSize: '10px',
                                fontWeight: 'bold',
                                flexShrink: 0
                            }}
                        >
                            🤖
                        </div>
                        <div style={{ 
                            flex: 1,
                            fontSize: '13px',
                            color: darkMode ? '#888' : '#666',
                            fontStyle: 'italic'
                        }}>
                            <div>Assistant is typing...</div>
                        </div>
                    </div>
                )}
            </div>
            
            {/* Chat Input */}
            <div style={{
                padding: '12px',
                borderTop: `1px solid ${darkMode ? '#3e3e42' : '#e1e4e8'}`,
                backgroundColor: darkMode ? '#252526' : '#f8f9fa'
            }}>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <input
                        type="text"
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        onKeyPress={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleSendMessage();
                            }
                        }}
                        placeholder="Ask about your code..."
                        disabled={isChatLoading}
                        style={{
                            flex: 1,
                            padding: '8px 12px',
                            border: `1px solid ${darkMode ? '#4a4a4a' : '#d0d7de'}`,
                            borderRadius: '6px',
                            backgroundColor: darkMode ? '#3e3e42' : '#ffffff',
                            color: darkMode ? '#cccccc' : '#24292e',
                            fontSize: '13px',
                            outline: 'none'
                        }}
                    />
                    <button
                        onClick={handleSendMessage}
                        disabled={!chatInput.trim() || isChatLoading}
                        style={{
                            padding: '8px 12px',
                            border: 'none',
                            borderRadius: '6px',
                            backgroundColor: (!chatInput.trim() || isChatLoading)
                                ? (darkMode ? '#4a4a4a' : '#d0d7de')
                                : (darkMode ? '#238636' : '#0366d6'),
                            color: '#ffffff',
                            cursor: (!chatInput.trim() || isChatLoading) ? 'not-allowed' : 'pointer',
                            fontSize: '13px',
                            fontWeight: 500
                        }}
                    >
                        {isChatLoading ? '...' : 'Send'}
                    </button>
                </div>
            </div>
        </>
    );
};

// Configure Monaco on module load
configureMonacoLoader();