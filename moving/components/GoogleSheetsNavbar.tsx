import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { 
  Cloud, 
  ChevronDown, 
  RefreshCw, 
  Settings, 
  CheckCircle,
  AlertCircle,
  Loader2,
  FileSpreadsheet,
  LogOut
} from 'lucide-react';

interface GoogleSheet {
  id: string;
  name: string;
  modifiedTime: string;
}

interface GoogleSheetsNavbarProps {
  isAuthenticated: boolean;
  selectedSheet: GoogleSheet | null;
  onSheetSelect: (sheet: GoogleSheet) => void;
  lastSync: Date | null;
  syncError: string | null;
  onDisconnect: () => void;
  accessToken: string | null;
}

export function GoogleSheetsNavbar({
  isAuthenticated,
  selectedSheet,
  onSheetSelect,
  lastSync,
  syncError,
  onDisconnect,
  accessToken
}: GoogleSheetsNavbarProps) {
  const [sheets, setSheets] = useState<GoogleSheet[]>([]);
  const [showSheetSelector, setShowSheetSelector] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch sheets when component mounts or auth changes
  useEffect(() => {
    if (isAuthenticated && accessToken) {
      fetchSheets();
    }
  }, [isAuthenticated, accessToken]);

  const fetchSheets = async () => {
    if (!accessToken) return;

    setIsLoading(true);
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
        onDisconnect();
      }
    } catch (error) {
      console.error('Failed to fetch sheets:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSheetSelect = (sheet: GoogleSheet) => {
    onSheetSelect(sheet);
    setShowSheetSelector(false);
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <header className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Cloud className="h-8 w-8 text-blue-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Moving Labels</h1>
              <p className="text-sm text-gray-600">Organize your move with Google Sheets integration</p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {/* Google Sheets Status */}
            <div className="flex items-center space-x-3">
              {selectedSheet ? (
                <div className="relative">
                  <Button
                    variant="outline"
                    onClick={() => setShowSheetSelector(!showSheetSelector)}
                    className="flex items-center space-x-2"
                  >
                    <FileSpreadsheet className="h-4 w-4 text-green-600" />
                    <span className="max-w-40 truncate">{selectedSheet.name}</span>
                    <ChevronDown className="h-4 w-4" />
                  </Button>

                  {showSheetSelector && (
                    <div className="absolute right-0 top-full mt-2 w-80 bg-white border rounded-lg shadow-lg z-50">
                      <div className="p-3 border-b">
                        <div className="flex items-center justify-between">
                          <h3 className="font-medium">Select Google Sheet</h3>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={fetchSheets}
                            disabled={isLoading}
                          >
                            {isLoading ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <RefreshCw className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </div>
                      
                      <div className="max-h-60 overflow-y-auto">
                        {sheets.length === 0 ? (
                          <div className="p-4 text-center text-gray-500">
                            No spreadsheets found
                          </div>
                        ) : (
                          sheets.map((sheet) => (
                            <button
                              key={sheet.id}
                              onClick={() => handleSheetSelect(sheet)}
                              className={`w-full p-3 text-left hover:bg-gray-50 border-b last:border-b-0 ${
                                selectedSheet?.id === sheet.id ? 'bg-blue-50' : ''
                              }`}
                            >
                              <div className="flex items-center space-x-2">
                                <FileSpreadsheet className="h-4 w-4 text-green-600" />
                                <div className="flex-1 min-w-0">
                                  <div className="font-medium truncate">{sheet.name}</div>
                                  <div className="text-sm text-gray-500">
                                    Modified: {new Date(sheet.modifiedTime).toLocaleDateString()}
                                  </div>
                                </div>
                                {selectedSheet?.id === sheet.id && (
                                  <CheckCircle className="h-4 w-4 text-green-600" />
                                )}
                              </div>
                            </button>
                          ))
                        )}
                      </div>
                      
                      <div className="p-3 border-t bg-gray-50">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowSheetSelector(false)}
                          className="w-full"
                        >
                          Close
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <Button
                  variant="outline"
                  onClick={() => setShowSheetSelector(!showSheetSelector)}
                  className="flex items-center space-x-2"
                >
                  <Cloud className="h-4 w-4" />
                  <span>Select Sheet</span>
                  <ChevronDown className="h-4 w-4" />
                </Button>
              )}

              {/* Sync Status */}
              <div className="text-sm">
                {syncError ? (
                  <div className="flex items-center space-x-1 text-red-600">
                    <AlertCircle className="h-3 w-3" />
                    <span className="text-xs">Sync Error</span>
                  </div>
                ) : lastSync ? (
                  <div className="flex items-center space-x-1 text-green-600">
                    <CheckCircle className="h-3 w-3" />
                    <span className="text-xs">
                      Synced {lastSync.toLocaleTimeString()}
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-1 text-gray-500">
                    <Cloud className="h-3 w-3" />
                    <span className="text-xs">Ready</span>
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowSheetSelector(!showSheetSelector)}
                className="text-gray-600 hover:text-gray-700"
              >
                <Settings className="h-4 w-4" />
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={onDisconnect}
                className="text-red-600 hover:text-red-700"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Click outside to close sheet selector */}
      {showSheetSelector && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowSheetSelector(false)}
        />
      )}
    </header>
  );
}