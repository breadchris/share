import interact from "interactjs";
import DomInspector from "./src/index"

window.addEventListener("load", function () {
    // const inspector = new DomInspector();
    // inspector.enable();

    interact('.rotation-handle')
        .draggable({
            onstart: function(event) {
                var box = event.target.parentElement;
                var rect = box.getBoundingClientRect();

                // store the center as the element has css `transform-origin: center center`
                box.setAttribute('data-center-x', rect.left + rect.width / 2);
                box.setAttribute('data-center-y', rect.top + rect.height / 2);
                // get the angle of the element when the drag starts
                box.setAttribute('data-angle', getDragAngle(event));
            },
            onmove: function(event) {
                var box = event.target.parentElement;

                var pos = {
                    x: parseFloat(box.getAttribute('data-x')) || 0,
                    y: parseFloat(box.getAttribute('data-y')) || 0
                };

                var angle = getDragAngle(event);

                // update transform style on dragmove
                box.style.transform = 'translate(' + pos.x + 'px, ' + pos.y + 'px) rotate(' + angle + 'rad' + ')';
            },
            onend: function(event) {
                var box = event.target.parentElement;

                // save the angle on dragend
                box.setAttribute('data-angle', getDragAngle(event));
            },
        })

    function getDragAngle(event) {
        var box = event.target.parentElement;
        var startAngle = parseFloat(box.getAttribute('data-angle')) || 0;
        var center = {
            x: parseFloat(box.getAttribute('data-center-x')) || 0,
            y: parseFloat(box.getAttribute('data-center-y')) || 0
        };
        var angle = Math.atan2(center.y - event.clientY,
            center.x - event.clientX);

        return angle - startAngle;
    }

    const canvas = document.getElementById("canvas");
    const container = canvas;
    container.addEventListener('paste', (event) => {
        const clipboardData = event.clipboardData;
        if (!clipboardData) return;

        let contentAdded = false;

        for (const item of clipboardData.items) {
            // if (item.kind === 'string' && item.type === 'text/html') {
            //     item.getAsString((html) => {
            //         console.log(html)
            //         addDraggableElement(html);
            //         contentAdded = true;
            //     });
            // }
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
                addDraggableElement(text, "div", "", true);
                contentAdded = true;
            }
        }

        if (!contentAdded) {
            const html = clipboardData.getData('text/html');
            if (html) {
                addDraggableElement(html, "div", "", true);
                contentAdded = true;
            }
        }

        if (!contentAdded) {
            alert('No supported content detected.');
        }
    });

    // const dropZone = canvas;
    // dropZone.addEventListener('dragover', (event) => {
    //     event.preventDefault();
    //     dropZone.style.borderColor = 'blue';
    // });
    //
    // dropZone.addEventListener('dragleave', () => {
    //     dropZone.style.borderColor = 'gray';
    // });
    //
    // dropZone.addEventListener('drop', async (event) => {
    //     event.preventDefault();
    //     dropZone.style.borderColor = 'gray';
    //
    //     const dataTransfer = event.dataTransfer;
    //     if (!dataTransfer) return;
    //
    //     const file = dataTransfer.files[0];
    //     if (file && file.type.startsWith('image/')) {
    //         const imageUrl = URL.createObjectURL(file);
    //         console.log('Image URL (from file):', imageUrl);
    //
    //         displayImage(imageUrl);
    //     } else {
    //         const url = await getDraggedImageUrl(dataTransfer.items);
    //         if (url) {
    //             console.log('Image URL (from browser):', url);
    //             displayImage(url);
    //         } else {
    //             alert('Please drop a valid image or an image URL.');
    //         }
    //     }
    // });

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

    let overlappingParents: Set<HTMLElement> = new Set();
    let contextMenu: HTMLElement | null = null;
    let elementCounter: number = 0;

    function createDraggable(element: HTMLElement) {
        // <div class="rotation-handle">&circlearrowright;</div>
        const rotationHandle = document.createElement("div");
        rotationHandle.className = "rotation-handle";
        rotationHandle.textContent = "🔄";
        element.appendChild(rotationHandle);
        interact(element)
            .resizable({
                // resize from all edges and corners
                edges: { left: true, right: true, bottom: true, top: true },

                listeners: {
                    move (event) {
                        var target = event.target
                        var x = (parseFloat(target.getAttribute('data-x')) || 0)
                        var y = (parseFloat(target.getAttribute('data-y')) || 0)

                        target.style.width = event.rect.width + 'px'
                        target.style.height = event.rect.height + 'px'

                        x += event.deltaRect.left
                        y += event.deltaRect.top

                        target.style.transform = 'translate(' + x + 'px,' + y + 'px)'

                        target.setAttribute('data-x', x)
                        target.setAttribute('data-y', y)
                        // target.textContent = Math.round(event.rect.width) + '\u00D7' + Math.round(event.rect.height)
                    }
                },
                modifiers: [
                    interact.modifiers.restrictEdges({
                        outer: 'parent'
                    }),

                    interact.modifiers.restrictSize({
                        min: { width: 100, height: 50 }
                    })
                ],

                inertia: true
            })
            .draggable({
                modifiers: [
                    interact.modifiers.restrictRect({
                        restriction: 'parent',
                        endOnly: true
                    })
                ],
            listeners: {
                move(event) {
                    const target = event.target as HTMLElement;
                    const dx = (parseFloat(target.getAttribute("data-x") || "0") || 0) + event.dx;
                    const dy = (parseFloat(target.getAttribute("data-y") || "0") || 0) + event.dy;

                    target.style.transform = `translate(${dx}px, ${dy}px)`;
                    target.setAttribute("data-x", dx.toString());
                    target.setAttribute("data-y", dy.toString());
                },
                end(event) {
                    const target = event.target as HTMLElement;

                    if (overlappingParents.size > 1) {
                        showContextMenu(event.clientX, event.clientY, target);
                    } else if (overlappingParents.size === 1) {
                        const container = Array.from(overlappingParents)[0];
                        handlePlacement(container, target);
                    }

                    clearHighlights();
                },
            },
        });
    }

    function addDraggableElement(content: string, tag: string = "div", className: string = "", isImage: boolean = false): void {
        const element = document.createElement(tag);
        element.className = className + " draggable w-fit";
        element.setAttribute("data-id", (elementCounter++).toString());
        element.style.position = "absolute";
        element.contentEditable = !isImage ? "true" : "false";

        if (isImage) {
            (element as HTMLImageElement).src = content;
        } else {
            element.textContent = content;
        }

        document.getElementById("canvas")?.appendChild(element);
        createDraggable(element);
    }

    document.getElementById("add-container")?.addEventListener("click", () => {
        addDraggableElement("a container!", "div", "container border-2 border-gray-300 p-4 rounded-md my-4");
    });

    document.getElementById("add-text")?.addEventListener("click", () => {
        addDraggableElement("Write something");
    });

    document.getElementById("add-image")?.addEventListener("click", () => {
        addDraggableElement("https://picsum.photos/200", "img", "", true);
    });

    interact(".container").dropzone({
        ondragenter(event) {
            const target = event.target as HTMLElement;
            overlappingParents.add(target);
            target.classList.add("highlight");
        },
        ondragleave(event) {
            const target = event.target as HTMLElement;
            overlappingParents.delete(target);
            target.classList.remove("highlight");
        },
        ondropmove(event) {
            // const container = event.target as HTMLElement;
            // const draggedElement = event.relatedTarget as HTMLElement;
            // suggestPlacement(container, draggedElement);
        },
    });

    function suggestPlacement(container: HTMLElement, draggedElement: HTMLElement) {
        clearPlacementMarkers(container);

        const centerY = draggedElement.getBoundingClientRect().top + draggedElement.offsetHeight / 2;
        const children = Array.from(container.children);

        for (let i = 0; i < children.length; i++) {
            const child = children[i] as HTMLElement;
            const childRect = child.getBoundingClientRect();
            const childCenterY = childRect.top + childRect.height / 2;

            if (centerY < childCenterY) {
                addPlacementMarker(container, child);
                return;
            }
        }
        addPlacementMarker(container, null);
    }

    function addPlacementMarker(container: HTMLElement, referenceNode: Element | null) {
        const marker = document.createElement("div");
        marker.className = "placement-marker";

        if (referenceNode) {
            container.insertBefore(marker, referenceNode);
        } else {
            container.appendChild(marker);
        }
    }

    function handlePlacement(container: HTMLElement, draggedElement: HTMLElement) {
        const marker = container.querySelector(".placement-marker");
        console.log(marker)
        if (marker) {
            const referenceNode = marker.nextSibling;

            draggedElement.style.transform = "none";

            container.insertBefore(draggedElement, referenceNode);
            clearPlacementMarkers(container);
        }
    }

    function showContextMenu(x: number, y: number, draggedElement: HTMLElement) {
        clearContextMenu();

        contextMenu = document.createElement("div");
        contextMenu.className = "context-menu";
        contextMenu.style.top = `${y}px`;
        contextMenu.style.left = `${x}px`;

        overlappingParents.forEach((parent) => {
            const button = document.createElement("button");
            button.textContent = `Insert into ${parent.id}`;
            button.addEventListener("click", () => {
                handlePlacement(parent, draggedElement);
                clearContextMenu();
            });
            contextMenu!.appendChild(button);
        });

        document.body.appendChild(contextMenu);
    }

    function clearHighlights() {
        overlappingParents.forEach((parent) => parent.classList.remove("highlight"));
        overlappingParents.clear();
    }

    function clearContextMenu() {
        if (contextMenu) {
            contextMenu.remove();
            contextMenu = null;
        }
    }

// Clear placement markers
    function clearPlacementMarkers(container: HTMLElement) {
        const markers = container.querySelectorAll(".placement-marker");
        markers.forEach((marker) => marker.remove());
    }

});
function getHTML() {
    const canvas = document.getElementById("canvas");
    return canvas.innerHTML;
}
window.getHTML = getHTML;