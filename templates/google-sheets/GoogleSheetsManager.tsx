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
      clear: (params: {
        spreadsheetId: string;
        range: string;
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

interface SheetData {
  id: string;
  name: string;
  email: string;
  message: string;
  timestamp: string;
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
  sheetData: SheetData[];
  formData: FormData;
  editingId: string | null;
  activeTab: 'read' | 'write' | 'manage';
}

const GoogleSheetsManager: React.FC = () => {
  // Configuration - replace with your actual credentials
  const CLIENT_ID = 'your-client-id.apps.googleusercontent.com';
  const API_KEY = 'your-api-key';
  const DISCOVERY_DOC = 'https://sheets.googleapis.com/$discovery/rest?version=v4';
  const SPREADSHEET_ID = 'your-spreadsheet-id';
  const RANGE = 'Sheet1!A:E'; // Columns A-E for id, name, email, message, timestamp

  const [state, setState] = useState<ComponentState>({
    isAuthenticated: false,
    isLoading: false,
    error: null,
    successMessage: null,
    gapiLoaded: false,
    gisLoaded: false,
    userProfile: null,
    sheetData: [],
    formData: {
      name: '',
      email: '',
      message: ''
    },
    editingId: null,
    activeTab: 'read'
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
        id: row[0] || `row-${index}`,
        name: row[1] || 'Unknown',
        email: row[2] || 'Unknown',
        message: row[3] || '',
        timestamp: row[4] || new Date().toISOString()
      }));

      updateState({ sheetData, isLoading: false });
    } catch (error) {
      setError(`Failed to fetch sheet data: ${error}`);
    }
  }, [state.gapiLoaded, SPREADSHEET_ID, RANGE, updateState, setError]);

  // Write data to Google Sheets
  const writeToSheet = useCallback(async (data: FormData) => {
    if (!state.gapiLoaded || !window.gapi?.client?.sheets) {
      setError('Google Sheets API not available');
      return;
    }

    updateState({ isLoading: true, error: null, successMessage: null });

    try {
      const id = Date.now().toString();
      const values = [[
        id,
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
      await fetchSheetData();
      
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
  }, [state.gapiLoaded, state.userProfile, SPREADSHEET_ID, RANGE, updateState, setError, setSuccess, fetchSheetData]);

  // Update existing row in Google Sheets
  const updateRow = useCallback(async (id: string, data: FormData) => {
    if (!state.gapiLoaded || !window.gapi?.client?.sheets) {
      setError('Google Sheets API not available');
      return;
    }

    updateState({ isLoading: true, error: null, successMessage: null });

    try {
      const rowIndex = state.sheetData.findIndex(row => row.id === id);
      if (rowIndex === -1) {
        setError('Row not found');
        return;
      }

      const range = `Sheet1!A${rowIndex + 1}:E${rowIndex + 1}`;
      const values = [[
        id,
        data.name,
        data.email,
        data.message,
        new Date().toISOString()
      ]];

      await window.gapi.client.sheets.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID,
        range: range,
        valueInputOption: 'RAW',
        resource: {
          values: values
        }
      });

      setSuccess('Row updated successfully!');
      await fetchSheetData();
      updateState({ editingId: null });
    } catch (error) {
      setError(`Failed to update row: ${error}`);
    }
  }, [state.gapiLoaded, state.sheetData, SPREADSHEET_ID, updateState, setError, setSuccess, fetchSheetData]);

  // Delete row from Google Sheets
  const deleteRow = useCallback(async (id: string) => {
    if (!state.gapiLoaded || !window.gapi?.client?.sheets) {
      setError('Google Sheets API not available');
      return;
    }

    updateState({ isLoading: true, error: null, successMessage: null });

    try {
      const rowIndex = state.sheetData.findIndex(row => row.id === id);
      if (rowIndex === -1) {
        setError('Row not found');
        return;
      }

      const range = `Sheet1!A${rowIndex + 1}:E${rowIndex + 1}`;
      await window.gapi.client.sheets.spreadsheets.values.clear({
        spreadsheetId: SPREADSHEET_ID,
        range: range
      });

      setSuccess('Row deleted successfully!');
      await fetchSheetData();
    } catch (error) {
      setError(`Failed to delete row: ${error}`);
    }
  }, [state.gapiLoaded, state.sheetData, SPREADSHEET_ID, updateState, setError, setSuccess, fetchSheetData]);

  // Handle authentication
  const handleAuth = useCallback(() => {
    if (!state.gisLoaded || !window.google?.accounts?.id) {
      setError('Google Identity Services not loaded');
      return;
    }

    window.google.accounts.id.prompt();
  }, [state.gisLoaded, setError]);

  // Handle sign out
  const handleSignOut = useCallback(() => {
    if (state.userProfile?.email) {
      window.google.accounts.id.revoke(state.userProfile.email, () => {
        console.log('User credentials revoked');
      });
    }
    
    updateState({ 
      isAuthenticated: false, 
      userProfile: null,
      sheetData: [],
      error: null,
      successMessage: null,
      editingId: null,
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

    if (state.editingId) {
      await updateRow(state.editingId, state.formData);
    } else {
      await writeToSheet(state.formData);
    }
  }, [state.formData, state.editingId, writeToSheet, updateRow, setError]);

  // Start editing a row
  const startEditing = useCallback((row: SheetData) => {
    updateState({
      editingId: row.id,
      formData: {
        name: row.name,
        email: row.email,
        message: row.message
      },
      activeTab: 'write'
    });
  }, [updateState]);

  // Cancel editing
  const cancelEditing = useCallback(() => {
    updateState({
      editingId: null,
      formData: {
        name: state.userProfile?.name || '',
        email: state.userProfile?.email || '',
        message: ''
      }
    });
  }, [state.userProfile, updateState]);

  const canShowAuthButton = state.gapiLoaded && state.gisLoaded;

  if (!state.isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Google Sheets Manager
            </h1>
            <p className="text-gray-600">
              Read, write, and manage your Google Sheets data
            </p>
          </div>

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
                Please sign in with Google to access your spreadsheet.
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
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Google Sheets Manager
          </h1>
          <p className="text-gray-600">
            Read, write, and manage your Google Sheets data
          </p>
        </div>

        {/* User Profile */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <img
                src={state.userProfile!.picture}
                alt="Profile"
                className="w-12 h-12 rounded-full"
              />
              <div>
                <h3 className="text-lg font-medium text-gray-900">
                  {state.userProfile!.name}
                </h3>
                <p className="text-sm text-gray-500">
                  {state.userProfile!.email}
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

        {/* Error/Success Messages */}
        {state.error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center">
              <svg className="h-5 w-5 text-red-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <span className="text-red-700">{state.error}</span>
            </div>
          </div>
        )}

        {state.successMessage && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center">
              <svg className="h-5 w-5 text-green-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="text-green-700">{state.successMessage}</span>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {(['read', 'write', 'manage'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => updateState({ activeTab: tab })}
                  className={`py-4 px-1 border-b-2 font-medium text-sm capitalize ${
                    state.activeTab === tab
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {tab} Data
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {/* Read Tab */}
            {state.activeTab === 'read' && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-gray-900">
                    Spreadsheet Data
                  </h2>
                  <button
                    onClick={fetchSheetData}
                    disabled={state.isLoading}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                  >
                    {state.isLoading ? 'Loading...' : 'Refresh'}
                  </button>
                </div>

                {state.sheetData.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Name
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Email
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Message
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Date
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {state.sheetData.map((row) => (
                          <tr key={row.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {row.name}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {row.email}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                              {row.message}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {new Date(row.timestamp).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                              <button
                                onClick={() => startEditing(row)}
                                className="text-blue-600 hover:text-blue-900"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => deleteRow(row.id)}
                                className="text-red-600 hover:text-red-900"
                              >
                                Delete
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-500">No data found in the spreadsheet.</p>
                  </div>
                )}
              </div>
            )}

            {/* Write Tab */}
            {state.activeTab === 'write' && (
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-6">
                  {state.editingId ? 'Edit Record' : 'Add New Record'}
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>

                  <div className="flex space-x-4">
                    <button
                      type="submit"
                      disabled={state.isLoading}
                      className="flex-1 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
                    >
                      {state.isLoading ? 'Saving...' : state.editingId ? 'Update Record' : 'Add Record'}
                    </button>
                    {state.editingId && (
                      <button
                        type="button"
                        onClick={cancelEditing}
                        className="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </form>
              </div>
            )}

            {/* Manage Tab */}
            {state.activeTab === 'manage' && (
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-6">
                  Manage Spreadsheet
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-blue-50 p-6 rounded-lg">
                    <h3 className="text-lg font-medium text-blue-900 mb-2">
                      Total Records
                    </h3>
                    <p className="text-3xl font-bold text-blue-600">
                      {state.sheetData.length}
                    </p>
                  </div>
                  
                  <div className="bg-green-50 p-6 rounded-lg">
                    <h3 className="text-lg font-medium text-green-900 mb-2">
                      Last Updated
                    </h3>
                    <p className="text-sm text-green-600">
                      {state.sheetData.length > 0
                        ? new Date(Math.max(...state.sheetData.map(row => new Date(row.timestamp).getTime()))).toLocaleString()
                        : 'No data'
                      }
                    </p>
                  </div>
                </div>

                <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <h3 className="text-sm font-medium text-yellow-800 mb-2">
                    Configuration
                  </h3>
                  <div className="text-sm text-yellow-700 space-y-1">
                    <p><strong>Spreadsheet ID:</strong> {SPREADSHEET_ID}</p>
                    <p><strong>Range:</strong> {RANGE}</p>
                    <p><strong>API Version:</strong> v4</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Configuration Notice */}
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-start">
            <svg className="h-5 w-5 text-yellow-400 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <div>
              <h3 className="text-sm font-medium text-yellow-800">
                Configuration Required
              </h3>
              <p className="text-sm text-yellow-700 mt-1">
                Replace CLIENT_ID, API_KEY, and SPREADSHEET_ID with your actual Google Cloud credentials.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GoogleSheetsManager;