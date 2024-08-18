// server.js
const WebSocket = require('ws');
const http = require('http');
const Y = require('yjs');
const { encodeStateAsUpdate, applyUpdate } = require('yjs');

// Maps document names to Yjs documents
const docs = new Map();

const port = process.env.PORT || 1234;
const server = http.createServer();
const wss = new WebSocket.Server({ server });

// Function to get or create a Yjs document
const getYDoc = (docName) => {
  if (!docs.has(docName)) {
    const ydoc = new Y.Doc();
    docs.set(docName, ydoc);
  }
  return docs.get(docName);
};

wss.on('connection', (ws, req) => {
  const docName = req.url.slice(1); // Get the document name from the URL
  const ydoc = getYDoc(docName);

  // Send the initial document state to the client
  ws.send(encodeStateAsUpdate(ydoc));

  // Apply incoming updates to the Yjs document and broadcast them
  ws.on('message', (message) => {
    console.log('Received message:', message);

    try {
      const update = new Uint8Array(message);
      applyUpdate(ydoc, update);

      // Broadcast the update to all other clients
      wss.clients.forEach((client) => {
        if (client !== ws && client.readyState === WebSocket.OPEN) {
          client.send(update);
        }
      });
    } catch (error) {
      console.error('Failed to process message:', error);
    }
  });

  ws.on('close', () => {
    // Handle cleanup if necessary
  });
});

server.listen(port, () => {
  console.log(`Yjs WebSocket server running on port ${port}`);
});
