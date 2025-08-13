import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import { Separator } from './ui/separator';
import { 
  Cloud, 
  CloudOff, 
  RefreshCw, 
  Upload, 
  Download, 
  Settings, 
  Key,
  ExternalLink,
  CheckCircle,
  AlertCircle,
  Info
} from 'lucide-react';
import { Box, BoxItem } from '../App';

interface GoogleSheetsSyncProps {
  boxes: Box[];
  onImportBoxes: (boxes: Box[]) => void;
}

// Mock Google Sheets API responses for demo
const MOCK_SHEET_DATA = {
  spreadsheetId: '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms',
  spreadsheetUrl: 'https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit',
  lastSync: new Date().toISOString()
};

interface SyncStatus {
  connected: boolean;
  lastSync: Date | null;
  spreadsheetId: string;
  spreadsheetUrl: string;
  error: string | null;
}

export function GoogleSheetsSync({ boxes, onImportBoxes }: GoogleSheetsSyncProps) {
  const [apiKey, setApiKey] = useState('');
  const [spreadsheetId, setSpreadsheetId] = useState('');
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    connected: false,
    lastSync: null,
    spreadsheetId: '',
    spreadsheetUrl: '',
    error: null
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showSetup, setShowSetup] = useState(false);

  // Load saved credentials on mount
  useEffect(() => {
    const savedApiKey = localStorage.getItem('googleSheetsApiKey');
    const savedSpreadsheetId = localStorage.getItem('googleSheetsSpreadsheetId');
    const savedSyncStatus = localStorage.getItem('googleSheetsSyncStatus');

    if (savedApiKey) setApiKey(savedApiKey);
    if (savedSpreadsheetId) setSpreadsheetId(savedSpreadsheetId);
    if (savedSyncStatus) {
      try {
        const status = JSON.parse(savedSyncStatus);
        setSyncStatus({
          ...status,
          lastSync: status.lastSync ? new Date(status.lastSync) : null
        });
      } catch (error) {
        console.error('Error parsing sync status:', error);
      }
    }
  }, []);

  // Save credentials when they change
  useEffect(() => {
    if (apiKey) localStorage.setItem('googleSheetsApiKey', apiKey);
    if (spreadsheetId) localStorage.setItem('googleSheetsSpreadsheetId', spreadsheetId);
  }, [apiKey, spreadsheetId]);

  // Save sync status when it changes
  useEffect(() => {
    localStorage.setItem('googleSheetsSyncStatus', JSON.stringify(syncStatus));
    // Trigger a storage event to notify other components
    window.dispatchEvent(new Event('storage'));
  }, [syncStatus]);

  const testConnection = async () => {
    setIsLoading(true);
    try {
      // In a real implementation, this would test the Google Sheets API connection
      await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate API call
      
      if (apiKey.includes('DEMO') || apiKey === 'YOUR_API_KEY_HERE') {
        // Mock successful connection for demo
        setSyncStatus({
          connected: true,
          lastSync: new Date(),
          spreadsheetId: MOCK_SHEET_DATA.spreadsheetId,
          spreadsheetUrl: MOCK_SHEET_DATA.spreadsheetUrl,
          error: null
        });
      } else if (apiKey && spreadsheetId) {
        // Real API key provided but no actual connection (since this is a demo)
        setSyncStatus({
          connected: false,
          lastSync: null,
          spreadsheetId: '',
          spreadsheetUrl: '',
          error: 'Real Google Sheets API integration requires server-side implementation. This is a demo with mock data.'
        });
      } else {
        setSyncStatus({
          connected: false,
          lastSync: null,
          spreadsheetId: '',
          spreadsheetUrl: '',
          error: 'Please provide both API key and Spreadsheet ID'
        });
      }
    } catch (error) {
      setSyncStatus({
        connected: false,
        lastSync: null,
        spreadsheetId: '',
        spreadsheetUrl: '',
        error: 'Connection failed. Please check your credentials.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const pushToSheets = async () => {
    if (!syncStatus.connected) return;
    
    setIsLoading(true);
    try {
      // In a real implementation, this would push data to Google Sheets
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate API call
      
      // Convert boxes to sheet format
      const sheetData = [
        ['Box ID', 'Box Name', 'Room', 'Box Number', 'Color', 'Item ID', 'Item Name', 'Description', 'Category', 'Fragile', 'Has Image'],
        ...boxes.flatMap(box => 
          box.items.length > 0 
            ? box.items.map(item => [
                box.id,
                box.name,
                box.room,
                box.boxNumber || '',
                box.color,
                item.id,
                item.name,
                item.description || '',
                item.category || '',
                item.fragile ? 'Yes' : 'No',
                item.image ? 'Yes' : 'No'
              ])
            : [[box.id, box.name, box.room, box.boxNumber || '', box.color, '', '', '', '', '', '']]
        )
      ];

      console.log('Would push to Google Sheets:', sheetData);
      
      setSyncStatus(prev => ({
        ...prev,
        lastSync: new Date(),
        error: null
      }));
    } catch (error) {
      setSyncStatus(prev => ({
        ...prev,
        error: 'Failed to sync data to Google Sheets'
      }));
    } finally {
      setIsLoading(false);
    }
  };

  const pullFromSheets = async () => {
    if (!syncStatus.connected) return;
    
    setIsLoading(true);
    try {
      // In a real implementation, this would pull data from Google Sheets
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate API call
      
      // Mock data for demo
      const mockBoxes: Box[] = [
        {
          id: 'demo-1',
          name: 'Kitchen Essentials',
          color: '#ef4444',
          room: 'Kitchen',
          boxNumber: '001',
          items: [
            {
              id: 'item-1',
              name: 'Coffee Maker',
              description: 'Breville espresso machine',
              category: 'Electronics',
              fragile: true
            },
            {
              id: 'item-2',
              name: 'Mixing Bowls',
              description: 'Set of 3 stainless steel bowls',
              category: 'Kitchen',
              fragile: false
            }
          ],
          qrCode: 'https://example.com/qr/demo-1',
          createdAt: new Date()
        }
      ];

      onImportBoxes(mockBoxes);
      
      setSyncStatus(prev => ({
        ...prev,
        lastSync: new Date(),
        error: null
      }));
    } catch (error) {
      setSyncStatus(prev => ({
        ...prev,
        error: 'Failed to sync data from Google Sheets'
      }));
    } finally {
      setIsLoading(false);
    }
  };

  const disconnect = () => {
    setSyncStatus({
      connected: false,
      lastSync: null,
      spreadsheetId: '',
      spreadsheetUrl: '',
      error: null
    });
    setApiKey('');
    setSpreadsheetId('');
    localStorage.removeItem('googleSheetsApiKey');
    localStorage.removeItem('googleSheetsSpreadsheetId');
    localStorage.removeItem('googleSheetsSyncStatus');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          {syncStatus.connected ? (
            <Cloud className="h-5 w-5 text-green-600" />
          ) : (
            <CloudOff className="h-5 w-5 text-gray-400" />
          )}
          <span>Google Sheets Sync</span>
          {syncStatus.connected && (
            <Badge variant="secondary" className="bg-green-100 text-green-800">
              Connected
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Setup Instructions */}
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-2">
              <p className="font-medium">Demo Mode Available</p>
              <p className="text-sm">
                Use API key "DEMO_KEY" to try the mock functionality, or follow the setup guide for real Google Sheets integration.
              </p>
              <Button
                variant="link"
                onClick={() => setShowSetup(!showSetup)}
                className="p-0 h-auto text-blue-600"
              >
                {showSetup ? 'Hide' : 'Show'} Setup Instructions
              </Button>
            </div>
          </AlertDescription>
        </Alert>

        {showSetup && (
          <Alert>
            <Settings className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-3">
                <p className="font-medium">Real Google Sheets Setup:</p>
                <ol className="list-decimal list-inside space-y-1 text-sm">
                  <li>Go to <a href="https://console.developers.google.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Google Cloud Console</a></li>
                  <li>Create a new project or select existing one</li>
                  <li>Enable the Google Sheets API</li>
                  <li>Create credentials (API key)</li>
                  <li>Create a new Google Sheet and copy its ID from the URL</li>
                  <li>Share the sheet with your service account email (if using service account)</li>
                </ol>
                <p className="text-xs text-gray-600">
                  Note: This demo uses mock data. Real implementation requires server-side authentication for security.
                </p>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Connection Status */}
        {syncStatus.connected ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-green-600">Connected to Google Sheets</p>
                {syncStatus.lastSync && (
                  <p className="text-sm text-gray-600">
                    Last synced: {syncStatus.lastSync.toLocaleString()}
                  </p>
                )}
              </div>
              <Button variant="outline" size="sm" onClick={disconnect}>
                Disconnect
              </Button>
            </div>
            
            {syncStatus.spreadsheetUrl && (
              <Button
                variant="link"
                onClick={() => window.open(syncStatus.spreadsheetUrl, '_blank')}
                className="p-0 h-auto text-blue-600"
              >
                <ExternalLink className="h-4 w-4 mr-1" />
                Open Spreadsheet
              </Button>
            )}

            <Separator />

            {/* Sync Actions */}
            <div className="grid grid-cols-2 gap-3">
              <Button
                onClick={pushToSheets}
                disabled={isLoading}
                className="flex items-center space-x-2"
              >
                {isLoading ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4" />
                )}
                <span>Push to Sheets</span>
              </Button>
              
              <Button
                variant="outline"
                onClick={pullFromSheets}
                disabled={isLoading}
                className="flex items-center space-x-2"
              >
                {isLoading ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <Download className="h-4 w-4" />
                )}
                <span>Pull from Sheets</span>
              </Button>
            </div>

            <div className="text-xs text-gray-600 space-y-1">
              <p>• <strong>Push to Sheets:</strong> Upload your current boxes and items to Google Sheets</p>
              <p>• <strong>Pull from Sheets:</strong> Import data from Google Sheets (will replace current data)</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Setup Form */}
            <div className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="api-key">Google Sheets API Key</Label>
                <Input
                  id="api-key"
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="Enter your API key or 'DEMO_KEY' for demo"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="spreadsheet-id">Google Spreadsheet ID</Label>
                <Input
                  id="spreadsheet-id"
                  value={spreadsheetId}
                  onChange={(e) => setSpreadsheetId(e.target.value)}
                  placeholder="1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms"
                />
                <p className="text-xs text-gray-600">
                  Copy from the Google Sheets URL between /d/ and /edit
                </p>
              </div>
            </div>

            <Button
              onClick={testConnection}
              disabled={isLoading || !apiKey}
              className="w-full flex items-center space-x-2"
            >
              {isLoading ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Key className="h-4 w-4" />
              )}
              <span>Connect to Google Sheets</span>
            </Button>
          </div>
        )}

        {/* Error Display */}
        {syncStatus.error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{syncStatus.error}</AlertDescription>
          </Alert>
        )}

        {/* Sync Statistics */}
        {syncStatus.connected && (
          <div className="pt-4 border-t">
            <h4 className="font-medium mb-2">Sync Status</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Boxes:</span>
                <span className="ml-2 font-medium">{boxes.length}</span>
              </div>
              <div>
                <span className="text-gray-600">Items:</span>
                <span className="ml-2 font-medium">
                  {boxes.reduce((sum, box) => sum + box.items.length, 0)}
                </span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}