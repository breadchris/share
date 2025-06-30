import React, { useState, useMemo } from 'react';
import { useComponentRegistry, ComponentInfo } from './ComponentRegistry';
import { ComponentCard } from './ComponentCard';

interface AllSoftwareViewProps {
    onComponentSelect?: (component: ComponentInfo) => void;
    onBack?: () => void;
}

type SortOption = 'name' | 'category' | 'lastModified' | 'author';
type FilterOption = 'all' | string; // 'all' or specific category

export const AllSoftwareView: React.FC<AllSoftwareViewProps> = ({
    onComponentSelect,
    onBack
}) => {
    const {
        components,
        loading,
        error,
        getCategories,
        searchComponents,
        getComponentsByCategory,
        refreshComponents
    } = useComponentRegistry();

    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState<SortOption>('lastModified');
    const [filterBy, setFilterBy] = useState<FilterOption>('all');
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

    // Get available categories
    const categories = useMemo(() => getCategories(), [getCategories]);

    // Filter and sort components
    const filteredAndSortedComponents = useMemo(() => {
        let filteredComponents: ComponentInfo[];

        // Apply search filter
        if (searchQuery.trim()) {
            filteredComponents = searchComponents(searchQuery);
        } else if (filterBy === 'all') {
            filteredComponents = components;
        } else {
            filteredComponents = getComponentsByCategory(filterBy);
        }

        // Apply sorting
        const sortedComponents = [...filteredComponents].sort((a, b) => {
            switch (sortBy) {
                case 'name':
                    return a.displayName.localeCompare(b.displayName);
                case 'category':
                    return a.category.localeCompare(b.category) || a.displayName.localeCompare(b.displayName);
                case 'author':
                    return (a.author || '').localeCompare(b.author || '') || a.displayName.localeCompare(b.displayName);
                case 'lastModified':
                default:
                    return new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime();
            }
        });

        return sortedComponents;
    }, [components, searchQuery, filterBy, sortBy, searchComponents, getComponentsByCategory]);

    // Group components by category for display
    const groupedComponents = useMemo(() => {
        if (sortBy === 'category' && !searchQuery) {
            const groups: Record<string, ComponentInfo[]> = {};
            filteredAndSortedComponents.forEach(component => {
                if (!groups[component.category]) {
                    groups[component.category] = [];
                }
                groups[component.category].push(component);
            });
            return groups;
        }
        return null;
    }, [filteredAndSortedComponents, sortBy, searchQuery]);

    const handleBack = () => {
        if (onBack) {
            onBack();
        } else {
            window.history.back();
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
                <div className="text-white text-center">
                    <div className="animate-spin w-12 h-12 border-4 border-white border-t-transparent rounded-full mx-auto mb-4"></div>
                    <p className="text-lg">Loading all software...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-red-900 to-slate-900 flex items-center justify-center">
                <div className="text-white text-center max-w-md">
                    <div className="text-6xl mb-4">❌</div>
                    <h2 className="text-2xl font-bold mb-2">Error Loading Software</h2>
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
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
            {/* Header */}
            <header className="relative z-10 p-6 border-b border-white/10">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={handleBack}
                            className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
                        >
                            <span>←</span>
                            Back
                        </button>
                        <div>
                            <h1 className="text-3xl font-bold text-white">📱 All Software</h1>
                            <p className="text-white/70">
                                {filteredAndSortedComponents.length} of {components.length} components
                            </p>
                        </div>
                    </div>

                    {/* View Mode Toggle */}
                    <div className="flex items-center gap-2 bg-white/10 rounded-lg p-1">
                        <button
                            onClick={() => setViewMode('grid')}
                            className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                                viewMode === 'grid'
                                    ? 'bg-white/20 text-white'
                                    : 'text-white/70 hover:text-white'
                            }`}
                        >
                            Grid
                        </button>
                        <button
                            onClick={() => setViewMode('list')}
                            className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                                viewMode === 'list'
                                    ? 'bg-white/20 text-white'
                                    : 'text-white/70 hover:text-white'
                            }`}
                        >
                            List
                        </button>
                    </div>
                </div>
            </header>

            {/* Controls */}
            <div className="relative z-10 p-6 border-b border-white/10">
                <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                    {/* Search */}
                    <div className="flex-1 max-w-md">
                        <input
                            type="text"
                            placeholder="Search components..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full px-4 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-white/40 focus:bg-white/15 transition-all"
                        />
                    </div>

                    <div className="flex gap-4">
                        {/* Category Filter */}
                        <select
                            value={filterBy}
                            onChange={(e) => setFilterBy(e.target.value)}
                            className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-white/40"
                        >
                            <option value="all" className="bg-slate-800">All Categories</option>
                            {categories.map((category) => (
                                <option key={category} value={category} className="bg-slate-800">
                                    {category}
                                </option>
                            ))}
                        </select>

                        {/* Sort Options */}
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value as SortOption)}
                            className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-white/40"
                        >
                            <option value="lastModified" className="bg-slate-800">By Time Last Played</option>
                            <option value="name" className="bg-slate-800">By Name</option>
                            <option value="category" className="bg-slate-800">By Category</option>
                            <option value="author" className="bg-slate-800">By Author</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Content */}
            <main className="relative z-10 p-6">
                {filteredAndSortedComponents.length === 0 ? (
                    <div className="text-center text-white py-16">
                        <div className="text-6xl mb-4">📦</div>
                        <h3 className="text-2xl font-bold mb-2">No components found</h3>
                        <p className="text-white/70 mb-6">
                            {searchQuery
                                ? `No components match "${searchQuery}"`
                                : filterBy !== 'all'
                                ? `No components in "${filterBy}" category`
                                : 'No components available'
                            }
                        </p>
                        <button
                            onClick={() => {
                                setSearchQuery('');
                                setFilterBy('all');
                            }}
                            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                        >
                            Clear Filters
                        </button>
                    </div>
                ) : groupedComponents ? (
                    /* Grouped by Category */
                    <div className="space-y-8">
                        {Object.entries(groupedComponents).map(([category, categoryComponents]) => (
                            <div key={category}>
                                <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
                                    <span className="w-1 h-8 bg-blue-500 rounded-full"></span>
                                    {category}
                                    <span className="text-sm font-normal text-white/70">
                                        ({categoryComponents.length})
                                    </span>
                                </h2>
                                <div className={
                                    viewMode === 'grid'
                                        ? 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4'
                                        : 'space-y-2'
                                }>
                                    {categoryComponents.map((component) => (
                                        <ComponentCard
                                            key={component.path}
                                            component={component}
                                            onClick={onComponentSelect}
                                            size={viewMode === 'grid' ? 'small' : 'medium'}
                                            showPreview={viewMode === 'grid'}
                                        />
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    /* Regular List/Grid */
                    <div className={
                        viewMode === 'grid'
                            ? 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4'
                            : 'space-y-2'
                    }>
                        {filteredAndSortedComponents.map((component) => (
                            <ComponentCard
                                key={component.path}
                                component={component}
                                onClick={onComponentSelect}
                                size={viewMode === 'grid' ? 'small' : 'medium'}
                                showPreview={viewMode === 'grid'}
                            />
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
};

export default AllSoftwareView;