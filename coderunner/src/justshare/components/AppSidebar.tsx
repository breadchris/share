import React, { useEffect, useRef, useState } from 'react';
import type { User, Group } from '../types';
import { UserProfile } from './UserProfile';
import { GroupSettings } from './GroupSettings';

export interface AppSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateGroup: () => void;
  onJoinGroup: () => void;
  currentUser?: User | null;
  currentGroup?: Group | null;
  onGroupDeleted?: (groupId: string) => void;
}

export const AppSidebar: React.FC<AppSidebarProps> = ({
  isOpen,
  onClose,
  onCreateGroup,
  onJoinGroup,
  currentUser,
  currentGroup,
  onGroupDeleted,
}) => {
  const sidebarRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState<'profile' | 'groups' | 'settings'>('profile');

  // Close sidebar when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (sidebarRef.current && !sidebarRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isOpen, onClose]);

  // Close sidebar on escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  const handleCreateGroup = () => {
    onCreateGroup();
    onClose();
  };

  const handleJoinGroup = () => {
    onJoinGroup();
    onClose();
  };

  const getInitials = (username: string): string => {
    if (!username) return '?';
    return username
      .split(' ')
      .map(word => word.length > 0 ? word.charAt(0).toUpperCase() : '')
      .filter(initial => initial.length > 0)
      .slice(0, 2)
      .join('');
  };

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-25 z-40 transition-opacity duration-200"
          onClick={onClose}
        />
      )}

      {/* Sliding Sidebar */}
      <div
        ref={sidebarRef}
        className={`fixed top-0 right-0 h-full w-80 max-w-[85vw] bg-white shadow-xl z-50 transform transition-transform duration-300 ease-in-out flex flex-col ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Settings</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
            aria-label="Close sidebar"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-gray-600">
              <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-gray-200 flex-shrink-0">
          <button
            onClick={() => setActiveTab('profile')}
            className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
              activeTab === 'profile'
                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center justify-center space-x-2">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-current">
                <path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span>Profile</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('groups')}
            className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
              activeTab === 'groups'
                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center justify-center space-x-2">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-current">
                <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span>Groups</span>
            </div>
          </button>
          {currentGroup && (
            <button
              onClick={() => setActiveTab('settings')}
              className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
                activeTab === 'settings'
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center justify-center space-x-2">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-current">
                  <path d="M12 15l3-3-3-3m-5 0l3 3-3 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span>Settings</span>
              </div>
            </button>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto min-h-0">
          {activeTab === 'profile' ? (
            <div className="p-4">
              <UserProfile user={currentUser} onClose={onClose} />
            </div>
          ) : activeTab === 'settings' ? (
            <div className="p-4">
              {currentGroup ? (
                <GroupSettings
                  group={currentGroup}
                  onClose={() => setActiveTab('groups')}
                  onGroupDeleted={onGroupDeleted}
                />
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500">No group selected</p>
                </div>
              )}
            </div>
          ) : (
            <div className="p-4 space-y-4">
              {/* Create Group */}
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-gray-700 uppercase tracking-wide">Create</h3>
                <button
                  onClick={handleCreateGroup}
                  className="w-full flex items-center p-4 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors text-left"
                >
                  <div className="flex items-center justify-center w-10 h-10 bg-blue-500 rounded-full mr-3">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-white">
                      <path d="M12 5v14m-7-7h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">Create Group</div>
                    <div className="text-sm text-gray-600">Start a new group and get a join code</div>
                  </div>
                </button>
              </div>

              {/* Join Group */}
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-gray-700 uppercase tracking-wide">Join</h3>
                <button
                  onClick={handleJoinGroup}
                  className="w-full flex items-center p-4 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-colors text-left"
                >
                  <div className="flex items-center justify-center w-10 h-10 bg-green-500 rounded-full mr-3">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-white">
                      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 7a4 4 0 1 0 8 0 4 4 0 0 0-8 0M22 11l-3-3m0 0l-3 3m3-3v6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">Join Group</div>
                    <div className="text-sm text-gray-600">Enter a join code to join an existing group</div>
                  </div>
                </button>
              </div>

              {/* Additional Group Actions */}
              <div className="pt-4 border-t border-gray-200">
                <h3 className="text-sm font-medium text-gray-700 uppercase tracking-wide mb-2">Manage</h3>
                <div className="space-y-2">
                  <button
                    disabled
                    className="w-full flex items-center p-3 text-gray-400 cursor-not-allowed"
                  >
                    <div className="flex items-center justify-center w-8 h-8 bg-gray-100 rounded-full mr-3">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-gray-400">
                        <path d="M12 15l3-3-3-3m-7 3h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                    <div className="text-sm">Leave Current Group</div>
                  </button>
                  <button
                    onClick={() => setActiveTab('settings')}
                    disabled={!currentGroup}
                    className={`w-full flex items-center p-3 transition-colors ${
                      currentGroup
                        ? 'text-gray-700 hover:bg-gray-50 cursor-pointer'
                        : 'text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    <div className={`flex items-center justify-center w-8 h-8 rounded-full mr-3 ${
                      currentGroup ? 'bg-gray-200' : 'bg-gray-100'
                    }`}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-current">
                        <path d="M12 15l3-3-3-3m-5 0l3 3-3 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                    <div className="text-sm">Group Settings</div>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 bg-gray-50 flex-shrink-0">
          {activeTab === 'profile' && currentUser && currentUser.username && (
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                <span className="text-white text-xs font-semibold">
                  {getInitials(currentUser.username)}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{currentUser.username}</p>
                <p className="text-xs text-gray-500">Currently signed in</p>
              </div>
            </div>
          )}
          {activeTab === 'groups' && (
            <div className="text-xs text-gray-500 text-center">
              Swipe left/right on group pills to switch groups quickly
            </div>
          )}
        </div>
      </div>
    </>
  );
};