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
    useReactFlow, OnNodesChange, OnEdgesChange, OnConnect, applyNodeChanges, applyEdgeChanges, useStoreApi, useKeyPress,
} from '@xyflow/react';
import {ReactReader} from 'react-reader'
import type {Contents, Rendition} from 'epubjs'


import '@xyflow/react/dist/style.css';
import "@blocknote/core/fonts/inter.css";
import "@blocknote/mantine/style.css";

import {createRoot} from 'react-dom/client';
import {Panel, PanelGroup, PanelResizeHandle} from "react-resizable-panels";
import Flow from "./App";
import {createRoot} from 'react-dom/client';
import * as Y from 'yjs';

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

function ImageNode({ data }) {
    return (
        <>
            <Handle type="target" position={Position.Top} />
            <img src={data.url} />
            <Handle type="source" position={Position.Bottom} id="a" />
        </>
    );
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

function EditorNode({ data }) {
    return (
        <>
            <Handle type="target" position={Position.Top} />
            <div className={"p-6"} style={{width: "700px"}}>
                <Editor props={data} />
            </div>
            <Handle type="source" position={Position.Bottom} />
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
            console.log(event);
            // const type = event.dataTransfer.getData('application/reactflow');
            //
            // const position = screenToFlowPosition({
            //     x: event.clientX,
            //     y: event.clientY,
            // });
            // const newNode = {
            //     id: generateUUID(),
            //     position,
            //     type,
            //     data: { label: `node` },
            // };
            // setSyncedNodes(nodes.concat(newNode));
        },
        [screenToFlowPosition, nodes],
    );

    const cmdAndNPressed = useKeyPress(['Meta+i', 'Strg+i']);

    useEffect(() => {
        if (!cmdAndNPressed) {
            return;
        }
        const id = generateUUID();
        const newNode = {
            id,
            position: {
                x: Math.random() * 100,
                y: Math.random() * 100,
            },
            type: 'editor',
            data: { label: `Node ${id}` },
        };
        setSyncedNodes(nodes.concat(newNode));
    }, [cmdAndNPressed]);


    const nodeTypes = useMemo(() => {
        return {
            textUpdater: TextUpdaterNode,
            editor: EditorNode,
            image: ImageNode,
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

    return (
        <div style={{ width: '100vw', height: '100vh' }}>
            <PanelGroup direction="horizontal">
                {/*<Panel defaultSize={20}>*/}
                {/*    <button className={"btn"} onClick={() => {*/}
                {/*        const id = generateUUID();*/}
                {/*        setSyncedNodes(nodes.concat([{*/}
                {/*            id: id,*/}
                {/*            position: screenToFlowPosition({*/}
                {/*                x: 100,*/}
                {/*                y: 100,*/}
                {/*            }),*/}
                {/*            type: 'evidence',*/}
                {/*            data: { label: flag },*/}
                {/*            origin: [0.5, 0.0],*/}
                {/*        }]));*/}
                {/*    }}>submit</button>*/}
                {/*/!*    /!*<div className={"overflow-auto h-full"} hx-get={`/code/sidebar`} hx-trigger="revealed"></div>*!/*!/*/}
                {/*/!*    /!*<iframe src={"/code/sidebar?file=vote.go"} className={"h-full w-full"}></iframe>*!/*!/*/}
                {/*/!*    <aside>*!/*/}
                {/*/!*        <div className="dndnode output" onDragStart={(event) => onDragStart(event, 'ai')} draggable>*!/*/}
                {/*/!*            AI*!/*/}
                {/*/!*        </div>*!/*/}
                {/*/!*        <div className={"dndnode output"} onDragStart={(event) => onDragStart(event, 'textUpdater')} draggable>*!/*/}
                {/*/!*            Text Updater*!/*/}
                {/*/!*        </div>*!/*/}
                {/*/!*        <div className={"dndnode output"} onDragStart={(event) => onDragStart(event, 'epub')} draggable>*!/*/}
                {/*/!*            Epub*!/*/}
                {/*/!*        </div>*!/*/}
                {/*/!*        <div className={"dndnode output"} onDragStart={(event) => onDragStart(event, 'pdf')} draggable>*!/*/}
                {/*/!*            PDF*!/*/}
                {/*/!*        </div>*!/*/}
                {/*/!*        <div className={"dndnode output"} onDragStart={(event) => onDragStart(event, 'youtube')} draggable>*!/*/}
                {/*/!*            Youtube*!/*/}
                {/*/!*        </div>*!/*/}
                {/*/!*        <div className={"dndnode output"} onDragStart={(event) => onDragStart(event, 'url')} draggable>*!/*/}
                {/*/!*            URL*!/*/}
                {/*/!*        </div>*!/*/}
                {/*/!*    </aside>*!/*/}
                {/*/!*    <ul>*!/*/}
                {/*/!*        {nodes.map((node) => (*!/*/}
                {/*/!*            <li key={node.id}>*!/*/}
                {/*/!*                <button onClick={() => focusNode(node)}>{node.data.label}</button>*!/*/}
                {/*/!*            </li>*!/*/}
                {/*/!*        ))}*!/*/}
                {/*/!*    </ul>*!/*/}
                {/*</Panel>*/}
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

// Define the card type
interface Card {
    id: number;
    // The angle (in degrees) that will determine the card's position on the arc.
    angle: number;
}

// Constants for number of cards and the arc behavior.
const BASE_RADIUS = 200; // Controls how far from center the cards fan out.
const HOVER_OFFSET = 20; // Extra distance each card will move on hover.

const cards: Card[] = [
    { id: 0, angle: -30 },
    { id: 1, angle: -15 },
    { id: 2, angle: 0 },
    { id: 3, angle: 15 },
    { id: 4, angle: 30 },
];

export const CardHand: React.FC = () => {
    return (
        // The outer container sticks the hand to the bottom of the viewport.
        <div className="fixed bottom-48 z-10 left-0 right-0 flex justify-center pointer-events-none">
            {/*
        The inner container is a zero-size pivot point.
        All card positions are relative to this center.
      */}
            <div className="relative" style={{ width: 0, height: 0 }}>
                {cards.map((card) => {
                    // Convert the angle to radians.
                    const theta = (card.angle * Math.PI) / 180;
                    // The final position is calculated along a circular arc.
                    // For a circle with center at (0, BASE_RADIUS), the card's position is:
                    // x = R * sin(theta), and y = -R * cos(theta) + R.
                    const finalX = BASE_RADIUS * Math.sin(theta);
                    const finalY = -BASE_RADIUS * Math.cos(theta) + BASE_RADIUS;
                    // On hover, push the card a bit further outward along the radial direction.
                    const hoverX = finalX + HOVER_OFFSET * Math.sin(theta);
                    const hoverY = finalY + HOVER_OFFSET * -Math.cos(theta);

                    return (
                        <motion.div
                            key={card.id}
                            // "origin-bottom" ensures the card rotates around its bottom edge.
                            className="absolute origin-bottom"
                            // All cards start at the pivot point stacked on top of each other.
                            initial={{ x: 0, y: 0, rotate: 0 }}
                            // Animate into the fanned-out positions.
                            animate={{ x: finalX, y: finalY, rotate: card.angle }}
                            // Tweening animation is applied when transitioning (0.5s duration).
                            transition={{ type: "tween", duration: 0.2 }}
                            // On hover, move further along the same circular path.
                            whileHover={{ x: hoverX, y: hoverY }}
                            // Optional: you may adjust z-index if you want hovered cards to come forward.
                            style={{ zIndex: card.id }}
                        >
                            {/* Card styling: a fixed size card with border, rounding, and shadow. */}
                            <div className="w-32 h-48 bg-white border rounded shadow-lg pointer-events-auto"></div>
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
};

export const doc = new Y.Doc();

import {
    Block,
    BlockNoteEditor,
    BlockNoteSchema,
    defaultBlockSpecs, defaultInlineContentSpecs,
    filterSuggestionItems, insertOrUpdateBlock,
    PartialBlock
} from "@blocknote/core";
import {MdCode} from "react-icons/md";

async function saveToStorage(jsonBlocks: Block[]) {
    // Save contents to local storage. You might want to debounce this or replace
    // with a call to your API / database.
    localStorage.setItem("editorContent", JSON.stringify(jsonBlocks));
}

async function loadFromStorage() {
    // Gets the previously stored editor contents.
    const storageString = localStorage.getItem("editorContent");
    return storageString
        ? (JSON.parse(storageString) as PartialBlock[])
        : undefined;
}

export const Mention = createReactInlineContentSpec(
    {
        type: "mention",
        propSchema: {
            user: {
                default: "Unknown",
            },
        },
        content: "none",
    },
    {
        render: (props) => (
            <span style={{ backgroundColor: "#8400ff33" }}>
        #{props.inlineContent.props.user}
      </span>
        ),
    }
);


const schema = BlockNoteSchema.create({
    blockSpecs: {
        ...defaultBlockSpecs,
    },
    inlineContentSpecs: {
        ...defaultInlineContentSpecs,
        mention: Mention,
    }
});

interface EditorProps {
    props: {
        provider_url: string;
        room: string;
        post: {
            Blocknote: string;
        };
        username: string;
    };
}


function ResetBlockTypeItem(props: DragHandleMenuProps) {
    const editor = useBlockNoteEditor();

    const Components = useComponentsContext()!;
    const rf = useReactFlow();

    return (
        <Components.Generic.Menu.Item
            onClick={async () => {
                const b = editor.getBlock(props.block);
                const c = await editor.blocksToMarkdownLossy([b]);
                const id = generateUUID();
                rf.addNodes([{
                    id: id,
                    position: {
                        x: 100,
                        y: 100,
                    },
                    type: 'ai',
                    data: {
                        text: c,
                        viewing: true
                    },
                }])
                rf.addEdges([
                    {
                        id: generateUUID(),
                        source: props.block.id,
                        target: id,
                    },
                ])
            }}>
            Reset Type
        </Components.Generic.Menu.Item>
    );
}

export const Editor: FC<EditorProps> = ({ props }) => {
    const abortControllerRef = useRef<AbortController|undefined>(undefined);
    const providerRef = useRef<WebsocketProvider|undefined>(undefined);

    // TODO breadchris this will become problematic with multiple forms on the page, need provider
    useEffect(() => {
        if (props?.provider_url) {
            providerRef.current = new WebsocketProvider(props.provider_url, props.room, doc);
        }
        return () => {
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
            if (providerRef.current) {
                providerRef.current.disconnect();
            }
        };
    }, []);

    const onStop = () => {
        abortControllerRef.current?.abort();
    }

    const inferFromSelectedText = async (prompt: string) => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }
        const controller = new AbortController();
        abortControllerRef.current = controller;

        let aiBlocks = editor.insertBlocks(
            [
                {
                    content: "let me think...",
                },
            ],
            editor.getTextCursorPosition().block,
            "after"
        );

        aiBlocks = editor.insertBlocks(
            [
                {
                    content: "thinking...",
                },
            ],
            aiBlocks[0],
            "after"
        );
        editor.setTextCursorPosition(aiBlocks[0], "start");
        editor.nestBlock()

        function countIndentationDepth(inputString: string): number {
            const match = inputString.match(/^( {4}|\t)*/);
            if (!match) {
                return 0;
            }
            const matchedString = match[0];
            return matchedString.split(/( {4}|\t)/).filter(Boolean).length;
        }

        try {
            const res = contentService.infer({
                prompt,
            }, {
                timeoutMs: undefined,
                signal: controller.signal,
            })
            let content = '';
            let lastBlock = aiBlocks;

            // let prevDepth = -1;
            // let count = 0;
            // const insertLine = (text: string) => {
            //     const newBlocks = editor.insertBlocks(
            //         [
            //             {
            //                 content: text,
            //             },
            //         ],
            //         lastBlock,
            //         count === 0 ? "nested" : "after"
            //     );
            //     return newBlocks[0];
            // }
            for await (const exec of res) {
                // keep collecting until a newline is found
                content += exec;
                // if (content.includes('\n')) {
                //     const depth = countIndentationDepth(content);
                //     content = content.trim()
                //
                //     lastBlock = insertLine(content);
                //     content = '';
                //     prevDepth = depth;
                //     count += 1;
                // }
                const blocks = await editor.tryParseMarkdownToBlocks(content);
                lastBlock = editor.replaceBlocks(lastBlock, blocks).insertedBlocks;
            }
            // if (content) {
            //     insertLine(content);
            // }
        } catch (e: any) {
            console.log(e);
        } finally {
            abortControllerRef.current = undefined;
        }
    }

    const insertAI = (editor: typeof schema.BlockNoteEditor): DefaultReactSuggestionItem => ({
        title: "Ask AI",
        onItemClick: () => {
            // editor.insertBlocks(
            //     [
            //         {
            //             type: "aiBlock",
            //             props: {},
            //         },
            //     ],
            //     editor.getTextCursorPosition().block,
            //     "after"
            // );
            const content = editor.getTextCursorPosition().block.content;
            if (content && content.length > 0 && content[0].type === "text") {
                const text = content[0].text;
                void inferFromSelectedText(text);
            }
        },
        aliases: ["ai"],
        group: "Other",
        icon: <MdCode />,
    });

    const generateImage = (editor: typeof schema.BlockNoteEditor): DefaultReactSuggestionItem => ({
        title: "Generate Image",
        onItemClick: () => {
            // editor.insertBlocks(
            //     [
            //         {
            //             type: "aiBlock",
            //             props: {},
            //         },
            //     ],
            //     editor.getTextCursorPosition().block,
            //     "after"
            // );
        },
        aliases: ["ai"],
        group: "Other",
        icon: <MdCode />,
    });

    const [initialContent, setInitialContent] = useState<
        PartialBlock[] | undefined | "loading"
    >(props?.post?.Blocknote ? JSON.parse(props?.post.Blocknote) : "loading");

    useEffect(() => {
        // TODO breadchris how to handle loading from storage when blocknote is provided
        if (!props?.post?.Blocknote) {
            console.log("loading from storage");
            loadFromStorage().then((content) => {
                setInitialContent(content);
            });
        }
    }, []);
    // Creates a new editor instance.
    // We use useMemo + createBlockNoteEditor instead of useCreateBlockNote so we
    // can delay the creation of the editor until the initial content is loaded.
    const editor = useMemo(() => {
        if (initialContent === "loading") { // || (props?.provider_url && providerRef.current === undefined)) {
            return undefined;
        }

        // TODO breadchris when content is loaded, set the form inputs
        const e = BlockNoteEditor.create({
            initialContent,
            uploadFile: async (file: File) => {
                const body = new FormData();
                body.append("file", file);

                const ret = await fetch("/upload", {
                    method: "POST",
                    body: body,
                });
                return await ret.text();
            },
            collaboration: {
                provider: providerRef.current,
                fragment: doc.getXmlFragment("blocknote"),
                user: {
                    name: props?.username || "Anonymous",
                }
            },
            schema: schema,
        });

        saveToStorage(e.document);

        (async () => {
            // document.getElementById("html").value = await e.blocksToFullHTML(e.document);
            // document.getElementById("markdown").value = await e.blocksToMarkdownLossy()
            // document.getElementById("blocknote").value = JSON.stringify(e.document);
        })();

        return e;
    }, [initialContent]);

    if (editor === undefined) {
        return <div>Loading...</div>;
    }

    return (
        <BlockNoteView
            editor={editor}
            sideMenu={false}
            onChange={async () => {
                saveToStorage(editor.document);
                // document.getElementById("html").value = await editor.blocksToFullHTML(editor.document);
                // document.getElementById("markdown").value = await editor.blocksToMarkdownLossy()
                // document.getElementById("blocknote").value = JSON.stringify(editor.document);
            }}
            slashMenu={false}
        >

            <SideMenuController
                sideMenu={(props) => (
                    <SideMenu
                        {...props}
                        dragHandleMenu={(props) => (
                            <DragHandleMenu {...props}>
                                <RemoveBlockItem {...props}>Delete</RemoveBlockItem>
                                {/* Item which resets the hovered block's type. */}
                                <ResetBlockTypeItem {...props}>Reset Type</ResetBlockTypeItem>
                            </DragHandleMenu>
                        )}
                    />
                )}
            />

            <SuggestionMenuController
                triggerCharacter={"/"}
                getItems={async (query) =>
                    filterSuggestionItems(
                        [
                            ...getDefaultReactSlashMenuItems(editor),
                            insertAI(editor),
                        ],
                        query
                    )
                }
            />
            <SuggestionMenuController
                triggerCharacter={"#"}
                getItems={async (query) =>
                    // Gets the mentions menu items
                    filterSuggestionItems(getMentionMenuItems(editor), query)
                }
            />
        </BlockNoteView>
    );
}

const getMentionMenuItems = (
    editor: typeof schema.BlockNoteEditor
): DefaultReactSuggestionItem[] => {
    const users = ["Steve", "Bob", "Joe", "Mike"];

    return users.map((user) => ({
        title: user,
        onItemClick: () => {
            editor.insertInlineContent([
                {
                    type: "mention",
                    props: {
                        user,
                    },
                },
                " ",
            ]);
        },
    }));
};

export const Slides = () => {
    const deckDivRef = useRef<HTMLDivElement>(null); // reference to deck container div
    const deckRef = useRef<Reveal.Api | null>(null); // reference to deck reveal instance

    useEffect(() => {
        // Prevents double initialization in strict mode
        if (deckRef.current) return;

        deckRef.current = new Reveal(deckDivRef.current!, {
            transition: "slide",
            // other config options
        });

        deckRef.current.initialize().then(() => {
            // good place for event handlers and plugin setups
        });

        return () => {
            try {
                if (deckRef.current) {
                    deckRef.current.destroy();
                    deckRef.current = null;
                }
            } catch (e) {
                console.warn("Reveal.js destroy call failed.");
            }
        };
    }, []);

    return (
        // Your presentation is sized based on the width and height of
        // our parent element. Make sure the parent is not 0-height.
        <div className="reveal" ref={deckDivRef}>
            <div className="slides">
                <section>Slide 1</section>
                <section>Slide 2</section>
            </div>
        </div>
    );
}

import {useReactFlow} from "@xyflow/react";
import {contentService} from "../breadchris/ContentService";
import {
    createReactInlineContentSpec,
    DragHandleMenu, DragHandleMenuProps, getDefaultReactSlashMenuItems,
    RemoveBlockItem,
    SideMenu,
    SideMenuController, SuggestionMenuController, useBlockNoteEditor, useComponentsContext
} from "@blocknote/react";
import {BlockNoteView} from "@blocknote/mantine";
const e = document.getElementById('editor');
if (e) {
    const r = createRoot(e);
    const props = e.getAttribute('props');
    r.render((
        <Editor props={JSON.parse(props)} />
    ));
}

// const s = document.getElementById('slides');
// if (s) {
//     const r = createRoot(s);
//     r.render((
//         <Slides />
//     ));
// }

// const c = document.getElementById('cards');
// if (c) {
//     const r = createRoot(c);
//     r.render((
//         <CardHand />
//     ));
// }
