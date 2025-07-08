// Default server URL
const DEFAULT_SERVER_URL = 'https://justshare.io';
const DEFAULT_API_DOMAIN = 'http://localhost:8080';
let BASE_ROUTE = DEFAULT_SERVER_URL;
let API_DOMAIN = DEFAULT_API_DOMAIN;

// BrowserMCP WebSocket connection
let BROWSERMCP_WS_PORT = 8765; // Default BrowserMCP WebSocket port
let mcpConnection = null;
const connectedTabs = new Set();

// Load BrowserMCP port from storage
async function loadBrowserMCPPort() {
    try {
        const result = await chrome.storage.sync.get(['browsermcpPort']);
        BROWSERMCP_WS_PORT = result.browsermcpPort || 8765;
        console.log('Loaded BrowserMCP port:', BROWSERMCP_WS_PORT);
    } catch (error) {
        console.error('Error loading BrowserMCP port:', error);
        BROWSERMCP_WS_PORT = 8765;
    }
}

// Load server URL and API domain from storage on startup
async function loadServerUrl() {
    try {
        const result = await chrome.storage.sync.get(['serverUrl', 'apiDomain']);
        BASE_ROUTE = result.serverUrl || DEFAULT_SERVER_URL;
        API_DOMAIN = result.apiDomain || DEFAULT_API_DOMAIN;
        console.log('Loaded server URL:', BASE_ROUTE);
        console.log('Loaded API domain:', API_DOMAIN);
    } catch (error) {
        console.error('Error loading server settings:', error);
        BASE_ROUTE = DEFAULT_SERVER_URL;
        API_DOMAIN = DEFAULT_API_DOMAIN;
    }
}

// Initialize server URL and BrowserMCP port
loadServerUrl();
loadBrowserMCPPort();

chrome.runtime.onInstalled.addListener(() => {
    // Set default server URL and API domain if not already set
    chrome.storage.sync.get(['serverUrl', 'apiDomain'], (result) => {
        const updates = {};
        if (!result.serverUrl) {
            updates.serverUrl = DEFAULT_SERVER_URL;
        }
        if (!result.apiDomain) {
            updates.apiDomain = DEFAULT_API_DOMAIN;
        }
        if (Object.keys(updates).length > 0) {
            chrome.storage.sync.set(updates);
        }
    });

    // Set default BrowserMCP port if not already set
    chrome.storage.sync.get(['browsermcpPort'], (result) => {
        if (!result.browsermcpPort) {
            chrome.storage.sync.set({ browsermcpPort: 8765 });
        }
    });

    // Create context menu
    chrome.contextMenus.create({
        id: 'sharePage',
        title: 'Share this page',
        contexts: ['page'],
    })

    chrome.contextMenus.create({
        id: 'reloadExtension',
        title: 'Reload Extension',
        contexts: ['all'],
    })
})

tags = []

async function loadState() {
    return new Promise((resolve, reject) => {
        fetch(`${API_DOMAIN}/extension/save`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        })
            .then(async (response) => {
                const r = await response.json();
                tags = Object.keys(r.tag_lookup)
                resolve(r);
            })
            .catch((error) => reject(error));
    });
}

// Handle context menu click
chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === 'sharePage') {
        const pageInfo = {
            url: tab.url,
            title: tab.title,
            content: tab.html,
            // tags: tags,
            // html: html,
        }
        sharePage(pageInfo)
    } else if (info.menuItemId === 'reloadExtension') {
        chrome.runtime.reload()
    }
})

function getTabDetails(tabId) {
    return new Promise((resolve, reject) => {
        chrome.tabs.get(tabId, tab => {
            if (chrome.runtime.lastError) {
                // Ignore errors, sometimes tabs might have already closed before we can fetch details
                resolve(undefined);
            } else {
                resolve(tab);
            }
        });
    });
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log('Message received:', message);
    
    // Handle settings update
    if (message.action === 'settingsUpdated') {
        loadServerUrl();
        return;
    }
    
    // Handle WebSocket connection requests from popup
    if (message.action === 'connectWebSocket') {
        connectWebSocket().then(sendResponse);
        return true; // Keep message channel open for async response
    }
    
    if (message.action === 'disconnectWebSocket') {
        sendResponse(disconnectWebSocket());
        return;
    }
    
    if (message.action === 'getConnectionStatus') {
        sendResponse({
            status: connectionState,
            stats: getConnectionStats()
        });
        return;
    }
    
    // Handle proxy requests from backend
    if (message.action === 'proxyRequest') {
        handleProxyRequest(message.data, sendResponse);
        return true; // Keep message channel open for async response
    }
    
    // Handle cookie retrieval requests
    if (message.action === 'getCookies') {
        handleGetCookies(message.data, sendResponse);
        return true; // Keep message channel open for async response
    }
    
    // Handle screenshot requests
    if (message.action === 'takeScreenshot') {
        handleTakeScreenshot(message.data, sendResponse);
        return true; // Keep message channel open for async response
    }
    
    if (message.action === "modifyClass") {
        (async () => {
            const { class: className, dataGodom } = message;

            // Send the data to the configured server
            fetch(`${BASE_ROUTE}/modify`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    class: className,
                    dataGodom: dataGodom
                })
            })
                .then(data => console.log('Success:', data))
                .catch((error) => console.error('Error:', error));
        })();
    }
    if (message.action === 'sendElement') {
        const { element, name } = message;

        // Send the data to the configured API domain
        fetch(`${API_DOMAIN}/extension/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ element, name })
        })
            .then(response => {
                console.log(response)
                if (response.ok) {
                    sendResponse({ ok: response.ok, response });
                    console.log('Element sent successfully!');
                } else {
                    sendResponse({ ok: false, error: response });
                    console.error('Failed to send element.');
                }
            })
            .catch(error => {
                console.error('Error while sending element:', error);
                sendResponse({ok: false, error})
            });
    }
    if (message.action === 'sharePage') {
        (async (data) => {
            chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
                const activeTab = tabs[0];
                const tabDetails = await getTabDetails(activeTab.id);
                console.log('Tab details:', tabDetails, data);
                const pageInfo = {
                    url: tabDetails.url,
                    title: tabDetails.title,
                    tags: data.tags,
                    html: data.html,
                }
                sharePage(pageInfo);
            });
        })(message.data);
    }
    return true;
});

chrome.action.onClicked.addListener((tab) => {
    const pageInfo = {
        url: tab.url,
        title: tab.title,
        content: tab.html,
        // tags: tags,
        // html: html,
    };
    sharePage(pageInfo);
})

async function generateTags(pageInfo) {
    if (!pageInfo) {
        console.error('No page info provided');
        return;
    }

    if (!pageInfo.url) {
        console.error('No URL provided', pageInfo);
        return;
    }

    if (!pageInfo.content) {
        console.error('No content provided for page:', pageInfo.url);
        return;
    }

    // omit html from request
    const { html, ...condensedPageInfo } = pageInfo;

    console.log('Generating tags for page:', pageInfo);
    try {
        // Send the data to the configured server
        const response = await fetch(`${BASE_ROUTE}/transform/get-tags`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(condensedPageInfo),
        });
        const data = await response.json();

        console.log('Successfully generated tags for page:', data);

        return data;
    } catch (error) {
        console.error('Error:', error);
    }
}

async function updateTags(url, tags) {
    console.log('Updating tags for URL:', url);
    try {
        // Send the data to the configured server
        const response = await fetch(`${BASE_ROUTE}/update-tags`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ url, tags }),
        });
        const data = await response.json();

        console.log('Successfully updated tags for URL:', data);
    } catch (error) {
        console.error('Error:', error);
    }
}

async function sharePage(pageInfo) {
    console.log('Sharing page:', pageInfo);
    try {
        // Send the data to the configured API domain for server-side processing
        const response = await fetch(`${API_DOMAIN}/extension/save`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(pageInfo),
        });
        const data = await response.json();

        console.log('Successfully shared page:', data);

    } catch (error) {
        console.error('Error:', error);
    }
}

// BrowserMCP connection functionality
async function connectToBrowserMCP() {
    if (mcpConnection && mcpConnection.readyState === WebSocket.OPEN) {
        console.log('Already connected to BrowserMCP');
        return true;
    }

    try {
        mcpConnection = new WebSocket(`ws://localhost:${BROWSERMCP_WS_PORT}`);
        
        mcpConnection.onopen = () => {
            console.log('Connected to BrowserMCP server');
            // Send initialization message
            mcpConnection.send(JSON.stringify({
                type: 'extension_connected',
                timestamp: Date.now()
            }));
        };

        mcpConnection.onmessage = (event) => {
            try {
                const message = JSON.parse(event.data);
                console.log('Received message from BrowserMCP:', message);
                handleMCPMessage(message);
            } catch (error) {
                console.error('Error parsing MCP message:', error);
            }
        };

        mcpConnection.onclose = () => {
            console.log('Disconnected from BrowserMCP server');
            mcpConnection = null;
            connectedTabs.clear();
        };

        mcpConnection.onerror = (error) => {
            console.error('BrowserMCP connection error:', error);
            mcpConnection = null;
        };

        return true;
    } catch (error) {
        console.error('Failed to connect to BrowserMCP:', error);
        return false;
    }
}

async function connectCurrentTab() {
    try {
        // Get the current active tab
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        
        if (!tab) {
            console.error('No active tab found');
            return;
        }

        // Connect to BrowserMCP if not already connected
        const connected = await connectToBrowserMCP();
        if (!connected) {
            chrome.notifications.create({
                type: 'basic',
                iconUrl: 'icons/icon48.png',
                title: 'BrowserMCP Connection Failed',
                message: 'Could not connect to BrowserMCP server. Make sure it\'s running on port ' + BROWSERMCP_WS_PORT
            });
            return;
        }

        // Add tab to connected tabs
        connectedTabs.add(tab.id);

        // Inject content script if needed
        try {
            await chrome.scripting.executeScript({
                target: { tabId: tab.id },
                func: initializeMCPConnection
            });
        } catch (error) {
            console.log('Content script already injected or injection failed:', error);
        }

        // Send tab connection message to MCP server
        if (mcpConnection && mcpConnection.readyState === WebSocket.OPEN) {
            mcpConnection.send(JSON.stringify({
                type: 'tab_connected',
                tabId: tab.id,
                url: tab.url,
                title: tab.title,
                timestamp: Date.now()
            }));
        }

        // Show success notification
        chrome.notifications.create({
            type: 'basic',
            iconUrl: 'icons/icon48.png',
            title: 'Tab Connected to BrowserMCP',
            message: `Connected: ${tab.title}`
        });

        console.log('Tab connected to BrowserMCP:', tab.id, tab.url);
    } catch (error) {
        console.error('Error connecting current tab:', error);
        chrome.notifications.create({
            type: 'basic',
            iconUrl: 'icons/icon48.png',
            title: 'BrowserMCP Error',
            message: 'Failed to connect tab: ' + error.message
        });
    }
}

function handleMCPMessage(message) {
    switch (message.type) {
        case 'execute_script':
            if (message.tabId && connectedTabs.has(message.tabId)) {
                chrome.scripting.executeScript({
                    target: { tabId: message.tabId },
                    func: executeRemoteScript,
                    args: [message.script]
                });
            }
            break;
        case 'get_page_content':
            if (message.tabId && connectedTabs.has(message.tabId)) {
                chrome.scripting.executeScript({
                    target: { tabId: message.tabId },
                    func: getPageContent
                }).then(results => {
                    if (mcpConnection && mcpConnection.readyState === WebSocket.OPEN) {
                        mcpConnection.send(JSON.stringify({
                            type: 'page_content_response',
                            tabId: message.tabId,
                            content: results[0]?.result || null,
                            requestId: message.requestId
                        }));
                    }
                });
            }
            break;
        default:
            console.log('Unknown MCP message type:', message.type);
    }
}

// Functions to be injected into content script
function initializeMCPConnection() {
    console.log('BrowserMCP content script initialized');
    // Add any tab-specific initialization here
}

function executeRemoteScript(script) {
    try {
        eval(script);
    } catch (error) {
        console.error('Error executing remote script:', error);
    }
}

function getPageContent() {
    return {
        url: window.location.href,
        title: document.title,
        html: document.documentElement.outerHTML,
        text: document.body.innerText
    };
}

// Listen for keyboard shortcuts
chrome.commands.onCommand.addListener((command) => {
    if (command === 'connect-current-tab') {
        connectCurrentTab();
    }
});

// Clean up when tabs are closed
chrome.tabs.onRemoved.addListener((tabId) => {
    if (connectedTabs.has(tabId)) {
        connectedTabs.delete(tabId);
        
        // Notify MCP server about tab disconnection
        if (mcpConnection && mcpConnection.readyState === WebSocket.OPEN) {
            mcpConnection.send(JSON.stringify({
                type: 'tab_disconnected',
                tabId: tabId,
                timestamp: Date.now()
            }));
        }
        
        console.log('Tab disconnected from BrowserMCP:', tabId);
    }
});

// Proxy request handlers
async function handleProxyRequest(requestData, sendResponse) {
    try {
        const { url, method, headers, body, options } = requestData;
        
        // Validate that the request is from our configured API domain
        if (!isValidProxyRequest(url)) {
            sendResponse({ 
                success: false, 
                error: 'Invalid proxy request - domain not allowed' 
            });
            return;
        }
        
        console.log('Processing proxy request:', { url, method, options });
        
        // Prepare fetch options
        const fetchOptions = {
            method: method || 'GET',
            headers: headers || {},
            credentials: options?.includeCredentials ? 'include' : 'same-origin'
        };
        
        if (body && method !== 'GET') {
            fetchOptions.body = body;
        }
        
        // Add user agent if not provided
        if (!fetchOptions.headers['User-Agent']) {
            fetchOptions.headers['User-Agent'] = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36';
        }
        
        // Make the authenticated request
        const response = await fetch(url, fetchOptions);
        
        // Convert response headers to plain object
        const responseHeaders = {};
        response.headers.forEach((value, key) => {
            responseHeaders[key] = value;
        });
        
        // Get response body
        const responseBody = await response.text();
        
        sendResponse({
            success: true,
            status: response.status,
            statusText: response.statusText,
            headers: responseHeaders,
            body: responseBody,
            url: response.url
        });
        
    } catch (error) {
        console.error('Proxy request failed:', error);
        sendResponse({
            success: false,
            error: error.message || 'Proxy request failed'
        });
    }
}

async function handleGetCookies(requestData, sendResponse) {
    try {
        const { url, domain } = requestData;
        
        // Get cookies for the specified domain
        const cookies = await chrome.cookies.getAll({
            domain: domain || new URL(url).hostname
        });
        
        sendResponse({
            success: true,
            cookies: cookies
        });
        
    } catch (error) {
        console.error('Failed to get cookies:', error);
        sendResponse({
            success: false,
            error: error.message || 'Failed to get cookies'
        });
    }
}

async function handleTakeScreenshot(requestData, sendResponse) {
    try {
        const { tabId, format, quality } = requestData;
        
        // Use current active tab if no tabId specified
        let targetTabId = tabId;
        if (!targetTabId) {
            const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
            targetTabId = activeTab.id;
        }
        
        // Capture screenshot
        const screenshotUrl = await chrome.tabs.captureVisibleTab(null, {
            format: format || 'png',
            quality: quality || 90
        });
        
        sendResponse({
            success: true,
            screenshotUrl: screenshotUrl
        });
        
    } catch (error) {
        console.error('Failed to take screenshot:', error);
        sendResponse({
            success: false,
            error: error.message || 'Failed to take screenshot'
        });
    }
}

function isValidProxyRequest(url) {
    try {
        const urlObj = new URL(url);
        
        // Allow requests from configured domains or common authenticated sites
        const allowedDomains = [
            'mobbin.com',
            'figma.com',
            'dribbble.com',
            'behance.net'
        ];
        
        return allowedDomains.some(domain => 
            urlObj.hostname === domain || urlObj.hostname.endsWith('.' + domain)
        );
    } catch (error) {
        console.error('Invalid URL for proxy request:', url);
        return false;
    }
}

// WebSocket connection for real-time communication
let wsConnection = null;
let connectionState = 'disconnected'; // 'disconnected', 'connecting', 'connected'
let reconnectAttempts = 0;
let maxReconnectAttempts = 5;
let reconnectDelay = 1000; // Start with 1 second
let connectionStats = {
    requestCount: 0,
    connectionTime: null,
    lastActivity: null
};

// WebSocket connection management
async function connectWebSocket() {
    if (connectionState === 'connected' || connectionState === 'connecting') {
        return { success: true };
    }
    
    try {
        connectionState = 'connecting';
        notifyConnectionStatusChanged();
        
        const wsUrl = `${API_DOMAIN.replace('http', 'ws')}/extension/ws`;
        console.log('Connecting to WebSocket:', wsUrl);
        
        wsConnection = new WebSocket(wsUrl);
        
        wsConnection.onopen = () => {
            console.log('WebSocket connected successfully');
            connectionState = 'connected';
            reconnectAttempts = 0;
            reconnectDelay = 1000;
            connectionStats.connectionTime = Date.now();
            connectionStats.lastActivity = Date.now();
            notifyConnectionStatusChanged();
            
            // Send initial ping
            sendWebSocketMessage({
                type: 'ping',
                timestamp: Date.now()
            });
        };
        
        wsConnection.onmessage = (event) => {
            try {
                const message = JSON.parse(event.data);
                handleWebSocketMessage(message);
            } catch (error) {
                console.error('Error parsing WebSocket message:', error);
            }
        };
        
        wsConnection.onclose = (event) => {
            console.log('WebSocket connection closed:', event.code, event.reason);
            connectionState = 'disconnected';
            wsConnection = null;
            notifyConnectionStatusChanged();
            
            // Attempt reconnection if it wasn't a manual disconnect
            if (event.code !== 1000 && reconnectAttempts < maxReconnectAttempts) {
                scheduleReconnect();
            }
        };
        
        wsConnection.onerror = (error) => {
            console.error('WebSocket error:', error);
            connectionState = 'disconnected';
            notifyConnectionStatusChanged();
        };
        
        return { success: true };
        
    } catch (error) {
        console.error('Failed to connect WebSocket:', error);
        connectionState = 'disconnected';
        notifyConnectionStatusChanged();
        return { success: false, error: error.message };
    }
}

function disconnectWebSocket() {
    if (wsConnection) {
        connectionState = 'disconnected';
        wsConnection.close(1000, 'Manual disconnect');
        wsConnection = null;
        notifyConnectionStatusChanged();
        resetConnectionStats();
    }
    return { success: true };
}

function sendWebSocketMessage(message) {
    if (wsConnection && wsConnection.readyState === WebSocket.OPEN) {
        wsConnection.send(JSON.stringify(message));
        connectionStats.lastActivity = Date.now();
        return true;
    }
    return false;
}

function handleWebSocketMessage(message) {
    console.log('Received WebSocket message:', message);
    connectionStats.lastActivity = Date.now();
    
    switch (message.type) {
        case 'connected':
            console.log('Connected to server with ID:', message.data?.connectionId);
            break;
            
        case 'proxy_request':
            handleProxyRequestFromServer(message);
            break;
            
        case 'pong':
            // Server responded to our ping
            break;
            
        default:
            console.log('Unknown message type:', message.type);
    }
}

async function handleProxyRequestFromServer(message) {
    try {
        const request = message.data;
        const { id, url, method, headers, body, options } = request;
        
        console.log('Processing server proxy request:', { id, url, method });
        
        // Make the proxy request using existing handler
        const proxyResponse = await new Promise((resolve) => {
            handleProxyRequest({ url, method, headers, body, options }, resolve);
        });
        
        // Send response back via WebSocket
        sendWebSocketMessage({
            type: 'proxy_response',
            requestId: id,
            data: proxyResponse,
            timestamp: Date.now()
        });
        
        connectionStats.requestCount++;
        notifyStatsUpdate();
        
    } catch (error) {
        console.error('Failed to process server proxy request:', error);
        
        // Send error response back via WebSocket
        sendWebSocketMessage({
            type: 'proxy_response',
            requestId: message.data?.id,
            data: {
                success: false,
                error: error.message || 'Failed to process proxy request'
            },
            timestamp: Date.now()
        });
    }
}

function scheduleReconnect() {
    reconnectAttempts++;
    const delay = Math.min(reconnectDelay * Math.pow(2, reconnectAttempts - 1), 30000); // Max 30 seconds
    
    console.log(`Scheduling reconnect attempt ${reconnectAttempts}/${maxReconnectAttempts} in ${delay}ms`);
    
    setTimeout(() => {
        if (connectionState === 'disconnected') {
            connectWebSocket();
        }
    }, delay);
}

function notifyConnectionStatusChanged() {
    // Notify popup and other parts of the extension
    chrome.runtime.sendMessage({
        action: 'connectionStatusChanged',
        status: connectionState,
        stats: getConnectionStats()
    }).catch(() => {
        // Ignore errors if no listeners
    });
}

function notifyStatsUpdate() {
    chrome.runtime.sendMessage({
        action: 'statsUpdate',
        data: getConnectionStats()
    }).catch(() => {
        // Ignore errors if no listeners
    });
}

function getConnectionStats() {
    return {
        ...connectionStats,
        connectionTime: connectionStats.connectionTime,
        lastActivity: connectionStats.lastActivity
    };
}

function resetConnectionStats() {
    connectionStats = {
        requestCount: 0,
        connectionTime: null,
        lastActivity: null
    };
}
