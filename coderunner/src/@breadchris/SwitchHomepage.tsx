import React, { useState } from 'react';
import { ComponentInfo } from './ComponentRegistry';
import Homepage from './Homepage';
import AllSoftwareView from './AllSoftwareView';

type ViewMode = 'homepage' | 'all-software' | 'component-detail';

interface SwitchHomepageProps {
    initialView?: ViewMode;
    onNavigate?: (view: ViewMode, data?: any) => void;
}

export const SwitchHomepage: React.FC<SwitchHomepageProps> = ({
    initialView = 'homepage',
    onNavigate
}) => {
    const [currentView, setCurrentView] = useState<ViewMode>(initialView);
    const [selectedComponent, setSelectedComponent] = useState<ComponentInfo | null>(null);

    const handleViewChange = (view: ViewMode, data?: any) => {
        setCurrentView(view);
        if (view === 'component-detail' && data) {
            setSelectedComponent(data);
        }
        if (onNavigate) {
            onNavigate(view, data);
        }
    };

    const handleComponentSelect = (component: ComponentInfo) => {
        // Open component in new tab/window
        window.open(`/coderunner/render/${encodeURIComponent(component.path)}`, '_blank');
    };

    const handleAllSoftwareClick = () => {
        handleViewChange('all-software');
    };

    const handleBackToHomepage = () => {
        handleViewChange('homepage');
    };

    const handleCreateNew = () => {
        // Navigate to editor
        window.location.href = '/coderunner/editor';
    };

    switch (currentView) {
        case 'all-software':
            return (
                <AllSoftwareView
                    onComponentSelect={handleComponentSelect}
                    onBack={handleBackToHomepage}
                />
            );

        case 'homepage':
        default:
            return (
                <Homepage
                    onComponentSelect={handleComponentSelect}
                    onAllSoftwareClick={handleAllSoftwareClick}
                    onCreateNew={handleCreateNew}
                />
            );
    }
};

export default SwitchHomepage;