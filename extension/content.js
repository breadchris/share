// Share Extension - Content Script
// Handles keyboard shortcuts and in-page notifications

console.log('Share extension content script loaded');

// Cross-platform keyboard shortcut detection
document.addEventListener('keydown', (event) => {
  // Detect Ctrl+Shift+B (Windows/Linux) or Cmd+Shift+B (Mac)
  const isMac = navigator.platform.includes('Mac');
  const ctrlOrCmd = isMac ? event.metaKey : event.ctrlKey;
  
  if (ctrlOrCmd && event.shiftKey && event.code === 'KeyB') {
    event.preventDefault();
    event.stopPropagation();
    
    console.log('Share keyboard shortcut triggered');
    shareCurrentPage();
  }
});

// Send share request to background script
async function shareCurrentPage() {
  try {
    console.log('Requesting page share from content script');
    
    const response = await chrome.runtime.sendMessage({ 
      action: 'share-page-from-content',
      url: window.location.href,
      title: document.title
    });
    
    if (response && response.success) {
      console.log('Page shared successfully from content script');
      showInPageNotification(document.title, true);
    } else {
      console.error('Failed to share page:', response?.error);
      showInPageNotification('Failed to share page', false);
    }
    
  } catch (error) {
    console.error('Error sharing page from content script:', error);
    showInPageNotification('Failed to share page', false);
  }
}

// Show in-page notification popup
function showInPageNotification(title, success = true) {
  // Remove any existing notifications
  const existing = document.getElementById('share-extension-notification');
  if (existing) {
    existing.remove();
  }
  
  // Create notification element
  const notification = document.createElement('div');
  notification.id = 'share-extension-notification';
  
  // Truncate title if too long
  const displayTitle = title.length > 50 ? title.substring(0, 47) + '...' : title;
  
  // Notification HTML
  notification.innerHTML = `
    <div style="
      position: fixed;
      top: 20px;
      right: 20px;
      background: ${success ? '#28a745' : '#dc3545'};
      color: white;
      padding: 16px 20px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
      z-index: 10000;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 14px;
      font-weight: 500;
      max-width: 350px;
      animation: slideInFromTop 0.3s ease-out;
      opacity: 0.95;
      backdrop-filter: blur(10px);
    ">
      <div style="display: flex; align-items: center; gap: 10px;">
        <span style="font-size: 18px;">${success ? '✅' : '❌'}</span>
        <div>
          <div style="font-weight: 600; margin-bottom: 2px;">
            ${success ? 'Page Shared!' : 'Share Failed'}
          </div>
          <div style="font-size: 12px; opacity: 0.9; line-height: 1.3;">
            ${displayTitle}
          </div>
        </div>
      </div>
    </div>
  `;
  
  // Add CSS animation keyframes if not already added
  if (!document.getElementById('share-extension-styles')) {
    const style = document.createElement('style');
    style.id = 'share-extension-styles';
    style.textContent = `
      @keyframes slideInFromTop {
        from {
          transform: translateY(-100px);
          opacity: 0;
        }
        to {
          transform: translateY(0);
          opacity: 0.95;
        }
      }
      
      @keyframes slideOutToTop {
        from {
          transform: translateY(0);
          opacity: 0.95;
        }
        to {
          transform: translateY(-100px);
          opacity: 0;
        }
      }
    `;
    document.head.appendChild(style);
  }
  
  // Add to page
  document.body.appendChild(notification);
  
  // Auto-remove after 3 seconds with slide out animation
  setTimeout(() => {
    if (notification) {
      notification.style.animation = 'slideOutToTop 0.3s ease-in';
      setTimeout(() => {
        if (notification && notification.parentNode) {
          notification.remove();
        }
      }, 300);
    }
  }, 3000);
  
  console.log(`In-page notification shown: ${success ? 'success' : 'error'}`);
}

// Listen for messages from background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Content script received message:', message);
  
  switch (message.type) {
    case 'share-success-notification':
      showInPageNotification(message.title || document.title, true);
      sendResponse({ received: true });
      break;
      
    case 'share-error-notification':
      showInPageNotification(message.error || 'Failed to share page', false);
      sendResponse({ received: true });
      break;
      
    default:
      console.log('Unknown message type:', message.type);
  }
  
  // Handle action-based messages
  switch (message.action) {
    case 'get-page-html':
      try {
        const pageData = {
          html: document.documentElement.outerHTML,
          url: window.location.href,
          title: document.title
        };
        console.log('Extracted page data:', { 
          url: pageData.url, 
          title: pageData.title, 
          htmlLength: pageData.html.length 
        });
        sendResponse(pageData);
      } catch (error) {
        console.error('Error extracting page HTML:', error);
        sendResponse({ 
          html: '', 
          url: window.location.href, 
          title: document.title, 
          error: error.message 
        });
      }
      return true; // Keep message channel open for async response
      
    default:
      // Unknown action, no response needed
      break;
  }
});

console.log('Share extension content script ready - Ctrl/Cmd+Shift+B to share');