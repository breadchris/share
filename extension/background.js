// Share Extension - Background Script
// Handles sharing and extension reload functionality

console.log('Share extension loaded');

// Backend server configuration
const DEFAULT_SERVER_URL = 'http://localhost:8080';
let serverUrl = DEFAULT_SERVER_URL;

// Load server URL from storage
async function loadServerUrl() {
  try {
    const result = await chrome.storage.sync.get(['serverUrl']);
    serverUrl = result.serverUrl || DEFAULT_SERVER_URL;
    console.log('Loaded server URL:', serverUrl);
  } catch (error) {
    console.error('Error loading server URL:', error);
    serverUrl = DEFAULT_SERVER_URL;
  }
}

// Initialize server URL
loadServerUrl();

// Extension installation/startup
chrome.runtime.onInstalled.addListener((details) => {
  console.log('Extension installed/updated:', details.reason);
  
  if (details.reason === 'install') {
    // Set default server URL if not already set
    chrome.storage.sync.get(['serverUrl'], (result) => {
      if (!result.serverUrl) {
        chrome.storage.sync.set({ serverUrl: DEFAULT_SERVER_URL });
      }
    });
  }
  
  // Always create context menus on any install/update/reload
  createContextMenus();
  updateExtensionBadge();
});

// Also create context menus on startup
chrome.runtime.onStartup.addListener(() => {
  console.log('Extension startup');
  createContextMenus();
  updateExtensionBadge();
});

// Create context menus
function createContextMenus() {
  // Remove existing menus first
  chrome.contextMenus.removeAll(() => {
    // Create share page context menu
    chrome.contextMenus.create({
      id: 'sharePage',
      title: 'Share this page',
      contexts: ['page']
    });

    // Create reload extension context menu
    chrome.contextMenus.create({
      id: 'reloadExtension',
      title: 'Reload Extension',
      contexts: ['all']
    });

    console.log('Context menus created');
  });
}

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
  console.log('Context menu clicked:', info.menuItemId);
  
  switch (info.menuItemId) {
    case 'sharePage':
      shareCurrentPage();
      break;
    case 'reloadExtension':
      reloadExtension();
      break;
  }
});

// Content script keyboard shortcuts now handled by existing message listener below

// Share current page function
async function shareCurrentPage() {
  try {
    // Get current active tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    if (!tab) {
      console.error('No active tab found');
      return;
    }

    // Check if URL is shareable (skip chrome:// URLs etc.)
    if (!isShareableUrl(tab.url)) {
      console.warn('Cannot share this type of URL:', tab.url);
      showNotification('Cannot share this page', 'This type of URL cannot be shared');
      return;
    }

    // Get page HTML content from content script
    let pageHTML = '';
    try {
      const response = await chrome.tabs.sendMessage(tab.id, { action: 'get-page-html' });
      pageHTML = response?.html || '';
    } catch (error) {
      console.warn('Could not extract HTML from page:', error);
      // Continue without HTML - backend can still save basic page info
    }

    // Prepare page data for backend
    const pageData = {
      url: tab.url,
      title: tab.title || 'Untitled',
      html: pageHTML
    };

    console.log('Sending page data to backend:', { url: pageData.url, title: pageData.title, htmlLength: pageData.html.length });

    // POST to backend /extension/save endpoint
    const response = await fetch(`${serverUrl}/extension/save`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(pageData)
    });

    if (!response.ok) {
      throw new Error(`Backend responded with ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    console.log('Page shared successfully to backend:', result);
    
    showNotification('Page Shared', `"${tab.title}" has been saved to database`);
    
    // Update stats and badge (don't await badge to prevent blocking)
    await updateShareStats();
    updateExtensionBadge(); // Fire and forget - don't let badge errors break sharing
    
    // Notify popup if it's open (handle promise properly)
    try {
      await chrome.runtime.sendMessage({
        type: 'share-success',
        title: tab.title,
        url: tab.url,
        backendId: result.id
      });
      console.log('Successfully notified popup of share success');
    } catch (error) {
      // Popup might not be open, ignore error silently
      console.log('Popup not available for notification (normal when popup is closed)');
    }
    
  } catch (error) {
    console.error('Error sharing page:', error);
    showNotification('Share Failed', `Could not save page: ${error.message}`);
    throw error; // Re-throw for proper error handling in message listeners
  }
}

// Reload extension function
async function reloadExtension() {
  try {
    console.log('Reloading extension...');
    showNotification('Extension Reloading', 'Restarting the Share extension...');
    
    // Small delay to show notification
    setTimeout(() => {
      chrome.runtime.reload();
    }, 500);
    
  } catch (error) {
    console.error('Error reloading extension:', error);
    showNotification('Reload Failed', 'Could not reload extension');
  }
}

// Backend health check
async function checkBackendHealth() {
  try {
    const response = await fetch(`${serverUrl}/extension/`, {
      method: 'GET',
      headers: {
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      }
    });
    
    if (response.ok) {
      console.log('Backend is available at:', serverUrl);
      return true;
    } else {
      console.warn('Backend responded with status:', response.status);
      return false;
    }
  } catch (error) {
    console.error('Backend health check failed:', error);
    return false;
  }
}

// Check if URL can be shared
function isShareableUrl(url) {
  if (!url) return false;
  
  const unshareableProtocols = [
    'chrome://',
    'chrome-extension://',
    'moz-extension://',
    'about:',
    'edge://',
    'opera://'
  ];
  
  return !unshareableProtocols.some(protocol => url.startsWith(protocol));
}

// Show notification
function showNotification(title, message) {
  // Only show notifications if permission is available
  if (chrome.notifications) {
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icons/icon48.png',
      title: title,
      message: message
    });
  } else {
    console.log(`Notification: ${title} - ${message}`);
  }
}

// Update share statistics
async function updateShareStats() {
  try {
    const stats = await chrome.storage.local.get(['shareCount', 'lastShared']);
    const newCount = (stats.shareCount || 0) + 1;
    
    await chrome.storage.local.set({
      shareCount: newCount,
      lastShared: Date.now()
    });
    
    console.log('Share stats updated:', { count: newCount });
  } catch (error) {
    console.error('Error updating stats:', error);
  }
}

// Update extension badge with share count
async function updateExtensionBadge() {
  try {
    const stats = await chrome.storage.local.get(['shareCount']);
    const shareCount = stats.shareCount || 0;
    
    if (shareCount > 0) {
      // Show share count on badge
      await chrome.action.setBadgeText({ text: shareCount.toString() });
      await chrome.action.setBadgeBackgroundColor({ color: '#28a745' });
      
      // Flash the badge briefly when sharing
      setTimeout(async () => {
        try {
          await chrome.action.setBadgeBackgroundColor({ color: '#007bff' });
        } catch (error) {
          console.error('Error updating badge color:', error);
        }
      }, 1500);
    } else {
      // Clear badge if no shares
      await chrome.action.setBadgeText({ text: '' });
    }
    
    console.log('Badge updated with share count:', shareCount);
  } catch (error) {
    console.error('Error updating badge:', error);
    // Don't throw - badge update failure shouldn't break sharing
  }
}

// Handle messages from popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Message received:', message);
  
  switch (message.action) {
    case 'share-page':
      shareCurrentPage()
        .then(() => sendResponse({ success: true }))
        .catch(error => {
          console.error('Error in shareCurrentPage:', error);
          sendResponse({ success: false, error: error.message });
        });
      return true; // Keep message channel open for async response
      
    case 'share-page-from-content':
      console.log('Share request from content script:', message);
      shareCurrentPage()
        .then(() => {
          sendResponse({ success: true });
          
          // Send notification back to content script for in-page display
          if (sender.tab?.id) {
            chrome.tabs.sendMessage(sender.tab.id, {
              type: 'share-success-notification',
              title: message.title || 'Page'
            }).catch(error => {
              console.log('Could not send notification to content script:', error);
            });
          }
        })
        .catch(error => {
          console.error('Error sharing from content script:', error);
          sendResponse({ success: false, error: error.message });
          
          // Send error notification back to content script
          if (sender.tab?.id) {
            chrome.tabs.sendMessage(sender.tab.id, {
              type: 'share-error-notification',
              error: error.message
            }).catch(error => {
              console.log('Could not send error notification to content script:', error);
            });
          }
        });
      return true;
      
    case 'reload-extension':
      reloadExtension()
        .then(() => sendResponse({ success: true }))
        .catch(error => {
          console.error('Error in reloadExtension:', error);
          sendResponse({ success: false, error: error.message });
        });
      return true;
      
    case 'get-stats':
      getExtensionStats()
        .then(stats => sendResponse(stats))
        .catch(error => {
          console.error('Error in getExtensionStats:', error);
          sendResponse({ error: error.message });
        });
      return true;
      
    default:
      sendResponse({ error: 'Unknown action' });
  }
});

// Get extension statistics
async function getExtensionStats() {
  try {
    const stats = await chrome.storage.local.get(['shareCount', 'lastShared']);
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    return {
      shareCount: stats.shareCount || 0,
      lastShared: stats.lastShared || null,
      currentUrl: tab?.url || null,
      isShareable: tab ? isShareableUrl(tab.url) : false
    };
  } catch (error) {
    console.error('Error getting stats:', error);
    return {
      shareCount: 0,
      lastShared: null,
      currentUrl: null,
      isShareable: false
    };
  }
}

console.log('Share extension background script initialized');