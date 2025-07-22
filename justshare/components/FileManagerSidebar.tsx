import React, { useState, useEffect } from 'react';
import { 
  Folder, 
  FileText, 
  Clock, 
  Star,
  HardDrive,
  ChevronRight,
  ChevronDown,
  Home
} from 'lucide-react';
import { getFiles, getFileTree } from '../utils/api';

interface SidebarItem {
  id: string;
  name: string;
  icon: React.ReactNode;
  path: string;
  type: 'favorite' | 'folder' | 'recent';
  children?: SidebarItem[];
  isExpanded?: boolean;
}

interface FileManagerSidebarProps {
  currentPath: string;
  username: string;
  onPathChange: (path: string) => void;
  groupId: string;
}

export const FileManagerSidebar: React.FC<FileManagerSidebarProps> = ({
  currentPath,
  username,
  onPathChange,
  groupId
}) => {
  const [favorites, setFavorites] = useState<SidebarItem[]>([]);
  const [folderTree, setFolderTree] = useState<SidebarItem[]>([]);
  const [recentDocuments, setRecentDocuments] = useState<SidebarItem[]>([]);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (username) {
      // Initialize favorites
      setFavorites([
        {
          id: 'home',
          name: username,
          icon: <Home className="h-4 w-4" />,
          path: `/${username}`,
          type: 'favorite'
        },
        {
          id: 'documents',
          name: 'Documents',
          icon: <FileText className="h-4 w-4" />,
          path: `/${username}/Documents`,
          type: 'favorite'
        }
      ]);

      loadFolderTree();
      loadRecentDocuments();
    }
  }, [username, groupId]);

  const loadFolderTree = async () => {
    try {
      const tree = await getFileTree(groupId);
      
      // Convert the tree structure to SidebarItem format
      const convertToSidebarItems = (items: any[]): SidebarItem[] => {
        return items.map(item => ({
          id: item.id,
          name: item.name,
          icon: <Folder className="h-4 w-4" />,
          path: item.path,
          type: 'folder' as const,
          children: item.children ? convertToSidebarItems(item.children) : []
        }));
      };

      setFolderTree(convertToSidebarItems(tree));
    } catch (error) {
      console.error('Failed to load folder tree:', error);
    }
  };

  const loadRecentDocuments = async () => {
    try {
      const response = await getFiles(groupId);
      
      const recent = response
        .filter(item => item.type === 'document')
        .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
        .slice(0, 5)
        .map(item => {
          const metadata = item.metadata || {};
          return {
            id: item.id,
            name: metadata.title || 'Untitled',
            icon: <FileText className="h-4 w-4" />,
            path: metadata.path || '/',
            type: 'recent' as const
          };
        });

      setRecentDocuments(recent);
    } catch (error) {
      console.error('Failed to load recent documents:', error);
    }
  };

  const buildTree = (items: SidebarItem[]): SidebarItem[] => {
    const tree: SidebarItem[] = [];
    const map = new Map<string, SidebarItem>();

    // First pass: create a map of all items
    items.forEach(item => {
      map.set(item.path, { ...item, children: [] });
    });

    // Second pass: build the tree
    items.forEach(item => {
      const parentPath = item.path.substring(0, item.path.lastIndexOf('/'));
      const parent = map.get(parentPath);
      
      if (parent) {
        parent.children?.push(map.get(item.path)!);
      } else if (item.path.split('/').length === 3) {
        // Top-level folder
        tree.push(map.get(item.path)!);
      }
    });

    return tree;
  };

  const toggleFolder = (folderId: string) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(folderId)) {
      newExpanded.delete(folderId);
    } else {
      newExpanded.add(folderId);
    }
    setExpandedFolders(newExpanded);
  };

  const renderTreeItem = (item: SidebarItem, level: number = 0): React.ReactNode => {
    const isExpanded = expandedFolders.has(item.id);
    const hasChildren = item.children && item.children.length > 0;
    const isSelected = currentPath === item.path;

    return (
      <div key={item.id}>
        <button
          className={`w-full flex items-center space-x-2 px-3 py-1.5 text-sm hover:bg-gray-100 rounded transition-colors ${
            isSelected ? 'bg-blue-50 text-blue-600' : 'text-gray-700'
          }`}
          style={{ paddingLeft: `${12 + level * 16}px` }}
          onClick={() => {
            if (hasChildren) {
              toggleFolder(item.id);
            }
            onPathChange(item.path);
          }}
        >
          {hasChildren && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleFolder(item.id);
              }}
              className="p-0.5"
            >
              {isExpanded ? (
                <ChevronDown className="h-3 w-3" />
              ) : (
                <ChevronRight className="h-3 w-3" />
              )}
            </button>
          )}
          {!hasChildren && <div className="w-4" />}
          {item.icon}
          <span className="truncate flex-1 text-left">{item.name}</span>
        </button>
        
        {hasChildren && isExpanded && (
          <div>
            {item.children!.map(child => renderTreeItem(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="w-64 bg-gray-50 border-r border-gray-200 flex flex-col">
      <div className="p-4 space-y-6 flex-1 overflow-y-auto">
        {/* Favorites */}
        <div>
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
            Favorites
          </h3>
          <div className="space-y-0.5">
            {favorites.map(item => (
              <button
                key={item.id}
                onClick={() => onPathChange(item.path)}
                className={`w-full flex items-center space-x-2 px-3 py-1.5 text-sm hover:bg-gray-100 rounded transition-colors ${
                  currentPath === item.path ? 'bg-blue-50 text-blue-600' : 'text-gray-700'
                }`}
              >
                {item.icon}
                <span className="truncate">{item.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Folders */}
        <div>
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
            Folders
          </h3>
          <div className="space-y-0.5">
            <button
              onClick={() => onPathChange(`/${username}`)}
              className={`w-full flex items-center space-x-2 px-3 py-1.5 text-sm hover:bg-gray-100 rounded transition-colors ${
                currentPath === `/${username}` ? 'bg-blue-50 text-blue-600' : 'text-gray-700'
              }`}
            >
              <HardDrive className="h-4 w-4" />
              <span className="truncate">{username}</span>
            </button>
            {folderTree.map(item => renderTreeItem(item))}
          </div>
        </div>

        {/* Recent Documents */}
        {recentDocuments.length > 0 && (
          <div>
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
              Recent
            </h3>
            <div className="space-y-0.5">
              {recentDocuments.map(item => (
                <button
                  key={item.id}
                  onClick={() => onPathChange(item.path)}
                  className="w-full flex items-center space-x-2 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100 rounded transition-colors"
                >
                  <Clock className="h-4 w-4 text-gray-400" />
                  <span className="truncate">{item.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Storage Info */}
      <div className="p-4 border-t border-gray-200">
        <div className="text-xs text-gray-500">
          <div className="flex justify-between mb-1">
            <span>Storage</span>
            <span>2.1 GB of 5 GB</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-1.5">
            <div className="bg-blue-600 h-1.5 rounded-full" style={{ width: '42%' }}></div>
          </div>
        </div>
      </div>
    </div>
  );
};