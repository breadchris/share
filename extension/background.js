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

// Load reconnection settings from storage
async function loadReconnectionSettings() {
    try {
        const result = await chrome.storage.sync.get([
            'autoReconnect',
            'maxReconnectAttempts', 
            'reconnectDelay'
        ]);
        
        autoReconnectEnabled = result.autoReconnect !== undefined ? result.autoReconnect : true;
        maxReconnectAttempts = result.maxReconnectAttempts || 5;
        reconnectDelay = result.reconnectDelay || 1000;
        
        console.log('Loaded reconnection settings:', {
            autoReconnectEnabled,
            maxReconnectAttempts,
            reconnectDelay
        });
    } catch (error) {
        console.error('Error loading reconnection settings:', error);
        // Use defaults
        autoReconnectEnabled = true;
        maxReconnectAttempts = 5;
        reconnectDelay = 1000;
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

// Initialize server URL, BrowserMCP port, and reconnection settings
loadServerUrl();
loadBrowserMCPPort();
loadReconnectionSettings();

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

    // Set default reconnection settings if not already set
    chrome.storage.sync.get(['autoReconnect', 'maxReconnectAttempts', 'reconnectDelay'], (result) => {
        const updates = {};
        if (result.autoReconnect === undefined) {
            updates.autoReconnect = true;
        }
        if (!result.maxReconnectAttempts) {
            updates.maxReconnectAttempts = 5;
        }
        if (!result.reconnectDelay) {
            updates.reconnectDelay = 1000;
        }
        if (Object.keys(updates).length > 0) {
            chrome.storage.sync.set(updates);
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
        loadReconnectionSettings();
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
            stats: getConnectionStats(),
            reconnectInfo: {
                attempts: reconnectAttempts,
                maxAttempts: maxReconnectAttempts,
                isReconnecting: isReconnecting,
                autoReconnectEnabled: autoReconnectEnabled
            }
        });
        return;
    }
    
    if (message.action === 'stopReconnection') {
        sendResponse(stopReconnection());
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
    
    // Handle console log messages from content scripts
    if (message.action === 'console_log') {
        const logEntry = {
            ...message.log,
            tab_id: sender.tab ? sender.tab.id : null,
            id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        };
        
        // Add to console logs storage
        consoleLogs.push(logEntry);
        
        // Trim logs if exceeding maximum
        if (consoleLogs.length > maxLogEntries) {
            consoleLogs = consoleLogs.slice(-maxLogEntries);
        }
        
        return;
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
        // Connect to our extension-mcp server instead of the chromedp-mcp server
        const mcpUrl = `${API_DOMAIN.replace('http', 'ws')}/extension-mcp/extension-ws`;
        console.log('Connecting to Extension MCP server:', mcpUrl);
        mcpConnection = new WebSocket(mcpUrl);
        
        mcpConnection.onopen = () => {
            console.log('Connected to Extension MCP server');
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
    console.log('Handling MCP message:', message);
    
    if (message.type === 'request') {
        // Handle MCP tool requests
        handleMCPToolRequest(message);
    } else if (message.type === 'notification') {
        // Handle notifications from MCP server
        console.log('MCP notification:', message.notification_type, message.data);
    } else {
        // Legacy message types for backward compatibility
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
}

// Handle MCP tool requests
async function handleMCPToolRequest(message) {
    const { action, request_id } = message;
    
    try {
        let response = { success: false };
        
        switch (action) {
            case 'get_console_logs':
                response = await handleGetConsoleLogs(message);
                break;
            case 'clear_console_logs':
                response = await handleClearConsoleLogs(message);
                break;
            case 'get_network_requests':
                response = await handleGetNetworkRequests(message);
                break;
            case 'get_request_details':
                response = await handleGetRequestDetails(message);
                break;
            case 'list_tabs':
                response = await handleListTabs(message);
                break;
            case 'connect_tab':
                response = await handleConnectTab(message);
                break;
            case 'get_tab_info':
                response = await handleGetTabInfo(message);
                break;
            default:
                response = {
                    success: false,
                    error: `Unknown action: ${action}`
                };
        }
        
        // Send response back to MCP server
        if (mcpConnection && mcpConnection.readyState === WebSocket.OPEN) {
            mcpConnection.send(JSON.stringify({
                type: 'response',
                request_id: request_id,
                ...response
            }));
        }
        
    } catch (error) {
        console.error('Error handling MCP tool request:', error);
        
        // Send error response
        if (mcpConnection && mcpConnection.readyState === WebSocket.OPEN) {
            mcpConnection.send(JSON.stringify({
                type: 'response',
                request_id: request_id,
                success: false,
                error: error.message
            }));
        }
    }
}

// Console log storage
let consoleLogs = [];
let maxLogEntries = 1000;

// Network request storage  
let networkRequests = [];
let maxNetworkEntries = 500;

// MCP Tool Handlers
async function handleGetConsoleLogs(message) {
    const { tab_id, level_filter, since, limit = 100 } = message;
    
    let filteredLogs = consoleLogs;
    
    // Filter by tab if specified
    if (tab_id) {
        filteredLogs = filteredLogs.filter(log => log.tab_id === parseInt(tab_id));
    }
    
    // Filter by level if specified
    if (level_filter) {
        filteredLogs = filteredLogs.filter(log => log.level === level_filter);
    }
    
    // Filter by timestamp if specified
    if (since) {
        const sinceTime = parseInt(since) * 1000; // Convert to milliseconds
        filteredLogs = filteredLogs.filter(log => log.timestamp >= sinceTime);
    }
    
    // Limit results
    filteredLogs = filteredLogs.slice(-limit);
    
    return {
        success: true,
        logs: filteredLogs
    };
}

async function handleClearConsoleLogs(message) {
    const { tab_id } = message;
    
    if (tab_id) {
        // Clear logs for specific tab
        consoleLogs = consoleLogs.filter(log => log.tab_id !== parseInt(tab_id));
    } else {
        // Clear all logs
        consoleLogs = [];
    }
    
    return {
        success: true,
        cleared_count: consoleLogs.length
    };
}

async function handleGetNetworkRequests(message) {
    const { tab_id, url_filter, method_filter, status_filter, limit = 50 } = message;
    
    let filteredRequests = networkRequests;
    
    // Filter by tab if specified
    if (tab_id) {
        filteredRequests = filteredRequests.filter(req => req.tab_id === parseInt(tab_id));
    }
    
    // Filter by URL pattern if specified
    if (url_filter) {
        const pattern = url_filter.replace(/\*/g, '.*');
        const regex = new RegExp(pattern, 'i');
        filteredRequests = filteredRequests.filter(req => regex.test(req.url));
    }
    
    // Filter by method if specified
    if (method_filter) {
        filteredRequests = filteredRequests.filter(req => req.method.toUpperCase() === method_filter.toUpperCase());
    }
    
    // Filter by status if specified
    if (status_filter) {
        if (status_filter.endsWith('xx')) {
            const statusPrefix = status_filter.charAt(0);
            filteredRequests = filteredRequests.filter(req => 
                req.status && req.status.toString().startsWith(statusPrefix)
            );
        } else {
            filteredRequests = filteredRequests.filter(req => 
                req.status === parseInt(status_filter)
            );
        }
    }
    
    // Limit results
    filteredRequests = filteredRequests.slice(-limit);
    
    return {
        success: true,
        requests: filteredRequests
    };
}

async function handleGetRequestDetails(message) {
    const { request_id } = message;
    
    const request = networkRequests.find(req => req.id === request_id);
    
    if (!request) {
        return {
            success: false,
            error: 'Request not found'
        };
    }
    
    return {
        success: true,
        request: request
    };
}

async function handleListTabs(message) {
    const { active_only, url_filter, title_filter, include_incognito = true } = message;
    
    try {
        let queryOptions = {};
        
        if (active_only) {
            queryOptions.active = true;
            queryOptions.currentWindow = true;
        }
        
        const tabs = await chrome.tabs.query(queryOptions);
        
        let filteredTabs = tabs;
        
        // Filter by URL pattern if specified
        if (url_filter) {
            const pattern = url_filter.replace(/\*/g, '.*');
            const regex = new RegExp(pattern, 'i');
            filteredTabs = filteredTabs.filter(tab => regex.test(tab.url));
        }
        
        // Filter by title pattern if specified
        if (title_filter) {
            const pattern = title_filter.replace(/\*/g, '.*');
            const regex = new RegExp(pattern, 'i');
            filteredTabs = filteredTabs.filter(tab => regex.test(tab.title));
        }
        
        // Filter incognito tabs if specified
        if (!include_incognito) {
            filteredTabs = filteredTabs.filter(tab => !tab.incognito);
        }
        
        // Format tab information
        const formattedTabs = filteredTabs.map(tab => ({
            id: tab.id,
            url: tab.url,
            title: tab.title,
            active: tab.active,
            window_id: tab.windowId,
            index: tab.index,
            status: tab.status,
            favicon_url: tab.favIconUrl,
            incognito: tab.incognito,
            highlighted: tab.highlighted,
            selected: tab.selected,
            pinned: tab.pinned,
            audible: tab.audible,
            muted: tab.mutedInfo?.muted || false,
            last_accessed: tab.lastAccessed
        }));
        
        return {
            success: true,
            tabs: formattedTabs
        };
        
    } catch (error) {
        return {
            success: false,
            error: error.message
        };
    }
}

async function handleConnectTab(message) {
    const { tab_id } = message;
    
    try {
        const tabId = parseInt(tab_id);
        const tab = await chrome.tabs.get(tabId);
        
        if (!tab) {
            return {
                success: false,
                error: 'Tab not found'
            };
        }
        
        // Add tab to connected tabs
        connectedTabs.add(tabId);
        
        // Inject content script for console monitoring
        try {
            await chrome.scripting.executeScript({
                target: { tabId: tabId },
                func: initializeConsoleMonitoring
            });
        } catch (error) {
            console.log('Console monitoring script injection failed:', error);
        }
        
        return {
            success: true,
            tab: {
                id: tab.id,
                url: tab.url,
                title: tab.title
            }
        };
        
    } catch (error) {
        return {
            success: false,
            error: error.message
        };
    }
}

async function handleGetTabInfo(message) {
    const { tab_id, include_console_count, include_network_count } = message;
    
    try {
        const tabId = parseInt(tab_id);
        const tab = await chrome.tabs.get(tabId);
        
        if (!tab) {
            return {
                success: false,
                error: 'Tab not found'
            };
        }
        
        const response = {
            success: true,
            tab: {
                id: tab.id,
                url: tab.url,
                title: tab.title,
                active: tab.active,
                window_id: tab.windowId,
                index: tab.index,
                status: tab.status,
                favicon_url: tab.favIconUrl,
                incognito: tab.incognito,
                highlighted: tab.highlighted,
                selected: tab.selected,
                pinned: tab.pinned,
                audible: tab.audible,
                muted: tab.mutedInfo?.muted || false,
                last_accessed: tab.lastAccessed
            }
        };
        
        // Add console count if requested
        if (include_console_count) {
            const consoleCount = consoleLogs.filter(log => log.tab_id === tabId).length;
            response.console_count = consoleCount;
        }
        
        // Add network count if requested
        if (include_network_count) {
            const networkCount = networkRequests.filter(req => req.tab_id === tabId).length;
            response.network_count = networkCount;
        }
        
        return response;
        
    } catch (error) {
        return {
            success: false,
            error: error.message
        };
    }
}

// Functions to be injected into content script
function initializeMCPConnection() {
    console.log('BrowserMCP content script initialized');
    // Add any tab-specific initialization here
}

// Console monitoring injection function
function initializeConsoleMonitoring() {
    if (window.mcpConsoleMonitoringEnabled) {
        return; // Already initialized
    }
    
    window.mcpConsoleMonitoringEnabled = true;
    
    // Store original console methods
    const originalConsole = {
        log: console.log.bind(console),
        warn: console.warn.bind(console),
        error: console.error.bind(console),
        info: console.info.bind(console),
        debug: console.debug.bind(console)
    };
    
    // Override console methods to capture logs
    function captureConsoleMessage(level, args) {
        // Call original console method
        originalConsole[level](...args);
        
        // Create log entry
        const logEntry = {
            level: level,
            message: args.map(arg => {
                if (typeof arg === 'object') {
                    try {
                        return JSON.stringify(arg, null, 2);
                    } catch (e) {
                        return String(arg);
                    }
                } else {
                    return String(arg);
                }
            }).join(' '),
            timestamp: Date.now(),
            url: window.location.href,
            stack: (new Error()).stack
        };
        
        // Send to background script
        try {
            chrome.runtime.sendMessage({
                action: 'console_log',
                log: logEntry
            });
        } catch (error) {
            // Ignore errors if extension context is unavailable
        }
    }
    
    // Override console methods
    console.log = (...args) => captureConsoleMessage('log', args);
    console.warn = (...args) => captureConsoleMessage('warn', args);
    console.error = (...args) => captureConsoleMessage('error', args);
    console.info = (...args) => captureConsoleMessage('info', args);
    console.debug = (...args) => captureConsoleMessage('debug', args);
    
    // Capture uncaught errors
    window.addEventListener('error', (event) => {
        const logEntry = {
            level: 'error',
            message: `Uncaught Error: ${event.message}`,
            timestamp: Date.now(),
            url: event.filename || window.location.href,
            line: event.lineno,
            column: event.colno,
            stack: event.error ? event.error.stack : ''
        };
        
        try {
            chrome.runtime.sendMessage({
                action: 'console_log',
                log: logEntry
            });
        } catch (error) {
            // Ignore errors if extension context is unavailable
        }
    });
    
    // Capture unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
        const logEntry = {
            level: 'error',
            message: `Unhandled Promise Rejection: ${event.reason}`,
            timestamp: Date.now(),
            url: window.location.href,
            stack: event.reason && event.reason.stack ? event.reason.stack : ''
        };
        
        try {
            chrome.runtime.sendMessage({
                action: 'console_log',
                log: logEntry
            });
        } catch (error) {
            // Ignore errors if extension context is unavailable
        }
    });
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
let connectionState = 'disconnected'; // 'disconnected', 'connecting', 'connected', 'reconnecting'
let reconnectAttempts = 0;
let maxReconnectAttempts = 5;
let reconnectDelay = 1000; // Start with 1 second
let autoReconnectEnabled = true; // Default to enabled
let isReconnecting = false;
let reconnectTimeoutId = null;
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
            
            // Attempt reconnection if it wasn't a manual disconnect and auto-reconnect is enabled
            if (event.code !== 1000 && autoReconnectEnabled && reconnectAttempts < maxReconnectAttempts) {
                scheduleReconnect();
            } else {
                // Reset reconnection state if not reconnecting
                isReconnecting = false;
                reconnectAttempts = 0;
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
    // Stop any ongoing reconnection attempts
    stopReconnection();
    
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
    if (!autoReconnectEnabled) {
        console.log('Auto-reconnect is disabled, not attempting to reconnect');
        return;
    }
    
    reconnectAttempts++;
    isReconnecting = true;
    connectionState = 'reconnecting';
    const delay = Math.min(reconnectDelay * Math.pow(2, reconnectAttempts - 1), 30000); // Max 30 seconds
    
    console.log(`Scheduling reconnect attempt ${reconnectAttempts}/${maxReconnectAttempts} in ${delay}ms`);
    notifyConnectionStatusChanged();
    
    reconnectTimeoutId = setTimeout(() => {
        if (connectionState === 'reconnecting' && isReconnecting) {
            connectWebSocket();
        }
    }, delay);
}

function stopReconnection() {
    console.log('Stopping reconnection attempts');
    
    if (reconnectTimeoutId) {
        clearTimeout(reconnectTimeoutId);
        reconnectTimeoutId = null;
    }
    
    isReconnecting = false;
    reconnectAttempts = 0;
    
    if (connectionState === 'reconnecting') {
        connectionState = 'disconnected';
        notifyConnectionStatusChanged();
    }
    
    return { success: true };
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

// Network request monitoring
const ongoingRequests = new Map();

// Monitor outgoing requests
chrome.webRequest.onBeforeRequest.addListener(
    (details) => {
        const requestEntry = {
            id: `req_${details.requestId}`,
            url: details.url,
            method: details.method,
            tab_id: details.tabId,
            request_time: Date.now(),
            type: details.type,
            request_body: details.requestBody ? details.requestBody : null
        };
        
        ongoingRequests.set(details.requestId, requestEntry);
    },
    { urls: ['<all_urls>'] },
    ['requestBody']
);

// Monitor request headers
chrome.webRequest.onBeforeSendHeaders.addListener(
    (details) => {
        const requestEntry = ongoingRequests.get(details.requestId);
        if (requestEntry) {
            const headers = {};
            if (details.requestHeaders) {
                details.requestHeaders.forEach(header => {
                    headers[header.name] = header.value;
                });
            }
            requestEntry.headers = headers;
        }
    },
    { urls: ['<all_urls>'] },
    ['requestHeaders']
);

// Monitor response headers
chrome.webRequest.onHeadersReceived.addListener(
    (details) => {
        const requestEntry = ongoingRequests.get(details.requestId);
        if (requestEntry) {
            requestEntry.status = details.statusCode;
            requestEntry.status_text = details.statusLine;
            requestEntry.response_time = Date.now();
            requestEntry.duration = requestEntry.response_time - requestEntry.request_time;
            
            const responseHeaders = {};
            if (details.responseHeaders) {
                details.responseHeaders.forEach(header => {
                    responseHeaders[header.name] = header.value;
                });
            }
            requestEntry.response_headers = responseHeaders;
        }
    },
    { urls: ['<all_urls>'] },
    ['responseHeaders']
);

// Monitor completed requests
chrome.webRequest.onCompleted.addListener(
    (details) => {
        const requestEntry = ongoingRequests.get(details.requestId);
        if (requestEntry) {
            requestEntry.status = details.statusCode;
            requestEntry.status_text = details.statusLine;
            requestEntry.response_time = Date.now();
            requestEntry.duration = requestEntry.response_time - requestEntry.request_time;
            
            // Add to network requests storage
            networkRequests.push(requestEntry);
            
            // Trim requests if exceeding maximum
            if (networkRequests.length > maxNetworkEntries) {
                networkRequests = networkRequests.slice(-maxNetworkEntries);
            }
            
            // Clean up ongoing requests
            ongoingRequests.delete(details.requestId);
        }
    },
    { urls: ['<all_urls>'] }
);

// Monitor failed requests
chrome.webRequest.onErrorOccurred.addListener(
    (details) => {
        const requestEntry = ongoingRequests.get(details.requestId);
        if (requestEntry) {
            requestEntry.error = details.error;
            requestEntry.response_time = Date.now();
            requestEntry.duration = requestEntry.response_time - requestEntry.request_time;
            
            // Add to network requests storage
            networkRequests.push(requestEntry);
            
            // Trim requests if exceeding maximum
            if (networkRequests.length > maxNetworkEntries) {
                networkRequests = networkRequests.slice(-maxNetworkEntries);
            }
            
            // Clean up ongoing requests
            ongoingRequests.delete(details.requestId);
        }
    },
    { urls: ['<all_urls>'] }
);
