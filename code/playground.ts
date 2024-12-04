import interact from "interactjs";

let elementCounter = 1;

function createDraggableText(content) {
    const div = document.createElement("div");
    div.className = "drag-drop w-fit";
    div.setAttribute("data-id", elementCounter++);
    div.style.transform = "translate(0px, 0px)";
    div.textContent = content;
    div.contentEditable = "true";

    document.getElementById("canvas").appendChild(div);
    enableDragDrop(div);
}

function dragMoveListener(event) {
    const target = event.target;

    let x = (parseFloat(target.getAttribute("data-x")) || 0) + event.dx;
    let y = (parseFloat(target.getAttribute("data-y")) || 0) + event.dy;

    target.style.transform = `translate(${x}px, ${y}px)`;

    target.setAttribute("data-x", x);
    target.setAttribute("data-y", y);
}

function getPotentialParent(element) {
    const rect = element.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const elements = document.elementsFromPoint(centerX, centerY);

    return elements.find(
        (el) =>
            el !== element &&
            el.classList.contains("drag-drop") &&
            el.id !== "canvas"
    );
}

interact(".drag-drop")
    .draggable({
        inertia: true,
        modifiers: [
            interact.modifiers.restrictRect({
                restriction: "parent",
                endOnly: true,
            }),
        ],
        autoScroll: true,
        listeners: { move: dragMoveListener },
    })
    .on("dragmove", (event) => {
        const potentialParent = getPotentialParent(event.target);

        document
            .querySelectorAll(".drag-drop.highlight")
            .forEach((el) => el.classList.remove("highlight"));

        if (potentialParent) {
            potentialParent.classList.add("highlight");
        }
    })
    .on("dragend", (event) => {
        const potentialParent = getPotentialParent(event.target);

        if (potentialParent) {
            // potentialParent.classList.remove("highlight");
            //
            // potentialParent.appendChild(event.target);

            // potentialParent.classList.add("flex", "flex-row", "gap-2");

            // event.target.style.transform = "translate(0px, 0px)";
            // event.target.setAttribute("data-x", 0);
            // event.target.setAttribute("data-y", 0);
        } else {
            document
                .querySelectorAll(".drag-drop.highlight")
                .forEach((el) => el.classList.remove("highlight"));
        }
    });

function getHTML() {
    return document.getElementById("canvas").innerHTML;
}
window.getHTML = getHTML;

document.getElementById("add-text").addEventListener("click", () => {
    createDraggableText("New Text");
});

document.getElementById("add-chat").addEventListener("click", () => {
    fetch("/chat", {
        method: "GET",
    })
        .then((res) => res.text())
        .then((text) => {
        const div = document.createElement("div");
        div.className = "drag-drop";
        div.setAttribute("data-id", elementCounter++);
        div.style.transform = "translate(0px, 0px)";
        div.innerHTML = text

        document.getElementById("canvas").appendChild(div);
    });
});
