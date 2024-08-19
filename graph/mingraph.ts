import * as Y from 'yjs';
import {WebsocketProvider} from "y-websocket";

const ydoc = new Y.Doc();
const provider = new WebsocketProvider('ws://localhost:1234', 'whiteboard-demo', ydoc);
const board = document.getElementById('graph');
const nodes = ydoc.getMap('nodes');
const edges = ydoc.getArray('edges');
let lastAddedNodeId = null;
let secondLastAddedNodeId = null;

// Sync existing nodes and edges
nodes.observe(event => {
    event.changes.keys.forEach((change, key) => {
        if (change.action === 'add') {
            const node = nodes.get(key);
            createNodeElement(key, node.x, node.y);
        }
    });
});

edges.observe(event => {
    event.changes.added.forEach(edge => {
        createEdgeElement(edge.start, edge.end);
    });
});

function createNodeElement(id, x, y) {
    const node = document.createElement('div');
    node.className = 'node';
    node.style.left = `${x}px`;
    node.style.top = `${y}px`;
    node.innerText = id;
    node.draggable = true;

    node.addEventListener('dragend', e => {
        nodes.set(id, { x: e.clientX, y: e.clientY });
    });

    board.appendChild(node);
}

function createEdgeElement(s, e) {
    const start = s;
    const end = e;
    const startNode = document.getElementById(start);
    const endNode = document.getElementById(end);
    const edge = document.createElement('div');
    edge.className = 'edge';
    board.appendChild(edge);

    function updateEdge() {
        const startNode = document.getElementById(start);
        const endNode = document.getElementById(end);
        const startRect = startNode.getBoundingClientRect();
        const endRect = endNode.getBoundingClientRect();
        const x1 = startRect.left + startRect.width / 2;
        const y1 = startRect.top + startRect.height / 2;
        const x2 = endRect.left + endRect.width / 2;
        const y2 = endRect.top + endRect.height / 2;
        const length = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
        edge.style.width = `${length}px`;
        edge.style.left = `${x1}px`;
        edge.style.top = `${y1}px`;
        const angle = Math.atan2(y2 - y1, x2 - x1) * 180 / Math.PI;
        edge.style.transform = `rotate(${angle}deg)`;
    }

    updateEdge();
    new ResizeObserver(updateEdge).observe(startNode);
    new ResizeObserver(updateEdge).observe(endNode);
}

// Creating new nodes
board.addEventListener('dblclick', e => {
    const id = `node-${Math.random().toString(36).substr(2, 9)}`;
    nodes.set(id, { x: e.clientX, y: e.clientY });
});

// Creating new edges (for simplicity, click two nodes consecutively)
let lastClickedNode = null;
board.addEventListener('click', e => {
    const target = e.target;
    if (target.className === 'node') {
        if (lastClickedNode) {
            edges.push([{ start: lastClickedNode.id, end: target.innerText }]);
            lastClickedNode = null;
        } else {
            lastClickedNode = target;
        }
    }
});

// Initial sync of existing nodes and edges
nodes.forEach((value, key) => {
    createNodeElement(key, value.x, value.y);
});

edges.forEach(edge => {
    createEdgeElement(edge.start, edge.end);
});

document.getElementById('addText1').addEventListener('click', () => {
    addTextNode('Hello');
});

document.getElementById('addText2').addEventListener('click', () => {
    addTextNode('World');
});

document.getElementById('connectNodes').addEventListener('click', () => {
    if (lastAddedNodeId && secondLastAddedNodeId) {
        edges.push([{ start: secondLastAddedNodeId, end: lastAddedNodeId }]);
    }
});

function addTextNode(text) {
    const id = `node-${Math.random().toString(36).substr(2, 9)}`;
    const x = Math.random() * (board.offsetWidth - 100);
    const y = Math.random() * (board.offsetHeight - 50);

    nodes.set(id, { x, y, text });

    secondLastAddedNodeId = lastAddedNodeId;
    lastAddedNodeId = id;
}