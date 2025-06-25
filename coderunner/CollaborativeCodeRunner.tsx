import React, { useEffect, useState, useRef, MutableRefObject, useCallback } from 'react';
import MonacoEditor, { type Monaco, loader } from '@monaco-editor/react';
import { createRoot } from 'react-dom/client';
import * as monaco from 'monaco-editor';
import * as Y from 'yjs';
import { MonacoBinding } from 'y-monaco';
import { useMap, useYDoc, useYjsProvider, YDocProvider } from "@y-sweet/react";

// Import ContentServiceProvider if available (optional for this implementation)
// We'll create a simple wrapper if not available
interface ContentServiceContextType {
    state: {
        contentService: any;
        runningAI: boolean;
    };
    setState: React.Dispatch<React.SetStateAction<any>>;
}

const ContentServiceContext = React.createContext<ContentServiceContextType | null>(null);

const SimpleContentServiceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [state] = useState({
        contentService: null,
        runningAI: false,
    });
    const [setState] = useState(() => () => {});
    
    return (
        <ContentServiceContext.Provider value={{ state, setState }}>
            {children}
        </ContentServiceContext.Provider>
    );
};

// Copy the same Monaco loader configuration as original CodeRunner
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

interface CollaborativeCodeRunnerProps {
    roomId?: string;
    username?: string;
    initialCode?: string;
    language?: string;
    onBackToLobby?: () => void;
    initialFilePath?: string;
    darkMode?: boolean;
}

interface ChatMessage {
    id: string;
    userId: string;
    username: string;
    content: string;
    timestamp: number;
    color: string;
}

interface FileItem {
    name: string;
    path: string;
    isDir: boolean;
    size: number;
    lastModified: string;
}

// Generate a consistent color for a user based on their username
const generateUserColor = (username: string): string => {
    const colors = [
        '#ef4444', '#f97316', '#f59e0b', '#eab308', '#84cc16',
        '#22c55e', '#10b981', '#14b8a6', '#06b6d4', '#0ea5e9',
        '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7', '#d946ef',
        '#ec4899', '#f43f5e'
    ];
    let hash = 0;
    for (let i = 0; i < username.length; i++) {
        hash = username.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
};

// Generate random username if none provided
const generateUsername = (): string => {
    const adjectives = ['Quick', 'Clever', 'Bright', 'Swift', 'Smart', 'Cool', 'Fast', 'Sharp'];
    const nouns = ['Coder', 'Developer', 'Hacker', 'Builder', 'Creator', 'Maker', 'Ninja', 'Wizard'];
    const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
    const noun = nouns[Math.floor(Math.random() * nouns.length)];
    return `${adj}${noun}${Math.floor(Math.random() * 100)}`;
};

// Internal component that uses Yjs hooks
const CollaborativeCodeRunnerInternal: React.FC<CollaborativeCodeRunnerProps & { roomId?: string }> = ({
    username: initialUsername,
    roomId,
    initialCode = `import React from 'react';
import ReactDOM from 'react-dom/client';

const App = () => {
  return (
    <div className="p-4">
      <h1 className="text-xl font-bold">Collaborative Component</h1>
      <p>Start building something amazing together!</p>
    </div>
  );
};

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);`,
    language = 'typescript',
    onBackToLobby,
    darkMode = true
}) => {
    // Use the same state structure as original CodeRunner
    const [code, setCode] = useState(initialCode);
    const [username] = useState(initialUsername || generateUsername());
    const [activeTab, setActiveTab] = useState<'chat' | 'code'>('chat');
    const [chatInput, setChatInput] = useState('');
    const [isMobile, setIsMobile] = useState(false);
    const [esbuildReady, setEsbuildReady] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isBuildLoading, setIsBuildLoading] = useState(false);
    const [outputHeight, setOutputHeight] = useState(isMobile ? 250 : 300);
    const [showShareModal, setShowShareModal] = useState(false);
    
    // Yjs hooks
    const doc = useYDoc();
    const provider = useYjsProvider();
    const chatMessagesMap = useMap<ChatMessage>('chat-messages');
    const codeMap = useMap<string>('code-content');
    const usersMap = useMap<{name: string, color: string, lastSeen: number}>('online-users');
    
    // Refs (same as original)
    const editorRef: MutableRefObject<monaco.editor.IStandaloneCodeEditor | null> = useRef(null);
    const outputFrameRef: MutableRefObject<HTMLIFrameElement | null> = useRef(null);
    const chatMessagesRef = useRef<HTMLDivElement | null>(null);
    const monacoBindingRef = useRef<MonacoBinding | null>(null);
    const userColor = useRef(generateUserColor(username));
    
    // Convert Yjs map to array for chat messages
    const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
    const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
    
    // Detect mobile
    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);
    
    // Initialize esbuild (same as original)
    useEffect(() => {
        const initEsbuild = async () => {
            try {
                if (!(window as any).esbuild) {
                    const esbuild = await import('https://unpkg.com/esbuild-wasm@0.19.12/lib/browser.js');
                    await esbuild.initialize({
                        wasmURL: 'https://unpkg.com/esbuild-wasm@0.19.12/esbuild.wasm',
                        worker: true
                    });
                    (window as any).esbuild = esbuild;
                }
                setEsbuildReady(true);
            } catch (err) {
                setError('Failed to initialize esbuild: ' + (err as Error).message);
            }
        };
        
        setTimeout(initEsbuild, 100);
    }, []);
    
    // Set up user presence
    useEffect(() => {
        // Add current user to online users
        usersMap.set(username, {
            name: username,
            color: userColor.current,
            lastSeen: Date.now()
        });
        
        // Set up periodic heartbeat
        const heartbeat = setInterval(() => {
            usersMap.set(username, {
                name: username,
                color: userColor.current,
                lastSeen: Date.now()
            });
        }, 5000);
        
        return () => clearInterval(heartbeat);
    }, [username, usersMap]);
    
    // Listen to chat messages changes
    useEffect(() => {
        const updateChatMessages = () => {
            const messages: ChatMessage[] = [];
            chatMessagesMap.forEach((message) => {
                messages.push(message);
            });
            messages.sort((a, b) => a.timestamp - b.timestamp);
            setChatMessages(messages);
        };
        
        chatMessagesMap.observe(updateChatMessages);
        updateChatMessages();
        
        return () => chatMessagesMap.unobserve(updateChatMessages);
    }, [chatMessagesMap]);
    
    // Listen to users changes
    useEffect(() => {
        const updateOnlineUsers = () => {
            const users: string[] = [];
            const now = Date.now();
            usersMap.forEach((user) => {
                // Consider users online if they were active in the last 30 seconds
                if (now - user.lastSeen < 30000) {
                    users.push(user.name);
                }
            });
            setOnlineUsers(users);
        };
        
        usersMap.observe(updateOnlineUsers);
        updateOnlineUsers();
        
        // Clean up old users periodically
        const cleanup = setInterval(() => {
            const now = Date.now();
            usersMap.forEach((user, key) => {
                if (now - user.lastSeen > 60000) { // Remove after 1 minute
                    usersMap.delete(key);
                }
            });
        }, 10000);
        
        return () => {
            usersMap.unobserve(updateOnlineUsers);
            clearInterval(cleanup);
        };
    }, [usersMap]);
    
    // Monaco editor setup with Yjs binding
    const handleEditorDidMount = useCallback((editor: monaco.editor.IStandaloneCodeEditor) => {
        editorRef.current = editor;
        
        // Set up Yjs text binding for collaborative editing
        const ytext = doc.getText('monaco-content');
        
        // Initialize with current code if Y text is empty
        if (ytext.length === 0 && initialCode) {
            ytext.insert(0, initialCode);
        }
        
        const monacoBinding = new MonacoBinding(
            ytext,
            editor.getModel()!,
            new Set([editor]),
            provider.awareness
        );
        
        monacoBindingRef.current = monacoBinding;
        
        // Listen for code changes to update local state
        editor.onDidChangeModelContent(() => {
            const newCode = editor.getValue();
            setCode(newCode);
        });
    }, [doc, provider, initialCode]);
    
    // Auto-scroll chat messages
    useEffect(() => {
        if (chatMessagesRef.current) {
            chatMessagesRef.current.scrollTop = chatMessagesRef.current.scrollHeight;
        }
    }, [chatMessages]);
    
    // Send chat message
    const sendChatMessage = useCallback(() => {
        if (!chatInput.trim()) return;
        
        const messageId = `${Date.now()}-${Math.random()}`;
        const newMessage: ChatMessage = {
            id: messageId,
            userId: username,
            username: username,
            content: chatInput.trim(),
            timestamp: Date.now(),
            color: userColor.current
        };
        
        chatMessagesMap.set(messageId, newMessage);
        setChatInput('');
    }, [chatInput, username, chatMessagesMap]);
    
    // Build and run code (same as original)
    const buildAndRun = async () => {
        if (!esbuildReady) {
            setError('esbuild is not ready yet');
            return;
        }

        setIsBuildLoading(true);
        setError(null);

        try {
            const esbuild = (window as any).esbuild;
            
            const result = await esbuild.transform(code, {
                loader: 'tsx',
                format: 'iife',
                target: 'es2020',
                jsx: 'automatic',
                jsxImportSource: 'react'
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
        } catch (error) {
            setError('Build failed: ' + (error as Error).message);
        } finally {
            setIsBuildLoading(false);
        }
    };
    
    // Auto-run when code changes (same as original)
    useEffect(() => {
        if (esbuildReady && code.trim()) {
            const timeoutId = setTimeout(() => {
                buildAndRun();
            }, 1500);
            
            return () => clearTimeout(timeoutId);
        }
    }, [esbuildReady, code]);
    
    // Copy room URL
    const copyRoomUrl = () => {
        // Ensure the URL includes the room ID and collaborative mode
        const url = new URL(window.location.href);
        url.searchParams.set('mode', 'collaborative');
        if (roomId) {
            url.searchParams.set('room', roomId);
        }
        if (username) {
            url.searchParams.set('username', username);
        }
        navigator.clipboard.writeText(url.toString());
    };
    
    // Format timestamp
    const formatTimestamp = (timestamp: number) => {
        return new Date(timestamp).toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
    };
    
    // Same UI structure as original CodeRunner
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

            {/* Header - same structure as original */}
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
                            title="Back to AI Chat"
                        >
                            ←
                        </button>
                    )}
                    
                    {/* Title */}
                    {!isMobile && (
                        <h3 style={{ margin: 0, fontWeight: 600, fontSize: '14px' }}>
                            CodeRunner {roomId ? `(Room: ${roomId})` : '(Collaborative)'}
                        </h3>
                    )}

                    {/* Tab Navigation - same as original */}
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
                    
                    {/* Online Users Indicator */}
                    <div style={{
                        fontSize: '12px',
                        color: darkMode ? '#888' : '#666',
                        backgroundColor: darkMode ? '#37373d' : '#e8f4fd',
                        padding: '2px 8px',
                        borderRadius: '12px',
                        border: `1px solid ${darkMode ? '#4a4a4a' : '#c8e1ff'}`
                    }}>
                        {onlineUsers.length} online
                    </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '6px' : '8px' }}>
                    {/* Share Button */}
                    <button
                        onClick={() => setShowShareModal(true)}
                        style={{
                            background: darkMode ? '#0e4429' : '#238636',
                            color: '#ffffff',
                            border: 'none',
                            padding: isMobile ? '6px 8px' : '6px 12px',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: isMobile ? '16px' : '12px',
                            fontWeight: 500,
                            display: 'flex',
                            alignItems: 'center',
                            gap: isMobile ? '0' : '4px'
                        }}
                        title="Share Room"
                    >
                        {isMobile ? '🔗' : '🔗 Share'}
                    </button>
                </div>
            </div>

            {/* Main Content Area - same layout as original */}
            <div style={{ 
                display: 'flex', 
                flex: 1, 
                flexDirection: isMobile ? 'column' : 'row',
                overflow: 'hidden'
            }}>
                {/* Monaco Editor - same as original */}
                <div style={{
                    flex: 1,
                    display: activeTab === 'code' || !isMobile ? 'block' : 'none',
                    height: isMobile ? `calc(100vh - ${outputHeight}px - 80px)` : '100%'
                }}>
                    <MonacoEditor
                        height="100%"
                        language={language}
                        theme={darkMode ? 'vs-dark' : 'vs-light'}
                        onMount={handleEditorDidMount}
                        options={{
                            fontSize: 14,
                            lineNumbers: 'on',
                            wordWrap: 'on',
                            minimap: { enabled: !isMobile },
                            scrollBeyondLastLine: false,
                            automaticLayout: true,
                        }}
                    />
                </div>

                {/* Chat/Output Panel - same structure as original */}
                <div style={{
                    width: isMobile ? '100%' : '400px',
                    height: isMobile ? `${outputHeight}px` : '100%',
                    backgroundColor: darkMode ? '#1e1e1e' : '#ffffff',
                    borderLeft: !isMobile ? `1px solid ${darkMode ? '#3e3e42' : '#e1e4e8'}` : 'none',
                    borderTop: isMobile ? `1px solid ${darkMode ? '#3e3e42' : '#e1e4e8'}` : 'none',
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden'
                }}>
                    {activeTab === 'chat' ? (
                        // Chat Panel - modified for collaborative chat
                        <>
                            {/* Online Users */}
                            <div style={{
                                padding: '12px',
                                borderBottom: `1px solid ${darkMode ? '#3e3e42' : '#e1e4e8'}`,
                                backgroundColor: darkMode ? '#252526' : '#f8f9fa'
                            }}>
                                <div style={{ fontSize: '12px', marginBottom: '8px', fontWeight: 500 }}>
                                    Online Users ({onlineUsers.length})
                                </div>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                                    {onlineUsers.map(user => (
                                        <span 
                                            key={user}
                                            style={{
                                                padding: '2px 8px',
                                                backgroundColor: generateUserColor(user),
                                                color: '#ffffff',
                                                borderRadius: '12px',
                                                fontSize: '11px',
                                                fontWeight: 500
                                            }}
                                        >
                                            {user}
                                        </span>
                                    ))}
                                </div>
                            </div>
                            
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
                                        <div style={{ fontSize: '24px', marginBottom: '8px' }}>💬</div>
                                        <div>Start a conversation with your team!</div>
                                    </div>
                                ) : (
                                    chatMessages.map((message) => (
                                        <div key={message.id} style={{ display: 'flex', gap: '8px' }}>
                                            <div 
                                                style={{
                                                    width: '24px',
                                                    height: '24px',
                                                    borderRadius: '50%',
                                                    backgroundColor: message.color,
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    color: '#ffffff',
                                                    fontSize: '10px',
                                                    fontWeight: 'bold',
                                                    flexShrink: 0
                                                }}
                                            >
                                                {message.username.charAt(0).toUpperCase()}
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
                                                        color: message.color
                                                    }}>
                                                        {message.username}
                                                    </span>
                                                    <span style={{ 
                                                        fontSize: '10px', 
                                                        color: darkMode ? '#888' : '#666'
                                                    }}>
                                                        {formatTimestamp(message.timestamp)}
                                                    </span>
                                                </div>
                                                <div style={{ 
                                                    fontSize: '13px',
                                                    lineHeight: '1.4',
                                                    whiteSpace: 'pre-wrap',
                                                    wordBreak: 'break-word'
                                                }}>
                                                    {message.content}
                                                </div>
                                            </div>
                                        </div>
                                    ))
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
                                                sendChatMessage();
                                            }
                                        }}
                                        placeholder="Type your message..."
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
                                        onClick={sendChatMessage}
                                        disabled={!chatInput.trim()}
                                        style={{
                                            padding: '8px 12px',
                                            border: 'none',
                                            borderRadius: '6px',
                                            backgroundColor: !chatInput.trim() 
                                                ? (darkMode ? '#4a4a4a' : '#d0d7de')
                                                : (darkMode ? '#238636' : '#0366d6'),
                                            color: '#ffffff',
                                            cursor: !chatInput.trim() ? 'not-allowed' : 'pointer',
                                            fontSize: '13px',
                                            fontWeight: 500
                                        }}
                                    >
                                        Send
                                    </button>
                                </div>
                            </div>
                        </>
                    ) : (
                        // Output Panel - same as original
                        <div style={{ 
                            width: '100%', 
                            height: '100%',
                            backgroundColor: '#ffffff',
                            position: 'relative'
                        }}>
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
                    )}
                </div>
            </div>
            
            {/* Share Modal */}
            {showShareModal && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0, 0, 0, 0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000
                }}>
                    <div style={{
                        backgroundColor: darkMode ? '#2d2d30' : '#ffffff',
                        padding: '24px',
                        borderRadius: '8px',
                        width: '90%',
                        maxWidth: '500px',
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)'
                    }}>
                        <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: 600 }}>
                            Share Collaboration Room
                        </h3>
                        <p style={{ margin: '0 0 16px 0', fontSize: '14px', color: darkMode ? '#888' : '#666' }}>
                            Share this URL with others to code together in real-time:
                        </p>
                        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                            <input
                                type="text"
                                value={(() => {
                                    const url = new URL(window.location.href);
                                    url.searchParams.set('mode', 'collaborative');
                                    if (roomId) url.searchParams.set('room', roomId);
                                    if (username) url.searchParams.set('username', username);
                                    return url.toString();
                                })()}
                                readOnly
                                style={{
                                    flex: 1,
                                    padding: '8px 12px',
                                    border: `1px solid ${darkMode ? '#4a4a4a' : '#d0d7de'}`,
                                    borderRadius: '6px',
                                    backgroundColor: darkMode ? '#3e3e42' : '#f8f9fa',
                                    color: darkMode ? '#cccccc' : '#24292e',
                                    fontSize: '13px'
                                }}
                            />
                            <button
                                onClick={copyRoomUrl}
                                style={{
                                    padding: '8px 16px',
                                    border: 'none',
                                    borderRadius: '6px',
                                    backgroundColor: darkMode ? '#238636' : '#0366d6',
                                    color: '#ffffff',
                                    cursor: 'pointer',
                                    fontSize: '13px',
                                    fontWeight: 500
                                }}
                            >
                                Copy
                            </button>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                            <button
                                onClick={() => setShowShareModal(false)}
                                style={{
                                    padding: '8px 16px',
                                    border: `1px solid ${darkMode ? '#4a4a4a' : '#d0d7de'}`,
                                    borderRadius: '6px',
                                    backgroundColor: 'transparent',
                                    color: darkMode ? '#cccccc' : '#24292e',
                                    cursor: 'pointer',
                                    fontSize: '13px',
                                    fontWeight: 500
                                }}
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// Main component that provides YDocProvider
const CollaborativeCodeRunner: React.FC<CollaborativeCodeRunnerProps> = (props) => {
    return (
        <SimpleContentServiceProvider>
                <CollaborativeCodeRunnerInternal {...props} />
        </SimpleContentServiceProvider>
    );
};

export default CollaborativeCodeRunner;