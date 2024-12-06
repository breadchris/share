import PlainDraggable from "plain-draggable";
// import LeaderLine from "leader-line";

window.addEventListener("load", function () {
    let elementCounter = 1;
    let startElement = null; // Track the starting element for the leader line
    let lines = []; // Array to store all created lines

    // Function to store line objects and associated start and end elements
    const lineData = [];

    function createDraggable(element) {
        const draggable = new PlainDraggable(element, {
            onMove: function () {
                // Update any lines connected to this element
                // lineData.forEach((data) => {
                //     if (data.start === element || data.end === element) {
                //         data.line.position();
                //     }
                // });
            }
        });

        // Add click listener to handle leaderline logic
        element.addEventListener("click", (event) => {
            // event.stopPropagation(); // Prevent canvas click event from firing
            // if (!startElement) {
            //     // If there's no start, set this as the start
            //     startElement = element;
            //     element.classList.add("ring-2", "ring-blue-500"); // Add TailwindCSS class for highlighting
            // } else if (startElement === element) {
            //     // If clicking the same element, clear the start
            //     startElement.classList.remove("ring-2", "ring-blue-500");
            //     startElement = null;
            // } else {
            //     // If there's already a start, set this as the end and create a line
            //     const endElement = element;
            //     const line = new LeaderLine(startElement, endElement);
            //     line.setOptions({
            //         endPlug: "hand",
            //     })
            //
            //     console.log(line)
            //
            //     // Store the line and its connected elements
            //     lineData.push({ start: startElement, end: endElement, line });
            //
            //     // Add click listener for removing the line
            //     line.middleLabel = LeaderLine.pathLabel("Click to remove");
            //     line.pathLabel = { color: "black", fontSize: "12px" };
            //
            //     // line.container.addEventListener("click", () => {
            //     //     line.remove();
            //     //     const index = lineData.findIndex((data) => data.line === line);
            //     //     if (index > -1) lineData.splice(index, 1); // Remove from lineData array
            //     // });
            //
            //     // Clear the start and remove its TailwindCSS class
            //     startElement.classList.remove("ring-2", "ring-blue-500");
            //     startElement = null;
            // }
        });
    }

    function addDraggableElement(content, tag = "div", isImage = false) {
        const element = document.createElement(tag);
        element.className = "drag-drop w-fit";
        element.setAttribute("data-id", elementCounter++);
        element.style.position = "absolute"; // Ensures PlainDraggable works properly

        if (isImage) {
            element.src = content;
        } else {
            element.textContent = content;
        }

        document.getElementById("canvas").appendChild(element);
        createDraggable(element);
    }

    // Handle adding text
    document.getElementById("add-text").addEventListener("click", () => {
        addDraggableElement("write something");
    });

    // Handle adding images
    document.getElementById("add-image").addEventListener("click", () => {
        addDraggableElement("https://picsum.photos/200", "img", true);
    });

    // Add click listener to the canvas to reset the start element
    const canvas = document.getElementById("canvas");
    canvas.addEventListener("click", () => {
        if (startElement) {
            startElement.classList.remove("ring-2", "ring-blue-500");
            startElement = null;
        }
    });

    const container = canvas;
    container.addEventListener('paste', (event) => {
        const clipboardData = event.clipboardData;
        if (!clipboardData) return;

        let contentAdded = false;

        for (const item of clipboardData.items) {
            if (item.kind === 'string' && item.type === 'text/html') {
                item.getAsString((html) => {
                    console.log(html)
                    const htmlDiv = document.createElement('div');
                    htmlDiv.innerHTML = html;
                    htmlDiv.style.border = '1px dashed blue';
                    container.appendChild(htmlDiv);
                    contentAdded = true;
                });
            }
            // if (item.kind === 'file' && item.type.startsWith('image/')) {
            //     const file = item.getAsFile();
            //     if (file) {
            //         // TODO upload file
            //         const imageUrl = URL.createObjectURL(file);
            //         const img = document.createElement('img');
            //         img.src = imageUrl;
            //         img.style.maxWidth = '100%';
            //         img.style.border = '1px solid black';
            //         container.appendChild(img);
            //         createDraggable(img);
            //         contentAdded = true;
            //     }
            // }
        }

        if (!contentAdded) {
            const text = clipboardData.getData('text/plain');
            if (text) {
                const textDiv = document.createElement('div');
                textDiv.textContent = text;
                textDiv.style.border = '1px solid black';
                textDiv.style.padding = '5px';
                textDiv.style.backgroundColor = '#f9f9f9';
                container.appendChild(textDiv);
                contentAdded = true;
            }
        }

        if (!contentAdded) {
            const html = clipboardData.getData('text/html');
            if (html) {
                const htmlDiv = document.createElement('div');
                htmlDiv.innerHTML = html;
                htmlDiv.style.border = '1px dashed blue';
                container.appendChild(htmlDiv);
                contentAdded = true;
            }
        }

        if (!contentAdded) {
            alert('No supported content detected.');
        }
    });

    const dropZone = canvas;
    dropZone.addEventListener('dragover', (event) => {
        event.preventDefault();
        dropZone.style.borderColor = 'blue';
    });

    dropZone.addEventListener('dragleave', () => {
        dropZone.style.borderColor = 'gray';
    });

    dropZone.addEventListener('drop', async (event) => {
        event.preventDefault();
        dropZone.style.borderColor = 'gray';

        const dataTransfer = event.dataTransfer;
        if (!dataTransfer) return;

        const file = dataTransfer.files[0];
        if (file && file.type.startsWith('image/')) {
            const imageUrl = URL.createObjectURL(file);
            console.log('Image URL (from file):', imageUrl);

            displayImage(imageUrl);
        } else {
            const url = await getDraggedImageUrl(dataTransfer.items);
            if (url) {
                console.log('Image URL (from browser):', url);
                displayImage(url);
            } else {
                alert('Please drop a valid image or an image URL.');
            }
        }
    });

    const getDraggedImageUrl = async (items: DataTransferItemList): Promise<string | null> => {
        for (const item of items) {
            console.log(item)
            if (item.kind === 'string' && item.type === 'text/uri-list') {
                return new Promise((resolve) => {
                    item.getAsString((url) => {
                        resolve(url);
                    });
                });
            }
        }
        return null;
    };

    const displayImage = (imageUrl: string) => {
        const img = document.createElement('img');
        img.src = imageUrl;
        img.style.maxWidth = '100%';
        img.style.maxHeight = '100%';
        dropZone.textContent = '';
        dropZone.appendChild(img);
    };
});

function getHTML() {
    // const defs = document.getElementById("leader-line-defs");
    // const lines = document.getElementsByClassName("leader-line");
    const canvas = document.getElementById("canvas");

    // combine all the elements into a shadow div
    // const shadow = document.createElement("div");
    // shadow.appendChild(defs.cloneNode(true));
    // shadow.appendChild(canvas.cloneNode(true));
    // for (let i = 0; i < lines.length; i++) {
    //     shadow.appendChild(lines[i].cloneNode(true));
    // }
    // return shadow.innerHTML;
    return canvas.innerHTML;
}
window.getHTML = getHTML;