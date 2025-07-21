import { useState, useEffect, useCallback } from 'react';
import {
  ClaudeSession,
  UseClaudeSessionReturn,
  ClaudeError,
  ClaudeHookOptions,
} from '../types';
import { createClaudeSessionClient, ClaudeSessionServiceClient } from '../services/claudeSessionClient';

export const useClaudeSession = (
  options: ClaudeHookOptions = {}
): UseClaudeSessionReturn => {
  const { apiBaseUrl = '' } = options;

  const [sessions, setSessions] = useState<ClaudeSession[]>([]);
  const [currentSession, setCurrentSession] = useState<ClaudeSession | null>(null);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ClaudeError | null>(null);

  // Create Connect client instance
  const client = useCallback(() => {
    return createClaudeSessionClient(apiBaseUrl);
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
      const response = await client().getSessions({});
      setSessions(response.sessions);
    } catch (err) {
      handleApiError(err, 'session');
    } finally {
      setLoading(false);
    }
  }, [client, handleApiError, clearError]);

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
      const response = await client().getSession({ session_id: sessionId });
      setCurrentSession(response.session);
      setCurrentSessionId(sessionId);
    } catch (err) {
      handleApiError(err, 'session');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [client, handleApiError, clearError]);

  const deleteSession = useCallback(async (sessionId: string) => {
    setLoading(true);
    clearError();

    try {
      await client().deleteSession({ session_id: sessionId });
      
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
  }, [client, handleApiError, clearError, currentSessionId]);

  const updateSessionTitle = useCallback(async (sessionId: string, title: string) => {
    setLoading(true);
    clearError();

    try {
      const response = await client().updateSession({ 
        session_id: sessionId, 
        title 
      });
      
      // Update local state
      setSessions(prev => 
        prev.map(s => s.session_id === sessionId ? response.session : s)
      );
      
      if (currentSessionId === sessionId) {
        setCurrentSession(response.session);
      }
    } catch (err) {
      handleApiError(err, 'session');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [client, handleApiError, clearError, currentSessionId]);

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