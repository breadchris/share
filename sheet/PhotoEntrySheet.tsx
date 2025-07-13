import React, { useState, useEffect, useRef } from "https://esm.sh/react@18";
import { Camera, Upload, Check, X, ArrowLeft, Plus, Settings, Eye, FileImage, MapPin, Clock, Loader2, AlertCircle } from "https://esm.sh/lucide-react@0.263.1";

interface GoogleSheet {
  id: string;
  name: string;
  modifiedTime: string;
}

interface PhotoEntry {
  timestamp: string;
  name: string;
  description: string;
  imageUrl: string;
  location?: string;
}

interface EntryStatus {
  status: 'idle' | 'capturing' | 'uploading' | 'saving' | 'success' | 'error';
  message: string;
  progress?: number;
}

interface RecentEntry {
  id: string;
  name: string;
  description: string;
  thumbnail: string;
  timestamp: string;
}

type ScreenMode = 'camera' | 'entry' | 'success';

const PhotoEntrySheet: React.FC = () => {
  // Authentication state (reused from GoogleSheetsEditor pattern)
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [sheets, setSheets] = useState<GoogleSheet[]>([]);
  const [selectedSheet, setSelectedSheet] = useState<GoogleSheet | null>(null);
  const [showSheetSelector, setShowSheetSelector] = useState(false);

  // Photo capture state
  const [currentScreen, setCurrentScreen] = useState<ScreenMode>('camera');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  
  // Entry form state
  const [entryName, setEntryName] = useState('');
  const [entryDescription, setEntryDescription] = useState('');
  const [isAISuggested, setIsAISuggested] = useState(false);
  const [entryStatus, setEntryStatus] = useState<EntryStatus>({
    status: 'idle',
    message: ''
  });

  // Recent entries
  const [recentEntries, setRecentEntries] = useState<RecentEntry[]>([]);

  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);

  // Updated OAuth scopes for write access to Sheets and Drive
  const SCOPES = [
    'https://www.googleapis.com/auth/spreadsheets',
    'https://www.googleapis.com/auth/drive.file',
    'https://www.googleapis.com/auth/drive.metadata.readonly'
  ].join(' ');

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
      setEntryStatus({
        status: 'error',
        message: `Authentication failed: ${error}`
      });
      window.history.replaceState({}, '', window.location.pathname);
    } else if (accessToken) {
      setAccessToken(accessToken);
      setIsAuthenticated(true);
      localStorage.setItem('google_access_token', accessToken);
      
      setEntryStatus({
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
      setEntryStatus({ status: 'uploading', message: 'Loading your sheets...' });
      
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
        setEntryStatus({ status: 'idle', message: '' });
      } else if (response.status === 401) {
        localStorage.removeItem('google_access_token');
        setIsAuthenticated(false);
        setAccessToken(null);
        setEntryStatus({ status: 'error', message: 'Authentication expired. Please sign in again.' });
      }
    } catch (error) {
      console.error('Failed to fetch sheets:', error);
      setEntryStatus({ status: 'error', message: 'Failed to load sheets' });
    }
  };

  const handleSelectSheet = (sheet: GoogleSheet) => {
    setSelectedSheet(sheet);
    setShowSheetSelector(false);
  };

  const handleFileCapture = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImageFile(file);
    
    // Create preview URL
    const reader = new FileReader();
    reader.onload = async (e) => {
      setCapturedImage(e.target?.result as string);
      setCurrentScreen('entry');
      
      // Start AI analysis
      setEntryStatus({ status: 'uploading', message: 'Analyzing image...', progress: 20 });
      
      try {
        const aiResult = await analyzeImageWithAI(file);
        if (aiResult) {
          setEntryName(aiResult.name);
          setEntryDescription(aiResult.description);
          setIsAISuggested(true);
          setEntryStatus({ status: 'idle', message: '' });
        } else {
          setIsAISuggested(false);
          setEntryStatus({ status: 'idle', message: '' });
        }
      } catch (error) {
        console.error('AI analysis error:', error);
        setIsAISuggested(false);
        setEntryStatus({ status: 'idle', message: '' });
      }
      
      // Auto-focus name input after AI analysis (or delay if no AI)
      setTimeout(() => {
        nameInputRef.current?.focus();
      }, 300);
    };
    reader.readAsDataURL(file);
  };

  // Helper function to search for folders by name in a parent folder
  const searchFolders = async (parentId: string, folderName: string): Promise<string | null> => {
    if (!accessToken) return null;

    try {
      const query = `name='${folderName}' and mimeType='application/vnd.google-apps.folder' and '${parentId}' in parents and trashed=false`;
      const response = await fetch(
        `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=files(id,name)`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );

      if (!response.ok) return null;
      
      const data = await response.json();
      return data.files && data.files.length > 0 ? data.files[0].id : null;
    } catch (error) {
      console.error('Error searching for folder:', error);
      return null;
    }
  };

  // Helper function to create a folder in Drive
  const createFolder = async (parentId: string, folderName: string): Promise<string> => {
    if (!accessToken) throw new Error('No access token');

    const metadata = {
      name: folderName,
      mimeType: 'application/vnd.google-apps.folder',
      parents: [parentId],
    };

    const response = await fetch(
      'https://www.googleapis.com/drive/v3/files',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(metadata),
      }
    );

    if (!response.ok) {
      throw new Error('Failed to create folder');
    }

    const result = await response.json();
    return result.id;
  };

  // Helper function to find or create the main PhotoEntry Photos folder
  const findOrCreatePhotoEntryFolder = async (): Promise<string> => {
    const folderName = 'PhotoEntry Photos';
    
    // Search for existing folder in root
    let folderId = await searchFolders('root', folderName);
    
    // Create if it doesn't exist
    if (!folderId) {
      folderId = await createFolder('root', folderName);
    }
    
    return folderId;
  };

  // Helper function to find or create sheet-specific folder
  const findOrCreateSheetFolder = async (parentId: string, sheetName: string): Promise<string> => {
    // Clean sheet name for folder (remove special characters)
    const cleanSheetName = sheetName.replace(/[<>:"/\\|?*]/g, '_');
    
    let folderId = await searchFolders(parentId, cleanSheetName);
    
    if (!folderId) {
      folderId = await createFolder(parentId, cleanSheetName);
    }
    
    return folderId;
  };

  // Helper function to find or create date-based folder (YYYY-MM format)
  const findOrCreateDateFolder = async (parentId: string): Promise<string> => {
    const now = new Date();
    const folderName = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    
    let folderId = await searchFolders(parentId, folderName);
    
    if (!folderId) {
      folderId = await createFolder(parentId, folderName);
    }
    
    return folderId;
  };

  const uploadImageToDrive = async (file: File): Promise<string> => {
    if (!accessToken || !selectedSheet) throw new Error('No access token or sheet selected');

    try {
      // Create folder hierarchy: PhotoEntry Photos/[SheetName]/[YYYY-MM]/
      const photoEntryFolderId = await findOrCreatePhotoEntryFolder();
      const sheetFolderId = await findOrCreateSheetFolder(photoEntryFolderId, selectedSheet.name);
      const dateFolderId = await findOrCreateDateFolder(sheetFolderId);

      // Create metadata for the file
      const metadata = {
        name: `photo_${Date.now()}_${file.name}`,
        parents: [dateFolderId], // Upload to organized folder structure
      };

      // Create form data for multipart upload
      const formData = new FormData();
      formData.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
      formData.append('file', file);

      const response = await fetch(
        'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart',
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error('Failed to upload image to Drive');
      }

      const result = await response.json();
      
      // Make the file publicly viewable
      await fetch(
        `https://www.googleapis.com/drive/v3/files/${result.id}/permissions`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            role: 'reader',
            type: 'anyone',
          }),
        }
      );

      // Return the shareable view URL
      return `https://drive.google.com/file/d/${result.id}/view`;
    } catch (error) {
      console.error('Error in folder creation or upload:', error);
      throw new Error('Failed to upload image with folder organization');
    }
  };

  const addEntryToSheet = async (entry: PhotoEntry) => {
    if (!selectedSheet || !accessToken) throw new Error('No sheet selected or no access token');

    const values = [[
      entry.timestamp,
      entry.name,
      entry.description,
      entry.imageUrl,
      entry.location || ''
    ]];

    const response = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${selectedSheet.id}/values/A:E:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          values
        })
      }
    );

    if (!response.ok) {
      throw new Error('Failed to add entry to sheet');
    }

    return response.json();
  };

  const analyzeImageWithAI = async (file: File): Promise<{name: string, description: string} | null> => {
    try {
      const formData = new FormData();
      formData.append('image', file);

      const response = await fetch('/ai/analyze-image', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        console.error('AI analysis failed:', response.status);
        return null;
      }

      const result = await response.json();
      return {
        name: result.name || '',
        description: result.description || ''
      };
    } catch (error) {
      console.error('Error analyzing image:', error);
      return null;
    }
  };

  const handleSaveEntry = async () => {
    if (!entryName.trim() || !imageFile || !selectedSheet) {
      setEntryStatus({
        status: 'error',
        message: 'Please provide a name and ensure an image is captured'
      });
      return;
    }

    try {
      setEntryStatus({ status: 'uploading', message: 'Uploading image...', progress: 30 });
      
      // Upload image to Google Drive
      const imageUrl = await uploadImageToDrive(imageFile);
      
      setEntryStatus({ status: 'saving', message: 'Saving to sheet...', progress: 70 });
      
      // Create entry object
      const entry: PhotoEntry = {
        timestamp: new Date().toISOString(),
        name: entryName.trim(),
        description: entryDescription.trim(),
        imageUrl,
        location: '' // TODO: Add GPS if requested
      };

      // Add to Google Sheet
      await addEntryToSheet(entry);

      // Add to recent entries for local display
      const recentEntry: RecentEntry = {
        id: Date.now().toString(),
        name: entry.name,
        description: entry.description,
        thumbnail: capturedImage || '',
        timestamp: entry.timestamp
      };
      
      setRecentEntries(prev => [recentEntry, ...prev.slice(0, 4)]); // Keep last 5

      setEntryStatus({ status: 'success', message: 'Entry saved successfully!', progress: 100 });
      setCurrentScreen('success');

      // Reset form
      setEntryName('');
      setEntryDescription('');
      setCapturedImage(null);
      setImageFile(null);

    } catch (error) {
      console.error('Failed to save entry:', error);
      setEntryStatus({ status: 'error', message: 'Failed to save entry. Please try again.' });
    }
  };

  const startNewEntry = () => {
    setCurrentScreen('camera');
    setEntryStatus({ status: 'idle', message: '' });
    setEntryName('');
    setEntryDescription('');
    setIsAISuggested(false);
    setCapturedImage(null);
    setImageFile(null);
  };

  const retakePhoto = () => {
    setCapturedImage(null);
    setImageFile(null);
    setCurrentScreen('camera');
    setEntryName('');
    setEntryDescription('');
    setIsAISuggested(false);
    // Clear the file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Render authentication screen
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-sm w-full text-center">
          <Camera className="w-16 h-16 text-blue-600 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            PhotoEntry
          </h1>
          <p className="text-gray-600 mb-6">
            Capture photos and save to Google Sheets
          </p>
          <button
            onClick={initiateGoogleAuth}
            className="w-full bg-blue-600 text-white font-medium py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center"
          >
            <Camera className="w-5 h-5 mr-2" />
            Sign in with Google
          </button>
        </div>
      </div>
    );
  }

  // Render sheet selection screen
  if (!selectedSheet) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <div className="max-w-md mx-auto pt-8">
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            <div className="p-6 border-b bg-gray-50">
              <h2 className="text-xl font-semibold text-gray-900">
                Select Spreadsheet
              </h2>
              <p className="text-gray-600 text-sm mt-1">
                Choose where to save your photos
              </p>
            </div>
            
            <div className="p-4">
              <button
                onClick={fetchSheets}
                className="w-full bg-blue-600 text-white font-medium py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center mb-4"
              >
                <FileImage className="w-5 h-5 mr-2" />
                Load My Spreadsheets
              </button>
              
              {sheets.length > 0 && (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {sheets.map((sheet) => (
                    <button
                      key={sheet.id}
                      onClick={() => handleSelectSheet(sheet)}
                      className="w-full p-4 text-left bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <div className="font-medium text-gray-900">{sheet.name}</div>
                      <div className="text-sm text-gray-500">
                        Modified: {new Date(sheet.modifiedTime).toLocaleDateString()}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between">
          {currentScreen !== 'camera' && (
            <button
              onClick={() => currentScreen === 'entry' ? retakePhoto() : startNewEntry()}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-700" />
            </button>
          )}
          
          <div className="flex-1 text-center">
            <h1 className="text-lg font-semibold text-gray-900">
              PhotoEntry
            </h1>
            <p className="text-xs text-gray-500">{selectedSheet.name}</p>
          </div>
          
          {currentScreen === 'entry' && (
            <button
              onClick={handleSaveEntry}
              disabled={entryStatus.status === 'uploading' || entryStatus.status === 'saving'}
              className="p-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
            >
              <Check className="w-5 h-5" />
            </button>
          )}
          
          {(currentScreen === 'camera' || currentScreen === 'success') && (
            <button
              onClick={() => setSelectedSheet(null)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Settings className="w-5 h-5 text-gray-700" />
            </button>
          )}
        </div>
      </div>

      <div className="max-w-md mx-auto">
        {/* Camera Screen */}
        {currentScreen === 'camera' && (
          <div className="p-4 space-y-6">
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
              <div className="aspect-square bg-gray-100 flex items-center justify-center border-2 border-dashed border-gray-300">
                {capturedImage ? (
                  <img 
                    src={capturedImage} 
                    alt="Captured" 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="text-center text-gray-500">
                    <Camera className="w-16 h-16 mx-auto mb-2" />
                    <p>Tap below to capture photo</p>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-3">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFileCapture}
                className="hidden"
              />
              
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full bg-blue-600 text-white font-medium py-4 rounded-xl hover:bg-blue-700 transition-colors flex items-center justify-center text-lg"
              >
                <Camera className="w-6 h-6 mr-2" />
                Take Photo
              </button>
              
              <button
                onClick={() => {
                  if (fileInputRef.current) {
                    fileInputRef.current.removeAttribute('capture');
                    fileInputRef.current.click();
                    fileInputRef.current.setAttribute('capture', 'environment');
                  }
                }}
                className="w-full bg-gray-200 text-gray-700 font-medium py-3 rounded-xl hover:bg-gray-300 transition-colors flex items-center justify-center"
              >
                <Upload className="w-5 h-5 mr-2" />
                Choose from Gallery
              </button>
            </div>
          </div>
        )}

        {/* Entry Screen */}
        {currentScreen === 'entry' && (
          <div className="p-4 space-y-6">
            {/* Image Preview */}
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
              <div className="aspect-video">
                <img 
                  src={capturedImage || ''} 
                  alt="Captured" 
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            {/* Entry Form */}
            <div className="bg-white rounded-2xl shadow-lg p-6 space-y-4">
              {entryStatus.status === 'uploading' && entryStatus.message === 'Analyzing image...' && (
                <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center">
                    <Loader2 className="w-4 h-4 text-blue-600 mr-2 animate-spin" />
                    <span className="text-sm text-blue-800">AI is analyzing your photo...</span>
                  </div>
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Name/Title *
                  {entryName && isAISuggested && (
                    <span className="ml-2 text-xs text-green-600">✨ AI suggested</span>
                  )}
                </label>
                <input
                  ref={nameInputRef}
                  type="text"
                  value={entryName}
                  onChange={(e) => {
                    setEntryName(e.target.value);
                    setIsAISuggested(false); // Clear AI flag when user edits manually
                  }}
                  placeholder="Enter item name..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                  {entryDescription && isAISuggested && (
                    <span className="ml-2 text-xs text-green-600">✨ AI suggested</span>
                  )}
                </label>
                <textarea
                  value={entryDescription}
                  onChange={(e) => {
                    setEntryDescription(e.target.value);
                    setIsAISuggested(false); // Clear AI flag when user edits manually
                  }}
                  placeholder="Add details..."
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <button
                onClick={handleSaveEntry}
                disabled={!entryName.trim() || entryStatus.status === 'uploading' || entryStatus.status === 'saving'}
                className="w-full bg-green-600 text-white font-medium py-4 rounded-xl hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center text-lg"
              >
                {(entryStatus.status === 'uploading' || entryStatus.status === 'saving') ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    {entryStatus.message}
                  </>
                ) : (
                  <>
                    <Check className="w-5 h-5 mr-2" />
                    Save Entry
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Success Screen */}
        {currentScreen === 'success' && (
          <div className="p-4 space-y-6">
            {/* Success Message */}
            <div className="bg-white rounded-2xl shadow-lg p-6 text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Entry Saved!
              </h2>
              <p className="text-gray-600">
                Your photo and details have been added to the spreadsheet.
              </p>
            </div>

            {/* Recent Entries */}
            {recentEntries.length > 0 && (
              <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
                <div className="p-4 border-b bg-gray-50">
                  <h3 className="font-medium text-gray-900">Recent Entries</h3>
                </div>
                <div className="divide-y divide-gray-100">
                  {recentEntries.map((entry) => (
                    <div key={entry.id} className="p-4 flex items-center space-x-3">
                      <img 
                        src={entry.thumbnail} 
                        alt={entry.name}
                        className="w-12 h-12 rounded-lg object-cover"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate">
                          {entry.name}
                        </p>
                        <p className="text-sm text-gray-500 truncate">
                          {entry.description}
                        </p>
                        <p className="text-xs text-gray-400 flex items-center mt-1">
                          <Clock className="w-3 h-3 mr-1" />
                          {new Date(entry.timestamp).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="space-y-3">
              <button
                onClick={startNewEntry}
                className="w-full bg-blue-600 text-white font-medium py-4 rounded-xl hover:bg-blue-700 transition-colors flex items-center justify-center text-lg"
              >
                <Plus className="w-5 h-5 mr-2" />
                Add Another Entry
              </button>
              
              <button
                onClick={() => window.open(`https://docs.google.com/spreadsheets/d/${selectedSheet.id}`, '_blank')}
                className="w-full bg-gray-200 text-gray-700 font-medium py-3 rounded-xl hover:bg-gray-300 transition-colors flex items-center justify-center"
              >
                <Eye className="w-5 h-5 mr-2" />
                View Full Sheet
              </button>
            </div>
          </div>
        )}

        {/* Status Display */}
        {entryStatus.status !== 'idle' && entryStatus.status !== 'success' && (
          <div className="p-4">
            <div className={`p-4 rounded-lg ${
              entryStatus.status === 'error' ? 'bg-red-50 border border-red-200' :
              'bg-blue-50 border border-blue-200'
            }`}>
              <div className="flex items-center">
                {entryStatus.status === 'error' && <AlertCircle className="w-5 h-5 text-red-600 mr-2 flex-shrink-0" />}
                {(entryStatus.status === 'uploading' || entryStatus.status === 'saving') && <Loader2 className="w-5 h-5 text-blue-600 mr-2 flex-shrink-0 animate-spin" />}
                <div className="flex-1">
                  <p className={`font-medium ${
                    entryStatus.status === 'error' ? 'text-red-800' : 'text-blue-800'
                  }`}>
                    {entryStatus.message}
                  </p>
                  
                  {entryStatus.progress && (entryStatus.status === 'uploading' || entryStatus.status === 'saving') && (
                    <div className="mt-2 w-full bg-white rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${entryStatus.progress}%` }}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PhotoEntrySheet;