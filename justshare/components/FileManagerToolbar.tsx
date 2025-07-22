import React from 'react';
import { 
  Grid3x3, 
  List, 
  Search,
  Plus,
  FolderPlus,
  FileText,
  ChevronDown
} from 'lucide-react';

interface FileManagerToolbarProps {
  viewMode: 'grid' | 'list';
  onViewModeChange: (mode: 'grid' | 'list') => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onCreateFolder: () => void;
  onCreateDocument: () => void;
}

export const FileManagerToolbar: React.FC<FileManagerToolbarProps> = ({
  viewMode,
  onViewModeChange,
  searchQuery,
  onSearchChange,
  onCreateFolder,
  onCreateDocument
}) => {
  const [showCreateMenu, setShowCreateMenu] = React.useState(false);

  return (
    <div className="flex items-center justify-between px-4 py-2 border-t border-gray-200">
      <div className="flex items-center space-x-2">
        {/* Create button with dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowCreateMenu(!showCreateMenu)}
            className="flex items-center space-x-1 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            <Plus className="h-4 w-4" />
            <span>New</span>
            <ChevronDown className="h-3 w-3" />
          </button>
          
          {showCreateMenu && (
            <>
              <div 
                className="fixed inset-0 z-10" 
                onClick={() => setShowCreateMenu(false)}
              />
              <div className="absolute top-full left-0 mt-1 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20 min-w-[160px]">
                <button
                  onClick={() => {
                    onCreateFolder();
                    setShowCreateMenu(false);
                  }}
                  className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                >
                  <FolderPlus className="h-4 w-4" />
                  <span>New Folder</span>
                </button>
                <button
                  onClick={() => {
                    onCreateDocument();
                    setShowCreateMenu(false);
                  }}
                  className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                >
                  <FileText className="h-4 w-4" />
                  <span>New Document</span>
                </button>
              </div>
            </>
          )}
        </div>

        {/* View mode toggle */}
        <div className="flex items-center bg-gray-100 rounded-lg p-0.5">
          <button
            onClick={() => onViewModeChange('grid')}
            className={`p-1.5 rounded ${
              viewMode === 'grid' 
                ? 'bg-white shadow-sm' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
            title="Grid view"
          >
            <Grid3x3 className="h-4 w-4" />
          </button>
          <button
            onClick={() => onViewModeChange('list')}
            className={`p-1.5 rounded ${
              viewMode === 'list' 
                ? 'bg-white shadow-sm' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
            title="List view"
          >
            <List className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Search bar */}
      <div className="flex-1 max-w-md mx-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search files..."
            className="w-full pl-9 pr-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Sort options (placeholder for future enhancement) */}
      <div className="flex items-center space-x-2">
        <select className="text-sm border border-gray-300 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option>Name</option>
          <option>Date Modified</option>
          <option>Size</option>
          <option>Kind</option>
        </select>
      </div>
    </div>
  );
};