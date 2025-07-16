import React, { useState, useEffect } from 'react';
import { 
    CreateTodo, 
    ListTodos, 
    UpdateTodo, 
    DeleteTodo,
    Todo,
    TodoStatus,
    CreateTodoRequest,
    ListTodosRequest,
    UpdateTodoRequest,
    DeleteTodoRequest,
    FetchOptions
} from './api';

interface UserAppProps {
    userId: string;
    baseURL?: string;
}

const UserApp: React.FC<UserAppProps> = ({ userId, baseURL = '/user' }) => {
    const [todos, setTodos] = useState<Todo[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [newTodoTitle, setNewTodoTitle] = useState('');
    const [newTodoDescription, setNewTodoDescription] = useState('');

    const apiOptions: FetchOptions = { baseURL };

    const loadTodos = async () => {
        try {
            setLoading(true);
            setError(null);
            const request: ListTodosRequest = { user_id: userId };
            const response = await ListTodos(request, apiOptions);
            setTodos(response.data.todos);
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
            const response = await CreateTodo(request, apiOptions);
            setTodos(prev => [...prev, response.data.todo]);
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
            const response = await UpdateTodo(request, apiOptions);
            setTodos(prev => prev.map(todo => 
                todo.id === id ? response.data.todo : todo
            ));
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to update todo');
        }
    };

    const deleteTodo = async (id: string) => {
        if (!confirm('Are you sure you want to delete this todo?')) return;

        try {
            const request: DeleteTodoRequest = { id };
            await DeleteTodo(request, apiOptions);
            setTodos(prev => prev.filter(todo => todo.id !== id));
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to delete todo');
        }
    };

    useEffect(() => {
        loadTodos();
    }, [userId]);

    return (
        <div className="max-w-4xl mx-auto p-6">
            <h1 className="text-3xl font-bold mb-8">Todo Management</h1>

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
                        {loading ? 'Creating...' : 'Create Todo'}
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

            {/* Footer with API Info */}
            <div className="mt-12 pt-6 border-t border-gray-200 text-center text-sm text-gray-500">
                <p>This app uses type-safe API calls generated from Go structs.</p>
                <p>Base URL: <code className="bg-gray-100 px-1 py-0.5 rounded">{baseURL}</code></p>
            </div>
        </div>
    );
};

export default UserApp;