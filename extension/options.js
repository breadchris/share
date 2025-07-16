const DEFAULT_SERVER_URL = 'https://justshare.io';
const DEFAULT_API_DOMAIN = 'http://localhost:8080';

// Load saved settings when the page loads
document.addEventListener('DOMContentLoaded', loadSettings);

// Save settings when save button is clicked
document.getElementById('save').addEventListener('click', saveSettings);

// Reset to default when reset button is clicked
document.getElementById('reset').addEventListener('click', resetSettings);

async function loadSettings() {
    try {
        const result = await chrome.storage.sync.get([
            'serverUrl', 
            'apiDomain',
            'autoReconnect',
            'maxReconnectAttempts',
            'reconnectDelay'
        ]);
        
        const serverUrl = result.serverUrl || DEFAULT_SERVER_URL;
        const apiDomain = result.apiDomain || DEFAULT_API_DOMAIN;
        const autoReconnect = result.autoReconnect !== undefined ? result.autoReconnect : true;
        const maxReconnectAttempts = result.maxReconnectAttempts || 5;
        const reconnectDelay = result.reconnectDelay || 1000;
        
        document.getElementById('serverUrl').value = serverUrl;
        document.getElementById('apiDomain').value = apiDomain;
        document.getElementById('autoReconnect').checked = autoReconnect;
        document.getElementById('maxReconnectAttempts').value = maxReconnectAttempts;
        document.getElementById('reconnectDelay').value = reconnectDelay;
    } catch (error) {
        console.error('Error loading settings:', error);
        showStatus('Error loading settings', 'error');
    }
}

async function saveSettings() {
    const serverUrl = document.getElementById('serverUrl').value.trim();
    const apiDomain = document.getElementById('apiDomain').value.trim();
    const autoReconnect = document.getElementById('autoReconnect').checked;
    const maxReconnectAttempts = parseInt(document.getElementById('maxReconnectAttempts').value, 10);
    const reconnectDelay = parseInt(document.getElementById('reconnectDelay').value, 10);
    
    // Validate URLs
    if (!serverUrl) {
        showStatus('Please enter a server URL', 'error');
        return;
    }
    
    if (!apiDomain) {
        showStatus('Please enter an API domain', 'error');
        return;
    }
    
    // Validate reconnection settings
    if (maxReconnectAttempts < 1 || maxReconnectAttempts > 10) {
        showStatus('Maximum reconnection attempts must be between 1 and 10', 'error');
        return;
    }
    
    if (reconnectDelay < 1000 || reconnectDelay > 30000) {
        showStatus('Reconnection delay must be between 1000 and 30000 milliseconds', 'error');
        return;
    }
    
    try {
        new URL(serverUrl); // This will throw if URL is invalid
        new URL(apiDomain); // This will throw if URL is invalid
    } catch (error) {
        showStatus('Please enter valid URLs', 'error');
        return;
    }
    
    try {
        await chrome.storage.sync.set({ 
            serverUrl, 
            apiDomain,
            autoReconnect,
            maxReconnectAttempts,
            reconnectDelay
        });
        showStatus('Settings saved successfully!', 'success');
        
        // Notify background script that settings have changed
        chrome.runtime.sendMessage({ action: 'settingsUpdated' });
    } catch (error) {
        console.error('Error saving settings:', error);
        showStatus('Error saving settings', 'error');
    }
}

async function resetSettings() {
    try {
        document.getElementById('serverUrl').value = DEFAULT_SERVER_URL;
        document.getElementById('apiDomain').value = DEFAULT_API_DOMAIN;
        document.getElementById('autoReconnect').checked = true;
        document.getElementById('maxReconnectAttempts').value = 5;
        document.getElementById('reconnectDelay').value = 1000;
        
        await chrome.storage.sync.set({ 
            serverUrl: DEFAULT_SERVER_URL,
            apiDomain: DEFAULT_API_DOMAIN,
            autoReconnect: true,
            maxReconnectAttempts: 5,
            reconnectDelay: 1000
        });
        showStatus('Settings reset to default', 'success');
        
        // Notify background script that settings have changed
        chrome.runtime.sendMessage({ action: 'settingsUpdated' });
    } catch (error) {
        console.error('Error resetting settings:', error);
        showStatus('Error resetting settings', 'error');
    }
}

function showStatus(message, type) {
    const statusDiv = document.getElementById('status');
    statusDiv.textContent = message;
    statusDiv.className = `status ${type}`;
    statusDiv.style.display = 'block';
    
    // Hide status after 3 seconds
    setTimeout(() => {
        statusDiv.style.display = 'none';
    }, 3000);
} 