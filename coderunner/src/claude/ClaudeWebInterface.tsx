import React, { useState, useEffect, useCallback } from 'react';
import { ClaudeWebInterfaceProps, ClaudeMessage } from './types';
import { useClaudeWebSocket } from './hooks/useClaudeWebSocket';
import { useClaudeSession } from './hooks/useClaudeSession';
import { useClaudeMessages } from './hooks/useClaudeMessages';
import { MessageList } from './components/MessageList';
import { SessionBrowser } from './components/SessionBrowser';
import { InputArea } from './components/InputArea';
import { StatusIndicator } from './components/StatusIndicator';
import { downloadAsFile, copyToClipboard } from './utils/messageFormatting';

export const ClaudeWebInterface: React.FC<ClaudeWebInterfaceProps> = ({
  darkMode = false,
  theme = 'auto',
  className = '',
  apiBaseUrl = '',
  autoConnect = true,
  showSessionBrowser = true,
  maxMessages = 1000,
  enableExport = true,
  enableKeyboardShortcuts = true,
  onSessionChange,
  onMessageReceived,
  onConnectionStatusChange,
}) => {
  const [input, setInput] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(showSessionBrowser);
  const [currentTheme, setCurrentTheme] = useState<'light' | 'dark'>('light');

  // Initialize hooks
  const { connectionStatus, connect, disconnect, sendMessage, lastMessage, messageHistory } = 
    useClaudeWebSocket({ 
      autoConnect, 
      apiBaseUrl,
      messageHistoryLimit: maxMessages 
    });

  const { 
    sessions, 
    currentSessionId, 
    loading: sessionLoading, 
    createSession, 
    resumeSession,
    deleteSession,
    exportSession,
    refreshSessions
  } = useClaudeSession({ apiBaseUrl });

  const { 
    messages, 
    addMessage, 
    clearMessages, 
    exportMessages 
  } = useClaudeMessages();

  // Theme management
  useEffect(() => {
    if (theme === 'auto') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      setCurrentTheme(mediaQuery.matches ? 'dark' : 'light');
      
      const handler = (e: MediaQueryListEvent) => {
        setCurrentTheme(e.matches ? 'dark' : 'light');
      };
      
      mediaQuery.addEventListener('change', handler);
      return () => mediaQuery.removeEventListener('change', handler);
    } else if (theme === 'dark' || theme === 'light') {
      setCurrentTheme(theme);
    }
  }, [theme]);

  const isDarkMode = darkMode || currentTheme === 'dark';

  // Handle new messages from WebSocket
  useEffect(() => {
    if (lastMessage) {
      addMessage(lastMessage);
      onMessageReceived?.(lastMessage);
    }
  }, [lastMessage, addMessage, onMessageReceived]);

  // Handle connection status changes
  useEffect(() => {
    onConnectionStatusChange?.(connectionStatus);
  }, [connectionStatus, onConnectionStatusChange]);

  // Handle session changes
  useEffect(() => {
    onSessionChange?.(currentSessionId);
  }, [currentSessionId, onSessionChange]);

  // Keyboard shortcuts
  useEffect(() => {
    if (!enableKeyboardShortcuts) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      // Ctrl/Cmd + Enter to send message
      if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
        event.preventDefault();
        handleSendMessage();
      }

      // Ctrl/Cmd + K to focus input
      if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
        event.preventDefault();
        // Focus will be handled by InputArea
      }

      // Ctrl/Cmd + B to toggle sidebar
      if ((event.ctrlKey || event.metaKey) && event.key === 'b') {
        event.preventDefault();
        setSidebarOpen(prev => !prev);
      }

      // Ctrl/Cmd + N to start new session
      if ((event.ctrlKey || event.metaKey) && event.key === 'n') {
        event.preventDefault();
        handleNewSession();
      }

      // Escape to disconnect
      if (event.key === 'Escape' && event.shiftKey) {
        event.preventDefault();
        handleDisconnect();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [enableKeyboardShortcuts, input]);

  const handleConnect = useCallback(() => {
    connect();
  }, [connect]);

  const handleDisconnect = useCallback(() => {
    disconnect();
    clearMessages();
  }, [disconnect, clearMessages]);

  const handleNewSession = useCallback(async () => {
    if (!connectionStatus.connected) {
      connect();
    }

    try {
      clearMessages();
      const sessionId = await createSession();
      
      // Send start message via WebSocket
      sendMessage({
        type: 'start',
        payload: {}
      });
    } catch (error) {
      console.error('Failed to create session:', error);
    }
  }, [connectionStatus.connected, connect, clearMessages, createSession, sendMessage]);

  const handleResumeSession = useCallback(async (sessionId: string) => {
    if (!connectionStatus.connected) {
      connect();
    }

    try {
      await resumeSession(sessionId);
      clearMessages();
      
      // Send resume message via WebSocket
      sendMessage({
        type: 'resume',
        payload: { sessionId }
      });
    } catch (error) {
      console.error('Failed to resume session:', error);
    }
  }, [connectionStatus.connected, connect, resumeSession, clearMessages, sendMessage]);

  const handleSendMessage = useCallback(() => {
    if (!input.trim() || !connectionStatus.connected || !currentSessionId) {
      return;
    }

    // Send prompt via WebSocket
    sendMessage({
      type: 'prompt',
      payload: { prompt: input.trim() }
    });

    // Add user message to local state for immediate feedback
    const userMessage: ClaudeMessage = {
      type: 'user',
      result: input.trim(),
      timestamp: new Date().toISOString(),
    };
    addMessage(userMessage);

    setInput('');
  }, [input, connectionStatus.connected, currentSessionId, sendMessage, addMessage]);

  const handleStopSession = useCallback(() => {
    sendMessage({
      type: 'stop',
      payload: {}
    });
    clearMessages();
  }, [sendMessage, clearMessages]);

  const handleDeleteSession = useCallback(async (sessionId: string) => {
    try {
      await deleteSession(sessionId);
      if (currentSessionId === sessionId) {
        clearMessages();
      }
    } catch (error) {
      console.error('Failed to delete session:', error);
    }
  }, [deleteSession, currentSessionId, clearMessages]);

  const handleExportSession = useCallback(async (sessionId: string) => {
    if (!enableExport) return;

    try {
      const sessionData = await exportSession(sessionId);
      const session = sessions.find(s => s.session_id === sessionId);
      const filename = `claude-session-${session?.title || sessionId.slice(0, 8)}-${new Date().toISOString().split('T')[0]}.json`;
      
      downloadAsFile(sessionData, filename, 'application/json');
    } catch (error) {
      console.error('Failed to export session:', error);
    }
  }, [enableExport, exportSession, sessions]);

  const handleExportCurrentConversation = useCallback((format: 'json' | 'text' | 'markdown' | 'html' = 'json') => {
    if (!enableExport) return;

    const data = exportMessages(format);
    const extensions = { json: 'json', text: 'txt', markdown: 'md', html: 'html' };
    const mimeTypes = { 
      json: 'application/json',
      text: 'text/plain',
      markdown: 'text/markdown',
      html: 'text/html'
    };
    
    const filename = `claude-conversation-${new Date().toISOString().split('T')[0]}.${extensions[format]}`;
    downloadAsFile(data, filename, mimeTypes[format]);
  }, [enableExport, exportMessages]);

  const handleCopyMessage = useCallback(async (text: string) => {
    await copyToClipboard(text);
  }, []);

  const containerClass = `
    flex h-screen ${isDarkMode ? 'dark bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}
    ${className}
  `;

  const isConnectedAndReady = connectionStatus.connected && currentSessionId;

  return (
    <div className={containerClass}>
      {/* Sidebar */}
      {showSessionBrowser && (
        <div className={`${sidebarOpen ? 'w-80' : 'w-0'} transition-all duration-200 overflow-hidden
          ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-r
        `}>
          <SessionBrowser
            sessions={sessions}
            currentSessionId={currentSessionId}
            loading={sessionLoading}
            darkMode={isDarkMode}
            onSelectSession={handleResumeSession}
            onNewSession={handleNewSession}
            onDeleteSession={enableExport ? handleDeleteSession : undefined}
            onExportSession={enableExport ? handleExportSession : undefined}
          />
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className={`flex items-center justify-between p-4 border-b
          ${isDarkMode ? 'border-gray-700 bg-gray-900' : 'border-gray-200 bg-white'}
        `}>
          <div className="flex items-center gap-3">
            {showSessionBrowser && (
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className={`p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors`}
                title="Toggle sidebar"
              >
                {sidebarOpen ? '◀' : '▶'}
              </button>
            )}
            
            <h1 className="text-xl font-bold">Claude Interface</h1>
          </div>

          <div className="flex items-center gap-2">
            {/* Export button */}
            {enableExport && messages.length > 0 && (
              <div className="relative group">
                <button
                  className={`px-3 py-1 rounded border text-sm transition-colors
                    ${isDarkMode ? 'border-gray-600 hover:bg-gray-700' : 'border-gray-300 hover:bg-gray-100'}
                  `}
                >
                  Export ▼
                </button>
                <div className={`absolute right-0 top-full mt-1 py-1 rounded shadow-lg border z-10 opacity-0 group-hover:opacity-100 transition-opacity
                  ${isDarkMode ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-200'}
                `}>
                  <button onClick={() => handleExportCurrentConversation('json')} className="block w-full px-3 py-1 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700">JSON</button>
                  <button onClick={() => handleExportCurrentConversation('markdown')} className="block w-full px-3 py-1 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700">Markdown</button>
                  <button onClick={() => handleExportCurrentConversation('html')} className="block w-full px-3 py-1 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700">HTML</button>
                  <button onClick={() => handleExportCurrentConversation('text')} className="block w-full px-3 py-1 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700">Text</button>
                </div>
              </div>
            )}

            {/* Connection controls */}
            {!connectionStatus.connected ? (
              <button
                onClick={handleConnect}
                className="px-3 py-1 rounded bg-blue-500 text-white hover:bg-blue-600 transition-colors text-sm"
              >
                Connect
              </button>
            ) : (
              <div className="flex gap-2">
                {!currentSessionId ? (
                  <button
                    onClick={handleNewSession}
                    className="px-3 py-1 rounded bg-green-500 text-white hover:bg-green-600 transition-colors text-sm"
                  >
                    New Session
                  </button>
                ) : (
                  <button
                    onClick={handleStopSession}
                    className="px-3 py-1 rounded bg-red-500 text-white hover:bg-red-600 transition-colors text-sm"
                  >
                    Stop
                  </button>
                )}
                
                <button
                  onClick={handleDisconnect}
                  className={`px-3 py-1 rounded border text-sm transition-colors
                    ${isDarkMode ? 'border-gray-600 hover:bg-gray-700' : 'border-gray-300 hover:bg-gray-100'}
                  `}
                >
                  Disconnect
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Status indicator */}
        <div className="p-4">
          <StatusIndicator
            status={connectionStatus}
            currentSessionId={currentSessionId}
            darkMode={isDarkMode}
          />
        </div>

        {/* Messages */}
        <MessageList
          messages={messages}
          loading={false}
          darkMode={isDarkMode}
          onCopyMessage={handleCopyMessage}
        />

        {/* Input */}
        <InputArea
          value={input}
          onChange={setInput}
          onSubmit={handleSendMessage}
          disabled={!isConnectedAndReady}
          loading={false}
          darkMode={isDarkMode}
          placeholder={
            !connectionStatus.connected 
              ? "Connect to start chatting..." 
              : !currentSessionId 
                ? "Start a session to begin..."
                : "Ask Claude anything..."
          }
        />

        {/* Keyboard shortcuts help */}
        {enableKeyboardShortcuts && (
          <div className={`px-4 py-2 text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-400'} border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
            Shortcuts: <kbd>Ctrl+Enter</kbd> Send • <kbd>Ctrl+N</kbd> New • <kbd>Ctrl+B</kbd> Sidebar • <kbd>Shift+Esc</kbd> Disconnect
          </div>
        )}
      </div>
    </div>
  );
};

export default ClaudeWebInterface;