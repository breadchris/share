import React, { useState, useEffect, useRef } from 'react';

interface ClaudeMessage {
  type: string;
  subtype?: string;
  message?: any;
  session_id?: string;
  parent_tool_use_id?: string;
  result?: string;
  is_error?: boolean;
}

interface ClaudeSession {
  id: string;
  session_id: string;
  title: string;
  created_at: string;
  updated_at: string;
  messages: ClaudeMessage[];
}

interface WSMessage {
  type: string;
  payload: any;
}

interface ClaudeInterfaceProps {
  darkMode?: boolean;
}

export default function ClaudeInterface({ darkMode = true }: ClaudeInterfaceProps) {
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [connected, setConnected] = useState(false);
  const [messages, setMessages] = useState<ClaudeMessage[]>([]);
  const [input, setInput] = useState('');
  const [sessions, setSessions] = useState<ClaudeSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [showSessions, setShowSessions] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    try {
      const response = await fetch('/coderunner/claude/sessions');
      if (response.ok) {
        const sessionsData = await response.json();
        setSessions(sessionsData || []);
      }
    } catch (error) {
      console.error('Failed to load sessions:', error);
    }
  };

  const connectWebSocket = () => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/coderunner/claude/ws`;
    
    const websocket = new WebSocket(wsUrl);
    
    websocket.onopen = () => {
      console.log('Connected to Claude WebSocket');
      setConnected(true);
      setWs(websocket);
    };
    
    websocket.onmessage = (event) => {
      try {
        const wsMessage: WSMessage = JSON.parse(event.data);
        
        switch (wsMessage.type) {
          case 'message':
            const claudeMessage = wsMessage.payload as ClaudeMessage;
            setMessages(prev => [...prev, claudeMessage]);
            
            // Update current session ID from init message
            if (claudeMessage.type === 'system' && claudeMessage.subtype === 'init') {
              setCurrentSessionId(claudeMessage.session_id || '');
            }
            break;
            
          case 'error':
            console.error('Claude error:', wsMessage.payload);
            break;
        }
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error);
      }
    };
    
    websocket.onclose = () => {
      console.log('Disconnected from Claude WebSocket');
      setConnected(false);
      setWs(null);
    };
    
    websocket.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
  };

  const startNewSession = () => {
    if (!ws) return;
    
    setMessages([]);
    setCurrentSessionId('');
    setLoading(true);
    
    ws.send(JSON.stringify({
      type: 'start',
      payload: {}
    }));
    
    setTimeout(() => setLoading(false), 1000);
  };

  const resumeSession = (sessionId: string) => {
    if (!ws) return;
    
    setMessages([]);
    setCurrentSessionId(sessionId);
    setLoading(true);
    
    ws.send(JSON.stringify({
      type: 'resume',
      payload: { sessionId }
    }));
    
    setTimeout(() => setLoading(false), 1000);
    setShowSessions(false);
  };

  const sendPrompt = () => {
    if (!ws || !input.trim()) return;
    
    setLoading(true);
    
    ws.send(JSON.stringify({
      type: 'prompt',
      payload: { prompt: input.trim() }
    }));
    
    setInput('');
    setTimeout(() => setLoading(false), 500);
  };

  const stopSession = () => {
    if (!ws) return;
    
    ws.send(JSON.stringify({
      type: 'stop',
      payload: {}
    }));
    
    setMessages([]);
    setCurrentSessionId('');
    loadSessions();
  };

  const renderMessage = (message: ClaudeMessage, index: number) => {
    const bgColor = darkMode ? 'bg-gray-800' : 'bg-gray-100';
    const textColor = darkMode ? 'text-white' : 'text-gray-900';
    
    switch (message.type) {
      case 'system':
        if (message.subtype === 'init') {
          return (
            <div key={index} className={`p-3 rounded-lg ${bgColor} border-l-4 border-blue-500`}>
              <div className={`text-sm ${textColor} opacity-75`}>
                Session initialized: {message.session_id}
              </div>
            </div>
          );
        }
        break;
        
      case 'assistant':
        try {
          const assistantMessage = message.message ? JSON.parse(message.message.toString()) : null;
          const content = assistantMessage?.content?.[0]?.text || 'No content';
          
          return (
            <div key={index} className={`p-4 rounded-lg ${bgColor}`}>
              <div className={`text-sm ${textColor} opacity-75 mb-2`}>Claude</div>
              <div className={`${textColor} whitespace-pre-wrap`}>{content}</div>
            </div>
          );
        } catch (error) {
          return (
            <div key={index} className={`p-4 rounded-lg ${bgColor}`}>
              <div className={`text-sm ${textColor} opacity-75 mb-2`}>Claude (Raw)</div>
              <div className={`${textColor} text-sm font-mono`}>
                {JSON.stringify(message.message, null, 2)}
              </div>
            </div>
          );
        }
        
      case 'result':
        return (
          <div key={index} className={`p-3 rounded-lg ${bgColor} border-l-4 ${message.is_error ? 'border-red-500' : 'border-green-500'}`}>
            <div className={`text-sm ${textColor} opacity-75 mb-1`}>
              {message.is_error ? 'Error' : 'Result'}
            </div>
            <div className={`${textColor} text-sm`}>{message.result}</div>
          </div>
        );
        
      default:
        return (
          <div key={index} className={`p-3 rounded-lg ${bgColor} border-l-4 border-gray-500`}>
            <div className={`text-sm ${textColor} opacity-75 mb-1`}>
              {message.type} {message.subtype && `(${message.subtype})`}
            </div>
            <div className={`${textColor} text-sm font-mono`}>
              {JSON.stringify(message, null, 2)}
            </div>
          </div>
        );
    }
  };

  const bgClass = darkMode ? 'bg-gray-900' : 'bg-white';
  const textClass = darkMode ? 'text-white' : 'text-gray-900';
  const borderClass = darkMode ? 'border-gray-700' : 'border-gray-300';
  const inputBgClass = darkMode ? 'bg-gray-800' : 'bg-gray-50';

  return (
    <div className={`flex flex-col h-screen ${bgClass} ${textClass}`}>
      {/* Header */}
      <div className={`flex items-center justify-between p-4 border-b ${borderClass}`}>
        <div className="flex items-center space-x-4">
          <h1 className="text-xl font-bold">Claude Interface</h1>
          <div className={`px-2 py-1 rounded text-xs ${connected ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>
            {connected ? 'Connected' : 'Disconnected'}
          </div>
          {currentSessionId && (
            <div className={`px-2 py-1 rounded text-xs ${inputBgClass}`}>
              Session: {currentSessionId.slice(0, 8)}...
            </div>
          )}
        </div>
        
        <div className="flex space-x-2">
          <button
            onClick={() => setShowSessions(!showSessions)}
            className={`px-3 py-1 rounded text-sm border ${borderClass} hover:bg-gray-600`}
          >
            Sessions ({sessions.length})
          </button>
          
          {!connected ? (
            <button
              onClick={connectWebSocket}
              className="px-3 py-1 rounded text-sm bg-blue-500 text-white hover:bg-blue-600"
            >
              Connect
            </button>
          ) : (
            <>
              <button
                onClick={startNewSession}
                disabled={loading}
                className="px-3 py-1 rounded text-sm bg-green-500 text-white hover:bg-green-600 disabled:opacity-50"
              >
                {loading ? 'Starting...' : 'New Session'}
              </button>
              
              {currentSessionId && (
                <button
                  onClick={stopSession}
                  className="px-3 py-1 rounded text-sm bg-red-500 text-white hover:bg-red-600"
                >
                  Stop
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Sessions List */}
      {showSessions && (
        <div className={`p-4 border-b ${borderClass} max-h-48 overflow-y-auto`}>
          <h3 className="font-semibold mb-2">Previous Sessions</h3>
          {sessions.length === 0 ? (
            <div className="text-gray-500 text-sm">No sessions found</div>
          ) : (
            <div className="space-y-2">
              {sessions.map((session) => (
                <div
                  key={session.id}
                  className={`p-2 rounded border ${borderClass} cursor-pointer hover:bg-gray-600`}
                  onClick={() => resumeSession(session.session_id)}
                >
                  <div className="font-medium">{session.title}</div>
                  <div className="text-xs opacity-75">
                    {new Date(session.updated_at).toLocaleString()} • {session.session_id.slice(0, 8)}...
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 mt-8">
            {connected ? 
              (currentSessionId ? 'Session ready. Send a message to start.' : 'Start a new session to begin chatting with Claude.') :
              'Connect to start using Claude.'
            }
          </div>
        ) : (
          messages.map((message, index) => renderMessage(message, index))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className={`p-4 border-t ${borderClass}`}>
        <div className="flex space-x-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && sendPrompt()}
            placeholder={connected && currentSessionId ? "Ask Claude anything..." : "Start a session first"}
            disabled={!connected || !currentSessionId || loading}
            className={`flex-1 p-2 rounded border ${borderClass} ${inputBgClass} disabled:opacity-50`}
          />
          <button
            onClick={sendPrompt}
            disabled={!connected || !currentSessionId || !input.trim() || loading}
            className="px-4 py-2 rounded bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-50"
          >
            {loading ? 'Sending...' : 'Send'}
          </button>
        </div>
      </div>
    </div>
  );
}