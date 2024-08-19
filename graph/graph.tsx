import React, {useCallback, useRef} from 'react';
import {
    ReactFlow,
    MiniMap,
    Controls,
    Background,
    useNodesState,
    useEdgesState,
    Node,
    addEdge, useReactFlow, Connection, ReactFlowProvider,
} from '@xyflow/react';

import '@xyflow/react/dist/style.css';
import {useNodesStateSynced} from "./useNodesStateSynced";
import {useEdgesStateSynced} from "./useEdgesStateSynced";

const initialNodes = [
    { id: '1', position: { x: 0, y: 0 }, data: { label: '1' } },
    { id: '2', position: { x: 0, y: 100 }, data: { label: '2' } },
];
const initialEdges = [{ id: 'e1-2', source: '1', target: '2' }];

let id = 1;
const getId = () => `${id++}`;

export default function App() {
    const {nodes, onNodesChange, setNodes} = useNodesStateSynced();
    const {edges, onEdgesChange, setEdges} = useEdgesStateSynced();
    const onConnect = (params: Connection) => {
        connectingNodeId.current = null;
        onEdgesChange([addEdge(params, edges)]);
        onNodesChange([addEdge(params, nodes)]);
    }

    const reactFlowWrapper = useRef(null);
    const connectingNodeId = useRef(null);
    const { screenToFlowPosition } = useReactFlow();

    const onConnectStart = useCallback((_, { nodeId }) => {
        connectingNodeId.current = nodeId;
    }, []);

    const onConnectEnd = useCallback(
        (event) => {
            if (!connectingNodeId.current) return;

            const targetIsPane = event.target.classList.contains('react-flow__pane');

            if (targetIsPane) {
                // we need to remove the wrapper bounds, in order to get the correct position
                const id = getId();
                const newNode = {
                    id,
                    position: screenToFlowPosition({
                        x: event.clientX,
                        y: event.clientY,
                    }),
                    data: { label: `Node ${id}` },
                    origin: [0.5, 0.0],
                };

                setNodes((nds) => nds.concat([newNode]));
                setEdges((eds) =>
                    eds.concat({ id, source: connectingNodeId.current, target: id }),
                );
            }
        },
        [screenToFlowPosition],
    );


    return (
        <div style={{ width: '100vw', height: '100vh' }}>
            <button onClick={() => {
                // add a new node
                const id = getId();
                const newNode = {
                    id,
                    position: { x: 0, y: 0 },
                    data: { label: `Node ${id}` },
                };
                setNodes((nds) => nds.concat([newNode]));

            }}>Add Node</button>
            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnectStart={onConnectStart}
                onConnectEnd={onConnectEnd}
                fitView
                fitViewOptions={{ padding: 2 }}
                nodeOrigin={[0.5, 0]}
                onConnect={onConnect}
            >
                <Controls />
                <MiniMap />
                <Background variant="dots" gap={12} size={1} />
            </ReactFlow>
        </div>
    );
}

import {createRoot} from 'react-dom/client';
const root = createRoot(document.getElementById('graph'));
root.render((
    <ReactFlowProvider>
        <App />
    </ReactFlowProvider>
));
