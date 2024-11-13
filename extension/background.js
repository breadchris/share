let BASE_ROUTE = 'http://localhost:8080';

chrome.runtime.onInstalled.addListener(() => {
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
    if (message.action === "modifyClass") {
        (async () => {
            const { class: className, dataGodom } = message;

            // Send the data to localhost:8080/modify
            fetch('http://localhost:8080/modify', {
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

        // Send the data to the server
        fetch('http://localhost:8080/extension/', {
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
        // Send the data to the local server
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
        // Send the data to the local server
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
        // Send the data to the local server
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
