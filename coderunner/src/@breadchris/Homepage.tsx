import React, { useState, useEffect, useMemo } from 'react';
import { useComponentRegistry, ComponentInfo } from './ComponentRegistry';
import { ComponentCard, AllSoftwareCard } from './ComponentCard';

interface HomepageProps {
    onComponentSelect?: (component: ComponentInfo) => void;
    onAllSoftwareClick?: () => void;
    onCreateNew?: () => void;
}

export const Homepage: React.FC<HomepageProps> = ({
    onComponentSelect,
    onAllSoftwareClick,
    onCreateNew
}) => {
    const {
        components,
        loading,
        error,
        getFeaturedComponents,
        getRecentComponents,
        searchComponents,
        refreshComponents
    } = useComponentRegistry();

    const [searchQuery, setSearchQuery] = useState('');
    const [currentTime, setCurrentTime] = useState(new Date());
    const [username, setUsername] = useState('User');

    // Update time every minute
    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 60000);
        return () => clearInterval(timer);
    }, []);

    // Load user info
    useEffect(() => {
        const loadUserInfo = async () => {
            try {
                const response = await fetch('/coderunner/user', {
                    credentials: 'include'
                });
                if (response.ok) {
                    const userData = await response.json();
                    if (userData.username) {
                        setUsername(userData.username);
                    }
                }
            } catch (error) {
                console.error('Failed to load user info:', error);
            }
        };
        loadUserInfo();
    }, []);

    // Get components to display
    const displayComponents = useMemo(() => {
        let componentsToShow: ComponentInfo[];
        
        if (searchQuery.trim()) {
            componentsToShow = searchComponents(searchQuery);
        } else {
            // Show featured components first, then recent ones
            const featured = getFeaturedComponents();
            const recent = getRecentComponents(15);
            
            // Combine and deduplicate
            const seen = new Set<string>();
            componentsToShow = [];
            
            [...featured, ...recent].forEach(comp => {
                if (!seen.has(comp.path)) {
                    seen.add(comp.path);
                    componentsToShow.push(comp);
                }
            });
        }
        
        return componentsToShow;
    }, [components, searchQuery, getFeaturedComponents, getRecentComponents, searchComponents]);

    // Split components into main grid (first 10) and overflow
    const mainGridComponents = displayComponents.slice(0, 10);
    const hasOverflow = displayComponents.length > 10;
    const overflowCount = displayComponents.length - 10;

    const handleAllSoftwareClick = () => {
        if (onAllSoftwareClick) {
            onAllSoftwareClick();
        } else {
            // Default behavior: navigate to component browser
            window.location.href = '/coderunner/browse';
        }
    };

    const handleCreateNewClick = () => {
        if (onCreateNew) {
            onCreateNew();
        } else {
            // Default behavior: navigate to editor
            window.location.href = '/coderunner/editor';
        }
    };

    const formatTime = (date: Date) => {
        return date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        });
    };

    const formatDate = (date: Date) => {
        return date.toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'long',
            day: 'numeric'
        });
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
                <div className="text-white text-center">
                    <div className="animate-spin w-12 h-12 border-4 border-white border-t-transparent rounded-full mx-auto mb-4"></div>
                    <p className="text-lg">Loading components...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-red-900 to-slate-900 flex items-center justify-center">
                <div className="text-white text-center max-w-md">
                    <div className="text-6xl mb-4">❌</div>
                    <h2 className="text-2xl font-bold mb-2">Error Loading Components</h2>
                    <p className="text-red-200 mb-6">{error}</p>
                    <button
                        onClick={refreshComponents}
                        className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
                    >
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 relative overflow-hidden">
            {/* Background Circles */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-20 left-20 w-64 h-64 bg-blue-500/10 rounded-full blur-xl"></div>
                <div className="absolute top-40 right-32 w-96 h-96 bg-purple-500/10 rounded-full blur-xl"></div>
                <div className="absolute bottom-32 left-1/3 w-80 h-80 bg-cyan-500/10 rounded-full blur-xl"></div>
            </div>

            {/* Header */}
            <header className="relative z-10 p-8 flex items-center justify-between">
                <div>
                    <h1 className="text-4xl font-bold text-white mb-2">Start</h1>
                    <p className="text-white/70">Welcome back, {username}</p>
                </div>
                
                <div className="text-right text-white">
                    <div className="text-2xl font-bold">{formatTime(currentTime)}</div>
                    <div className="text-sm text-white/70">{formatDate(currentTime)}</div>
                </div>
            </header>

            {/* Search Bar */}
            <div className="relative z-10 px-8 mb-8">
                <div className="max-w-md">
                    <input
                        type="text"
                        placeholder="Search components..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:border-white/40 focus:bg-white/15 transition-all"
                    />
                </div>
            </div>

            {/* Main Content */}
            <main className="relative z-10 px-8 pb-8">
                {/* Quick Actions */}
                <div className="mb-8">
                    <div className="flex gap-4 flex-wrap">
                        <button
                            onClick={handleCreateNewClick}
                            className="flex items-center gap-3 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-medium transition-all transform hover:scale-105"
                        >
                            <span className="text-xl">➕</span>
                            Create New
                        </button>
                        
                        <button
                            onClick={() => window.location.href = '/coderunner/browse'}
                            className="flex items-center gap-3 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-all transform hover:scale-105"
                        >
                            <span className="text-xl">📁</span>
                            Browse All
                        </button>
                        
                        <button
                            onClick={refreshComponents}
                            className="flex items-center gap-3 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-medium transition-all transform hover:scale-105"
                        >
                            <span className="text-xl">🔄</span>
                            Refresh
                        </button>
                    </div>
                </div>

                {/* Component Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 auto-rows-max">
                    {/* Main Components */}
                    {mainGridComponents.map((component, index) => (
                        <ComponentCard
                            key={component.path}
                            component={component}
                            onClick={onComponentSelect}
                            size={index < 3 ? 'large' : 'medium'}
                            showPreview={true}
                            className={`
                                ${index === 0 ? 'col-span-2 row-span-2' : ''}
                                ${index === 1 || index === 2 ? 'col-span-1 row-span-2' : ''}
                            `}
                        />
                    ))}
                    
                    {/* All Software Card */}
                    {hasOverflow && (
                        <AllSoftwareCard
                            onClick={handleAllSoftwareClick}
                            componentCount={displayComponents.length}
                            size="medium"
                        />
                    )}
                </div>

                {/* No Components Message */}
                {displayComponents.length === 0 && !loading && (
                    <div className="text-center text-white py-16">
                        <div className="text-6xl mb-4">📦</div>
                        <h3 className="text-2xl font-bold mb-2">
                            {searchQuery ? 'No components found' : 'No components available'}
                        </h3>
                        <p className="text-white/70 mb-6">
                            {searchQuery 
                                ? `No components match "${searchQuery}"`
                                : 'Get started by creating your first component'
                            }
                        </p>
                        {searchQuery ? (
                            <button
                                onClick={() => setSearchQuery('')}
                                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                            >
                                Clear Search
                            </button>
                        ) : (
                            <button
                                onClick={handleCreateNewClick}
                                className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
                            >
                                Create Component
                            </button>
                        )}
                    </div>
                )}

                {/* Stats Footer */}
                <div className="mt-12 text-center text-white/50 text-sm">
                    <p>
                        {components.length} components available • 
                        {mainGridComponents.length} shown • 
                        Last updated {new Date().toLocaleTimeString()}
                    </p>
                </div>
            </main>
        </div>
    );
};

export default Homepage;