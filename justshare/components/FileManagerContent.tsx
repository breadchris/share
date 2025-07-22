import React, { useMemo } from 'react';
import { 
  Folder, 
  FileText, 
  MoreVertical,
  Trash2,
  Edit2,
  Copy,
  Move
} from 'lucide-react';
import { FileItem } from './FileManager';

interface FileManagerContentProps {
  files: FileItem[];
  viewMode: 'grid' | 'list';
  selectedItems: Set<string>;
  searchQuery: string;
  loading: boolean;
  onItemClick: (item: FileItem) => void;
  onItemSelect: (item: FileItem, isMultiSelect: boolean) => void;
  onDelete: (itemIds: string[]) => void;
  onRefresh: () => void;
}

export const FileManagerContent: React.FC<FileManagerContentProps> = ({
  files,
  viewMode,
  selectedItems,
  searchQuery,
  loading,
  onItemClick,
  onItemSelect,
  onDelete,
  onRefresh
}) => {
  // Filter files based on search query
  const filteredFiles = useMemo(() => {
    if (!searchQuery) return files;
    
    const query = searchQuery.toLowerCase();
    return files.filter(file => 
      file.name.toLowerCase().includes(query)
    );
  }, [files, searchQuery]);

  // Sort files (folders first, then by name)
  const sortedFiles = useMemo(() => {
    return [...filteredFiles].sort((a, b) => {
      if (a.type === 'folder' && b.type !== 'folder') return -1;
      if (a.type !== 'folder' && b.type === 'folder') return 1;
      return a.name.localeCompare(b.name);
    });
  }, [filteredFiles]);

  const formatFileSize = (bytes?: number): string => {
    if (!bytes) return '--';
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
  };

  const formatDate = (date: Date): string => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    
    return date.toLocaleDateString();
  };

  const handleContextMenu = (e: React.MouseEvent, item: FileItem) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Select item if not already selected
    if (!selectedItems.has(item.id)) {
      onItemSelect(item, false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Delete' || e.key === 'Backspace') {
      if (selectedItems.size > 0) {
        onDelete(Array.from(selectedItems));
      }
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-gray-500">Loading files...</div>
      </div>
    );
  }

  if (sortedFiles.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center">
        <Folder className="h-16 w-16 text-gray-300 mb-4" />
        <p className="text-gray-500 text-lg">This folder is empty</p>
        <p className="text-gray-400 text-sm mt-1">
          Create a new folder or document to get started
        </p>
      </div>
    );
  }

  return (
    <div 
      className="flex-1 p-4 overflow-auto focus:outline-none"
      tabIndex={0}
      onKeyDown={handleKeyDown}
    >
      {viewMode === 'grid' ? (
        // Grid View
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4">
          {sortedFiles.map(file => (
            <div
              key={file.id}
              className={`group relative cursor-pointer ${
                selectedItems.has(file.id) ? 'ring-2 ring-blue-500 rounded-lg' : ''
              }`}
              onClick={(e) => {
                if (e.metaKey || e.ctrlKey) {
                  onItemSelect(file, true);
                } else {
                  onItemClick(file);
                }
              }}
              onContextMenu={(e) => handleContextMenu(e, file)}
            >
              <div className="flex flex-col items-center p-3 hover:bg-gray-100 rounded-lg transition-colors">
                {file.type === 'folder' ? (
                  <Folder className="h-12 w-12 text-blue-500 mb-2" />
                ) : (
                  <FileText className="h-12 w-12 text-gray-400 mb-2" />
                )}
                <span className="text-sm text-center break-all line-clamp-2">
                  {file.name}
                </span>
              </div>
              
              {/* Context menu button */}
              <button
                className="absolute top-2 right-2 p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-gray-200 transition-opacity"
                onClick={(e) => {
                  e.stopPropagation();
                  handleContextMenu(e, file);
                }}
              >
                <MoreVertical className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      ) : (
        // List View
        <div className="space-y-0.5">
          {/* Header */}
          <div className="grid grid-cols-12 gap-4 px-4 py-2 text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
            <div className="col-span-6">Name</div>
            <div className="col-span-2">Modified</div>
            <div className="col-span-2">Size</div>
            <div className="col-span-2">Kind</div>
          </div>
          
          {/* Files */}
          {sortedFiles.map(file => (
            <div
              key={file.id}
              className={`grid grid-cols-12 gap-4 px-4 py-2 hover:bg-gray-50 cursor-pointer rounded ${
                selectedItems.has(file.id) ? 'bg-blue-50 ring-1 ring-blue-500' : ''
              }`}
              onClick={(e) => {
                if (e.metaKey || e.ctrlKey) {
                  onItemSelect(file, true);
                } else {
                  onItemClick(file);
                }
              }}
              onContextMenu={(e) => handleContextMenu(e, file)}
            >
              <div className="col-span-6 flex items-center space-x-3">
                {file.type === 'folder' ? (
                  <Folder className="h-4 w-4 text-blue-500 flex-shrink-0" />
                ) : (
                  <FileText className="h-4 w-4 text-gray-400 flex-shrink-0" />
                )}
                <span className="text-sm truncate">{file.name}</span>
              </div>
              <div className="col-span-2 text-sm text-gray-500">
                {formatDate(file.modifiedAt)}
              </div>
              <div className="col-span-2 text-sm text-gray-500">
                {formatFileSize(file.size)}
              </div>
              <div className="col-span-2 text-sm text-gray-500">
                {file.type === 'folder' ? 'Folder' : 'Document'}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Context Menu (simplified - in a real app, use a proper context menu library) */}
      {selectedItems.size > 0 && (
        <div className="fixed bottom-4 right-4 bg-white rounded-lg shadow-lg border border-gray-200 p-2">
          <div className="flex items-center space-x-2">
            <button
              className="flex items-center space-x-2 px-3 py-2 text-sm hover:bg-gray-100 rounded"
              onClick={() => onDelete(Array.from(selectedItems))}
            >
              <Trash2 className="h-4 w-4" />
              <span>Delete</span>
            </button>
            <div className="text-sm text-gray-500 px-2">
              {selectedItems.size} selected
            </div>
          </div>
        </div>
      )}
    </div>
  );
};