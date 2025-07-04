import React, { useEffect, useRef, useState } from 'react';
import { ClaudeMessage, MessageDisplayProps } from '../types';
import {
  getMessageDisplayText,
  getMessageType,
  formatTimestamp,
  formatRelativeTime,
  shouldShowTimestamp,
  highlightCodeBlocks,
  copyToClipboard,
  formatUsageStats,
  shouldCondenseMessage,
  getCondensedMessagePreview,
  getMessageTypeLabel,
} from '../utils/messageFormatting';

const MessageDisplay: React.FC<MessageDisplayProps> = ({ 
  message, 
  index, 
  darkMode, 
  onCopy, 
  isMobile = false, 
  isTouchDevice = false,
  allMessages = [],
  isCondensed = false,
  onToggleExpand
}) => {
  const [copied, setCopied] = useState(false);
  const messageType = getMessageType(message);
  const displayText = getMessageDisplayText(message);
  
  // Determine if this message should be condensed (only in mobile)
  const shouldCondense = isMobile && shouldCondenseMessage(message, index, allMessages);
  const actuallyCondensed = shouldCondense && (isCondensed ?? true);

  const handleCopy = async () => {
    const success = await copyToClipboard(displayText);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      onCopy?.(displayText);
    }
  };

  const getMessageStyles = () => {
    const baseStyles = `rounded-lg border-l-4 relative group transition-all duration-200 ${
      isMobile ? (actuallyCondensed ? 'p-2 min-w-0 overflow-hidden' : 'p-3 min-w-0 overflow-hidden') : 'p-4'
    }`;
    const darkBg = darkMode ? 'bg-gray-800' : 'bg-gray-50';
    const lightBg = darkMode ? 'bg-gray-700' : 'bg-white';
    const textColor = darkMode ? 'text-white' : 'text-gray-900';
    
    // Different styling for condensed messages
    if (actuallyCondensed) {
      const condensedBg = darkMode ? 'bg-gray-750' : 'bg-gray-100';
      return `${baseStyles} ${condensedBg} ${textColor} border-l-gray-400 opacity-80 cursor-pointer hover:opacity-100`;
    }

    switch (messageType) {
      case 'assistant':
        return `${baseStyles} ${lightBg} ${textColor} border-l-blue-500`;
      case 'system':
        return `${baseStyles} ${darkBg} ${textColor} border-l-gray-500`;
      case 'error':
        return `${baseStyles} bg-red-50 ${darkMode ? 'bg-red-900' : ''} ${textColor} border-l-red-500`;
      case 'result':
        return `${baseStyles} bg-green-50 ${darkMode ? 'bg-green-900' : ''} ${textColor} border-l-green-500`;
      default:
        return `${baseStyles} ${darkBg} ${textColor} border-l-gray-400`;
    }
  };

  const getMessageIcon = () => {
    switch (messageType) {
      case 'assistant':
        return '🤖';
      case 'system':
        return '⚙️';
      case 'error':
        return '❌';
      case 'result':
        return '✅';
      default:
        return '💬';
    }
  };

  const getMessageLabel = () => {
    return getMessageTypeLabel(message);
  };

  const renderContent = () => {
    // If condensed, show preview with expand option
    if (actuallyCondensed) {
      const preview = getCondensedMessagePreview(message, isMobile ? 40 : 60);
      return (
        <div className="flex items-center justify-between">
          <div className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'} truncate flex-1`}>
            {preview}
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleExpand?.();
            }}
            className={`ml-2 px-2 py-1 text-xs rounded transition-colors flex-shrink-0
              ${darkMode ? 'bg-gray-600 hover:bg-gray-500 text-gray-200' : 'bg-gray-200 hover:bg-gray-300 text-gray-700'}
            `}
            style={{ minHeight: isMobile ? '32px' : '24px' }}
          >
            Show more
          </button>
        </div>
      );
    }

    // Full content rendering
    if (messageType === 'assistant') {
      // Enhanced rendering for assistant messages
      const htmlContent = highlightCodeBlocks(displayText);
      return (
        <div 
          className={`prose prose-sm max-w-none ${isMobile ? 'break-words overflow-hidden' : ''}`}
          dangerouslySetInnerHTML={{ __html: htmlContent }}
          style={isMobile ? { 
            overflowWrap: 'break-word',
            wordBreak: 'break-word',
            maxWidth: '100%'
          } : {}}
        />
      );
    }

    // For other message types, render as plain text with basic formatting
    return (
      <div className={`whitespace-pre-wrap font-mono text-sm ${isMobile ? 'break-words overflow-x-auto' : ''}`}
           style={isMobile ? { 
             overflowWrap: 'break-word',
             wordBreak: 'break-word',
             maxWidth: '100%'
           } : {}}>
        {displayText}
      </div>
    );
  };

  const renderUsageInfo = () => {
    if (message.type === 'assistant' && message.message) {
      try {
        const parsed = typeof message.message === 'string' ? JSON.parse(message.message) : message.message;
        const usage = parsed.usage;
        const usageText = formatUsageStats(usage);
        
        if (usageText) {
          return (
            <div className={`text-xs mt-2 opacity-60 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              {usageText}
            </div>
          );
        }
      } catch {
        // Ignore parsing errors
      }
    }
    return null;
  };

  return (
    <div 
      className={getMessageStyles()}
      onClick={actuallyCondensed ? onToggleExpand : undefined}
    >
      {/* Copy button - hide for condensed messages */}
      {!actuallyCondensed && (
        <button
          onClick={handleCopy}
          className={`absolute top-2 right-2 transition-opacity font-medium touch-manipulation
            ${isMobile || isTouchDevice 
              ? 'opacity-100 p-2 text-sm' 
              : 'opacity-0 group-hover:opacity-100 px-2 py-1 text-xs'
            }
            rounded 
            ${darkMode ? 'bg-gray-600 text-white' : 'bg-gray-200 text-gray-700'}
            ${isTouchDevice 
              ? `${darkMode ? 'active:bg-gray-500' : 'active:bg-gray-300'}`
              : `${darkMode ? 'hover:bg-gray-500' : 'hover:bg-gray-300'}`
            }
          `}
          title="Copy message"
          style={isMobile ? { minHeight: '36px', minWidth: '36px' } : undefined}
        >
          {copied ? '✓' : '📋'}
        </button>
      )}

      {/* Message header */}
      <div className={`flex items-center gap-2 ${actuallyCondensed ? 'mb-1' : 'mb-2'}`}>
        <span className={actuallyCondensed ? 'text-base' : 'text-lg'}>{getMessageIcon()}</span>
        <span className={`font-semibold ${actuallyCondensed ? 'text-xs' : 'text-sm'} ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
          {getMessageLabel()}
        </span>
        {message.timestamp && !actuallyCondensed && (
          <span className={`text-xs ml-auto ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            {formatRelativeTime(message.timestamp)}
          </span>
        )}
        {actuallyCondensed && (
          <span className={`text-xs ml-auto ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
            Tap to expand
          </span>
        )}
      </div>

      {/* Message content */}
      <div className="message-content">
        {renderContent()}
      </div>

      {/* Usage info for assistant messages - hide for condensed */}
      {!actuallyCondensed && renderUsageInfo()}

      {/* Session ID for system messages - hide for condensed */}
      {!actuallyCondensed && message.type === 'system' && message.session_id && (
        <div className={`text-xs mt-2 opacity-60 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          Session: {message.session_id.slice(0, 8)}...
        </div>
      )}
    </div>
  );
};

interface MessageListProps {
  messages: ClaudeMessage[];
  loading?: boolean;
  darkMode?: boolean;
  autoScroll?: boolean;
  maxHeight?: string;
  onCopyMessage?: (text: string) => void;
  isMobile?: boolean;
  isTouchDevice?: boolean;
  onStartNewSession?: () => void;
  isConnected?: boolean;
  hasActiveSession?: boolean;
}

export const MessageList: React.FC<MessageListProps> = ({
  messages,
  loading = false,
  darkMode = false,
  autoScroll = true,
  maxHeight = 'calc(100vh - 200px)',
  onCopyMessage,
  isMobile = false,
  isTouchDevice = false,
  onStartNewSession,
  isConnected = false,
  hasActiveSession = false,
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [userScrolled, setUserScrolled] = useState(false);
  const [expandedMessages, setExpandedMessages] = useState<Set<number>>(new Set());

  const scrollToBottom = () => {
    if (autoScroll && !userScrolled) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleScroll = () => {
    if (containerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
      const isAtBottom = scrollTop + clientHeight >= scrollHeight - 10;
      setUserScrolled(!isAtBottom);
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleToggleExpand = (messageIndex: number) => {
    setExpandedMessages(prev => {
      const newSet = new Set(prev);
      if (newSet.has(messageIndex)) {
        newSet.delete(messageIndex);
      } else {
        newSet.add(messageIndex);
      }
      return newSet;
    });
  };

  const renderEmptyState = () => {
    if (!isConnected) {
      return (
        <div className={`flex flex-col items-center justify-center h-full text-center p-8
          ${darkMode ? 'text-gray-400' : 'text-gray-500'}
        `}>
          <div className="text-6xl mb-4">🔌</div>
          <h3 className="text-lg font-semibold mb-2">Connect to Claude</h3>
          <p className="text-sm mb-4">
            Click the "Connect" button in the top right to establish a connection with Claude.
          </p>
        </div>
      );
    }

    if (!hasActiveSession) {
      return (
        <div className={`flex flex-col items-center justify-center h-full text-center p-8
          ${darkMode ? 'text-gray-400' : 'text-gray-500'}
        `}>
          <div className="text-6xl mb-6">🤖</div>
          <h3 className="text-xl font-semibold mb-3">Start a New Session with Claude</h3>
          <p className="text-sm mb-6 max-w-md">
            Begin a new conversation with Claude by clicking the button below. You can also resume a previous session from the sidebar.
          </p>
          
          {onStartNewSession && (
            <button
              onClick={onStartNewSession}
              className={`rounded-lg font-medium transition-all transform active:scale-95
                ${isMobile 
                  ? 'px-6 py-4 text-base bg-blue-500 text-white shadow-lg hover:bg-blue-600 active:bg-blue-700' 
                  : 'px-8 py-3 text-lg bg-blue-500 text-white shadow-lg hover:bg-blue-600 hover:scale-105 active:bg-blue-700'
                }
              `}
              style={isMobile ? { minHeight: '56px' } : undefined}
            >
              <span className="mr-2">✨</span>
              Start New Session with Claude
            </button>
          )}

          <div className={`mt-6 text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'} max-w-sm`}>
            💡 You can also press <kbd className={`px-1 rounded ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`}>Ctrl+N</kbd> (or <kbd className={`px-1 rounded ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`}>⌘+N</kbd> on Mac) to start a new session
          </div>
        </div>
      );
    }

    return (
      <div className={`flex flex-col items-center justify-center h-full text-center p-8
        ${darkMode ? 'text-gray-400' : 'text-gray-500'}
      `}>
        <div className="text-6xl mb-4">💬</div>
        <h3 className="text-lg font-semibold mb-2">Session Ready</h3>
        <p className="text-sm">
          Type your message below to start chatting with Claude!
        </p>
      </div>
    );
  };

  const renderLoadingIndicator = () => {
    // Different loading messages based on context
    const getLoadingMessage = () => {
      if (!hasActiveSession && loading) {
        return {
          icon: '🔄',
          title: 'Creating new session...',
          description: 'Initializing conversation with Claude'
        };
      }
      return {
        icon: '💭',
        title: 'Claude is thinking...',
        description: 'Generating response'
      };
    };

    const loadingInfo = getLoadingMessage();

    return (
      <div className={`flex items-center gap-3 p-4 rounded-lg border-l-4 border-l-blue-500
        ${darkMode ? 'bg-gray-700 text-white' : 'bg-white text-gray-900'}
      `}>
        <div className="flex items-center gap-3">
          <div className="relative">
            <span className="text-2xl animate-spin">{loadingInfo.icon}</span>
          </div>
          <div>
            <div className="text-sm font-medium">{loadingInfo.title}</div>
            <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              {loadingInfo.description}
            </div>
          </div>
        </div>
        <div className="flex space-x-1 ml-auto">
          <div className={`w-2 h-2 rounded-full animate-bounce ${darkMode ? 'bg-blue-400' : 'bg-blue-500'}`} />
          <div className={`w-2 h-2 rounded-full animate-bounce delay-75 ${darkMode ? 'bg-blue-400' : 'bg-blue-500'}`} />
          <div className={`w-2 h-2 rounded-full animate-bounce delay-150 ${darkMode ? 'bg-blue-400' : 'bg-blue-500'}`} />
        </div>
      </div>
    );
  };

  const groupedMessages = messages.reduce((groups, message, index) => {
    const previousMessage = index > 0 ? messages[index - 1] : undefined;
    const showTimestamp = shouldShowTimestamp(message, previousMessage);
    
    if (showTimestamp && message.timestamp) {
      groups.push({
        type: 'timestamp',
        timestamp: message.timestamp,
        message: null,
        index,
      });
    }
    
    groups.push({
      type: 'message',
      message,
      index,
      timestamp: null,
    });
    
    return groups;
  }, [] as Array<{ type: 'message' | 'timestamp'; message: ClaudeMessage | null; timestamp: string | null; index: number }>);

  return (
    <div 
      ref={containerRef}
      className={`flex-1 overflow-y-auto space-y-4 ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}
        ${isMobile ? 'p-3 min-w-0' : 'p-4'}
      `}
      style={{ 
        maxHeight,
        ...(isMobile ? { 
          overflowWrap: 'break-word',
          wordBreak: 'break-word'
        } : {})
      }}
      onScroll={handleScroll}
    >
      {messages.length === 0 && !loading ? (
        renderEmptyState()
      ) : (
        <>
          {groupedMessages.map((item, index) => {
            if (item.type === 'timestamp') {
              return (
                <div key={`timestamp-${index}`} className="flex justify-center">
                  <div className={`px-3 py-1 rounded-full text-xs
                    ${darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-600'}
                  `}>
                    {formatTimestamp(item.timestamp)}
                  </div>
                </div>
              );
            }
            
            return item.message ? (
              <MessageDisplay
                key={`message-${item.index}`}
                message={item.message}
                index={item.index}
                darkMode={darkMode}
                isMobile={isMobile}
                isTouchDevice={isTouchDevice}
                onCopy={onCopyMessage}
                allMessages={messages}
                isCondensed={!expandedMessages.has(item.index)}
                onToggleExpand={() => handleToggleExpand(item.index)}
              />
            ) : null;
          })}
          
          {loading && renderLoadingIndicator()}
          
          <div ref={messagesEndRef} />
        </>
      )}

      {/* Scroll to bottom button */}
      {userScrolled && messages.length > 0 && (
        <button
          onClick={() => {
            setUserScrolled(false);
            scrollToBottom();
          }}
          className={`fixed rounded-full shadow-lg transition-all touch-manipulation
            ${isMobile 
              ? 'bottom-24 right-4 p-4 text-lg' 
              : 'bottom-20 right-6 p-3'
            }
            ${darkMode ? 'bg-blue-600 text-white' : 'bg-blue-500 text-white'}
            ${isTouchDevice 
              ? `${darkMode ? 'active:bg-blue-700' : 'active:bg-blue-600'} active:scale-95`
              : `${darkMode ? 'hover:bg-blue-700' : 'hover:bg-blue-600'} hover:scale-110`
            }
          `}
          title="Scroll to bottom"
          style={isMobile ? { minHeight: '56px', minWidth: '56px' } : undefined}
        >
          ↓
        </button>
      )}
    </div>
  );
};