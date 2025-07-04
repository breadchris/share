import React, { useState, useEffect, useCallback } from 'react';
import type { GroupSettingsProps, GroupSettings as GroupSettingsType } from '../types';
import { getGroupSettings, deleteGroup, getErrorMessage } from '../utils/api';
import { ConfirmationDialog } from './ConfirmationDialog';

export const GroupSettings: React.FC<GroupSettingsProps> = ({
  group,
  onClose,
  onGroupDeleted,
}) => {
  const [groupSettings, setGroupSettings] = useState<GroupSettingsType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState<'join_code' | 'share_url' | null>(null);

  // Load group settings
  const loadGroupSettings = useCallback(async () => {
    if (!group) return;

    try {
      setIsLoading(true);
      setError(null);
      const settings = await getGroupSettings(group.id);
      setGroupSettings(settings);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, [group]);

  useEffect(() => {
    loadGroupSettings();
  }, [loadGroupSettings]);

  // Handle group deletion
  const handleDeleteGroup = useCallback(async () => {
    if (!group || !groupSettings) return;

    try {
      setIsDeleting(true);
      await deleteGroup(group.id);
      onGroupDeleted?.(group.id);
      onClose();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  }, [group, groupSettings, onGroupDeleted, onClose]);

  // Copy join code to clipboard
  const copyJoinCode = useCallback(async () => {
    if (!groupSettings) return;

    try {
      await navigator.clipboard.writeText(groupSettings.join_code);
      setCopyFeedback('join_code');
      setTimeout(() => setCopyFeedback(null), 2000);
    } catch (err) {
      console.error('Failed to copy join code:', err);
    }
  }, [groupSettings]);

  // Copy share URL to clipboard
  const copyShareURL = useCallback(async () => {
    if (!groupSettings) return;

    try {
      const shareURL = `${window.location.origin}/api/join?code=${groupSettings.join_code}`;
      await navigator.clipboard.writeText(shareURL);
      setCopyFeedback('share_url');
      setTimeout(() => setCopyFeedback(null), 2000);
    } catch (err) {
      console.error('Failed to copy share URL:', err);
    }
  }, [groupSettings]);

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatTimeAgo = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    return `${Math.floor(diffDays / 365)} years ago`;
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

  if (!group) return null;

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Group Settings</h3>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-gray-600">
              <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin w-6 h-6 border-2 border-gray-300 border-t-blue-600 rounded-full"></div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-red-600 mr-3">
                <path d="M12 9v4M12 17h.01M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9 9 4.03 9 9z" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              <p className="text-red-800 text-sm">{error}</p>
            </div>
            <button
              onClick={loadGroupSettings}
              className="mt-2 text-red-600 text-sm font-medium hover:text-red-700"
            >
              Try again
            </button>
          </div>
        )}

        {/* Group Information */}
        {groupSettings && (
          <div className="space-y-6">
            {/* Basic Info */}
            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              <h4 className="text-sm font-medium text-gray-700 uppercase tracking-wide">Group Information</h4>
              
              <div className="space-y-2">
                <div>
                  <label className="text-sm text-gray-600">Group Name</label>
                  <p className="text-lg font-medium text-gray-900">{groupSettings.name}</p>
                </div>

                <div>
                  <label className="text-sm text-gray-600">Created</label>
                  <p className="text-sm text-gray-900">{formatDate(groupSettings.created_at)}</p>
                </div>

                <div>
                  <label className="text-sm text-gray-600">Join Code</label>
                  <div className="flex items-center space-x-2">
                    <code className="bg-white px-3 py-2 rounded border font-mono text-sm">
                      {groupSettings.join_code}
                    </code>
                    <button
                      onClick={copyJoinCode}
                      className={`p-2 rounded transition-colors ${
                        copyFeedback === 'join_code' 
                          ? 'text-green-600 bg-green-100' 
                          : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                      }`}
                      title={copyFeedback === 'join_code' ? 'Copied!' : 'Copy join code'}
                    >
                      {copyFeedback === 'join_code' ? (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="20,6 9,17 4,12"/>
                        </svg>
                      ) : (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                          <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-sm text-gray-600">Share URL</label>
                  <div className="flex items-center space-x-2">
                    <div className="flex-1 bg-white px-3 py-2 rounded border text-sm text-gray-700 truncate">
                      {window.location.origin}/api/join?code={groupSettings.join_code}
                    </div>
                    <button
                      onClick={copyShareURL}
                      className={`p-2 rounded transition-colors ${
                        copyFeedback === 'share_url' 
                          ? 'text-green-600 bg-green-100' 
                          : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                      }`}
                      title={copyFeedback === 'share_url' ? 'Copied!' : 'Copy share URL'}
                    >
                      {copyFeedback === 'share_url' ? (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="20,6 9,17 4,12"/>
                        </svg>
                      ) : (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
                          <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
                        </svg>
                      )}
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Share this URL with others to invite them to join this group
                  </p>
                </div>

                <div>
                  <label className="text-sm text-gray-600">Your Role</label>
                  <div className="flex items-center space-x-2">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      groupSettings.user_role === 'admin' 
                        ? 'bg-purple-100 text-purple-800' 
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {groupSettings.user_role === 'admin' ? '👑 Admin' : '👤 Member'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Members List */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium text-gray-700 uppercase tracking-wide">
                  Members ({groupSettings.members.length})
                </h4>
              </div>

              <div className="space-y-2">
                {groupSettings.members.map((member) => (
                  <div key={member.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-sm font-semibold">
                          {getInitials(member.user?.username || 'U')}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {member.user?.username || 'Unknown User'}
                        </p>
                        <p className="text-xs text-gray-500">
                          Joined {formatTimeAgo(member.created_at)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        member.role === 'admin' 
                          ? 'bg-purple-100 text-purple-800' 
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {member.role === 'admin' ? '👑 Admin' : '👤 Member'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Admin Actions */}
            {groupSettings.user_role === 'admin' && (
              <div className="border-t pt-6">
                <h4 className="text-sm font-medium text-gray-700 uppercase tracking-wide mb-3">
                  Admin Actions
                </h4>
                <div className="space-y-2">
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    disabled={isDeleting}
                    className="w-full flex items-center justify-center px-4 py-3 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors text-red-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mr-2">
                      <polyline points="3,6 5,6 21,6"/>
                      <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
                      <line x1="10" y1="11" x2="10" y2="17"/>
                      <line x1="14" y1="11" x2="14" y2="17"/>
                    </svg>
                    {isDeleting ? 'Deleting...' : 'Delete Group'}
                  </button>
                  <p className="text-xs text-gray-500 text-center">
                    This action cannot be undone. All content will be permanently deleted.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={showDeleteConfirm}
        title="Delete Group"
        message={`Are you sure you want to delete "${group.name}"? This action cannot be undone and all content in this group will be permanently deleted.`}
        confirmText="Delete Group"
        cancelText="Cancel"
        onConfirm={handleDeleteGroup}
        onCancel={() => setShowDeleteConfirm(false)}
        isDestructive={true}
      />
    </>
  );
};