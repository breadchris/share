import React, { useState, useEffect } from 'react';
import {
    // HTTP API functions
    CreateTodo as HTTPCreateTodo,
    ListTodos as HTTPListTodos,
    UpdateTodo as HTTPUpdateTodo,
    DeleteTodo as HTTPDeleteTodo,
    // WebSocket client
    wsClient,
    // Types
    Todo,
    TodoStatus,
    CreateTodoRequest,
    ListTodosRequest,
    UpdateTodoRequest,
    DeleteTodoRequest,
    FetchOptions
} from './api';

interface WebSocketDemoProps {
    userId: string;
    baseURL?: string;
}

const WebSocketDemo: React.FC<WebSocketDemoProps> = ({ userId, baseURL = '/user' }) => {
    const [todos, setTodos] = useState<Todo[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [newTodoTitle, setNewTodoTitle] = useState('');
    const [newTodoDescription, setNewTodoDescription] = useState('');
    const [transport, setTransport] = useState<'http' | 'websocket'>('websocket');
    const [connectionStatus, setConnectionStatus] = useState<string>('disconnected');
    const [eventLog, setEventLog] = useState<string[]>([]);

    const apiOptions: FetchOptions = { baseURL };

    // WebSocket connection status monitoring
    useEffect(() => {
        const checkConnection = () => {
            setConnectionStatus(wsClient.isConnected ? 'connected' : 'disconnected');
        };

        // Check connection status every second
        const interval = setInterval(checkConnection, 1000);
        return () => clearInterval(interval);
    }, []);

    // WebSocket event listeners
    useEffect(() => {
        const handleTodoUpdated = (todo: Todo) => {
            console.log('Todo updated event:', todo);
            setEventLog(prev => [...prev, `Todo updated: ${todo.title}`]);
            setTodos(prev => prev.map(t => t.id === todo.id ? todo : t));
        };

        const handleTodoDeleted = (data: { id: string }) => {
            console.log('Todo deleted event:', data);
            setEventLog(prev => [...prev, `Todo deleted: ${data.id}`]);
            setTodos(prev => prev.filter(t => t.id !== data.id));
        };

        // Subscribe to WebSocket events
        wsClient.on('todo_updated', handleTodoUpdated);
        wsClient.on('todo_deleted', handleTodoDeleted);

        return () => {
            wsClient.off('todo_updated', handleTodoUpdated);
            wsClient.off('todo_deleted', handleTodoDeleted);
        };
    }, []);

    const loadTodos = async () => {
        try {
            setLoading(true);
            setError(null);
            const request: ListTodosRequest = { user_id: userId };
            
            let response;
            if (transport === 'websocket') {
                response = await wsClient.listTodos(request);
            } else {
                const httpResponse = await HTTPListTodos(request, apiOptions);
                response = httpResponse.data;
            }
            
            setTodos(response.todos || []);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load todos');
        } finally {
            setLoading(false);
        }
    };

    const createTodo = async () => {
        if (!newTodoTitle.trim()) return;

        try {
            setLoading(true);
            const request: CreateTodoRequest = { 
                title: newTodoTitle,
                description: newTodoDescription || undefined
            };
            
            let response;
            if (transport === 'websocket') {
                response = await wsClient.createTodo(request);
            } else {
                const httpResponse = await HTTPCreateTodo(request, apiOptions);
                response = httpResponse.data;
            }
            
            setTodos(prev => [...prev, response.todo]);
            setNewTodoTitle('');
            setNewTodoDescription('');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to create todo');
        } finally {
            setLoading(false);
        }
    };

    const updateTodoStatus = async (id: string, status: TodoStatus) => {
        try {
            const request: UpdateTodoRequest = { id, status };
            
            let response;
            if (transport === 'websocket') {
                response = await wsClient.updateTodo(request);
            } else {
                const httpResponse = await HTTPUpdateTodo(request, apiOptions);
                response = httpResponse.data;
                // For HTTP, manually update the local state
                setTodos(prev => prev.map(todo => 
                    todo.id === id ? response.todo : todo
                ));
            }
            
            // For WebSocket, the update will come via event
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to update todo');
        }
    };

    const deleteTodo = async (id: string) => {
        if (!confirm('Are you sure you want to delete this todo?')) return;

        try {
            const request: DeleteTodoRequest = { id };
            
            if (transport === 'websocket') {
                await wsClient.deleteTodo(request);
                // For WebSocket, the deletion will come via event
            } else {
                await HTTPDeleteTodo(request, apiOptions);
                // For HTTP, manually update the local state
                setTodos(prev => prev.filter(todo => todo.id !== id));
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to delete todo');
        }
    };

    const clearEventLog = () => {
        setEventLog([]);
    };

    useEffect(() => {
        loadTodos();
    }, [userId, transport]);

    return (
        <div className="max-w-6xl mx-auto p-6">
            <h1 className="text-3xl font-bold mb-8">WebSocket Demo - Todo Management</h1>

            {/* Transport Selection */}
            <div className="mb-6 p-4 bg-blue-50 rounded-lg">
                <h2 className="text-lg font-semibold mb-3">Transport Selection</h2>
                <div className="flex items-center space-x-4">
                    <label className="flex items-center">
                        <input
                            type="radio"
                            value="websocket"
                            checked={transport === 'websocket'}
                            onChange={(e) => setTransport(e.target.value as 'websocket')}
                            className="mr-2"
                        />
                        WebSocket (Real-time)
                    </label>
                    <label className="flex items-center">
                        <input
                            type="radio"
                            value="http"
                            checked={transport === 'http'}
                            onChange={(e) => setTransport(e.target.value as 'http')}
                            className="mr-2"
                        />
                        HTTP (Traditional)
                    </label>
                    <div className="flex items-center ml-4">
                        <span className="text-sm text-gray-600">WebSocket Status:</span>
                        <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${
                            connectionStatus === 'connected' 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-red-100 text-red-800'
                        }`}>
                            {connectionStatus}
                        </span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Todo Interface */}
                <div className="lg:col-span-2">
                    {error && (
                        <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-md">
                            <strong>Error:</strong> {error}
                        </div>
                    )}

                    {/* Create Todo Form */}
                    <div className="mb-8 p-6 bg-gray-50 rounded-lg">
                        <h2 className="text-xl font-semibold mb-4">Create New Todo</h2>
                        <div className="space-y-4">
                            <div>
                                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                                    Title *
                                </label>
                                <input
                                    id="title"
                                    type="text"
                                    value={newTodoTitle}
                                    onChange={(e) => setNewTodoTitle(e.target.value)}
                                    placeholder="Enter todo title"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    disabled={loading}
                                />
                            </div>
                            <div>
                                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                                    Description
                                </label>
                                <textarea
                                    id="description"
                                    value={newTodoDescription}
                                    onChange={(e) => setNewTodoDescription(e.target.value)}
                                    placeholder="Enter todo description (optional)"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    rows={3}
                                    disabled={loading}
                                />
                            </div>
                            <button
                                onClick={createTodo}
                                disabled={loading || !newTodoTitle.trim()}
                                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? 'Creating...' : `Create Todo (${transport.toUpperCase()})`}
                            </button>
                        </div>
                    </div>

                    {/* Todos List */}
                    <div>
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-semibold">
                                Your Todos ({todos.length})
                            </h2>
                            <button
                                onClick={loadTodos}
                                disabled={loading}
                                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50"
                            >
                                {loading ? 'Loading...' : 'Refresh'}
                            </button>
                        </div>

                        {loading && todos.length === 0 ? (
                            <div className="text-center py-8">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                                <p className="mt-2 text-gray-600">Loading todos...</p>
                            </div>
                        ) : todos.length === 0 ? (
                            <div className="text-center py-8 text-gray-500">
                                <p>No todos found. Create your first todo above!</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {todos.map((todo) => (
                                    <div
                                        key={todo.id}
                                        className="p-6 bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow"
                                    >
                                        <div className="flex justify-between items-start">
                                            <div className="flex-1">
                                                <h3 className="text-lg font-semibold mb-2">{todo.title}</h3>
                                                {todo.description && (
                                                    <p className="text-gray-600 mb-3">{todo.description}</p>
                                                )}
                                                <div className="flex items-center space-x-4 text-sm text-gray-500">
                                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                                        todo.status === 'completed' ? 'bg-green-100 text-green-800' :
                                                        todo.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                                        'bg-gray-100 text-gray-800'
                                                    }`}>
                                                        {todo.status}
                                                    </span>
                                                    <span>Created: {new Date(todo.created_at).toLocaleDateString()}</span>
                                                    {todo.due_date && (
                                                        <span>Due: {new Date(todo.due_date).toLocaleDateString()}</span>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex space-x-2 ml-4">
                                                {todo.status !== 'completed' && (
                                                    <button
                                                        onClick={() => updateTodoStatus(todo.id, 'completed')}
                                                        className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
                                                    >
                                                        Complete
                                                    </button>
                                                )}
                                                {todo.status === 'completed' && (
                                                    <button
                                                        onClick={() => updateTodoStatus(todo.id, 'pending')}
                                                        className="px-3 py-1 bg-yellow-600 text-white text-sm rounded hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                                                    >
                                                        Reopen
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => deleteTodo(todo.id)}
                                                    className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Event Log Sidebar */}
                <div className="lg:col-span-1">
                    <div className="bg-gray-50 rounded-lg p-4">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold">Real-time Events</h3>
                            <button
                                onClick={clearEventLog}
                                className="px-3 py-1 bg-gray-500 text-white text-sm rounded hover:bg-gray-600"
                            >
                                Clear
                            </button>
                        </div>
                        <div className="space-y-2 max-h-96 overflow-y-auto">
                            {eventLog.length === 0 ? (
                                <p className="text-gray-500 text-sm">No events yet...</p>
                            ) : (
                                eventLog.slice(-10).reverse().map((event, index) => (
                                    <div key={index} className="p-2 bg-white rounded border text-sm">
                                        <span className="text-gray-500 text-xs">
                                            {new Date().toLocaleTimeString()}
                                        </span>
                                        <div>{event}</div>
                                    </div>
                                ))
                            )}
                        </div>
                        <div className="mt-4 p-3 bg-blue-100 rounded text-sm">
                            <p className="font-medium">WebSocket Features:</p>
                            <ul className="text-xs mt-1 space-y-1">
                                <li>• Real-time todo updates</li>
                                <li>• Live deletion notifications</li>
                                <li>• Automatic reconnection</li>
                                <li>• Bidirectional communication</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer with API Info */}
            <div className="mt-12 pt-6 border-t border-gray-200 text-center text-sm text-gray-500">
                <p>This demo supports both HTTP and WebSocket transports with real-time event streaming.</p>
                <p>Current transport: <code className="bg-gray-100 px-1 py-0.5 rounded">{transport.toUpperCase()}</code></p>
                <p>Base URL: <code className="bg-gray-100 px-1 py-0.5 rounded">{baseURL}</code></p>
            </div>
        </div>
    );
};

export default WebSocketDemo;