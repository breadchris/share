import React, { useState } from 'react';
import { ClaudeWebInterface } from '../ClaudeWebInterface';
import { ClaudeMessage, ClaudeConnectionStatus } from '../types';

interface DemoProps {
  darkMode?: boolean;
}

export const ClaudeDemo: React.FC<DemoProps> = ({ darkMode = false }) => {
  const [logs, setLogs] = useState<string[]>([]);
  const [messageCount, setMessageCount] = useState(0);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<ClaudeConnectionStatus>({
    connected: false,
    connecting: false,
  });

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev.slice(-10), `[${timestamp}] ${message}`]);
  };

  const handleMessageReceived = (message: ClaudeMessage) => {
    setMessageCount(prev => prev + 1);
    addLog(`Message received: ${message.type} (${message.session_id?.slice(0, 8)}...)`);
  };

  const handleConnectionStatusChange = (status: ClaudeConnectionStatus) => {
    setConnectionStatus(status);
    addLog(`Connection status: ${status.connected ? 'Connected' : 'Disconnected'}`);
    if (status.error) {
      addLog(`Connection error: ${status.error}`);
    }
  };

  const handleSessionChange = (sessionId: string | null) => {
    setCurrentSessionId(sessionId);
    addLog(`Session changed: ${sessionId ? sessionId.slice(0, 8) + '...' : 'None'}`);
  };

  const bgClass = darkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900';
  const cardClass = darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200';

  return (
    <div className={`min-h-screen ${bgClass}`}>
      {/* Demo header */}
      <div className={`${cardClass} border-b p-4`}>
        <div className="max-w-6xl mx-auto">
          <h1 className="text-2xl font-bold mb-2">Claude Web Interface Demo</h1>
          <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            A comprehensive React component for chatting with Claude AI. 
            Features real-time WebSocket communication, session management, and responsive design.
          </p>
          
          {/* Stats */}
          <div className="flex gap-6 mt-4 text-sm">
            <div className={`flex items-center gap-2 px-3 py-1 rounded ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
              <span className={`w-2 h-2 rounded-full ${connectionStatus.connected ? 'bg-green-500' : 'bg-red-500'}`} />
              <span>{connectionStatus.connected ? 'Connected' : 'Disconnected'}</span>
            </div>
            
            <div className={`px-3 py-1 rounded ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
              Session: {currentSessionId ? currentSessionId.slice(0, 8) + '...' : 'None'}
            </div>
            
            <div className={`px-3 py-1 rounded ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
              Messages: {messageCount}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-4">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 h-[calc(100vh-200px)]">
          {/* Main interface */}
          <div className="lg:col-span-3">
            <div className={`${cardClass} border rounded-lg h-full overflow-hidden`}>
              <ClaudeWebInterface
                darkMode={darkMode}
                autoConnect={false}
                showSessionBrowser={true}
                maxMessages={100}
                enableExport={true}
                enableKeyboardShortcuts={true}
                onMessageReceived={handleMessageReceived}
                onConnectionStatusChange={handleConnectionStatusChange}
                onSessionChange={handleSessionChange}
                className="h-full"
              />
            </div>
          </div>

          {/* Debug panel */}
          <div className="lg:col-span-1">
            <div className={`${cardClass} border rounded-lg p-4 h-full flex flex-col`}>
              <h3 className="font-semibold mb-3">Debug Panel</h3>
              
              {/* Quick actions */}
              <div className="space-y-2 mb-4">
                <button
                  onClick={() => addLog('Manual log entry added')}
                  className={`w-full px-3 py-2 rounded text-sm border transition-colors
                    ${darkMode 
                      ? 'border-gray-600 hover:bg-gray-700' 
                      : 'border-gray-300 hover:bg-gray-100'
                    }
                  `}
                >
                  Add Test Log
                </button>
                
                <button
                  onClick={() => setLogs([])}
                  className={`w-full px-3 py-2 rounded text-sm border transition-colors
                    ${darkMode 
                      ? 'border-gray-600 hover:bg-gray-700' 
                      : 'border-gray-300 hover:bg-gray-100'
                    }
                  `}
                >
                  Clear Logs
                </button>
              </div>

              {/* Event logs */}
              <div className="flex-1 overflow-hidden">
                <h4 className={`text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Event Log
                </h4>
                <div className={`h-full overflow-y-auto text-xs font-mono p-3 rounded border
                  ${darkMode ? 'bg-gray-900 border-gray-600' : 'bg-gray-50 border-gray-200'}
                `}>
                  {logs.length === 0 ? (
                    <div className={`${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                      No events yet...
                    </div>
                  ) : (
                    logs.map((log, index) => (
                      <div key={index} className="mb-1 break-words">
                        {log}
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Connection info */}
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <h4 className={`text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Connection Info
                </h4>
                <div className="space-y-1 text-xs">
                  <div>Status: {connectionStatus.connected ? '🟢 Connected' : '🔴 Disconnected'}</div>
                  <div>Connecting: {connectionStatus.connecting ? 'Yes' : 'No'}</div>
                  {connectionStatus.error && (
                    <div className="text-red-500">Error: {connectionStatus.error}</div>
                  )}
                  {connectionStatus.lastConnected && (
                    <div>Last: {connectionStatus.lastConnected.toLocaleTimeString()}</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className={`${cardClass} border rounded-lg p-4 mt-4`}>
          <h3 className="font-semibold mb-3">Getting Started</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
            <div>
              <h4 className="font-medium mb-2">1. Connect</h4>
              <p className={darkMode ? 'text-gray-400' : 'text-gray-600'}>
                Click "Connect" to establish a WebSocket connection to the Claude service.
              </p>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">2. Start Session</h4>
              <p className={darkMode ? 'text-gray-400' : 'text-gray-600'}>
                Click "New Session" to begin a conversation with Claude.
              </p>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">3. Chat</h4>
              <p className={darkMode ? 'text-gray-400' : 'text-gray-600'}>
                Type your message and press Enter or click Send to chat with Claude.
              </p>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">4. Manage</h4>
              <p className={darkMode ? 'text-gray-400' : 'text-gray-600'}>
                Use the sidebar to browse, resume, export, or delete previous sessions.
              </p>
            </div>
          </div>
          
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <h4 className="font-medium mb-2">Keyboard Shortcuts</h4>
            <div className="flex flex-wrap gap-4 text-xs">
              <span><kbd className="px-1 py-0.5 bg-gray-200 dark:bg-gray-700 rounded">Ctrl+Enter</kbd> Send</span>
              <span><kbd className="px-1 py-0.5 bg-gray-200 dark:bg-gray-700 rounded">Ctrl+N</kbd> New Session</span>
              <span><kbd className="px-1 py-0.5 bg-gray-200 dark:bg-gray-700 rounded">Ctrl+B</kbd> Toggle Sidebar</span>
              <span><kbd className="px-1 py-0.5 bg-gray-200 dark:bg-gray-700 rounded">Shift+Esc</kbd> Disconnect</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClaudeDemo;