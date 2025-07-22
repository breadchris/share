import React, { useState, useEffect } from 'react';
import BlockNoteAIEditor from './BlockNoteAIEditor';
import { YDocProvider } from "@y-sweet/react";
import { ArrowLeft, Save, FileText } from 'lucide-react';

interface DocumentEditorProps {
  documentId: string;
  documentPath: string;
  title: string;
  initialContent?: any[];
  onSave?: (content: any[]) => void;
  onClose?: () => void;
}

export const DocumentEditor: React.FC<DocumentEditorProps> = ({ 
  documentId, 
  documentPath, 
  title,
  initialContent,
  onSave,
  onClose 
}) => {
  const [content, setContent] = useState(initialContent || []);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  const handleContentChange = (blocks: any[]) => {
    setContent(blocks);
  };

  const handleSave = async () => {
    if (onSave) {
      setIsSaving(true);
      try {
        await onSave(content);
        setLastSaved(new Date());
      } catch (error) {
        console.error('Failed to save document:', error);
      } finally {
        setIsSaving(false);
      }
    }
  };

  // Auto-save every 30 seconds when content changes
  useEffect(() => {
    const autoSaveTimer = setTimeout(() => {
      if (content.length > 0 && onSave) {
        handleSave();
      }
    }, 30000);

    return () => clearTimeout(autoSaveTimer);
  }, [content]);

  const exportToJSON = () => {
    const jsonContent = JSON.stringify(content, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <YDocProvider docId={documentId} authEndpoint={async (): Promise<any> => {
      const res = await fetch("/graph/auth", {
        method: "POST",
        body: JSON.stringify({
          id: documentId,
        }),
      });
      return await res.json();
    }}>
      <div className="flex flex-col h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {onClose && (
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Back to files"
                >
                  <ArrowLeft className="h-5 w-5 text-gray-600" />
                </button>
              )}
              <FileText className="h-5 w-5 text-gray-500" />
              <div>
                <h1 className="text-lg font-semibold text-gray-900">{title}</h1>
                <p className="text-xs text-gray-500">{documentPath}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              {lastSaved && (
                <span className="text-xs text-gray-500">
                  Last saved: {lastSaved.toLocaleTimeString()}
                </span>
              )}
              
              <button
                onClick={handleSave}
                disabled={isSaving}
                className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg font-medium transition-colors ${
                  isSaving 
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                <Save className="h-4 w-4" />
                <span>{isSaving ? 'Saving...' : 'Save'}</span>
              </button>
              
              <button
                onClick={() => setIsPreviewMode(!isPreviewMode)}
                className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                  isPreviewMode
                    ? 'bg-gray-800 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {isPreviewMode ? 'Edit' : 'Preview'}
              </button>
              
              <button
                onClick={exportToJSON}
                className="px-3 py-1.5 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-colors"
              >
                Export
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {!isPreviewMode ? (
            <div className="h-full bg-white">
              <BlockNoteAIEditor
                docId={documentId}
                initialContent={initialContent}
                placeholder="Start writing..."
                onChange={handleContentChange}
                className="h-full"
              />
            </div>
          ) : (
            <div className="h-full overflow-auto bg-white p-6">
              <div className="max-w-4xl mx-auto">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Content Preview (JSON)</h2>
                <pre className="bg-gray-50 rounded-lg p-4 overflow-auto text-sm font-mono">
                  {JSON.stringify(content, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </div>
      </div>
    </YDocProvider>
  );
};