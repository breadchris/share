import React, { useState, useEffect, useCallback } from 'react';

// TypeScript interfaces for Google Identity Services
interface CredentialResponse {
  credential: string; // JWT ID token
  select_by: string; // How user selected the credential
}

interface IdConfiguration {
  client_id: string;
  callback: (response: CredentialResponse) => void;
  auto_select?: boolean;
  cancel_on_tap_outside?: boolean;
  context?: string;
}

interface GoogleClient {
  init: (config: {
    apiKey: string;
    discoveryDocs: string[];
  }) => Promise<void>;
  load: (api: string, callback: () => void) => void;
  setToken: (token: { access_token: string } | null) => void;
  getToken: () => { access_token: string } | null;
}

interface GoogleSheets {
  spreadsheets: {
    values: {
      update: (params: {
        spreadsheetId: string;
        range: string;
        valueInputOption: string;
        resource: {
          values: any[][];
        };
      }) => Promise<any>;
      append: (params: {
        spreadsheetId: string;
        range: string;
        valueInputOption: string;
        resource: {
          values: any[][];
        };
      }) => Promise<any>;
      batchUpdate: (params: {
        spreadsheetId: string;
        resource: {
          data: Array<{
            range: string;
            values: any[][];
          }>;
          valueInputOption: string;
        };
      }) => Promise<any>;
    };
  };
}

interface GoogleAPI {
  client: GoogleClient & { sheets: GoogleSheets };
}

// JWT payload structure for Google ID tokens
interface GoogleJwtPayload {
  iss: string;
  sub: string;
  aud: string;
  exp: number;
  iat: number;
  email: string;
  email_verified: boolean;
  name: string;
  picture: string;
  given_name: string;
  family_name: string;
  hd?: string; // Hosted domain
}

declare global {
  interface Window {
    gapi: GoogleAPI;
    google: {
      accounts: {
        id: {
          initialize: (config: IdConfiguration) => void;
          prompt: (momentListener?: (notification: any) => void) => void;
          renderButton: (parent: HTMLElement, options: any) => void;
          disableAutoSelect: () => void;
          storeCredential: (credential: any) => void;
          cancel: () => void;
          revoke: (email: string, callback: (response: any) => void) => void;
        };
      };
    };
  }
}

interface FormData {
  name: string;
  email: string;
  message: string;
}

interface ComponentState {
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  successMessage: string | null;
  gapiLoaded: boolean;
  gisLoaded: boolean;
  userProfile: GoogleJwtPayload | null;
  formData: FormData;
}

const GoogleSheetsWriter: React.FC = () => {
  // Configuration - replace with your actual credentials
  const CLIENT_ID = 'your-client-id.apps.googleusercontent.com';
  const API_KEY = 'your-api-key';
  const DISCOVERY_DOC = 'https://sheets.googleapis.com/$discovery/rest?version=v4';
  const SPREADSHEET_ID = 'your-spreadsheet-id';
  const RANGE = 'Sheet1!A:C'; // Columns A, B, C for name, email, message

  const [state, setState] = useState<ComponentState>({
    isAuthenticated: false,
    isLoading: false,
    error: null,
    successMessage: null,
    gapiLoaded: false,
    gisLoaded: false,
    userProfile: null,
    formData: {
      name: '',
      email: '',
      message: ''
    }
  });

  const updateState = useCallback((updates: Partial<ComponentState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  const setError = useCallback((error: string | null) => {
    updateState({ error, isLoading: false });
  }, [updateState]);

  const setSuccess = useCallback((message: string | null) => {
    updateState({ successMessage: message, isLoading: false });
  }, [updateState]);

  // Decode JWT token to get user profile
  const decodeJwtToken = useCallback((token: string): GoogleJwtPayload | null => {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => 
        '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
      ).join(''));
      return JSON.parse(jsonPayload);
    } catch (error) {
      setError('Failed to decode user token');
      return null;
    }
  }, [setError]);

  // Initialize Google API Client
  const initializeGapi = useCallback(async () => {
    try {
      if (!window.gapi) {
        setError('Google API not loaded');
        return;
      }

      await window.gapi.client.init({
        apiKey: API_KEY,
        discoveryDocs: [DISCOVERY_DOC]
      });

      updateState({ gapiLoaded: true });
    } catch (error) {
      setError(`Failed to initialize Google API: ${JSON.stringify(error)}`);
    }
  }, [API_KEY, DISCOVERY_DOC, updateState, setError]);

  // Handle credential response from Google Identity Services
  const handleCredentialResponse = useCallback(async (response: CredentialResponse) => {
    try {
      const userProfile = decodeJwtToken(response.credential);
      if (!userProfile) {
        setError('Failed to decode user credentials');
        return;
      }

      updateState({ 
        isAuthenticated: true, 
        userProfile,
        error: null,
        formData: {
          name: userProfile.name,
          email: userProfile.email,
          message: ''
        }
      });
    } catch (error) {
      setError(`Authentication error: ${error}`);
    }
  }, [decodeJwtToken, updateState, setError]);

  // Initialize Google Identity Services
  const initializeGis = useCallback(() => {
    try {
      if (!window.google?.accounts?.id) {
        setError('Google Identity Services not loaded');
        return;
      }

      window.google.accounts.id.initialize({
        client_id: CLIENT_ID,
        callback: handleCredentialResponse,
        auto_select: false,
        cancel_on_tap_outside: true
      });

      updateState({ gisLoaded: true });
    } catch (error) {
      setError(`Failed to initialize Google Identity Services: ${error}`);
    }
  }, [CLIENT_ID, handleCredentialResponse, updateState, setError]);

  // Load Google APIs
  useEffect(() => {
    const loadGapi = () => {
      if (window.gapi) {
        window.gapi.load('client', initializeGapi);
      } else {
        // Create script tag for Google API
        const script = document.createElement('script');
        script.src = 'https://apis.google.com/js/api.js';
        script.onload = () => window.gapi.load('client', initializeGapi);
        script.onerror = () => setError('Failed to load Google API script');
        document.head.appendChild(script);
      }
    };

    const loadGis = () => {
      if (window.google?.accounts?.id) {
        initializeGis();
      } else {
        // Create script tag for Google Identity Services
        const script = document.createElement('script');
        script.src = 'https://accounts.google.com/gsi/client';
        script.onload = initializeGis;
        script.onerror = () => setError('Failed to load Google Identity Services script');
        document.head.appendChild(script);
      }
    };

    loadGapi();
    loadGis();
  }, [initializeGapi, initializeGis, setError]);

  // Write data to Google Sheets
  const writeToSheet = useCallback(async (data: FormData) => {
    if (!state.gapiLoaded || !window.gapi?.client?.sheets) {
      setError('Google Sheets API not available');
      return;
    }

    updateState({ isLoading: true, error: null, successMessage: null });

    try {
      const values = [[
        data.name,
        data.email,
        data.message,
        new Date().toISOString()
      ]];

      await window.gapi.client.sheets.spreadsheets.values.append({
        spreadsheetId: SPREADSHEET_ID,
        range: RANGE,
        valueInputOption: 'RAW',
        resource: {
          values: values
        }
      });

      setSuccess('Data successfully written to Google Sheets!');
      
      // Reset form
      updateState({
        formData: {
          name: state.userProfile?.name || '',
          email: state.userProfile?.email || '',
          message: ''
        }
      });
    } catch (error) {
      setError(`Failed to write to sheet: ${error}`);
    }
  }, [state.gapiLoaded, state.userProfile, SPREADSHEET_ID, RANGE, updateState, setError, setSuccess]);

  // Handle authentication
  const handleAuth = useCallback(() => {
    if (!state.gisLoaded || !window.google?.accounts?.id) {
      setError('Google Identity Services not loaded');
      return;
    }

    // Trigger Google Sign-In
    window.google.accounts.id.prompt();
  }, [state.gisLoaded, setError]);

  // Handle sign out
  const handleSignOut = useCallback(() => {
    if (state.userProfile?.email) {
      // Revoke the user's credentials
      window.google.accounts.id.revoke(state.userProfile.email, () => {
        console.log('User credentials revoked');
      });
    }
    
    // Clear local state
    updateState({ 
      isAuthenticated: false, 
      userProfile: null,
      error: null,
      successMessage: null,
      formData: {
        name: '',
        email: '',
        message: ''
      }
    });
  }, [state.userProfile, updateState]);

  // Handle form input changes
  const handleInputChange = useCallback((field: keyof FormData, value: string) => {
    updateState({
      formData: {
        ...state.formData,
        [field]: value
      }
    });
  }, [state.formData, updateState]);

  // Handle form submission
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!state.formData.name || !state.formData.email || !state.formData.message) {
      setError('Please fill in all fields');
      return;
    }

    await writeToSheet(state.formData);
  }, [state.formData, writeToSheet, setError]);

  const canShowAuthButton = state.gapiLoaded && state.gisLoaded;

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Google Sheets Writer
          </h1>
          <p className="text-gray-600">
            Submit data directly to Google Sheets
          </p>
        </div>

        {/* Error Display */}
        {state.error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <p className="text-sm text-red-700 mt-1">{state.error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Success Display */}
        {state.successMessage && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-green-800">Success</h3>
                <p className="text-sm text-green-700 mt-1">{state.successMessage}</p>
              </div>
            </div>
          </div>
        )}

        {/* User Profile */}
        {state.userProfile && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <img
                  src={state.userProfile.picture}
                  alt="Profile"
                  className="w-12 h-12 rounded-full"
                />
                <div>
                  <h3 className="text-lg font-medium text-gray-900">
                    {state.userProfile.name}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {state.userProfile.email}
                  </p>
                </div>
              </div>
              <button
                onClick={handleSignOut}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors"
              >
                Sign Out
              </button>
            </div>
          </div>
        )}

        {/* Authentication or Form */}
        {!state.isAuthenticated ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="text-center">
              <div className="mb-4">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Authentication Required
              </h3>
              <p className="text-gray-600 mb-6">
                Please sign in with Google to submit data to your spreadsheet.
              </p>
              <button
                onClick={handleAuth}
                disabled={!canShowAuthButton}
                className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                  canShowAuthButton
                    ? 'bg-blue-600 hover:bg-blue-700 text-white'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                {canShowAuthButton ? 'Sign In with Google' : 'Loading...'}
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">
              Submit Data to Google Sheets
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                  Name
                </label>
                <input
                  type="text"
                  id="name"
                  value={state.formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter your name"
                  required
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  value={state.formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter your email"
                  required
                />
              </div>

              <div>
                <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                  Message
                </label>
                <textarea
                  id="message"
                  value={state.formData.message}
                  onChange={(e) => handleInputChange('message', e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter your message"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={state.isLoading}
                className={`w-full px-6 py-3 rounded-lg font-medium transition-colors ${
                  state.isLoading
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-green-600 hover:bg-green-700 text-white'
                }`}
              >
                {state.isLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Writing to Sheet...
                  </div>
                ) : (
                  'Submit to Google Sheets'
                )}
              </button>
            </form>
          </div>
        )}

        {/* Configuration Notice */}
        <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">
                Configuration Required
              </h3>
              <p className="text-sm text-yellow-700 mt-1">
                Replace CLIENT_ID, API_KEY, and SPREADSHEET_ID with your actual Google Cloud credentials to enable functionality.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GoogleSheetsWriter;