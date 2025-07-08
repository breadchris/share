import React, { useRef, useEffect, useCallback, useState } from 'react';
import type { GroupSelectorProps, Group } from '../types';
import { AppSidebar } from './AppSidebar';
import { JoinCodeModal } from './JoinCodeModal';

export const GroupSelector: React.FC<GroupSelectorProps> = ({
  groups,
  currentGroup,
  currentUser,
  onGroupSelect,
  onCreateGroup,
  onJoinGroup,
  showContentCapture = true,
  onToggleContentCapture,
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isJoinCodeModalOpen, setIsJoinCodeModalOpen] = useState(false);

  // Scroll to active group when it changes
  useEffect(() => {
    if (currentGroup && scrollContainerRef.current) {
      const activeButton = scrollContainerRef.current.querySelector(
        `[data-group-id="${currentGroup.id}"]`
      ) as HTMLElement;
      
      if (activeButton) {
        activeButton.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
          inline: 'center',
        });
      }
    }
  }, [currentGroup]);


  const formatGroupName = (name: string | undefined): string => {
    if (!name) return 'Unnamed';
    return name.length > 12 ? `${name.substring(0, 12)}...` : name;
  };

  return (
    <div className="bg-white border-b border-gray-200">
      {/* Compact Group Bar */}
      <div className="flex items-center px-4 py-2">
        {/* Groups Pills */}
        <div
          ref={scrollContainerRef}
          className="flex-1 flex space-x-2 overflow-x-auto scrollbar-hide"
          style={{
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            WebkitOverflowScrolling: 'touch',
          }}
        >
          {groups.map((group) => {
            const isActive = currentGroup?.id === group.id;
            
            return (
              <button
                key={group.id}
                data-group-id={group.id}
                onClick={() => onGroupSelect(group)}
                className={`flex items-center px-3 py-2 rounded-full whitespace-nowrap text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-blue-500 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <span className="mr-1">👥</span>
                {formatGroupName(group.name)}
              </button>
            );
          })}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-2 ml-3">
          {/* Content Capture Toggle */}
          {onToggleContentCapture && (
            <button
              onClick={onToggleContentCapture}
              className={`p-2 rounded-full transition-colors ${
                showContentCapture 
                  ? 'bg-blue-100 text-blue-600 hover:bg-blue-200'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
              title={showContentCapture ? 'Hide input bar (I)' : 'Show input bar (I)'}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-current">
                {showContentCapture ? (
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8zM12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                ) : (
                  <>
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M1 1l22 22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </>
                )}
              </svg>
            </button>
          )}
          
          {/* Settings Menu Button */}
          <button
            onClick={() => setIsMenuOpen(true)}
            className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
            title="Settings and profile"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-gray-600">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Current Group Info (Compact) */}
      {currentGroup && (
        <div className="px-4 pb-2">
          <div className="flex items-center justify-between">
            <span className="text-lg font-semibold text-gray-900">
              {currentGroup.name}
            </span>
            <button 
              className="flex items-center space-x-1 text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded hover:bg-gray-200 transition-colors"
              onClick={() => setIsJoinCodeModalOpen(true)}
              title="Show join code and QR code"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="text-current">
                <rect x="3" y="3" width="5" height="5" stroke="currentColor" strokeWidth="2" fill="none"/>
                <rect x="3" y="16" width="5" height="5" stroke="currentColor" strokeWidth="2" fill="none"/>
                <rect x="16" y="3" width="5" height="5" stroke="currentColor" strokeWidth="2" fill="none"/>
                <rect x="5" y="5" width="1" height="1" fill="currentColor"/>
                <rect x="5" y="18" width="1" height="1" fill="currentColor"/>
                <rect x="18" y="5" width="1" height="1" fill="currentColor"/>
                <path d="M13 13l8 8M21 13v8h-8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span>Share</span>
            </button>
          </div>
        </div>
      )}

      {/* Empty State */}
      {groups.length === 0 && (
        <div className="text-center py-8 px-4">
          <div className="text-4xl mb-3">👥</div>
          <h3 className="font-medium text-gray-900 mb-1">No groups yet</h3>
          <p className="text-sm text-gray-600 mb-4">Create or join a group to start sharing</p>
          
          <div className="flex justify-center space-x-3">
            <button
              onClick={onCreateGroup}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm font-medium"
            >
              Create Group
            </button>
            <button
              onClick={onJoinGroup}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
            >
              Join Group
            </button>
          </div>
        </div>
      )}

      {/* App Sidebar */}
      <AppSidebar
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        onCreateGroup={onCreateGroup}
        onJoinGroup={onJoinGroup}
        currentUser={currentUser}
      />

      {/* Join Code Modal */}
      <JoinCodeModal
        isOpen={isJoinCodeModalOpen}
        onClose={() => setIsJoinCodeModalOpen(false)}
        group={currentGroup}
      />
    </div>
  );
};

// Add styles for hiding scrollbars
const scrollbarHideStyles = `
.scrollbar-hide {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
.scrollbar-hide::-webkit-scrollbar {
  display: none;
}
`;

// Inject styles if not already present
if (typeof document !== 'undefined' && !document.querySelector('#scrollbar-hide-styles')) {
  const style = document.createElement('style');
  style.id = 'scrollbar-hide-styles';
  style.textContent = scrollbarHideStyles;
  document.head.appendChild(style);
}