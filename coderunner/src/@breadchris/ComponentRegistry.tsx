import React from 'react';

// Types for component metadata
export interface ComponentInfo {
    name: string;
    path: string;
    displayName: string;
    description?: string;
    tags: string[];
    category: string;
    size: number;
    lastModified: string;
    hasExport: boolean;
    exportedComponents: string[];
    author?: string;
    isFeatured?: boolean;
    previewUrl?: string;
}

export interface FileItem {
    name: string;
    path: string;
    isDir: boolean;
    size: number;
    lastModified: string;
}

// Component Registry Service
export class ComponentRegistry {
    private static instance: ComponentRegistry;
    private components: ComponentInfo[] = [];
    private isLoaded = false;
    private loadingPromise: Promise<ComponentInfo[]> | null = null;

    static getInstance(): ComponentRegistry {
        if (!ComponentRegistry.instance) {
            ComponentRegistry.instance = new ComponentRegistry();
        }
        return ComponentRegistry.instance;
    }

    async getAllComponents(): Promise<ComponentInfo[]> {
        if (this.isLoaded) {
            return this.components;
        }

        if (this.loadingPromise) {
            return this.loadingPromise;
        }

        this.loadingPromise = this.loadComponentsFromFileSystem();
        return this.loadingPromise;
    }

    private async loadComponentsFromFileSystem(): Promise<ComponentInfo[]> {
        try {
            const response = await fetch('/coderunner/api/files');
            if (!response.ok) {
                throw new Error('Failed to load files');
            }

            const files: FileItem[] = await response.json();
            const componentFiles = files.filter(file => 
                !file.isDir && 
                (file.path.endsWith('.tsx') || file.path.endsWith('.jsx'))
            );

            const componentsData: ComponentInfo[] = [];

            for (const file of componentFiles) {
                try {
                    const content = await this.loadFileContent(file.path);
                    const metadata = this.analyzeComponent(file, content);
                    if (metadata) {
                        componentsData.push(metadata);
                    }
                } catch (error) {
                    console.error(`Error loading component ${file.path}:`, error);
                }
            }

            this.components = componentsData;
            this.isLoaded = true;
            return componentsData;
        } catch (error) {
            console.error('Failed to load components:', error);
            return [];
        }
    }

    private async loadFileContent(path: string): Promise<string> {
        const response = await fetch(`/coderunner/api/files/${encodeURIComponent(path)}`);
        if (!response.ok) {
            throw new Error(`Failed to load file: ${path}`);
        }
        return response.text();
    }

    private analyzeComponent(file: FileItem, content: string): ComponentInfo | null {
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

        // Extract description from JSDoc comments
        const descriptionMatch = content.match(/\/\*\*\s*\n\s*\*\s*(.+?)\s*\n/);
        const description = descriptionMatch ? descriptionMatch[1] : undefined;

        // Extract tags from comments and infer from content
        const tags: string[] = [];
        if (content.includes('useState')) tags.push('stateful');
        if (content.includes('useEffect')) tags.push('effects');
        if (content.includes('React.FC')) tags.push('functional');
        if (content.includes('interface')) tags.push('typescript');
        if (content.includes('className') || content.includes('tailwind')) tags.push('styled');
        if (content.includes('form') || content.includes('input')) tags.push('forms');
        if (content.includes('chart') || content.includes('graph')) tags.push('data-viz');
        if (content.includes('modal') || content.includes('dialog')) tags.push('overlay');
        if (content.includes('button') || content.includes('click')) tags.push('interactive');

        // Determine category based on path and content
        const category = this.determineCategory(file.path, content, tags);

        // Determine author from path
        const author = this.extractAuthor(file.path);

        // Check if component should be featured
        const isFeatured = this.isFeaturedComponent(file.path, baseName);

        return {
            name: baseName,
            path: file.path,
            displayName: this.generateDisplayName(baseName),
            description,
            tags,
            category,
            size: file.size,
            lastModified: file.lastModified,
            hasExport: exportedComponents.length > 0,
            exportedComponents,
            author,
            isFeatured,
            previewUrl: `/coderunner/render/${encodeURIComponent(file.path)}`
        };
    }

    private determineCategory(path: string, content: string, tags: string[]): string {
        // Category based on path structure
        if (path.includes('@daisyui/')) return 'UI Library';
        if (path.includes('@breadchris/')) return 'Core';
        if (path.includes('claude/')) return 'AI Tools';
        if (path.includes('justshare/')) return 'Social';
        if (path.includes('editor/')) return 'Development';
        
        // Category based on content analysis
        if (tags.includes('forms')) return 'Forms';
        if (tags.includes('data-viz')) return 'Data Visualization';
        if (tags.includes('overlay')) return 'Overlays';
        if (content.includes('game') || content.includes('Game')) return 'Games';
        if (content.includes('auth') || content.includes('login')) return 'Authentication';
        if (content.includes('dashboard') || content.includes('admin')) return 'Admin';
        
        return 'Utilities';
    }

    private extractAuthor(path: string): string {
        const authorMatch = path.match(/@([^/]+)/);
        return authorMatch ? authorMatch[1] : 'unknown';
    }

    private isFeaturedComponent(path: string, name: string): boolean {
        // Mark certain components as featured
        const featuredPatterns = [
            'ComponentBrowser',
            'ClaudeInterface',
            'JustShare',
            'Homepage',
            'Dashboard'
        ];
        
        return featuredPatterns.some(pattern => 
            name.toLowerCase().includes(pattern.toLowerCase())
        );
    }

    private generateDisplayName(name: string): string {
        // Convert camelCase/PascalCase to readable format
        return name
            .replace(/([A-Z])/g, ' $1')
            .replace(/^./, str => str.toUpperCase())
            .trim();
    }

    // Utility methods for filtering and sorting
    getFeaturedComponents(): ComponentInfo[] {
        return this.components.filter(comp => comp.isFeatured);
    }

    getComponentsByCategory(category: string): ComponentInfo[] {
        return this.components.filter(comp => comp.category === category);
    }

    getComponentsByAuthor(author: string): ComponentInfo[] {
        return this.components.filter(comp => comp.author === author);
    }

    searchComponents(query: string): ComponentInfo[] {
        const lowercaseQuery = query.toLowerCase();
        return this.components.filter(comp => 
            comp.name.toLowerCase().includes(lowercaseQuery) ||
            comp.displayName.toLowerCase().includes(lowercaseQuery) ||
            comp.description?.toLowerCase().includes(lowercaseQuery) ||
            comp.tags.some(tag => tag.toLowerCase().includes(lowercaseQuery)) ||
            comp.category.toLowerCase().includes(lowercaseQuery)
        );
    }

    getRecentComponents(limit = 10): ComponentInfo[] {
        return [...this.components]
            .sort((a, b) => new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime())
            .slice(0, limit);
    }

    getCategories(): string[] {
        const categories = new Set(this.components.map(comp => comp.category));
        return Array.from(categories).sort();
    }

    refreshComponents(): Promise<ComponentInfo[]> {
        this.isLoaded = false;
        this.loadingPromise = null;
        this.components = [];
        return this.getAllComponents();
    }
}

// React Hook for using ComponentRegistry
export const useComponentRegistry = () => {
    const [components, setComponents] = React.useState<ComponentInfo[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState<string | null>(null);

    const registry = React.useMemo(() => ComponentRegistry.getInstance(), []);

    const loadComponents = React.useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const componentData = await registry.getAllComponents();
            setComponents(componentData);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load components');
        } finally {
            setLoading(false);
        }
    }, [registry]);

    React.useEffect(() => {
        loadComponents();
    }, [loadComponents]);

    const refreshComponents = React.useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const componentData = await registry.refreshComponents();
            setComponents(componentData);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to refresh components');
        } finally {
            setLoading(false);
        }
    }, [registry]);

    return {
        components,
        loading,
        error,
        registry,
        refreshComponents,
        getFeaturedComponents: () => registry.getFeaturedComponents(),
        getComponentsByCategory: (category: string) => registry.getComponentsByCategory(category),
        searchComponents: (query: string) => registry.searchComponents(query),
        getRecentComponents: (limit?: number) => registry.getRecentComponents(limit),
        getCategories: () => registry.getCategories()
    };
};