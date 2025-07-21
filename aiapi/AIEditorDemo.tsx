import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import BlockNoteAIEditor from './BlockNoteAIEditor';

interface AIEditorDemoProps {
  onSave?: (content: any[]) => void;
  initialContent?: any[];
}

export default function AIEditorDemo({ onSave, initialContent }: AIEditorDemoProps) {
  const [content, setContent] = useState(initialContent || []);
  const [isPreviewMode, setIsPreviewMode] = useState(false);

  const handleContentChange = (blocks: any[]) => {
    setContent(blocks);
    if (onSave) {
      onSave(blocks);
    }
  };

  const exportToJSON = () => {
    const jsonContent = JSON.stringify(content, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'ai-editor-content.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">AI-Powered Editor</h1>
            <p className="text-sm text-gray-600 mt-1">
              BlockNote editor with OpenAI integration for smart writing assistance
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setIsPreviewMode(!isPreviewMode)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                isPreviewMode
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {isPreviewMode ? 'Edit Mode' : 'Preview'}
            </button>
            <button
              onClick={exportToJSON}
              className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
            >
              Export JSON
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        {!isPreviewMode ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6">
              <div className="mb-4">
                <h2 className="text-lg font-semibold text-gray-900 mb-2">AI Editor Features</h2>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• Type <strong>/ai</strong> to access AI writing assistance</li>
                    <li>• Use the AI button in the formatting toolbar</li>
                    <li>• Select text and use AI features to improve, expand, or rewrite content</li>
                    <li>• AI responses are streamed in real-time for a smooth experience</li>
                  </ul>
                </div>
              </div>
              
              <BlockNoteAIEditor
                initialContent={initialContent}
                placeholder="Start writing or type '/' for commands. Try '/ai' for AI assistance!"
                onChange={handleContentChange}
                className="min-h-96"
              />
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Content Preview (JSON)</h2>
            <pre className="bg-gray-50 rounded-lg p-4 overflow-auto text-sm font-mono">
              {JSON.stringify(content, null, 2)}
            </pre>
          </div>
        )}
      </div>

      {/* Usage Instructions */}
      <div className="max-w-4xl mx-auto px-6 pb-8">
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border border-purple-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Getting Started</h3>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-gray-800 mb-2">AI Writing Features</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• <strong>Improve writing:</strong> Enhance clarity and style</li>
                <li>• <strong>Continue writing:</strong> Generate next paragraphs</li>
                <li>• <strong>Summarize:</strong> Create concise summaries</li>
                <li>• <strong>Translate:</strong> Convert to different languages</li>
                <li>• <strong>Fix grammar:</strong> Correct spelling and grammar</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-gray-800 mb-2">Keyboard Shortcuts</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• <strong>/:</strong> Open slash menu</li>
                <li>• <strong>/ai:</strong> Direct AI assistance</li>
                <li>• <strong>Cmd/Ctrl + Enter:</strong> Submit AI request</li>
                <li>• <strong>Escape:</strong> Cancel AI operation</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}