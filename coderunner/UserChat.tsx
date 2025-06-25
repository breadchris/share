import React, { useEffect, useState, useRef, useCallback } from 'react';
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import { MonacoBinding } from 'y-monaco';
import * as monaco from 'monaco-editor';
import { Share2, Copy, Users, Send } from 'lucide-react';

interface ChatMessage {
    id: string;
    userId: string;
    username: string;
    content: string;
    timestamp: number;
    color: string; // User's color for visual distinction
}

interface UserChatProps {
    roomId: string;
    username: string;
    onCodeChange?: (code: string) => void;
    initialCode?: string;
    language?: string;
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

export const UserChat: React.FC<UserChatProps> = ({
    roomId,
    username,
    onCodeChange,
    initialCode = '',
    language = 'typescript'
}) => {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [chatInput, setChatInput] = useState('');
    const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
    const [roomUrl, setRoomUrl] = useState('');
    const [showShareModal, setShowShareModal] = useState(false);
    const [editorReady, setEditorReady] = useState(false);
    
    const messagesRef = useRef<HTMLDivElement>(null);
    const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
    const ydocRef = useRef<Y.Doc | null>(null);
    const providerRef = useRef<WebsocketProvider | null>(null);
    const monacoBindingRef = useRef<MonacoBinding | null>(null);
    const userColor = useRef(generateUserColor(username));
    
    // Initialize Yjs document and provider
    useEffect(() => {
        // Create Y.js document
        const ydoc = new Y.Doc();
        ydocRef.current = ydoc;
        
        // Create WebSocket provider for real-time sync
        const wsProtocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
        const provider = new WebsocketProvider(
            `${wsProtocol}//${window.location.host}/ws`,
            `coderunner-${roomId}`,
            ydoc
        );
        providerRef.current = provider;
        
        // Set up awareness for online users
        provider.awareness.setLocalStateField('user', {
            name: username,
            color: userColor.current
        });
        
        // Listen for awareness changes (users joining/leaving)
        const awarenessUpdate = () => {
            const users = new Set<string>();
            provider.awareness.getStates().forEach((state: any) => {
                if (state.user?.name) {
                    users.add(state.user.name);
                }
            });
            setOnlineUsers(users);
        };
        
        provider.awareness.on('change', awarenessUpdate);
        awarenessUpdate(); // Initial call
        
        // Set up chat messages array
        const chatArray = ydoc.getArray<ChatMessage>('chat-messages');
        
        // Listen for chat message changes
        const updateMessages = () => {
            setMessages([...chatArray.toArray()]);
        };
        
        chatArray.observe(updateMessages);
        updateMessages(); // Initial load
        
        // Generate room URL
        const currentUrl = new URL(window.location.href);
        currentUrl.searchParams.set('room', roomId);
        setRoomUrl(currentUrl.toString());
        
        return () => {
            provider.awareness.off('change', awarenessUpdate);
            chatArray.unobserve(updateMessages);
            provider.destroy();
            ydoc.destroy();
        };
    }, [roomId, username]);
    
    // Initialize Monaco editor with Yjs binding
    useEffect(() => {
        if (!ydocRef.current || !providerRef.current) return;
        
        const container = document.getElementById('monaco-editor-container');
        if (!container) return;
        
        // Create Monaco editor
        const editor = monaco.editor.create(container, {
            value: initialCode,
            language: language,
            theme: 'vs-dark',
            automaticLayout: true,
            fontSize: 14,
            lineNumbers: 'on',
            wordWrap: 'on',
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
        });
        
        editorRef.current = editor;
        
        // Set up Yjs binding for collaborative editing
        const ytext = ydocRef.current.getText('monaco-content');
        const monacoBinding = new MonacoBinding(
            ytext,
            editor.getModel()!,
            new Set([editor]),
            providerRef.current.awareness
        );
        
        monacoBindingRef.current = monacoBinding;
        
        // Listen for code changes
        editor.onDidChangeModelContent(() => {
            const code = editor.getValue();
            onCodeChange?.(code);
        });
        
        setEditorReady(true);
        
        return () => {
            monacoBinding.destroy();
            editor.dispose();
        };
    }, [initialCode, language, onCodeChange]);
    
    // Auto-scroll chat messages
    useEffect(() => {
        if (messagesRef.current) {
            messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
        }
    }, [messages]);
    
    const sendMessage = useCallback(() => {
        if (!chatInput.trim() || !ydocRef.current) return;
        
        const chatArray = ydocRef.current.getArray<ChatMessage>('chat-messages');
        const newMessage: ChatMessage = {
            id: `${Date.now()}-${Math.random()}`,
            userId: username,
            username: username,
            content: chatInput.trim(),
            timestamp: Date.now(),
            color: userColor.current
        };
        
        chatArray.push([newMessage]);
        setChatInput('');
    }, [chatInput, username]);
    
    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };
    
    const copyRoomUrl = () => {
        navigator.clipboard.writeText(roomUrl);
        // Could add a toast notification here
    };
    
    const formatTimestamp = (timestamp: number) => {
        return new Date(timestamp).toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
    };
    
    return (
        <div className="flex flex-col h-full bg-gray-900 text-white">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-700">
                <div className="flex items-center space-x-3">
                    <Users className="w-5 h-5 text-blue-400" />
                    <span className="font-medium">Room: {roomId}</span>
                    <div className="flex items-center space-x-1">
                        <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                        <span className="text-sm text-gray-300">{onlineUsers.size} online</span>
                    </div>
                </div>
                <button
                    onClick={() => setShowShareModal(true)}
                    className="flex items-center space-x-2 px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded-md text-sm transition-colors"
                >
                    <Share2 className="w-4 h-4" />
                    <span>Share</span>
                </button>
            </div>
            
            {/* Online Users */}
            <div className="px-4 py-2 border-b border-gray-700">
                <div className="flex flex-wrap gap-2">
                    {Array.from(onlineUsers).map(user => (
                        <span 
                            key={user}
                            className="px-2 py-1 bg-gray-700 rounded-full text-xs"
                            style={{ borderLeft: `3px solid ${generateUserColor(user)}` }}
                        >
                            {user}
                        </span>
                    ))}
                </div>
            </div>
            
            {/* Chat Messages */}
            <div 
                ref={messagesRef}
                className="flex-1 overflow-y-auto p-4 space-y-3"
            >
                {messages.length === 0 ? (
                    <div className="text-center text-gray-400 py-8">
                        <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                        <p>Welcome to the collaborative chat!</p>
                        <p className="text-sm">Start a conversation and code together.</p>
                    </div>
                ) : (
                    messages.map((message) => (
                        <div key={message.id} className="flex space-x-3">
                            <div 
                                className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold"
                                style={{ backgroundColor: message.color }}
                            >
                                {message.username.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1">
                                <div className="flex items-center space-x-2 mb-1">
                                    <span className="font-medium" style={{ color: message.color }}>
                                        {message.username}
                                    </span>
                                    <span className="text-xs text-gray-400">
                                        {formatTimestamp(message.timestamp)}
                                    </span>
                                </div>
                                <div className="text-gray-200 whitespace-pre-wrap">
                                    {message.content}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
            
            {/* Chat Input */}
            <div className="p-4 border-t border-gray-700">
                <div className="flex space-x-2">
                    <input
                        type="text"
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Type your message..."
                        className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-gray-400"
                    />
                    <button
                        onClick={sendMessage}
                        disabled={!chatInput.trim()}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-md transition-colors"
                    >
                        <Send className="w-4 h-4" />
                    </button>
                </div>
            </div>
            
            {/* Monaco Editor Container */}
            <div className="hidden">
                <div id="monaco-editor-container" style={{ height: '400px', width: '100%' }}></div>
            </div>
            
            {/* Share Modal */}
            {showShareModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md">
                        <h3 className="text-lg font-medium mb-4">Share Room</h3>
                        <p className="text-gray-300 mb-4">
                            Share this URL with others to collaborate:
                        </p>
                        <div className="flex space-x-2 mb-4">
                            <input
                                type="text"
                                value={roomUrl}
                                readOnly
                                className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white"
                            />
                            <button
                                onClick={copyRoomUrl}
                                className="px-3 py-2 bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
                            >
                                <Copy className="w-4 h-4" />
                            </button>
                        </div>
                        <div className="flex justify-end space-x-2">
                            <button
                                onClick={() => setShowShareModal(false)}
                                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-md transition-colors"
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

export default UserChat;