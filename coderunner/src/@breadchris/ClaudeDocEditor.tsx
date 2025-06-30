import React, { useState, useEffect, useCallback, useRef } from 'react';

// Types
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

interface Tag {
    id: string;
    name: string;
    color?: string;
}

interface ClaudeDocEditorProps {
    docId?: string; // If provided, we're editing; otherwise creating
    onSave?: (doc: ClaudeDoc) => void;
    onCancel?: () => void;
}

// Predefined developer tags
const PREDEFINED_TAGS = [
    // Languages
    'typescript', 'javascript', 'python', 'golang', 'rust', 'java', 'csharp', 'ruby', 'php',
    // Frameworks
    'react', 'vue', 'angular', 'nextjs', 'svelte', 'express', 'fastapi', 'django', 'rails', 'laravel',
    // Infrastructure
    'docker', 'kubernetes', 'aws', 'gcp', 'azure', 'terraform', 'ansible',
    // Databases
    'postgresql', 'mysql', 'mongodb', 'redis', 'elasticsearch',
    // Tools
    'git', 'vscode', 'intellij', 'postman', 'figma', 'slack',
    // APIs
    'rest', 'graphql', 'websocket', 'grpc', 'oauth', 'jwt',
    // Platforms
    'web', 'mobile', 'desktop', 'cli', 'api', 'microservices'
];

// Sample CLAUDE.md template
const SAMPLE_TEMPLATE = `# Project Name CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with this project.

## Project Overview
Brief description of what this project does and its main purpose.

## Technologies Used
- **Language**: [e.g., TypeScript, Python, Go]
- **Framework**: [e.g., React, FastAPI, Express]
- **Database**: [e.g., PostgreSQL, MongoDB]
- **Infrastructure**: [e.g., Docker, AWS, Kubernetes]

## Architecture
Describe the overall architecture of your application:
- **Frontend**: Location and structure of frontend code
- **Backend**: API endpoints and business logic
- **Database**: Schema and data models
- **External Services**: Third-party integrations

## Development Setup
\`\`\`bash
# Install dependencies
npm install
# or
pip install -r requirements.txt

# Start development server
npm run dev
# or
python manage.py runserver
\`\`\`

## Key Directories
- \`/src\` - Main source code
- \`/tests\` - Test files
- \`/docs\` - Documentation
- \`/config\` - Configuration files

## API Endpoints
### Authentication
- \`POST /api/auth/login\` - User login
- \`POST /api/auth/logout\` - User logout

### User Management
- \`GET /api/users\` - List users
- \`POST /api/users\` - Create user
- \`PUT /api/users/:id\` - Update user

## Database Models
Describe your main data models and their relationships.

## Environment Variables
\`\`\`
DATABASE_URL=postgresql://user:pass@localhost:5432/dbname
API_KEY=your-api-key-here
JWT_SECRET=your-jwt-secret
\`\`\`

## Testing
\`\`\`bash
# Run tests
npm test
# or
pytest
\`\`\`

## Deployment
Instructions for deploying to production.

## Common Tasks
- **Adding a new feature**: Steps to add new functionality
- **Database migrations**: How to handle schema changes
- **Debugging**: Common debugging techniques and tools

## Code Style
- Follow [ESLint/Prettier] configuration
- Use TypeScript interfaces for type safety
- Write meaningful commit messages

## Troubleshooting
Common issues and their solutions.`;

export const ClaudeDocEditor: React.FC<ClaudeDocEditorProps> = ({
    docId,
    onSave,
    onCancel
}) => {
    // Form state
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [content, setContent] = useState(SAMPLE_TEMPLATE);
    const [selectedTags, setSelectedTags] = useState<string[]>([]);
    const [customTag, setCustomTag] = useState('');
    const [isPublic, setIsPublic] = useState(true);
    
    // UI state
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [previewMode, setPreviewMode] = useState(false);
    const [wordCount, setWordCount] = useState(0);
    
    // Refs
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // Load document if editing
    useEffect(() => {
        if (docId) {
            loadDocument();
        }
    }, [docId]);

    // Update word count
    useEffect(() => {
        const words = content.trim().split(/\s+/).filter(word => word.length > 0);
        setWordCount(words.length);
    }, [content]);

    const loadDocument = async () => {
        if (!docId) return;
        
        setLoading(true);
        try {
            const response = await fetch(`/claudemd/api/docs/${docId}`);
            if (response.ok) {
                const doc: ClaudeDoc = await response.json();
                setTitle(doc.title);
                setDescription(doc.description);
                setContent(doc.content || SAMPLE_TEMPLATE);
                setSelectedTags(doc.tag_names);
                setIsPublic(doc.is_public);
            } else {
                setError('Failed to load document');
            }
        } catch (err) {
            setError('Failed to load document');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!title.trim()) {
            setError('Title is required');
            return;
        }

        setSaving(true);
        setError('');

        try {
            const payload = {
                title: title.trim(),
                description: description.trim(),
                content: content.trim(),
                tag_names: selectedTags,
                is_public: isPublic
            };

            const url = docId ? `/claudemd/api/docs/${docId}` : '/claudemd/api/docs';
            const method = docId ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                const savedDoc: ClaudeDoc = await response.json();
                onSave?.(savedDoc);
            } else {
                const errorData = await response.json();
                setError(errorData.error || 'Failed to save document');
            }
        } catch (err) {
            setError('Failed to save document');
        } finally {
            setSaving(false);
        }
    };

    const toggleTag = useCallback((tagName: string) => {
        setSelectedTags(prev => 
            prev.includes(tagName)
                ? prev.filter(t => t !== tagName)
                : [...prev, tagName]
        );
    }, []);

    const addCustomTag = useCallback(() => {
        const tag = customTag.trim().toLowerCase();
        if (tag && !selectedTags.includes(tag)) {
            setSelectedTags(prev => [...prev, tag]);
            setCustomTag('');
        }
    }, [customTag, selectedTags]);

    const insertTemplate = useCallback((template: string) => {
        const textarea = textareaRef.current;
        if (!textarea) return;

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const newContent = content.substring(0, start) + template + content.substring(end);
        
        setContent(newContent);
        
        // Set cursor position after the inserted template
        setTimeout(() => {
            textarea.focus();
            textarea.setSelectionRange(start + template.length, start + template.length);
        }, 0);
    }, [content]);

    // Template snippets
    const templates = {
        codeBlock: '```language\n// Your code here\n```',
        apiEndpoint: '### Endpoint Name\n- `METHOD /api/endpoint` - Description',
        envVar: '```\nVARIABLE_NAME=value\n```',
        commandBlock: '```bash\n# Command description\ncommand here\n```'
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold text-gray-900">
                    {docId ? 'Edit CLAUDE.md' : 'Create New CLAUDE.md'}
                </h1>
                <div className="flex items-center space-x-3">
                    <button
                        onClick={onCancel}
                        className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={saving || !title.trim()}
                        className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        {saving ? 'Saving...' : (docId ? 'Update' : 'Create')}
                    </button>
                </div>
            </div>

            {/* Error message */}
            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
                    {error}
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main editor */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Basic info */}
                    <div className="bg-white rounded-lg shadow-sm border p-6">
                        <h3 className="text-lg font-semibold mb-4">Document Details</h3>
                        
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Title *
                                </label>
                                <input
                                    type="text"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="My Project CLAUDE.md"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Description
                                </label>
                                <textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="Brief description of your project and what Claude should know..."
                                    rows={3}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            <div className="flex items-center space-x-2">
                                <input
                                    type="checkbox"
                                    id="public"
                                    checked={isPublic}
                                    onChange={(e) => setIsPublic(e.target.checked)}
                                    className="rounded border-gray-300"
                                />
                                <label htmlFor="public" className="text-sm text-gray-700">
                                    Make this document public
                                </label>
                            </div>
                        </div>
                    </div>

                    {/* Content editor */}
                    <div className="bg-white rounded-lg shadow-sm border">
                        <div className="flex items-center justify-between p-4 border-b">
                            <div className="flex items-center space-x-4">
                                <h3 className="text-lg font-semibold">Content</h3>
                                <span className="text-sm text-gray-500">
                                    {wordCount} words
                                </span>
                            </div>
                            
                            <div className="flex items-center space-x-2">
                                <button
                                    onClick={() => setPreviewMode(!previewMode)}
                                    className={`px-3 py-1 rounded text-sm transition-colors ${
                                        previewMode 
                                            ? 'bg-blue-100 text-blue-700' 
                                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                                >
                                    {previewMode ? 'Edit' : 'Preview'}
                                </button>
                            </div>
                        </div>

                        {/* Quick templates */}
                        <div className="p-4 border-b bg-gray-50">
                            <div className="flex flex-wrap gap-2">
                                <span className="text-sm text-gray-600 mr-2">Quick insert:</span>
                                <button
                                    onClick={() => insertTemplate(templates.codeBlock)}
                                    className="text-xs bg-gray-200 hover:bg-gray-300 px-2 py-1 rounded"
                                >
                                    Code Block
                                </button>
                                <button
                                    onClick={() => insertTemplate(templates.apiEndpoint)}
                                    className="text-xs bg-gray-200 hover:bg-gray-300 px-2 py-1 rounded"
                                >
                                    API Endpoint
                                </button>
                                <button
                                    onClick={() => insertTemplate(templates.envVar)}
                                    className="text-xs bg-gray-200 hover:bg-gray-300 px-2 py-1 rounded"
                                >
                                    Environment Variable
                                </button>
                                <button
                                    onClick={() => insertTemplate(templates.commandBlock)}
                                    className="text-xs bg-gray-200 hover:bg-gray-300 px-2 py-1 rounded"
                                >
                                    Command
                                </button>
                            </div>
                        </div>

                        <div className="p-4">
                            {previewMode ? (
                                <div className="prose max-w-none">
                                    <pre className="whitespace-pre-wrap bg-gray-50 p-4 rounded text-sm">
                                        {content}
                                    </pre>
                                </div>
                            ) : (
                                <textarea
                                    ref={textareaRef}
                                    value={content}
                                    onChange={(e) => setContent(e.target.value)}
                                    placeholder="Start writing your CLAUDE.md content..."
                                    rows={20}
                                    className="w-full border-0 focus:outline-none resize-none font-mono text-sm"
                                />
                            )}
                        </div>
                    </div>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    {/* Tags */}
                    <div className="bg-white rounded-lg shadow-sm border p-6">
                        <h3 className="text-lg font-semibold mb-4">Tags</h3>
                        
                        {/* Add custom tag */}
                        <div className="flex gap-2 mb-4">
                            <input
                                type="text"
                                value={customTag}
                                onChange={(e) => setCustomTag(e.target.value)}
                                placeholder="Add custom tag"
                                className="flex-1 px-3 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                onKeyPress={(e) => e.key === 'Enter' && addCustomTag()}
                            />
                            <button
                                onClick={addCustomTag}
                                className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
                            >
                                Add
                            </button>
                        </div>

                        {/* Selected tags */}
                        {selectedTags.length > 0 && (
                            <div className="mb-4">
                                <div className="text-sm text-gray-600 mb-2">Selected tags:</div>
                                <div className="flex flex-wrap gap-1">
                                    {selectedTags.map(tag => (
                                        <span 
                                            key={tag}
                                            className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs cursor-pointer hover:bg-blue-200"
                                            onClick={() => toggleTag(tag)}
                                        >
                                            {tag} ✕
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Predefined tags */}
                        <div>
                            <div className="text-sm text-gray-600 mb-2">Popular tags:</div>
                            <div className="flex flex-wrap gap-1 max-h-48 overflow-y-auto">
                                {PREDEFINED_TAGS.map(tag => (
                                    <button
                                        key={tag}
                                        onClick={() => toggleTag(tag)}
                                        className={`px-2 py-1 rounded text-xs transition-colors ${
                                            selectedTags.includes(tag)
                                                ? 'bg-blue-600 text-white'
                                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                        }`}
                                    >
                                        {tag}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Tips */}
                    <div className="bg-blue-50 rounded-lg border border-blue-200 p-6">
                        <h3 className="text-lg font-semibold text-blue-900 mb-3">
                            💡 Writing Tips
                        </h3>
                        <ul className="text-sm text-blue-800 space-y-2">
                            <li>• Include clear project setup instructions</li>
                            <li>• Document your API endpoints and data models</li>
                            <li>• Explain your directory structure</li>
                            <li>• List important environment variables</li>
                            <li>• Add troubleshooting common issues</li>
                            <li>• Use code blocks for commands and config</li>
                        </ul>
                    </div>

                    {/* Preview note */}
                    <div className="bg-yellow-50 rounded-lg border border-yellow-200 p-4">
                        <div className="text-sm text-yellow-800">
                            <strong>Note:</strong> This is a basic preview. Your CLAUDE.md will be rendered with full markdown formatting when viewed.
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ClaudeDocEditor;