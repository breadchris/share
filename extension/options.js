const DEFAULT_SERVER_URL = 'https://justshare.io';

// Load saved settings when the page loads
document.addEventListener('DOMContentLoaded', loadSettings);

// Save settings when save button is clicked
document.getElementById('save').addEventListener('click', saveSettings);

// Reset to default when reset button is clicked
document.getElementById('reset').addEventListener('click', resetSettings);

async function loadSettings() {
    try {
        const result = await chrome.storage.sync.get(['serverUrl']);
        const serverUrl = result.serverUrl || DEFAULT_SERVER_URL;
        document.getElementById('serverUrl').value = serverUrl;
    } catch (error) {
        console.error('Error loading settings:', error);
        showStatus('Error loading settings', 'error');
    }
}

async function saveSettings() {
    const serverUrl = document.getElementById('serverUrl').value.trim();
    
    // Validate URL
    if (!serverUrl) {
        showStatus('Please enter a server URL', 'error');
        return;
    }
    
    try {
        new URL(serverUrl); // This will throw if URL is invalid
    } catch (error) {
        showStatus('Please enter a valid URL', 'error');
        return;
    }
    
    try {
        await chrome.storage.sync.set({ serverUrl });
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
        await chrome.storage.sync.set({ serverUrl: DEFAULT_SERVER_URL });
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