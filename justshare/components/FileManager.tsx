import React, { useState, useEffect, useCallback } from 'react';
import { FileManagerSidebar } from './FileManagerSidebar';
import { FileManagerContent } from './FileManagerContent';
import { FileManagerToolbar } from './FileManagerToolbar';
import { DocumentEditor } from './DocumentEditor';
import { createContent, getFiles, deleteContent } from '../utils/api';
import { getCurrentUser } from '../utils/auth';
import { 
  Folder, 
  FileText, 
  Plus, 
  Grid3x3, 
  List,
  Search,
  ChevronRight
} from 'lucide-react';

export interface FileItem {
  id: string;
  name: string;
  type: 'folder' | 'document';
  path: string;
  parentId?: string;
  createdAt: Date;
  modifiedAt: Date;
  size?: number;
  content?: any[];
}

interface FileManagerProps {
  groupId: string;
  onClose?: () => void;
}

export const FileManager: React.FC<FileManagerProps> = ({ groupId, onClose }) => {
  const [currentPath, setCurrentPath] = useState<string>('/');
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDocument, setOpenDocument] = useState<FileItem | null>(null);
  const [username, setUsername] = useState<string>('');

  // Get current user for root path
  useEffect(() => {
    const loadUser = async () => {
      const user = await getCurrentUser();
      if (user) {
        setUsername(user.username);
        setCurrentPath(`/${user.username}`);
      }
    };
    loadUser();
  }, []);

  // Load files for current path
  const loadFiles = useCallback(async () => {
    if (!username) return;
    
    setLoading(true);
    try {
      const response = await getFiles(groupId, currentPath);
      
      // Map the response to FileItem format
      const fileItems: FileItem[] = response.map(item => {
        const metadata = item.metadata || {};
        return {
          id: item.id,
          name: metadata.title || 'Untitled',
          type: item.type as 'folder' | 'document',
          path: metadata.path || currentPath,
          parentId: metadata.parent_id,
          createdAt: new Date(item.created_at),
          modifiedAt: new Date(item.updated_at),
          size: metadata.size,
          content: metadata.content
        };
      })
      .filter(item => {
        // Filter by current path - only show items in current directory
        const itemDir = item.path.substring(0, item.path.lastIndexOf('/'));
        return itemDir === currentPath;
      });

      setFiles(fileItems);
    } catch (error) {
      console.error('Failed to load files:', error);
    } finally {
      setLoading(false);
    }
  }, [groupId, currentPath, username]);

  useEffect(() => {
    if (username) {
      loadFiles();
    }
  }, [loadFiles, username]);

  // Generate deterministic ID from path
  const generateIdFromPath = async (path: string): Promise<string> => {
    const encoder = new TextEncoder();
    const data = encoder.encode(path);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex.substring(0, 32); // Use first 32 chars as ID
  };

  const handleCreateFolder = async () => {
    const folderName = prompt('Enter folder name:');
    if (!folderName) return;

    const folderPath = `${currentPath}/${folderName}`;
    const folderId = await generateIdFromPath(folderPath);

    try {
      await createContent({
        type: 'folder',
        data: '',
        group_id: groupId,
        metadata: {
          title: folderName,
          path: folderPath,
          parent_id: currentPath,
          is_folder: true
        }
      });
      
      await loadFiles();
    } catch (error) {
      console.error('Failed to create folder:', error);
    }
  };

  const handleCreateDocument = async () => {
    const docName = prompt('Enter document name:');
    if (!docName) return;

    const docPath = `${currentPath}/${docName}`;
    const docId = await generateIdFromPath(docPath);

    try {
      await createContent({
        type: 'document',
        data: '',
        group_id: groupId,
        metadata: {
          title: docName,
          path: docPath,
          parent_id: currentPath,
          is_folder: false,
          content: []
        }
      });
      
      await loadFiles();
    } catch (error) {
      console.error('Failed to create document:', error);
    }
  };

  const handleItemClick = (item: FileItem) => {
    if (item.type === 'folder') {
      setCurrentPath(item.path);
      setSelectedItems(new Set());
    } else {
      setOpenDocument(item);
    }
  };

  const handleItemSelect = (item: FileItem, isMultiSelect: boolean) => {
    const newSelection = new Set(selectedItems);
    
    if (isMultiSelect) {
      if (newSelection.has(item.id)) {
        newSelection.delete(item.id);
      } else {
        newSelection.add(item.id);
      }
    } else {
      newSelection.clear();
      newSelection.add(item.id);
    }
    
    setSelectedItems(newSelection);
  };

  const handleDelete = async (itemIds: string[]) => {
    if (!confirm(`Delete ${itemIds.length} item(s)?`)) return;

    try {
      await Promise.all(itemIds.map(id => deleteContent(id)));
      await loadFiles();
      setSelectedItems(new Set());
    } catch (error) {
      console.error('Failed to delete items:', error);
    }
  };

  const handleSaveDocument = async (content: any[]) => {
    if (!openDocument) return;

    try {
      // Update document content in the backend
      await createContent({
        type: 'document',
        data: JSON.stringify(content),
        group_id: groupId,
        metadata: {
          ...openDocument,
          content,
          modifiedAt: new Date()
        }
      });
    } catch (error) {
      console.error('Failed to save document:', error);
      throw error;
    }
  };

  // Show document editor if a document is open
  if (openDocument) {
    return (
      <DocumentEditor
        documentId={openDocument.id}
        documentPath={openDocument.path}
        title={openDocument.name}
        initialContent={openDocument.content}
        onSave={handleSaveDocument}
        onClose={() => {
          setOpenDocument(null);
          loadFiles(); // Refresh files after closing
        }}
      />
    );
  }

  // Breadcrumb navigation
  const pathParts = currentPath.split('/').filter(Boolean);

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="px-4 py-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <h1 className="text-xl font-semibold">Files</h1>
              <nav className="flex items-center space-x-1 text-sm">
                <button
                  onClick={() => setCurrentPath(`/${username}`)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  {username}
                </button>
                {pathParts.slice(1).map((part, index) => {
                  const path = '/' + pathParts.slice(0, index + 2).join('/');
                  return (
                    <React.Fragment key={path}>
                      <ChevronRight className="h-4 w-4 text-gray-400" />
                      <button
                        onClick={() => setCurrentPath(path)}
                        className="text-gray-500 hover:text-gray-700"
                      >
                        {part}
                      </button>
                    </React.Fragment>
                  );
                })}
              </nav>
            </div>
            
            {onClose && (
              <button
                onClick={onClose}
                className="text-gray-500 hover:text-gray-700"
              >
                Close
              </button>
            )}
          </div>
        </div>
        
        <FileManagerToolbar
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onCreateFolder={handleCreateFolder}
          onCreateDocument={handleCreateDocument}
        />
      </div>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        <FileManagerSidebar
          currentPath={currentPath}
          username={username}
          onPathChange={setCurrentPath}
          groupId={groupId}
        />
        
        <FileManagerContent
          files={files}
          viewMode={viewMode}
          selectedItems={selectedItems}
          searchQuery={searchQuery}
          loading={loading}
          onItemClick={handleItemClick}
          onItemSelect={handleItemSelect}
          onDelete={handleDelete}
          onRefresh={loadFiles}
        />
      </div>
    </div>
  );
};