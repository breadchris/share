import React, { useState, useEffect, useCallback } from 'react';
import { UserProfile } from './UserProfile';

// Types for CLAUDE.md documents
interface ClaudeDoc {
    id: string;
    title: string;
    description: string;
    author_name: string;
    author_username: string;
    is_starred: boolean;
    tag_names: string[];
    stars: number;
    views: number;
    downloads: number;
    created_at: string;
    updated_at: string;
    is_public: boolean;
}

interface ClaudeDocListResponse {
    docs: ClaudeDoc[];
    total: number;
    page: number;
    per_page: number;
    total_pages: number;
}

interface Tag {
    id: string;
    name: string;
    color?: string;
}

// Predefined developer tags
const PREDEFINED_TAGS = [
    // Languages
    'typescript', 'javascript', 'python', 'golang', 'rust', 'java', 'csharp', 'ruby', 'php',
    // Frameworks
    'react', 'vue', 'angular', 'nextjs', 'svelte', 'express', 'fastapi', 'django', 'rails', 'laravel',
    // Infrastructure
    'docker', 'kubernetes', 'aws', 'gcp', 'azure', 'terraform', 'ansible',
    // Databases
    'postgresql', 'mysql', 'mongodb', 'redis', 'elasticsearch',
    // Tools
    'git', 'vscode', 'intellij', 'postman', 'figma', 'slack',
    // APIs
    'rest', 'graphql', 'websocket', 'grpc', 'oauth', 'jwt',
    // Platforms
    'web', 'mobile', 'desktop', 'cli', 'api', 'microservices'
];

interface ClaudeDocBrowserProps {
    onCreateNew?: () => void;
    onEdit?: (docId: string) => void;
}

export const ClaudeDocBrowser: React.FC<ClaudeDocBrowserProps> = ({
    onCreateNew,
    onEdit
}) => {
    // Authentication state
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [username, setUsername] = useState('');
    const [showProfile, setShowProfile] = useState(false);

    // State management
    const [docs, setDocs] = useState<ClaudeDoc[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedTags, setSelectedTags] = useState<string[]>([]);
    const [availableTags, setAvailableTags] = useState<Tag[]>([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);
    const [sortBy, setSortBy] = useState<'created_at' | 'stars' | 'views'>('created_at');
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [selectedDoc, setSelectedDoc] = useState<ClaudeDoc | null>(null);
    
    // Mobile UI state
    const [showTagsPanel, setShowTagsPanel] = useState(false);
    const [tagSearchQuery, setTagSearchQuery] = useState('');
    const [showMobileFilters, setShowMobileFilters] = useState(false);
    const [starringDocId, setStarringDocId] = useState<string | null>(null);

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

    // Load documents
    const loadDocs = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                page: currentPage.toString(),
            });

            if (selectedTags.length > 0) {
                params.append('tags', selectedTags.join(','));
            }

            const response = await fetch(`/claudemd/api/docs?${params}`, {
                credentials: 'include'
            });
            if (response.ok) {
                const data: ClaudeDocListResponse = await response.json();
                console.log('Loaded documents:', data.docs); // Debug logging
                setDocs(data.docs);
                setTotalPages(data.total_pages);
                setTotal(data.total);
            }
        } catch (error) {
            console.error('Failed to load documents:', error);
        } finally {
            setLoading(false);
        }
    }, [currentPage, selectedTags]);

    // Search documents
    const searchDocs = useCallback(async () => {
        if (!searchQuery && selectedTags.length === 0) {
            loadDocs();
            return;
        }

        setLoading(true);
        try {
            const params = new URLSearchParams({
                page: currentPage.toString(),
            });

            if (searchQuery) {
                params.append('q', searchQuery);
            }

            if (selectedTags.length > 0) {
                params.append('tags', selectedTags.join(','));
            }

            const response = await fetch(`/claudemd/api/search?${params}`, {
                credentials: 'include'
            });
            if (response.ok) {
                const data: ClaudeDocListResponse = await response.json();
                setDocs(data.docs);
                setTotalPages(data.total_pages);
                setTotal(data.total);
            }
        } catch (error) {
            console.error('Search failed:', error);
        } finally {
            setLoading(false);
        }
    }, [searchQuery, selectedTags, currentPage, loadDocs]);

    // Load available tags
    const loadTags = useCallback(async () => {
        try {
            const response = await fetch('/claudemd/api/tags', {
                credentials: 'include'
            });
            if (response.ok) {
                const tags: Tag[] = await response.json();
                setAvailableTags(tags);
            }
        } catch (error) {
            console.error('Failed to load tags:', error);
        }
    }, []);

    // Star/unstar document
    const toggleStar = useCallback(async (docId: string, isStarred: boolean) => {
        // Prevent multiple simultaneous requests
        if (starringDocId === docId) return;
        
        setStarringDocId(docId);
        
        // Optimistically update UI immediately
        const updateDoc = (doc: ClaudeDoc) => {
            if (doc.id === docId) {
                return {
                    ...doc,
                    is_starred: !isStarred,
                    stars: isStarred ? doc.stars - 1 : doc.stars + 1
                };
            }
            return doc;
        };
        
        // Update both docs list and selectedDoc immediately
        setDocs(prevDocs => prevDocs.map(updateDoc));
        if (selectedDoc && selectedDoc.id === docId) {
            setSelectedDoc(updateDoc(selectedDoc));
        }
        
        try {
            const method = isStarred ? 'DELETE' : 'POST';
            const response = await fetch(`/claudemd/api/docs/${docId}/star`, { 
                method,
                credentials: 'include'
            });
            
            if (!response.ok) {
                // Revert on failure
                const revertDoc = (doc: ClaudeDoc) => {
                    if (doc.id === docId) {
                        return {
                            ...doc,
                            is_starred: isStarred,
                            stars: isStarred ? doc.stars + 1 : doc.stars - 1
                        };
                    }
                    return doc;
                };
                
                setDocs(prevDocs => prevDocs.map(revertDoc));
                if (selectedDoc && selectedDoc.id === docId) {
                    setSelectedDoc(revertDoc(selectedDoc));
                }
                
                throw new Error('Failed to toggle star');
            }
        } catch (error) {
            console.error('Failed to toggle star:', error);
        } finally {
            setStarringDocId(null);
        }
    }, [selectedDoc, starringDocId]);

    // Download document
    const downloadDoc = useCallback(async (docId: string, title: string) => {
        try {
            const response = await fetch(`/claudemd/api/docs/${docId}/download`, {
                credentials: 'include'
            });
            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `${title}.md`;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
            }
        } catch (error) {
            console.error('Failed to download document:', error);
        }
    }, []);

    // Toggle tag selection
    const toggleTag = useCallback((tagName: string) => {
        setSelectedTags(prev => 
            prev.includes(tagName)
                ? prev.filter(t => t !== tagName)
                : [...prev, tagName]
        );
        setCurrentPage(1);
    }, []);
    
    // Get popular tags (most commonly used)
    const getPopularTags = useCallback(() => {
        const popularTags = ['typescript', 'react', 'python', 'javascript', 'nodejs', 'api', 'docker', 'aws'];
        return popularTags.filter(tag => PREDEFINED_TAGS.includes(tag));
    }, []);
    
    // Filter tags based on search query
    const getFilteredTags = useCallback(() => {
        if (!tagSearchQuery) return PREDEFINED_TAGS;
        return PREDEFINED_TAGS.filter(tag => 
            tag.toLowerCase().includes(tagSearchQuery.toLowerCase())
        );
    }, [tagSearchQuery]);

    // Effects
    // Initialize auth and load data on mount
    useEffect(() => {
        const initializeAuth = async () => {
            await checkGithubAuth();
            loadTags();
        };
        initializeAuth();
    }, []);

    useEffect(() => {
        loadTags();
    }, [loadTags]);

    useEffect(() => {
        const debounceTimer = setTimeout(() => {
            searchDocs();
        }, 300);

        return () => clearTimeout(debounceTimer);
    }, [searchDocs]);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, selectedTags]);
    
    // Close mobile filters when tags panel opens
    useEffect(() => {
        if (showTagsPanel) {
            setShowMobileFilters(false);
        }
    }, [showTagsPanel]);
    
    // Keep selectedDoc in sync with docs list updates
    useEffect(() => {
        if (selectedDoc) {
            const updatedDoc = docs.find(doc => doc.id === selectedDoc.id);
            if (updatedDoc && (
                updatedDoc.is_starred !== selectedDoc.is_starred || 
                updatedDoc.stars !== selectedDoc.stars
            )) {
                setSelectedDoc(updatedDoc);
            }
        }
    }, [docs, selectedDoc]);

    // Render document card
    const renderDocCard = (doc: ClaudeDoc) => (
        <div 
            key={doc.id}
            className={`bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow ${
                viewMode === 'list' ? 'p-3 sm:p-4' : 'p-3 sm:p-4 lg:p-6'
            }`}
        >
            <div className="mb-2 sm:mb-3">
                <div className="flex-1">
                    <h3 className="text-sm sm:text-base lg:text-lg font-semibold text-gray-900 mb-1 leading-tight line-clamp-2">
                        {doc.title || 'Untitled Document'}
                    </h3>
                    <p className="text-xs sm:text-sm text-gray-600 mb-1.5 sm:mb-2">
                        by <span className="font-medium text-blue-600">@{doc.author_username}</span>
                    </p>
                    {doc.description && (
                        <p className="text-gray-700 text-xs sm:text-sm mb-2 sm:mb-3 line-clamp-2 leading-relaxed">
                            {doc.description}
                        </p>
                    )}
                </div>
            </div>

            {/* Tags */}
            {doc.tag_names.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-2 sm:mb-3">
                    {doc.tag_names.slice(0, 3).map(tag => (
                        <span 
                            key={tag}
                            className="bg-blue-100 text-blue-700 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full text-xs cursor-pointer hover:bg-blue-200 transition-colors"
                            onClick={() => toggleTag(tag)}
                        >
                            {tag}
                        </span>
                    ))}
                    {doc.tag_names.length > 3 && (
                        <span className="text-gray-500 text-xs px-1 sm:px-2 py-0.5 sm:py-1">
                            +{doc.tag_names.length - 3}
                        </span>
                    )}
                </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-between pt-2 sm:pt-3 border-t">
                <div className="flex items-center gap-2 sm:gap-3 text-xs text-gray-500">
                    <span className="inline-flex items-center gap-0.5">
                        <span className="text-xs">👁</span> {doc.views}
                    </span>
                    <span className="inline-flex items-center gap-0.5">
                        <span className="text-xs">⭐</span> {doc.stars}
                    </span>
                </div>
                <div className="flex items-center gap-1.5 sm:gap-2">
                    <button
                        onClick={() => setSelectedDoc(doc)}
                        className="bg-blue-500 text-white px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm hover:bg-blue-600 transition-colors"
                    >
                        View
                    </button>
                    <button
                        onClick={() => downloadDoc(doc.id, doc.title)}
                        className="bg-gray-500 text-white px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm hover:bg-gray-600 transition-colors"
                        title="Download"
                    >
                        📥
                    </button>
                </div>
            </div>
        </div>
    );

    // Show profile view if profile is active
    if (showProfile && isLoggedIn) {
        return (
            <UserProfile 
                username={username}
                onEdit={onEdit}
                onBack={() => setShowProfile(false)}
            />
        );
    }

    return (
        <div className="min-h-screen bg-gray-100">
            {/* Header */}
            <div className="bg-white shadow-sm border-b">
                <div className="w-full px-4 py-4 sm:py-6 sm:px-6 lg:max-w-7xl lg:mx-auto">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                        <div className="flex-1">
                            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 break-words">CLAUDE.md Library</h1>
                            <p className="text-gray-600 mt-1 text-sm lg:text-base break-words">
                                Discover and share AI integration documentation
                            </p>
                        </div>
                        
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
                            {isLoggedIn ? (
                                <>
                                    <div className="text-sm text-gray-600 text-center sm:text-left hidden sm:block">
                                        Welcome, <span className="font-medium text-blue-600">@{username}</span>
                                    </div>
                                    <div className="flex gap-2 w-full sm:w-auto">
                                        <button
                                            onClick={() => setShowProfile(!showProfile)}
                                            className="bg-gray-200 text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-300 transition-colors text-sm flex-1 sm:flex-initial whitespace-nowrap"
                                        >
                                            👤 Profile
                                        </button>
                                        <button
                                            onClick={() => onCreateNew?.()}
                                            className="bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm flex-1 sm:flex-initial sm:px-4 whitespace-nowrap overflow-hidden text-ellipsis"
                                        >
                                            <span className="inline sm:hidden">📝 Create</span>
                                            <span className="hidden sm:inline">📝 Create CLAUDE.md</span>
                                        </button>
                                    </div>
                                    <div className="text-sm text-gray-600 text-center sm:hidden">
                                        Welcome, <span className="font-medium text-blue-600">@{username}</span>
                                    </div>
                                </>
                            ) : (
                                <div className="text-center sm:text-left w-full sm:w-auto">
                                    <p className="text-sm text-gray-700 mb-3 hidden sm:block">
                                        Sign in with GitHub to create and manage CLAUDE.md documents
                                    </p>
                                    <a
                                        href="/github/login"
                                        className="inline-block bg-gray-800 text-white px-4 py-2 rounded-lg hover:bg-gray-900 transition-colors text-sm w-full sm:w-auto"
                                    >
                                        <span className="mr-2">🔐</span>
                                        Sign in with GitHub
                                    </a>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Search and filters */}
                    <div className="mt-4 sm:mt-6 space-y-3 sm:space-y-4">
                        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                            <div className="flex-1">
                                <input
                                    type="text"
                                    placeholder="Search documents..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
                                />
                            </div>
                            
                            {/* Mobile filter toggle */}
                            <button
                                onClick={() => setShowMobileFilters(!showMobileFilters)}
                                className="sm:hidden bg-gray-100 text-gray-700 px-4 py-2.5 rounded-lg border hover:bg-gray-200 transition-colors flex items-center justify-center gap-2 text-sm font-medium"
                            >
                                <span>🔧</span>
                                Filters
                                <span className={`transform transition-transform ${showMobileFilters ? 'rotate-180' : ''} text-xs`}>
                                    ▼
                                </span>
                            </button>
                        </div>
                        
                        {/* Desktop filters - always visible */}
                        <div className="hidden sm:flex items-center gap-3 flex-wrap">
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value as any)}
                                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="created_at">Latest</option>
                                <option value="stars">Most Starred</option>
                                <option value="views">Most Viewed</option>
                            </select>

                            <div className="flex bg-gray-200 rounded-lg p-1">
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
                            
                            {/* Tags toggle for desktop */}
                            <button
                                onClick={() => setShowTagsPanel(!showTagsPanel)}
                                className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg border hover:bg-gray-200 transition-colors flex items-center gap-2"
                            >
                                <span>🏷️</span>
                                Filter by Tags
                                {selectedTags.length > 0 && (
                                    <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs">
                                        {selectedTags.length}
                                    </span>
                                )}
                                <span className={`transform transition-transform ${showTagsPanel ? 'rotate-180' : ''}`}>
                                    ▼
                                </span>
                            </button>
                        </div>
                        
                        {/* Mobile filters - collapsible */}
                        {showMobileFilters && (
                            <div className="sm:hidden bg-gray-50 rounded-lg p-3 space-y-3 border">
                                <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1.5">Sort by</label>
                                    <select
                                        value={sortBy}
                                        onChange={(e) => setSortBy(e.target.value as any)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                    >
                                        <option value="created_at">Latest</option>
                                        <option value="stars">Most Starred</option>
                                        <option value="views">Most Viewed</option>
                                    </select>
                                </div>
                                
                                <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1.5">View</label>
                                    <div className="flex bg-gray-200 rounded-lg p-1">
                                        <button
                                            onClick={() => setViewMode('grid')}
                                            className={`flex-1 py-1.5 rounded text-sm ${
                                                viewMode === 'grid' 
                                                    ? 'bg-white shadow-sm' 
                                                    : 'text-gray-600'
                                            }`}
                                        >
                                            Grid
                                        </button>
                                        <button
                                            onClick={() => setViewMode('list')}
                                            className={`flex-1 py-1.5 rounded text-sm ${
                                                viewMode === 'list' 
                                                    ? 'bg-white shadow-sm' 
                                                    : 'text-gray-600'
                                            }`}
                                        >
                                            List
                                        </button>
                                    </div>
                                </div>
                                
                                <button
                                    onClick={() => setShowTagsPanel(!showTagsPanel)}
                                    className="w-full bg-gray-100 text-gray-700 px-4 py-2.5 rounded-lg border hover:bg-gray-200 transition-colors flex items-center justify-center gap-2 text-sm"
                                >
                                    <span>🏷️</span>
                                    Filter by Tags
                                    {selectedTags.length > 0 && (
                                        <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-xs">
                                            {selectedTags.length}
                                        </span>
                                    )}
                                    <span className={`transform transition-transform ${showTagsPanel ? 'rotate-180' : ''} text-xs`}>
                                        ▼
                                    </span>
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Tag filters panel - collapsible */}
                    {showTagsPanel && (
                        <div className="mt-3 sm:mt-4 bg-gray-50 rounded-lg p-3 sm:p-4 border">
                            <div className="flex items-center justify-between mb-3 sm:mb-4">
                                <h3 className="text-base sm:text-lg font-medium text-gray-900">Filter by Tags</h3>
                                <button
                                    onClick={() => setShowTagsPanel(false)}
                                    className="text-gray-500 hover:text-gray-700 p-1"
                                >
                                    ✕
                                </button>
                            </div>
                            
                            {/* Tag search */}
                            <div className="mb-3 sm:mb-4">
                                <input
                                    type="text"
                                    placeholder="Search tags..."
                                    value={tagSearchQuery}
                                    onChange={(e) => setTagSearchQuery(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                />
                            </div>
                            
                            {/* Popular tags section */}
                            {!tagSearchQuery && (
                                <div className="mb-3 sm:mb-4">
                                    <h4 className="text-xs sm:text-sm font-medium text-gray-700 mb-2">Popular Tags</h4>
                                    <div className="flex flex-wrap gap-1.5 sm:gap-2">
                                        {getPopularTags().map(tag => (
                                            <button
                                                key={tag}
                                                onClick={() => toggleTag(tag)}
                                                className={`px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm transition-colors ${
                                                    selectedTags.includes(tag)
                                                        ? 'bg-blue-600 text-white'
                                                        : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                                                }`}
                                            >
                                                {tag}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                            
                            {/* All tags */}
                            <div className="mb-3 sm:mb-4">
                                <h4 className="text-xs sm:text-sm font-medium text-gray-700 mb-2">
                                    {tagSearchQuery ? `Search Results (${getFilteredTags().length})` : 'All Tags'}
                                </h4>
                                <div className="max-h-40 sm:max-h-48 overflow-y-auto -mx-1 px-1">
                                    <div className="flex flex-wrap gap-1 sm:gap-2">
                                        {getFilteredTags().map(tag => (
                                            <button
                                                key={tag}
                                                onClick={() => toggleTag(tag)}
                                                className={`px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm transition-colors ${
                                                    selectedTags.includes(tag)
                                                        ? 'bg-blue-600 text-white'
                                                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                                }`}
                                            >
                                                {tag}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            
                            {/* Selected tags */}
                            {selectedTags.length > 0 && (
                                <div className="pt-3 sm:pt-4 border-t border-gray-200">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-xs sm:text-sm font-medium text-gray-700">Active Filters ({selectedTags.length})</span>
                                        <button
                                            onClick={() => setSelectedTags([])}
                                            className="text-xs sm:text-sm text-red-600 hover:text-red-700"
                                        >
                                            Clear all
                                        </button>
                                    </div>
                                    <div className="flex flex-wrap gap-1.5 sm:gap-2">
                                        {selectedTags.map(tag => (
                                            <span 
                                                key={tag}
                                                className="bg-blue-100 text-blue-700 px-2.5 sm:px-3 py-1 rounded-full text-xs sm:text-sm cursor-pointer hover:bg-blue-200 inline-flex items-center gap-1"
                                                onClick={() => toggleTag(tag)}
                                            >
                                                {tag}
                                                <span className="text-blue-500">✕</span>
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                    
                    {/* Quick selected tags display when panel is closed */}
                    {!showTagsPanel && selectedTags.length > 0 && (
                        <div className="mt-3 sm:mt-4 flex items-center gap-1.5 sm:gap-2 flex-wrap">
                            <span className="text-xs sm:text-sm text-gray-600">Filters:</span>
                            {selectedTags.slice(0, 3).map(tag => (
                                <span 
                                    key={tag}
                                    className="bg-blue-100 text-blue-700 px-2 py-0.5 sm:py-1 rounded text-xs sm:text-sm cursor-pointer hover:bg-blue-200 inline-flex items-center gap-1"
                                    onClick={() => toggleTag(tag)}
                                >
                                    {tag}
                                    <span className="text-blue-500 text-xs">✕</span>
                                </span>
                            ))}
                            {selectedTags.length > 3 && (
                                <span className="text-xs sm:text-sm text-gray-500">
                                    +{selectedTags.length - 3} more
                                </span>
                            )}
                            <button
                                onClick={() => setShowTagsPanel(true)}
                                className="text-xs sm:text-sm text-blue-600 hover:text-blue-700"
                            >
                                Edit filters
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Content */}
            <div className="w-full px-4 py-4 sm:py-6 sm:px-6 lg:max-w-7xl lg:mx-auto">
                {/* Results summary */}
                <div className="flex items-center justify-between mb-4 sm:mb-6">
                    <p className="text-gray-600 text-sm sm:text-base">
                        {total} document{total !== 1 ? 's' : ''} found
                    </p>
                </div>

                {/* Loading state */}
                {loading && (
                    <div className="flex items-center justify-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                )}

                {/* No results */}
                {!loading && docs.length === 0 && (
                    <div className="text-center py-12">
                        <div className="text-6xl mb-4">📄</div>
                        <h3 className="text-xl font-medium text-gray-900 mb-2">
                            No documents found
                        </h3>
                        <p className="text-gray-600">
                            {searchQuery || selectedTags.length > 0
                                ? 'Try adjusting your search criteria'
                                : 'Be the first to share a CLAUDE.md file!'
                            }
                        </p>
                    </div>
                )}

                {/* Documents grid/list */}
                {!loading && docs.length > 0 && (
                    <div className={
                        viewMode === 'grid'
                            ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6'
                            : 'space-y-4'
                    }>
                        {docs.map(renderDocCard)}
                    </div>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-center mt-8 gap-2">
                        <button
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                            className="px-4 py-2 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                        >
                            ← Previous
                        </button>
                        
                        <span className="px-4 py-2 text-sm text-gray-600">
                            Page {currentPage} of {totalPages}
                        </span>
                        
                        <button
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                            className="px-4 py-2 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                        >
                            Next →
                        </button>
                    </div>
                )}
            </div>

            {/* Document viewer modal */}
            {selectedDoc && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
                        {/* Fixed header with title and actions */}
                        <div className="flex-shrink-0 p-4 lg:p-6 border-b border-gray-200">
                            <div className="flex items-start justify-between mb-3">
                                <div className="flex-1 pr-4">
                                    <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 leading-tight line-clamp-2">
                                        {selectedDoc.title}
                                    </h2>
                                    <p className="text-gray-600 mt-1 text-xs sm:text-sm">
                                        By @{selectedDoc.author_username} • Created {new Date(selectedDoc.created_at).toLocaleDateString()}
                                    </p>
                                </div>
                                <button
                                    onClick={() => setSelectedDoc(null)}
                                    className="text-gray-500 hover:text-gray-700 text-xl flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
                                >
                                    ✕
                                </button>
                            </div>
                            
                            {/* Action buttons */}
                            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                                <button
                                    onClick={() => downloadDoc(selectedDoc.id, selectedDoc.title)}
                                    className="bg-blue-600 text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex-1 sm:flex-none text-sm font-medium inline-flex items-center justify-center gap-1.5"
                                >
                                    <span className="text-base">📥</span>
                                    Download
                                </button>
                                <button
                                    onClick={() => toggleStar(selectedDoc.id, selectedDoc.is_starred)}
                                    disabled={starringDocId === selectedDoc.id}
                                    className={`px-3 sm:px-4 py-2 rounded-lg transition-colors flex-1 sm:flex-none text-sm font-medium inline-flex items-center justify-center gap-1.5 ${
                                        starringDocId === selectedDoc.id 
                                            ? 'bg-gray-200 text-gray-500 cursor-not-allowed' 
                                            : selectedDoc.is_starred 
                                                ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200' 
                                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                                >
                                    {starringDocId === selectedDoc.id ? (
                                        <span className="animate-spin text-base">⭐</span>
                                    ) : (
                                        <span className="text-base">{selectedDoc.is_starred ? '★' : '☆'}</span>
                                    )}
                                    {starringDocId === selectedDoc.id ? 'Updating...' : (selectedDoc.is_starred ? 'Starred' : 'Star')}
                                </button>
                                <div className="hidden sm:flex items-center gap-3 text-xs text-gray-500 px-2">
                                    <span className="inline-flex items-center gap-1">
                                        <span>👁</span> {selectedDoc.views}
                                    </span>
                                    <span className="inline-flex items-center gap-1">
                                        <span>⭐</span> {selectedDoc.stars}
                                    </span>
                                </div>
                            </div>
                        </div>
                        
                        {/* Scrollable content */}
                        <div className="flex-1 overflow-y-auto p-4 lg:p-6">
                            {selectedDoc.description && (
                                <p className="text-gray-700 mb-4 text-sm lg:text-base leading-relaxed">{selectedDoc.description}</p>
                            )}
                            
                            <div className="bg-gray-50 p-4 rounded-lg">
                                <p className="text-sm text-gray-600 mb-2">
                                    This is a preview of the CLAUDE.md document.
                                </p>
                                <p className="text-xs text-gray-500">
                                    Click "Download" above to get the complete content.
                                </p>
                            </div>
                            
                            {/* Mobile stats */}
                            <div className="sm:hidden mt-4 flex items-center justify-center gap-4 text-xs text-gray-500 py-2">
                                <span className="inline-flex items-center gap-1">
                                    <span>👁</span> {selectedDoc.views} views
                                </span>
                                <span className="inline-flex items-center gap-1">
                                    <span>⭐</span> {selectedDoc.stars} stars
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Create modal placeholder */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full">
                        <div className="p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-2xl font-bold text-gray-900">
                                    Create CLAUDE.md
                                </h2>
                                <button
                                    onClick={() => setShowCreateModal(false)}
                                    className="text-gray-500 hover:text-gray-700 text-xl"
                                >
                                    ✕
                                </button>
                            </div>
                            <p className="text-gray-600">
                                Editor component will be implemented next...
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ClaudeDocBrowser;