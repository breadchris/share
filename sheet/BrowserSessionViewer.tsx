import React, { useState, useEffect } from 'react';
import { createSessionKVStore } from '../../../flow/supabase-kv';

interface ConsoleMessage {
  level: string;
  text: string;
  url: string;
  line: number;
  column: number;
  timestamp: string;
}

interface NetworkRequest {
  request_id: string;
  url: string;
  method: string;
  status: number;
  status_text: string;
  headers: Record<string, string>;
  response_time: number;
  size: number;
  failed: boolean;
  error_text: string;
  timestamp: string;
}

interface BrowserError {
  type: string;
  message: string;
  url: string;
  line: number;
  column: number;
  stack_trace: string;
  timestamp: string;
  metadata: Record<string, any>;
}

interface BrowserSession {
  id: string;
  url: string;
  start_time: string;
  end_time: string;
  console_messages: ConsoleMessage[];
  network_requests: NetworkRequest[];
  errors: BrowserError[];
  status: string;
  metadata: Record<string, any>;
}

export default function BrowserSessionViewer() {
  const [session, setSession] = useState<BrowserSession | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [url, setUrl] = useState('');
  const [savedSessions, setSavedSessions] = useState<string[]>([]);

  // Get current session ID from URL or generate one
  const sessionId = new URLSearchParams(window.location.search).get('sessionId') || 
                   window.location.pathname.split('/').pop() || 
                   'default-session';

  // Initialize KV store
  const kvStore = createSessionKVStore(sessionId);

  // Load saved sessions on component mount
  useEffect(() => {
    loadSavedSessions();
  }, []);

  const loadSavedSessions = async () => {
    try {
      const sessions = await kvStore.list({ namespace: 'browser_sessions' });
      setSavedSessions(sessions.map(s => s.key));
    } catch (error) {
      console.error('Failed to load saved sessions:', error);
    }
  };

  const runBrowserSession = async () => {
    if (!url.trim()) {
      setError('Please enter a URL');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Make request to the browser API
      const response = await fetch('/browser/session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: url,
          config: {
            headless: true,
            timeout: 30000000000, // 30 seconds in nanoseconds
            viewport_width: 1920,
            viewport_height: 1080
          }
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const sessionData: BrowserSession = await response.json();
      setSession(sessionData);

      // Save session to KV store
      await kvStore.set('browser_sessions', sessionData.id, sessionData);
      
      // Update saved sessions list
      await loadSavedSessions();

    } catch (error) {
      setError(`Failed to run browser session: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const loadSavedSession = async (sessionKey: string) => {
    try {
      const sessionData = await kvStore.get<BrowserSession>('browser_sessions', sessionKey);
      if (sessionData) {
        setSession(sessionData);
      }
    } catch (error) {
      setError(`Failed to load saved session: ${error.message}`);
    }
  };

  const deleteSavedSession = async (sessionKey: string) => {
    try {
      await kvStore.delete('browser_sessions', sessionKey);
      await loadSavedSessions();
      if (session?.id === sessionKey) {
        setSession(null);
      }
    } catch (error) {
      setError(`Failed to delete session: ${error.message}`);
    }
  };

  const getErrorTypeColor = (type: string) => {
    switch (type) {
      case 'console_error':
      case 'console_api_error':
        return 'text-red-600';
      case 'network_error':
      case 'network_failure':
        return 'text-orange-600';
      case 'runtime_exception':
        return 'text-purple-600';
      default:
        return 'text-gray-600';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-600';
      case 'failed':
        return 'text-red-600';
      case 'running':
        return 'text-blue-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Browser Session Analyzer</h1>
        
        {/* URL Input Section */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Analyze URL</h2>
          <div className="flex gap-4">
            <input
              type="url"
              placeholder="Enter URL to analyze (e.g., https://example.com)"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button
              onClick={runBrowserSession}
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                  Analyzing...
                </>
              ) : (
                'Analyze'
              )}
            </button>
          </div>
        </div>

        {/* Saved Sessions Section */}
        {savedSessions.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Saved Sessions</h2>
            <div className="space-y-2">
              {savedSessions.map((sessionKey) => (
                <div key={sessionKey} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="font-mono text-sm text-gray-600">{sessionKey}</span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => loadSavedSession(sessionKey)}
                      className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                    >
                      Load
                    </button>
                    <button
                      onClick={() => deleteSavedSession(sessionKey)}
                      className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <div className="text-red-600 mr-3">⚠️</div>
              <div className="text-red-700">{error}</div>
            </div>
          </div>
        )}

        {/* Session Results */}
        {session && (
          <div className="space-y-6">
            {/* Session Overview */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold mb-4">Session Overview</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="text-sm text-gray-600">Status</div>
                  <div className={`font-semibold ${getStatusColor(session.status)}`}>
                    {session.status}
                  </div>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="text-sm text-gray-600">Total Errors</div>
                  <div className="text-2xl font-bold text-red-600">{session.errors.length}</div>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="text-sm text-gray-600">Network Requests</div>
                  <div className="text-2xl font-bold text-blue-600">{session.network_requests.length}</div>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="text-sm text-gray-600">Console Messages</div>
                  <div className="text-2xl font-bold text-green-600">{session.console_messages.length}</div>
                </div>
              </div>
              
              <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                <div className="text-sm text-gray-600">Target URL</div>
                <div className="font-mono text-blue-700 break-all">{session.url}</div>
              </div>
            </div>

            {/* Errors Section */}
            {session.errors.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-semibold mb-4 text-red-600">Errors Detected</h2>
                <div className="space-y-4">
                  {session.errors.map((error, index) => (
                    <div key={index} className="p-4 bg-red-50 border border-red-200 rounded-lg">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className={`px-2 py-1 text-xs rounded font-semibold ${getErrorTypeColor(error.type)}`}>
                              {error.type}
                            </span>
                            <span className="text-sm text-gray-500">
                              {new Date(error.timestamp).toLocaleTimeString()}
                            </span>
                          </div>
                          <div className="text-red-800 font-semibold mb-2">{error.message}</div>
                          {error.url && (
                            <div className="text-sm text-gray-600 mb-1">
                              <strong>URL:</strong> {error.url}
                            </div>
                          )}
                          {error.line > 0 && (
                            <div className="text-sm text-gray-600 mb-1">
                              <strong>Location:</strong> Line {error.line}, Column {error.column}
                            </div>
                          )}
                          {error.stack_trace && (
                            <details className="mt-2">
                              <summary className="cursor-pointer text-sm text-gray-600 hover:text-gray-800">
                                Stack Trace
                              </summary>
                              <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-x-auto">
                                {error.stack_trace}
                              </pre>
                            </details>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Network Requests Section */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold mb-4">Network Requests</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Method</th>
                      <th className="text-left p-2">URL</th>
                      <th className="text-left p-2">Status</th>
                      <th className="text-left p-2">Size</th>
                      <th className="text-left p-2">Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {session.network_requests.map((request, index) => (
                      <tr key={index} className={`border-b ${request.failed ? 'bg-red-50' : ''}`}>
                        <td className="p-2 font-mono">{request.method}</td>
                        <td className="p-2 font-mono text-blue-600 truncate max-w-xs" title={request.url}>
                          {request.url}
                        </td>
                        <td className="p-2">
                          <span className={`px-2 py-1 rounded text-xs ${
                            request.status >= 400 ? 'bg-red-100 text-red-800' :
                            request.status >= 300 ? 'bg-yellow-100 text-yellow-800' :
                            'bg-green-100 text-green-800'
                          }`}>
                            {request.status || 'Failed'}
                          </span>
                        </td>
                        <td className="p-2">{request.size ? `${(request.size / 1024).toFixed(1)}KB` : '-'}</td>
                        <td className="p-2">{request.response_time ? `${request.response_time}ms` : '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Console Messages Section */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold mb-4">Console Messages</h2>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {session.console_messages.map((message, index) => (
                  <div key={index} className={`p-3 rounded-lg ${
                    message.level === 'error' ? 'bg-red-50' :
                    message.level === 'warning' ? 'bg-yellow-50' :
                    'bg-gray-50'
                  }`}>
                    <div className="flex items-start gap-2">
                      <span className={`px-2 py-1 text-xs rounded font-semibold ${
                        message.level === 'error' ? 'text-red-600' :
                        message.level === 'warning' ? 'text-yellow-600' :
                        'text-gray-600'
                      }`}>
                        {message.level}
                      </span>
                      <div className="flex-1">
                        <div className="font-mono text-sm">{message.text}</div>
                        {message.url && (
                          <div className="text-xs text-gray-500 mt-1">
                            {message.url}:{message.line}:{message.column}
                          </div>
                        )}
                      </div>
                      <span className="text-xs text-gray-500">
                        {new Date(message.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}