// Authentication utilities for JustShare
import { getErrorMessage } from './api';

// Type declarations for iOS WebKit message handlers
declare global {
  interface Window {
    webkit?: {
      messageHandlers?: {
        authHandler?: {
          postMessage: (message: any) => void;
        };
      };
    };
  }
}

const API_BASE = '/api';

export interface User {
  id: string;
  username: string;
  email?: string;
  created_at: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  isLoading: boolean;
}

/**
 * Check current authentication status by making a request to a protected endpoint
 */
export async function checkAuthStatus(): Promise<AuthState> {
  try {
    const response = await fetch(`${API_BASE}/auth/user`, {
      method: 'GET',
      credentials: 'include',
    });
    
    if (response.ok) {
      const user = await response.json();
      return {
        isAuthenticated: true,
        user,
        isLoading: false,
      };
    } else {
      return {
        isAuthenticated: false,
        user: null,
        isLoading: false,
      };
    }
  } catch (error) {
    console.error('Auth check failed:', error);
    return {
      isAuthenticated: false,
      user: null,
      isLoading: false,
    };
  }
}

/**
 * Initiate Google OAuth login by redirecting to the auth endpoint
 * Detects if running in iOS WebView and triggers native authentication
 */
export function loginWithGoogle(): void {
  // Check if running in iOS WebView with our native message handlers
  if (window.webkit?.messageHandlers?.authHandler) {
    console.log('Detected iOS WebView, triggering native authentication');
    
    // Trigger native iOS authentication flow
    window.webkit.messageHandlers.authHandler.postMessage({
      type: 'googleAuth',
      authURL: '/auth/google'
    });
  } else {
    console.log('Using standard web OAuth flow');
    
    // Standard web OAuth redirect for browsers
    window.location.href = '/auth/google';
  }
}

/**
 * Logout the current user
 */
export async function logout(): Promise<void> {
  try {
    await fetch(`${API_BASE}/auth/logout`, {
      method: 'POST',
      credentials: 'include',
    });
    
    // Redirect to home or refresh the page to clear state
    window.location.href = '/justshare/';
  } catch (error) {
    console.error('Logout failed:', error);
    // Still redirect even if logout request failed
    window.location.href = '/justshare/';
  }
}

/**
 * Get current user information
 */
export async function getCurrentUser(): Promise<User | null> {
  try {
    const response = await fetch(`${API_BASE}/auth/user`, {
      method: 'GET',
      credentials: 'include',
    });
    
    if (response.ok) {
      return await response.json();
    } else {
      return null;
    }
  } catch (error) {
    console.error('Failed to get current user:', error);
    return null;
  }
}

/**
 * Check if an error response indicates authentication failure
 */
export function isAuthError(error: any): boolean {
  if (typeof error === 'string') {
    return error.toLowerCase().includes('unauthorized') || 
           error.toLowerCase().includes('unauthenticated');
  }
  
  if (error && typeof error === 'object') {
    const message = error.message || error.error || '';
    return message.toLowerCase().includes('unauthorized') || 
           message.toLowerCase().includes('unauthenticated');
  }
  
  return false;
}

/**
 * Handle authentication errors by redirecting to login
 */
export function handleAuthError(): void {
  console.log('Authentication required, redirecting to login...');
  loginWithGoogle();
}

/**
 * Authentication hook for React components
 */
export function useAuthRedirect() {
  return {
    handleError: (error: any) => {
      if (isAuthError(error)) {
        handleAuthError();
      }
    }
  };
}