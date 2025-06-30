import React, { useState, useEffect, useCallback } from 'react';

// Types
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

interface UserProfileProps {
    username: string;
    onEdit?: (docId: string) => void;
    onBack: () => void;
}

export const UserProfile: React.FC<UserProfileProps> = ({
    username,
    onEdit,
    onBack
}) => {
    const [docs, setDocs] = useState<ClaudeDoc[]>([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        total: 0,
        public: 0,
        private: 0,
        totalStars: 0,
        totalViews: 0,
        totalDownloads: 0
    });

    // Load user's documents
    const loadUserDocs = useCallback(async () => {
        setLoading(true);
        try {
            const response = await fetch('/claudemd/api/user/docs', {
                credentials: 'include'
            });
            
            if (response.ok) {
                const userDocs: ClaudeDoc[] = await response.json();
                setDocs(userDocs);
                
                // Calculate stats
                const totalStars = userDocs.reduce((sum, doc) => sum + doc.stars, 0);
                const totalViews = userDocs.reduce((sum, doc) => sum + doc.views, 0);
                const totalDownloads = userDocs.reduce((sum, doc) => sum + doc.downloads, 0);
                const publicDocs = userDocs.filter(doc => doc.is_public).length;
                const privateDocs = userDocs.filter(doc => !doc.is_public).length;
                
                setStats({
                    total: userDocs.length,
                    public: publicDocs,
                    private: privateDocs,
                    totalStars,
                    totalViews,
                    totalDownloads
                });
            }
        } catch (error) {
            console.error('Failed to load user documents:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    // Delete document
    const deleteDoc = useCallback(async (docId: string) => {
        if (!confirm('Are you sure you want to delete this document?')) {
            return;
        }

        try {
            const response = await fetch(`/claudemd/api/docs/${docId}`, {
                method: 'DELETE',
                credentials: 'include'
            });
            
            if (response.ok) {
                setDocs(prevDocs => prevDocs.filter(doc => doc.id !== docId));
            }
        } catch (error) {
            console.error('Failed to delete document:', error);
        }
    }, []);

    // Toggle document visibility
    const toggleVisibility = useCallback(async (docId: string, isPublic: boolean) => {
        try {
            const response = await fetch(`/claudemd/api/docs/${docId}/visibility`, {
                method: 'POST',
                credentials: 'include'
            });
            
            if (response.ok) {
                const result = await response.json();
                setDocs(prevDocs => 
                    prevDocs.map(d => 
                        d.id === docId 
                            ? { ...d, is_public: result.is_public }
                            : d
                    )
                );
            }
        } catch (error) {
            console.error('Failed to toggle visibility:', error);
        }
    }, []);

    useEffect(() => {
        loadUserDocs();
    }, [loadUserDocs]);

    return (
        <div className="min-h-screen bg-gray-100">
            {/* Header */}
            <div className="bg-white shadow-sm border-b">
                <div className="w-full px-4 py-4 sm:py-6 sm:px-6 lg:max-w-7xl lg:mx-auto">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div className="flex items-center space-x-3 sm:space-x-4">
                            <button
                                onClick={onBack}
                                className="text-gray-500 hover:text-gray-700 text-lg sm:text-xl flex items-center gap-1 hover:bg-gray-100 px-2 py-1 rounded transition-colors"
                            >
                                ← Back
                            </button>
                            <div className="min-w-0 flex-1">
                                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 truncate">@{username}'s Profile</h1>
                                <p className="text-gray-600 mt-1 text-sm sm:text-base">
                                    Manage your CLAUDE.md documents
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Stats */}
                    <div className="mt-4 sm:mt-6 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
                        <div className="bg-blue-50 rounded-lg p-3 sm:p-4 text-center">
                            <div className="text-xl sm:text-2xl font-bold text-blue-600">{stats.total}</div>
                            <div className="text-xs sm:text-sm text-blue-600">Total Docs</div>
                        </div>
                        <div className="bg-green-50 rounded-lg p-3 sm:p-4 text-center">
                            <div className="text-xl sm:text-2xl font-bold text-green-600">{stats.public}</div>
                            <div className="text-xs sm:text-sm text-green-600">Public</div>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-3 sm:p-4 text-center">
                            <div className="text-xl sm:text-2xl font-bold text-gray-600">{stats.private}</div>
                            <div className="text-xs sm:text-sm text-gray-600">Private</div>
                        </div>
                        <div className="bg-yellow-50 rounded-lg p-3 sm:p-4 text-center">
                            <div className="text-xl sm:text-2xl font-bold text-yellow-600">{stats.totalStars}</div>
                            <div className="text-xs sm:text-sm text-yellow-600">Stars</div>
                        </div>
                        <div className="bg-purple-50 rounded-lg p-3 sm:p-4 text-center">
                            <div className="text-xl sm:text-2xl font-bold text-purple-600">{stats.totalViews}</div>
                            <div className="text-xs sm:text-sm text-purple-600">Views</div>
                        </div>
                        <div className="bg-indigo-50 rounded-lg p-3 sm:p-4 text-center">
                            <div className="text-xl sm:text-2xl font-bold text-indigo-600">{stats.totalDownloads}</div>
                            <div className="text-xs sm:text-sm text-indigo-600">Downloads</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="w-full px-4 py-4 sm:py-6 sm:px-6 lg:max-w-7xl lg:mx-auto">
                {loading && (
                    <div className="flex items-center justify-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                )}

                {!loading && docs.length === 0 && (
                    <div className="text-center py-12">
                        <div className="text-6xl mb-4">📄</div>
                        <h3 className="text-xl font-medium text-gray-900 mb-2">
                            No documents yet
                        </h3>
                        <p className="text-gray-600">
                            Create your first CLAUDE.md document to get started!
                        </p>
                    </div>
                )}

                {!loading && docs.length > 0 && (
                    <div className="space-y-3 sm:space-y-4">
                        <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-3 sm:mb-4">
                            Your Documents ({docs.length})
                        </h2>
                        
                        {docs.map(doc => (
                            <div 
                                key={doc.id}
                                className="bg-white rounded-lg shadow-sm border p-4 sm:p-6"
                            >
                                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
                                            <h3 className="text-base sm:text-lg font-semibold text-gray-900 truncate">
                                                {doc.title}
                                            </h3>
                                            <span className={`px-2 py-1 rounded text-xs self-start sm:self-auto ${
                                                doc.is_public 
                                                    ? 'bg-green-100 text-green-700' 
                                                    : 'bg-gray-100 text-gray-700'
                                            }`}>
                                                {doc.is_public ? 'Public' : 'Private'}
                                            </span>
                                        </div>
                                        
                                        {doc.description && (
                                            <p className="text-gray-700 text-sm mb-3 line-clamp-2">
                                                {doc.description}
                                            </p>
                                        )}

                                        {/* Tags */}
                                        {doc.tag_names.length > 0 && (
                                            <div className="flex flex-wrap gap-1 mb-3">
                                                {doc.tag_names.slice(0, 4).map(tag => (
                                                    <span 
                                                        key={tag}
                                                        className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-xs"
                                                    >
                                                        {tag}
                                                    </span>
                                                ))}
                                                {doc.tag_names.length > 4 && (
                                                    <span className="text-gray-500 text-xs px-1">
                                                        +{doc.tag_names.length - 4}
                                                    </span>
                                                )}
                                            </div>
                                        )}

                                        {/* Stats */}
                                        <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs sm:text-sm text-gray-500">
                                            <span className="inline-flex items-center gap-1">
                                                <span>★</span> {doc.stars}
                                            </span>
                                            <span className="inline-flex items-center gap-1">
                                                <span>👁</span> {doc.views}
                                            </span>
                                            <span className="inline-flex items-center gap-1">
                                                <span>⬇</span> {doc.downloads}
                                            </span>
                                            <span className="hidden sm:inline">Created {new Date(doc.created_at).toLocaleDateString()}</span>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex flex-col sm:flex-row gap-2 sm:gap-1.5 sm:items-start">
                                        <button
                                            onClick={() => onEdit?.(doc.id)}
                                            className="bg-blue-500 text-white px-3 py-1.5 sm:py-1 rounded-lg text-xs sm:text-sm hover:bg-blue-600 transition-colors font-medium"
                                        >
                                            Edit
                                        </button>
                                        <button
                                            onClick={() => toggleVisibility(doc.id, doc.is_public)}
                                            className="bg-gray-500 text-white px-3 py-1.5 sm:py-1 rounded-lg text-xs sm:text-sm hover:bg-gray-600 transition-colors font-medium"
                                        >
                                            {doc.is_public ? 'Make Private' : 'Make Public'}
                                        </button>
                                        <button
                                            onClick={() => deleteDoc(doc.id)}
                                            className="bg-red-500 text-white px-3 py-1.5 sm:py-1 rounded-lg text-xs sm:text-sm hover:bg-red-600 transition-colors font-medium"
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default UserProfile;