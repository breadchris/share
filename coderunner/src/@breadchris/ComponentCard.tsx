import React, { useState, useRef, useEffect } from 'react';
import { ComponentInfo } from './ComponentRegistry';

interface ComponentCardProps {
    component: ComponentInfo;
    onClick?: (component: ComponentInfo) => void;
    size?: 'small' | 'medium' | 'large';
    showPreview?: boolean;
    className?: string;
}

export const ComponentCard: React.FC<ComponentCardProps> = ({
    component,
    onClick,
    size = 'medium',
    showPreview = true,
    className = ''
}) => {
    const [isHovered, setIsHovered] = useState(false);
    const [previewLoaded, setPreviewLoaded] = useState(false);
    const [previewError, setPreviewError] = useState(false);
    const [imageError, setImageError] = useState(false);
    const iframeRef = useRef<HTMLIFrameElement>(null);

    // Size configurations
    const sizeClasses = {
        small: 'w-24 h-24',
        medium: 'w-32 h-32',
        large: 'w-48 h-32'
    };

    const textSizeClasses = {
        small: 'text-xs',
        medium: 'text-sm', 
        large: 'text-base'
    };

    // Category-based colors (Nintendo Switch style)
    const getCategoryColor = (category: string) => {
        const colorMap: Record<string, string> = {
            'UI Library': 'from-green-500 to-green-600',
            'Core': 'from-blue-500 to-blue-600', 
            'AI Tools': 'from-purple-500 to-purple-600',
            'Social': 'from-pink-500 to-pink-600',
            'Development': 'from-orange-500 to-orange-600',
            'Forms': 'from-teal-500 to-teal-600',
            'Data Visualization': 'from-indigo-500 to-indigo-600',
            'Overlays': 'from-gray-500 to-gray-600',
            'Games': 'from-red-500 to-red-600',
            'Authentication': 'from-yellow-500 to-yellow-600',
            'Admin': 'from-cyan-500 to-cyan-600',
            'Utilities': 'from-slate-500 to-slate-600'
        };
        return colorMap[category] || 'from-gray-500 to-gray-600';
    };

    // Get icon based on category
    const getCategoryIcon = (category: string) => {
        const iconMap: Record<string, string> = {
            'UI Library': '🎨',
            'Core': '⚡',
            'AI Tools': '🤖',
            'Social': '👥',
            'Development': '💻',
            'Forms': '📝',
            'Data Visualization': '📊',
            'Overlays': '🪟',
            'Games': '🎮',
            'Authentication': '🔐',
            'Admin': '⚙️',
            'Utilities': '🔧'
        };
        return iconMap[category] || '📦';
    };

    const handleCardClick = () => {
        if (onClick) {
            onClick(component);
        } else {
            // Default action: open in new tab
            window.open(`/coderunner/render/${encodeURIComponent(component.path)}`, '_blank');
        }
    };

    const handlePreviewLoad = () => {
        setPreviewLoaded(true);
        setPreviewError(false);
    };

    const handlePreviewError = () => {
        setPreviewError(true);
        setPreviewLoaded(false);
    };

    // Generate preview image URL (placeholder for now)
    const getPreviewImageUrl = () => {
        // For now, we'll use a placeholder based on the component name
        // In the future, this could be actual screenshots
        return `https://via.placeholder.com/200x120/6366f1/ffffff?text=${encodeURIComponent(component.name)}`;
    };

    return (
        <div
            className={`
                group relative overflow-hidden rounded-xl cursor-pointer
                transform transition-all duration-200 ease-out
                hover:scale-105 hover:shadow-xl hover:shadow-black/20
                ${sizeClasses[size]}
                ${className}
                ${isHovered ? 'z-10' : 'z-0'}
            `}
            onClick={handleCardClick}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {/* Main Card Background */}
            <div className={`
                absolute inset-0 bg-gradient-to-br ${getCategoryColor(component.category)}
                transition-all duration-300
                ${isHovered ? 'opacity-90' : 'opacity-100'}
            `} />

            {/* Preview Content */}
            <div className="absolute inset-0 p-2 flex flex-col">
                {/* Header with icon and category */}
                <div className="flex items-center justify-between mb-1">
                    <span className="text-lg">{getCategoryIcon(component.category)}</span>
                    {component.isFeatured && (
                        <div className="bg-yellow-400 text-yellow-900 text-xs px-1.5 py-0.5 rounded-full font-bold">
                            ⭐
                        </div>
                    )}
                </div>

                {/* Component Preview */}
                {showPreview && size !== 'small' && (
                    <div className="flex-1 mb-2 relative">
                        {!imageError ? (
                            <img
                                src={getPreviewImageUrl()}
                                alt={`${component.name} preview`}
                                className="w-full h-full object-cover rounded-lg bg-white/20"
                                onError={() => setImageError(true)}
                            />
                        ) : (
                            <div className="w-full h-full rounded-lg bg-white/20 flex items-center justify-center">
                                <span className="text-white/60 text-xs">No Preview</span>
                            </div>
                        )}
                    </div>
                )}

                {/* Component Name */}
                <div className="mt-auto">
                    <h3 className={`
                        text-white font-semibold leading-tight truncate
                        ${textSizeClasses[size]}
                    `}>
                        {component.displayName}
                    </h3>
                    
                    {size !== 'small' && (
                        <p className="text-white/80 text-xs truncate">
                            by {component.author}
                        </p>
                    )}
                </div>
            </div>

            {/* Hover Overlay */}
            <div className={`
                absolute inset-0 bg-black/40 p-3 flex flex-col justify-end
                transition-opacity duration-200
                ${isHovered && size !== 'small' ? 'opacity-100' : 'opacity-0'}
            `}>
                <div className="text-white">
                    <h3 className="font-bold text-sm mb-1">{component.displayName}</h3>
                    {component.description && (
                        <p className="text-xs text-white/90 line-clamp-2 mb-2">
                            {component.description}
                        </p>
                    )}
                    
                    {/* Tags */}
                    <div className="flex flex-wrap gap-1 mb-2">
                        {component.tags.slice(0, 3).map((tag, index) => (
                            <span
                                key={index}
                                className="px-1.5 py-0.5 text-xs bg-white/20 rounded-full text-white/90"
                            >
                                {tag}
                            </span>
                        ))}
                        {component.tags.length > 3 && (
                            <span className="px-1.5 py-0.5 text-xs bg-white/20 rounded-full text-white/90">
                                +{component.tags.length - 3}
                            </span>
                        )}
                    </div>

                    {/* Last Modified */}
                    <p className="text-xs text-white/70">
                        Updated {new Date(component.lastModified).toLocaleDateString()}
                    </p>
                </div>
            </div>

            {/* Loading state for small cards */}
            {size === 'small' && isHovered && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                    <div className="text-white text-center">
                        <div className="text-xs font-medium">{component.displayName}</div>
                        <div className="text-xs opacity-80">{component.category}</div>
                    </div>
                </div>
            )}
        </div>
    );
};

// Special card for "All Software" button
interface AllSoftwareCardProps {
    onClick: () => void;
    componentCount: number;
    size?: 'small' | 'medium' | 'large';
}

export const AllSoftwareCard: React.FC<AllSoftwareCardProps> = ({ 
    onClick, 
    componentCount, 
    size = 'medium' 
}) => {
    const [isHovered, setIsHovered] = useState(false);

    const sizeClasses = {
        small: 'w-24 h-24',
        medium: 'w-32 h-32',
        large: 'w-48 h-32'
    };

    return (
        <div
            className={`
                group relative overflow-hidden rounded-xl cursor-pointer
                transform transition-all duration-200 ease-out
                hover:scale-105 hover:shadow-xl hover:shadow-black/20
                ${sizeClasses[size]}
                ${isHovered ? 'z-10' : 'z-0'}
            `}
            onClick={onClick}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {/* Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-slate-600 to-slate-700" />
            
            {/* Grid Pattern */}
            <div className="absolute inset-0 opacity-20">
                <div className="grid grid-cols-4 grid-rows-4 gap-1 p-2 h-full">
                    {Array.from({ length: 16 }).map((_, i) => (
                        <div key={i} className="bg-white rounded-sm" />
                    ))}
                </div>
            </div>

            {/* Content */}
            <div className="absolute inset-0 p-3 flex flex-col items-center justify-center text-white">
                <div className="text-2xl mb-2">📱</div>
                <h3 className="font-bold text-sm text-center mb-1">All Software</h3>
                <p className="text-xs text-white/80 text-center">
                    {componentCount} components
                </p>
            </div>

            {/* Hover Effect */}
            <div className={`
                absolute inset-0 bg-white/10
                transition-opacity duration-200
                ${isHovered ? 'opacity-100' : 'opacity-0'}
            `} />
        </div>
    );
};