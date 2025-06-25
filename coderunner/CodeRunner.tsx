import React, { useEffect, useState, useRef, MutableRefObject, useCallback } from 'react';
import MonacoEditor, { type Monaco, loader } from '@monaco-editor/react';
import { createRoot } from 'react-dom/client';
import * as monaco from 'monaco-editor';

let loaderConfigured = false;
export const configureMonacoLoader = () => {
    if (loaderConfigured) {
        return;
    }
    loader.config({ monaco });
    loaderConfigured = true;
};

const nodeModules = '/static/node_modules/monaco-editor/esm/vs/';
window.MonacoEnvironment = {
    getWorkerUrl: function (moduleId, label) {
        if (label === 'json') {
            return nodeModules + 'language/json/json.worker.js';
        }
        if (label === 'css' || label === 'scss' || label === 'less') {
            return nodeModules + 'language/css/css.worker.js';
        }
        if (label === 'html' || label === 'handlebars' || label === 'razor') {
            return nodeModules + 'language/html/html.worker.js';
        }
        if (label === 'typescript' || label === 'javascript') {
            return nodeModules + 'language/typescript/ts.worker.js';
        }
        return nodeModules + 'editor/editor.worker.js';
    },
};

configureMonacoLoader();

interface CodeRunnerProps {
    initialCode?: string;
    darkMode?: boolean;
    language?: string;
    initialFilePath?: string;
}

interface FileItem {
    name: string;
    path: string;
    isDir: boolean;
    size: number;
    lastModified: string;
}

const CodeRunner: React.FC<CodeRunnerProps> = ({ 
    initialCode = '', 
    darkMode = true,
    language = 'typescript'
}) => {
    // State management
    const [code, setCode] = useState(initialCode || `import React from 'react';
import ReactDOM from 'react-dom/client';

const App = () => {
  return (
    <div className="p-6 max-w-md mx-auto bg-white rounded-xl shadow-lg">
      <h1 className="text-2xl font-bold text-gray-900 mb-4">Welcome!</h1>
      <p className="text-gray-600">
        Edit the code on the left to see changes here. Use Tailwind CSS classes for styling!
      </p>
    </div>
  );
};

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);`);
    
    const [esbuildReady, setEsbuildReady] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [files, setFiles] = useState<FileItem[]>([]);
    const [currentFile, setCurrentFile] = useState<FileItem | null>(null);
    const [expandedDirs, setExpandedDirs] = useState<Set<string>>(new Set());
    const [isLoading, setIsLoading] = useState(false);
    const [isBuildLoading, setIsBuildLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isMobile, setIsMobile] = useState(false);
    const [isFileLoading, setIsFileLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [saveStatus, setSaveStatus] = useState<string>('');
    const [username, setUsername] = useState<string>('');
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [showLogin, setShowLogin] = useState(false);
    const [activeTab, setActiveTab] = useState<'chat' | 'code'>('chat');
    const [chatMessages, setChatMessages] = useState<Array<{id: string, role: 'user' | 'assistant', content: string, timestamp: Date}>>([]);
    const [chatInput, setChatInput] = useState('');
    const [isChatLoading, setIsChatLoading] = useState(false);
    const [outputHeight, setOutputHeight] = useState(isMobile ? 250 : 300);
    const [isDragging, setIsDragging] = useState(false);
    const [dragStartY, setDragStartY] = useState(0);
    const [dragStartHeight, setDragStartHeight] = useState(0);
    
    // GitHub repository state
    const [repositories, setRepositories] = useState<Array<{name: string, full_name: string, description?: string}>>([]);
    const [selectedRepo, setSelectedRepo] = useState<string>('');
    const [repoSearchQuery, setRepoSearchQuery] = useState('');
    const [isLoadingRepos, setIsLoadingRepos] = useState(false);
    const [showRepoSelector, setShowRepoSelector] = useState(false);
    const [isCloning, setIsCloning] = useState(false);
    const [cloneStatus, setCloneStatus] = useState<string>('');

    const editorRef: MutableRefObject<monaco.editor.IStandaloneCodeEditor | null> = useRef(null);
    const outputFrameRef: MutableRefObject<HTMLIFrameElement | null> = useRef(null);
    const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const saveStatusTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const chatMessagesRef = useRef<HTMLDivElement | null>(null);

    // Directory expansion functionality
    const toggleDirExpansion = (dirPath: string) => {
        setExpandedDirs(prev => {
            const newSet = new Set(prev);
            if (newSet.has(dirPath)) {
                newSet.delete(dirPath);
            } else {
                newSet.add(dirPath);
            }
            return newSet;
        });
    };

    const organizeFilesByDirectory = (files: FileItem[]) => {
        const organized: { [key: string]: FileItem[] } = {};
        const rootFiles: FileItem[] = [];
        
        // First pass: create all directory entries
        files.forEach(file => {
            if (file.isDir) {
                organized[file.path] = [];
            }
        });
        
        // Second pass: organize files into their parent directories
        files.forEach(file => {
            if (!file.isDir) {
                if (!file.path.includes('/')) {
                    // File is in root directory
                    rootFiles.push(file);
                } else {
                    // File is in a subdirectory
                    const parentDir = file.path.substring(0, file.path.lastIndexOf('/'));
                    
                    if (organized.hasOwnProperty(parentDir)) {
                        // Direct parent directory exists
                        organized[parentDir].push(file);
                    } else {
                        // Try to find the closest parent directory that exists
                        let currentPath = parentDir;
                        let found = false;
                        
                        while (currentPath.includes('/') && !found) {
                            if (organized.hasOwnProperty(currentPath)) {
                                organized[currentPath].push(file);
                                found = true;
                            } else {
                                currentPath = currentPath.substring(0, currentPath.lastIndexOf('/'));
                            }
                        }
                        
                        // If no parent directory found, check if it's a top-level directory
                        if (!found && organized.hasOwnProperty(currentPath)) {
                            organized[currentPath].push(file);
                        } else if (!found) {
                            rootFiles.push(file);
                        }
                    }
                }
            }
        });
        
        return { organized, rootFiles };
    };

    // Login/logout functionality
    const handleGithubLogin = () => {
        // Redirect to GitHub OAuth login
        window.location.href = '/github/login';
    };

    
    const handleLogout = async () => {
        try {
            // Clear local storage
            localStorage.removeItem('coderunner_username');
            localStorage.removeItem('coderunner_github_user');
            
            // Call GitHub logout endpoint to clear server-side session
            try {
                await fetch('/github/logout', { 
                    method: 'GET',
                    credentials: 'include'
                });
            } catch (error) {
                console.warn('Failed to call GitHub logout endpoint:', error);
                // Continue with local logout even if server logout fails
            }
            
            setUsername('');
            setIsLoggedIn(false);
            setShowLogin(false);
            
            // Reload to clear any remaining session state
            window.location.reload();
        } catch (error) {
            console.error('Logout error:', error);
            // Still clear local state even if server logout fails
            setUsername('');
            setIsLoggedIn(false);
            setShowLogin(false);
        }
    };

    // Check GitHub authentication status
    const checkGithubAuth = async () => {
        try {
            const response = await fetch('/coderunner/user', {
                credentials: 'include' // Include cookies for session
            });
            
            if (response.ok) {
                const userData = await response.json();
                if (userData.username) {
                    setUsername(userData.username);
                    setIsLoggedIn(true);
                    localStorage.setItem('coderunner_username', userData.username);
                    localStorage.setItem('coderunner_github_user', JSON.stringify(userData));
                    return true;
                }
            }
            return false;
        } catch (error) {
            console.error('Auth check error:', error);
            return false;
        }
    };

    // GitHub repository functions
    const fetchGithubRepositories = async () => {
        if (!isLoggedIn) return;
        
        setIsLoadingRepos(true);
        try {
            const response = await fetch('/coderunner/repositories', {
                credentials: 'include'
            });
            
            if (response.ok) {
                const repos = await response.json();
                setRepositories(repos);
            } else {
                console.error('Failed to fetch repositories');
            }
        } catch (error) {
            console.error('Error fetching repositories:', error);
        } finally {
            setIsLoadingRepos(false);
        }
    };

    const handleRepoSelection = async (repoFullName: string) => {
        try {
            const response = await fetch('/coderunner/select-repo', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({ repository: repoFullName })
            });
            
            if (response.ok) {
                setSelectedRepo(repoFullName);
                setShowRepoSelector(false);
                // Don't automatically reload files here - wait for user to clone
            } else {
                console.error('Failed to select repository');
            }
        } catch (error) {
            console.error('Error selecting repository:', error);
        }
    };

    const cloneRepository = async () => {
        if (!selectedRepo) return;
        
        setIsCloning(true);
        setCloneStatus('');
        
        try {
            const response = await fetch('/coderunner/clone-repo', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include'
            });
            
            if (response.ok) {
                const result = await response.json();
                setCloneStatus(result.message || 'Repository cloned successfully');
                // Reload files to show the cloned repository
                loadFiles();
                
                // Clear status after 3 seconds
                setTimeout(() => {
                    setCloneStatus('');
                }, 3000);
            } else {
                const error = await response.json();
                setCloneStatus(error.error || 'Failed to clone repository');
                setTimeout(() => {
                    setCloneStatus('');
                }, 5000);
            }
        } catch (error) {
            console.error('Error cloning repository:', error);
            setCloneStatus('Error cloning repository');
            setTimeout(() => {
                setCloneStatus('');
            }, 5000);
        } finally {
            setIsCloning(false);
        }
    };

    // Filter repositories based on search query
    const filteredRepositories = repositories.filter(repo =>
        repo.name.toLowerCase().includes(repoSearchQuery.toLowerCase()) ||
        repo.full_name.toLowerCase().includes(repoSearchQuery.toLowerCase()) ||
        (repo.description && repo.description.toLowerCase().includes(repoSearchQuery.toLowerCase()))
    );

    // File management functions
    const saveFile = async (filePath: string, content: string) => {
        try {
            let finalPath = filePath;
            if (isLoggedIn && !filePath.startsWith('@')) {
                finalPath = `@${username}/${filePath}`;
            } else if (!isLoggedIn && !filePath.startsWith('@')) {
                finalPath = `@guest/${filePath}`;
            }
            
            const response = await fetch('/coderunner/api/files', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    path: finalPath,
                    content: content
                })
            });

            if (!response.ok) {
                const errorData = await response.text();
                throw new Error(errorData || `Failed to save file: ${response.statusText}`);
            }

            const result = await response.json();
            return result;
        } catch (err) {
            console.error('Failed to save file:', err);
            throw err;
        }
    };

    const createNewFile = () => {
        const timestamp = new Date().toISOString().slice(0, -5).replace(/[T:]/g, '-');
        const userPrefix = isLoggedIn ? `@${username}` : '@guest';
        const newFile: FileItem = {
            name: `untitled-${timestamp}.tsx`,
            path: `${userPrefix}/untitled-${timestamp}.tsx`,
            isDir: false,
            size: 0,
            lastModified: new Date().toISOString()
        };
        
        const defaultContent = `import React from 'react';
import ReactDOM from 'react-dom/client';

const App = () => {
  return (
    <div className="p-4">
      <h1 className="text-xl font-bold">New Component</h1>
      <p>Start building something amazing!</p>
    </div>
  );
};

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);`;
        
        setCurrentFile(newFile);
        setCode(defaultContent);
        if (editorRef.current) {
            editorRef.current.setValue(defaultContent);
        }
        setIsSidebarOpen(false);
        setActiveTab('code');
    };

    const createNewFileInDirectory = async (dirPath: string) => {
        const timestamp = new Date().toISOString().slice(0, -5).replace(/[T:]/g, '-');
        const fileName = `untitled-${timestamp}.tsx`;
        const filePath = `${dirPath}/${fileName}`;
        
        const defaultContent = `import React from 'react';
import ReactDOM from 'react-dom/client';

const App = () => {
  return (
    <div className="p-4">
      <h1 className="text-xl font-bold">New Component</h1>
      <p>Start building something amazing!</p>
    </div>
  );
};

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);`;

        try {
            // Save the file first
            await saveFile(filePath, defaultContent);
            
            // Create the file object
            const newFile: FileItem = {
                name: fileName,
                path: filePath,
                isDir: false,
                size: defaultContent.length,
                lastModified: new Date().toISOString()
            };
            
            // Set as current file
            setCurrentFile(newFile);
            setCode(defaultContent);
            if (editorRef.current) {
                editorRef.current.setValue(defaultContent);
            }
            
            // Reload files to show the new file
            loadFiles();
            
            // Close sidebar and switch to code tab
            setIsSidebarOpen(false);
            setActiveTab('code');
            
        } catch (error) {
            console.error('Failed to create new file:', error);
            alert(`Failed to create new file: ${error.message}`);
        }
    };

    // Load files
    const loadFiles = async () => {
        try {
            const response = await fetch('/coderunner/api/files');
            if (!response.ok) {
                throw new Error(`Failed to load files: ${response.statusText}`);
            }
            const data = await response.json();
            setFiles(data || []);
        } catch (err) {
            console.error('Failed to load files:', err);
        }
    };

    const openFile = async (file: FileItem) => {
        if (file.isDir) return;
        
        try {
            const response = await fetch(`/coderunner/api/files/${encodeURIComponent(file.path)}`);
            if (!response.ok) {
                throw new Error(`Failed to load file: ${response.statusText}`);
            }
            
            const content = await response.text();
            setCurrentFile(file);
            setCode(content);
            if (editorRef.current) {
                editorRef.current.setValue(content);
            }
            setIsSidebarOpen(false);
        } catch (err) {
            console.error('Failed to load file:', err);
        }
    };

    const deleteFile = async (file: FileItem) => {
        if (file.isDir) return;
        
        try {
            const response = await fetch(`/coderunner/api/delete/${encodeURIComponent(file.path)}`, {
                method: 'DELETE'
            });
            
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(errorText || `Failed to delete file: ${response.statusText}`);
            }
            
            // If the deleted file was the currently open file, clear the editor
            if (currentFile && currentFile.path === file.path) {
                setCurrentFile(null);
                setCode('');
                if (editorRef.current) {
                    editorRef.current.setValue('');
                }
            }
            
            // Reload the file list to reflect the deletion
            loadFiles();
            
        } catch (err) {
            console.error('Failed to delete file:', err);
            alert(`Failed to delete file: ${err.message}`);
        }
    };

    // Initialize esbuild
    useEffect(() => {
        const initEsbuild = async () => {
            try {
                const esbuild = (window as any).esbuild;
                if (esbuild) {
                    await esbuild.initialize({
                        wasmURL: 'https://unpkg.com/esbuild-wasm@0.25.5/esbuild.wasm',
                        worker: true,
                    });
                    setEsbuildReady(true);
                }
            } catch (err) {
                console.error('Failed to initialize esbuild:', err);
            }
        };
        
        setTimeout(initEsbuild, 100);
        loadFiles();
    }, []);

    // Chat functionality
    const sendChatMessage = async (message: string) => {
        if (!message.trim() || isChatLoading) return;
        
        const newMessage = {
            id: Date.now().toString(),
            role: 'user' as const,
            content: message,
            timestamp: new Date()
        };
        
        setChatMessages(prev => [...prev, newMessage]);
        setChatInput('');
        setIsChatLoading(true);
        
        try {
            // Always use structured code completion approach
            const responseSchema = {
                type: "object",
                properties: {
                    code: {
                        type: "string",
                        description: "The complete, valid TSX/TypeScript code that can be executed (only provide if code changes are needed)"
                    },
                    implementedComments: {
                        type: "array",
                        items: {
                            type: "string"
                        },
                        description: "Array of comment descriptions that were implemented in the code (only if code was modified)"
                    },
                    explanation: {
                        type: "string",
                        description: "Technical explanation of changes made or advice given"
                    },
                    chatResponse: {
                        type: "string",
                        description: "Friendly response to the user"
                    },
                    shouldUpdateCode: {
                        type: "boolean",
                        description: "Whether the code should be updated in the editor"
                    }
                },
                required: ["chatResponse", "shouldUpdateCode"],
                additionalProperties: false
            };
            
            const systemPrompt = `You are an expert React/TypeScript developer and helpful coding assistant. You can help users in two ways:

1. **Code Modification**: When users ask you to improve, complete, or modify code, you should:
   - Analyze the provided TSX/TypeScript code
   - Understand the user's request and implement the requested changes
   - Generate complete, valid TSX code that implements the functionality
   - Use ONLY Tailwind CSS classes for styling (no inline styles, no CSS modules)
   - Ensure all code is production-ready and follows React best practices
   - Return valid TypeScript/TSX syntax that will compile without errors
   - Set shouldUpdateCode to true and provide the code field

2. **General Help**: When users ask questions, need explanations, or want advice:
   - Provide helpful explanations and guidance
   - Give debugging tips and best practices
   - Answer questions about React, TypeScript, or web development
   - Set shouldUpdateCode to false and don't provide the code field

RULES for code modification:
- Always return complete, runnable code that includes React imports and ReactDOM.render
- Use proper TypeScript types and interfaces when needed
- Implement React hooks correctly (useState, useEffect, etc.)
- Use Tailwind CSS classes exclusively for styling
- Handle edge cases and add proper error handling
- Follow React component composition patterns
- Ensure accessibility with proper ARIA attributes when needed
- Always include the ReactDOM.createRoot and render call at the bottom

You must respond with a JSON object containing the appropriate fields based on whether code modification is needed.`;
            
            const requestPayload = {
                systemPrompt,
                userMessage: `User request: "${message}"

Current code:
\`\`\`tsx
${code}
\`\`\`

Please help the user with their request. If they want code changes, provide updated code. If they just want help or explanation, provide guidance without modifying the code.`,
                currentCode: code,
                responseSchema: responseSchema,
                chatHistory: chatMessages.slice(-3).map(msg => ({
                    role: msg.role,
                    content: msg.content,
                    timestamp: msg.timestamp.toISOString()
                }))
            };
            
            const response = await fetch('/ai/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestPayload)
            });
            
            if (!response.ok) {
                throw new Error('Failed to send message');
            }
            
            const data = await response.json();
            
            let assistantContent = '';
            
            // Handle structured response
            if (data.aiResponse) {
                try {
                    const aiData = typeof data.aiResponse === 'string' 
                        ? JSON.parse(data.aiResponse) 
                        : data.aiResponse;
                    
                    // Check if code should be updated
                    if (aiData.shouldUpdateCode && aiData.code) {
                        // Update the code state (this works even if editor isn't mounted)
                        setCode(aiData.code);
                        
                        // Update the editor if it's currently mounted
                        if (editorRef.current) {
                            editorRef.current.setValue(aiData.code);
                        }
                        
                        // Switch to code tab to show the changes
                        setActiveTab('code');
                    }
                    
                    // Create chat response
                    assistantContent = aiData.chatResponse || 'I\'ve processed your request.';
                    
                    if (aiData.shouldUpdateCode) {
                        if (aiData.implementedComments && aiData.implementedComments.length > 0) {
                            assistantContent += `\n\n**Implemented features:**\n${aiData.implementedComments.map(c => `• ${c}`).join('\n')}`;
                        }
                        
                        if (aiData.explanation) {
                            assistantContent += `\n\n**Technical details:** ${aiData.explanation}`;
                        }
                    } else if (aiData.explanation) {
                        assistantContent += `\n\n${aiData.explanation}`;
                    }
                    
                } catch (parseError) {
                    console.error('Failed to parse structured response:', parseError);
                    assistantContent = 'I encountered an error processing your request. Please try again.';
                }
            } else {
                // Fallback for non-structured response
                assistantContent = data.aiResponse || 'Sorry, I encountered an error.';
            }
            
            const assistantMessage = {
                id: (Date.now() + 1).toString(),
                role: 'assistant' as const,
                content: assistantContent,
                timestamp: new Date()
            };
            
            setChatMessages(prev => [...prev, assistantMessage]);
            
        } catch (error) {
            console.error('Chat error:', error);
            const errorMessage = {
                id: (Date.now() + 1).toString(),
                role: 'assistant' as const,
                content: 'Sorry, I encountered an error processing your message.',
                timestamp: new Date()
            };
            setChatMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsChatLoading(false);
        }
    };

    // AI Code Completion functionality
    const completeWithAI = async () => {
        if (!editorRef.current) return;
        
        setIsBuildLoading(true);
        setError(null);
        
        try {
            const currentCode = editorRef.current.getValue();
            
            // Define the expected response schema as a proper JSON Schema
            const responseSchema = {
                type: "object",
                properties: {
                    code: {
                        type: "string",
                        description: "The complete, valid TSX/TypeScript code that can be executed"
                    },
                    implementedComments: {
                        type: "array",
                        items: {
                            type: "string"
                        },
                        description: "Array of comment descriptions that were implemented in the code"
                    },
                    explanation: {
                        type: "string",
                        description: "Brief explanation of the changes made and functionality implemented"
                    }
                },
                required: ["code", "implementedComments", "explanation"],
                additionalProperties: false
            };
            
            const response = await fetch('/ai/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    systemPrompt: `You are an expert React/TypeScript developer. Your task is to:

1. Analyze the provided TSX/TypeScript code
2. Identify any comments that describe functionality but lack implementation
3. Generate complete, valid TSX code that implements all described functionality
4. Use ONLY Tailwind CSS classes for styling (no inline styles, no CSS modules)
5. Ensure all code is production-ready and follows React best practices
6. Return valid TypeScript/TSX syntax that will compile without errors

EXAMPLE OUTPUT FORMAT:
The code should follow this structure and format:

\`\`\`tsx
import React from 'react';
import ReactDOM from 'react-dom/client';

const App = () => (
  <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
    <h1>Hello from TSX!</h1>
    <p>Edit the code on the left to see changes here.</p>
    <button onClick={() => alert('Button clicked!')}>
      Click me!
    </button>
  </div>
);

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
\`\`\`

However, replace all inline styles with Tailwind CSS classes. For example:
- \`style={{ padding: '20px' }}\` becomes \`className="p-5"\`
- \`style={{ fontFamily: 'Arial, sans-serif' }}\` becomes \`className="font-sans"\`

Rules:
- Always return complete, runnable code that includes React imports and ReactDOM.render
- Use proper TypeScript types and interfaces when needed
- Implement React hooks correctly (useState, useEffect, etc.)
- Use Tailwind CSS classes exclusively for styling
- Handle edge cases and add proper error handling
- Follow React component composition patterns
- Ensure accessibility with proper ARIA attributes when needed
- Always include the ReactDOM.createRoot and render call at the bottom

You must respond with a JSON object containing the code, implementedComments array, and explanation.`,
                    userMessage: `Please analyze this TSX code and implement any functionality described in comments. Also improve the code quality and ensure it uses only Tailwind CSS classes for styling:

\`\`\`tsx
${currentCode}
\`\`\`

Focus on:
1. Implementing any TODO comments or functionality described in comments
2. Converting any inline styles to Tailwind CSS classes
3. Adding proper TypeScript types
4. Improving React patterns and performance
5. Ensuring the code is complete and runnable
6. Making sure the final code follows the example format provided in the system prompt`,
                    responseSchema: responseSchema
                }),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            
            // Handle structured response with function calling
            if (result.aiResponse) {
                try {
                    // Parse the AI response as JSON (it should be the function arguments)
                    const aiData = typeof result.aiResponse === 'string' 
                        ? JSON.parse(result.aiResponse) 
                        : result.aiResponse;
                        
                    if (aiData.code) {
                        editorRef.current.setValue(aiData.code);
                        setCode(aiData.code);
                        
                        // Show what was implemented
                        if (aiData.implementedComments && aiData.implementedComments.length > 0) {
                            console.log('Implemented comments:', aiData.implementedComments);
                        }
                        if (aiData.explanation) {
                            console.log('AI explanation:', aiData.explanation);
                        }
                    } else {
                        throw new Error('No code field in structured response');
                    }
                } catch (parseError) {
                    console.error('Failed to parse structured response:', parseError);
                    // Fallback: treat as plain text if JSON parsing fails
                    const cleanCode = (typeof result.aiResponse === 'string' ? result.aiResponse : JSON.stringify(result.aiResponse))
                        .replace(/^```(?:tsx?|typescript|javascript)?\n?/gm, '')
                        .replace(/\n?```$/gm, '')
                        .trim();
                    
                    editorRef.current.setValue(cleanCode);
                    setCode(cleanCode);
                }
            } else if (typeof result === 'string') {
                // Handle direct string response (function calling result)
                try {
                    const aiData = JSON.parse(result);
                    if (aiData.code) {
                        editorRef.current.setValue(aiData.code);
                        setCode(aiData.code);
                        
                        if (aiData.implementedComments && aiData.implementedComments.length > 0) {
                            console.log('Implemented comments:', aiData.implementedComments);
                        }
                        if (aiData.explanation) {
                            console.log('AI explanation:', aiData.explanation);
                        }
                    } else {
                        throw new Error('No code field in response');
                    }
                } catch (parseError) {
                    // Fallback: treat as code directly
                    const cleanCode = result
                        .replace(/^```(?:tsx?|typescript|javascript)?\n?/gm, '')
                        .replace(/\n?```$/gm, '')
                        .trim();
                    
                    editorRef.current.setValue(cleanCode);
                    setCode(cleanCode);
                }
            } else if (result.content) {
                // Handle alternative response format
                const cleanCode = result.content
                    .replace(/^```(?:tsx?|typescript|javascript)?\n?/gm, '')
                    .replace(/\n?```$/gm, '')
                    .trim();
                
                editorRef.current.setValue(cleanCode);
                setCode(cleanCode);
            } else {
                throw new Error('Unexpected response format from AI service');
            }
            
        } catch (err) {
            console.error('AI completion error:', err);
            setError(err instanceof Error ? err.message : 'Failed to complete with AI');
        } finally {
            setIsBuildLoading(false);
        }
    };

    // Auto-save functionality
    const triggerAutoSave = useCallback(() => {
        if (currentFile && code && (currentFile.path.includes(username) || username === '')) {
            if (autoSaveTimeoutRef.current) {
                clearTimeout(autoSaveTimeoutRef.current);
            }
            
            autoSaveTimeoutRef.current = setTimeout(async () => {
                try {
                    setIsSaving(true);
                    await saveFile(currentFile.path, code);
                    setSaveStatus('✓ Saved');
                    
                    if (saveStatusTimeoutRef.current) {
                        clearTimeout(saveStatusTimeoutRef.current);
                    }
                    saveStatusTimeoutRef.current = setTimeout(() => {
                        setSaveStatus('');
                    }, 2000);
                } catch (error) {
                    console.error('Auto-save failed:', error);
                    setSaveStatus('⚠ Failed to save');
                    setTimeout(() => setSaveStatus(''), 3000);
                } finally {
                    setIsSaving(false);
                }
            }, 1000);
        }
    }, [currentFile, code, username]);

    // Initialize from localStorage and check GitHub auth
    useEffect(() => {
        const initializeAuth = async () => {
            // First check localStorage for cached username
            const savedUsername = localStorage.getItem('coderunner_username');
            if (savedUsername) {
                setUsername(savedUsername);
                setIsLoggedIn(true);
            }
            
            // Then check server-side GitHub authentication
            const isGithubAuthenticated = await checkGithubAuth();
            if (!isGithubAuthenticated && savedUsername) {
                // Server session expired but we have cached data, clear it
                localStorage.removeItem('coderunner_username');
                localStorage.removeItem('coderunner_github_user');
                setUsername('');
                setIsLoggedIn(false);
            } else if (isGithubAuthenticated) {
                // Fetch repositories when user is authenticated
                fetchGithubRepositories();
            }
        };

        initializeAuth();

        // Check for mobile
        const checkMobile = () => {
            setIsMobile(window.innerWidth <= 1024);
        };
        checkMobile();
        window.addEventListener('resize', checkMobile);
        
        return () => {
            window.removeEventListener('resize', checkMobile);
            if (autoSaveTimeoutRef.current) {
                clearTimeout(autoSaveTimeoutRef.current);
            }
            if (saveStatusTimeoutRef.current) {
                clearTimeout(saveStatusTimeoutRef.current);
            }
        };
    }, []);

    // Trigger auto-save when code changes
    useEffect(() => {
        triggerAutoSave();
    }, [code, triggerAutoSave]);

    // Auto-scroll chat messages
    useEffect(() => {
        if (chatMessagesRef.current) {
            chatMessagesRef.current.scrollTop = chatMessagesRef.current.scrollHeight;
        }
    }, [chatMessages]);

    // Auto-run when esbuild is ready or code changes
    useEffect(() => {
        if (esbuildReady && activeTab === 'code') {
            const timeoutId = setTimeout(() => {
                buildAndRun();
            }, 1000); // Debounce for 1 second
            
            return () => clearTimeout(timeoutId);
        }
    }, [esbuildReady, code, activeTab]);

    // Auto-run when esbuild is ready or code changes (works for both tabs)
    useEffect(() => {
        if (esbuildReady && code.trim()) {
            const timeoutId = setTimeout(() => {
                buildAndRun();
            }, 1500); // Debounce for 1.5 seconds to allow for typing
            
            return () => clearTimeout(timeoutId);
        }
    }, [esbuildReady, code]);

    // Initial run when esbuild becomes ready
    useEffect(() => {
        if (esbuildReady && code.trim()) {
            buildAndRun();
        }
    }, [esbuildReady]);

    // Handle output panel resizing
    const handleDragStart = (e: React.MouseEvent) => {
        setIsDragging(true);
        setDragStartY(e.clientY);
        setDragStartHeight(outputHeight);
        e.preventDefault();
    };

    const handleDragMove = useCallback((e: MouseEvent) => {
        if (!isDragging) return;
        
        const deltaY = e.clientY - dragStartY; // Positive when dragging down, negative when dragging up
        const newHeight = Math.max(150, Math.min(window.innerHeight * 0.7, dragStartHeight + deltaY));
        setOutputHeight(newHeight);
    }, [isDragging, dragStartY, dragStartHeight]);

    const handleDragEnd = useCallback(() => {
        setIsDragging(false);
    }, []);

    // Add global mouse event listeners for dragging
    useEffect(() => {
        if (isDragging) {
            document.addEventListener('mousemove', handleDragMove);
            document.addEventListener('mouseup', handleDragEnd);
            document.body.style.cursor = 'ns-resize';
            document.body.style.userSelect = 'none';
            
            return () => {
                document.removeEventListener('mousemove', handleDragMove);
                document.removeEventListener('mouseup', handleDragEnd);
                document.body.style.cursor = '';
                document.body.style.userSelect = '';
            };
        }
    }, [isDragging, handleDragMove, handleDragEnd]);

    // Build and run code
    const buildAndRun = async () => {
        if (!esbuildReady) {
            setError('esbuild is not ready yet');
            return;
        }

        setIsBuildLoading(true);
        setError(null);

        try {
            const esbuild = (window as any).esbuild;
            
            // Transform the code
            const result = await esbuild.transform(code, {
                loader: 'tsx',
                target: 'es2020',
                format: 'esm',
                jsx: 'automatic',
                jsxImportSource: 'react',
            });

            // Create the HTML content
            const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Code Output</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        body { margin: 0; padding: 16px; font-family: system-ui, -apple-system, sans-serif; }
        #root { min-height: 100vh; }
        .error { 
            background: #fee; 
            border: 1px solid #fcc; 
            color: #c33; 
            padding: 16px; 
            border-radius: 8px; 
            margin: 16px;
            font-family: monospace;
            white-space: pre-wrap;
        }
    </style>
</head>
<body>
    <div id="root"></div>
      <script type="importmap">
  {
    "imports": {
      "react": "https://esm.sh/react@18",
      "react/": "https://esm.sh/react@18/",
      "react/jsx-runtime": "https://esm.sh/react@18/jsx-runtime",
      "react/jsx-dev-runtime": "https://esm.sh/react@18/jsx-dev-runtime",
      "react-dom": "https://esm.sh/react-dom@18",
      "react-dom/": "https://esm.sh/react-dom@18/",
      "react-dom/client": "https://esm.sh/react-dom@18/client"
    }
  }
  </script>
    <script type="module">
        window.onerror = function(msg, url, line, col, error) {
            document.getElementById('root').innerHTML = 
                '<div class="error">Runtime Error: ' + msg + '\\n\\nLine: ' + line + '</div>';
            return false;
        };
        
        window.addEventListener('unhandledrejection', function(event) {
            document.getElementById('root').innerHTML = 
                '<div class="error">Promise Rejection: ' + event.reason + '</div>';
        });

        // try {
        ${result.code}
        // } catch (error) {
        //     document.getElementById('root').innerHTML = 
        //         '<div class="error">Compilation Error: ' + error.message + '</div>';
        // }
    </script>
</body>
</html>`;


            // Update the iframe
            if (outputFrameRef.current) {
                const iframe = outputFrameRef.current;
                iframe.srcdoc = htmlContent;
            }

        } catch (error) {
            console.error('Build failed:', error);
            setError(`Build failed: ${error.message}`);
        } finally {
            setIsBuildLoading(false);
        }
    };

    const renderSidebar = () => (
        <div 
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '280px',
                height: '100vh',
                backgroundColor: darkMode ? '#252526' : '#f8f9fa',
                borderRight: `1px solid ${darkMode ? '#3e3e42' : '#e1e4e8'}`,
                zIndex: 1000,
                transform: isSidebarOpen ? 'translateX(0)' : 'translateX(-100%)',
                transition: 'transform 0.3s ease',
                display: 'flex',
                flexDirection: 'column'
            }}>
            
            {/* Header */}
            <div style={{
                padding: '16px',
                borderBottom: `1px solid ${darkMode ? '#3e3e42' : '#e1e4e8'}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
            }}>
                <div style={{
                    color: darkMode ? '#cccccc' : '#24292e',
                    fontSize: '14px',
                    fontWeight: 600
                }}>
                    CodeRunner
                </div>
                <button
                    onClick={() => setIsSidebarOpen(false)}
                    style={{
                        background: 'none',
                        border: 'none',
                        color: darkMode ? '#cccccc' : '#24292e',
                        cursor: 'pointer',
                        fontSize: '18px',
                        padding: '4px'
                    }}
                >
                    ×
                </button>
            </div>

            {/* GitHub Repository Selector */}
            {isLoggedIn && (
                <div style={{
                    padding: '16px',
                    borderBottom: `1px solid ${darkMode ? '#3e3e42' : '#e1e4e8'}`,
                    backgroundColor: darkMode ? '#2d2d30' : '#f6f8fa'
                }}>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: '8px'
                    }}>
                        <div style={{
                            fontSize: '12px',
                            fontWeight: 600,
                            color: darkMode ? '#cccccc' : '#24292e'
                        }}>
                            GitHub Repository
                        </div>
                        <button
                            onClick={() => {
                                setShowRepoSelector(!showRepoSelector);
                                if (!showRepoSelector && repositories.length === 0) {
                                    fetchGithubRepositories();
                                }
                            }}
                            style={{
                                background: 'none',
                                border: `1px solid ${darkMode ? '#4a4a4a' : '#d0d7de'}`,
                                color: darkMode ? '#cccccc' : '#24292e',
                                padding: '2px 6px',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontSize: '11px'
                            }}
                        >
                            {showRepoSelector ? 'Hide' : 'Browse'}
                        </button>
                    </div>
                    
                    {selectedRepo && (
                        <div style={{
                            fontSize: '11px',
                            color: darkMode ? '#888' : '#666',
                            backgroundColor: darkMode ? '#37373d' : '#e8f4fd',
                            padding: '8px',
                            borderRadius: '4px',
                            marginBottom: showRepoSelector ? '8px' : '0',
                            border: `1px solid ${darkMode ? '#4a4a4a' : '#c8e1ff'}`
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                                <div>📦 {selectedRepo}</div>
                                <button
                                    onClick={cloneRepository}
                                    disabled={isCloning}
                                    style={{
                                        background: isCloning ? (darkMode ? '#4a4a4a' : '#ddd') : (darkMode ? '#0366d6' : '#0366d6'),
                                        color: '#ffffff',
                                        border: 'none',
                                        padding: '3px 8px',
                                        borderRadius: '3px',
                                        cursor: isCloning ? 'not-allowed' : 'pointer',
                                        fontSize: '10px',
                                        fontWeight: 500,
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '4px'
                                    }}
                                >
                                    {isCloning ? (
                                        <>
                                            <div style={{
                                                width: '8px',
                                                height: '8px',
                                                border: '1px solid rgba(255,255,255,0.3)',
                                                borderTop: '1px solid #ffffff',
                                                borderRadius: '50%',
                                                animation: 'spin 1s linear infinite'
                                            }}></div>
                                            Cloning...
                                        </>
                                    ) : (
                                        '📥 Clone'
                                    )}
                                </button>
                            </div>
                            {cloneStatus && (
                                <div style={{
                                    fontSize: '10px',
                                    color: cloneStatus.includes('success') || cloneStatus.includes('up to date') 
                                        ? (darkMode ? '#4caf50' : '#2e7d32')
                                        : (darkMode ? '#f44336' : '#d32f2f'),
                                    fontWeight: 500
                                }}>
                                    {cloneStatus}
                                </div>
                            )}
                        </div>
                    )}
                    
                    {showRepoSelector && (
                        <div style={{
                            border: `1px solid ${darkMode ? '#4a4a4a' : '#d0d7de'}`,
                            borderRadius: '6px',
                            backgroundColor: darkMode ? '#1e1e1e' : '#ffffff',
                            maxHeight: '200px',
                            overflow: 'hidden'
                        }}>
                            {/* Search Input */}
                            <div style={{ padding: '8px' }}>
                                <input
                                    type="text"
                                    placeholder="Search repositories..."
                                    value={repoSearchQuery}
                                    onChange={(e) => setRepoSearchQuery(e.target.value)}
                                    style={{
                                        width: '100%',
                                        padding: '4px 8px',
                                        border: `1px solid ${darkMode ? '#4a4a4a' : '#d0d7de'}`,
                                        borderRadius: '4px',
                                        backgroundColor: darkMode ? '#252526' : '#ffffff',
                                        color: darkMode ? '#cccccc' : '#24292e',
                                        fontSize: '11px',
                                        boxSizing: 'border-box'
                                    }}
                                />
                            </div>
                            
                            {/* Repository List */}
                            <div style={{
                                maxHeight: '140px',
                                overflow: 'auto',
                                borderTop: `1px solid ${darkMode ? '#4a4a4a' : '#d0d7de'}`
                            }}>
                                {isLoadingRepos ? (
                                    <div style={{
                                        padding: '16px',
                                        textAlign: 'center',
                                        color: darkMode ? '#888' : '#666',
                                        fontSize: '11px'
                                    }}>
                                        Loading repositories...
                                    </div>
                                ) : filteredRepositories.length === 0 ? (
                                    <div style={{
                                        padding: '16px',
                                        textAlign: 'center',
                                        color: darkMode ? '#888' : '#666',
                                        fontSize: '11px'
                                    }}>
                                        {repositories.length === 0 ? 'No repositories found' : 'No matching repositories'}
                                    </div>
                                ) : (
                                    filteredRepositories.map((repo) => (
                                        <button
                                            key={repo.full_name}
                                            onClick={() => handleRepoSelection(repo.full_name)}
                                            style={{
                                                width: '100%',
                                                padding: '8px 12px',
                                                background: selectedRepo === repo.full_name
                                                    ? (darkMode ? '#37373d' : '#e8f4fd')
                                                    : 'none',
                                                border: 'none',
                                                color: selectedRepo === repo.full_name
                                                    ? (darkMode ? '#ffffff' : '#0366d6')
                                                    : (darkMode ? '#cccccc' : '#24292e'),
                                                cursor: 'pointer',
                                                fontSize: '11px',
                                                textAlign: 'left',
                                                transition: 'background-color 0.2s',
                                                borderBottom: `1px solid ${darkMode ? '#3e3e42' : '#e1e4e8'}`
                                            }}
                                            onMouseEnter={(e) => {
                                                if (selectedRepo !== repo.full_name) {
                                                    e.currentTarget.style.backgroundColor = darkMode ? '#3e3e42' : '#f0f0f0';
                                                }
                                            }}
                                            onMouseLeave={(e) => {
                                                if (selectedRepo !== repo.full_name) {
                                                    e.currentTarget.style.backgroundColor = 'transparent';
                                                }
                                            }}
                                        >
                                            <div style={{ fontWeight: 500, marginBottom: '2px' }}>
                                                {repo.name}
                                            </div>
                                            {repo.description && (
                                                <div style={{
                                                    fontSize: '10px',
                                                    opacity: 0.7,
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis',
                                                    whiteSpace: 'nowrap'
                                                }}>
                                                    {repo.description}
                                                </div>
                                            )}
                                        </button>
                                    ))
                                )}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* File Browser with Expandable Directories */}
            <div style={{
                flex: 1,
                overflow: 'auto',
                padding: '8px'
            }}>
                {/* Path indicator */}
                {files.length > 0 && (
                    <div style={{
                        padding: '8px 12px',
                        marginBottom: '8px',
                        backgroundColor: darkMode ? '#2d2d30' : '#f6f8fa',
                        borderRadius: '4px',
                        fontSize: '11px',
                        color: darkMode ? '#888' : '#666',
                        border: `1px solid ${darkMode ? '#4a4a4a' : '#d0d7de'}`
                    }}>
                        📁 {isLoggedIn ? `@${username}` : '@guest'} / coderunner files
                        {selectedRepo && (
                            <div style={{ marginTop: '2px', color: darkMode ? '#4caf50' : '#2e7d32' }}>
                                🔗 Repository: {selectedRepo}
                            </div>
                        )}
                    </div>
                )}
                
                {(() => {
                    const { organized, rootFiles } = organizeFilesByDirectory(files);
                    const allDirectories = Object.keys(organized);
                    
                    return (
                        <div>
                            {/* Root files first */}
                            {rootFiles.map((file, index) => (
                                <div
                                    key={`root-${index}`}
                                    style={{
                                        position: 'relative',
                                        marginBottom: '2px'
                                    }}
                                >
                                    <button
                                        onClick={() => openFile(file)}
                                        style={{
                                            width: '100%',
                                            padding: '8px 12px',
                                            background: currentFile?.path === file.path 
                                                ? (darkMode ? '#37373d' : '#e8f4fd') 
                                                : 'none',
                                            border: 'none',
                                            color: currentFile?.path === file.path 
                                                ? (darkMode ? '#ffffff' : '#0366d6')
                                                : (darkMode ? '#cccccc' : '#24292e'),
                                            cursor: 'pointer',
                                            fontSize: '13px',
                                            textAlign: 'left',
                                            borderRadius: '4px',
                                            transition: 'background-color 0.2s',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between'
                                        }}
                                        onMouseEnter={(e) => {
                                            if (currentFile?.path !== file.path) {
                                                e.currentTarget.style.backgroundColor = darkMode ? '#3e3e42' : '#f0f0f0';
                                            }
                                        }}
                                        onMouseLeave={(e) => {
                                            if (currentFile?.path !== file.path) {
                                                e.currentTarget.style.backgroundColor = 'transparent';
                                            }
                                        }}
                                    >
                                        <span>📄 {file.name}</span>
                                        {!file.isDir && (
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    if (confirm(`Are you sure you want to delete "${file.name}"?`)) {
                                                        deleteFile(file);
                                                    }
                                                }}
                                                style={{
                                                    background: 'none',
                                                    border: 'none',
                                                    color: darkMode ? '#ff6b6b' : '#dc3545',
                                                    cursor: 'pointer',
                                                    padding: '2px 4px',
                                                    borderRadius: '3px',
                                                    fontSize: '12px',
                                                    opacity: 0.7,
                                                    transition: 'opacity 0.2s, background-color 0.2s'
                                                }}
                                                onMouseEnter={(e) => {
                                                    e.currentTarget.style.opacity = '1';
                                                    e.currentTarget.style.backgroundColor = darkMode ? 'rgba(255, 107, 107, 0.1)' : 'rgba(220, 53, 69, 0.1)';
                                                }}
                                                onMouseLeave={(e) => {
                                                    e.currentTarget.style.opacity = '0.7';
                                                    e.currentTarget.style.backgroundColor = 'transparent';
                                                }}
                                                title="Delete file"
                                            >
                                                🗑️
                                            </button>
                                        )}
                                    </button>
                                </div>
                            ))}
                            
                            {/* Directories and their files */}
                            {allDirectories.map((dirPath) => {
                                const dirName = dirPath.split('/').pop() || dirPath;
                                const isExpanded = expandedDirs.has(dirPath);
                                const dirFiles = organized[dirPath];
                                
                                return (
                                    <div key={dirPath} style={{ marginBottom: '4px' }}>
                                        {/* Directory header */}
                                        <button
                                            onClick={() => toggleDirExpansion(dirPath)}
                                            style={{
                                                width: '100%',
                                                padding: '8px 12px',
                                                background: 'none',
                                                border: 'none',
                                                color: darkMode ? '#888' : '#666',
                                                cursor: 'pointer',
                                                fontSize: '13px',
                                                textAlign: 'left',
                                                borderRadius: '4px',
                                                transition: 'background-color 0.2s',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '6px',
                                                fontWeight: 500
                                            }}
                                            onMouseEnter={(e) => {
                                                e.currentTarget.style.backgroundColor = darkMode ? '#3e3e42' : '#f0f0f0';
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.backgroundColor = 'transparent';
                                            }}
                                        >
                                            <span style={{ fontSize: '12px', width: '12px', textAlign: 'center' }}>
                                                {isExpanded ? '▼' : '▶'}
                                            </span>
                                            📁 {dirName}
                                            <span style={{ 
                                                marginLeft: 'auto', 
                                                fontSize: '11px', 
                                                opacity: 0.6,
                                                color: darkMode ? '#666' : '#999'
                                            }}>
                                                ({dirFiles.length})
                                            </span>
                                        </button>
                                        
                                        {/* Directory files - shown when expanded */}
                                        {isExpanded && (
                                            <>
                                                {/* Plus button to create new file in this directory */}
                                                <div style={{
                                                    position: 'relative',
                                                    marginBottom: '1px'
                                                }}>
                                                    <button
                                                        onClick={() => createNewFileInDirectory(dirPath)}
                                                        style={{
                                                            width: '100%',
                                                            padding: '6px 12px 6px 20px',
                                                            background: 'none',
                                                            border: 'none',
                                                            borderLeft: `2px solid ${darkMode ? '#4a4a4a' : '#d0d7de'}`,
                                                            marginLeft: '12px',
                                                            color: darkMode ? '#4caf50' : '#28a745',
                                                            cursor: 'pointer',
                                                            fontSize: '12px',
                                                            textAlign: 'left',
                                                            borderRadius: '0 4px 4px 0',
                                                            transition: 'background-color 0.2s',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: '6px',
                                                            fontWeight: 500
                                                        }}
                                                        onMouseEnter={(e) => {
                                                            e.currentTarget.style.backgroundColor = darkMode ? 'rgba(76, 175, 80, 0.1)' : 'rgba(40, 167, 69, 0.1)';
                                                        }}
                                                        onMouseLeave={(e) => {
                                                            e.currentTarget.style.backgroundColor = 'transparent';
                                                        }}
                                                        title="Create new file"
                                                    >
                                                        <span style={{ fontSize: '14px' }}>+</span>
                                                        <span style={{ fontSize: '11px', opacity: 0.8 }}>New file</span>
                                                    </button>
                                                </div>
                                                
                                                {/* Existing files in directory */}
                                                {dirFiles.map((file, fileIndex) => (
                                                    <div
                                                        key={`${dirPath}-${fileIndex}`}
                                                        style={{
                                                            position: 'relative',
                                                            marginBottom: '1px'
                                                        }}
                                                    >
                                                        <button
                                                            onClick={() => openFile(file)}
                                                            style={{
                                                                width: '100%',
                                                                padding: '6px 12px 6px 20px',
                                                                background: currentFile?.path === file.path 
                                                                    ? (darkMode ? '#37373d' : '#e8f4fd') 
                                                                    : 'none',
                                                                border: 'none',
                                                                borderLeft: `2px solid ${darkMode ? '#4a4a4a' : '#d0d7de'}`,
                                                                marginLeft: '12px',
                                                                color: currentFile?.path === file.path 
                                                                    ? (darkMode ? '#ffffff' : '#0366d6')
                                                                    : (darkMode ? '#cccccc' : '#24292e'),
                                                                cursor: 'pointer',
                                                                fontSize: '12px',
                                                                textAlign: 'left',
                                                                borderRadius: '0 4px 4px 0',
                                                                transition: 'background-color 0.2s',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'space-between'
                                                            }}
                                                            onMouseEnter={(e) => {
                                                                if (currentFile?.path !== file.path) {
                                                                    e.currentTarget.style.backgroundColor = darkMode ? '#3e3e42' : '#f0f0f0';
                                                                }
                                                            }}
                                                            onMouseLeave={(e) => {
                                                                if (currentFile?.path !== file.path) {
                                                                    e.currentTarget.style.backgroundColor = 'transparent';
                                                                }
                                                            }}
                                                        >
                                                            <span>📄 {file.name}</span>
                                                            {!file.isDir && (
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        if (confirm(`Are you sure you want to delete "${file.name}"?`)) {
                                                                            deleteFile(file);
                                                                        }
                                                                    }}
                                                                    style={{
                                                                        background: 'none',
                                                                        border: 'none',
                                                                        color: darkMode ? '#ff6b6b' : '#dc3545',
                                                                        cursor: 'pointer',
                                                                        padding: '2px 4px',
                                                                        borderRadius: '3px',
                                                                        fontSize: '11px',
                                                                        opacity: 0.7,
                                                                        transition: 'opacity 0.2s, background-color 0.2s'
                                                                    }}
                                                                    onMouseEnter={(e) => {
                                                                        e.currentTarget.style.opacity = '1';
                                                                        e.currentTarget.style.backgroundColor = darkMode ? 'rgba(255, 107, 107, 0.1)' : 'rgba(220, 53, 69, 0.1)';
                                                                    }}
                                                                    onMouseLeave={(e) => {
                                                                        e.currentTarget.style.opacity = '0.7';
                                                                        e.currentTarget.style.backgroundColor = 'transparent';
                                                                    }}
                                                                    title="Delete file"
                                                                >
                                                                    🗑️
                                                                </button>
                                                            )}
                                                        </button>
                                                    </div>
                                                ))}
                                            </>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    );
                })()}
            </div>
        </div>
    );

    // Main layout
    return (
        <div style={{
            height: '100vh',
            backgroundColor: darkMode ? '#1e1e1e' : '#ffffff',
            color: darkMode ? '#cccccc' : '#24292e',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            display: 'flex',
            flexDirection: 'column'
        }}>
            <style>{`
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            `}</style>
            
            {/* Sidebar */}
            {renderSidebar()}
            
            {/* Sidebar Overlay */}
            {isSidebarOpen && (
                <div 
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        width: '100vw',
                        height: '100vh',
                        backgroundColor: 'rgba(0, 0, 0, 0.5)',
                        zIndex: 999
                    }}
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* Header */}
            <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: isMobile ? '8px 12px' : '12px 16px',
        backgroundColor: darkMode ? '#252526' : '#f8f9fa',
        borderBottom: `1px solid ${darkMode ? '#3e3e42' : '#e1e4e8'}`,
        fontSize: '14px',
        minHeight: isMobile ? '44px' : '48px',
        boxSizing: 'border-box'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '8px' : '12px' }}>
                    {/* Hamburger Menu */}
                    <button
                        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                        style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            color: darkMode ? '#cccccc' : '#24292e',
                            padding: '4px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '3px',
                            width: '20px',
                            height: '16px'
                        }}
                    >
                        <div style={{
                            width: '100%',
                            height: '2px',
                            backgroundColor: 'currentColor',
                            borderRadius: '1px'
                        }}></div>
                        <div style={{
                            width: '100%',
                            height: '2px',
                            backgroundColor: 'currentColor',
                            borderRadius: '1px'
                        }}></div>
                        <div style={{
                            width: '100%',
                            height: '2px',
                            backgroundColor: 'currentColor',
                            borderRadius: '1px'
                        }}></div>
                    </button>
                    
                    {/* Title - only show on desktop */}
                    {!isMobile && (
                        <h3 style={{ margin: 0, fontWeight: 600, fontSize: '14px' }}>
                            CodeRunner
                        </h3>
                    )}

                    {/* Tab Navigation */}
                    <div style={{ display: 'flex', gap: '4px' }}>
                        <button
                            onClick={() => setActiveTab('chat')}
                            style={{
                                background: activeTab === 'chat' 
                                    ? (darkMode ? '#37373d' : '#e8f4fd')
                                    : 'none',
                                border: `1px solid ${darkMode ? '#4a4a4a' : '#d0d7de'}`,
                                color: activeTab === 'chat'
                                    ? (darkMode ? '#ffffff' : '#0366d6')
                                    : (darkMode ? '#cccccc' : '#24292e'),
                                cursor: 'pointer',
        padding: isMobile ? '6px 8px' : '6px 12px',
                                borderRadius: '6px',
        fontSize: isMobile ? '16px' : '12px',
                                fontWeight: 500,
                                display: 'flex',
                                alignItems: 'center',
                                gap: isMobile ? '0' : '4px'
                            }}
                            title="Chat"
                        >
                            {isMobile ? '💬' : '💬 Chat'}
                        </button>
                        <button
                            onClick={() => setActiveTab('code')}
                            style={{
                                background: activeTab === 'code' 
                                    ? (darkMode ? '#37373d' : '#e8f4fd')
                                    : 'none',
                                border: `1px solid ${darkMode ? '#4a4a4a' : '#d0d7de'}`,
                                color: activeTab === 'code'
                                    ? (darkMode ? '#ffffff' : '#0366d6')
                                    : (darkMode ? '#cccccc' : '#24292e'),
                                cursor: 'pointer',
                                padding: isMobile ? '6px 8px' : '6px 12px',
        borderRadius: '6px',
                                fontSize: isMobile ? '16px' : '12px',
                                fontWeight: 500,
                                display: 'flex',
                                alignItems: 'center',
                                gap: isMobile ? '0' : '4px'
                            }}
                            title="Code"
                        >
                            {isMobile ? '📝' : '📝 Code'}
                        </button>
                    </div>
                    
                    {/* Current File Indicator - only show on desktop when in code tab */}
                    {!isMobile && currentFile && activeTab === 'code' && (
                        <div style={{
                            fontSize: '12px',
                            color: darkMode ? '#888' : '#666',
                            backgroundColor: darkMode ? '#37373d' : '#e8f4fd',
                            padding: '2px 8px',
                            borderRadius: '12px',
                            border: `1px solid ${darkMode ? '#4a4a4a' : '#c8e1ff'}`
                        }}>
                            {currentFile.name}
                        </div>
                    )}

                    {/* Save Status - only show on desktop */}
                    {!isMobile && saveStatus && (
                        <div style={{
        fontSize: '12px',
                            color: saveStatus.includes('✓') ? '#28a745' : '#dc3545',
                            fontWeight: 500
                        }}>
                            {saveStatus}
                        </div>
                    )}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '6px' : '8px' }}>
                    {/* New File Button */}
                    <button
                        onClick={createNewFile}
                        style={{
                            background: darkMode ? '#0e4429' : '#238636',
                            color: '#ffffff',
                            border: 'none',
                            padding: isMobile ? '6px 8px' : '6px 12px',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: isMobile ? '16px' : '12px',
                            fontWeight: 500,
                            display: 'flex',
                            alignItems: 'center',
                            gap: isMobile ? '0' : '4px'
                        }}
                        title="New File"
                    >
                        {isMobile ? '+' : '+ New File'}
                    </button>

                    {/* Login/Logout */}
                    {isLoggedIn ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '4px' : '8px' }}>
                            {!isMobile && (
                                <span style={{ fontSize: '12px', color: darkMode ? '#888' : '#666' }}>
                                    @{username}
                                </span>
                            )}
                            <button
                                onClick={handleLogout}
                                style={{
                                    background: 'none',
                                    border: `1px solid ${darkMode ? '#4a4a4a' : '#d0d7de'}`,
                                    color: darkMode ? '#cccccc' : '#24292e',
                                    padding: isMobile ? '6px 8px' : '4px 8px',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    fontSize: isMobile ? '11px' : '12px'
                                }}
                                title={isMobile ? `Logout @${username}` : 'Logout'}
                            >
                                {isMobile ? '↗' : 'Logout'}
                            </button>
                        </div>
                    ) : (
                        <button
                            onClick={() => setShowLogin(true)}
                            style={{
                                background: darkMode ? '#1f2937' : '#f8f9fa',
                                border: `1px solid ${darkMode ? '#4a4a4a' : '#d0d7de'}`,
                                color: darkMode ? '#cccccc' : '#24292e',
                                padding: isMobile ? '6px 8px' : '6px 12px',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontSize: isMobile ? '11px' : '12px',
                                fontWeight: 500,
        display: 'flex',
        alignItems: 'center',
                                gap: isMobile ? '2px' : '6px'
                            }}
                        >
                            {isMobile ? (
                                <>
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/>
                                    </svg>
                                    Login
                                </>
                            ) : (
                                <>
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/>
                                    </svg>
                                    Login with GitHub
                                </>
                            )}
                        </button>
                    )}
                </div>
            </div>

            {/* Main Content */}
            <div style={{
                flex: 1,
                minHeight: 0,
                position: 'relative',
                display: 'flex',
                flexDirection: 'column'
            }}>
                {/* Output Panel - Now at Top */}
                <div style={{
                    height: outputHeight,
                    minHeight: outputHeight,
                    display: 'flex',
                    flexDirection: 'column',
                    backgroundColor: darkMode ? '#1a1a1a' : '#f9f9f9',
                    border: `1px solid ${darkMode ? '#4a4a4a' : '#d0d7de'}`,
                    borderBottom: 'none',
                    borderRadius: '8px 8px 0 0',
                    overflow: 'hidden',
                    boxShadow: darkMode ? '0 4px 12px rgba(0,0,0,0.3)' : '0 4px 12px rgba(0,0,0,0.1)'
                }}>
                    {/* Output Header */}
                    <div style={{
                        padding: '12px 16px',
                        backgroundColor: darkMode ? '#2d2d2d' : '#e8f4fd',
                        borderBottom: `2px solid ${darkMode ? '#4a4a4a' : '#c8e1ff'}`,
                        fontSize: '14px',
                        fontWeight: 700,
                        color: darkMode ? '#ffffff' : '#0366d6',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        position: 'relative'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontSize: '16px' }}>📺</span>
                            <span>Live Output</span>
                            <span style={{ 
                                fontSize: '11px', 
                                opacity: 0.6,
                                color: darkMode ? '#888' : '#666' 
                            }}>
                                (auto-updates on code changes)
                            </span>
                        </div>
                        {isBuildLoading ? (
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                fontSize: '11px',
                                color: darkMode ? '#ffa500' : '#e65100',
                                fontWeight: 500,
                                background: darkMode ? 'rgba(255,165,0,0.1)' : 'rgba(230,81,0,0.1)',
                                padding: '2px 6px',
                                borderRadius: '4px'
                            }}>
                                <div style={{
                                    width: '10px',
                                    height: '10px',
                                    border: '2px solid rgba(255,165,0,0.3)',
                                    borderTop: '2px solid currentColor',
                                    borderRadius: '50%',
                                    animation: 'spin 1s linear infinite'
                                }}></div>
                                Building...
                            </div>
                        ) : !esbuildReady ? (
                            <span style={{
                                fontSize: '11px',
                                color: darkMode ? '#ffa500' : '#e65100',
                                fontWeight: 500,
                                background: darkMode ? 'rgba(255,165,0,0.1)' : 'rgba(230,81,0,0.1)',
                                padding: '2px 6px',
                                borderRadius: '4px'
                            }}>
                                Initializing...
                            </span>
                        ) : (
                            <span style={{
                                fontSize: '11px',
                                color: darkMode ? '#4caf50' : '#2e7d32',
                                fontWeight: 500,
                                background: darkMode ? 'rgba(76,175,80,0.1)' : 'rgba(46,125,50,0.1)',
                                padding: '2px 6px',
                                borderRadius: '4px'
                            }}>
                                Live
                            </span>
                        )}
                    </div>

                    {/* Output Content */}
                    <div style={{ 
                        flex: 1, 
                        minHeight: 0,
                        position: 'relative',
                        background: darkMode ? '#1e1e1e' : '#ffffff'
                    }}>
                        <iframe
                            ref={outputFrameRef}
                            style={{ 
                                width: '100%', 
                                height: '100%', 
                                border: 'none',
                                backgroundColor: 'transparent'
                            }}
                            title="Code Output"
                            // sandbox="allow-scripts allow-same-origin"
                            srcDoc={`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Code Output</title>
    <style>
        body { 
            margin: 0; 
            padding: 16px; 
            font-family: system-ui, -apple-system, sans-serif;
            background: ${darkMode ? '#1e1e1e' : '#ffffff'};
            color: ${darkMode ? '#cccccc' : '#24292e'};
            min-height: 100vh;
        }
        #root { min-height: calc(100vh - 32px); }
    </style>
</head>
<body>
    <div style="
        display: flex; 
        align-items: center; 
        justify-content: center; 
        height: ${isMobile ? '180px' : '220px'}; 
        background: ${darkMode ? 'linear-gradient(135deg, #2a2a2a 0%, #1e1e1e 100%)' : 'linear-gradient(135deg, #f0f8ff 0%, #ffffff 100%)'};
        border: 2px dashed ${darkMode ? '#555' : '#ddd'};
        border-radius: 12px;
        color: ${darkMode ? '#888' : '#666'};
        text-align: center;
        flex-direction: column;
        gap: ${isMobile ? '8px' : '12px'};
        margin: ${isMobile ? '8px' : '16px'};
    ">
        <div style="font-size: ${isMobile ? '24px' : '32px'}; opacity: 0.7;">⚡</div>
        <div style="font-size: ${isMobile ? '14px' : '16px'}; font-weight: 500;">Waiting for code...</div>
        <div style="font-size: ${isMobile ? '11px' : '13px'}; opacity: 0.7;">Output will appear automatically when you write code</div>
    </div>
</body>
</html>
                            `}
                        />
                    </div>
                </div>

                {/* Drag Handle for Resizing Output */}
                <div 
                    onMouseDown={handleDragStart}
                    style={{
                        width: '100%',
                        height: '8px',
                        backgroundColor: isDragging ? (darkMode ? '#7c7c7c' : '#a0a7ae') : (darkMode ? '#5c5c5c' : '#d0d7de'),
                        cursor: 'ns-resize',
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        transition: isDragging ? 'none' : 'background-color 0.2s',
                        position: 'relative',
                        flexShrink: 0
                    }}
                >
                    {/* Drag Handle Visual Indicator */}
                    <div style={{
                        width: '40px',
                        height: '3px',
                        backgroundColor: isDragging ? (darkMode ? '#ffffff' : '#666666') : (darkMode ? '#888888' : '#999999'),
                        borderRadius: '2px',
                        transition: isDragging ? 'none' : 'background-color 0.2s'
                    }} />
                </div>

                {/* Horizontal Divider */}
                <div style={{ 
                    width: '100%',
                    height: '2px',
                    backgroundColor: darkMode ? '#5c5c5c' : '#d0d7de',
                    flexShrink: 0
                }} />

                {/* Chat/Code Content Area - Now at Bottom */}
                <div style={{
                    flex: 1,
                    minHeight: 0,
                    display: 'flex',
                    flexDirection: 'column'
                }}>
                    {activeTab === 'chat' ? (
                        /* Chat Interface */
                        <div style={{
                            flex: 1,
                            display: 'flex',
                            flexDirection: 'column',
                            maxHeight: '100%'
                        }}>
                            {/* Chat Messages */}
                            <div 
                                ref={chatMessagesRef}
                                style={{
                                    flex: 1,
                                    overflow: 'auto',
                                    padding: '16px',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '16px'
                                }}
                            >
                                {chatMessages.length === 0 ? (
                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        height: '100%',
                                        color: darkMode ? '#666' : '#999',
                                        textAlign: 'center'
                                    }}>
                                        <div>
                                            <div style={{ fontSize: '24px', marginBottom: '8px' }}>💬</div>
                                            <div>Start a conversation with the AI assistant</div>
                                            <div style={{ fontSize: '12px', marginTop: '4px' }}>
                                                Ask questions about your code or request help
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    chatMessages.map((message) => (
                                        <div
                                            key={message.id}
                                            style={{
                                                alignSelf: message.role === 'user' ? 'flex-end' : 'flex-start',
                                                maxWidth: '80%',
                                                padding: '12px 16px',
                                                borderRadius: '16px',
                                                backgroundColor: message.role === 'user'
                                                    ? (darkMode ? '#0366d6' : '#0366d6')
                                                    : (darkMode ? '#37373d' : '#f0f0f0'),
                                                color: message.role === 'user'
                                                    ? '#ffffff'
                                                    : (darkMode ? '#cccccc' : '#24292e'),
                                                wordBreak: 'break-word'
                                            }}
                                        >
                                            <div style={{ fontSize: '14px', lineHeight: '1.5' }}>
                                                {message.content}
                                            </div>
                                            <div style={{
                                                fontSize: '11px',
                                                opacity: 0.7,
                                                marginTop: '4px'
                                            }}>
                                                {message.timestamp.toLocaleTimeString()}
                                            </div>
                                        </div>
                                    ))
                                )}
                                
                                {isChatLoading && (
                                    <div style={{
                                        alignSelf: 'flex-start',
                                        maxWidth: '80%',
                                        padding: '12px 16px',
                                        borderRadius: '16px',
                                        backgroundColor: darkMode ? '#37373d' : '#f0f0f0',
                                        color: darkMode ? '#cccccc' : '#24292e'
                                    }}>
                                        <div style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '8px'
                                        }}>
                                            <div style={{
                                                width: '16px',
                                                height: '16px',
                                                border: `2px solid ${darkMode ? '#666' : '#ccc'}`,
                                                borderTop: `2px solid ${darkMode ? '#cccccc' : '#666'}`,
                                                borderRadius: '50%',
                                                animation: 'spin 1s linear infinite'
                                            }}></div>
                                            AI is thinking...
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Chat Input */}
                            <div style={{
                                padding: '16px',
                                borderTop: `1px solid ${darkMode ? '#3e3e42' : '#e1e4e8'}`,
                                backgroundColor: darkMode ? '#252526' : '#f8f9fa'
                            }}>
                                <div style={{
                                    display: 'flex',
                                    gap: '8px',
                                    alignItems: 'flex-end'
                                }}>
                                    <textarea
                                        value={chatInput}
                                        onChange={(e) => setChatInput(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' && !e.shiftKey) {
                                                e.preventDefault();
                                                sendChatMessage(chatInput);
                                            }
                                        }}
                                        placeholder="Ask the AI assistant about your code..."
                                        style={{
                                            flex: 1,
                                            minHeight: '40px',
                                            maxHeight: '120px',
                                            padding: '8px 12px',
                                            border: `1px solid ${darkMode ? '#4a4a4a' : '#d0d7de'}`,
                                            borderRadius: '8px',
                                            backgroundColor: darkMode ? '#1e1e1e' : '#ffffff',
                                            color: darkMode ? '#cccccc' : '#24292e',
                                            fontSize: '14px',
                                            resize: 'vertical',
                                            fontFamily: 'inherit'
                                        }}
                                    />
                                    <button
                                        onClick={() => sendChatMessage(chatInput)}
                                        disabled={!chatInput.trim() || isChatLoading}
                                        style={{
                                            background: darkMode ? '#0366d6' : '#0366d6',
                                            color: '#ffffff',
                                            border: 'none',
                                            padding: '10px 16px',
                                            borderRadius: '8px',
                                            cursor: chatInput.trim() && !isChatLoading ? 'pointer' : 'not-allowed',
                                            fontSize: '14px',
                                            fontWeight: 500,
                                            opacity: chatInput.trim() && !isChatLoading ? 1 : 0.6
                                        }}
                                    >
                                        Send
                                    </button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        /* Code Editor */
                        <div style={{
                            flex: 1,
                            display: 'flex',
                            flexDirection: 'column',
                            minHeight: 0
                        }}>
                            {error && (
                                <div style={{
                                    backgroundColor: '#fee',
                                    border: '1px solid #fcc',
                                    color: '#c33',
                                    padding: '12px',
                                    margin: '8px',
                                    borderRadius: '4px',
                                    fontSize: '14px',
                                    fontFamily: 'monospace'
                                }}>
                                    {error}
                                </div>
                            )}
                            <MonacoEditor
                                language={language}
                                theme={darkMode ? 'vs-dark' : 'vs-light'}
                                value={code}
                                onChange={(value) => setCode(value || '')}
                                onMount={(editor) => {
                                    editorRef.current = editor;
                                    editor.focus();
                                }}
                                options={{
                                    minimap: { enabled: false },
                                    scrollBeyondLastLine: false,
                                    fontSize: 14,
                                    lineNumbers: 'on',
                                    roundedSelection: false,
                                    scrollbar: {
                                        vertical: 'visible',
                                        horizontal: 'visible',
                                    },
                                    automaticLayout: true,
                                    wordWrap: 'on',
                                    tabSize: 2,
                                    insertSpaces: true,
                                    padding: { top: 16, bottom: 16 },
                                }}
                            />
                        </div>
                    )}
                </div>
            </div>

            {/* Login Modal */}
            {showLogin && (
                <div style={{ 
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    width: '100vw',
                    height: '100vh',
                    backgroundColor: 'rgba(0, 0, 0, 0.5)',
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    zIndex: 2000
                }}>
                    <div style={{
                        backgroundColor: darkMode ? '#252526' : '#ffffff',
                        padding: '32px',
                        borderRadius: '12px',
                        width: '90%',
                        maxWidth: '400px',
                        border: `1px solid ${darkMode ? '#3e3e42' : '#e1e4e8'}`,
                        boxShadow: darkMode ? '0 8px 32px rgba(0,0,0,0.4)' : '0 8px 32px rgba(0,0,0,0.1)'
                    }}>
                        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                            <div style={{ 
                                fontSize: '48px', 
                                marginBottom: '16px'
                            }}>
                                🚀
                            </div>
                            <h3 style={{
                                margin: '0 0 8px 0',
                                fontSize: '24px',
                                fontWeight: 600,
                                color: darkMode ? '#ffffff' : '#24292e'
                            }}>
                                Welcome to CodeRunner
                            </h3>
                            <p style={{
                                margin: '0',
                                fontSize: '14px',
                                color: darkMode ? '#888' : '#666',
                                lineHeight: '1.5'
                            }}>
                                Sign in with GitHub to save and manage your code files
                            </p>
                        </div>
                        
                        <button
                            onClick={handleGithubLogin}
                            style={{
                                width: '100%',
                                padding: '12px 24px',
                                backgroundColor: '#24292e',
                                color: '#ffffff',
                                border: 'none',
                                borderRadius: '8px',
                                fontSize: '16px',
                                fontWeight: 500,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '12px',
                                marginBottom: '16px',
                                transition: 'background-color 0.2s'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = '#1c2128';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = '#24292e';
                            }}
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/>
                            </svg>
                            Continue with GitHub
                        </button>
                        
                        <div style={{ 
                            display: 'flex',
                            justifyContent: 'center'
                        }}>
                            <button
                                onClick={() => setShowLogin(false)}
                                style={{
                                    background: 'none',
                                    border: `1px solid ${darkMode ? '#4a4a4a' : '#d0d7de'}`,
                                    color: darkMode ? '#cccccc' : '#24292e',
                                    padding: '8px 16px',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    fontSize: '14px'
                                }}
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// Auto-initialize if there's a container element
const container = document.getElementById('code-runner');
if (container) {
    const root = createRoot(container);
    const propsAttr = container.getAttribute('data-props');
    const props = propsAttr ? JSON.parse(propsAttr) : {};
    
    root.render(<CodeRunner {...props} />);
}

export default CodeRunner;