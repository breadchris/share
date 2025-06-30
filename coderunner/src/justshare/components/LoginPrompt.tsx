import React from 'react';
import { loginWithGoogle } from '../utils/auth';

export interface LoginPromptProps {
  onLogin?: () => void;
}

export const LoginPrompt: React.FC<LoginPromptProps> = ({ onLogin }) => {
  const handleGoogleLogin = () => {
    if (onLogin) {
      onLogin();
    }
    loginWithGoogle();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full text-center">
        {/* App Icon */}
        <div className="text-6xl mb-6">📱</div>
        
        {/* Title */}
        <h1 className="text-3xl font-bold text-gray-900 mb-2">JustShare</h1>
        <p className="text-gray-600 mb-8">
          Capture and share content instantly with your groups
        </p>
        
        {/* Features */}
        <div className="mb-8 space-y-3 text-left">
          <div className="flex items-center space-x-3">
            <div className="text-xl">📝</div>
            <span className="text-gray-700">Capture text, images, and audio</span>
          </div>
          <div className="flex items-center space-x-3">
            <div className="text-xl">👥</div>
            <span className="text-gray-700">Share with private groups</span>
          </div>
          <div className="flex items-center space-x-3">
            <div className="text-xl">🔗</div>
            <span className="text-gray-700">Share URLs and videos</span>
          </div>
          <div className="flex items-center space-x-3">
            <div className="text-xl">🏷️</div>
            <span className="text-gray-700">Organize with tags</span>
          </div>
        </div>
        
        {/* Login Button */}
        <button
          onClick={handleGoogleLogin}
          className="w-full bg-white border border-gray-300 rounded-lg px-6 py-3 text-gray-700 font-medium hover:bg-gray-50 transition-colors flex items-center justify-center space-x-3 shadow-sm"
        >
          <svg width="20" height="20" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          <span>Continue with Google</span>
        </button>
        
        {/* Privacy Notice */}
        <p className="text-xs text-gray-500 mt-6">
          By continuing, you agree to our terms of service and privacy policy.
          Your data is secured and never shared with third parties.
        </p>
      </div>
    </div>
  );
};