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
                lineData.forEach((data) => {
                    if (data.start === element || data.end === element) {
                        data.line.position();
                    }
                });
            }
        });

        // Add click listener to handle leaderline logic
        element.addEventListener("click", (event) => {
            event.stopPropagation(); // Prevent canvas click event from firing
            if (!startElement) {
                // If there's no start, set this as the start
                startElement = element;
                element.classList.add("ring-2", "ring-blue-500"); // Add TailwindCSS class for highlighting
            } else if (startElement === element) {
                // If clicking the same element, clear the start
                startElement.classList.remove("ring-2", "ring-blue-500");
                startElement = null;
            } else {
                // If there's already a start, set this as the end and create a line
                const endElement = element;
                const line = new LeaderLine(startElement, endElement);
                line.setOptions({
                    endPlug: "hand",
                })

                console.log(line)

                // Store the line and its connected elements
                lineData.push({ start: startElement, end: endElement, line });

                // Add click listener for removing the line
                line.middleLabel = LeaderLine.pathLabel("Click to remove");
                line.pathLabel = { color: "black", fontSize: "12px" };

                // line.container.addEventListener("click", () => {
                //     line.remove();
                //     const index = lineData.findIndex((data) => data.line === line);
                //     if (index > -1) lineData.splice(index, 1); // Remove from lineData array
                // });

                // Clear the start and remove its TailwindCSS class
                startElement.classList.remove("ring-2", "ring-blue-500");
                startElement = null;
            }
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
    document.getElementById("canvas").addEventListener("click", () => {
        if (startElement) {
            startElement.classList.remove("ring-2", "ring-blue-500");
            startElement = null;
        }
    });
});

function getHTML() {
    const defs = document.getElementById("leader-line-defs");
    const lines = document.getElementsByClassName("leader-line");
    const canvas = document.getElementById("canvas");

    // combine all the elements into a shadow div
    const shadow = document.createElement("div");
    shadow.appendChild(defs.cloneNode(true));
    shadow.appendChild(canvas.cloneNode(true));
    for (let i = 0; i < lines.length; i++) {
        shadow.appendChild(lines[i].cloneNode(true));
    }
    return shadow.innerHTML;
}
window.getHTML = getHTML;
