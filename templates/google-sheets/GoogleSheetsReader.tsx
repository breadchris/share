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
      get: (params: {
        spreadsheetId: string;
        range: string;
      }) => Promise<{
        result: {
          values?: string[][];
        };
      }>;
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

interface SheetData {
  name: string;
  major: string;
}

interface ComponentState {
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  sheetData: SheetData[];
  gapiLoaded: boolean;
  gisLoaded: boolean;
  userProfile: GoogleJwtPayload | null;
}

const GoogleSheetsReader: React.FC = () => {
  // Configuration - replace with your actual credentials
  const CLIENT_ID = 'your-client-id.apps.googleusercontent.com';
  const API_KEY = 'your-api-key';
  const DISCOVERY_DOC = 'https://sheets.googleapis.com/$discovery/rest?version=v4';
  const SPREADSHEET_ID = 'your-spreadsheet-id';
  const RANGE = 'Sheet1!A1:Z100';

  const [state, setState] = useState<ComponentState>({
    isAuthenticated: false,
    isLoading: false,
    error: null,
    sheetData: [],
    gapiLoaded: false,
    gisLoaded: false,
    userProfile: null
  });

  const updateState = useCallback((updates: Partial<ComponentState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  const setError = useCallback((error: string | null) => {
    updateState({ error, isLoading: false });
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
        error: null 
      });
      
      await fetchSheetData();
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

  // Fetch data from Google Sheets
  const fetchSheetData = useCallback(async () => {
    if (!state.gapiLoaded || !window.gapi?.client?.sheets) {
      setError('Google Sheets API not available');
      return;
    }

    updateState({ isLoading: true, error: null });

    try {
      const response = await window.gapi.client.sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: RANGE
      });

      const values = response.result.values;
      if (!values || values.length === 0) {
        updateState({ sheetData: [], isLoading: false });
        return;
      }

      const sheetData: SheetData[] = values.map((row, index) => ({
        name: row[0] || `Row ${index + 1}`,
        major: row[1] || 'Unknown'
      }));

      updateState({ sheetData, isLoading: false });
    } catch (error) {
      setError(`Failed to fetch sheet data: ${error}`);
    }
  }, [state.gapiLoaded, SPREADSHEET_ID, RANGE, updateState, setError]);

  // Handle authentication
  const handleAuth = useCallback(() => {
    if (!state.gisLoaded || !window.google?.accounts?.id) {
      setError('Google Identity Services not loaded');
      return;
    }

    if (state.isAuthenticated) {
      // Refresh data
      fetchSheetData();
    } else {
      // Trigger Google Sign-In
      window.google.accounts.id.prompt();
    }
  }, [state.gisLoaded, state.isAuthenticated, fetchSheetData, setError]);

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
      sheetData: [], 
      userProfile: null,
      error: null 
    });
  }, [state.userProfile, updateState]);

  const canShowAuthButton = state.gapiLoaded && state.gisLoaded;

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Google Sheets Reader
          </h1>
          <p className="text-gray-600">
            Connect to Google Sheets and view your data
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

        {/* User Profile */}
        {state.userProfile && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
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
          </div>
        )}

        {/* Authentication Controls */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-center">
            <button
              onClick={handleAuth}
              disabled={!canShowAuthButton || state.isLoading}
              className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                canShowAuthButton && !state.isLoading
                  ? 'bg-blue-600 hover:bg-blue-700 text-white'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              {state.isLoading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Loading...
                </div>
              ) : state.isAuthenticated ? (
                'Refresh Data'
              ) : (
                'Authorize Google Sheets'
              )}
            </button>

            {state.isAuthenticated && (
              <button
                onClick={handleSignOut}
                className="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors"
              >
                Sign Out
              </button>
            )}
          </div>

          {!canShowAuthButton && !state.error && (
            <p className="text-center text-gray-500 mt-4">
              Loading Google APIs...
            </p>
          )}
        </div>

        {/* Data Display */}
        {state.sheetData.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">
                Spreadsheet Data
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                {state.sheetData.length} records found
              </p>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Major
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {state.sheetData.map((row, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {row.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {row.major}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Empty State */}
        {state.isAuthenticated && state.sheetData.length === 0 && !state.isLoading && !state.error && (
          <div className="text-center py-12">
            <div className="mx-auto h-12 w-12 text-gray-400">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No data found</h3>
            <p className="mt-1 text-sm text-gray-500">
              The spreadsheet appears to be empty or the range is invalid.
            </p>
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
                Replace CLIENT_ID and API_KEY with your actual Google Cloud credentials to enable functionality.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GoogleSheetsReader;