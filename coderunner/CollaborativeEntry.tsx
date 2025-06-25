import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import CollaborativeCodeRunner from './CollaborativeCodeRunner';
import { Users, Plus, ExternalLink, Code } from 'lucide-react';

interface Room {
    id: string;
    name: string;
    userCount: number;
    lastActivity: Date;
}

const CollaborativeEntry: React.FC = () => {
    const [currentView, setCurrentView] = useState<'lobby' | 'room'>('lobby');
    const [roomId, setRoomId] = useState<string>('');
    const [username, setUsername] = useState<string>('');
    const [joinRoomId, setJoinRoomId] = useState<string>('');
    const [recentRooms, setRecentRooms] = useState<Room[]>([]);
    
    useEffect(() => {
        // Check URL parameters for room and username
        const urlParams = new URLSearchParams(window.location.search);
        const urlRoomId = urlParams.get('room');
        const urlUsername = urlParams.get('username');
        
        if (urlRoomId && urlUsername) {
            setRoomId(urlRoomId);
            setUsername(urlUsername);
            setCurrentView('room');
        } else {
            // Generate default username
            setUsername(generateUsername());
            
            // Load recent rooms from localStorage
            const savedRooms = localStorage.getItem('collaborative-rooms');
            if (savedRooms) {
                try {
                    setRecentRooms(JSON.parse(savedRooms));
                } catch (e) {
                    console.error('Failed to load recent rooms:', e);
                }
            }
        }
    }, []);
    
    const generateUsername = (): string => {
        const adjectives = ['Quick', 'Clever', 'Bright', 'Swift', 'Smart', 'Cool', 'Fast', 'Sharp'];
        const nouns = ['Coder', 'Developer', 'Hacker', 'Builder', 'Creator', 'Maker', 'Ninja', 'Wizard'];
        const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
        const noun = nouns[Math.floor(Math.random() * nouns.length)];
        return `${adj}${noun}${Math.floor(Math.random() * 100)}`;
    };
    
    const generateRoomId = (): string => {
        return Math.random().toString(36).substring(2, 15);
    };
    
    const createRoom = () => {
        const newRoomId = generateRoomId();
        setRoomId(newRoomId);
        saveRoomToHistory(newRoomId, `Room ${newRoomId}`);
        updateUrlParams(newRoomId, username);
        setCurrentView('room');
    };
    
    const joinRoom = () => {
        if (!joinRoomId.trim()) return;
        
        setRoomId(joinRoomId.trim());
        saveRoomToHistory(joinRoomId.trim(), `Room ${joinRoomId.trim()}`);
        updateUrlParams(joinRoomId.trim(), username);
        setCurrentView('room');
    };
    
    const joinRecentRoom = (room: Room) => {
        setRoomId(room.id);
        updateUrlParams(room.id, username);
        setCurrentView('room');
    };
    
    const saveRoomToHistory = (roomId: string, roomName: string) => {
        const newRoom: Room = {
            id: roomId,
            name: roomName,
            userCount: 1,
            lastActivity: new Date()
        };
        
        const updatedRooms = [newRoom, ...recentRooms.filter(r => r.id !== roomId)].slice(0, 5);
        setRecentRooms(updatedRooms);
        localStorage.setItem('collaborative-rooms', JSON.stringify(updatedRooms));
    };
    
    const updateUrlParams = (roomId: string, username: string) => {
        const url = new URL(window.location.href);
        url.searchParams.set('room', roomId);
        url.searchParams.set('username', username);
        window.history.pushState({}, '', url.toString());
    };
    
    const backToLobby = () => {
        setCurrentView('lobby');
        const url = new URL(window.location.href);
        url.searchParams.delete('room');
        url.searchParams.delete('username');
        window.history.pushState({}, '', url.toString());
    };
    
    const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setUsername(e.target.value);
    };
    
    const handleJoinRoomIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setJoinRoomId(e.target.value);
    };
    
    const handleJoinKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            joinRoom();
        }
    };
    
    if (currentView === 'room') {
        return (
            <CollaborativeCodeRunner
                roomId={roomId}
                username={username}
                onBackToLobby={backToLobby}
            />
        );
    }
    
    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 flex items-center justify-center p-4">
            <div className="bg-white bg-opacity-10 backdrop-blur-md rounded-2xl shadow-2xl p-8 w-full max-w-md">
                <div className="text-center mb-8">
                    <div className="flex items-center justify-center mb-4">
                        <Code className="w-12 h-12 text-blue-400 mr-3" />
                        <h1 className="text-3xl font-bold text-white">Collaborative</h1>
                    </div>
                    <p className="text-blue-200">Code together in real-time</p>
                </div>
                
                {/* Username Input */}
                <div className="mb-6">
                    <label className="block text-sm font-medium text-blue-200 mb-2">
                        Your Username
                    </label>
                    <input
                        type="text"
                        value={username}
                        onChange={handleUsernameChange}
                        className="w-full px-4 py-2 bg-white bg-opacity-20 border border-blue-300 border-opacity-30 rounded-lg text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                        placeholder="Enter your username"
                    />
                </div>
                
                {/* Create Room */}
                <button
                    onClick={createRoom}
                    className="w-full flex items-center justify-center space-x-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors mb-4"
                >
                    <Plus className="w-5 h-5" />
                    <span>Create New Room</span>
                </button>
                
                {/* Join Room */}
                <div className="mb-6">
                    <label className="block text-sm font-medium text-blue-200 mb-2">
                        Join Existing Room
                    </label>
                    <div className="flex space-x-2">
                        <input
                            type="text"
                            value={joinRoomId}
                            onChange={handleJoinRoomIdChange}
                            onKeyPress={handleJoinKeyPress}
                            className="flex-1 px-4 py-2 bg-white bg-opacity-20 border border-blue-300 border-opacity-30 rounded-lg text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                            placeholder="Room ID"
                        />
                        <button
                            onClick={joinRoom}
                            disabled={!joinRoomId.trim()}
                            className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-500 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
                        >
                            <ExternalLink className="w-5 h-5" />
                        </button>
                    </div>
                </div>
                
                {/* Recent Rooms */}
                {recentRooms.length > 0 && (
                    <div>
                        <h3 className="text-sm font-medium text-blue-200 mb-3">Recent Rooms</h3>
                        <div className="space-y-2">
                            {recentRooms.map((room) => (
                                <button
                                    key={room.id}
                                    onClick={() => joinRecentRoom(room)}
                                    className="w-full flex items-center justify-between p-3 bg-white bg-opacity-10 hover:bg-opacity-20 rounded-lg transition-colors text-left"
                                >
                                    <div>
                                        <div className="text-white font-medium text-sm">{room.name}</div>
                                        <div className="text-blue-200 text-xs">ID: {room.id}</div>
                                    </div>
                                    <div className="flex items-center space-x-1 text-blue-300">
                                        <Users className="w-4 h-4" />
                                        <span className="text-xs">{room.userCount}</span>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                )}
                
                {/* Info */}
                <div className="mt-8 p-4 bg-blue-600 bg-opacity-20 rounded-lg">
                    <h4 className="text-sm font-medium text-blue-200 mb-2">How it works:</h4>
                    <ul className="text-xs text-blue-300 space-y-1">
                        <li>• Create or join a room to start coding together</li>
                        <li>• Share the room URL with your collaborators</li>
                        <li>• See real-time code changes and chat with your team</li>
                        <li>• Run code instantly to see the results</li>
                    </ul>
                </div>
            </div>
        </div>
    );
};

// Check if we're in a browser environment and render
if (typeof window !== 'undefined') {
    const container = document.getElementById('collaborative-coderunner');
    if (container) {
        const root = createRoot(container);
        root.render(<CollaborativeEntry />);
    }
}

export default CollaborativeEntry;