import React, { useState, useEffect } from "https://esm.sh/react@18";
import { ChevronDown, Loader2, FileSpreadsheet, Sparkles, ExternalLink, AlertCircle } from "https://esm.sh/lucide-react@0.263.1";

interface GoogleSheet {
  id: string;
  name: string;
  modifiedTime: string;
}

interface BuildStatus {
  status: 'idle' | 'authenticating' | 'building' | 'success' | 'error';
  message: string;
  progress?: number;
  sessionId?: string;
  appUrl?: string;
}

const AppBuilder: React.FC = () => {
  const [appDescription, setAppDescription] = useState('');
  const [sheets, setSheets] = useState<GoogleSheet[]>([]);
  const [selectedSheet, setSelectedSheet] = useState<GoogleSheet | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [showSheetSelector, setShowSheetSelector] = useState(false);
  const [buildStatus, setBuildStatus] = useState<BuildStatus>({
    status: 'idle',
    message: ''
  });

  // Google OAuth configuration
  const GOOGLE_CLIENT_ID = '173804678799-cddgsahit061vf4rdprhtlermd7cckj1.apps.googleusercontent.com';
  const REDIRECT_URI = `${window.location.origin}/auth/google/callback`;
  const SCOPES = 'https://www.googleapis.com/auth/spreadsheets.readonly https://www.googleapis.com/auth/drive.readonly';

  // Check for existing authentication and handle OAuth callback
  useEffect(() => {
    const token = localStorage.getItem('google_access_token');
    if (token) {
      setAccessToken(token);
      setIsAuthenticated(true);
    }

    // Check for OAuth parameters in URL
    const params = new URLSearchParams(window.location.search);
    const accessToken = params.get('access_token');
    const code = params.get('code');
    const error = params.get('error');
    
    if (error) {
      setBuildStatus({
        status: 'error',
        message: `Authentication failed: ${error}`
      });
      // Clean up URL
      window.history.replaceState({}, '', window.location.pathname);
    } else if (accessToken) {
      // Direct access token from OAuth callback
      setAccessToken(accessToken);
      setIsAuthenticated(true);
      localStorage.setItem('google_access_token', accessToken);
      
      setBuildStatus({
        status: 'idle',
        message: ''
      });
      
      // Clean up URL by removing query parameters
      window.history.replaceState({}, '', window.location.pathname);
    } else if (code) {
      // Legacy: Exchange code for token (fallback)
      exchangeCodeForToken(code);
    }
  }, []);

  const initiateGoogleAuth = () => {
    // Encode the current page URL as the final redirect destination
    const finalRedirect = encodeURIComponent(window.location.href.split('?')[0]); // Remove any existing query params
    window.location.href = `/auth/google?final_redirect=${finalRedirect}`;
  };

  const exchangeCodeForToken = async (code: string) => {
    try {
      setBuildStatus({
        status: 'authenticating',
        message: 'Completing authentication...'
      });

      const response = await fetch('/api/auth/google/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, redirect_uri: REDIRECT_URI })
      });

      if (response.ok) {
        const data = await response.json();
        setAccessToken(data.access_token);
        setIsAuthenticated(true);
        localStorage.setItem('google_access_token', data.access_token);
        
        // Clean up URL by removing query parameters
        window.history.replaceState({}, '', window.location.pathname);
        
        setBuildStatus({
          status: 'idle',
          message: ''
        });
      } else {
        const errorData = await response.json();
        setBuildStatus({
          status: 'error',
          message: `Authentication failed: ${errorData.error || 'Unknown error'}`
        });
        // Clean up URL
        window.history.replaceState({}, '', window.location.pathname);
      }
    } catch (error) {
      console.error('Token exchange failed:', error);
      setBuildStatus({
        status: 'error',
        message: `Authentication failed: ${error.message}`
      });
      // Clean up URL
      window.history.replaceState({}, '', window.location.pathname);
    }
  };

  const fetchSheets = async () => {
    if (!accessToken) return;

    try {
      const response = await fetch(
        'https://www.googleapis.com/drive/v3/files?' +
        'q=mimeType="application/vnd.google-apps.spreadsheet"&' +
        'orderBy=modifiedTime desc&' +
        'fields=files(id,name,modifiedTime)',
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        setSheets(data.files || []);
      } else if (response.status === 401) {
        // Token expired
        localStorage.removeItem('google_access_token');
        setIsAuthenticated(false);
        setAccessToken(null);
      }
    } catch (error) {
      console.error('Failed to fetch sheets:', error);
    }
  };

  const handleAttachSheet = async () => {
    if (!isAuthenticated) {
      initiateGoogleAuth();
    } else {
      await fetchSheets();
      setShowSheetSelector(true);
    }
  };

  const readSheetData = async (sheetId: string): Promise<any> => {
    if (!accessToken) return null;

    try {
      // Get sheet metadata first
      const metaResponse = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        }
      );

      if (!metaResponse.ok) return null;
      
      const metadata = await metaResponse.json();
      const firstSheet = metadata.sheets[0].properties.title;

      // Read data from first sheet
      const dataResponse = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${firstSheet}`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        }
      );

      if (!dataResponse.ok) return null;
      
      const data = await dataResponse.json();
      return {
        sheetName: metadata.properties.title,
        data: data.values || []
      };
    } catch (error) {
      console.error('Failed to read sheet data:', error);
      return null;
    }
  };

  const handleBuildApp = async () => {
    if (!appDescription.trim()) {
      setBuildStatus({
        status: 'error',
        message: 'Please describe your app first'
      });
      return;
    }

    setBuildStatus({
      status: 'building',
      message: 'Initializing Claude session...',
      progress: 10
    });

    try {
      // Generate session ID
      const sessionId = `app-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      // Prepare context for Claude
      let context = `Build a React app with the following description:\n${appDescription}`;
      
      // Add sheet data if available
      if (selectedSheet) {
        setBuildStatus({
          status: 'building',
          message: 'Reading sheet data...',
          progress: 30
        });

        const sheetData = await readSheetData(selectedSheet.id);
        if (sheetData) {
          context += `\n\nThe app should use data from the Google Sheet "${sheetData.sheetName}".\n`;
          context += `Sheet data (first 10 rows):\n${JSON.stringify(sheetData.data.slice(0, 10), null, 2)}`;
        }
      }

      setBuildStatus({
        status: 'building',
        message: 'Starting Claude session...',
        progress: 50
      });

      // Create Claude session
      const claudeResponse = await fetch('/api/claude/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          prompt: context,
          tools: ['file_write', 'file_read', 'bash'],
          workingDir: `data/session/${sessionId}`
        })
      });

      if (!claudeResponse.ok) {
        throw new Error('Failed to create Claude session');
      }

      setBuildStatus({
        status: 'building',
        message: 'Building your app...',
        progress: 70
      });

      // Poll for completion (in a real implementation, this would use WebSocket)
      const pollInterval = setInterval(async () => {
        const statusResponse = await fetch(`/api/claude/session/${sessionId}/status`);
        if (statusResponse.ok) {
          const status = await statusResponse.json();
          
          if (status.complete) {
            clearInterval(pollInterval);
            
            const appUrl = `https://justshare.io/code/render/data/session/${sessionId}/App.tsx`;
            
            setBuildStatus({
              status: 'success',
              message: 'Your app is ready!',
              progress: 100,
              sessionId,
              appUrl
            });
          }
        }
      }, 2000);

      // Timeout after 2 minutes
      setTimeout(() => {
        clearInterval(pollInterval);
        if (buildStatus.status === 'building') {
          setBuildStatus({
            status: 'error',
            message: 'Build timeout. Please try again.'
          });
        }
      }, 120000);

    } catch (error) {
      setBuildStatus({
        status: 'error',
        message: `Build failed: ${error.message}`
      });
    }
  };

  const redirectToApp = () => {
    if (buildStatus.appUrl) {
      window.location.href = buildStatus.appUrl;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-3">
            AI App Builder
          </h1>
          <p className="text-lg text-gray-600">
            Describe your app and let Claude build it for you
          </p>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* App Description Input */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Describe your app
            </label>
            <textarea
              value={appDescription}
              onChange={(e) => setAppDescription(e.target.value)}
              placeholder="I want an app that tracks my daily habits with a calendar view and progress charts..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              rows={4}
            />
          </div>

          {/* Google Sheets Section */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <label className="block text-sm font-medium text-gray-700">
                Data Source (Optional)
              </label>
              {selectedSheet && (
                <span className="text-sm text-green-600 flex items-center">
                  <FileSpreadsheet className="w-4 h-4 mr-1" />
                  {selectedSheet.name}
                </span>
              )}
            </div>
            
            <button
              onClick={handleAttachSheet}
              className="w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 transition-colors flex items-center justify-center text-gray-600 hover:text-gray-800"
            >
              <FileSpreadsheet className="w-5 h-5 mr-2" />
              {selectedSheet ? 'Change Sheet' : 'Attach Google Sheet'}
            </button>
          </div>

          {/* Sheet Selector Dialog */}
          {showSheetSelector && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-lg max-w-md w-full max-h-[80vh] overflow-hidden">
                <div className="p-6 border-b">
                  <h2 className="text-xl font-semibold">Select a Google Sheet</h2>
                </div>
                <div className="max-h-96 overflow-y-auto">
                  {sheets.length === 0 ? (
                    <p className="p-6 text-gray-500 text-center">No sheets found</p>
                  ) : (
                    sheets.map((sheet) => (
                      <button
                        key={sheet.id}
                        onClick={() => {
                          setSelectedSheet(sheet);
                          setShowSheetSelector(false);
                        }}
                        className="w-full px-6 py-4 hover:bg-gray-50 text-left border-b last:border-b-0"
                      >
                        <div className="font-medium">{sheet.name}</div>
                        <div className="text-sm text-gray-500">
                          Modified: {new Date(sheet.modifiedTime).toLocaleDateString()}
                        </div>
                      </button>
                    ))
                  )}
                </div>
                <div className="p-4 border-t">
                  <button
                    onClick={() => setShowSheetSelector(false)}
                    className="w-full px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Build Button */}
          <button
            onClick={handleBuildApp}
            disabled={buildStatus.status === 'building'}
            className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white font-medium py-4 rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {buildStatus.status === 'building' ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Building...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5 mr-2" />
                Build App with Claude
              </>
            )}
          </button>

          {/* Status Display */}
          {buildStatus.status !== 'idle' && (
            <div className={`mt-6 p-4 rounded-lg ${
              buildStatus.status === 'error' ? 'bg-red-50 border border-red-200' :
              buildStatus.status === 'success' ? 'bg-green-50 border border-green-200' :
              'bg-blue-50 border border-blue-200'
            }`}>
              <div className="flex items-start">
                {buildStatus.status === 'error' && <AlertCircle className="w-5 h-5 text-red-600 mr-2 flex-shrink-0 mt-0.5" />}
                <div className="flex-1">
                  <p className={`font-medium ${
                    buildStatus.status === 'error' ? 'text-red-800' :
                    buildStatus.status === 'success' ? 'text-green-800' :
                    'text-blue-800'
                  }`}>
                    {buildStatus.message}
                  </p>
                  
                  {buildStatus.progress && buildStatus.status === 'building' && (
                    <div className="mt-2 w-full bg-white rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${buildStatus.progress}%` }}
                      />
                    </div>
                  )}
                  
                  {buildStatus.status === 'success' && buildStatus.appUrl && (
                    <button
                      onClick={redirectToApp}
                      className="mt-3 inline-flex items-center text-green-700 hover:text-green-800 font-medium"
                    >
                      Open your app
                      <ExternalLink className="w-4 h-4 ml-1" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-gray-500">
          Powered by Claude AI and Google Sheets
        </div>
      </div>
    </div>
  );
};

export default AppBuilder;