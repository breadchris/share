import React from 'react';
import type { User } from '../types';
import { logout } from '../utils/auth';

export interface UserProfileProps {
  user: User | null;
  onClose: () => void;
  onLogout?: () => void;
}

export const UserProfile: React.FC<UserProfileProps> = ({ user, onClose, onLogout }) => {
  if (!user) {
    return (
      <div className="p-6 text-center">
        <div className="text-4xl mb-3">👤</div>
        <h3 className="font-medium text-gray-900 mb-1">No User Profile</h3>
        <p className="text-sm text-gray-600">User information not available</p>
      </div>
    );
  }

  const formatDate = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return 'Unknown date';
    }
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
    <div className="space-y-6">
      {/* Profile Header */}
      <div className="text-center">
        <div className="w-16 h-16 mx-auto mb-3 bg-blue-500 rounded-full flex items-center justify-center">
          <span className="text-white text-xl font-semibold">
            {getInitials(user.username)}
          </span>
        </div>
        <h2 className="text-xl font-semibold text-gray-900">{user.username}</h2>
        <p className="text-sm text-gray-600">Member since {formatDate(user.created_at)}</p>
      </div>

      {/* Profile Stats */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h3 className="text-sm font-medium text-gray-700 mb-3">Account Details</h3>
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">User ID</span>
            <span className="text-sm font-mono text-gray-900">{user.id}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Username</span>
            <span className="text-sm text-gray-900">{user.username}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Account Type</span>
            <span className="text-sm text-gray-900">Standard</span>
          </div>
        </div>
      </div>

      {/* Profile Actions */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-gray-700">Settings</h3>
        
        <button
          disabled
          className="w-full flex items-center p-3 text-gray-400 cursor-not-allowed bg-gray-50 rounded-lg"
        >
          <div className="flex items-center justify-center w-8 h-8 bg-gray-200 rounded-full mr-3">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-gray-400">
              <path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div className="text-left">
            <div className="text-sm font-medium">Edit Profile</div>
            <div className="text-xs text-gray-400">Change username and settings</div>
          </div>
        </button>

        <button
          disabled
          className="w-full flex items-center p-3 text-gray-400 cursor-not-allowed bg-gray-50 rounded-lg"
        >
          <div className="flex items-center justify-center w-8 h-8 bg-gray-200 rounded-full mr-3">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-gray-400">
              <path d="M12 1v6m0 0l4-4m-4 4L8 3M12 23v-6m0 0l4 4m-4-4l-4 4M1 12h6m0 0L3 8m4 4l-4 4M23 12h-6m0 0l4-4m-4 4l4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div className="text-left">
            <div className="text-sm font-medium">Privacy Settings</div>
            <div className="text-xs text-gray-400">Manage data and visibility</div>
          </div>
        </button>

        <button
          disabled
          className="w-full flex items-center p-3 text-gray-400 cursor-not-allowed bg-gray-50 rounded-lg"
        >
          <div className="flex items-center justify-center w-8 h-8 bg-gray-200 rounded-full mr-3">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-gray-400">
              <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div className="text-left">
            <div className="text-sm font-medium">Notifications</div>
            <div className="text-xs text-gray-400">Configure alerts and updates</div>
          </div>
        </button>
      </div>

      {/* Danger Zone */}
      <div className="pt-4 border-t border-gray-200">
        <h3 className="text-sm font-medium text-gray-700 mb-3">Account</h3>
        
        <button
          onClick={async () => {
            try {
              if (onLogout) {
                onLogout();
              }
              await logout();
            } catch (error) {
              console.error('Logout failed:', error);
            }
          }}
          className="w-full flex items-center p-3 text-red-600 hover:bg-red-100 bg-red-50 rounded-lg transition-colors"
        >
          <div className="flex items-center justify-center w-8 h-8 bg-red-200 rounded-full mr-3">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-red-600">
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4m0 14l4-4m0 0l4-4m-4 4l4 4m-4-4H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div className="text-left">
            <div className="text-sm font-medium">Sign Out</div>
            <div className="text-xs text-red-500">Log out of your account</div>
          </div>
        </button>
      </div>

      {/* App Info */}
      <div className="pt-4 border-t border-gray-200 text-center">
        <div className="text-xs text-gray-500 space-y-1">
          <p>JustShare v1.0</p>
          <p>Content sharing made simple</p>
        </div>
      </div>
    </div>
  );
};