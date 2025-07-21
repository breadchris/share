import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  ClaudeWebInterfaceProps, 
  ClaudeMessage, 
  GitSessionInfo, 
  GitStartData, 
  GitCommitData, 
  GitRepositoryStatus,
  ClaudeMDConfig 
} from './types';
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
  const [showConfigDropdown, setShowConfigDropdown] = useState(false);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const overflowMenuRef = useRef<HTMLDivElement>(null);
  const configDropdownRef = useRef<HTMLDivElement>(null);

  // Git-related state
  const [gitEnabled, setGitEnabled] = useState(false);
  const [gitSessionInfo, setGitSessionInfo] = useState<GitSessionInfo | null>(null);
  const [repositoryPath, setRepositoryPath] = useState('');
  const [baseBranch, setBaseBranch] = useState('main');
  const [currentDiff, setCurrentDiff] = useState('');
  const [gitStatus, setGitStatus] = useState<GitRepositoryStatus | null>(null);
  const [showGitControls, setShowGitControls] = useState(false);
  const [showCommitModal, setShowCommitModal] = useState(false);
  const [commitMessage, setCommitMessage] = useState('');

  // CLAUDE.md configuration state
  const [claudeConfigs, setClaudeConfigs] = useState<ClaudeMDConfig[]>([]);
  const [selectedConfigId, setSelectedConfigId] = useState<string>('');
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [configsLoading, setConfigsLoading] = useState(false);
  const [editingConfig, setEditingConfig] = useState<ClaudeMDConfig | null>(null);
  const [editingContent, setEditingContent] = useState('');
  const [gitLoading, setGitLoading] = useState(false);
  const [showDiffViewer, setShowDiffViewer] = useState(false);

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
      
      // Handle git-specific messages
      if (lastMessage.type === 'git_session_started' && lastMessage.result) {
        try {
          const response = JSON.parse(lastMessage.result) as GitSessionResponse;
          setGitSessionInfo(response.git_session_info);
          setGitEnabled(true);
        } catch (error) {
          console.error('Failed to parse git session response:', error);
        }
      }
      
      if (lastMessage.type === 'git_diff' && lastMessage.result) {
        setCurrentDiff(lastMessage.result);
        setShowDiffViewer(true);
      }
      
      if (lastMessage.type === 'git_status' && lastMessage.result) {
        try {
          const response = JSON.parse(lastMessage.result) as GitStatusResponse;
          setGitStatus(response.status);
        } catch (error) {
          console.error('Failed to parse git status response:', error);
        }
      }
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

  // Handle click outside overflow menu and config dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (overflowMenuRef.current && !overflowMenuRef.current.contains(event.target as Node)) {
        setShowOverflowMenu(false);
      }
      if (configDropdownRef.current && !configDropdownRef.current.contains(event.target as Node)) {
        setShowConfigDropdown(false);
      }
    };

    if (showOverflowMenu || showConfigDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showOverflowMenu, showConfigDropdown]);

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
        if (event.shiftKey) {
          handleNewGitSession();
        } else {
          handleNewSession();
        }
      }
      
      // Ctrl/Cmd + G to toggle git controls
      if ((event.ctrlKey || event.metaKey) && event.key === 'g') {
        event.preventDefault();
        setShowGitControls(prev => !prev);
      }
      
      // Ctrl/Cmd + D to show diff
      if ((event.ctrlKey || event.metaKey) && event.key === 'd' && gitEnabled) {
        event.preventDefault();
        handleGetDiff();
      }

      // Escape to disconnect
      if (event.key === 'Escape' && event.shiftKey) {
        event.preventDefault();
        handleDisconnect();
      }
      
      // Escape to close modals
      if (event.key === 'Escape' && !event.shiftKey) {
        event.preventDefault();
        if (showCommitModal) setShowCommitModal(false);
        if (showDiffViewer) setShowDiffViewer(false);
        if (showConfigModal) setShowConfigModal(false);
        if (showConfigDropdown) setShowConfigDropdown(false);
        if (showGitControls && !gitEnabled) setShowGitControls(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [enableKeyboardShortcuts, input, showCommitModal, showDiffViewer, showConfigModal, showConfigDropdown, showGitControls, gitEnabled]);

  const handleConnect = useCallback(() => {
    connect();
  }, [connect]);

  const handleDisconnect = useCallback(() => {
    disconnect();
    clearMessages();
    setSelectedSessionId(null); // Clear selection when disconnecting
  }, [disconnect, clearMessages]);

  const handleNewSession = useCallback(async () => {
    if (!connectionStatus.connected) {
      connect();
    }

    try {
      clearMessages();
      setSelectedSessionId(null); // Clear selection when creating new session
      const sessionId = await createSession();
      
      // Send start message via WebSocket
      sendMessage({
        type: 'start',
        payload: {
          config_id: selectedConfigId
        }
      });
    } catch (error) {
      console.error('Failed to create session:', error);
    }
  }, [connectionStatus.connected, connect, clearMessages, createSession, sendMessage, selectedConfigId]);

  const handleNewGitSession = useCallback(async () => {
    if (!connectionStatus.connected) {
      connect();
    }

    if (!repositoryPath.trim()) {
      console.error('Repository path is required for git session');
      return;
    }

    try {
      setGitLoading(true);
      clearMessages();
      setSelectedSessionId(null); // Clear selection when creating new git session
      
      // Create session first
      const sessionId = await createSession();
      
      // Send start_git message via WebSocket
      sendMessage({
        type: 'start_git',
        payload: {
          repository_path: repositoryPath.trim(),
          base_branch: baseBranch || 'main',
          config_id: selectedConfigId
        } as GitStartData
      });
      
      setGitEnabled(true);
      setShowGitControls(true);
    } catch (error) {
      console.error('Failed to create git session:', error);
    } finally {
      setGitLoading(false);
    }
  }, [connectionStatus.connected, connect, clearMessages, createSession, sendMessage, repositoryPath, baseBranch, selectedConfigId]);

  const handleSelectSession = useCallback((sessionId: string) => {
    setSelectedSessionId(sessionId);
  }, []);

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
      
      // Clear selection after resuming
      setSelectedSessionId(null);
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

  // Git operation functions
  const handleGetDiff = useCallback(() => {
    if (!currentSessionId || !gitEnabled) return;
    
    sendMessage({
      type: 'git_diff',
      payload: {}
    });
  }, [currentSessionId, gitEnabled, sendMessage]);

  const handleGetGitStatus = useCallback(() => {
    if (!currentSessionId || !gitEnabled) return;
    
    sendMessage({
      type: 'git_status',
      payload: {}
    });
  }, [currentSessionId, gitEnabled, sendMessage]);

  const handleCommitChanges = useCallback(() => {
    if (!currentSessionId || !gitEnabled || !commitMessage.trim()) return;
    
    sendMessage({
      type: 'git_commit',
      payload: {
        message: commitMessage.trim()
      } as GitCommitData
    });
    
    setCommitMessage('');
    setShowCommitModal(false);
  }, [currentSessionId, gitEnabled, commitMessage, sendMessage]);

  // CLAUDE.md configuration functions
  const fetchClaudeConfigs = useCallback(async () => {
    try {
      setConfigsLoading(true);
      const response = await fetch(`${apiBaseUrl}/flow/claude/configs`);
      if (!response.ok) {
        throw new Error('Failed to fetch configurations');
      }
      const data = await response.json();
      setClaudeConfigs(data.configs || []);
      
      // Set default configuration if none selected
      if (!selectedConfigId && data.configs.length > 0) {
        const defaultConfig = data.configs.find((c: ClaudeMDConfig) => c.is_default);
        if (defaultConfig) {
          setSelectedConfigId(defaultConfig.id);
        }
      }
    } catch (error) {
      console.error('Failed to fetch CLAUDE.md configurations:', error);
    } finally {
      setConfigsLoading(false);
    }
  }, [apiBaseUrl, selectedConfigId]);

  const handleConfigChange = useCallback((configId: string) => {
    setSelectedConfigId(configId);
  }, []);

  const createConfig = useCallback(async (name: string, description: string, content: string) => {
    try {
      const response = await fetch(`${apiBaseUrl}/flow/claude/configs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          description,
          content,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Failed to create configuration: ${error}`);
      }

      const newConfig = await response.json();
      setClaudeConfigs(prev => [...prev, newConfig]);
      setSelectedConfigId(newConfig.id);
      return newConfig;
    } catch (error) {
      console.error('Failed to create configuration:', error);
      throw error;
    }
  }, [apiBaseUrl]);

  const updateConfig = useCallback(async (configId: string, name?: string, description?: string, content?: string) => {
    try {
      const updateData: { name?: string; description?: string; content?: string } = {};
      if (name !== undefined) updateData.name = name;
      if (description !== undefined) updateData.description = description;
      if (content !== undefined) updateData.content = content;

      const response = await fetch(`${apiBaseUrl}/flow/claude/configs/${configId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Failed to update configuration: ${error}`);
      }

      const updatedConfig = await response.json();
      setClaudeConfigs(prev => prev.map(c => c.id === configId ? updatedConfig : c));
      return updatedConfig;
    } catch (error) {
      console.error('Failed to update configuration:', error);
      throw error;
    }
  }, [apiBaseUrl]);

  const deleteConfig = useCallback(async (configId: string) => {
    try {
      const response = await fetch(`${apiBaseUrl}/flow/claude/configs/${configId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Failed to delete configuration: ${error}`);
      }

      setClaudeConfigs(prev => prev.filter(c => c.id !== configId));
      
      // If the deleted config was selected, select the default one
      if (selectedConfigId === configId) {
        const defaultConfig = claudeConfigs.find(c => c.is_default);
        if (defaultConfig) {
          setSelectedConfigId(defaultConfig.id);
        }
      }
    } catch (error) {
      console.error('Failed to delete configuration:', error);
      throw error;
    }
  }, [apiBaseUrl, selectedConfigId, claudeConfigs]);

  const handleEditConfig = useCallback((config: ClaudeMDConfig) => {
    setEditingConfig(config);
    setEditingContent(config.content);
  }, []);

  const handleSaveConfig = useCallback(async () => {
    if (!editingConfig) return;

    try {
      if (editingConfig.id === 'new') {
        // Create new configuration
        const newConfig = await createConfig(editingConfig.name, editingConfig.description, editingContent);
        setSelectedConfigId(newConfig.id);
      } else {
        // Update existing configuration
        await updateConfig(editingConfig.id, undefined, undefined, editingContent);
      }
      setEditingConfig(null);
      setEditingContent('');
    } catch (error) {
      console.error('Failed to save configuration:', error);
    }
  }, [editingConfig, editingContent, updateConfig, createConfig]);

  const handleCancelEdit = useCallback(() => {
    if (editingConfig?.id === 'new') {
      // If canceling a new config, clear selection too
      setSelectedConfigId('');
    }
    setEditingConfig(null);
    setEditingContent('');
  }, [editingConfig]);


  // Load configurations on mount
  useEffect(() => {
    fetchClaudeConfigs();
  }, [fetchClaudeConfigs]);

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


  // Git UI components
  const renderGitControls = () => {
    if (!showGitControls && !gitEnabled) return null;
    
    return (
      <div className={`border-b p-4 ${isDarkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gray-50'}`}>
        {!gitEnabled ? (
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Git Repository Setup</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Repository Path
                </label>
                <input
                  type="text"
                  value={repositoryPath}
                  onChange={(e) => setRepositoryPath(e.target.value)}
                  placeholder="/path/to/your/repo"
                  className={`w-full px-3 py-2 border rounded-md ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                />
              </div>
              <div>
                <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Base Branch
                </label>
                <input
                  type="text"
                  value={baseBranch}
                  onChange={(e) => setBaseBranch(e.target.value)}
                  placeholder="main"
                  className={`w-full px-3 py-2 border rounded-md ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                />
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleNewGitSession}
                disabled={!repositoryPath.trim() || gitLoading}
                className={`px-4 py-2 rounded-md text-white font-medium transition-colors
                  ${!repositoryPath.trim() || gitLoading 
                    ? 'bg-gray-500 cursor-not-allowed' 
                    : 'bg-blue-500 hover:bg-blue-600'
                  }
                `}
              >
                {gitLoading ? 'Creating...' : 'Start Git Session'}
              </button>
              <button
                onClick={() => setShowGitControls(false)}
                className={`px-4 py-2 rounded-md border transition-colors
                  ${isDarkMode ? 'border-gray-600 hover:bg-gray-700' : 'border-gray-300 hover:bg-gray-100'}
                `}
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-lg">Git Session Active</h3>
              <button
                onClick={() => setShowGitControls(false)}
                className={`p-1 rounded transition-colors
                  ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-200'}
                `}
              >
                ✕
              </button>
            </div>
            
            {gitSessionInfo && (
              <div className={`p-3 rounded-md text-sm space-y-2 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                <div><strong>Repository:</strong> {gitSessionInfo.repository_path}</div>
                <div><strong>Branch:</strong> {gitSessionInfo.branch_name}</div>
                <div><strong>Base:</strong> {gitSessionInfo.base_branch}</div>
                {gitSessionInfo.commit_hash && (
                  <div><strong>Commit:</strong> {gitSessionInfo.commit_hash.slice(0, 8)}</div>
                )}
              </div>
            )}
            
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={handleGetDiff}
                className="px-3 py-1 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors"
              >
                Show Diff
              </button>
              <button
                onClick={handleGetGitStatus}
                className="px-3 py-1 bg-yellow-500 text-white rounded-md hover:bg-yellow-600 transition-colors"
              >
                Git Status
              </button>
              <button
                onClick={() => setShowCommitModal(true)}
                className="px-3 py-1 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
              >
                Commit Changes
              </button>
              {gitStatus && (
                <div className={`px-3 py-1 rounded-md text-sm ${gitStatus.is_clean ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                  {gitStatus.is_clean ? 'Clean' : `${gitStatus.modified_files.length + gitStatus.added_files.length + gitStatus.deleted_files.length} changes`}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderCommitModal = () => {
    if (!showCommitModal) return null;
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className={`w-full max-w-md rounded-lg p-6 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Commit Changes</h3>
            <button
              onClick={() => setShowCommitModal(false)}
              className={`p-2 rounded transition-colors
                ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}
              `}
            >
              ✕
            </button>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Commit Message
              </label>
              <textarea
                value={commitMessage}
                onChange={(e) => setCommitMessage(e.target.value)}
                placeholder="Describe your changes..."
                rows={4}
                className={`w-full px-3 py-2 border rounded-md ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
              />
            </div>
            
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setShowCommitModal(false)}
                className={`px-4 py-2 rounded-md border transition-colors
                  ${isDarkMode ? 'border-gray-600 hover:bg-gray-700' : 'border-gray-300 hover:bg-gray-100'}
                `}
              >
                Cancel
              </button>
              <button
                onClick={handleCommitChanges}
                disabled={!commitMessage.trim()}
                className={`px-4 py-2 rounded-md text-white font-medium transition-colors
                  ${!commitMessage.trim() 
                    ? 'bg-gray-500 cursor-not-allowed' 
                    : 'bg-blue-500 hover:bg-blue-600'
                  }
                `}
              >
                Commit
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderDiffViewer = () => {
    if (!showDiffViewer || !currentDiff) return null;
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className={`w-full max-w-4xl max-h-[80vh] rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
          <div className="flex items-center justify-between p-4 border-b">
            <h3 className="text-lg font-semibold">Git Diff</h3>
            <button
              onClick={() => setShowDiffViewer(false)}
              className={`p-2 rounded transition-colors
                ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}
              `}
            >
              ✕
            </button>
          </div>
          
          <div className="p-4 overflow-auto max-h-[calc(80vh-80px)]">
            <pre className={`text-sm whitespace-pre-wrap ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              {currentDiff}
            </pre>
          </div>
        </div>
      </div>
    );
  };

  // CLAUDE.md Configuration Modal
  const renderConfigModal = () => {
    if (!showConfigModal) return null;
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className={`w-full max-w-4xl h-[80vh] rounded-lg p-6 mx-4 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">CLAUDE.md Configuration Manager</h2>
            <button
              onClick={() => setShowConfigModal(false)}
              className={`p-2 rounded-md transition-colors ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-full">
            {/* Configuration List */}
            <div className={`border rounded-lg p-4 ${isDarkMode ? 'border-gray-600' : 'border-gray-300'}`}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">Configurations</h3>
                <button
                  onClick={() => {
                    // Create a new config by setting editing state
                    const newConfig = {
                      id: 'new',
                      name: 'New Configuration',
                      description: '',
                      content: '# CLAUDE.md\n\nNew configuration content...',
                      created_at: new Date().toISOString(),
                      updated_at: new Date().toISOString(),
                      is_default: false
                    };
                    setEditingConfig(newConfig);
                    setEditingContent(newConfig.content);
                    setSelectedConfigId('new');
                  }}
                  className={`px-3 py-1 text-sm rounded-md transition-colors ${isDarkMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600'} text-white`}
                >
                  + New
                </button>
              </div>
              
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {claudeConfigs.filter(config => config.id !== 'new').map((config) => (
                  <div
                    key={config.id}
                    className={`p-3 rounded-md cursor-pointer transition-colors ${
                      selectedConfigId === config.id
                        ? isDarkMode ? 'bg-blue-900 border-blue-500' : 'bg-blue-50 border-blue-500'
                        : isDarkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-50 hover:bg-gray-100'
                    } border`}
                    onClick={() => setSelectedConfigId(config.id)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{config.name}</span>
                          {config.is_default && (
                            <span className={`px-2 py-0.5 text-xs rounded ${isDarkMode ? 'bg-green-900 text-green-300' : 'bg-green-100 text-green-800'}`}>
                              Default
                            </span>
                          )}
                        </div>
                        <p className={`text-sm mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                          {config.description || 'No description'}
                        </p>
                      </div>
                      <div className="flex gap-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditConfig(config);
                          }}
                          className={`p-1 rounded transition-colors ${isDarkMode ? 'hover:bg-gray-600' : 'hover:bg-gray-200'}`}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        {!config.is_default && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (window.confirm(`Are you sure you want to delete "${config.name}"?`)) {
                                deleteConfig(config.id);
                              }
                            }}
                            className={`p-1 rounded transition-colors ${isDarkMode ? 'hover:bg-red-800 text-red-400' : 'hover:bg-red-100 text-red-600'}`}
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Configuration Content */}
            <div className={`border rounded-lg p-4 ${isDarkMode ? 'border-gray-600' : 'border-gray-300'}`}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">
                  {selectedConfigId === 'new' ? 'New Configuration' : 
                   selectedConfigId ? claudeConfigs.find(c => c.id === selectedConfigId)?.name : 'Select a configuration'}
                </h3>
                {selectedConfigId && editingConfig && (
                  <div className="flex gap-2">
                    <button
                      onClick={handleSaveConfig}
                      className={`px-3 py-1 text-sm rounded-md transition-colors ${isDarkMode ? 'bg-green-600 hover:bg-green-700' : 'bg-green-500 hover:bg-green-600'} text-white`}
                    >
                      Save
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      className={`px-3 py-1 text-sm rounded-md transition-colors ${isDarkMode ? 'bg-gray-600 hover:bg-gray-700' : 'bg-gray-500 hover:bg-gray-600'} text-white`}
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
              
              {selectedConfigId ? (
                <div className="h-full">
                  <textarea
                    value={editingConfig ? editingContent : 
                           selectedConfigId === 'new' ? '' : 
                           claudeConfigs.find(c => c.id === selectedConfigId)?.content || ''}
                    onChange={(e) => setEditingContent(e.target.value)}
                    className={`w-full h-full resize-none font-mono text-sm border rounded-md p-3 ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                    placeholder="CLAUDE.md content..."
                    readOnly={!editingConfig}
                  />
                </div>
              ) : (
                <div className={`h-full flex items-center justify-center text-center ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  <div>
                    <svg className="w-12 h-12 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <p>Select a configuration to view its content</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

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
            selectedSessionId={selectedSessionId}
            loading={sessionLoading}
            darkMode={isDarkMode}
            isMobile={isMobile}
            onSelectSession={handleSelectSession}
            onResumeSession={handleResumeSession}
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
            {/* Configuration menu */}
            {claudeConfigs.length > 0 && (
              <div className="relative" ref={configDropdownRef}>
                <button
                  onClick={() => setShowConfigDropdown(!showConfigDropdown)}
                  className={`p-1 rounded transition-colors touch-manipulation
                    ${isDarkMode ? 'text-gray-400 hover:text-gray-300 hover:bg-gray-700' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'}
                    ${isMobile ? '' : 'text-sm'}
                  `}
                  style={isMobile ? { minHeight: '44px', minWidth: '44px' } : { minHeight: '32px', minWidth: '32px' }}
                  title="CLAUDE.md Configuration"
                >
                  ⚙️
                </button>
                
                {/* Configuration dropdown menu */}
                {showConfigDropdown && (
                  <div className={`absolute right-0 top-full mt-1 py-1 rounded shadow-lg border z-20 min-w-48
                    ${isDarkMode ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-200'}
                  `}>
                    <div className={`px-3 py-1 text-xs font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      CLAUDE.md Config
                    </div>
                    
                    {/* Current config display */}
                    {selectedConfigId && (
                      <div className={`px-3 py-2 border-b ${isDarkMode ? 'border-gray-600' : 'border-gray-200'}`}>
                        <div className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                          Active: {claudeConfigs.find(c => c.id === selectedConfigId)?.name}
                        </div>
                        <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                          {claudeConfigs.find(c => c.id === selectedConfigId)?.description || 'No description'}
                        </div>
                      </div>
                    )}
                    
                    {/* Config selection */}
                    <div className={`px-3 py-1 text-xs font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      Switch Configuration
                    </div>
                    {claudeConfigs.map((config) => (
                      <button
                        key={config.id}
                        onClick={() => {
                          handleConfigChange(config.id);
                          setShowConfigDropdown(false);
                        }}
                        className={`block w-full px-3 py-2 text-left text-sm transition-colors
                          ${selectedConfigId === config.id 
                            ? isDarkMode ? 'bg-blue-900 text-blue-300' : 'bg-blue-50 text-blue-900'
                            : isDarkMode ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-50 text-gray-700'
                          }
                        `}
                      >
                        <div className="font-medium">
                          {config.name} {config.is_default ? '(Default)' : ''}
                        </div>
                        {config.description && (
                          <div className={`text-xs ${selectedConfigId === config.id 
                            ? isDarkMode ? 'text-blue-400' : 'text-blue-600' 
                            : isDarkMode ? 'text-gray-500' : 'text-gray-600'
                          }`}>
                            {config.description}
                          </div>
                        )}
                      </button>
                    ))}
                    
                    <div className={`border-t mt-1 ${isDarkMode ? 'border-gray-600' : 'border-gray-200'}`}>
                      <button
                        onClick={() => {
                          setShowConfigModal(true);
                          setShowConfigDropdown(false);
                        }}
                        className={`block w-full px-3 py-2 text-left text-sm transition-colors
                          ${isDarkMode ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-50 text-gray-700'}
                        `}
                      >
                        Manage Configurations...
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

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
                  <div className="flex gap-1">
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
                    {!gitEnabled && (
                      <button
                        onClick={() => setShowGitControls(true)}
                        className={`rounded bg-purple-500 text-white transition-colors touch-manipulation
                          ${isTouchDevice ? 'active:bg-purple-700' : 'hover:bg-purple-600'}
                          ${isMobile ? 'px-2 py-2 text-xs' : 'px-3 py-1 text-sm'}
                        `}
                        style={isMobile ? { minHeight: '44px' } : undefined}
                        title="Start Git Session"
                      >
                        {isMobile ? 'Git' : 'Git Session'}
                      </button>
                    )}
                  </div>
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


        {/* Git Controls */}
        {renderGitControls()}

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
            Shortcuts: <kbd>Ctrl+Enter</kbd> Send • <kbd>Ctrl+N</kbd> New • <kbd>Shift+Ctrl+N</kbd> Git • <kbd>Ctrl+G</kbd> Git Controls • <kbd>Ctrl+D</kbd> Diff • <kbd>Ctrl+B</kbd> Sidebar • <kbd>Shift+Esc</kbd> Disconnect
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

      {/* Git Modals */}
      {renderCommitModal()}
      {renderDiffViewer()}
      
      {/* CLAUDE.md Configuration Modal */}
      {renderConfigModal()}
    </div>
  );
};

export default ClaudeWebInterface;