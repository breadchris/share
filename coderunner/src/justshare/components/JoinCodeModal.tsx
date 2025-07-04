import React, { useRef, useEffect, useState } from 'react';
import type { Group } from '../types';

export interface JoinCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  group: Group | null;
}

export const JoinCodeModal: React.FC<JoinCodeModalProps> = ({
  isOpen,
  onClose,
  group,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);
  const [urlCopied, setUrlCopied] = useState(false);

  // Close modal when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
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

  // Close modal on escape key
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

  // Reset copied state when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setCopied(false);
      setUrlCopied(false);
    }
  }, [isOpen]);

  const handleCopyCode = async () => {
    if (!group?.join_code) return;

    try {
      await navigator.clipboard.writeText(group.join_code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy join code:', err);
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = group.join_code;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleCopyJoinUrl = async () => {
    if (!group?.join_code) return;

    const currentDomain = window.location.origin;
    const joinUrl = `${currentDomain}/justshare/?join=${encodeURIComponent(group.join_code)}`;

    try {
      await navigator.clipboard.writeText(joinUrl);
      setUrlCopied(true);
      setTimeout(() => setUrlCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy join URL:', err);
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = joinUrl;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setUrlCopied(true);
      setTimeout(() => setUrlCopied(false), 2000);
    }
  };

  if (!isOpen || !group) return null;

  // Generate QR code URL that points to the join API endpoint
  const currentDomain = window.location.origin;
  const qrCodeUrl = `${currentDomain}/justshare/api/join?code=${encodeURIComponent(group.join_code)}`;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 transition-opacity duration-200" />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          ref={modalRef}
          className="bg-white rounded-lg shadow-xl max-w-sm w-full max-h-[90vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Share Group</h2>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-gray-100 transition-colors"
              aria-label="Close modal"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-gray-600">
                <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Group Info */}
            <div className="text-center">
              <h3 className="text-xl font-semibold text-gray-900 mb-1">{group.name}</h3>
              <p className="text-sm text-gray-600">
                Share this code or QR code with others to invite them to join
              </p>
            </div>

            {/* QR Code */}
            <div className="flex justify-center">
              <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                <p>todo</p>
              </div>
            </div>

            {/* Join Code */}
            <div className="space-y-3">
              <div className="text-center">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Join Code
                </label>
                <div className="flex items-center justify-center space-x-2">
                  <code className="bg-gray-100 px-4 py-2 rounded-lg text-xl font-mono text-gray-900 tracking-widest">
                    {group.join_code}
                  </code>
                  <button
                    onClick={handleCopyCode}
                    className={`p-2 rounded-lg transition-colors ${
                      copied 
                        ? 'bg-green-100 text-green-600' 
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                    title={copied ? 'Copied!' : 'Copy join code'}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-current">
                      {copied ? (
                        <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      ) : (
                        <>
                          <rect x="9" y="9" width="13" height="13" rx="2" ry="2" stroke="currentColor" strokeWidth="2" fill="none"/>
                          <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" stroke="currentColor" strokeWidth="2" fill="none"/>
                        </>
                      )}
                    </svg>
                  </button>
                </div>
              </div>
              
              {copied && (
                <div className="text-center">
                  <span className="text-sm text-green-600 font-medium">Copied to clipboard!</span>
                </div>
              )}

              {/* Copy Join URL Button */}
              <div className="text-center">
                <button
                  onClick={handleCopyJoinUrl}
                  className={`px-4 py-2 rounded-lg transition-colors font-medium ${
                    urlCopied 
                      ? 'bg-green-100 text-green-700 border border-green-200' 
                      : 'bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200'
                  }`}
                  title={urlCopied ? 'Join URL copied!' : 'Copy join URL'}
                >
                  <div className="flex items-center justify-center space-x-2">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-current">
                      {urlCopied ? (
                        <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      ) : (
                        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      )}
                    </svg>
                    <span>{urlCopied ? 'Join URL Copied!' : 'Copy Join URL'}</span>
                  </div>
                </button>
              </div>

              {urlCopied && (
                <div className="text-center">
                  <span className="text-sm text-green-600 font-medium">Join URL copied to clipboard!</span>
                </div>
              )}
            </div>

            {/* Instructions */}
            <div className="bg-blue-50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-blue-900 mb-2">How to join:</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li className="flex items-start space-x-2">
                  <span className="flex-shrink-0 w-5 h-5 bg-blue-200 rounded-full flex items-center justify-center text-xs font-bold text-blue-900 mt-0.5">1</span>
                  <span>Scan the QR code with your camera app</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="flex-shrink-0 w-5 h-5 bg-blue-200 rounded-full flex items-center justify-center text-xs font-bold text-blue-900 mt-0.5">2</span>
                  <span>Or manually enter the join code in the app</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="flex-shrink-0 w-5 h-5 bg-blue-200 rounded-full flex items-center justify-center text-xs font-bold text-blue-900 mt-0.5">3</span>
                  <span>Start sharing content together!</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-lg">
            <button
              onClick={onClose}
              className="w-full py-2 px-4 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </>
  );
};