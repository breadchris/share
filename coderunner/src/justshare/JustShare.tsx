import React, { useState, useEffect, useCallback, useRef } from 'react';
import type { Content, Group, AppState } from './types';
import { getUserGroups, getTimeline, getErrorMessage, deleteContent } from './utils/api';
import { checkAuthStatus, isAuthError, handleAuthError, type AuthState } from './utils/auth';
import { GroupSelector } from './components/GroupSelector';
import { Timeline } from './components/Timeline';
import { ContentCapture } from './components/ContentCapture';
import { ContentViewer } from './components/ContentViewer';
import { GroupManager } from './components/GroupManager';
import { LoginPrompt } from './components/LoginPrompt';

export const JustShare: React.FC = () => {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    user: null,
    isLoading: true,
  });

  const [appState, setAppState] = useState<AppState>({
    currentGroup: null,
    userGroups: [],
    timeline: [],
    isLoading: false,
    hasMore: false,
    nextOffset: 0,
    captureMode: null,
    selectedContent: null,
  });

  const [showContentCapture, setShowContentCapture] = useState(true);

  const [showGroupManager, setShowGroupManager] = useState<{
    visible: boolean;
    mode: 'create' | 'join';
  }>({ visible: false, mode: 'create' });

  const [error, setError] = useState<string | null>(null);
  const timelineLoadedRef = useRef(false);

  // Check authentication status on mount
  useEffect(() => {
    checkAuth();
  }, []);

  // Load user groups when authenticated
  useEffect(() => {
    if (authState.isAuthenticated && !authState.isLoading) {
      loadUserGroups();
    }
  }, [authState.isAuthenticated, authState.isLoading]);

  const checkAuth = useCallback(async () => {
    try {
      const auth = await checkAuthStatus();
      setAuthState(auth);
    } catch (error) {
      console.error('Auth check failed:', error);
      setAuthState({
        isAuthenticated: false,
        user: null,
        isLoading: false,
      });
    }
  }, []);

  // Load timeline when current group changes
  useEffect(() => {
    if (appState.currentGroup && !timelineLoadedRef.current) {
      loadTimeline(true);
      timelineLoadedRef.current = true;
    }
  }, [appState.currentGroup]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Toggle content capture with 'i' key or Space (when not in input)
      if ((e.key === 'i' || e.key === 'I' || e.key === ' ') && !isInputFocused()) {
        e.preventDefault();
        setShowContentCapture(prev => !prev);
      }
    };

    const isInputFocused = (): boolean => {
      const activeElement = document.activeElement;
      return activeElement instanceof HTMLInputElement || 
             activeElement instanceof HTMLTextAreaElement ||
             (activeElement instanceof HTMLElement && activeElement.contentEditable === 'true');
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const loadUserGroups = useCallback(async () => {
    try {
      const groups = await getUserGroups();
      setAppState(prev => ({
        ...prev,
        userGroups: groups,
        currentGroup: groups.length > 0 ? groups[0] : null,
      }));
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      if (isAuthError(error)) {
        handleAuthError();
      } else {
        setError(errorMessage);
      }
    }
  }, []);

  const loadTimeline = useCallback(async (reset = false) => {
    if (!appState.currentGroup) return;

    const offset = reset ? 0 : appState.nextOffset;
    
    setAppState(prev => ({ ...prev, isLoading: true }));
    setError(null);

    try {
      const response = await getTimeline(appState.currentGroup.id, offset);
      
      setAppState(prev => ({
        ...prev,
        timeline: reset ? response.content : [...(prev.timeline || []), ...response.content],
        hasMore: response.has_more,
        nextOffset: response.next_offset,
        isLoading: false,
      }));
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      if (isAuthError(error)) {
        handleAuthError();
      } else {
        setError(errorMessage);
      }
      setAppState(prev => ({ ...prev, isLoading: false }));
    }
  }, [appState.currentGroup, appState.nextOffset]);

  const handleGroupSelect = useCallback((group: Group) => {
    setAppState(prev => ({
      ...prev,
      currentGroup: group,
      timeline: [],
      nextOffset: 0,
      hasMore: false,
    }));
    timelineLoadedRef.current = false;
  }, []);

  const handleContentCreated = useCallback((content: Content) => {
    setAppState(prev => ({
      ...prev,
      timeline: [content, ...(prev.timeline || [])],
    }));
  }, []);

  const handleContentDelete = useCallback(async (contentId: string) => {
    try {
      await deleteContent(contentId);
      setAppState(prev => ({
        ...prev,
        timeline: prev.timeline.filter(content => content.id !== contentId),
      }));
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      if (isAuthError(error)) {
        handleAuthError();
      } else {
        setError(errorMessage);
      }
    }
  }, []);

  const handleContentClick = useCallback((content: Content) => {
    setAppState(prev => ({ ...prev, selectedContent: content }));
  }, []);

  const handleContentClose = useCallback(() => {
    setAppState(prev => ({ ...prev, selectedContent: null }));
  }, []);

  const handleGroupCreated = useCallback((group: Group) => {
    setAppState(prev => ({
      ...prev,
      userGroups: [group, ...prev.userGroups],
      currentGroup: group,
      timeline: [],
      nextOffset: 0,
      hasMore: false,
    }));
    setShowGroupManager({ visible: false, mode: 'create' });
    timelineLoadedRef.current = false;
  }, []);

  const handleGroupJoined = useCallback((group: Group) => {
    setAppState(prev => ({
      ...prev,
      userGroups: [group, ...prev.userGroups],
      currentGroup: group,
      timeline: [],
      nextOffset: 0,
      hasMore: false,
    }));
    timelineLoadedRef.current = false;
  }, []);

  // Detect mobile device
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );

  // PWA install prompt
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallApp = useCallback(async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setShowInstallPrompt(false);
      }
      setDeferredPrompt(null);
    }
  }, [deferredPrompt]);

  // Show loading spinner while checking authentication
  if (authState.isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-gray-300 border-t-blue-500 rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Show login prompt if not authenticated
  if (!authState.isAuthenticated) {
    return <LoginPrompt onLogin={checkAuth} />;
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Install App Prompt */}
      {showInstallPrompt && isMobile && (
        <div className="bg-blue-500 text-white p-3 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <span className="text-lg">📱</span>
            <div>
              <p className="text-sm font-medium">Install JustShare</p>
              <p className="text-xs opacity-90">Add to home screen for quick access</p>
            </div>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={handleInstallApp}
              className="px-3 py-1 bg-white bg-opacity-20 rounded text-sm font-medium"
            >
              Install
            </button>
            <button
              onClick={() => setShowInstallPrompt(false)}
              className="text-white text-lg"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Error Banner */}
      {error && (
        <div className="bg-red-500 text-white p-3 flex items-center justify-between">
          <span className="text-sm">{error}</span>
          <button
            onClick={() => setError(null)}
            className="text-white text-lg"
          >
            ✕
          </button>
        </div>
      )}

      {/* Group Selector */}
      <GroupSelector
        groups={appState.userGroups}
        currentGroup={appState.currentGroup}
        currentUser={authState.user}
        onGroupSelect={handleGroupSelect}
        onCreateGroup={() => setShowGroupManager({ visible: true, mode: 'create' })}
        onJoinGroup={() => setShowGroupManager({ visible: true, mode: 'join' })}
        showContentCapture={showContentCapture}
        onToggleContentCapture={() => setShowContentCapture(prev => !prev)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Timeline */}
        <Timeline
          content={appState.timeline}
          isLoading={appState.isLoading}
          hasMore={appState.hasMore}
          onLoadMore={() => loadTimeline(false)}
          onContentClick={handleContentClick}
          onContentDelete={handleContentDelete}
        />

        {/* Content Capture with Toggle Animation */}
        <div className={`transition-all duration-300 ease-in-out ${
          showContentCapture 
            ? 'transform translate-y-0 opacity-100' 
            : 'transform translate-y-full opacity-0 pointer-events-none'
        }`}>
          <ContentCapture
            currentGroup={appState.currentGroup}
            onContentCreated={handleContentCreated}
            onGroupChange={handleGroupSelect}
          />
        </div>
      </div>

      {/* Content Viewer Modal */}
      {appState.selectedContent && (
        <ContentViewer
          content={appState.selectedContent}
          onClose={handleContentClose}
          onEdit={(content) => {
            // TODO: Implement edit functionality
            console.log('Edit content:', content);
          }}
          onDelete={async (contentId) => {
            await handleContentDelete(contentId);
            handleContentClose();
          }}
        />
      )}

      {/* Group Manager Modal */}
      {showGroupManager.visible && (
        <GroupManager
          mode={showGroupManager.mode}
          onGroupCreated={handleGroupCreated}
          onGroupJoined={handleGroupJoined}
          onClose={() => setShowGroupManager({ visible: false, mode: 'create' })}
        />
      )}

      {/* PWA Styles */}
      <style>{`
        /* PWA viewport meta tag equivalent */
        @media (display-mode: standalone) {
          body {
            user-select: none;
            -webkit-user-select: none;
            -webkit-touch-callout: none;
          }
        }

        /* Mobile optimizations */
        @media (max-width: 768px) {
          * {
            -webkit-tap-highlight-color: transparent;
          }
          
          input, textarea, select {
            font-size: 16px; /* Prevent zoom on iOS */
          }
        }

        /* Smooth scrolling */
        html {
          scroll-behavior: smooth;
        }

        /* Hide scrollbars but keep functionality */
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }

        /* Touch scroll momentum */
        .overflow-scroll {
          -webkit-overflow-scrolling: touch;
        }

        /* Prevent pull-to-refresh on mobile */
        body {
          overscroll-behavior-y: contain;
        }
      `}</style>
    </div>
  );
};

export default JustShare;