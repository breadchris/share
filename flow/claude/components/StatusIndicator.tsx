import React from 'react';
import { StatusIndicatorProps } from '../types';

export const StatusIndicator: React.FC<StatusIndicatorProps> = ({
  status,
  currentSessionId,
  darkMode,
  compact = false,
  isMobile = false,
  sessionLoading = false,
}) => {
  const getStatusColor = () => {
    if (status.error) return 'text-red-500';
    if (sessionLoading) return 'text-blue-500';
    if (status.connected) return 'text-green-500';
    if (status.connecting) return 'text-yellow-500';
    return 'text-gray-500';
  };

  const getStatusIcon = () => {
    if (status.error) return '❌';
    if (sessionLoading) return '🔄';
    if (status.connected) return '🟢';
    if (status.connecting) return '🟡';
    return '⚫';
  };

  const getStatusText = () => {
    if (status.error) return 'Error';
    if (sessionLoading) return 'Creating Session...';
    if (status.connected) return 'Connected';
    if (status.connecting) return 'Connecting...';
    return 'Disconnected';
  };

  const getStatusDescription = () => {
    if (status.error) return status.error;
    if (sessionLoading) return 'Setting up new conversation with Claude';
    if (status.connected) return currentSessionId ? 'Session active, ready to chat' : 'Ready to start a new session';
    if (status.connecting) return 'Establishing connection...';
    return 'Click connect to start';
  };

  if (compact) {
    return (
      <div className={`flex items-center ${isMobile ? 'gap-1' : 'gap-2'} ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
        <span className={getStatusColor()}>{getStatusIcon()}</span>
        <span className={`${isMobile ? 'text-xs' : 'text-sm'}`}>{getStatusText()}</span>
        {currentSessionId && !isMobile && (
          <span className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
            • {currentSessionId.slice(0, 8)}...
          </span>
        )}
      </div>
    );
  }

  return (
    <div className={`rounded-lg border
      ${isMobile 
        ? `flex items-center gap-2 p-2 ${darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'}`
        : `flex items-center justify-between p-3 ${darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'}`
      }
    `}>
      <div className={`flex items-center ${isMobile ? 'gap-2' : 'gap-3'}`}>
        {/* Status indicator */}
        <div className="relative">
          <span className={`${isMobile ? 'text-base' : 'text-lg'} ${getStatusColor()}`}>
            {getStatusIcon()}
          </span>
          {(status.connecting || sessionLoading) && (
            <div className="absolute inset-0 animate-ping">
              <span className={`${isMobile ? 'text-base' : 'text-lg'} ${sessionLoading ? 'text-blue-500' : 'text-yellow-500'}`}>
                {sessionLoading ? '🔄' : '🟡'}
              </span>
            </div>
          )}
        </div>

        {/* Status text */}
        <div className="min-w-0 flex-1">
          <div className={`font-medium ${isMobile ? 'text-xs' : 'text-sm'}`}>{getStatusText()}</div>
          {!isMobile && (
            <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              {getStatusDescription()}
            </div>
          )}
        </div>
      </div>

      {/* Session info - only show on desktop */}
      {currentSessionId && !isMobile && (
        <div className={`text-right ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
          <div className="text-xs font-medium">Session Active</div>
          <div className="text-xs font-mono">
            {currentSessionId.slice(0, 8)}...
          </div>
        </div>
      )}

      {/* Last connected time - only show on desktop */}
      {status.lastConnected && !status.connected && !isMobile && (
        <div className={`text-right ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
          <div className="text-xs">Last connected</div>
          <div className="text-xs">
            {status.lastConnected.toLocaleTimeString()}
          </div>
        </div>
      )}

      {/* Mobile session indicator */}
      {currentSessionId && isMobile && (
        <div className={`text-xs font-mono ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
          {currentSessionId.slice(0, 6)}...
        </div>
      )}
    </div>
  );
};