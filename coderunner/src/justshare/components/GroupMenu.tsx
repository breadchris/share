import React, { useEffect, useRef } from 'react';

export interface GroupMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateGroup: () => void;
  onJoinGroup: () => void;
}

export const GroupMenu: React.FC<GroupMenuProps> = ({
  isOpen,
  onClose,
  onCreateGroup,
  onJoinGroup,
}) => {
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
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

  // Close menu on escape key
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

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-25 z-40 transition-opacity duration-200"
          onClick={onClose}
        />
      )}

      {/* Sliding Menu */}
      <div
        ref={menuRef}
        className={`fixed top-0 right-0 h-full w-80 max-w-[85vw] bg-white shadow-xl z-50 transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Group Options</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
            aria-label="Close menu"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-gray-600">
              <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        {/* Menu Content */}
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

          {/* Additional Actions (Future) */}
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
                <div className="text-sm">Leave Group</div>
              </button>
              <button
                disabled
                className="w-full flex items-center p-3 text-gray-400 cursor-not-allowed"
              >
                <div className="flex items-center justify-center w-8 h-8 bg-gray-100 rounded-full mr-3">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-gray-400">
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M12 9v4M12 17h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                </div>
                <div className="text-sm">Group Settings</div>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 bg-gray-50">
          <div className="text-xs text-gray-500 text-center">
            Swipe left/right on group pills to switch groups quickly
          </div>
        </div>
      </div>
    </>
  );
};