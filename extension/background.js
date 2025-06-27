// Default server URL
const DEFAULT_SERVER_URL = 'https://justshare.io';
let BASE_ROUTE = DEFAULT_SERVER_URL;

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

// Load server URL from storage on startup
async function loadServerUrl() {
    try {
        const result = await chrome.storage.sync.get(['serverUrl']);
        BASE_ROUTE = result.serverUrl || DEFAULT_SERVER_URL;
        console.log('Loaded server URL:', BASE_ROUTE);
    } catch (error) {
        console.error('Error loading server URL:', error);
        BASE_ROUTE = DEFAULT_SERVER_URL;
    }
}

// Initialize server URL and BrowserMCP port
loadServerUrl();
loadBrowserMCPPort();

chrome.runtime.onInstalled.addListener(() => {
    // Set default server URL if not already set
    chrome.storage.sync.get(['serverUrl'], (result) => {
        if (!result.serverUrl) {
            chrome.storage.sync.set({ serverUrl: DEFAULT_SERVER_URL });
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
        fetch(`${BASE_ROUTE}/extension/save`, {
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

        // Send the data to the configured server
        fetch(`${BASE_ROUTE}/extension/`, {
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
        // Send the data to the configured server
        const response = await fetch(`${BASE_ROUTE}/extension/save`, {
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
