import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Checkbox } from './ui/checkbox';
import { Badge } from './ui/badge';
import { Trash2, Plus, Package, AlertTriangle, Search, Filter, X, Edit3, Camera, Upload, Loader2, Cloud, CheckCircle, AlertCircle } from 'lucide-react';
import { Box, BoxItem } from '../App';

interface ItemManagerProps {
  boxes: Box[];
  onAddItem: (boxId: string, item: Omit<BoxItem, 'id'>) => Promise<void>;
  onRemoveItem: (boxId: string, itemId: string) => Promise<void>;
  onUpdateBox: (boxId: string, updates: Partial<Box>) => Promise<void>;
  isAuthenticated: boolean;
  selectedSheet: GoogleSheet | null;
  accessToken: string | null;
}

interface GoogleSheet {
  id: string;
  name: string;
  modifiedTime: string;
}

interface ItemStatus {
  status: 'idle' | 'analyzing' | 'uploading' | 'saving' | 'success' | 'error';
  message: string;
  progress?: number;
}

const CATEGORIES = [
  'Electronics', 'Clothing', 'Books', 'Kitchen', 'Fragile', 'Documents', 'Toys', 'Tools', 'Other'
];

// Component for handling image loading with fallback URLs
interface ImageWithFallbackProps {
  src: string;
  fallbackUrls: string[];
  alt: string;
  className: string;
}

const ImageWithFallback: React.FC<ImageWithFallbackProps> = ({ src, fallbackUrls, alt, className }) => {
  const [currentUrlIndex, setCurrentUrlIndex] = useState(0);
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const handleImageError = () => {
    console.log(`Failed to load image from: ${fallbackUrls[currentUrlIndex]}`);
    
    if (currentUrlIndex < fallbackUrls.length - 1) {
      setCurrentUrlIndex(prev => prev + 1);
      setHasError(false);
      setIsLoading(true);
    } else {
      setHasError(true);
      setIsLoading(false);
      console.error('All image URL formats failed for:', fallbackUrls);
    }
  };

  const handleImageLoad = () => {
    setIsLoading(false);
    setHasError(false);
    console.log(`Successfully loaded image from: ${fallbackUrls[currentUrlIndex]}`);
  };

  // Reset state when src changes
  useEffect(() => {
    setCurrentUrlIndex(0);
    setHasError(false);
    setIsLoading(true);
  }, [src]);

  if (hasError) {
    return (
      <div className={`${className} bg-gray-100 flex items-center justify-center border-2 border-dashed border-gray-300`}>
        <div className="text-center">
          <AlertCircle className="h-4 w-4 text-gray-400 mx-auto mb-1" />
          <span className="text-xs text-gray-400">Image failed</span>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      <img
        src={fallbackUrls[currentUrlIndex]}
        alt={alt}
        className={className}
        onError={handleImageError}
        onLoad={handleImageLoad}
        style={{ display: isLoading ? 'none' : 'block' }}
      />
      {isLoading && (
        <div className={`${className} bg-gray-100 flex items-center justify-center`}>
          <Loader2 className="h-4 w-4 text-gray-400 animate-spin" />
        </div>
      )}
    </div>
  );
};

export function ItemManager({ boxes, onAddItem, onRemoveItem, onUpdateBox, isAuthenticated, selectedSheet, accessToken }: ItemManagerProps) {
  // Existing state
  const [selectedBoxId, setSelectedBoxId] = useState('');
  const [newItem, setNewItem] = useState({
    name: '',
    description: '',
    category: '',
    fragile: false,
    image: ''
  });
  const [editingBoxNumber, setEditingBoxNumber] = useState<string | null>(null);
  const [boxNumberInput, setBoxNumberInput] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // Item addition state
  const [itemStatus, setItemStatus] = useState<ItemStatus>({
    status: 'idle',
    message: ''
  });
  const [isAddingItem, setIsAddingItem] = useState(false);

  // AI analysis state
  const [isAISuggested, setIsAISuggested] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);

  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);

  // Filter states (keeping existing functionality)
  const [filters, setFilters] = useState({
    search: '',
    room: '',
    category: '',
    fragileOnly: false,
    showEmpty: true,
    noBoxNumber: false
  });

  // Clear item status after successful operations
  useEffect(() => {
    if (itemStatus.status === 'success') {
      const timer = setTimeout(() => {
        setItemStatus({ status: 'idle', message: '' });
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [itemStatus.status]);

  // Remove Google auth - now handled in App

  // Helper function to format Google Drive URLs for display
  const formatDriveUrlForDisplay = (url: string): string => {
    if (!url) return '';
    
    // If it's a base64 image, return as is
    if (url.startsWith('data:')) return url;
    
    // If already in uc?export=view format, return as is
    if (url.includes('uc?export=view') || url.includes('uc?id=')) {
      return url;
    }
    
    // Convert Google Drive view URL to direct image URL
    // From: https://drive.google.com/file/d/FILE_ID/view
    // To: https://drive.google.com/uc?export=view&id=FILE_ID
    const driveFileMatch = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
    if (driveFileMatch) {
      return `https://drive.google.com/uc?export=view&id=${driveFileMatch[1]}`;
    }
    
    // If unknown format, return as is
    return url;
  };

  // Helper function to get alternative Drive URL formats
  const getDriveImageFallbackUrls = (url: string): string[] => {
    const fileIdMatch = url.match(/[?&]id=([a-zA-Z0-9_-]+)/) || url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
    if (!fileIdMatch) return [url];
    
    const fileId = fileIdMatch[1];
    return [
      url, // Original URL
      `https://drive.google.com/uc?export=view&id=${fileId}`, // Standard export format
      `https://drive.google.com/uc?id=${fileId}`, // Simpler format
      `https://lh3.googleusercontent.com/d/${fileId}`, // Google's image hosting
    ];
  };

  // Remove fetchSheets - now handled in App

  // Google Drive upload helper (moved from App for image uploads)
  const uploadImageToDrive = async (file: File): Promise<string> => {
    if (!accessToken || !selectedSheet) throw new Error('No access token or sheet selected');

    const searchFolders = async (parentId: string, folderName: string): Promise<string | null> => {
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

    const createFolder = async (parentId: string, folderName: string): Promise<string> => {
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

    try {
      // Create folder hierarchy: Moving Photos/[SheetName]/[YYYY-MM]/
      const folderName = 'Moving Photos';
      let folderId = await searchFolders('root', folderName);
      if (!folderId) {
        folderId = await createFolder('root', folderName);
      }

      const cleanSheetName = selectedSheet.name.replace(/[<>:"/\\|?*]/g, '_');
      let sheetFolderId = await searchFolders(folderId, cleanSheetName);
      if (!sheetFolderId) {
        sheetFolderId = await createFolder(folderId, cleanSheetName);
      }

      const now = new Date();
      const dateFolder = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      let dateFolderId = await searchFolders(sheetFolderId, dateFolder);
      if (!dateFolderId) {
        dateFolderId = await createFolder(sheetFolderId, dateFolder);
      }

      // Create metadata for the file
      const metadata = {
        name: `item_${Date.now()}_${file.name}`,
        parents: [dateFolderId],
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
      const permissionResponse = await fetch(
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

      if (!permissionResponse.ok) {
        console.error('Failed to set file permissions:', await permissionResponse.text());
        // Continue anyway - the file is uploaded, just may not be publicly accessible
      } else {
        console.log('Successfully set public permissions for file:', result.id);
      }

      // Return the direct image URL format for better compatibility
      return `https://drive.google.com/uc?export=view&id=${result.id}`;
    } catch (error) {
      console.error('Error in folder creation or upload:', error);
      throw new Error('Failed to upload image with folder organization');
    }
  };

  const analyzeImageWithAI = async (file: File): Promise<{name: string, description: string, category?: string, fragile?: boolean} | null> => {
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

      // Enhanced AI analysis for moving items
      const category = result.category || (result.name && CATEGORIES.find(cat =>
        result.name.toLowerCase().includes(cat.toLowerCase()) ||
        (result.description && result.description.toLowerCase().includes(cat.toLowerCase()))
      ));

      const fragile = result.fragile || (result.description &&
        /fragile|delicate|breakable|glass|ceramic|crystal/i.test(result.description));

      return {
        name: result.name || '',
        description: result.description || '',
        category: category || '',
        fragile: fragile || false
      };
    } catch (error) {
      console.error('Error analyzing image:', error);
      return null;
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBoxId || !newItem.name.trim()) return;

    onAddItem(selectedBoxId, {
      name: newItem.name.trim(),
      description: newItem.description.trim() || undefined,
      category: newItem.category || undefined,
      fragile: newItem.fragile,
      image: newItem.image || undefined
    });

    setNewItem({ name: '', description: '', category: '', fragile: false, image: '' });
    setImagePreview(null);
  };

  const handleBoxNumberEdit = (boxId: string) => {
    const box = boxes.find(b => b.id === boxId);
    setEditingBoxNumber(boxId);
    setBoxNumberInput(box?.boxNumber || '');
  };

  const handleBoxNumberSave = (boxId: string) => {
    onUpdateBox(boxId, { boxNumber: boxNumberInput.trim() || undefined });
    setEditingBoxNumber(null);
    setBoxNumberInput('');
  };

  const handleBoxNumberCancel = () => {
    setEditingBoxNumber(null);
    setBoxNumberInput('');
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check file size (limit to 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setItemStatus({ status: 'error', message: 'Image size must be less than 5MB' });
      return;
    }

    // Check file type
    if (!file.type.startsWith('image/')) {
      setItemStatus({ status: 'error', message: 'Please select a valid image file' });
      return;
    }

    setImageFile(file);

    // Create preview URL
    const reader = new FileReader();
    reader.onload = async (e) => {
      const base64String = e.target?.result as string;
      setNewItem(prev => ({ ...prev, image: base64String }));
      setImagePreview(base64String);

      // Start AI analysis
      setItemStatus({ status: 'analyzing', message: 'Analyzing image with AI...', progress: 20 });

      try {
        const aiResult = await analyzeImageWithAI(file);
        if (aiResult) {
          setNewItem(prev => ({
            ...prev,
            name: aiResult.name || prev.name,
            description: aiResult.description || prev.description,
            category: aiResult.category || prev.category,
            fragile: aiResult.fragile || prev.fragile
          }));
          setIsAISuggested(true);
          setItemStatus({ status: 'success', message: 'AI analysis complete!' });

          // Clear success message after 2 seconds
          setTimeout(() => {
            setItemStatus({ status: 'idle', message: '' });
          }, 2000);
        } else {
          setIsAISuggested(false);
          setItemStatus({ status: 'idle', message: '' });
        }
      } catch (error) {
        console.error('AI analysis error:', error);
        setIsAISuggested(false);
        setItemStatus({ status: 'idle', message: '' });
      }

      // Auto-focus name input after AI analysis
      setTimeout(() => {
        nameInputRef.current?.focus();
      }, 300);
    };
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setNewItem(prev => ({ ...prev, image: '' }));
    setImagePreview(null);
    setImageFile(null);
    setIsAISuggested(false);
  };

  // Remove Google Sheets item operations - now handled in App.tsx

  const handleSubmitWithSheets = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBoxId || !newItem.name.trim() || isAddingItem) return;

    setIsAddingItem(true);

    try {
      let imageUrl = '';

      // If there's an image and we have authentication, upload to Drive
      if (imageFile && isAuthenticated && selectedSheet && accessToken) {
        setItemStatus({ status: 'uploading', message: 'Uploading image to Google Drive...', progress: 30 });
        imageUrl = await uploadImageToDrive(imageFile);
      }

      setItemStatus({ status: 'saving', message: 'Saving to Google Sheets...', progress: 70 });

      // Create the item object with Drive URL instead of base64
      const itemData: Omit<BoxItem, 'id'> = {
        name: newItem.name.trim(),
        description: newItem.description.trim() || undefined,
        category: newItem.category || undefined,
        fragile: newItem.fragile,
        image: imageUrl || undefined
      };

      // Save via App's onAddItem which handles Google Sheets
      await onAddItem(selectedBoxId, itemData);

      setItemStatus({ status: 'success', message: 'Item saved to Google Sheets!', progress: 100 });

      // Reset form
      setNewItem({ name: '', description: '', category: '', fragile: false, image: '' });
      setImagePreview(null);
      setImageFile(null);
      setIsAISuggested(false);

    } catch (error) {
      console.error('Failed to save item:', error);
      setItemStatus({ status: 'error', message: 'Failed to save item. Please try again.' });
    } finally {
      setIsAddingItem(false);
    }
  };

  const selectedBox = boxes.find(box => box.id === selectedBoxId);

  // Get unique values for filter dropdowns
  const uniqueRooms = useMemo(() =>
    [...new Set(boxes.map(box => box.room))].sort(),
    [boxes]
  );

  const uniqueCategories = useMemo(() =>
    [...new Set(boxes.flatMap(box => box.items.map(item => item.category)).filter(Boolean))].sort(),
    [boxes]
  );

  // Filtered boxes for overview section
  const filteredBoxes = useMemo(() => {
    return boxes.filter(box => {
      // Room filter
      if (filters.room && box.room !== filters.room) return false;
      
      // Empty boxes filter
      if (!filters.showEmpty && box.items.length === 0) return false;
      
      // Search filter (box name, room, box number, or item names)
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const matchesBox = box.name.toLowerCase().includes(searchLower) || 
                          box.room.toLowerCase().includes(searchLower) ||
                          (box.boxNumber && box.boxNumber.toLowerCase().includes(searchLower));
        const matchesItems = box.items.some(item => 
          item.name.toLowerCase().includes(searchLower) ||
          (item.description && item.description.toLowerCase().includes(searchLower))
        );
        if (!matchesBox && !matchesItems) return false;
      }
      
      // Category filter (at least one item must match)
      if (filters.category) {
        const hasMatchingCategory = box.items.some(item => item.category === filters.category);
        if (!hasMatchingCategory) return false;
      }
      
      // Fragile filter (at least one fragile item)
      if (filters.fragileOnly) {
        const hasFragileItems = box.items.some(item => item.fragile);
        if (!hasFragileItems) return false;
      }
      
      // No box number filter
      if (filters.noBoxNumber) {
        if (box.boxNumber && box.boxNumber.trim()) return false;
      }
      
      return true;
    });
  }, [boxes, filters]);

  const clearFilters = () => {
    setFilters({
      search: '',
      room: '',
      category: '',
      fragileOnly: false,
      showEmpty: true,
      noBoxNumber: false
    });
  };

  const hasActiveFilters = filters.search || filters.room || filters.category || filters.fragileOnly || !filters.showEmpty || filters.noBoxNumber;

  return (
    <div className="space-y-8">

      {/* Status Display */}
      {itemStatus.status !== 'idle' && (
        <Card className={`border ${
          itemStatus.status === 'error' ? 'border-red-200 bg-red-50' :
          itemStatus.status === 'success' ? 'border-green-200 bg-green-50' :
          'border-blue-200 bg-blue-50'
        }`}>
          <CardContent className="pt-4">
            <div className="flex items-center">
              {itemStatus.status === 'error' && <AlertCircle className="w-5 h-5 text-red-600 mr-2 flex-shrink-0" />}
              {itemStatus.status === 'success' && <CheckCircle className="w-5 h-5 text-green-600 mr-2 flex-shrink-0" />}
              {(itemStatus.status === 'analyzing' || itemStatus.status === 'uploading' || itemStatus.status === 'saving') &&
                <Loader2 className="w-5 h-5 text-blue-600 mr-2 flex-shrink-0 animate-spin" />}
              <div className="flex-1">
                <p className={`font-medium ${
                  itemStatus.status === 'error' ? 'text-red-800' : 
                  itemStatus.status === 'success' ? 'text-green-800' :
                  'text-blue-800'
                }`}>
                  {itemStatus.message}
                </p>

                {itemStatus.progress && (itemStatus.status === 'analyzing' || itemStatus.status === 'uploading' || itemStatus.status === 'saving') && (
                  <div className="mt-2 w-full bg-white rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${itemStatus.progress}%` }}
                    />
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Add Items Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Plus className="h-5 w-5" />
            <span>Add Items to Box</span>
            {selectedSheet && (
              <Badge variant="secondary" className="ml-auto">
                <Cloud className="h-3 w-3 mr-1" />
                {selectedSheet.name}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {boxes.length === 0 ? (
            <div className="text-center py-8">
              <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No boxes available. Create a box label first!</p>
            </div>
          ) : (
            <form onSubmit={handleSubmitWithSheets} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="box-select">Select Box</Label>
                <Select value={selectedBoxId} onValueChange={setSelectedBoxId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a box to add items to" />
                  </SelectTrigger>
                  <SelectContent>
                    {boxes.map(box => (
                      <SelectItem key={box.id} value={box.id}>
                        <div className="flex items-center space-x-2">
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ background: box.color }}
                          />
                          <span>{box.name} ({box.room})</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedBoxId && (
                <>
                  {/* AI Analysis Status */}
                  {itemStatus.status === 'analyzing' && (
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex items-center">
                        <Loader2 className="w-4 h-4 text-blue-600 mr-2 animate-spin" />
                        <span className="text-sm text-blue-800">AI is analyzing your image...</span>
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="item-image">Image (Optional - AI Analysis Available)</Label>
                    <div className="space-y-2">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        capture="environment"
                        onChange={handleImageUpload}
                        className="hidden"
                      />

                      <div className="flex space-x-2">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => fileInputRef.current?.click()}
                          className="flex-1"
                        >
                          <Camera className="h-4 w-4 mr-2" />
                          Take Photo
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            if (fileInputRef.current) {
                              fileInputRef.current.removeAttribute('capture');
                              fileInputRef.current.click();
                              fileInputRef.current.setAttribute('capture', 'environment');
                            }
                          }}
                          className="flex-1"
                        >
                          <Upload className="h-4 w-4 mr-2" />
                          Upload
                        </Button>
                      </div>

                      {imagePreview && (
                        <div className="relative inline-block">
                          <img
                            src={imagePreview}
                            alt="Item preview"
                            className="w-32 h-32 object-cover rounded-md border"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={removeImage}
                            className="absolute -top-2 -right-2 w-6 h-6 p-0 rounded-full bg-red-500 text-white hover:bg-red-600"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="item-name">
                        Item Name *
                        {newItem.name && isAISuggested && (
                          <span className="ml-2 text-xs text-green-600">✨ AI suggested</span>
                        )}
                      </Label>
                      <Input
                        ref={nameInputRef}
                        id="item-name"
                        value={newItem.name}
                        onChange={(e) => {
                          setNewItem(prev => ({ ...prev, name: e.target.value }));
                          setIsAISuggested(false); // Clear AI flag when user edits manually
                        }}
                        placeholder="e.g., Coffee Maker"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="category">
                        Category
                        {newItem.category && isAISuggested && (
                          <span className="ml-2 text-xs text-green-600">✨ AI suggested</span>
                        )}
                      </Label>
                      <Select
                        value={newItem.category}
                        onValueChange={(value) => {
                          setNewItem(prev => ({ ...prev, category: value }));
                          setIsAISuggested(false);
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          {CATEGORIES.map(category => (
                            <SelectItem key={category} value={category}>{category}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">
                      Description (Optional)
                      {newItem.description && isAISuggested && (
                        <span className="ml-2 text-xs text-green-600">✨ AI suggested</span>
                      )}
                    </Label>
                    <Input
                      id="description"
                      value={newItem.description}
                      onChange={(e) => {
                        setNewItem(prev => ({ ...prev, description: e.target.value }));
                        setIsAISuggested(false);
                      }}
                      placeholder="Additional details about the item"
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="fragile"
                      checked={newItem.fragile}
                      onCheckedChange={(checked) => {
                        setNewItem(prev => ({ ...prev, fragile: !!checked }));
                        setIsAISuggested(false);
                      }}
                    />
                    <Label htmlFor="fragile" className="flex items-center space-x-1">
                      <AlertTriangle className="h-4 w-4 text-orange-500" />
                      <span>Fragile item</span>
                      {newItem.fragile && isAISuggested && (
                        <span className="ml-2 text-xs text-green-600">✨ AI detected</span>
                      )}
                    </Label>
                  </div>

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={!newItem.name.trim() || isAddingItem || itemStatus.status === 'analyzing' || itemStatus.status === 'uploading' || itemStatus.status === 'saving'}
                  >
                    {isAddingItem || itemStatus.status === 'saving' || itemStatus.status === 'uploading' ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        {itemStatus.status === 'uploading' ? 'Uploading...' : 'Saving...'}
                      </>
                    ) : (
                      <>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Item to Google Sheets
                      </>
                    )}
                  </Button>
                </>
              )}
            </form>
          )}
        </CardContent>
      </Card>

      {/* Box Contents */}
      {selectedBox && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <div
                className="w-5 h-5 rounded-full"
                style={{ background: selectedBox.color }}
              />
              <span>{selectedBox.name} Contents</span>
              <Badge variant="secondary">{selectedBox.items.length} items</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedBox.items.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No items added to this box yet.</p>
            ) : (
              <div className="space-y-2">
                {selectedBox.items.map(item => (
                  <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3 flex-1">
                      {item.image && (
                        <ImageWithFallback
                          src={formatDriveUrlForDisplay(item.image)}
                          fallbackUrls={getDriveImageFallbackUrls(item.image)}
                          alt={item.name}
                          className="w-12 h-12 object-cover rounded-md border"
                        />
                      )}
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <span className="font-medium">{item.name}</span>
                          {item.fragile && (
                            <AlertTriangle className="h-4 w-4 text-orange-500" title="Fragile" />
                          )}
                          {item.category && (
                            <Badge variant="outline" className="text-xs">
                              {item.category}
                            </Badge>
                          )}
                        </div>
                        {item.description && (
                          <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={async () => {
                        try {
                          await onRemoveItem(selectedBox.id, item.id);
                        } catch (error) {
                          console.error('Failed to remove item:', error);
                        }
                      }}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* All Boxes Overview with existing filter functionality... */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">All Boxes Overview</h2>
          <Badge variant="secondary">
            {filteredBoxes.length} of {boxes.length} boxes
          </Badge>
        </div>

        {/* Filters - keeping existing implementation */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Filter className="h-5 w-5" />
              <span>Filters</span>
              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearFilters}
                  className="ml-auto text-xs"
                >
                  <X className="h-3 w-3 mr-1" />
                  Clear All
                </Button>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Search */}
              <div className="space-y-2">
                <Label htmlFor="search">Search</Label>
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                  <Input
                    id="search"
                    placeholder="Search boxes, items, or box numbers..."
                    value={filters.search}
                    onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                    className="pl-8"
                  />
                </div>
              </div>

              {/* Room Filter */}
              <div className="space-y-2">
                <Label htmlFor="room-filter">Room</Label>
                <Select value={filters.room || 'all-rooms'} onValueChange={(value) => setFilters(prev => ({ ...prev, room: value === 'all-rooms' ? '' : value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="All rooms" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all-rooms">All rooms</SelectItem>
                    {uniqueRooms.map(room => (
                      <SelectItem key={room} value={room}>{room}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Category Filter */}
              <div className="space-y-2">
                <Label htmlFor="category-filter">Category</Label>
                <Select value={filters.category || 'all-categories'} onValueChange={(value) => setFilters(prev => ({ ...prev, category: value === 'all-categories' ? '' : value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="All categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all-categories">All categories</SelectItem>
                    {uniqueCategories.map(category => (
                      <SelectItem key={category} value={category}>{category}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Additional Filters */}
              <div className="space-y-3">
                <Label>Options</Label>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="fragile-only"
                      checked={filters.fragileOnly}
                      onCheckedChange={(checked) => setFilters(prev => ({ ...prev, fragileOnly: !!checked }))}
                    />
                    <Label htmlFor="fragile-only" className="text-sm">
                      Fragile items only
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="show-empty"
                      checked={filters.showEmpty}
                      onCheckedChange={(checked) => setFilters(prev => ({ ...prev, showEmpty: !!checked }))}
                    />
                    <Label htmlFor="show-empty" className="text-sm">
                      Show empty boxes
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="no-box-number"
                      checked={filters.noBoxNumber}
                      onCheckedChange={(checked) => setFilters(prev => ({ ...prev, noBoxNumber: !!checked }))}
                    />
                    <Label htmlFor="no-box-number" className="text-sm">
                      No box number only
                    </Label>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Filter Summary */}
        {hasActiveFilters && filteredBoxes.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold">{filteredBoxes.length}</div>
                <p className="text-xs text-muted-foreground">Boxes Found</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold">
                  {filteredBoxes.reduce((sum, box) => sum + box.items.length, 0)}
                </div>
                <p className="text-xs text-muted-foreground">Total Items</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-orange-600">
                  {filteredBoxes.reduce((sum, box) => sum + box.items.filter(item => item.fragile).length, 0)}
                </div>
                <p className="text-xs text-muted-foreground">Fragile Items</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold">
                  {filteredBoxes.filter(box => box.items.length === 0).length}
                </div>
                <p className="text-xs text-muted-foreground">Empty Boxes</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Results */}
        {filteredBoxes.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">
                {hasActiveFilters ? 'No boxes match your filters.' : 'No boxes found.'}
              </p>
              {hasActiveFilters && (
                <Button variant="outline" onClick={clearFilters} className="mt-2">
                  Clear Filters
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredBoxes.map(box => (
              <Card
                key={box.id}
                className={`cursor-pointer transition-all ${
                  selectedBoxId === box.id ? 'ring-2 ring-blue-500' : 'hover:shadow-md'
                }`}
                onClick={() => setSelectedBoxId(box.id)}
              >
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center space-x-2 text-lg">
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ background: box.color }}
                    />
                    <span>{box.name}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Room:</span>
                      <Badge variant="secondary">{box.room}</Badge>
                    </div>
                    <div className="flex justify-between" onClick={(e) => e.stopPropagation()}>
                      <span className="text-gray-600">Box Number:</span>
                      <div className="flex items-center space-x-1">
                        {editingBoxNumber === box.id ? (
                          <div className="flex items-center space-x-1">
                            <Input
                              value={boxNumberInput}
                              onChange={(e) => setBoxNumberInput(e.target.value)}
                              placeholder="e.g., 001"
                              className="w-16 h-6 text-xs"
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleBoxNumberSave(box.id);
                                if (e.key === 'Escape') handleBoxNumberCancel();
                              }}
                              autoFocus
                            />
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleBoxNumberSave(box.id)}
                              className="h-5 w-5 p-0 text-xs"
                            >
                              ✓
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={handleBoxNumberCancel}
                              className="h-5 w-5 p-0 text-xs"
                            >
                              ✕
                            </Button>
                          </div>
                        ) : (
                          <div className="flex items-center space-x-1">
                            <span className="text-sm">
                              {box.boxNumber || 'None'}
                            </span>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleBoxNumberEdit(box.id)}
                              className="h-4 w-4 p-0 text-gray-400 hover:text-gray-600"
                            >
                              <Edit3 className="h-3 w-3" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Items:</span>
                      <span>{box.items.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Fragile Items:</span>
                      <span className="text-orange-600">
                        {box.items.filter(item => item.fragile).length}
                      </span>
                    </div>
                    {box.items.length > 0 && (
                      <div className="pt-2 border-t">
                        <div className="flex flex-wrap gap-1">
                          {[...new Set(box.items.map(item => item.category).filter(Boolean))].map(category => (
                            <Badge key={category} variant="outline" className="text-xs">
                              {category}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
