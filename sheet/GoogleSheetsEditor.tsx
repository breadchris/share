import React, { useState, useEffect, useCallback } from "https://esm.sh/react@18";
import { ChevronDown, Loader2, FileSpreadsheet, Save, AlertCircle, Edit, Check, X, Plus, Trash2, Copy, CornerDownRight, RefreshCw } from "https://esm.sh/lucide-react@0.263.1";

interface GoogleSheet {
  id: string;
  name: string;
  modifiedTime: string;
}

interface SheetCell {
  row: number;
  col: number;
  value: string;
  formula?: string;
  isEditing?: boolean;
}

interface SheetData {
  values: string[][];
  sheetName: string;
  totalRows: number;
  totalCols: number;
}

interface SheetTab {
  sheetId: number;
  title: string;
  index: number;
  tabColor?: {red: number, green: number, blue: number};
  gridProperties: {rowCount: number, columnCount: number};
}

interface CellRange {
  startRow: number;
  startCol: number;
  endRow: number;
  endCol: number;
}

interface EditorStatus {
  status: 'idle' | 'authenticating' | 'loading' | 'saving' | 'error';
  message: string;
}

const GoogleSheetsEditor: React.FC = () => {
  const [sheets, setSheets] = useState<GoogleSheet[]>([]);
  const [selectedSheet, setSelectedSheet] = useState<GoogleSheet | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [showSheetSelector, setShowSheetSelector] = useState(false);
  const [sheetData, setSheetData] = useState<SheetData | null>(null);
  const [editingCell, setEditingCell] = useState<{row: number, col: number} | null>(null);
  const [cellValues, setCellValues] = useState<{[key: string]: string}>({});
  const [editorStatus, setEditorStatus] = useState<EditorStatus>({
    status: 'idle',
    message: ''
  });
  
  // New state for multi-cell selection
  const [selectedRanges, setSelectedRanges] = useState<CellRange[]>([]);
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectionStart, setSelectionStart] = useState<{row: number, col: number} | null>(null);
  const [currentRange, setCurrentRange] = useState<CellRange | null>(null);
  
  // New state for sheet tabs
  const [availableSheets, setAvailableSheets] = useState<SheetTab[]>([]);
  const [currentSheetIndex, setCurrentSheetIndex] = useState(0);
  const [isLoadingSheets, setIsLoadingSheets] = useState(false);

  // Keyboard event handling
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Don't interfere with typing in input fields
      if (editingCell) return;
      
      if (event.key === 'Escape') {
        clearSelection();
      } else if (event.key === 'Delete' || event.key === 'Backspace') {
        if (selectedRanges.length > 0) {
          event.preventDefault();
          clearSelectedCells();
        }
      } else if (event.ctrlKey || event.metaKey) {
        if (event.key === 'a') {
          event.preventDefault();
          // Select all visible cells
          if (sheetData) {
            setSelectedRanges([{
              startRow: 0,
              startCol: 0,
              endRow: sheetData.totalRows - 1,
              endCol: sheetData.totalCols - 1
            }]);
          }
        } else if (event.key === 'r') {
          event.preventDefault();
          // Refresh current sheet
          refreshCurrentSheet();
        }
      }
    };

    const handleMouseUp = () => {
      if (isSelecting) {
        setIsSelecting(false);
        if (currentRange) {
          setSelectedRanges(prev => [...prev, currentRange]);
          setCurrentRange(null);
        }
        setSelectionStart(null);
      }
    };

    const preventSelectStart = (e: Event) => {
      if (isSelecting) {
        e.preventDefault();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('selectstart', preventSelectStart);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('selectstart', preventSelectStart);
    };
  }, [editingCell, isSelecting, currentRange, sheetData]);

  // Prevent context menu on table to avoid interfering with selection
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
  };

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
    const error = params.get('error');
    
    if (error) {
      setEditorStatus({
        status: 'error',
        message: `Authentication failed: ${error}`
      });
      window.history.replaceState({}, '', window.location.pathname);
    } else if (accessToken) {
      setAccessToken(accessToken);
      setIsAuthenticated(true);
      localStorage.setItem('google_access_token', accessToken);
      
      setEditorStatus({
        status: 'idle',
        message: ''
      });
      
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  const initiateGoogleAuth = () => {
    const finalRedirect = encodeURIComponent(window.location.href.split('?')[0]);
    window.location.href = `/auth/google?final_redirect=${finalRedirect}`;
  };

  const fetchSheets = async () => {
    if (!accessToken) return;

    try {
      setEditorStatus({ status: 'loading', message: 'Loading your sheets...' });
      
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
        setEditorStatus({ status: 'idle', message: '' });
      } else if (response.status === 401) {
        localStorage.removeItem('google_access_token');
        setIsAuthenticated(false);
        setAccessToken(null);
        setEditorStatus({ status: 'error', message: 'Authentication expired. Please sign in again.' });
      }
    } catch (error) {
      console.error('Failed to fetch sheets:', error);
      setEditorStatus({ status: 'error', message: 'Failed to load sheets' });
    }
  };

  const loadAllSheets = async (sheetId: string): Promise<SheetTab[]> => {
    if (!accessToken || isLoadingSheets) return [];

    try {
      setIsLoadingSheets(true);
      setEditorStatus({ status: 'loading', message: 'Loading sheet metadata...' });
      
      // Get all sheet metadata
      const metaResponse = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}?fields=sheets.properties`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        }
      );

      if (!metaResponse.ok) {
        throw new Error('Failed to load sheet metadata');
      }
      
      const metadata = await metaResponse.json();
      const sheetTabs: SheetTab[] = metadata.sheets.map((sheet: any) => ({
        sheetId: sheet.properties.sheetId,
        title: sheet.properties.title,
        index: sheet.properties.index,
        tabColor: sheet.properties.tabColor,
        gridProperties: sheet.properties.gridProperties || { rowCount: 100, columnCount: 20 }
      }));

      setAvailableSheets(sheetTabs);
      return sheetTabs;
      
    } catch (error) {
      console.error('Failed to load sheets:', error);
      setEditorStatus({ status: 'error', message: 'Failed to load sheet metadata' });
      return [];
    } finally {
      setIsLoadingSheets(false);
    }
  };

  const loadSheetData = async (sheetId: string, sheetIndex: number = 0, sheets?: SheetTab[]): Promise<void> => {
    if (!accessToken) return;

    try {
      setEditorStatus({ status: 'loading', message: 'Loading sheet data...' });
      
      // Use provided sheets or existing availableSheets
      const sheetsToUse = sheets || availableSheets;
      
      const currentSheet = sheetsToUse[sheetIndex];
      if (!currentSheet) {
        throw new Error('Sheet not found');
      }

      const sheetName = currentSheet.title;
      const gridProps = currentSheet.gridProperties;

      // Read data from selected sheet - expand range to ensure we get all data
      const range = `'${sheetName}'!A1:Z${Math.max(gridProps.rowCount || 100, 100)}`;
      const dataResponse = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${encodeURIComponent(range)}`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        }
      );

      if (!dataResponse.ok) {
        throw new Error('Failed to load sheet data');
      }
      
      const data = await dataResponse.json();
      const values = data.values || [];
      
      // Ensure we have at least a minimum grid size
      const minRows = Math.max(values.length, 20);
      const minCols = Math.max(
        values.reduce((max, row) => Math.max(max, row?.length || 0), 0),
        10
      );
      
      // Pad rows and columns to ensure consistent grid
      const paddedValues = Array.from({ length: minRows }, (_, rowIndex) => {
        const row = values[rowIndex] || [];
        return Array.from({ length: minCols }, (_, colIndex) => row[colIndex] || '');
      });

      setSheetData({
        values: paddedValues,
        sheetName: sheetName,
        totalRows: minRows,
        totalCols: minCols
      });

      // Initialize cell values for tracking edits
      const initialCellValues: {[key: string]: string} = {};
      paddedValues.forEach((row, rowIndex) => {
        row.forEach((cell, colIndex) => {
          initialCellValues[`${rowIndex}-${colIndex}`] = cell;
        });
      });
      setCellValues(initialCellValues);
      
      // Clear any existing selection when switching sheets
      clearSelection();
      
      setEditorStatus({ status: 'idle', message: '' });
    } catch (error) {
      console.error('Failed to load sheet data:', error);
      setEditorStatus({ status: 'error', message: 'Failed to load sheet data' });
    }
  };

  const switchToSheet = async (sheetIndex: number) => {
    if (!selectedSheet || sheetIndex === currentSheetIndex) return;
    
    setCurrentSheetIndex(sheetIndex);
    await loadSheetData(selectedSheet.id, sheetIndex, availableSheets);
  };

  const handleSelectSheet = async (sheet: GoogleSheet) => {
    setSelectedSheet(sheet);
    setShowSheetSelector(false);
    setCurrentSheetIndex(0); // Reset to first sheet
    
    // Load all sheets metadata first, then load data for the first sheet
    const sheets = await loadAllSheets(sheet.id);
    if (sheets.length > 0) {
      await loadSheetData(sheet.id, 0, sheets);
    }
  };

  const startEditing = (row: number, col: number) => {
    setEditingCell({ row, col });
  };

  const handleCellChange = (row: number, col: number, value: string) => {
    setCellValues(prev => ({
      ...prev,
      [`${row}-${col}`]: value
    }));
  };

  const saveCellEdit = async (row: number, col: number) => {
    if (!selectedSheet || !accessToken || !sheetData) return;

    try {
      setEditorStatus({ status: 'saving', message: 'Saving changes...' });
      
      const cellKey = `${row}-${col}`;
      const newValue = cellValues[cellKey] || '';
      
      // Convert to A1 notation
      const colLetter = String.fromCharCode(65 + col);
      const cellAddress = `${colLetter}${row + 1}`;
      
      const response = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${selectedSheet.id}/values/${sheetData.sheetName}!${cellAddress}?valueInputOption=USER_ENTERED`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            values: [[newValue]]
          })
        }
      );

      if (response.ok) {
        // Update local data
        setSheetData(prev => {
          if (!prev) return prev;
          const newValues = [...prev.values];
          newValues[row] = [...newValues[row]];
          newValues[row][col] = newValue;
          return { ...prev, values: newValues };
        });
        
        setEditorStatus({ status: 'idle', message: '' });
      } else {
        throw new Error('Failed to save cell');
      }
    } catch (error) {
      console.error('Failed to save cell:', error);
      setEditorStatus({ status: 'error', message: 'Failed to save changes' });
    }
    
    setEditingCell(null);
  };

  const cancelEdit = (row: number, col: number) => {
    const originalValue = sheetData?.values[row]?.[col] || '';
    setCellValues(prev => ({
      ...prev,
      [`${row}-${col}`]: originalValue
    }));
    setEditingCell(null);
  };

  const getColumnHeader = (index: number): string => {
    let result = '';
    let num = index;
    while (num >= 0) {
      result = String.fromCharCode(65 + (num % 26)) + result;
      num = Math.floor(num / 26) - 1;
    }
    return result;
  };

  // Utility functions for cell selection
  const isCellInRange = (row: number, col: number, range: CellRange): boolean => {
    return row >= Math.min(range.startRow, range.endRow) && 
           row <= Math.max(range.startRow, range.endRow) &&
           col >= Math.min(range.startCol, range.endCol) && 
           col <= Math.max(range.startCol, range.endCol);
  };

  const isCellSelected = (row: number, col: number): boolean => {
    if (currentRange && isCellInRange(row, col, currentRange)) {
      return true;
    }
    return selectedRanges.some(range => isCellInRange(row, col, range));
  };

  const getRangeString = (range: CellRange): string => {
    const startCol = getColumnHeader(Math.min(range.startCol, range.endCol));
    const endCol = getColumnHeader(Math.max(range.startCol, range.endCol));
    const startRow = Math.min(range.startRow, range.endRow) + 1;
    const endRow = Math.max(range.startRow, range.endRow) + 1;
    
    if (startCol === endCol && startRow === endRow) {
      return `${startCol}${startRow}`;
    }
    return `${startCol}${startRow}:${endCol}${endRow}`;
  };

  const getSelectedRangeString = (): string => {
    const allRanges = [...selectedRanges];
    if (currentRange) allRanges.push(currentRange);
    
    if (allRanges.length === 0) return '';
    if (allRanges.length === 1) return getRangeString(allRanges[0]);
    return `${allRanges.length} ranges selected`;
  };

  // Mouse event handlers for cell selection
  const handleCellMouseDown = (row: number, col: number, event: React.MouseEvent) => {
    event.preventDefault();
    
    // If we're editing a cell, don't start selection
    if (editingCell) return;
    
    setSelectionStart({ row, col });
    setIsSelecting(true);
    
    // Clear previous selection unless Ctrl/Cmd is held
    if (!event.ctrlKey && !event.metaKey) {
      setSelectedRanges([]);
    }
    
    // Start new range
    setCurrentRange({
      startRow: row,
      startCol: col,
      endRow: row,
      endCol: col
    });
  };

  const handleCellMouseMove = (row: number, col: number, event: React.MouseEvent) => {
    if (!isSelecting || !selectionStart) return;
    
    // Update current range
    setCurrentRange({
      startRow: selectionStart.row,
      startCol: selectionStart.col,
      endRow: row,
      endCol: col
    });
  };

  const handleCellMouseUp = (row: number, col: number, event: React.MouseEvent) => {
    if (!isSelecting || !currentRange) return;
    
    setIsSelecting(false);
    
    // Add current range to selected ranges
    setSelectedRanges(prev => [...prev, currentRange]);
    setCurrentRange(null);
    setSelectionStart(null);
  };

  const clearSelection = () => {
    setSelectedRanges([]);
    setCurrentRange(null);
    setIsSelecting(false);
    setSelectionStart(null);
  };

  // Bulk operations for selected cells
  const clearSelectedCells = async () => {
    if (!selectedSheet || !accessToken || !sheetData || selectedRanges.length === 0) return;
    
    try {
      setEditorStatus({ status: 'saving', message: 'Clearing selected cells...' });
      
      const clearRequests = selectedRanges.map(range => {
        const startCol = getColumnHeader(Math.min(range.startCol, range.endCol));
        const endCol = getColumnHeader(Math.max(range.startCol, range.endCol));
        const startRow = Math.min(range.startRow, range.endRow) + 1;
        const endRow = Math.max(range.startRow, range.endRow) + 1;
        
        const rangeString = `'${sheetData.sheetName}'!${startCol}${startRow}:${endCol}${endRow}`;
        
        return fetch(
          `https://sheets.googleapis.com/v4/spreadsheets/${selectedSheet.id}/values/${encodeURIComponent(rangeString)}:clear`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json'
            }
          }
        );
      });

      await Promise.all(clearRequests);
      
      // Update local state
      selectedRanges.forEach(range => {
        for (let row = Math.min(range.startRow, range.endRow); row <= Math.max(range.startRow, range.endRow); row++) {
          for (let col = Math.min(range.startCol, range.endCol); col <= Math.max(range.startCol, range.endCol); col++) {
            const cellKey = `${row}-${col}`;
            setCellValues(prev => ({ ...prev, [cellKey]: '' }));
          }
        }
      });
      
      // Update sheet data
      setSheetData(prev => {
        if (!prev) return prev;
        const newValues = [...prev.values];
        selectedRanges.forEach(range => {
          for (let row = Math.min(range.startRow, range.endRow); row <= Math.max(range.startRow, range.endRow); row++) {
            for (let col = Math.min(range.startCol, range.endCol); col <= Math.max(range.startCol, range.endCol); col++) {
              if (newValues[row]) {
                newValues[row] = [...newValues[row]];
                newValues[row][col] = '';
              }
            }
          }
        });
        return { ...prev, values: newValues };
      });
      
      setEditorStatus({ status: 'idle', message: '' });
    } catch (error) {
      console.error('Failed to clear cells:', error);
      setEditorStatus({ status: 'error', message: 'Failed to clear selected cells' });
    }
  };

  // Refresh current sheet data
  const refreshCurrentSheet = async () => {
    if (!selectedSheet || !availableSheets.length) return;
    
    try {
      setEditorStatus({ status: 'loading', message: 'Refreshing sheet data...' });
      
      // Clear selections to avoid conflicts with potentially changed data
      clearSelection();
      
      // Reload data for current sheet
      await loadSheetData(selectedSheet.id, currentSheetIndex, availableSheets);
      
      setEditorStatus({ status: 'idle', message: '' });
    } catch (error) {
      console.error('Failed to refresh sheet:', error);
      setEditorStatus({ status: 'error', message: 'Failed to refresh sheet data' });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-3">
            Google Sheets Editor
          </h1>
          <p className="text-lg text-gray-600">
            Edit your Google Sheets directly in a spreadsheet interface
          </p>
        </div>

        {/* Authentication & Sheet Selection */}
        {!isAuthenticated ? (
          <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md mx-auto">
            <div className="text-center">
              <FileSpreadsheet className="w-16 h-16 text-blue-600 mx-auto mb-4" />
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                Connect to Google Sheets
              </h2>
              <p className="text-gray-600 mb-6">
                Sign in with Google to start editing your spreadsheets
              </p>
              <button
                onClick={initiateGoogleAuth}
                className="w-full bg-blue-600 text-white font-medium py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center"
              >
                <FileSpreadsheet className="w-5 h-5 mr-2" />
                Sign in with Google
              </button>
            </div>
          </div>
        ) : !selectedSheet ? (
          <div className="bg-white rounded-2xl shadow-xl p-8 max-w-2xl mx-auto">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">
              Select a Spreadsheet
            </h2>
            <button
              onClick={fetchSheets}
              className="w-full bg-blue-600 text-white font-medium py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center mb-6"
            >
              <FileSpreadsheet className="w-5 h-5 mr-2" />
              Load My Spreadsheets
            </button>
            
            {sheets.length > 0 && (
              <div className="border rounded-lg overflow-hidden">
                {sheets.map((sheet) => (
                  <button
                    key={sheet.id}
                    onClick={() => handleSelectSheet(sheet)}
                    className="w-full px-6 py-4 hover:bg-gray-50 text-left border-b last:border-b-0 transition-colors"
                  >
                    <div className="font-medium">{sheet.name}</div>
                    <div className="text-sm text-gray-500">
                      Modified: {new Date(sheet.modifiedTime).toLocaleDateString()}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          /* Spreadsheet Interface */
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            {/* Header with sheet info */}
            <div className="p-6 border-b bg-gray-50">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-semibold text-gray-900">
                    {selectedSheet.name}
                  </h2>
                  <p className="text-gray-600">
                    Sheet: {sheetData?.sheetName}
                    {getSelectedRangeString() && (
                      <span className="ml-2 text-blue-600 font-medium">
                        • {getSelectedRangeString()}
                      </span>
                    )}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  {selectedRanges.length > 0 && (
                    <>
                      <button
                        onClick={clearSelectedCells}
                        className="px-3 py-1 text-sm bg-red-100 text-red-800 rounded-md hover:bg-red-200 transition-colors flex items-center"
                      >
                        <Trash2 className="w-3 h-3 mr-1" />
                        Delete
                      </button>
                      <button
                        onClick={clearSelection}
                        className="px-3 py-1 text-sm bg-blue-100 text-blue-800 rounded-md hover:bg-blue-200 transition-colors"
                      >
                        Clear Selection
                      </button>
                    </>
                  )}
                  <button
                    onClick={refreshCurrentSheet}
                    disabled={editorStatus.status === 'loading'}
                    className="px-3 py-2 bg-green-100 text-green-800 rounded-md hover:bg-green-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
                    title="Refresh sheet data (Ctrl+R)"
                  >
                    <RefreshCw className={`w-4 h-4 mr-1 ${editorStatus.status === 'loading' ? 'animate-spin' : ''}`} />
                    Refresh
                  </button>
                  <button
                    onClick={() => {
                      setSelectedSheet(null);
                      setSheetData(null);
                      setCellValues({});
                      setEditingCell(null);
                      setAvailableSheets([]);
                      clearSelection();
                    }}
                    className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors"
                  >
                    Change Sheet
                  </button>
                </div>
              </div>
            </div>

            {/* Sheet Tabs */}
            {availableSheets.length > 1 && (
              <div className="border-b bg-white px-4 py-2">
                <div className="flex space-x-1 overflow-x-auto">
                  {availableSheets.map((sheet, index) => (
                    <button
                      key={sheet.sheetId}
                      onClick={() => switchToSheet(index)}
                      className={`px-4 py-2 text-sm font-medium rounded-t-lg whitespace-nowrap transition-colors ${
                        index === currentSheetIndex
                          ? 'bg-blue-100 text-blue-800 border-b-2 border-blue-600'
                          : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
                      }`}
                      style={{
                        backgroundColor: index === currentSheetIndex ? undefined : 
                          sheet.tabColor ? `rgba(${sheet.tabColor.red * 255}, ${sheet.tabColor.green * 255}, ${sheet.tabColor.blue * 255}, 0.1)` : undefined
                      }}
                    >
                      {sheet.title}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Spreadsheet Grid */}
            {sheetData && (
              <div className="overflow-auto max-h-[70vh]">
                <table className="w-full border-collapse" onContextMenu={handleContextMenu}>
                  <thead className="bg-gray-100 sticky top-0">
                    <tr>
                      <th className="w-12 h-10 border border-gray-300 bg-gray-200"></th>
                      {Array.from({ length: sheetData.totalCols }, (_, index) => (
                        <th key={index} className="min-w-24 h-10 border border-gray-300 text-sm font-medium text-gray-700 px-2">
                          {getColumnHeader(index)}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {Array.from({ length: sheetData.totalRows }, (_, rowIndex) => (
                      <tr key={rowIndex} className="hover:bg-gray-50">
                        <td className="w-12 h-10 border border-gray-300 bg-gray-100 text-center text-sm font-medium text-gray-600">
                          {rowIndex + 1}
                        </td>
                        {Array.from({ length: sheetData.totalCols }, (_, colIndex) => {
                          const cellKey = `${rowIndex}-${colIndex}`;
                          const isEditing = editingCell?.row === rowIndex && editingCell?.col === colIndex;
                          const isSelected = isCellSelected(rowIndex, colIndex);
                          const cellValue = cellValues[cellKey] || '';

                          return (
                            <td 
                              key={colIndex} 
                              className={`min-w-24 h-10 border border-gray-300 p-0 relative group ${
                                isSelected ? 'bg-blue-100 border-blue-400' : ''
                              }`}
                              onMouseDown={(e) => handleCellMouseDown(rowIndex, colIndex, e)}
                              onMouseMove={(e) => handleCellMouseMove(rowIndex, colIndex, e)}
                              onMouseUp={(e) => handleCellMouseUp(rowIndex, colIndex, e)}
                              onMouseEnter={(e) => handleCellMouseMove(rowIndex, colIndex, e)}
                            >
                              {isEditing ? (
                                <div className="flex">
                                  <input
                                    type="text"
                                    value={cellValue}
                                    onChange={(e) => handleCellChange(rowIndex, colIndex, e.target.value)}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') {
                                        saveCellEdit(rowIndex, colIndex);
                                      } else if (e.key === 'Escape') {
                                        cancelEdit(rowIndex, colIndex);
                                      }
                                    }}
                                    className="w-full h-10 px-2 text-sm border-none outline-none focus:ring-2 focus:ring-blue-500"
                                    autoFocus
                                  />
                                  <div className="flex border-l">
                                    <button
                                      onClick={() => saveCellEdit(rowIndex, colIndex)}
                                      className="px-1 hover:bg-green-100 text-green-600"
                                    >
                                      <Check className="w-3 h-3" />
                                    </button>
                                    <button
                                      onClick={() => cancelEdit(rowIndex, colIndex)}
                                      className="px-1 hover:bg-red-100 text-red-600"
                                    >
                                      <X className="w-3 h-3" />
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <div
                                  onDoubleClick={() => startEditing(rowIndex, colIndex)}
                                  className={`w-full h-10 px-2 text-sm flex items-center cursor-cell ${
                                    !isSelected ? 'hover:bg-blue-50' : ''
                                  }`}
                                >
                                  {cellValue}
                                  {!isSelected && <Edit className="w-3 h-3 ml-auto opacity-0 group-hover:opacity-50" />}
                                </div>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Status Display */}
        {editorStatus.status !== 'idle' && (
          <div className={`mt-6 p-4 rounded-lg max-w-md mx-auto ${
            editorStatus.status === 'error' ? 'bg-red-50 border border-red-200' :
            'bg-blue-50 border border-blue-200'
          }`}>
            <div className="flex items-center">
              {editorStatus.status === 'error' && <AlertCircle className="w-5 h-5 text-red-600 mr-2 flex-shrink-0" />}
              {(editorStatus.status === 'loading' || editorStatus.status === 'saving') && <Loader2 className="w-5 h-5 text-blue-600 mr-2 flex-shrink-0 animate-spin" />}
              <p className={`font-medium ${
                editorStatus.status === 'error' ? 'text-red-800' : 'text-blue-800'
              }`}>
                {editorStatus.message}
              </p>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-gray-500 space-y-1">
          <div>
            Double-click to edit • Drag to select • Ctrl+click for multiple selections
          </div>
          <div>
            Ctrl+A: Select all • Ctrl+R: Refresh • Delete: Clear content • Escape: Clear selection
          </div>
        </div>
      </div>
    </div>
  );
};

export default GoogleSheetsEditor;