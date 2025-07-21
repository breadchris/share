import React, { useState, useMemo } from 'react';
import { ClaudeSession, SessionBrowserProps } from '../types';
import { formatRelativeTime, truncateText, generateSessionTitle } from '../utils/messageFormatting';

export const SessionBrowser: React.FC<SessionBrowserProps> = ({
  sessions,
  currentSessionId,
  selectedSessionId,
  loading,
  darkMode,
  isMobile = false,
  onSelectSession,
  onResumeSession,
  onNewSession,
  onDeleteSession,
  onExportSession,
  onClose,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'updated' | 'created' | 'title'>('updated');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  const filteredAndSortedSessions = useMemo(() => {
    let filtered = sessions;

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = sessions.filter(session => 
        session.title.toLowerCase().includes(query) ||
        session.session_id.toLowerCase().includes(query) ||
        session.messages.some(msg => 
          JSON.stringify(msg).toLowerCase().includes(query)
        )
      );
    }

    // Sort sessions
    return filtered.sort((a, b) => {
      switch (sortBy) {
        case 'title':
          return a.title.localeCompare(b.title);
        case 'created':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'updated':
        default:
          return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
      }
    });
  }, [sessions, searchQuery, sortBy]);

  const handleDeleteClick = (sessionId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    setShowDeleteConfirm(sessionId);
  };

  const handleConfirmDelete = (sessionId: string) => {
    onDeleteSession?.(sessionId);
    setShowDeleteConfirm(null);
  };

  const handleExportClick = (sessionId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    onExportSession?.(sessionId);
  };

  const handleSessionSelect = (sessionId: string) => {
    onSelectSession(sessionId);
    // Don't auto-close sidebar on mobile to allow resume action
  };

  const handleResumeSession = (sessionId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    onResumeSession(sessionId);
    // Auto-close sidebar on mobile after resuming
    if (isMobile && onClose) {
      onClose();
    }
  };

  const getSessionPreview = (session: ClaudeSession): string => {
    const lastMessage = session.messages[session.messages.length - 1];
    if (lastMessage?.type === 'assistant' && lastMessage.message) {
      try {
        const parsed = typeof lastMessage.message === 'string' 
          ? JSON.parse(lastMessage.message) 
          : lastMessage.message;
        return truncateText(parsed.content?.[0]?.text || '', 80);
      } catch {
        // Fallback to result or raw message
      }
    }
    if (lastMessage?.result) {
      return truncateText(lastMessage.result, 80);
    }
    return 'No preview available';
  };

  const bgClass = darkMode ? 'bg-gray-800' : 'bg-white';
  const textClass = darkMode ? 'text-white' : 'text-gray-900';
  const borderClass = darkMode ? 'border-gray-700' : 'border-gray-200';
  const inputBgClass = darkMode ? 'bg-gray-700' : 'bg-gray-50';
  const hoverClass = darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50';

  return (
    <div className={`flex flex-col h-full ${bgClass} ${textClass}`}>
      {/* Header */}
      <div className={`p-4 border-b ${borderClass}`}>
        <div className="flex items-center justify-between mb-4">
          <h2 className={`font-semibold ${isMobile ? 'text-base' : 'text-lg'}`}>Claude Sessions</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={onNewSession}
              className={`rounded text-white transition-colors
                ${isMobile ? 'px-2 py-1 text-sm' : 'px-3 py-1'}
                ${loading 
                  ? 'bg-gray-500 cursor-not-allowed' 
                  : 'bg-blue-500 hover:bg-blue-600 active:bg-blue-700'
                }
              `}
              disabled={loading}
              style={isMobile ? { minHeight: '36px' } : undefined}
            >
              {loading ? (
                <>
                  <span className="inline-block animate-spin mr-1">🔄</span>
                  {isMobile ? '...' : 'Creating...'}
                </>
              ) : (
                isMobile ? '+' : '+ New'
              )}
            </button>
            {isMobile && onClose && (
              <button
                onClick={onClose}
                className={`p-1 rounded transition-colors ${hoverClass}`}
                style={{ minHeight: '36px', minWidth: '36px' }}
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Search and sort */}
        <div className="space-y-2">
          <input
            type="text"
            placeholder="Search sessions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`w-full rounded border ${borderClass} ${inputBgClass} ${textClass}
              ${isMobile ? 'px-3 py-2 text-base' : 'px-3 py-2 text-sm'}
            `}
            style={isMobile ? { minHeight: '44px' } : undefined}
          />
          
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'updated' | 'created' | 'title')}
            className={`w-full rounded border ${borderClass} ${inputBgClass} ${textClass}
              ${isMobile ? 'px-3 py-2 text-base' : 'px-3 py-2 text-sm'}
            `}
            style={isMobile ? { minHeight: '44px' } : undefined}
          >
            <option value="updated">Sort by Last Updated</option>
            <option value="created">Sort by Created</option>
            <option value="title">Sort by Title</option>
          </select>
        </div>

        {/* Stats */}
        <div className={`mt-3 text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          {filteredAndSortedSessions.length} of {sessions.length} sessions
          {searchQuery && ` (filtered)`}
        </div>
      </div>

      {/* Session list */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500" />
            <span className="ml-2 text-sm">Loading sessions...</span>
          </div>
        ) : filteredAndSortedSessions.length === 0 ? (
          <div className={`text-center p-8 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            {searchQuery ? (
              <>
                <div className="text-4xl mb-3">🔍</div>
                <p>No sessions found matching "{searchQuery}"</p>
              </>
            ) : (
              <>
                <div className="text-4xl mb-3">💬</div>
                <p>No sessions yet</p>
                <p className="text-sm mt-1">Start a new conversation with Claude</p>
              </>
            )}
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {filteredAndSortedSessions.map((session) => {
              const isActive = session.session_id === currentSessionId;
              const isSelected = session.session_id === selectedSessionId;
              const messageCount = session.messages.length;
              const preview = getSessionPreview(session);

              return (
                <div
                  key={session.id}
                  onClick={() => handleSessionSelect(session.session_id)}
                  className={`cursor-pointer transition-colors relative group touch-manipulation
                    ${isMobile ? 'p-3' : 'p-4'}
                    ${isActive 
                      ? `${darkMode ? 'bg-blue-900' : 'bg-blue-50'} border-l-4 border-l-blue-500` 
                      : isSelected
                      ? `${darkMode ? 'bg-gray-700' : 'bg-gray-100'} border-l-2 border-l-gray-400`
                      : hoverClass
                    }
                  `}
                  style={isMobile ? { minHeight: '60px' } : undefined}
                >
                  {/* Session info */}
                  <div className="flex items-start justify-between mb-2">
                    <h3 className={`font-medium text-sm truncate pr-2 
                      ${isActive ? 'text-blue-600 dark:text-blue-400' : ''}
                    `}>
                      {session.title || generateSessionTitle(session.messages)}
                    </h3>
                    
                    <div className={`flex items-center gap-1 transition-opacity
                      ${isMobile ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}
                    `}>
                      {onExportSession && (
                        <button
                          onClick={(e) => handleExportClick(session.session_id, e)}
                          className={`rounded text-xs transition-colors
                            ${isMobile ? 'p-2' : 'p-1'}
                            ${darkMode ? 'hover:bg-gray-600 active:bg-gray-500' : 'hover:bg-gray-200 active:bg-gray-300'}
                          `}
                          title="Export session"
                          style={isMobile ? { minHeight: '36px', minWidth: '36px' } : undefined}
                        >
                          📤
                        </button>
                      )}
                      
                      {onDeleteSession && (
                        <button
                          onClick={(e) => handleDeleteClick(session.session_id, e)}
                          className={`rounded text-xs text-red-600 transition-colors
                            ${isMobile ? 'p-2' : 'p-1'}
                            ${darkMode ? 'hover:bg-red-900 active:bg-red-800' : 'hover:bg-red-100 active:bg-red-200'}
                          `}
                          title="Delete session"
                          style={isMobile ? { minHeight: '36px', minWidth: '36px' } : undefined}
                        >
                          🗑️
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Preview */}
                  <p className={`text-xs mb-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'} line-clamp-2`}>
                    {preview}
                  </p>

                  {/* Metadata */}
                  <div className={`flex items-center justify-between text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                    <span>{formatRelativeTime(session.updated_at)}</span>
                    <span>{messageCount} message{messageCount !== 1 ? 's' : ''}</span>
                  </div>

                  {/* Session ID (for debugging) */}
                  <div className={`text-xs mt-1 font-mono ${darkMode ? 'text-gray-600' : 'text-gray-400'}`}>
                    {session.session_id.slice(0, 8)}...
                  </div>

                  {/* Resume button - show when selected and not already active */}
                  {isSelected && !isActive && (
                    <div className="mt-3">
                      <button
                        onClick={(e) => handleResumeSession(session.session_id, e)}
                        className={`w-full px-3 py-2 rounded text-sm font-medium text-white transition-colors
                          ${loading 
                            ? 'bg-gray-500 cursor-not-allowed' 
                            : 'bg-blue-500 hover:bg-blue-600 active:bg-blue-700'
                          }
                        `}
                        disabled={loading}
                      >
                        {loading ? (
                          <>
                            <span className="inline-block animate-spin mr-2">🔄</span>
                            Resuming...
                          </>
                        ) : (
                          'Resume Session'
                        )}
                      </button>
                    </div>
                  )}

                  {/* Active session indicator */}
                  {isActive && (
                    <div className="mt-3">
                      <div className={`text-xs px-2 py-1 rounded text-center font-medium
                        ${darkMode ? 'bg-blue-800 text-blue-200' : 'bg-blue-100 text-blue-800'}
                      `}>
                        Active Session
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Delete confirmation modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className={`${bgClass} p-6 rounded-lg shadow-xl max-w-sm w-full mx-4`}>
            <h3 className="text-lg font-semibold mb-4">Delete Session</h3>
            <p className={`text-sm mb-6 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              Are you sure you want to delete this session? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className={`flex-1 px-4 py-2 rounded border ${borderClass} ${hoverClass} transition-colors`}
              >
                Cancel
              </button>
              <button
                onClick={() => handleConfirmDelete(showDeleteConfirm)}
                className="flex-1 px-4 py-2 rounded bg-red-500 text-white hover:bg-red-600 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};