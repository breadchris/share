import React, { useState } from 'react';
import ClaudeDocBrowser from './ClaudeDocBrowser';
import ClaudeDocEditor from './ClaudeDocEditor';

interface ClaudeDoc {
    id: string;
    title: string;
    description: string;
    content: string;
    tag_names: string[];
    is_public: boolean;
    author_name: string;
    author_username: string;
    created_at: string;
    updated_at: string;
}

type ViewMode = 'browser' | 'create' | 'edit';

export const ClaudeDocApp: React.FC = () => {
    const [currentView, setCurrentView] = useState<ViewMode>('browser');
    const [editingDocId, setEditingDocId] = useState<string | undefined>();

    const handleCreateNew = () => {
        setEditingDocId(undefined);
        setCurrentView('create');
    };

    const handleEdit = (docId: string) => {
        setEditingDocId(docId);
        setCurrentView('edit');
    };

    const handleSave = (doc: ClaudeDoc) => {
        // Return to browser after saving
        setCurrentView('browser');
        setEditingDocId(undefined);
    };

    const handleCancel = () => {
        setCurrentView('browser');
        setEditingDocId(undefined);
    };

    const renderCurrentView = () => {
        switch (currentView) {
            case 'create':
            case 'edit':
                return (
                    <ClaudeDocEditor
                        docId={editingDocId}
                        onSave={handleSave}
                        onCancel={handleCancel}
                    />
                );
            case 'browser':
            default:
                return (
                    <ClaudeDocBrowser
                        onCreateNew={handleCreateNew}
                        onEdit={handleEdit}
                    />
                );
        }
    };

    return (
        <div className="min-h-screen bg-gray-100">
            {renderCurrentView()}
        </div>
    );
};

export default ClaudeDocApp;