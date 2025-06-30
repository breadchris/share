import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';

// Types for component metadata and file structure
interface FileItem {
    name: string;
    path: string;
    isDir: boolean;
    size: number;
    lastModified: string;
}

// Configuration types for pinned files
interface PinnedFilesConfig {
    pinnedFiles: string[];
    togglePin: (filePath: string) => boolean;
}

interface ComponentMetadata {
    name: string;
    path: string;
    description?: string;
    tags: string[];
    size: number;
    lastModified: string;
    hasExport: boolean;
    exportedComponents: string[];
}

interface GitHubRepo {
    name: string;
    full_name: string;
    description?: string;
    private: boolean;
    language?: string;
    updated_at: string;
    html_url: string;
}

// Component Browser Main Component
export const ComponentBrowser: React.FC = () => {
    // Authentication & GitHub state
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [username, setUsername] = useState('');
    const [repositories, setRepositories] = useState<GitHubRepo[]>([]);
    const [selectedRepo, setSelectedRepo] = useState('');
    const [showRepoSelector, setShowRepoSelector] = useState(false);
    const [isLoadingRepos, setIsLoadingRepos] = useState(false);
    const [repoSearchQuery, setRepoSearchQuery] = useState('');

    // File system state
    const [files, setFiles] = useState<FileItem[]>([]);
    const [components, setComponents] = useState<ComponentMetadata[]>([]);
    const [expandedDirs, setExpandedDirs] = useState<Set<string>>(new Set());
    const [currentPath, setCurrentPath] = useState('');
    const [isLoadingFiles, setIsLoadingFiles] = useState(false);

    // UI state
    const [currentView, setCurrentView] = useState<'all' | 'pinned' | 'recent'>('all');
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedComponent, setSelectedComponent] = useState<ComponentMetadata | null>(null);
    const [showSidebar, setShowSidebar] = useState(false);
    const [isMobile, setIsMobile] = useState(false);

    // Preview state
    const [previewLoading, setPreviewLoading] = useState<Set<string>>(new Set());
    const [previewErrors, setPreviewErrors] = useState<Set<string>>(new Set());
    const [previewLoaded, setPreviewLoaded] = useState<Set<string>>(new Set());
    const [fullScreenPreview, setFullScreenPreview] = useState<ComponentMetadata | null>(null);
    const [selectedComponentExport, setSelectedComponentExport] = useState<string>('');
    const [selectedDetailExport, setSelectedDetailExport] = useState<string>('');
    
    // Debounce map to prevent rapid fire requests
    const loadingTimeouts = useRef<Map<string, NodeJS.Timeout>>(new Map());

    // Filter state
    const [filterType, setFilterType] = useState<'all' | 'tsx' | 'jsx'>('all');
    const [sortBy, setSortBy] = useState<'name' | 'date' | 'size'>('name');
    const [selectedDirectory, setSelectedDirectory] = useState<string | null>(null);

    // Repository cloning state
    const [isCloning, setIsCloning] = useState(false);
    const [cloneStatus, setCloneStatus] = useState<string>('');

    // Lazy directory loading state
    const [loadedDirectories, setLoadedDirectories] = useState<Set<string>>(new Set([''])); // Root is always loaded
    const [loadingDirectories, setLoadingDirectories] = useState<Set<string>>(new Set());
    const [directoryChildren, setDirectoryChildren] = useState<Map<string, FileItem[]>>(new Map());

    // Pinned files state
    const [pinnedFiles, setPinnedFiles] = useState<Set<string>>(new Set());
    const [isLoadingPinnedFiles, setIsLoadingPinnedFiles] = useState(false);

    // Mobile detection
    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // GitHub Authentication
    const checkGithubAuth = async () => {
        try {
            const response = await fetch('/coderunner/user', {
                credentials: 'include'
            });
            
            if (response.ok) {
                const userData = await response.json();
                if (userData.username) {
                    setUsername(userData.username);
                    setIsLoggedIn(true);
                    return true;
                }
            }
            return false;
        } catch (error) {
            console.error('Auth check error:', error);
            return false;
        }
    };

    const fetchGithubRepositories = async () => {
        if (!isLoggedIn) return;
        
        setIsLoadingRepos(true);
        try {
            const response = await fetch('/coderunner/repositories', {
                credentials: 'include'
            });
            
            if (response.ok) {
                const repos = await response.json();
                setRepositories(repos);
            }
        } catch (error) {
            console.error('Error fetching repositories:', error);
        } finally {
            setIsLoadingRepos(false);
        }
    };

    const handleRepoSelection = async (repoFullName: string) => {
        try {
            const response = await fetch('/coderunner/select-repo', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ repository: repoFullName })
            });
            
            if (response.ok) {
                setSelectedRepo(repoFullName);
                setShowRepoSelector(false);
                loadFiles();
            }
        } catch (error) {
            console.error('Error selecting repository:', error);
        }
    };

    const handleCloneRepository = async () => {
        if (!selectedRepo) return;
        
        setIsCloning(true);
        setCloneStatus('Cloning repository...');
        
        try {
            const response = await fetch('/coderunner/clone-repo', {
                method: 'POST',
                credentials: 'include'
            });
            
            if (response.ok) {
                const result = await response.json();
                setCloneStatus(result.message || 'Repository cloned successfully');
                
                // Refresh the file list to show newly cloned files
                await loadFiles();
                
                // Clear status after 3 seconds
                setTimeout(() => {
                    setCloneStatus('');
                }, 3000);
            } else {
                const errorData = await response.json();
                setCloneStatus(errorData.error || 'Failed to clone repository');
            }
        } catch (error) {
            console.error('Error cloning repository:', error);
            setCloneStatus('Error cloning repository');
        } finally {
            setIsCloning(false);
        }
    };

    // Pinned Files Management Functions
    const loadPinnedFiles = async () => {
        setIsLoadingPinnedFiles(true);
        try {
            const response = await fetch('/coderunner/api/config/pinned-files', {
                credentials: 'include'
            });
            
            if (response.ok) {
                const config = await response.json();
                setPinnedFiles(new Set(config.pinnedFiles || []));
            }
        } catch (error) {
            console.error('Error loading pinned files:', error);
        } finally {
            setIsLoadingPinnedFiles(false);
        }
    };

    const togglePinFile = async (filePath: string) => {
        try {
            const response = await fetch(`/coderunner/api/config/pinned-files/${encodeURIComponent(filePath)}`, {
                method: 'PUT',
                credentials: 'include'
            });
            
            if (response.ok) {
                const result = await response.json();
                if (result.isPinned) {
                    setPinnedFiles(prev => new Set(prev).add(filePath));
                } else {
                    setPinnedFiles(prev => {
                        const newSet = new Set(prev);
                        newSet.delete(filePath);
                        return newSet;
                    });
                }
                return result.isPinned;
            }
        } catch (error) {
            console.error('Error toggling pin status:', error);
        }
        return false;
    };

    // File System Functions
    const loadFiles = async () => {
        setIsLoadingFiles(true);
        try {
            const response = await fetch('/coderunner/api/files');
            if (response.ok) {
                const fileData = await response.json();
                setFiles(fileData || []);
                processComponentFiles(fileData || []);
            }
        } catch (error) {
            console.error('Failed to load files:', error);
        } finally {
            setIsLoadingFiles(false);
        }
    };

    const loadDirectoryContents = async (directoryPath: string): Promise<FileItem[]> => {
        // Return cached contents if already loaded
        if (loadedDirectories.has(directoryPath)) {
            return directoryChildren.get(directoryPath) || [];
        }
        
        // Don't load if already loading
        if (loadingDirectories.has(directoryPath)) {
            return [];
        }
        
        setLoadingDirectories(prev => new Set(prev).add(directoryPath));
        
        try {
            const encodedPath = encodeURIComponent(directoryPath);
            const response = await fetch(`/coderunner/api/files?path=${encodedPath}&depth=1`);
            
            if (response.ok) {
                const fileData: FileItem[] = await response.json();
                
                // Cache the results
                setDirectoryChildren(prev => new Map(prev).set(directoryPath, fileData));
                setLoadedDirectories(prev => new Set(prev).add(directoryPath));
                
                // Update global files list with new data
                setFiles(prevFiles => {
                    const existingPaths = new Set(prevFiles.map(f => f.path));
                    const newFiles = fileData.filter(f => !existingPaths.has(f.path));
                    return [...prevFiles, ...newFiles];
                });
                
                // Process any new component files
                const newComponentFiles = fileData.filter(file => 
                    !file.isDir && 
                    (file.path.endsWith('.tsx') || file.path.endsWith('.jsx'))
                );
                if (newComponentFiles.length > 0) {
                    processComponentFiles(newComponentFiles);
                }
                
                return fileData;
            } else {
                console.error('Failed to load directory:', directoryPath);
                return [];
            }
        } catch (error) {
            console.error('Error loading directory:', directoryPath, error);
            return [];
        } finally {
            setLoadingDirectories(prev => {
                const newSet = new Set(prev);
                newSet.delete(directoryPath);
                return newSet;
            });
        }
    };

    const processComponentFiles = async (fileList: FileItem[]) => {
        const componentFiles = fileList.filter(file => 
            !file.isDir && 
            (file.path.endsWith('.tsx') || file.path.endsWith('.jsx'))
        );

        const componentsData: ComponentMetadata[] = [];

        for (const file of componentFiles) {
            try {
                const response = await fetch(`/coderunner/api/files/${encodeURIComponent(file.path)}`);
                if (response.ok) {
                    const content = await response.text();
                    const metadata = analyzeComponent(file, content);
                    if (metadata) {
                        componentsData.push(metadata);
                    }
                }
            } catch (error) {
                console.error(`Error loading component ${file.path}:`, error);
            }
        }

        setComponents(componentsData);
    };

    const analyzeComponent = (file: FileItem, content: string): ComponentMetadata | null => {
        // Extract component name from filename
        const baseName = file.name.replace(/\.(tsx|jsx)$/, '');
        
        // Look for exported components
        const exportMatches = content.match(/export\s+(?:const|function|class)\s+(\w+)/g) || [];
        const defaultExportMatch = content.match(/export\s+default\s+(\w+)/);
        
        const exportedComponents = exportMatches.map(match => {
            const componentMatch = match.match(/export\s+(?:const|function|class)\s+(\w+)/);
            return componentMatch ? componentMatch[1] : '';
        }).filter(Boolean);

        if (defaultExportMatch) {
            exportedComponents.push(defaultExportMatch[1]);
        }

        // Extract description from comments
        const descriptionMatch = content.match(/\/\*\*\s*\n\s*\*\s*(.+?)\s*\n/);
        const description = descriptionMatch ? descriptionMatch[1] : undefined;

        // Extract tags from comments or infer from content
        const tags: string[] = [];
        if (content.includes('useState')) tags.push('stateful');
        if (content.includes('useEffect')) tags.push('effects');
        if (content.includes('React.FC')) tags.push('functional');
        if (content.includes('interface')) tags.push('typescript');
        if (content.includes('className')) tags.push('styled');

        return {
            name: baseName,
            path: file.path,
            description,
            tags,
            size: file.size,
            lastModified: file.lastModified,
            hasExport: exportedComponents.length > 0,
            exportedComponents
        };
    };

    // Directory Tree Structure
    interface DirectoryNode {
        name: string;
        path: string;
        isDir: boolean;
        children: DirectoryNode[];
        files: FileItem[];
        isLoaded: boolean;
        isExpanded: boolean;
    }

    const buildDirectoryTree = (fileList: FileItem[]): DirectoryNode[] => {
        const nodeMap = new Map<string, DirectoryNode>();
        const rootNodes: DirectoryNode[] = [];

        // Create nodes for all files and directories
        fileList.forEach(file => {
            const pathParts = file.path.split('/');
            
            // Build the hierarchy
            for (let i = 0; i < pathParts.length; i++) {
                const currentPath = pathParts.slice(0, i + 1).join('/');
                const isFile = i === pathParts.length - 1 && !file.isDir;
                
                if (!nodeMap.has(currentPath) && !isFile) {
                    const node: DirectoryNode = {
                        name: pathParts[i],
                        path: currentPath,
                        isDir: true,
                        children: [],
                        files: [],
                        isLoaded: loadedDirectories.has(currentPath),
                        isExpanded: expandedDirs.has(currentPath)
                    };
                    nodeMap.set(currentPath, node);
                    
                    if (i === 0) {
                        // Root level directory
                        rootNodes.push(node);
                    } else {
                        // Add to parent
                        const parentPath = pathParts.slice(0, i).join('/');
                        const parentNode = nodeMap.get(parentPath);
                        if (parentNode) {
                            parentNode.children.push(node);
                        }
                    }
                }
            }
            
            // Add files to their parent directories
            if (!file.isDir) {
                if (file.path.includes('/')) {
                    const parentPath = file.path.substring(0, file.path.lastIndexOf('/'));
                    const parentNode = nodeMap.get(parentPath);
                    if (parentNode) {
                        parentNode.files.push(file);
                    }
                } else {
                    // Root level file - create a virtual root node if needed
                    if (!nodeMap.has('')) {
                        const rootNode: DirectoryNode = {
                            name: 'Root',
                            path: '',
                            isDir: true,
                            children: [],
                            files: [],
                            isLoaded: loadedDirectories.has(''),
                            isExpanded: true
                        };
                        nodeMap.set('', rootNode);
                        rootNodes.unshift(rootNode); // Add to beginning
                    }
                    nodeMap.get('')?.files.push(file);
                }
            }
        });

        return rootNodes;
    };

    const toggleDirExpansion = async (dirPath: string) => {
        const isCurrentlyExpanded = expandedDirs.has(dirPath);
        
        if (isCurrentlyExpanded) {
            // Collapse directory
            setExpandedDirs(prev => {
                const newSet = new Set(prev);
                newSet.delete(dirPath);
                return newSet;
            });
        } else {
            // Expand directory
            setExpandedDirs(prev => new Set(prev).add(dirPath));
            
            // Load directory contents if not already loaded
            if (!loadedDirectories.has(dirPath)) {
                await loadDirectoryContents(dirPath);
            }
        }
    };

    // Component Preview Functions
    const getPreviewUrl = useCallback((component: ComponentMetadata, exportName?: string) => {
        const componentParam = exportName || component.exportedComponents[0] || 'App';
        return `/coderunner/render/${component.path}?component=${componentParam}`;
    }, []);

    const openInNewTab = useCallback((component: ComponentMetadata, exportName?: string) => {
        const url = getPreviewUrl(component, exportName);
        window.open(url, '_blank', 'noopener,noreferrer');
    }, [getPreviewUrl]);

    const handlePreviewLoad = useCallback((componentPath: string) => {
        // Clear any pending timeout for this component
        const timeout = loadingTimeouts.current.get(componentPath);
        if (timeout) {
            clearTimeout(timeout);
            loadingTimeouts.current.delete(componentPath);
        }

        setPreviewLoading(prev => {
            const newSet = new Set(prev);
            newSet.delete(componentPath);
            return newSet;
        });
        setPreviewErrors(prev => {
            const newSet = new Set(prev);
            newSet.delete(componentPath);
            return newSet;
        });
        setPreviewLoaded(prev => new Set(prev).add(componentPath));
    }, []);

    const handlePreviewError = useCallback((componentPath: string) => {
        // Clear any pending timeout for this component
        const timeout = loadingTimeouts.current.get(componentPath);
        if (timeout) {
            clearTimeout(timeout);
            loadingTimeouts.current.delete(componentPath);
        }

        setPreviewLoading(prev => {
            const newSet = new Set(prev);
            newSet.delete(componentPath);
            return newSet;
        });
        setPreviewErrors(prev => new Set(prev).add(componentPath));
    }, []);

    // Start loading with debounce to prevent rapid fire requests
    const startPreviewLoading = useCallback((componentPath: string) => {
        // Clear any existing timeout
        const existingTimeout = loadingTimeouts.current.get(componentPath);
        if (existingTimeout) {
            clearTimeout(existingTimeout);
        }

        // Set a debounced timeout to start loading
        const timeout = setTimeout(() => {
            setPreviewLoading(prev => {
                // Don't start loading if already loading
                if (prev.has(componentPath)) {
                    return prev;
                }
                return new Set(prev).add(componentPath);
            });
            setPreviewErrors(prev => {
                const newSet = new Set(prev);
                newSet.delete(componentPath);
                return newSet;
            });
            loadingTimeouts.current.delete(componentPath);
        }, 100); // 100ms debounce

        loadingTimeouts.current.set(componentPath, timeout);
    }, []);

    // Retry preview by clearing all state and forcing reload
    const retryPreview = useCallback((componentPath: string) => {
        // Clear all preview state for this component
        setPreviewLoading(prev => {
            const newSet = new Set(prev);
            newSet.delete(componentPath);
            return newSet;
        });
        setPreviewErrors(prev => {
            const newSet = new Set(prev);
            newSet.delete(componentPath);
            return newSet;
        });
        setPreviewLoaded(prev => {
            const newSet = new Set(prev);
            newSet.delete(componentPath);
            return newSet;
        });
        
        // Clear any pending timeout
        const timeout = loadingTimeouts.current.get(componentPath);
        if (timeout) {
            clearTimeout(timeout);
            loadingTimeouts.current.delete(componentPath);
        }
        
        // Force a reload by starting the preview loading again
        startPreviewLoading(componentPath);
    }, [startPreviewLoading]);

    // Cleanup timeouts on unmount
    useEffect(() => {
        return () => {
            loadingTimeouts.current.forEach(timeout => clearTimeout(timeout));
            loadingTimeouts.current.clear();
        };
    }, []);

    // Filter and Search Functions
    const filteredComponents = components.filter(component => {
        // Filter by current view first
        if (currentView === 'pinned' && !pinnedFiles.has(component.path)) {
            return false;
        }
        
        if (currentView === 'recent') {
            // Show components modified in the last 7 days
            const weekAgo = new Date();
            weekAgo.setDate(weekAgo.getDate() - 7);
            const componentDate = new Date(component.lastModified);
            if (componentDate < weekAgo) {
                return false;
            }
        }

        const matchesSearch = searchQuery === '' || 
            component.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            component.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            component.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));

        const matchesType = filterType === 'all' ||
            (filterType === 'tsx' && component.path.endsWith('.tsx')) ||
            (filterType === 'jsx' && component.path.endsWith('.jsx'));

        const matchesDirectory = selectedDirectory === null || 
            component.path.startsWith(selectedDirectory + '/') ||
            (component.path.includes('/') && component.path.substring(0, component.path.lastIndexOf('/')) === selectedDirectory);

        return matchesSearch && matchesType && matchesDirectory;
    }).sort((a, b) => {
        // For pinned view, show pinned items first
        if (currentView === 'pinned') {
            const aIsPinned = pinnedFiles.has(a.path);
            const bIsPinned = pinnedFiles.has(b.path);
            if (aIsPinned && !bIsPinned) return -1;
            if (!aIsPinned && bIsPinned) return 1;
        }
        
        switch (sortBy) {
            case 'name':
                return a.name.localeCompare(b.name);
            case 'date':
                return new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime();
            case 'size':
                return b.size - a.size;
            default:
                return 0;
        }
    });

    // Filtered repositories for search
    const filteredRepositories = repositories.filter(repo =>
        repo.name.toLowerCase().includes(repoSearchQuery.toLowerCase()) ||
        repo.full_name.toLowerCase().includes(repoSearchQuery.toLowerCase()) ||
        (repo.description && repo.description.toLowerCase().includes(repoSearchQuery.toLowerCase()))
    );

    // Reset selectedDetailExport when selectedComponent changes
    useEffect(() => {
        if (selectedComponent && selectedComponent.exportedComponents.length > 0) {
            setSelectedDetailExport(selectedComponent.exportedComponents[0]);
        } else {
            setSelectedDetailExport('');
        }
    }, [selectedComponent]);

    // Initialize auth and files on mount
    useEffect(() => {
        const initializeAuth = async () => {
            const isAuthenticated = await checkGithubAuth();
            if (isAuthenticated) {
                await fetchGithubRepositories();
            }
            await loadFiles();
            await loadPinnedFiles();
        };
        initializeAuth();
    }, []);

    // Component Card Component
    const ComponentCard: React.FC<{ component: ComponentMetadata; isCompact?: boolean }> = React.memo(({ 
        component, 
        isCompact = false 
    }) => {
        const [shouldLoadPreview, setShouldLoadPreview] = useState(false);
        const isLoading = previewLoading.has(component.path);
        const hasError = previewErrors.has(component.path);
        const isLoaded = previewLoaded.has(component.path);
        
        // Memoize preview URL to prevent regeneration
        const previewUrl = useMemo(() => getPreviewUrl(component), [component.path, component.exportedComponents.join(',')]);
        
        // Memoize event handlers to prevent iframe re-creation
        const handleLoad = useCallback(() => handlePreviewLoad(component.path), [component.path, handlePreviewLoad]);
        const handleError = useCallback(() => handlePreviewError(component.path), [component.path, handlePreviewError]);
        const handleFullScreen = useCallback(() => setFullScreenPreview(component), [component]);
        const handleLoadPreview = useCallback(() => setShouldLoadPreview(true), []);

        // Only show iframe if not in error state and preview should be loaded
        const shouldShowIframe = !hasError && shouldLoadPreview;

        return (
            <div className={`bg-white rounded-lg shadow-md border hover:shadow-lg transition-shadow ${
                isCompact ? 'p-3' : 'p-4'
            }`}>
                {/* Component Preview */}
                <div className={`bg-gray-50 rounded-md overflow-hidden mb-3 ${
                    isCompact ? 'h-32' : 'h-48'
                } relative group`}>
                    {/* Full-Screen Button */}
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                        <button
                            onClick={handleFullScreen}
                            className="bg-black bg-opacity-50 hover:bg-opacity-70 text-white p-1 rounded text-xs"
                            title="Full Screen"
                        >
                            ⛶
                        </button>
                    </div>

                    {/* Preview not loaded state */}
                    {!shouldLoadPreview && !hasError && (
                        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                            <button
                                onClick={handleLoadPreview}
                                className="bg-blue-500 text-white px-3 py-1 rounded text-xs hover:bg-blue-600 transition-colors"
                            >
                                📱 Load Preview
                            </button>
                        </div>
                    )}

                    {/* Loading state - only show if actively loading */}
                    {isLoading && !isLoaded && shouldLoadPreview && (
                        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                        </div>
                    )}
                    
                    {/* Error state */}
                    {hasError && (
                        <div className="absolute inset-0 flex items-center justify-center text-gray-500 bg-gray-100">
                            <div className="text-center">
                                <div className="text-2xl mb-2">⚠️</div>
                                <div className="text-xs">Preview Error</div>
                                <button
                                    onClick={handleLoadPreview}
                                    className="mt-2 bg-gray-500 text-white px-2 py-1 rounded text-xs hover:bg-gray-600"
                                >
                                    Retry
                                </button>
                            </div>
                        </div>
                    )}
                    
                    {/* Component iframe - only render when should load preview */}
                    {shouldShowIframe && (
                        <iframe
                            key={`preview-${component.path}`}
                            src={previewUrl}
                            className="w-full h-full border-0"
                            onLoad={handleLoad}
                            onError={handleError}
                            title={`Preview of ${component.name}`}
                            style={{ 
                                opacity: isLoaded ? 1 : 0,
                                transition: 'opacity 0.2s ease-in-out' 
                            }}
                        />
                    )}
                </div>

                {/* Component Info */}
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <h3 className={`font-semibold text-gray-900 ${
                                isCompact ? 'text-sm' : 'text-base'
                            }`}>
                                {component.name}
                            </h3>
                            {pinnedFiles.has(component.path) && (
                                <span className="text-yellow-600" title="Pinned component">
                                    📌
                                </span>
                            )}
                        </div>
                        <span className={`text-gray-500 ${
                            isCompact ? 'text-xs' : 'text-sm'
                        }`}>
                            {component.path.endsWith('.tsx') ? 'TSX' : 'JSX'}
                        </span>
                    </div>
                    
                    {component.description && (
                        <p className={`text-gray-600 ${
                            isCompact ? 'text-xs' : 'text-sm'
                        } line-clamp-2`}>
                            {component.description}
                        </p>
                    )}

                    {/* Tags */}
                    {component.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                            {component.tags.slice(0, isCompact ? 2 : 4).map(tag => (
                                <span 
                                    key={tag}
                                    className={`bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-xs ${
                                        isCompact ? 'text-xs' : ''
                                    }`}
                                >
                                    {tag}
                                </span>
                            ))}
                            {component.tags.length > (isCompact ? 2 : 4) && (
                                <span className="text-gray-500 text-xs">
                                    +{component.tags.length - (isCompact ? 2 : 4)}
                                </span>
                            )}
                        </div>
                    )}

                    {/* Component Actions */}
                    <div className="flex items-center justify-between pt-2 border-t">
                        <div className="flex items-center gap-2">
                            <div className={`text-gray-500 ${
                                isCompact ? 'text-xs' : 'text-sm'
                            }`}>
                                {Math.round(component.size / 1024)}KB
                            </div>
                            <button
                                onClick={() => togglePinFile(component.path)}
                                className={`px-2 py-1 rounded transition-all duration-200 ${
                                    isCompact ? 'text-xs' : 'text-sm'
                                } ${
                                    pinnedFiles.has(component.path)
                                        ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200 shadow-sm scale-105'
                                        : 'bg-gray-100 text-gray-400 hover:bg-gray-200 hover:text-gray-600'
                                }`}
                                title={pinnedFiles.has(component.path) ? 'Unpin file' : 'Pin file'}
                            >
                                {pinnedFiles.has(component.path) ? '📌' : '📍'}
                            </button>
                        </div>
                        <button
                            onClick={() => setSelectedComponent(component)}
                            className={`bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 transition-colors ${
                                isCompact ? 'text-xs' : 'text-sm'
                            }`}
                        >
                            View Details
                        </button>
                    </div>
                </div>
            </div>
        );
    }, (prevProps, nextProps) => {
        // Only re-render if component path or compact mode changes
        return prevProps.component.path === nextProps.component.path && 
               prevProps.isCompact === nextProps.isCompact;
    });

    // Sidebar Component
    const Sidebar: React.FC = () => (
        <div className={`bg-gray-50 border-r h-full overflow-auto ${
            isMobile ? 'w-full' : 'w-80'
        }`}>
            {/* Header */}
            <div className="p-4 border-b">
                <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-gray-900">Component Browser</h2>
                    {isMobile && (
                        <button
                            onClick={() => setShowSidebar(false)}
                            className="text-gray-500 hover:text-gray-700"
                        >
                            ✕
                        </button>
                    )}
                </div>
            </div>

            {/* GitHub Repository Selector */}
            {isLoggedIn ? (
                <div className="p-4 border-b bg-gray-100">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700">GitHub Repository</span>
                        <button
                            onClick={() => {
                                setShowRepoSelector(!showRepoSelector);
                                if (!showRepoSelector && repositories.length === 0) {
                                    fetchGithubRepositories();
                                }
                            }}
                            className="text-xs bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600"
                        >
                            {showRepoSelector ? 'Hide' : 'Browse'}
                        </button>
                    </div>
                    
                    {selectedRepo && (
                        <div className="bg-white p-2 rounded border">
                            <div className="flex items-center justify-between mb-2">
                                <div className="text-xs text-gray-600">
                                    📦 {selectedRepo}
                                </div>
                                <button
                                    onClick={handleCloneRepository}
                                    disabled={isCloning}
                                    className={`text-xs px-2 py-1 rounded transition-colors ${
                                        isCloning
                                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                            : 'bg-green-500 text-white hover:bg-green-600'
                                    }`}
                                >
                                    {isCloning ? '⏳ Cloning...' : '📥 Clone'}
                                </button>
                            </div>
                            {cloneStatus && (
                                <div className={`text-xs p-1 rounded ${
                                    cloneStatus.includes('Error') || cloneStatus.includes('Failed')
                                        ? 'bg-red-50 text-red-700 border border-red-200'
                                        : 'bg-green-50 text-green-700 border border-green-200'
                                }`}>
                                    {cloneStatus}
                                </div>
                            )}
                        </div>
                    )}
                    
                    {showRepoSelector && (
                        <div className="mt-2 border rounded bg-white max-h-48 overflow-hidden">
                            <div className="p-2">
                                <input
                                    type="text"
                                    placeholder="Search repositories..."
                                    value={repoSearchQuery}
                                    onChange={(e) => setRepoSearchQuery(e.target.value)}
                                    className="w-full px-2 py-1 border rounded text-xs"
                                />
                            </div>
                            <div className="max-h-32 overflow-auto border-t">
                                {isLoadingRepos ? (
                                    <div className="p-4 text-center text-gray-500 text-xs">
                                        Loading repositories...
                                    </div>
                                ) : filteredRepositories.length === 0 ? (
                                    <div className="p-4 text-center text-gray-500 text-xs">
                                        No repositories found
                                    </div>
                                ) : (
                                    filteredRepositories.map((repo) => (
                                        <button
                                            key={repo.full_name}
                                            onClick={() => handleRepoSelection(repo.full_name)}
                                            className="w-full p-2 text-left hover:bg-gray-50 border-b text-xs"
                                        >
                                            <div className="font-medium">{repo.name}</div>
                                            {repo.description && (
                                                <div className="text-gray-500 truncate">
                                                    {repo.description}
                                                </div>
                                            )}
                                        </button>
                                    ))
                                )}
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                <div className="p-4 border-b bg-gray-100">
                    <div className="text-center">
                        <p className="text-sm text-gray-700 mb-3">
                            Sign in with GitHub to access your repositories
                        </p>
                        <a
                            href="/github/login"
                            className="inline-block bg-gray-800 text-white px-4 py-2 rounded hover:bg-gray-900 transition-colors text-sm"
                        >
                            <span className="mr-2">🔐</span>
                            Sign in with GitHub
                        </a>
                    </div>
                </div>
            )}

            {/* Pinned Files */}
            <div className="p-4 border-b">
                <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-medium text-gray-700">Pinned Files</h3>
                    <button
                        onClick={() => setCurrentView('pinned')}
                        className="text-xs text-blue-600 hover:text-blue-800"
                    >
                        View All
                    </button>
                </div>
                {pinnedFiles.size > 0 ? (
                    <div className="space-y-1">
                        {Array.from(pinnedFiles).slice(0, 5).map(filePath => {
                            const fileName = filePath.split('/').pop() || filePath;
                            const component = components.find(c => c.path === filePath);
                            return (
                                <div 
                                    key={filePath}
                                    className="flex items-center justify-between p-2 bg-yellow-50 border border-yellow-200 rounded text-sm"
                                >
                                    <button
                                        onClick={() => {
                                            if (component) {
                                                setSelectedComponent(component);
                                            }
                                        }}
                                        className="flex-1 text-left hover:text-blue-600 truncate"
                                        title={filePath}
                                    >
                                        📌 {fileName}
                                    </button>
                                    <button
                                        onClick={() => togglePinFile(filePath)}
                                        className="text-gray-500 hover:text-red-600 ml-2"
                                        title="Unpin file"
                                    >
                                        ✕
                                    </button>
                                </div>
                            );
                        })}
                        {pinnedFiles.size > 5 && (
                            <div className="text-xs text-gray-500 text-center pt-1">
                                +{pinnedFiles.size - 5} more pinned files
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="text-sm text-gray-500 text-center py-3">
                        <div className="text-2xl mb-1">📌</div>
                        <div>No pinned files yet</div>
                        <div className="text-xs mt-1">
                            Pin components to quick access
                        </div>
                    </div>
                )}
            </div>

            {/* Directory Navigation */}
            <div className="p-4">
                <h3 className="text-sm font-medium text-gray-700 mb-2">Directory Navigation</h3>
                {isLoadingFiles ? (
                    <div className="text-sm text-gray-500">Loading files...</div>
                ) : (
                    <DirectoryTree files={files} />
                )}
            </div>
        </div>
    );

    // Directory Tree Component
    const DirectoryTree: React.FC<{ files: FileItem[] }> = ({ files }) => {
        const directoryTree = buildDirectoryTree(files);
        const componentFiles = files.filter(f => 
            !f.isDir && (f.path.endsWith('.tsx') || f.path.endsWith('.jsx'))
        );

        const DirectoryNode: React.FC<{ node: DirectoryNode; depth: number }> = ({ node, depth }) => {
            const isLoading = loadingDirectories.has(node.path);
            const componentFilesInNode = node.files.filter(f => 
                f.path.endsWith('.tsx') || f.path.endsWith('.jsx')
            );
            const allComponentsInSubtree = files.filter(f =>
                !f.isDir && 
                (f.path.endsWith('.tsx') || f.path.endsWith('.jsx')) &&
                (f.path === node.path || f.path.startsWith(node.path + '/'))
            ).length;

            return (
                <div key={node.path}>
                    <div className="flex items-center" style={{ paddingLeft: `${depth * 12}px` }}>
                        {/* Expand/Collapse button */}
                        <button
                            onClick={() => toggleDirExpansion(node.path)}
                            className="flex items-center text-left text-sm py-1 px-1 hover:bg-gray-100 rounded mr-1"
                            disabled={isLoading}
                        >
                            <span className="mr-1 text-xs">
                                {isLoading ? '⟳' : node.isExpanded ? '▼' : '▶'}
                            </span>
                        </button>
                        
                        {/* Directory name button */}
                        <button
                            onClick={() => setSelectedDirectory(selectedDirectory === node.path ? null : node.path)}
                            className={`flex-1 flex items-center text-left text-sm py-1 px-2 rounded ${
                                selectedDirectory === node.path 
                                    ? 'bg-blue-100 text-blue-700' 
                                    : 'hover:bg-gray-100'
                            }`}
                        >
                            📁 {node.name === 'Root' ? 'All Files' : node.name}
                            <span className="ml-auto text-xs text-gray-500">
                                ({allComponentsInSubtree})
                            </span>
                        </button>
                    </div>
                    
                    {/* Expanded contents */}
                    {node.isExpanded && (
                        <div className="space-y-1">
                            {/* Show files in this directory */}
                            {componentFilesInNode.map(file => (
                                <div 
                                    key={file.path}
                                    className="text-sm py-1 px-2 text-gray-600 hover:bg-gray-100 rounded cursor-pointer"
                                    style={{ paddingLeft: `${(depth + 1) * 12 + 20}px` }}
                                    onClick={() => {
                                        console.log('Component file clicked:', file.path);
                                        console.log('Available components:', components.map(c => c.path));
                                        
                                        const component = components.find(c => c.path === file.path);
                                        console.log('Found component:', component);
                                        
                                        if (component) {
                                            setSelectedComponent(component);
                                        } else {
                                            // Fallback: create a basic component metadata from file info
                                            const fallbackComponent: ComponentMetadata = {
                                                name: file.name.replace(/\.(tsx|jsx)$/, ''),
                                                path: file.path,
                                                description: 'Component details loading...',
                                                tags: [],
                                                size: file.size,
                                                lastModified: file.lastModified,
                                                hasExport: false,
                                                exportedComponents: []
                                            };
                                            setSelectedComponent(fallbackComponent);
                                            
                                            // Try to load component metadata if it's missing
                                            processComponentFiles([file]);
                                        }
                                    }}
                                >
                                    📄 {file.name}
                                </div>
                            ))}
                            
                            {/* Show subdirectories */}
                            {node.children.map(child => (
                                <DirectoryNode key={child.path} node={child} depth={depth + 1} />
                            ))}
                        </div>
                    )}
                </div>
            );
        };

        return (
            <div className="space-y-1">
                <div className="text-xs text-gray-500 mb-2">
                    {componentFiles.length} components found
                </div>
                
                {/* All Directories option */}
                <button
                    onClick={() => setSelectedDirectory(null)}
                    className={`w-full flex items-center text-left text-sm py-1 px-2 rounded mb-2 ${
                        selectedDirectory === null 
                            ? 'bg-blue-100 text-blue-700' 
                            : 'hover:bg-gray-100'
                    }`}
                >
                    📁 All Directories
                    <span className="ml-auto text-xs text-gray-500">
                        ({componentFiles.length})
                    </span>
                </button>
                
                {/* Hierarchical directory tree */}
                {directoryTree.map(rootNode => (
                    <DirectoryNode key={rootNode.path} node={rootNode} depth={0} />
                ))}
            </div>
        );
    };

    // Main render
    return (
        <div className="h-screen bg-gray-100 flex">
            {/* Sidebar - Desktop or Mobile Overlay */}
            {(showSidebar || !isMobile) && (
                <>
                    {isMobile && (
                        <div 
                            className="fixed inset-0 bg-black bg-opacity-50 z-40"
                            onClick={() => setShowSidebar(false)}
                        />
                    )}
                    <div className={`${
                        isMobile 
                            ? 'fixed left-0 top-0 h-full z-50 bg-white shadow-xl' 
                            : 'relative'
                    }`}>
                        <Sidebar />
                    </div>
                </>
            )}

            {/* Main Content */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Header */}
                <div className="bg-white border-b p-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                            {isMobile && (
                                <button
                                    onClick={() => setShowSidebar(true)}
                                    className="text-gray-500 hover:text-gray-700"
                                >
                                    ☰
                                </button>
                            )}
                            <h1 className="text-xl font-bold text-gray-900">
                                Component Browser
                            </h1>
                        </div>
                        
                        {/* Navigation Tabs */}
                        <div className="flex bg-gray-100 rounded-lg p-1">
                            <button
                                onClick={() => setCurrentView('all')}
                                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                                    currentView === 'all'
                                        ? 'bg-white text-blue-600 shadow-sm'
                                        : 'text-gray-600 hover:text-gray-900'
                                }`}
                            >
                                All Components
                                <span className="ml-1 text-xs text-gray-500">({components.length})</span>
                            </button>
                            <button
                                onClick={() => setCurrentView('pinned')}
                                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                                    currentView === 'pinned'
                                        ? 'bg-white text-yellow-600 shadow-sm'
                                        : 'text-gray-600 hover:text-gray-900'
                                }`}
                            >
                                📌 Pinned
                                <span className="ml-1 text-xs text-gray-500">({pinnedFiles.size})</span>
                            </button>
                            <button
                                onClick={() => setCurrentView('recent')}
                                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                                    currentView === 'recent'
                                        ? 'bg-white text-green-600 shadow-sm'
                                        : 'text-gray-600 hover:text-gray-900'
                                }`}
                            >
                                🕒 Recent
                                <span className="ml-1 text-xs text-gray-500">
                                    ({components.filter(c => {
                                        const weekAgo = new Date();
                                        weekAgo.setDate(weekAgo.getDate() - 7);
                                        return new Date(c.lastModified) > weekAgo;
                                    }).length})
                                </span>
                            </button>
                        </div>
                        
                        <div className="text-sm text-gray-500">
                            {filteredComponents.length} {currentView === 'all' ? 'components' : currentView === 'pinned' ? 'pinned' : 'recent'}
                        </div>
                    </div>

                        <div className="flex items-center space-x-2">
                            {/* View Mode Toggle */}
                            <div className="flex bg-gray-200 rounded-md p-1">
                                <button
                                    onClick={() => setViewMode('grid')}
                                    className={`px-3 py-1 rounded text-sm ${
                                        viewMode === 'grid' 
                                            ? 'bg-white shadow-sm' 
                                            : 'text-gray-600'
                                    }`}
                                >
                                    Grid
                                </button>
                                <button
                                    onClick={() => setViewMode('list')}
                                    className={`px-3 py-1 rounded text-sm ${
                                        viewMode === 'list' 
                                            ? 'bg-white shadow-sm' 
                                            : 'text-gray-600'
                                    }`}
                                >
                                    List
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Search and Filters */}
                    <div className="mt-4 flex flex-col sm:flex-row gap-4">
                        {/* Search */}
                        <div className="flex-1">
                            <input
                                type="text"
                                placeholder="Search components..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        {/* Filters */}
                        <div className="flex gap-2">
                            <select
                                value={filterType}
                                onChange={(e) => setFilterType(e.target.value as any)}
                                className="px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="all">All Types</option>
                                <option value="tsx">TypeScript</option>
                                <option value="jsx">JavaScript</option>
                            </select>

                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value as any)}
                                className="px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="name">Sort by Name</option>
                                <option value="date">Sort by Date</option>
                                <option value="size">Sort by Size</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Components Grid/List */}
                <div className="flex-1 overflow-auto p-4">
                    {filteredComponents.length === 0 ? (
                        <div className="text-center py-12">
                            {currentView === 'pinned' ? (
                                <div>
                                    <div className="text-6xl mb-4">📌</div>
                                    <h3 className="text-xl font-medium text-gray-900 mb-2">
                                        No pinned components yet
                                    </h3>
                                    <p className="text-gray-600 mb-4">
                                        Pin your favorite components for quick access
                                    </p>
                                    <button
                                        onClick={() => setCurrentView('all')}
                                        className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors"
                                    >
                                        Browse All Components
                                    </button>
                                </div>
                            ) : currentView === 'recent' ? (
                                <div>
                                    <div className="text-6xl mb-4">🕒</div>
                                    <h3 className="text-xl font-medium text-gray-900 mb-2">
                                        No recent components
                                    </h3>
                                    <p className="text-gray-600">
                                        Components modified in the last 7 days will appear here
                                    </p>
                                </div>
                            ) : (
                                <div>
                                    <div className="text-6xl mb-4">📦</div>
                                    <h3 className="text-xl font-medium text-gray-900 mb-2">
                                        No components found
                                    </h3>
                                    <p className="text-gray-600">
                                        {searchQuery ? 'Try adjusting your search query' : 'Create some React components to get started'}
                                    </p>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className={
                            viewMode === 'grid'
                                ? `grid gap-4 ${
                                    isMobile 
                                        ? 'grid-cols-1' 
                                        : 'grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
                                  }`
                                : 'space-y-4'
                        }>
                            {filteredComponents.map(component => (
                                <ComponentCard 
                                    key={component.path} 
                                    component={component}
                                    isCompact={viewMode === 'list' || isMobile}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Full Screen Preview Modal */}
            {fullScreenPreview && (
                <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50">
                    <div className="w-full h-full max-w-7xl mx-auto p-4 flex flex-col">
                        {/* Full Screen Header */}
                        <div className="flex items-center justify-between mb-4 text-white">
                            <div>
                                <h2 className="text-xl font-bold">{fullScreenPreview.name}</h2>
                                <p className="text-sm text-gray-300">{fullScreenPreview.path}</p>
                            </div>
                            <div className="flex items-center gap-2">
                                {fullScreenPreview.exportedComponents.length > 1 && (
                                    <select
                                        value={selectedComponentExport || fullScreenPreview.exportedComponents[0]}
                                        onChange={(e) => setSelectedComponentExport(e.target.value)}
                                        className="bg-gray-800 text-white px-3 py-1 rounded border border-gray-600"
                                    >
                                        {fullScreenPreview.exportedComponents.map(comp => (
                                            <option key={comp} value={comp}>{comp}</option>
                                        ))}
                                    </select>
                                )}
                                <button
                                    onClick={() => openInNewTab(fullScreenPreview, selectedComponentExport)}
                                    className="bg-gray-800 hover:bg-gray-700 text-white px-3 py-1 rounded"
                                >
                                    🔗 New Tab
                                </button>
                                <button
                                    onClick={() => retryPreview(fullScreenPreview.path)}
                                    className="bg-gray-800 hover:bg-gray-700 text-white px-3 py-1 rounded"
                                >
                                    ↻ Refresh
                                </button>
                                <button
                                    onClick={() => setFullScreenPreview(null)}
                                    className="bg-gray-800 hover:bg-gray-700 text-white px-3 py-1 rounded"
                                >
                                    ✕ Close
                                </button>
                            </div>
                        </div>
                        
                        {/* Full Screen Preview */}
                        <div className="flex-1 bg-white rounded-lg overflow-hidden">
                            <iframe
                                src={getPreviewUrl(fullScreenPreview, selectedComponentExport)}
                                className="w-full h-full border-0"
                                sandbox="allow-scripts allow-same-origin allow-forms"
                                title={`Full screen preview of ${fullScreenPreview.name}`}
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* Component Detail Modal */}
            {selectedComponent && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-auto">
                        <div className="p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-2xl font-bold text-gray-900">
                                    {selectedComponent.name}
                                </h2>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => togglePinFile(selectedComponent.path)}
                                        className={`px-3 py-1 rounded text-sm transition-colors ${
                                            pinnedFiles.has(selectedComponent.path)
                                                ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                        }`}
                                        title={pinnedFiles.has(selectedComponent.path) ? 'Unpin file' : 'Pin file'}
                                    >
                                        📌 {pinnedFiles.has(selectedComponent.path) ? 'Unpin' : 'Pin'}
                                    </button>
                                    <button
                                        onClick={() => openInNewTab(selectedComponent)}
                                        className="bg-blue-100 hover:bg-blue-200 text-blue-700 px-3 py-1 rounded text-sm"
                                    >
                                        🔗 Open in New Tab
                                    </button>
                                    <button
                                        onClick={() => setFullScreenPreview(selectedComponent)}
                                        className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1 rounded text-sm"
                                    >
                                        ⛶ Full Screen
                                    </button>
                                    <button
                                        onClick={() => setSelectedComponent(null)}
                                        className="text-gray-500 hover:text-gray-700 text-xl"
                                    >
                                        ✕
                                    </button>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {/* Component Preview */}
                                <div>
                                    <h3 className="text-lg font-medium mb-3">Preview</h3>
                                    <div className="bg-gray-50 rounded-lg h-64 overflow-hidden">
                                        <iframe
                                            src={getPreviewUrl(selectedComponent, selectedDetailExport)}
                                            className="w-full h-full border-0"
                                        />
                                    </div>
                                </div>

                                {/* Component Details */}
                                <div className="space-y-4">
                                    <div>
                                        <h3 className="text-lg font-medium mb-2">Details</h3>
                                        <div className="space-y-2 text-sm">
                                            <div><strong>Path:</strong> {selectedComponent.path}</div>
                                            <div><strong>Size:</strong> {Math.round(selectedComponent.size / 1024)}KB</div>
                                            <div><strong>Modified:</strong> {new Date(selectedComponent.lastModified).toLocaleDateString()}</div>
                                        </div>
                                    </div>

                                    {selectedComponent.description && (
                                        <div>
                                            <h3 className="text-lg font-medium mb-2">Description</h3>
                                            <p className="text-gray-600">{selectedComponent.description}</p>
                                        </div>
                                    )}

                                    {selectedComponent.exportedComponents.length > 0 && (
                                        <div>
                                            <h3 className="text-lg font-medium mb-2">Exported Components</h3>
                                            <div className="flex flex-wrap gap-2">
                                                {selectedComponent.exportedComponents.map(comp => (
                                                    <button 
                                                        key={comp}
                                                        onClick={() => setSelectedDetailExport(comp)}
                                                        className={`px-2 py-1 rounded text-sm transition-colors cursor-pointer hover:opacity-80 ${
                                                            selectedDetailExport === comp
                                                                ? 'bg-blue-100 text-blue-700 ring-2 ring-blue-300'
                                                                : 'bg-green-100 text-green-700 hover:bg-green-200'
                                                        }`}
                                                    >
                                                        {comp}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {selectedComponent.tags.length > 0 && (
                                        <div>
                                            <h3 className="text-lg font-medium mb-2">Tags</h3>
                                            <div className="flex flex-wrap gap-2">
                                                {selectedComponent.tags.map(tag => (
                                                    <span 
                                                        key={tag}
                                                        className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-sm"
                                                    >
                                                        {tag}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ComponentBrowser;