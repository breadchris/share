import React, { useState, useEffect } from 'react';
import { LabelMaker } from './components/LabelMaker';
import { ItemManager } from './components/ItemManager';
import { SpreadsheetView } from './components/SpreadsheetView';
import { GoogleSheetsNavbar } from './components/GoogleSheetsNavbar';
import { Button } from './components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs';
import { Card, CardContent } from './components/ui/card';
import { Package, QrCode, Table, Cloud, AlertCircle } from 'lucide-react';

export interface BoxItem {
  id: string;
  name: string;
  description?: string;
  category?: string;
  fragile?: boolean;
  image?: string;
}

export interface Box {
  id: string;
  name: string;
  color: string;
  room: string;
  boxNumber?: string;
  items: BoxItem[];
  qrCode: string;
  createdAt: Date;
}

interface GoogleSheet {
  id: string;
  name: string;
  modifiedTime: string;
}

export default function App() {
  const [boxes, setBoxes] = useState<Box[]>([]);
  const [activeTab, setActiveTab] = useState('labels');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [selectedSheet, setSelectedSheet] = useState<GoogleSheet | null>(null);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);

  // Check for existing authentication on mount
  useEffect(() => {
    const token = localStorage.getItem('google_access_token');
    if (token) {
      setAccessToken(token);
      setIsAuthenticated(true);
    }

    // Check for OAuth parameters in URL
    const params = new URLSearchParams(window.location.search);
    const accessToken = params.get('access_token');
    const error = params.get('error');

    if (error) {
      setSyncError(`Authentication failed: ${error}`);
      window.history.replaceState({}, '', window.location.pathname);
    } else if (accessToken) {
      setAccessToken(accessToken);
      setIsAuthenticated(true);
      localStorage.setItem('google_access_token', accessToken);
      setSyncError(null);
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  // Periodic sync with Google Sheets
  useEffect(() => {
    if (!isAuthenticated || !selectedSheet || !accessToken) return;

    const syncInterval = setInterval(async () => {
      try {
        await loadBoxesFromSheet();
      } catch (error) {
        console.error('Periodic sync failed:', error);
      }
    }, 30000); // Sync every 30 seconds

    return () => clearInterval(syncInterval);
  }, [isAuthenticated, selectedSheet, accessToken]);

  const addBox = async (box: Omit<Box, 'id' | 'createdAt'>) => {
    if (!isAuthenticated || !selectedSheet || !accessToken) {
      setSyncError('Must be connected to Google Sheets to add boxes');
      return;
    }

    const newBox: Box = {
      ...box,
      id: Date.now().toString(),
      createdAt: new Date()
    };
    
    try {
      await saveBoxToSheet(newBox);
      setBoxes(prev => [...prev, newBox]);
      setLastSync(new Date());
    } catch (error) {
      console.error('Failed to save box to sheet:', error);
      setSyncError('Failed to save box to Google Sheets');
    }
  };

  const updateBox = async (boxId: string, updates: Partial<Box>) => {
    if (!isAuthenticated || !selectedSheet || !accessToken) {
      setSyncError('Must be connected to Google Sheets to update boxes');
      return;
    }

    const updatedBoxes = boxes.map(box => 
      box.id === boxId ? { ...box, ...updates } : box
    );
    
    try {
      // Find the updated box and save to sheet
      const updatedBox = updatedBoxes.find(box => box.id === boxId);
      if (updatedBox) {
        await updateBoxInSheet(updatedBox);
        setBoxes(updatedBoxes);
        setLastSync(new Date());
      }
    } catch (error) {
      console.error('Failed to update box in sheet:', error);
      setSyncError('Failed to update box in Google Sheets');
    }
  };

  const deleteBox = async (boxId: string) => {
    if (!isAuthenticated || !selectedSheet || !accessToken) {
      setSyncError('Must be connected to Google Sheets to delete boxes');
      return;
    }

    try {
      const boxToDelete = boxes.find(box => box.id === boxId);
      if (boxToDelete) {
        await deleteBoxFromSheet(boxToDelete);
        setBoxes(prev => prev.filter(box => box.id !== boxId));
        setLastSync(new Date());
      }
    } catch (error) {
      console.error('Failed to delete box from sheet:', error);
      setSyncError('Failed to delete box from Google Sheets');
    }
  };

  const addItemToBox = async (boxId: string, item: Omit<BoxItem, 'id'>) => {
    if (!isAuthenticated || !selectedSheet || !accessToken) {
      setSyncError('Must be connected to Google Sheets to add items');
      return;
    }

    const newItem: BoxItem = {
      ...item,
      id: Date.now().toString()
    };
    
    try {
      const box = boxes.find(b => b.id === boxId);
      if (box) {
        await addItemToSheet(newItem, box);
        setBoxes(prev => prev.map(box => 
          box.id === boxId 
            ? { ...box, items: [...box.items, newItem] }
            : box
        ));
        setLastSync(new Date());
      }
    } catch (error) {
      console.error('Failed to add item to sheet:', error);
      setSyncError('Failed to add item to Google Sheets');
    }
  };

  const removeItemFromBox = async (boxId: string, itemId: string) => {
    if (!isAuthenticated || !selectedSheet || !accessToken) {
      setSyncError('Must be connected to Google Sheets to remove items');
      return;
    }

    try {
      const box = boxes.find(b => b.id === boxId);
      const item = box?.items.find(i => i.id === itemId);
      if (box && item) {
        await removeItemFromSheet(item, box);
        setBoxes(prev => prev.map(box => 
          box.id === boxId 
            ? { ...box, items: box.items.filter(item => item.id !== itemId) }
            : box
        ));
        setLastSync(new Date());
      }
    } catch (error) {
      console.error('Failed to remove item from sheet:', error);
      setSyncError('Failed to remove item from Google Sheets');
    }
  };

  // Clear all data and disconnect from Google Sheets
  const clearAllData = () => {
    if (window.confirm('Are you sure you want to clear all data and disconnect from Google Sheets? This action cannot be undone.')) {
      setBoxes([]);
      setIsAuthenticated(false);
      setAccessToken(null);
      setSelectedSheet(null);
      setLastSync(null);
      setSyncError(null);
      localStorage.removeItem('google_access_token');
    }
  };

  // Google Sheets helper functions
  const saveBoxToSheet = async (box: Box) => {
    if (!accessToken || !selectedSheet) return;

    const values = [[
      new Date().toISOString(),
      'BOX',
      box.name,
      '',
      '',
      box.room,
      box.boxNumber || '',
      box.color,
      box.id
    ]];

    const response = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${selectedSheet.id}/values/A:I:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ values })
      }
    );

    if (!response.ok) {
      throw new Error('Failed to save box to sheet');
    }
  };

  const updateBoxInSheet = async (box: Box) => {
    // For now, we'll use the same approach as ItemManager - search and update
    // This is a simplified version - in production you'd want more robust update logic
    if (!accessToken || !selectedSheet) return;
    
    // Implementation would go here to find and update the specific box row
    console.log('Update box in sheet:', box);
  };

  const deleteBoxFromSheet = async (box: Box) => {
    // Implementation would go here to find and delete the box and its items
    if (!accessToken || !selectedSheet) return;
    
    console.log('Delete box from sheet:', box);
  };

  const addItemToSheet = async (item: BoxItem, box: Box) => {
    if (!accessToken || !selectedSheet) return;

    const values = [[
      new Date().toISOString(),
      item.name,
      item.description || '',
      item.category || '',
      item.fragile ? 'Yes' : 'No',
      box.name,
      box.room,
      box.boxNumber || '',
      item.image || ''
    ]];

    const response = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${selectedSheet.id}/values/A:I:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ values })
      }
    );

    if (!response.ok) {
      throw new Error('Failed to add item to sheet');
    }
  };

  const removeItemFromSheet = async (item: BoxItem, box: Box) => {
    if (!accessToken || !selectedSheet) return;

    try {
      const getResponse = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${selectedSheet.id}/values/A:I`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          }
        }
      );

      if (!getResponse.ok) {
        throw new Error('Failed to fetch sheet data');
      }

      const data = await getResponse.json();
      const rows = data.values || [];
      
      let rowIndex = -1;
      for (let i = 0; i < rows.length; i++) {
        if (
          rows[i][1] === item.name &&
          rows[i][5] === box.name &&
          rows[i][6] === box.room
        ) {
          rowIndex = i + 1;
          break;
        }
      }

      if (rowIndex === -1) {
        console.warn('Item not found in sheet');
        return;
      }

      const deleteResponse = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${selectedSheet.id}:batchUpdate`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            requests: [
              {
                deleteDimension: {
                  range: {
                    sheetId: 0,
                    dimension: 'ROWS',
                    startIndex: rowIndex - 1,
                    endIndex: rowIndex
                  }
                }
              }
            ]
          })
        }
      );

      if (!deleteResponse.ok) {
        throw new Error('Failed to delete item from sheet');
      }
    } catch (error) {
      console.error('Error removing item from sheet:', error);
      throw error;
    }
  };

  const loadBoxesFromSheet = async () => {
    if (!accessToken || !selectedSheet) return;

    try {
      const response = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${selectedSheet.id}/values/A:I`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          }
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch sheet data');
      }

      const data = await response.json();
      const rows = data.values || [];
      
      // Parse boxes and items from sheet data
      const boxMap = new Map<string, Box>();
      
      rows.forEach((row: string[]) => {
        if (!row[1]) return; // Skip empty rows
        
        if (row[1] === 'BOX') {
          // This is a box row
          const box: Box = {
            id: row[8] || Date.now().toString(),
            name: row[2] || '',
            room: row[5] || '',
            boxNumber: row[6] || undefined,
            color: row[7] || '#3b82f6',
            items: [],
            qrCode: `https://example.com/qr/${row[8]}`,
            createdAt: new Date(row[0] || Date.now())
          };
          boxMap.set(box.id, box);
        } else {
          // This is an item row
          const boxName = row[5];
          const boxRoom = row[6];
          
          // Find the box this item belongs to
          let targetBox: Box | undefined;
          for (const box of boxMap.values()) {
            if (box.name === boxName && box.room === boxRoom) {
              targetBox = box;
              break;
            }
          }
          
          if (targetBox) {
            const item: BoxItem = {
              id: Date.now().toString() + Math.random(),
              name: row[1] || '',
              description: row[2] || undefined,
              category: row[3] || undefined,
              fragile: row[4] === 'Yes',
              image: row[8] || undefined
            };
            targetBox.items.push(item);
          }
        }
      });
      
      setBoxes(Array.from(boxMap.values()));
      setLastSync(new Date());
    } catch (error) {
      console.error('Failed to load boxes from sheet:', error);
      setSyncError('Failed to sync with Google Sheets');
    }
  };

  const initiateGoogleAuth = () => {
    const finalRedirect = encodeURIComponent(window.location.href.split('?')[0]);
    window.location.href = `/auth/google?final_redirect=${finalRedirect}`;
  };




  // Load boxes from selected sheet when sheet changes
  useEffect(() => {
    if (isAuthenticated && selectedSheet && accessToken) {
      loadBoxesFromSheet();
    }
  }, [isAuthenticated, selectedSheet, accessToken]);

  // Show authentication screen if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center space-y-6">
            <div className="space-y-2">
              <Package className="w-16 h-16 text-blue-600 mx-auto" />
              <h1 className="text-2xl font-bold text-gray-900">Moving Labels</h1>
              <p className="text-gray-600">
                Connect to Google Sheets to organize your move with color-coded labels and QR codes
              </p>
            </div>
            
            {syncError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center">
                  <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
                  <span className="text-sm text-red-800">{syncError}</span>
                </div>
              </div>
            )}
            
            <Button onClick={initiateGoogleAuth} className="w-full" size="lg">
              <Cloud className="h-5 w-5 mr-2" />
              Connect to Google Sheets
            </Button>
            
            <p className="text-xs text-gray-500">
              You need to connect to Google Sheets to use this app. All data will be stored in your Google Sheets.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <GoogleSheetsNavbar
        isAuthenticated={isAuthenticated}
        selectedSheet={selectedSheet}
        onSheetSelect={setSelectedSheet}
        lastSync={lastSync}
        syncError={syncError}
        onDisconnect={clearAllData}
        accessToken={accessToken}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!selectedSheet ? (
          <Card className="max-w-2xl mx-auto">
            <CardContent className="p-8 text-center space-y-6">
              <div className="space-y-2">
                <Cloud className="w-16 h-16 text-blue-600 mx-auto" />
                <h2 className="text-xl font-bold text-gray-900">Select a Google Sheet</h2>
                <p className="text-gray-600">
                  Choose which Google Sheet to use for storing your moving data. You can change this at any time from the navbar.
                </p>
              </div>
              
              {syncError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center">
                    <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
                    <span className="text-sm text-red-800">{syncError}</span>
                  </div>
                </div>
              )}
              
              <p className="text-sm text-gray-500">
                Click on "Select Sheet" in the navbar above to choose your Google Sheet.
              </p>
            </CardContent>
          </Card>
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-8">
              <TabsTrigger value="labels" className="flex items-center space-x-2">
                <Package className="h-4 w-4" />
                <span>Create Labels</span>
              </TabsTrigger>
              <TabsTrigger value="items" className="flex items-center space-x-2">
                <QrCode className="h-4 w-4" />
                <span>Manage Items</span>
              </TabsTrigger>
              <TabsTrigger value="spreadsheet" className="flex items-center space-x-2">
                <Table className="h-4 w-4" />
                <span>View All Items</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="labels">
              <LabelMaker 
                boxes={boxes}
                onAddBox={addBox}
                onUpdateBox={updateBox}
                onDeleteBox={deleteBox}
              />
            </TabsContent>

            <TabsContent value="items">
              <ItemManager 
                boxes={boxes}
                onAddItem={addItemToBox}
                onRemoveItem={removeItemFromBox}
                onUpdateBox={updateBox}
                isAuthenticated={isAuthenticated}
                selectedSheet={selectedSheet}
                accessToken={accessToken}
              />
            </TabsContent>

            <TabsContent value="spreadsheet">
              <SpreadsheetView boxes={boxes} />
            </TabsContent>
          </Tabs>
        )}
      </main>
    </div>
  );
}