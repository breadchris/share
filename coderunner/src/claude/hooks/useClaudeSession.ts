import { useState, useEffect, useCallback } from 'react';
import {
  ClaudeSession,
  UseClaudeSessionReturn,
  ClaudeError,
  ClaudeHookOptions,
} from '../types';

export const useClaudeSession = (
  options: ClaudeHookOptions = {}
): UseClaudeSessionReturn => {
  const { apiBaseUrl = '' } = options;

  const [sessions, setSessions] = useState<ClaudeSession[]>([]);
  const [currentSession, setCurrentSession] = useState<ClaudeSession | null>(null);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ClaudeError | null>(null);

  const getApiUrl = useCallback((endpoint: string) => {
    const baseUrl = apiBaseUrl || window.location.origin;
    return `${baseUrl}/coderunner/claude${endpoint}`;
  }, [apiBaseUrl]);

  const handleApiError = useCallback((error: any, type: ClaudeError['type'] = 'unknown') => {
    const claudeError: ClaudeError = {
      type,
      message: error.message || 'An error occurred',
      details: error,
      timestamp: new Date(),
    };
    setError(claudeError);
    console.error(`Claude ${type} error:`, error);
    return claudeError;
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const refreshSessions = useCallback(async () => {
    setLoading(true);
    clearError();

    try {
      const response = await fetch(getApiUrl('/sessions'), {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          // Redirect to login for authentication errors
          window.location.href = '/login';
          return;
        }
        throw new Error(`Failed to fetch sessions: ${response.statusText}`);
      }

      const sessionsData = await response.json();
      setSessions(Array.isArray(sessionsData) ? sessionsData : []);
    } catch (err) {
      handleApiError(err, 'session');
    } finally {
      setLoading(false);
    }
  }, [getApiUrl, handleApiError, clearError]);

  const createSession = useCallback(async (): Promise<string> => {
    setLoading(true);
    clearError();

    try {
      // Sessions are created via WebSocket, so we don't need an HTTP endpoint
      // Return a placeholder session ID that will be updated when the WebSocket connects
      const tempSessionId = `temp-${Date.now()}`;
      setCurrentSessionId(tempSessionId);
      return tempSessionId;
    } catch (err) {
      handleApiError(err, 'session');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [handleApiError, clearError]);

  const resumeSession = useCallback(async (sessionId: string) => {
    setLoading(true);
    clearError();

    try {
      const response = await fetch(getApiUrl(`/sessions/${sessionId}`), {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          window.location.href = '/login';
          return;
        }
        if (response.status === 404) {
          throw new Error('Session not found');
        }
        throw new Error(`Failed to resume session: ${response.statusText}`);
      }

      const sessionData = await response.json();
      setCurrentSession(sessionData);
      setCurrentSessionId(sessionId);
    } catch (err) {
      handleApiError(err, 'session');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [getApiUrl, handleApiError, clearError]);

  const deleteSession = useCallback(async (sessionId: string) => {
    setLoading(true);
    clearError();

    try {
      const response = await fetch(getApiUrl(`/sessions/${sessionId}`), {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          window.location.href = '/login';
          return;
        }
        if (response.status === 404) {
          throw new Error('Session not found');
        }
        throw new Error(`Failed to delete session: ${response.statusText}`);
      }

      // Remove from local state
      setSessions(prev => prev.filter(s => s.session_id !== sessionId));
      
      // Clear current session if it was deleted
      if (currentSessionId === sessionId) {
        setCurrentSession(null);
        setCurrentSessionId(null);
      }
    } catch (err) {
      handleApiError(err, 'session');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [getApiUrl, handleApiError, clearError, currentSessionId]);

  const updateSessionTitle = useCallback(async (sessionId: string, title: string) => {
    setLoading(true);
    clearError();

    try {
      const response = await fetch(getApiUrl(`/sessions/${sessionId}`), {
        method: 'PATCH',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title }),
      });

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          window.location.href = '/login';
          return;
        }
        if (response.status === 404) {
          throw new Error('Session not found');
        }
        throw new Error(`Failed to update session: ${response.statusText}`);
      }

      const updatedSession = await response.json();
      
      // Update local state
      setSessions(prev => 
        prev.map(s => s.session_id === sessionId ? updatedSession : s)
      );
      
      if (currentSessionId === sessionId) {
        setCurrentSession(updatedSession);
      }
    } catch (err) {
      handleApiError(err, 'session');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [getApiUrl, handleApiError, clearError, currentSessionId]);

  const exportSession = useCallback(async (sessionId: string): Promise<string> => {
    clearError();

    try {
      const session = sessions.find(s => s.session_id === sessionId);
      if (!session) {
        throw new Error('Session not found in local cache');
      }

      // Create export data
      const exportData = {
        session_id: session.session_id,
        title: session.title,
        created_at: session.created_at,
        updated_at: session.updated_at,
        messages: session.messages,
        exported_at: new Date().toISOString(),
      };

      return JSON.stringify(exportData, null, 2);
    } catch (err) {
      handleApiError(err, 'session');
      throw err;
    }
  }, [sessions, handleApiError, clearError]);

  // Load sessions on mount
  useEffect(() => {
    refreshSessions();
  }, [refreshSessions]);

  // Update current session when sessions change
  useEffect(() => {
    if (currentSessionId && sessions.length > 0) {
      const session = sessions.find(s => s.session_id === currentSessionId);
      if (session) {
        setCurrentSession(session);
      }
    }
  }, [sessions, currentSessionId]);

  return {
    sessions,
    currentSession,
    currentSessionId,
    loading,
    error,
    createSession,
    resumeSession,
    deleteSession,
    updateSessionTitle,
    exportSession,
    refreshSessions,
  };
};