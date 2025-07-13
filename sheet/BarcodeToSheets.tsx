import React, { useState, useRef, useEffect, useCallback } from 'react';

interface ScanResult {
  rawValue: string;
  format: string;
  timestamp: Date;
}

const BarcodeToSheets: React.FC = () => {
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [error, setError] = useState<string>('');
  const [status, setStatus] = useState<string>('');
  const [spreadsheetId, setSpreadsheetId] = useState<string>('');
  const [accessToken, setAccessToken] = useState<string>('');
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const detectorRef = useRef<any>(null);
  const scanIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Google OAuth configuration
  const CLIENT_ID = '173804678799-cddgsahit061vf4rdprhtlermd7cckj1.apps.googleusercontent.com'; // User needs to add their Client ID
  const SCOPES = 'https://www.googleapis.com/auth/spreadsheets';
  const DISCOVERY_DOCS = ['https://sheets.googleapis.com/$discovery/rest?version=v4'];

  // Initialize Google API
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://apis.google.com/js/api.js';
    script.onload = () => {
      window.gapi.load('client:auth2', initClient);
    };
    document.body.appendChild(script);

    return () => {
      stopCamera();
      document.body.removeChild(script);
    };
  }, []);

  const initClient = () => {
    window.gapi.client.init({
      clientId: CLIENT_ID,
      scope: SCOPES,
      discoveryDocs: DISCOVERY_DOCS,
    }).then(() => {
      // Check if already signed in
      const authInstance = window.gapi.auth2.getAuthInstance();
      setIsAuthorized(authInstance.isSignedIn.get());
      
      // Listen for sign-in state changes
      authInstance.isSignedIn.listen(setIsAuthorized);
    }).catch((err: any) => {
      setError('Failed to initialize Google API: ' + err.message);
    });
  };

  const handleAuthClick = () => {
    if (isAuthorized) {
      window.gapi.auth2.getAuthInstance().signOut();
      setAccessToken('');
    } else {
      window.gapi.auth2.getAuthInstance().signIn().then(() => {
        const auth = window.gapi.auth2.getAuthInstance();
        const user = auth.currentUser.get();
        const authResponse = user.getAuthResponse();
        setAccessToken(authResponse.access_token);
      });
    }
  };

  const startCamera = async () => {
    try {
      setError('');
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
      }

      // Initialize BarcodeDetector if available
      if ('BarcodeDetector' in window) {
        detectorRef.current = new (window as any).BarcodeDetector();
        setIsScanning(true);
        startScanning();
      } else {
        setError('BarcodeDetector API not supported. Please use a compatible browser.');
      }
    } catch (err: any) {
      setError('Camera access denied: ' + err.message);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
    setIsScanning(false);
  };

  const startScanning = () => {
    if (!detectorRef.current || !videoRef.current) return;

    scanIntervalRef.current = setInterval(async () => {
      if (videoRef.current && videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA) {
        try {
          const barcodes = await detectorRef.current.detect(videoRef.current);
          if (barcodes.length > 0) {
            const barcode = barcodes[0];
            setScanResult({
              rawValue: barcode.rawValue,
              format: barcode.format,
              timestamp: new Date()
            });
            stopCamera();
            setStatus('Barcode detected! Ready to send to Google Sheets.');
          }
        } catch (err) {
          console.error('Barcode detection error:', err);
        }
      }
    }, 500);
  };

  const sendToGoogleSheets = async () => {
    if (!scanResult || !spreadsheetId || !accessToken) {
      setError('Missing required information');
      return;
    }

    setStatus('Sending to Google Sheets...');
    
    try {
      const values = [[
        scanResult.rawValue,
        scanResult.format,
        scanResult.timestamp.toLocaleString(),
        new Date().toISOString()
      ]];

      const response = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/A:D:append?valueInputOption=RAW&insertDataOption=INSERT_ROWS`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            values: values
          })
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setStatus('Successfully added to Google Sheets!');
      setScanResult(null);
    } catch (err: any) {
      setError('Failed to send to Google Sheets: ' + err.message);
      setStatus('');
    }
  };

  const resetScanner = () => {
    setScanResult(null);
    setError('');
    setStatus('');
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-6 text-center">
          Barcode to Google Sheets
        </h1>

        {/* Google Auth Section */}
        <div className="mb-6">
          <button
            onClick={handleAuthClick}
            className={`w-full py-2 px-4 rounded-lg font-medium transition-colors ${
              isAuthorized
                ? 'bg-red-500 hover:bg-red-600 text-white'
                : 'bg-blue-500 hover:bg-blue-600 text-white'
            }`}
          >
            {isAuthorized ? 'Sign Out of Google' : 'Sign In with Google'}
          </button>
        </div>

        {/* Spreadsheet ID Input */}
        {isAuthorized && (
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Google Sheets ID
            </label>
            <input
              type="text"
              value={spreadsheetId}
              onChange={(e) => setSpreadsheetId(e.target.value)}
              placeholder="Enter your spreadsheet ID"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              Find this in your Google Sheets URL: docs.google.com/spreadsheets/d/[ID]/edit
            </p>
          </div>
        )}

        {/* Camera View */}
        {isScanning && (
          <div className="mb-6">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="w-full rounded-lg"
            />
          </div>
        )}

        {/* Scan Result */}
        {scanResult && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <h3 className="font-semibold text-green-800 mb-2">Scan Result</h3>
            <p className="text-sm text-gray-700">
              <span className="font-medium">Value:</span> {scanResult.rawValue}
            </p>
            <p className="text-sm text-gray-700">
              <span className="font-medium">Format:</span> {scanResult.format}
            </p>
            <p className="text-sm text-gray-700">
              <span className="font-medium">Time:</span> {scanResult.timestamp.toLocaleTimeString()}
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-3">
          {!isScanning && !scanResult && isAuthorized && spreadsheetId && (
            <button
              onClick={startCamera}
              className="w-full bg-green-500 hover:bg-green-600 text-white font-medium py-2 px-4 rounded-lg transition-colors"
            >
              Start Scanning
            </button>
          )}

          {isScanning && (
            <button
              onClick={stopCamera}
              className="w-full bg-red-500 hover:bg-red-600 text-white font-medium py-2 px-4 rounded-lg transition-colors"
            >
              Stop Scanning
            </button>
          )}

          {scanResult && isAuthorized && spreadsheetId && (
            <>
              <button
                onClick={sendToGoogleSheets}
                className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-lg transition-colors"
              >
                Send to Google Sheets
              </button>
              <button
                onClick={resetScanner}
                className="w-full bg-gray-500 hover:bg-gray-600 text-white font-medium py-2 px-4 rounded-lg transition-colors"
              >
                Scan Another
              </button>
            </>
          )}
        </div>

        {/* Status Messages */}
        {status && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">{status}</p>
          </div>
        )}

        {/* Error Messages */}
        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {/* Instructions */}
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="font-semibold text-gray-700 mb-2">Setup Instructions:</h3>
          <ol className="text-sm text-gray-600 space-y-1 list-decimal list-inside">
            <li>Create a Google Cloud Project and enable Sheets API</li>
            <li>Create OAuth 2.0 credentials (Web application)</li>
            <li>Add authorized JavaScript origins</li>
            <li>Replace CLIENT_ID in the code with your Client ID</li>
            <li>Create a Google Sheet and copy its ID from the URL</li>
          </ol>
        </div>
      </div>
    </div>
  );
};

// TypeScript declarations for Google API
declare global {
  interface Window {
    gapi: any;
  }
}

export default BarcodeToSheets;