import { Doc } from 'yjs';
// For this example we use the WebrtcProvider to synchronize the document
// between multiple clients. Other providers are available.
// You can find a list here: https://docs.yjs.dev/ecosystem/connection-provider
import { WebrtcProvider } from 'y-webrtc';
import {WebsocketProvider} from "y-websocket";

const ydoc = new Doc();
//new WebrtcProvider('REACTFLOW-COLLAB-EXAMPLE', ydoc);
new WebsocketProvider('ws://localhost:8080/graph/yjs', 'reactflow-collab-example', ydoc);

export default ydoc;
