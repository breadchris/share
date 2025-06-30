import React from 'react';
import { StatusIndicatorProps } from '../types';

export const StatusIndicator: React.FC<StatusIndicatorProps> = ({
  status,
  currentSessionId,
  darkMode,
  compact = false,
}) => {
  const getStatusColor = () => {
    if (status.error) return 'text-red-500';
    if (status.connected) return 'text-green-500';
    if (status.connecting) return 'text-yellow-500';
    return 'text-gray-500';
  };

  const getStatusIcon = () => {
    if (status.error) return '❌';
    if (status.connected) return '🟢';
    if (status.connecting) return '🟡';
    return '⚫';
  };

  const getStatusText = () => {
    if (status.error) return 'Error';
    if (status.connected) return 'Connected';
    if (status.connecting) return 'Connecting...';
    return 'Disconnected';
  };

  const getStatusDescription = () => {
    if (status.error) return status.error;
    if (status.connected) return 'Ready to chat with Claude';
    if (status.connecting) return 'Establishing connection...';
    return 'Click connect to start';
  };

  if (compact) {
    return (
      <div className={`flex items-center gap-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
        <span className={getStatusColor()}>{getStatusIcon()}</span>
        <span className="text-sm">{getStatusText()}</span>
        {currentSessionId && (
          <span className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
            • {currentSessionId.slice(0, 8)}...
          </span>
        )}
      </div>
    );
  }

  return (
    <div className={`flex items-center justify-between p-3 rounded-lg border
      ${darkMode 
        ? 'bg-gray-800 border-gray-700 text-white' 
        : 'bg-gray-50 border-gray-200 text-gray-900'
      }
    `}>
      <div className="flex items-center gap-3">
        {/* Status indicator */}
        <div className="relative">
          <span className={`text-lg ${getStatusColor()}`}>
            {getStatusIcon()}
          </span>
          {status.connecting && (
            <div className="absolute inset-0 animate-ping">
              <span className="text-lg text-yellow-500">🟡</span>
            </div>
          )}
        </div>

        {/* Status text */}
        <div>
          <div className="font-medium text-sm">{getStatusText()}</div>
          <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            {getStatusDescription()}
          </div>
        </div>
      </div>

      {/* Session info */}
      {currentSessionId && (
        <div className={`text-right ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
          <div className="text-xs font-medium">Session Active</div>
          <div className="text-xs font-mono">
            {currentSessionId.slice(0, 8)}...
          </div>
        </div>
      )}

      {/* Last connected time */}
      {status.lastConnected && !status.connected && (
        <div className={`text-right ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
          <div className="text-xs">Last connected</div>
          <div className="text-xs">
            {status.lastConnected.toLocaleTimeString()}
          </div>
        </div>
      )}
    </div>
  );
};