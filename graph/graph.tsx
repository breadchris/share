import React, {useCallback, useEffect, useRef, useState} from 'react';
import {
    addEdge,
    Background,
    Controls,
    Handle,
    MiniMap,
    Position,
    ReactFlow,
    ReactFlowProvider,
    useEdgesState,
    useNodesState,
    useReactFlow,
} from '@xyflow/react';
import {ReactReader} from 'react-reader'
import type {Contents, Rendition} from 'epubjs'
import ReactPlayer from 'react-player/youtube'
import {ScrollMode, Viewer, Worker} from '@react-pdf-viewer/core';
import { defaultLayoutPlugin } from '@react-pdf-viewer/default-layout';

import '@xyflow/react/dist/style.css';
import '@react-pdf-viewer/core/lib/styles/index.css';
import '@react-pdf-viewer/default-layout/lib/styles/index.css';

import {createRoot} from 'react-dom/client';

const initialNodes = [
    { id: '1', position: { x: 0, y: 0 }, data: { label: '1' } },
    { id: '2', position: { x: 0, y: 100 }, data: { label: '2' } },
    {
        id: '3',
        type: 'textUpdater',
        position: { x: 100, y: 100 },
        data: { value: 123 },
    },

    // {
    //     id: '4',
    //     type: 'epub',
    //     position: { x: 100, y: 600 },
    //     data: { value: 123 },
    // },
    // {
    //     id: '5',
    //     type: 'pdf',
    //     position: { x: 400, y: 100 },
    //     data: { value: 123 },
    // },
    // {
    //     id: '5',
    //     type: 'youtube',
    //     position: { x: 400, y: 600 },
    //     data: { value: 123 },
    // },
];
const initialEdges = [{ id: 'e1-2', source: '1', target: '2' }];

let id = 6;
const getId = () => `${id++}`;

const handleStyle = { left: 10 };

function TextUpdaterNode({ data }) {
    return (
        <>
            <Handle type="target" position={Position.Top} />
            <div className={"p-6"}>
                <iframe src={"/breadchris/new"} className={"h-96 w-full"}></iframe>
            </div>
            <Handle type="source" position={Position.Bottom} id="a" />
        </>
    );
}

function YoutubeNode(data) {
    const reactFlowInstance = useReactFlow();
    const playerRef = useRef(null);

    const handleMarkTimestamp = () => {
        const currentTime = playerRef.current.getCurrentTime();
        const timestampNodeId = getId();

        const newNode = {
            id: timestampNodeId,
            position: {
                x: data.positionAbsoluteX + 200,  // Position the new node to the right of the current node
                y: data.positionAbsoluteY,
            },
            data: {
                label: `Timestamp: ${currentTime.toFixed(2)}s`,
                timestamp: currentTime,
                parentNodeId: data.id,
            },
        };

        reactFlowInstance.setNodes((nds) => nds.concat(newNode));
        reactFlowInstance.setEdges((eds) => eds.concat({
            id: `e${data.id}-${timestampNodeId}`,
            source: data.id,
            target: timestampNodeId
        }));
    };

    const handleSeekToTimestamp = (timestamp) => {
        playerRef.current.seekTo(timestamp, 'seconds');
    };

    return (
        <>
            <Handle type="target" position={Position.Top} />
            <div style={{ width: '600px', padding: '20px' }}>
                <ReactPlayer ref={playerRef} url='https://www.youtube.com/watch?v=LXb3EKWsInQ' />
                <button onClick={handleMarkTimestamp}>Mark Timestamp</button>
            </div>
            <Handle type="source" position={Position.Bottom} id="a" />
        </>
    );
}

// https://react-pdf-viewer.dev/docs/options/
function PDFNode({ data }) {
    const defaultLayoutPluginInstance = defaultLayoutPlugin();
    return (
        <Worker workerUrl="https://unpkg.com/pdfjs-dist@3.4.120/build/pdf.worker.min.js">
            <div
                style={{
                    border: '1px solid rgba(0, 0, 0, 0.3)',
                    height: '400px',
                    width: '300px',
                }}
            >
                <Viewer plugins={[defaultLayoutPluginInstance]} scrollMode={ScrollMode.Page} fileUrl="/books/Hypermedia Systems.pdf" />
            </div>
        </Worker>
    )
}


function EpubNode({ data }) {
    const onChange = useCallback((evt) => {
        console.log(evt.target.value);
    }, []);


    return (
        <>
            <Handle type="target" position={Position.Top} />
            <div style={{
                width: '600px',
            }}>
                <EpubReader url={"http://localhost:8080/data/uploads/8b595048-889b-4d45-9d75-2b7ec0f27a5a.epub"} />
            </div>
            <Handle type="source" position={Position.Bottom} id="a" />
        </>
    );
}

export default function App() {
    // const {nodes, onNodesChange, setNodes} = useNodesStateSynced();
    // const {edges, onEdgesChange, setEdges} = useEdgesStateSynced();
    const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
    // const onConnect = (params: Connection) => {
    //     connectingNodeId.current = null;
    //     onEdgesChange([addEdge(params, edges)]);
    //     onNodesChange([addEdge(params, nodes)]);
    // }
    const onConnect = useCallback(
        (params) => setEdges((eds) => addEdge(params, eds)),
        [setEdges],
    );

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
                nodeTypes={{
                    textUpdater: TextUpdaterNode,
                    epub: EpubNode,
                    pdf: PDFNode,
                    youtube: YoutubeNode,
                }}
            >
                <Controls />
                <MiniMap />
                <Background variant="dots" gap={12} size={1} />
            </ReactFlow>
        </div>
    );
}

type ITextSelection = {
    text: string
    cfiRange: string
}

export const EpubReader: React.FC<{url: string}> = ({url}) => {
    const [selections, setSelections] = useState<ITextSelection[]>([])
    const [rendition, setRendition] = useState<Rendition | undefined>(undefined)
    const [location, setLocation] = useState<string | number>(0)
    useEffect(() => {
        if (rendition) {
            function setRenderSelection(cfiRange: string, contents: Contents) {
                if (rendition) {
                    console.log(contents)
                    setSelections((list) =>
                        list.concat({
                            text: rendition.getRange(cfiRange).toString(),
                            cfiRange,
                        })
                    )
                    rendition.annotations.add(
                        'highlight',
                        cfiRange,
                        {},
                        undefined,
                        'hl',
                        { fill: 'red', 'fill-opacity': '0.5', 'mix-blend-mode': 'multiply' }
                    )
                    const selection = contents.window.getSelection()
                    selection?.removeAllRanges()
                }
            }
            rendition.on('selected', setRenderSelection)
            return () => {
                rendition?.off('selected', setRenderSelection)
            }
        }
    }, [setSelections, rendition])
    return (
        <div style={{ height: '100vh' }}>
            <div className="border border-stone-400 bg-white min-h-[100px] p-2 rounded">
                <h2 className="font-bold mb-1">Selections</h2>
                <ul className="grid grid-cols-1 divide-y divide-stone-400 border-t border-stone-400 -mx-2">
                    {selections.map(({ text, cfiRange }, i) => (
                        <li key={i} className="p-2">
                            <span>{text}</span>
                            <button
                                className="underline hover:no-underline text-sm mx-1"
                                onClick={() => {
                                    rendition?.display(cfiRange)
                                }}
                            >
                                Show
                            </button>

                            <button
                                className="underline hover:no-underline text-sm mx-1"
                                onClick={() => {
                                    rendition?.annotations.remove(cfiRange, 'highlight')
                                    setSelections(selections.filter((item, j) => j !== i))
                                }}
                            >
                                Remove
                            </button>
                        </li>
                    ))}
                </ul>
            </div>
            <ReactReader
                url={url}
                epubInitOptions={{ openAs: 'epub' }}
                location={location}
                locationChanged={(epubcfi: string) => setLocation(epubcfi)}
                getRendition={(_rendition: Rendition) => {
                    setRendition(_rendition)
                }}
            />
        </div>
    )
}

const root = createRoot(document.getElementById('graph'));
root.render((
    <ReactFlowProvider>
        <App />
    </ReactFlowProvider>
));
