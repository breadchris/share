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
    if (event.ctrlKey && event.key === 'm') {
        event.preventDefault(); // Prevent default browser behavior for Ctrl+L
        if (isActive) {
            stopObserving();
        } else {
            startObserving();
        }
    }
});

const shadowHost = document.createElement('div');
document.body.appendChild(shadowHost);
const shadowRoot = shadowHost.attachShadow({ mode: 'open' });

let content = '';

const style = document.createElement('style');
style.textContent = `
  #drawer {
    position: fixed;
    top: 0;
    right: -20%;
    width: 20%;
    height: 100%;
    background-color: white;
    box-shadow: -2px 0 5px rgba(0,0,0,0.5);
    z-index: 1000;
    transition: right 0.3s;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
  }

  #drawer.active {
    right: 0;
  }

  #pen-icon {
    position: fixed;
    top: 50%;
    right: 0;
    width: 40px;
    height: 40px;
    background-color: #007bff;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    z-index: 1001;
  }

  #pen-icon:hover {
    background-color: #0056b3;
  }

  #annotations {
    flex: 1;
    overflow-y: auto;
    padding: 10px;
  }

  #save-button {
    padding: 10px;
    background-color: #007bff;
    color: white;
    text-align: center;
    cursor: pointer;
  }

  #save-button:hover {
    background-color: #0056b3;
  }

  .highlight {
    background-color: yellow;
  }

  .annotation-container {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 10px;
    margin-bottom: 10px;
    border: 1px solid #ddd;
    border-radius: 4px;
    background-color: #f9f9f9;
  }

  .annotation-text {
    flex: 1;
    margin-right: 10px;
  }

  .delete-button {
    background-color: #dc3545;
    color: white;
    border: none;
    padding: 5px 10px;
    cursor: pointer;
    border-radius: 4px;
  }

  .delete-button:hover {
    background-color: #c82333;
  }

    #tag-input-section {
    padding: 10px;
    border-top: 1px solid #ddd;
  }

  #tag-input {
    width: 100%;
    padding: 8px;
    margin-bottom: 10px;
    border: 1px solid #ccc;
    border-radius: 4px;
  }

  #tag-list {
    display: flex;
    flex-wrap: wrap;
    gap: 5px;
  }

  .tag {
    background-color: #007bff;
    color: white;
    padding: 5px 10px;
    border-radius: 4px;
  }

  #banner {
    background-color: #28a745;
    color: white;
    padding: 10px;
    text-align: center;
    font-size: 14px;
    border-bottom: 1px solid #ddd;
  }
`;
shadowRoot.appendChild(style);

// Create drawer element
const drawer = document.createElement('div');
drawer.id = 'drawer';
shadowRoot.appendChild(drawer);

// Create pen icon element
// const penIcon = document.createElement('div');
// penIcon.id = 'pen-icon';
// penIcon.textContent = '✏️';
// shadowRoot.appendChild(penIcon);
// penIcon.addEventListener('click', () => {
//   drawer.classList.toggle('active');
//   if (drawer.classList.contains('active')) {
//     restoreHighlights();
//   } else {
//     clearHighlights();
//   }
// });

const banner = document.createElement('div');
banner.id = 'banner';
banner.textContent = 'The page has been saved, enter tags or highlight and press "Ctrl + w" to annotate.';
drawer.appendChild(banner);

// Create tag input section
const tagInputSection = document.createElement('div');
tagInputSection.id = 'tag-input-section';
drawer.appendChild(tagInputSection);

const tagInput = document.createElement('input');
tagInput.id = 'tag-input';
tagInput.type = 'text';
tagInput.placeholder = 'Enter a tag and press Enter';
const stopPropagation = (event) => event.stopPropagation();
tagInput.addEventListener('keyup', stopPropagation);
tagInput.addEventListener('keydown', stopPropagation);
tagInput.addEventListener('keypress', stopPropagation);
tagInputSection.appendChild(tagInput);

const tagList = document.createElement('div');
tagList.id = 'tag-list';
tagInputSection.appendChild(tagList);

var allTags = [];

// Create save button
// const saveButton = document.createElement('div');
// saveButton.id = 'save-button';
// saveButton.textContent = 'Save';
// drawer.appendChild(saveButton);

// Create annotations list
const annotations = document.createElement('div');
annotations.id = 'annotations';
drawer.appendChild(annotations);

var allAnnotations = [];

// Store the highlighted text and its positions
let highlights = [];

// Function to highlight text given a range
const highlightText = (range) => {
    const span = document.createElement('span');
    span.className = 'highlight';
    span.style.backgroundColor = 'yellow';
    span.textContent = range.toString();
    range.deleteContents();
    range.insertNode(span);
    return span;
};

// Function to remove all highlights
const clearHighlights = () => {
    document.querySelectorAll('.highlight').forEach(span => {
        span.replaceWith(span.textContent);
    });
};

// Function to restore all highlights
const restoreHighlights = () => {
    highlights.forEach(({ text, parentNode }) => {
        const walker = document.createTreeWalker(parentNode, NodeFilter.SHOW_TEXT, null, false);
        let node;
        while (node = walker.nextNode()) {
            const index = node.nodeValue.indexOf(text);
            if (index !== -1) {
                const range = document.createRange();
                range.setStart(node, index);
                range.setEnd(node, index + text.length);
                highlightText(range);
                break;
            }
        }
    });
};

// Event listeners

function newAnnotation(selectedText, span) {
    const annotationContainer = document.createElement('div');
    annotationContainer.className = 'annotation-container';
    annotationContainer.style.flexDirection = 'column';

    const annotation = document.createElement('span');
    annotation.className = 'annotation-text';
    annotation.textContent = selectedText;

    const deleteButton = document.createElement('button');
    deleteButton.className = 'delete-button';
    deleteButton.textContent = 'Delete';
    deleteButton.addEventListener('click', () => {
        annotations.removeChild(annotationContainer);
        span?.replaceWith(span.textContent); // Remove highlight
        highlights = highlights.filter(highlight => highlight.text !== selectedText);
        allAnnotations = allAnnotations.filter(annotation => annotation !== selectedText);
    });

    annotationContainer.appendChild(annotation);
    annotationContainer.appendChild(deleteButton);
    annotations.appendChild(annotationContainer);
    allAnnotations.push(selectedText);
}

open = false;

// Event listener for toggling the drawer with Ctrl + L
document.addEventListener('keydown', async (event) => {
    if (event.ctrlKey && event.key.toLowerCase() === 'l') {
        if (open) {
            return;
        }

        c = await prepareContent();
        console.log(c);
        await (async () => {
            chrome.runtime.sendMessage({ action: 'sharePage', data: {
                    annotations: allAnnotations,
                    tags: allTags,
                    html: c.content,
                }}, (response) => {
                console.log('Response from background:', response);
            });
        })();
        drawer.classList.toggle('active');
        if (drawer.classList.contains('active')) {
            restoreHighlights();
        } else {
            clearHighlights();
        }
        event.preventDefault(); // Prevent default browser behavior for Ctrl + L
    }
    if (event.ctrlKey && event.key.toLowerCase() === 'w') {
        const selectedText = window.getSelection().toString().trim();
        if (selectedText) {
            const range = window.getSelection().getRangeAt(0);
            const span = highlightText(range);

            highlights.push({
                text: selectedText,
                parentNode: range.commonAncestorContainer.parentNode
            });

            newAnnotation(selectedText, span);
            window.getSelection().removeAllRanges();
        }
    }
});

const addImageEventListeners = () => {
    const images = document.querySelectorAll('img');
    images.forEach(img => {
        img.addEventListener('click', (event) => {
            console.log('Image clicked', event.target.src);
            event.preventDefault(); // Prevent default behavior of the image
            event.stopPropagation(); // Stop the click event from propagating

            const imgElement = event.target;
            imgElement.classList.toggle('highlight');
            const isHighlighted = imgElement.classList.contains('highlight');

            if (isHighlighted) {
                highlights.push({
                    element: imgElement,
                    type: 'image',
                    content: imgElement.src
                });
            } else {
                highlights = highlights.filter(highlight => highlight.content !== imgElement.src);
            }

            newAnnotation(imgElement.src, undefined);
        }, true);
    });
};

// Call the function to add event listeners when the DOM is fully loaded
// window.addEventListener('load', addImageEventListeners);
// const observer = new MutationObserver(addImageEventListeners);
// observer.observe(document.body, { childList: true, subtree: true });

// saveButton.addEventListener('click', () => {
//   chrome.runtime.sendMessage({ action: 'sharePage', data: {
//     annotations: allAnnotations,
//     tags: allTags,
//   }}, (response) => {
//     console.log('Response from background:', response);
//   });
// });

tagInput.addEventListener('keyup', (event) => {
    if (event.key === 'Enter') {
        const tagText = tagInput.value.trim();
        if (tagText.length > 0) {
            const tag = document.createElement('div');
            tag.className = 'tag';
            tag.textContent = tagText;
            tag.onclick = () => {
                tagList.removeChild(tag);
                allTags = allTags.filter(tag => tag !== tagText);
            };
            tagList.appendChild(tag);
            tagInput.value = '';
            allTags.push(tagText);

            console.log('All tags:', allTags);
            (async () => {
                chrome.runtime.sendMessage({ action: 'sharePage', data: {
                        annotations: allAnnotations,
                        tags: allTags,
                        html: content,
                    }}, (response) => {
                    console.log('Response from background:', response);
                });
            })()
        }
    }
});