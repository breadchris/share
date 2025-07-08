// Popup script for WebSocket connection management
document.addEventListener('DOMContentLoaded', initialize);

let connectionStats = {
    requestCount: 0,
    connectionTime: null,
    lastActivity: null
};

async function initialize() {
    // Load current settings and connection status
    await loadSettings();
    await updateConnectionStatus();
    
    // Set up event listeners
    document.getElementById('connect-btn').addEventListener('click', connectToServer);
    document.getElementById('disconnect-btn').addEventListener('click', disconnectFromServer);
    document.getElementById('options-btn').addEventListener('click', openOptions);
    
    // Update UI every second
    setInterval(updateUI, 1000);
    
    // Listen for connection status changes from background script
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        if (message.action === 'connectionStatusChanged') {
            updateConnectionStatus();
        } else if (message.action === 'statsUpdate') {
            connectionStats = { ...connectionStats, ...message.data };
            updateStats();
        }
    });
}

async function loadSettings() {
    try {
        const result = await chrome.storage.sync.get(['serverUrl', 'apiDomain']);
        const apiDomain = result.apiDomain || 'http://localhost:8080';
        
        document.getElementById('server-url').textContent = `API: ${apiDomain}`;
    } catch (error) {
        console.error('Error loading settings:', error);
    }
}

async function updateConnectionStatus() {
    try {
        // Get connection status from background script
        const response = await chrome.runtime.sendMessage({ 
            action: 'getConnectionStatus' 
        });
        
        const status = response?.status || 'disconnected';
        const stats = response?.stats || {};
        
        updateStatusUI(status);
        
        if (stats) {
            connectionStats = { ...connectionStats, ...stats };
            updateStats();
        }
        
    } catch (error) {
        console.error('Error getting connection status:', error);
        updateStatusUI('disconnected');
    }
}

function updateStatusUI(status) {
    const statusElement = document.getElementById('status');
    const statusText = document.getElementById('status-text');
    const connectBtn = document.getElementById('connect-btn');
    const disconnectBtn = document.getElementById('disconnect-btn');
    const statsElement = document.getElementById('stats');
    
    // Reset classes
    statusElement.className = 'status';
    
    switch (status) {
        case 'connected':
            statusElement.classList.add('connected');
            statusText.textContent = 'Connected';
            connectBtn.style.display = 'none';
            disconnectBtn.style.display = 'block';
            statsElement.style.display = 'flex';
            break;
            
        case 'connecting':
            statusElement.classList.add('connecting');
            statusText.textContent = 'Connecting...';
            connectBtn.disabled = true;
            disconnectBtn.style.display = 'none';
            statsElement.style.display = 'none';
            break;
            
        case 'disconnected':
        default:
            statusElement.classList.add('disconnected');
            statusText.textContent = 'Disconnected';
            connectBtn.style.display = 'block';
            connectBtn.disabled = false;
            disconnectBtn.style.display = 'none';
            statsElement.style.display = 'none';
            break;
    }
}

async function connectToServer() {
    try {
        updateStatusUI('connecting');
        
        const response = await chrome.runtime.sendMessage({ 
            action: 'connectWebSocket' 
        });
        
        if (response?.success) {
            console.log('Connection initiated successfully');
            // Status will be updated via message listener
        } else {
            console.error('Failed to initiate connection:', response?.error);
            updateStatusUI('disconnected');
            showNotification('Connection failed: ' + (response?.error || 'Unknown error'));
        }
        
    } catch (error) {
        console.error('Error connecting to server:', error);
        updateStatusUI('disconnected');
        showNotification('Connection error: ' + error.message);
    }
}

async function disconnectFromServer() {
    try {
        const response = await chrome.runtime.sendMessage({ 
            action: 'disconnectWebSocket' 
        });
        
        if (response?.success) {
            console.log('Disconnected successfully');
            updateStatusUI('disconnected');
            resetStats();
        } else {
            console.error('Failed to disconnect:', response?.error);
        }
        
    } catch (error) {
        console.error('Error disconnecting from server:', error);
    }
}

function openOptions() {
    chrome.runtime.openOptionsPage();
}

function updateUI() {
    updateStats();
}

function updateStats() {
    if (connectionStats.connectionTime) {
        const now = Date.now();
        const duration = now - connectionStats.connectionTime;
        document.getElementById('connection-time').textContent = formatDuration(duration);
    }
    
    if (connectionStats.lastActivity) {
        const now = Date.now();
        const timeSince = now - connectionStats.lastActivity;
        document.getElementById('last-activity').textContent = formatDuration(timeSince) + ' ago';
    }
    
    document.getElementById('requests-count').textContent = connectionStats.requestCount.toString();
}

function resetStats() {
    connectionStats = {
        requestCount: 0,
        connectionTime: null,
        lastActivity: null
    };
    updateStats();
}

function formatDuration(milliseconds) {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
        return `${hours}h ${minutes % 60}m`;
    } else if (minutes > 0) {
        return `${minutes}m ${seconds % 60}s`;
    } else {
        return `${seconds}s`;
    }
}

function showNotification(message) {
    chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icons/icon48.png',
        title: 'Share Extension',
        message: message
    });
}