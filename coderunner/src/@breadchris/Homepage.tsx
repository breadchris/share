import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
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
    const [focusedIndex, setFocusedIndex] = useState(0);
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    
    // Touch gesture state
    const [touchStart, setTouchStart] = useState<number | null>(null);
    const [touchEnd, setTouchEnd] = useState<number | null>(null);
    
    // Pinned components state
    const [pinnedFiles, setPinnedFiles] = useState<Set<string>>(new Set());
    const [loadingPinned, setLoadingPinned] = useState(false);

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

    // Load pinned files from API
    const loadPinnedFiles = useCallback(async () => {
        setLoadingPinned(true);
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
            setLoadingPinned(false);
        }
    }, []);

    // Load pinned files on mount
    useEffect(() => {
        loadPinnedFiles();
    }, [loadPinnedFiles]);

    // Get components to display
    const displayComponents = useMemo(() => {
        let componentsToShow: ComponentInfo[];
        
        if (searchQuery.trim()) {
            componentsToShow = searchComponents(searchQuery);
        } else {
            // Prioritize pinned components first, then featured, then recent
            const allComponents = components;
            const pinned = allComponents.filter(comp => pinnedFiles.has(comp.path));
            const featured = getFeaturedComponents().filter(comp => !pinnedFiles.has(comp.path));
            const recent = getRecentComponents(15).filter(comp => !pinnedFiles.has(comp.path));
            
            // Combine: pinned first, then featured, then recent
            const seen = new Set<string>();
            componentsToShow = [];
            
            // Add pinned components first
            pinned.forEach(comp => {
                if (!seen.has(comp.path)) {
                    seen.add(comp.path);
                    componentsToShow.push(comp);
                }
            });
            
            // Add featured components (not already pinned)
            featured.forEach(comp => {
                if (!seen.has(comp.path)) {
                    seen.add(comp.path);
                    componentsToShow.push(comp);
                }
            });
            
            // Add recent components (not already pinned or featured)
            recent.forEach(comp => {
                if (!seen.has(comp.path)) {
                    seen.add(comp.path);
                    componentsToShow.push(comp);
                }
            });
        }
        
        return componentsToShow;
    }, [components, searchQuery, pinnedFiles, getFeaturedComponents, getRecentComponents, searchComponents]);

    // Split components into main grid (first 7) and overflow - Nintendo Switch style
    const mainGridComponents = displayComponents.slice(0, 7);
    const hasOverflow = displayComponents.length > 7;
    const overflowCount = displayComponents.length - 7;
    
    // Include All Software card in the total items for navigation
    const allItems = hasOverflow ? [...mainGridComponents, { isAllSoftware: true }] : mainGridComponents;
    
    // Scroll to focused item
    const scrollToFocused = useCallback((index: number) => {
        if (scrollContainerRef.current) {
            const container = scrollContainerRef.current;
            const itemWidth = 264; // Card width (224px) + gap (24px) + padding
            const containerWidth = container.clientWidth;
            const scrollLeft = Math.max(0, (index * itemWidth) - (containerWidth / 2) + (itemWidth / 2));
            
            container.scrollTo({
                left: scrollLeft,
                behavior: 'smooth'
            });
        }
    }, []);
    
    // Keyboard navigation
    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        if (e.key === 'ArrowLeft' && focusedIndex > 0) {
            const newIndex = focusedIndex - 1;
            setFocusedIndex(newIndex);
            scrollToFocused(newIndex);
        } else if (e.key === 'ArrowRight' && focusedIndex < allItems.length - 1) {
            const newIndex = focusedIndex + 1;
            setFocusedIndex(newIndex);
            scrollToFocused(newIndex);
        } else if (e.key === 'Enter') {
            const focusedItem = allItems[focusedIndex];
            if (focusedItem && !('isAllSoftware' in focusedItem)) {
                onComponentSelect?.(focusedItem as ComponentInfo);
            } else if (focusedItem && 'isAllSoftware' in focusedItem) {
                handleAllSoftwareClick();
            }
        }
    }, [focusedIndex, allItems, scrollToFocused, onComponentSelect]);
    
    // Mouse wheel support for horizontal scrolling
    const handleWheel = useCallback((e: WheelEvent) => {
        if (scrollContainerRef.current && allItems.length > 1) {
            e.preventDefault();
            
            // Determine scroll direction
            const deltaY = e.deltaY;
            const scrollSpeed = 2; // Multiplier for scroll sensitivity
            
            if (deltaY > 0 && focusedIndex < allItems.length - 1) {
                // Scroll right (next item)
                const newIndex = focusedIndex + 1;
                setFocusedIndex(newIndex);
                scrollToFocused(newIndex);
            } else if (deltaY < 0 && focusedIndex > 0) {
                // Scroll left (previous item)
                const newIndex = focusedIndex - 1;
                setFocusedIndex(newIndex);
                scrollToFocused(newIndex);
            }
        }
    }, [focusedIndex, allItems.length, scrollToFocused]);

    // Touch gesture handlers
    const handleTouchStart = useCallback((e: TouchEvent) => {
        setTouchEnd(null);
        setTouchStart(e.targetTouches[0].clientX);
    }, []);

    const handleTouchMove = useCallback((e: TouchEvent) => {
        setTouchEnd(e.targetTouches[0].clientX);
    }, []);

    const handleTouchEnd = useCallback(() => {
        if (!touchStart || !touchEnd) return;
        
        const distance = touchStart - touchEnd;
        const isLeftSwipe = distance > 50; // Minimum swipe distance
        const isRightSwipe = distance < -50;
        
        if (isLeftSwipe && focusedIndex < allItems.length - 1) {
            // Swipe left = next item
            const newIndex = focusedIndex + 1;
            setFocusedIndex(newIndex);
            scrollToFocused(newIndex);
        } else if (isRightSwipe && focusedIndex > 0) {
            // Swipe right = previous item
            const newIndex = focusedIndex - 1;
            setFocusedIndex(newIndex);
            scrollToFocused(newIndex);
        }
        
        // Reset touch state
        setTouchStart(null);
        setTouchEnd(null);
    }, [touchStart, touchEnd, focusedIndex, allItems.length, scrollToFocused]);

    // Add keyboard and mouse wheel event listeners
    useEffect(() => {
        window.addEventListener('keydown', handleKeyDown);
        
        // Add wheel and touch listeners to the scroll container
        const container = scrollContainerRef.current;
        if (container) {
            container.addEventListener('wheel', handleWheel, { passive: false });
            container.addEventListener('touchstart', handleTouchStart, { passive: true });
            container.addEventListener('touchmove', handleTouchMove, { passive: true });
            container.addEventListener('touchend', handleTouchEnd, { passive: true });
        }
        
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            if (container) {
                container.removeEventListener('wheel', handleWheel);
                container.removeEventListener('touchstart', handleTouchStart);
                container.removeEventListener('touchmove', handleTouchMove);
                container.removeEventListener('touchend', handleTouchEnd);
            }
        };
    }, [handleKeyDown, handleWheel, handleTouchStart, handleTouchMove, handleTouchEnd]);
    
    // Reset focus when components change
    useEffect(() => {
        setFocusedIndex(0);
    }, [displayComponents]);

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
            {/* Custom scrollbar hiding styles */}
            <style jsx>{`
                .scrollbar-hide {
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                }
                .scrollbar-hide::-webkit-scrollbar {
                    display: none;
                }
            `}</style>
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

                {/* Horizontal Scrolling App Row - Nintendo Switch Style */}
                <div className="relative">
                    <div 
                        ref={scrollContainerRef}
                        className="flex gap-6 overflow-x-auto scrollbar-hide px-8 py-4"
                        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                    >
                        {/* Main Components */}
                        {mainGridComponents.map((component, index) => (
                            <div 
                                key={component.path}
                                className={`flex-shrink-0 transition-all duration-300 cursor-pointer ${
                                    focusedIndex === index 
                                        ? 'scale-110 z-10' 
                                        : 'scale-90 opacity-70 hover:scale-95 hover:opacity-85'
                                }`}
                                onClick={() => {
                                    setFocusedIndex(index);
                                    onComponentSelect?.(component);
                                }}
                                onMouseEnter={() => setFocusedIndex(index)}
                            >
                                <ComponentCard
                                    component={component}
                                    onClick={onComponentSelect}
                                    size="medium"
                                    showPreview={true}
                                    isPinned={pinnedFiles.has(component.path)}
                                />
                            </div>
                        ))}
                        
                        {/* All Software Card */}
                        {hasOverflow && (
                            <div 
                                className={`flex-shrink-0 transition-all duration-300 cursor-pointer ${
                                    focusedIndex === mainGridComponents.length 
                                        ? 'scale-110 z-10' 
                                        : 'scale-90 opacity-70 hover:scale-95 hover:opacity-85'
                                }`}
                                onClick={() => {
                                    setFocusedIndex(mainGridComponents.length);
                                    handleAllSoftwareClick();
                                }}
                                onMouseEnter={() => setFocusedIndex(mainGridComponents.length)}
                            >
                                <AllSoftwareCard
                                    onClick={handleAllSoftwareClick}
                                    componentCount={displayComponents.length}
                                    size="medium"
                                />
                            </div>
                        )}
                    </div>
                    
                    {/* Navigation Indicators */}
                    {allItems.length > 1 && (
                        <div className="flex justify-center mt-4 space-x-2">
                            {allItems.map((_, index) => (
                                <button
                                    key={index}
                                    className={`w-2 h-2 rounded-full transition-colors ${
                                        focusedIndex === index ? 'bg-white' : 'bg-white/30'
                                    }`}
                                    onClick={() => {
                                        setFocusedIndex(index);
                                        scrollToFocused(index);
                                    }}
                                />
                            ))}
                        </div>
                    )}
                </div>

                {/* Secondary Icon Shelf - Nintendo Switch Style */}
                <div className="mt-8 px-8">
                    <div className="flex justify-center gap-8">
                        {/* System Icons */}
                        <button 
                            className="flex flex-col items-center gap-2 p-3 rounded-lg hover:bg-white/10 transition-colors group"
                            onClick={() => window.location.href = '/coderunner/browse'}
                        >
                            <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center text-2xl group-hover:bg-white/30 transition-colors">
                                📁
                            </div>
                            <span className="text-white/70 text-xs">Browse</span>
                        </button>
                        
                        <button 
                            className="flex flex-col items-center gap-2 p-3 rounded-lg hover:bg-white/10 transition-colors group"
                            onClick={() => window.location.href = '/coderunner/editor'}
                        >
                            <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center text-2xl group-hover:bg-white/30 transition-colors">
                                ⚙️
                            </div>
                            <span className="text-white/70 text-xs">Editor</span>
                        </button>
                        
                        <button 
                            className="flex flex-col items-center gap-2 p-3 rounded-lg hover:bg-white/10 transition-colors group"
                            onClick={refreshComponents}
                        >
                            <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center text-2xl group-hover:bg-white/30 transition-colors">
                                🔄
                            </div>
                            <span className="text-white/70 text-xs">Refresh</span>
                        </button>
                        
                        <button 
                            className="flex flex-col items-center gap-2 p-3 rounded-lg hover:bg-white/10 transition-colors group"
                            onClick={() => window.location.href = '/account'}
                        >
                            <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center text-2xl group-hover:bg-white/30 transition-colors">
                                👤
                            </div>
                            <span className="text-white/70 text-xs">Account</span>
                        </button>
                        
                        <button 
                            className="flex flex-col items-center gap-2 p-3 rounded-lg hover:bg-white/10 transition-colors group"
                            onClick={() => window.location.href = '/justshare'}
                        >
                            <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center text-2xl group-hover:bg-white/30 transition-colors">
                                📸
                            </div>
                            <span className="text-white/70 text-xs">Album</span>
                        </button>
                    </div>
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
                        {mainGridComponents.length} shown{hasOverflow ? ` • ${overflowCount} more in All Software` : ''} • 
                        Last updated {new Date().toLocaleTimeString()}
                    </p>
                </div>
            </main>
        </div>
    );
};

export default Homepage;