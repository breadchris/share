import React, { useState, useRef, useEffect } from 'react';
import type { Group, CreateGroupRequest, JoinGroupRequest } from '../types';
import { createGroup, joinGroup, getErrorMessage } from '../utils/api';

interface GroupManagerProps {
  onGroupCreated: (group: Group) => void;
  onGroupJoined: (group: Group) => void;
  onClose: () => void;
  mode: 'create' | 'join';
}

export const GroupManager: React.FC<GroupManagerProps> = ({
  onGroupCreated,
  onGroupJoined,
  onClose,
  mode: initialMode,
}) => {
  const [mode, setMode] = useState<'create' | 'join'>(initialMode);
  const [formData, setFormData] = useState({
    name: '',
    joinCode: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdGroup, setCreatedGroup] = useState<Group | null>(null);

  const nameInputRef = useRef<HTMLInputElement>(null);
  const joinCodeInputRef = useRef<HTMLInputElement>(null);

  // Focus appropriate input when mode changes
  useEffect(() => {
    setTimeout(() => {
      if (mode === 'create') {
        nameInputRef.current?.focus();
      } else {
        joinCodeInputRef.current?.focus();
      }
    }, 100);
  }, [mode]);

  const resetForm = () => {
    setFormData({ name: '', joinCode: '' });
    setError(null);
    setCreatedGroup(null);
  };

  const handleModeSwitch = (newMode: 'create' | 'join') => {
    setMode(newMode);
    resetForm();
  };

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      setError('Group name is required');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const request: CreateGroupRequest = {
        name: formData.name.trim(),
      };
      
      const group = await createGroup(request);
      setCreatedGroup(group);
      onGroupCreated(group);
    } catch (error) {
      setError(getErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleJoinGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.joinCode.trim()) {
      setError('Join code is required');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const request: JoinGroupRequest = {
        join_code: formData.joinCode.trim().toUpperCase(),
      };
      
      const group = await joinGroup(request);
      onGroupJoined(group);
      onClose();
    } catch (error) {
      setError(getErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatJoinCode = (code: string): string => {
    return code.toUpperCase().replace(/[^A-Z0-9]/g, '').substring(0, 6);
  };

  const handleJoinCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatJoinCode(e.target.value);
    setFormData(prev => ({ ...prev, joinCode: formatted }));
  };

  const copyJoinCode = async () => {
    if (createdGroup?.join_code && navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(createdGroup.join_code);
        // Could add a toast notification here
      } catch (error) {
        console.error('Failed to copy join code:', error);
      }
    }
  };

  const shareGroup = async () => {
    if (createdGroup && navigator.share) {
      try {
        await navigator.share({
          title: `Join ${createdGroup.name}`,
          text: `Join my group "${createdGroup.name}" with code: ${createdGroup.join_code}`,
          url: window.location.href,
        });
      } catch (error) {
        console.error('Failed to share:', error);
        // Fallback to copy
        copyJoinCode();
      }
    } else {
      copyJoinCode();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
      <div className="w-full max-w-md mx-4 bg-white rounded-lg shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {mode === 'create' ? 'Create Group' : 'Join Group'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl"
          >
            ✕
          </button>
        </div>

        {/* Mode Switcher */}
        <div className="flex p-1 m-6 bg-gray-100 rounded-lg">
          <button
            onClick={() => handleModeSwitch('create')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              mode === 'create'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Create New
          </button>
          <button
            onClick={() => handleModeSwitch('join')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              mode === 'join'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Join Existing
          </button>
        </div>

        {/* Content */}
        <div className="p-6 pt-0">
          {/* Error Display */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          {/* Success State - Created Group */}
          {createdGroup && (
            <div className="text-center space-y-4">
              <div className="text-6xl">🎉</div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Group Created!
                </h3>
                <p className="text-gray-600">
                  Share the join code with others
                </p>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-sm text-gray-600 mb-1">Group Name</div>
                <div className="font-semibold text-gray-900 mb-3">
                  {createdGroup.name}
                </div>
                
                <div className="text-sm text-gray-600 mb-1">Join Code</div>
                <div className="flex items-center justify-center space-x-2">
                  <span className="text-2xl font-mono font-bold text-blue-600 tracking-wider">
                    {createdGroup.join_code}
                  </span>
                  <button
                    onClick={copyJoinCode}
                    className="p-1 text-gray-400 hover:text-gray-600"
                    title="Copy join code"
                  >
                    📋
                  </button>
                </div>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={shareGroup}
                  className="flex-1 py-2 px-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
                >
                  Share Group
                </button>
                <button
                  onClick={onClose}
                  className="flex-1 py-2 px-4 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  Done
                </button>
              </div>
            </div>
          )}

          {/* Create Group Form */}
          {mode === 'create' && !createdGroup && (
            <form onSubmit={handleCreateGroup} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Group Name
                </label>
                <input
                  ref={nameInputRef}
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter group name..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  maxLength={50}
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Choose a name that others will recognize
                </p>
              </div>

              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-2 px-4 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!formData.name.trim() || isSubmitting}
                  className="flex-1 py-2 px-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium"
                >
                  {isSubmitting ? 'Creating...' : 'Create Group'}
                </button>
              </div>
            </form>
          )}

          {/* Join Group Form */}
          {mode === 'join' && (
            <form onSubmit={handleJoinGroup} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Join Code
                </label>
                <input
                  ref={joinCodeInputRef}
                  type="text"
                  value={formData.joinCode}
                  onChange={handleJoinCodeChange}
                  placeholder="Enter 6-character code..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-center text-lg font-mono tracking-wider uppercase"
                  maxLength={6}
                  style={{ letterSpacing: '0.1em' }}
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Enter the code shared by the group admin
                </p>
              </div>

              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-2 px-4 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formData.joinCode.length !== 6 || isSubmitting}
                  className="flex-1 py-2 px-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium"
                >
                  {isSubmitting ? 'Joining...' : 'Join Group'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};