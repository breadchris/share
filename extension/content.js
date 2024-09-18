let observer = null;
let isActive = false;

// Function to add the small indicator in the bottom right of the page
function showIndicator() {
    const existingIndicator = document.getElementById('extension-active-indicator');
    if (!existingIndicator) {
        const indicator = document.createElement('div');
        indicator.id = 'extension-active-indicator';
        indicator.textContent = 'Active';
        indicator.style.position = 'fixed';
        indicator.style.bottom = '10px';
        indicator.style.right = '10px';
        indicator.style.backgroundColor = 'green';
        indicator.style.color = 'white';
        indicator.style.padding = '5px';
        indicator.style.borderRadius = '5px';
        indicator.style.zIndex = '1000';
        document.body.appendChild(indicator);
    }
}

function hideIndicator() {
    const indicator = document.getElementById('extension-active-indicator');
    if (indicator) {
        indicator.remove();
    }
}

// Function to handle mutation events
function handleMutation(mutations) {
    mutations.forEach(mutation => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
            const element = mutation.target;
            const className = element.getAttribute('class');
            const dataGodom = element.getAttribute('data-godom') || '';

            // Send message to background script with the modified class and data-godom
            chrome.runtime.sendMessage({
                action: "modifyClass",
                class: className,
                dataGodom: dataGodom
            });
        }
    });
}

// Function to start observing class changes
function startObserving() {
    if (!observer) {
        observer = new MutationObserver(handleMutation);
    }
    observer.observe(document.body, {
        attributes: true,
        attributeFilter: ['class'],
        subtree: true
    });
    isActive = true;
    showIndicator();
}

// Function to stop observing class changes
function stopObserving() {
    if (observer) {
        observer.disconnect();
    }
    isActive = false;
    hideIndicator();
}

// Listen for keydown events to activate/deactivate the extension
document.addEventListener('keydown', (event) => {
    if (event.ctrlKey && event.key === 'l') {
        event.preventDefault(); // Prevent default browser behavior for Ctrl+L
        if (isActive) {
            stopObserving();
        } else {
            startObserving();
        }
    }
});
