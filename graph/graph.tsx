import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
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
    Node,
    Edge,
    useReactFlow, OnNodesChange, OnEdgesChange, OnConnect, applyNodeChanges, applyEdgeChanges, useStoreApi,
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
import {Panel, PanelGroup, PanelResizeHandle} from "react-resizable-panels";
import Flow from "./App";

function useDebounce<T extends (...args: any[]) => void>(callback: T, delay: number): T {
    const timeoutRef = useRef<number>();

    const debouncedFunction = useCallback((...args: Parameters<T>) => {
        if (timeoutRef.current !== undefined) {
            clearTimeout(timeoutRef.current);
        }
        timeoutRef.current = window.setTimeout(() => {
            callback(...args);
        }, delay);
    }, [callback, delay]);

    useEffect(() => {
        return () => {
            if (timeoutRef.current !== undefined) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, []);

    // Type assertion to match the signature of T.
    return debouncedFunction as T;
}

function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (char) {
        const random = Math.random() * 16 | 0;
        const value = char === 'x' ? random : (random & 0x3 | 0x8);
        return value.toString(16);
    });
}

function TextUpdaterNode({ data }) {
    return (
        <>
            <Handle type="target" position={Position.Top} />
            <div className={"p-6"}>
                <iframe src={"/code"} style={{height: "500px", width: "700px"}}></iframe>
            </div>
            <Handle type="source" position={Position.Bottom} id="a" />
        </>
    );
}

function EvidenceNode({ data }) {
    return (
        <>
            <Handle type="target" position={Position.Top} />
            <div className={"p-6"}>
                {data.label}
            </div>
            <Handle type="source" position={Position.Bottom} id="a" />
        </>
    );
}

function URLNode({ data }) {
    return (
        <>
            <Handle type="target" position={Position.Top} />
            <div className={"p-12"}>
                <iframe src={data.url} style={{height: "500px", width: "700px"}}></iframe>
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
        const timestampNodeId = generateUUID();

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

export default function GraphApp({ props }) {
    const { id, graph } = props;
    const [nodes, setNodes] = useState([]);
    const [edges, setEdges] = useState([]);
    const socketRef = useRef<WebSocket | null>(null);

    const connectingNodeId = useRef(null);
    const { screenToFlowPosition, setCenter } = useReactFlow();

    const focusNode = (node: Node) => {
        const x = node.position.x + node.measured.width / 2;
        const y = node.position.y + node.measured.height / 2;
        const zoom = 1.85;

        setCenter(x, y, { zoom, duration: 1000 });
    };

    useEffect(() => {
        if (!graph) {
            return;
        }
        setNodes(graph.nodes || []);
        setEdges(graph.edges || []);
    }, [graph]);

    // useEffect(() => {
    //     if (!id) {
    //         return;
    //     }
    //
    //     socketRef.current = new WebSocket('ws://localhost:8080/graph/ws/' + id);
    //
    //     socketRef.current.onopen = () => {
    //         console.log('WebSocket connection established');
    //     };
    //
    //     socketRef.current.onmessage = (event) => {
    //         const msg = JSON.parse(event.data);
    //         if (msg.type === 'graph') {
    //             const graph = JSON.parse(msg.value);
    //             console.log(graph)
    //             setNodes(graph.nodes || []);
    //             setEdges(graph.edges || []);
    //         }
    //         if (msg.type === 'ai') {
    //             const { id, text } = msg.value;
    //             setNodes((nodes) => nodes.map((node) => {
    //                 if (node.id === id) {
    //                     return {
    //                         ...node,
    //                         data: {
    //                             ...node.data,
    //                             text: text,
    //                         },
    //                     };
    //                 }
    //                 return node;
    //             }));
    //         }
    //     };
    //
    //     socketRef.current.onclose = () => {
    //         console.log('WebSocket connection closed');
    //     };
    //
    //     socketRef.current.onerror = (error) => {
    //         console.error('WebSocket error:', error);
    //     };
    //
    //     return () => {
    //         if (socketRef.current) {
    //             socketRef.current.close();
    //         }
    //     };
    // }, [id, setNodes, setEdges]);

    const sendGraphUpdate = (nodes, edges) => {
        fetch(`/graph/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ nodes, edges }),
        }).then((response) => {
            if (!response.ok) {
                console.error('Failed to update graph');
            }
        }).catch((error) => {
            console.error('Failed to update graph:', error);
        });
        // if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
        //     socketRef.current.send(JSON.stringify({
        //         type: 'graph',
        //         value: JSON.stringify({ nodes, edges }),
        //     }));
        // } else {
        //     console.log('WebSocket is not open');
        // }
    }

    const debouncedUpdate = useDebounce(sendGraphUpdate, 500);

    const setSyncedNodes = useCallback((nodes) => {
        setNodes(nodes);
        debouncedUpdate(nodes, edges);
    }, [edges]);

    const setSyncedEdges = useCallback((ed) => {
        setEdges(ed);
        debouncedUpdate(nodes, ed);
    }, [nodes]);

    const onNodesChange: OnNodesChange = useCallback(
        (changes) => {
            const newNodes = applyNodeChanges(changes, nodes);
            setSyncedNodes(newNodes);
        },[nodes, setSyncedNodes]
    );
    const onEdgesChange: OnEdgesChange = useCallback(
        (changes) => {
            const newEdges = applyEdgeChanges(changes, edges);
            setSyncedEdges(newEdges);
        }, [edges, setSyncedEdges]
    );
    const onConnect: OnConnect = useCallback(
        (connection) => {
            setSyncedEdges(addEdge(connection, edges));
        }, [setSyncedEdges, edges]
    );

    const onConnectStart = useCallback(
        (event, { nodeId }) => {
            connectingNodeId.current = nodeId;
        },
        [connectingNodeId],
    );

    const onConnectEnd = useCallback(
        (event) => {
            console.log(event)

            const id = generateUUID();
            // setSyncedNodes(nodes.concat([{
            //     id: id,
            //     position: screenToFlowPosition({
            //         x: event.clientX,
            //         y: event.clientY,
            //     }),
            //     type: 'ai',
            //     data: { label: `Node ${id}` },
            //     origin: [0.5, 0.0],
            // }]));
            //
            // setSyncedEdges(edges.concat({
            //     id: generateUUID(),
            //     source: connectingNodeId.current,
            //     target: id
            // }));

            // if (!connectingNodeId.current) return;
            //
            // const targetIsPane = event.target.classList.contains('react-flow__pane');
            //
            // if (targetIsPane) {
            //     // we need to remove the wrapper bounds, in order to get the correct position
            //     const id = generateUUID();
            //     const newNode = {
            //         id,
            //         position: screenToFlowPosition({
            //             x: event.clientX,
            //             y: event.clientY,
            //         }),
            //         data: { label: `Node ${id}` },
            //         origin: [0.5, 0.0],
            //     };
            //
            //     setSyncedNodes(nodes.concat([newNode]));
            //     setSyncedEdges(edges.concat({ id, source: connectingNodeId.current, target: id }));
            // }
        },
        [screenToFlowPosition, nodes, edges, setSyncedNodes, setSyncedEdges],
    );

    const onDragStart = (event, nodeType) => {
        event.dataTransfer.effectAllowed = 'move';
        event.dataTransfer.setData('application/reactflow', nodeType);
    };

    const onDragOver = useCallback((event) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';
    }, []);

    const getDraggedImageUrl = async (items: DataTransferItemList): Promise<string | null> => {
        for (const item of items) {
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

    const onDrop = useCallback(
        (event) => {
            event.preventDefault();
            const type = event.dataTransfer.getData('application/reactflow');

            const position = screenToFlowPosition({
                x: event.clientX,
                y: event.clientY,
            });
            const newNode = {
                id: generateUUID(),
                position,
                type,
                data: { label: `node` },
            };
            setSyncedNodes(nodes.concat(newNode));
        },
        [screenToFlowPosition, nodes],
    );

    const nodeTypes = useMemo(() => {
        return {
            evidence: EvidenceNode,
            textUpdater: TextUpdaterNode,
            epub: EpubNode,
            pdf: PDFNode,
            youtube: YoutubeNode,
            url: URLNode,
            ai: (props) => {
                const { data } = props;
                const rf = useReactFlow();
                const [text, setText] = useState(data.text);
                const onChange = (e) => {
                    setText(e.target.value);
                    setSyncedNodes(rf.getNodes().map((node) => {
                        if (node.id === props.id) {
                            return {
                                ...node,
                                data: {
                                    ...node.data,
                                    text: e.target.value,
                                },
                            };
                        }
                        return node;
                    }));
                }

                const setData = (newData) => {
                    setSyncedNodes(rf.getNodes().map((node) => {
                        if (node.id === props.id) {
                            return {
                                ...node,
                                data: {
                                    ...node.data,
                                    ...newData,
                                },
                            };
                        }
                        return node;
                    }));
                }
                return (
                    <>
                        <Handle type="target" position={Position.Top}/>
                        <div className={"p-6 flex flex-col"}>
                            {data.viewing ? (
                                <div dangerouslySetInnerHTML={{__html: data.text}}/>
                            ) : (
                                <textarea onChange={onChange} value={data.text}/>
                            )}
                            <button onClick={() => {
                                setData({ viewing: !data.viewing });
                            }}>edit</button>
                            <button onClick={() => {
                                const id = generateUUID();
                                setSyncedNodes(rf.getNodes().concat({
                                    id: id,
                                    position: {
                                        x: props.positionAbsoluteX,
                                        y: props.positionAbsoluteY + props.height,
                                    },
                                    type: 'ai',
                                    data: {
                                        viewing: true
                                    },
                                }))
                                setSyncedEdges(rf.getEdges().concat({
                                    id: generateUUID(),
                                    source: props.id,
                                    target: id,
                                }));

                                socketRef.current.send(JSON.stringify({
                                    type: 'ai',
                                    value: {
                                        id: id,
                                        text: text,
                                    },
                                }));
                            }}>submit
                            </button>
                        </div>
                        <Handle type="source" position={Position.Bottom} id="a"/>
                    </>
                );
            }
        }
    }, []);

    const [flag, setFlag] = useState("");

    return (
        <div style={{ width: '100vw', height: '100vh' }}>
            <PanelGroup direction="horizontal">
                <Panel defaultSize={20}>
                    <input className={"input"} onChange={(e) => {
                        setFlag(e.target.value);
                    }} placeholder={"flag"} />
                    <button className={"btn"} onClick={() => {
                        const id = generateUUID();
                        setSyncedNodes(nodes.concat([{
                            id: id,
                            position: screenToFlowPosition({
                                x: 100,
                                y: 100,
                            }),
                            type: 'evidence',
                            data: { label: flag },
                            origin: [0.5, 0.0],
                        }]));
                    }}>submit</button>
                {/*    /!*<div className={"overflow-auto h-full"} hx-get={`/code/sidebar`} hx-trigger="revealed"></div>*!/*/}
                {/*    /!*<iframe src={"/code/sidebar?file=vote.go"} className={"h-full w-full"}></iframe>*!/*/}
                {/*    <aside>*/}
                {/*        <div className="dndnode output" onDragStart={(event) => onDragStart(event, 'ai')} draggable>*/}
                {/*            AI*/}
                {/*        </div>*/}
                {/*        <div className={"dndnode output"} onDragStart={(event) => onDragStart(event, 'textUpdater')} draggable>*/}
                {/*            Text Updater*/}
                {/*        </div>*/}
                {/*        <div className={"dndnode output"} onDragStart={(event) => onDragStart(event, 'epub')} draggable>*/}
                {/*            Epub*/}
                {/*        </div>*/}
                {/*        <div className={"dndnode output"} onDragStart={(event) => onDragStart(event, 'pdf')} draggable>*/}
                {/*            PDF*/}
                {/*        </div>*/}
                {/*        <div className={"dndnode output"} onDragStart={(event) => onDragStart(event, 'youtube')} draggable>*/}
                {/*            Youtube*/}
                {/*        </div>*/}
                {/*        <div className={"dndnode output"} onDragStart={(event) => onDragStart(event, 'url')} draggable>*/}
                {/*            URL*/}
                {/*        </div>*/}
                {/*    </aside>*/}
                {/*    <ul>*/}
                {/*        {nodes.map((node) => (*/}
                {/*            <li key={node.id}>*/}
                {/*                <button onClick={() => focusNode(node)}>{node.data.label}</button>*/}
                {/*            </li>*/}
                {/*        ))}*/}
                {/*    </ul>*/}
                </Panel>
                <PanelResizeHandle className="w-2 bg-gray-300"/>
                <Panel>
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
                        onDrop={onDrop}
                        onDragOver={onDragOver}
                        nodeTypes={nodeTypes}
                    >
                        {/*<Controls />*/}
                        {/*<MiniMap />*/}
                        <Background variant="dots" gap={12} size={1} />
                    </ReactFlow>
                </Panel>
            </PanelGroup>
        </div>
    );
}

const g = document.getElementById('graph');
const p = g.getAttribute('data-props');
const props = JSON.parse(p);
const root = createRoot(g);
root.render((
    <ReactFlowProvider>
        <GraphApp props={props} />
        {/*{<Flow />}*/}
    </ReactFlowProvider>
));
