import * as Y from 'yjs';
import {WebsocketProvider} from "y-websocket";

export const ydoc = new Y.Doc();
export const provider = new WebsocketProvider('ws://localhost:1234', 'your-room-name', ydoc);
