import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ClaudeWebInterfaceProps, ClaudeMessage } from './types';
import { useClaudeWebSocket } from './hooks/useClaudeWebSocket';
import { useClaudeSession } from './hooks/useClaudeSession';
import { useClaudeMessages } from './hooks/useClaudeMessages';
import { useResponsive } from './hooks/useMediaQuery';
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
  const [showMobileExport, setShowMobileExport] = useState(false);
  const [showOverflowMenu, setShowOverflowMenu] = useState(false);
  const overflowMenuRef = useRef<HTMLDivElement>(null);

  // Responsive detection
  const { isMobile, isSmallMobile, isTouchDevice } = useResponsive();

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

  // Auto-close sidebar on mobile when session changes
  useEffect(() => {
    if (isMobile && currentSessionId) {
      setSidebarOpen(false);
    }
  }, [currentSessionId, isMobile]);

  // Auto-adjust sidebar visibility based on screen size
  useEffect(() => {
    if (!isMobile && showSessionBrowser) {
      setSidebarOpen(true);
    }
  }, [isMobile, showSessionBrowser]);

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

  // Handle click outside overflow menu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (overflowMenuRef.current && !overflowMenuRef.current.contains(event.target as Node)) {
        setShowOverflowMenu(false);
      }
    };

    if (showOverflowMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showOverflowMenu]);

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
    ${isMobile ? 'overflow-hidden' : ''}
  `;

  // Mobile overlay backdrop
  const mobileBackdrop = isMobile && sidebarOpen && (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
      onClick={() => setSidebarOpen(false)}
    />
  );

  const isConnectedAndReady = connectionStatus.connected && currentSessionId;

  return (
    <div className={containerClass}>
      {mobileBackdrop}
      
      {/* Sidebar */}
      {showSessionBrowser && (
        <div className={`
          ${isMobile 
            ? `fixed inset-y-0 left-0 z-50 w-80 transform transition-transform duration-300 ease-in-out
               ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`
            : `${sidebarOpen ? 'w-80' : 'w-0'} transition-all duration-200 overflow-hidden`
          }
          ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} 
          ${isMobile ? '' : 'border-r'}
        `}>
          <SessionBrowser
            sessions={sessions}
            currentSessionId={currentSessionId}
            loading={sessionLoading}
            darkMode={isDarkMode}
            isMobile={isMobile}
            onSelectSession={handleResumeSession}
            onNewSession={handleNewSession}
            onDeleteSession={enableExport ? handleDeleteSession : undefined}
            onExportSession={enableExport ? handleExportSession : undefined}
            onClose={isMobile ? () => setSidebarOpen(false) : undefined}
          />
        </div>
      )}

      {/* Main content */}
      <div className={`flex-1 flex flex-col ${isMobile ? 'min-w-0 overflow-hidden' : ''}`}>
        {/* Header */}
        <div className={`flex items-center justify-between p-4 border-b
          ${isDarkMode ? 'border-gray-700 bg-gray-900' : 'border-gray-200 bg-white'}
        `}>
          <div className="flex items-center gap-2 md:gap-3 min-w-0 flex-1">
            {showSessionBrowser && (
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className={`p-2 rounded transition-colors touch-manipulation
                  ${isTouchDevice ? 'active:bg-gray-200 dark:active:bg-gray-600' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}
                `}
                title="Toggle sidebar"
                style={{ minHeight: '44px', minWidth: '44px' }}
              >
                {isMobile ? (sidebarOpen ? '✕' : '☰') : (sidebarOpen ? '◀' : '▶')}
              </button>
            )}
            
            <h1 className={`font-bold truncate ${isSmallMobile ? 'text-lg' : 'text-xl'}`}>
              Claude Interface
            </h1>
          </div>

          <div className="flex items-center gap-1 md:gap-2">
            {/* Overflow menu for secondary actions */}
            {enableExport && messages.length > 0 && (
              <div className="relative" ref={overflowMenuRef}>
                <button
                  onClick={() => isMobile ? setShowMobileExport(true) : setShowOverflowMenu(!showOverflowMenu)}
                  className={`p-1 rounded transition-colors touch-manipulation
                    ${isDarkMode ? 'text-gray-400 hover:text-gray-300 hover:bg-gray-700' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'}
                    ${isMobile ? '' : 'text-sm'}
                  `}
                  style={isMobile ? { minHeight: '44px', minWidth: '44px' } : { minHeight: '32px', minWidth: '32px' }}
                  title="More options"
                >
                  ⋯
                </button>
                
                {/* Desktop dropdown menu */}
                {!isMobile && showOverflowMenu && (
                  <div className={`absolute right-0 top-full mt-1 py-1 rounded shadow-lg border z-20 min-w-32
                    ${isDarkMode ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-200'}
                  `}>
                    <div className={`px-3 py-1 text-xs font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      Export As
                    </div>
                    <button 
                      onClick={() => {
                        handleExportCurrentConversation('json');
                        setShowOverflowMenu(false);
                      }} 
                      className="block w-full px-3 py-1 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      JSON
                    </button>
                    <button 
                      onClick={() => {
                        handleExportCurrentConversation('markdown');
                        setShowOverflowMenu(false);
                      }} 
                      className="block w-full px-3 py-1 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      Markdown
                    </button>
                    <button 
                      onClick={() => {
                        handleExportCurrentConversation('html');
                        setShowOverflowMenu(false);
                      }} 
                      className="block w-full px-3 py-1 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      HTML
                    </button>
                    <button 
                      onClick={() => {
                        handleExportCurrentConversation('text');
                        setShowOverflowMenu(false);
                      }} 
                      className="block w-full px-3 py-1 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      Text
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Connection controls */}
            {!connectionStatus.connected ? (
              <button
                onClick={handleConnect}
                className={`rounded bg-blue-500 text-white transition-colors touch-manipulation
                  ${isTouchDevice ? 'active:bg-blue-700' : 'hover:bg-blue-600'}
                  ${isMobile ? 'px-3 py-2 text-sm' : 'px-3 py-1 text-sm'}
                `}
                style={isMobile ? { minHeight: '44px' } : undefined}
              >
                Connect
              </button>
            ) : (
              <div className={`flex ${isMobile ? 'gap-1' : 'gap-2'}`}>
                {!currentSessionId ? (
                  <button
                    onClick={handleNewSession}
                    disabled={sessionLoading}
                    className={`rounded text-white transition-colors touch-manipulation
                      ${sessionLoading 
                        ? 'bg-gray-500 cursor-not-allowed' 
                        : `bg-green-500 ${isTouchDevice ? 'active:bg-green-700' : 'hover:bg-green-600'}`
                      }
                      ${isMobile ? 'px-2 py-2 text-xs' : 'px-3 py-1 text-sm'}
                    `}
                    style={isMobile ? { minHeight: '44px' } : undefined}
                  >
                    {sessionLoading ? (
                      <>
                        <span className="inline-block animate-spin mr-1">🔄</span>
                        {isMobile ? 'Creating...' : 'Creating Session...'}
                      </>
                    ) : (
                      isMobile ? 'New' : 'New Session'
                    )}
                  </button>
                ) : (
                  <button
                    onClick={handleStopSession}
                    className={`rounded bg-red-500 text-white transition-colors touch-manipulation
                      ${isTouchDevice ? 'active:bg-red-700' : 'hover:bg-red-600'}
                      ${isMobile ? 'px-2 py-2 text-xs' : 'px-3 py-1 text-sm'}
                    `}
                    style={isMobile ? { minHeight: '44px' } : undefined}
                  >
                    Stop
                  </button>
                )}
                
                <button
                  onClick={handleDisconnect}
                  className={`rounded border transition-colors touch-manipulation
                    ${isDarkMode ? 'border-gray-600' : 'border-gray-300'}
                    ${isTouchDevice 
                      ? `${isDarkMode ? 'active:bg-gray-700' : 'active:bg-gray-100'}`
                      : `${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`
                    }
                    ${isMobile ? 'px-2 py-2 text-xs' : 'px-3 py-1 text-sm'}
                  `}
                  style={isMobile ? { minHeight: '44px' } : undefined}
                >
                  {isMobile ? '✕' : 'Disconnect'}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Status indicator */}
        <div className={`p-4 ${isMobile ? 'px-3 py-2' : ''}`}>
          <StatusIndicator
            status={connectionStatus}
            currentSessionId={currentSessionId}
            darkMode={isDarkMode}
            isMobile={isMobile}
            sessionLoading={sessionLoading}
          />
        </div>

        {/* Messages */}
        <div className={isMobile ? 'flex-1 min-h-0 overflow-hidden' : 'flex-1'}>
          <MessageList
            messages={messages}
            loading={sessionLoading}
            darkMode={isDarkMode}
            isMobile={isMobile}
            isTouchDevice={isTouchDevice}
            onCopyMessage={handleCopyMessage}
            onStartNewSession={handleNewSession}
            isConnected={connectionStatus.connected}
            hasActiveSession={!!currentSessionId}
            maxHeight={isMobile ? '100%' : 'calc(100vh - 200px)'}
          />
        </div>

        {/* Input */}
        <InputArea
          value={input}
          onChange={setInput}
          onSubmit={handleSendMessage}
          disabled={!isConnectedAndReady}
          loading={false}
          darkMode={isDarkMode}
          isMobile={isMobile}
          isTouchDevice={isTouchDevice}
          placeholder={
            !connectionStatus.connected 
              ? "Connect to start chatting..." 
              : !currentSessionId 
                ? "Start a session to begin..."
                : "Ask Claude anything..."
          }
        />

        {/* Keyboard shortcuts help */}
        {enableKeyboardShortcuts && !isMobile && (
          <div className={`px-4 py-2 text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-400'} border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
            Shortcuts: <kbd>Ctrl+Enter</kbd> Send • <kbd>Ctrl+N</kbd> New • <kbd>Ctrl+B</kbd> Sidebar • <kbd>Shift+Esc</kbd> Disconnect
          </div>
        )}
      </div>

      {/* Mobile Export Modal */}
      {showMobileExport && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end justify-center z-50 md:hidden">
          <div className={`w-full max-w-md rounded-t-lg p-6 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Export Conversation</h3>
              <button
                onClick={() => setShowMobileExport(false)}
                className={`p-2 rounded transition-colors
                  ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}
                `}
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-2">
              <button 
                onClick={() => {
                  handleExportCurrentConversation('json');
                  setShowMobileExport(false);
                }}
                className={`w-full p-3 rounded border text-left transition-colors
                  ${isDarkMode ? 'border-gray-600 hover:bg-gray-700' : 'border-gray-300 hover:bg-gray-50'}
                `}
              >
                <div className="font-medium">JSON</div>
                <div className="text-sm opacity-70">Structured data format</div>
              </button>
              
              <button 
                onClick={() => {
                  handleExportCurrentConversation('markdown');
                  setShowMobileExport(false);
                }}
                className={`w-full p-3 rounded border text-left transition-colors
                  ${isDarkMode ? 'border-gray-600 hover:bg-gray-700' : 'border-gray-300 hover:bg-gray-50'}
                `}
              >
                <div className="font-medium">Markdown</div>
                <div className="text-sm opacity-70">Formatted text</div>
              </button>
              
              <button 
                onClick={() => {
                  handleExportCurrentConversation('html');
                  setShowMobileExport(false);
                }}
                className={`w-full p-3 rounded border text-left transition-colors
                  ${isDarkMode ? 'border-gray-600 hover:bg-gray-700' : 'border-gray-300 hover:bg-gray-50'}
                `}
              >
                <div className="font-medium">HTML</div>
                <div className="text-sm opacity-70">Web page format</div>
              </button>
              
              <button 
                onClick={() => {
                  handleExportCurrentConversation('text');
                  setShowMobileExport(false);
                }}
                className={`w-full p-3 rounded border text-left transition-colors
                  ${isDarkMode ? 'border-gray-600 hover:bg-gray-700' : 'border-gray-300 hover:bg-gray-50'}
                `}
              >
                <div className="font-medium">Plain Text</div>
                <div className="text-sm opacity-70">Simple text file</div>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClaudeWebInterface;