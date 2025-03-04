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
import "@blocknote/core/fonts/inter.css";
import {
    createReactInlineContentSpec,
    DefaultReactSuggestionItem,
    getDefaultReactSlashMenuItems,
    SuggestionMenuController,
    useCreateBlockNote
} from "@blocknote/react";
import { BlockNoteView } from "@blocknote/mantine";
import "@blocknote/mantine/style.css";

import '@xyflow/react/dist/style.css';

import {createRoot} from 'react-dom/client';
import {Panel, PanelGroup, PanelResizeHandle} from "react-resizable-panels";

import {
    Block,
    BlockNoteEditor,
    BlockNoteSchema,
    defaultBlockSpecs, defaultInlineContentSpecs,
    filterSuggestionItems, insertOrUpdateBlock,
    PartialBlock
} from "@blocknote/core";
import {CodeBlock, insertCode} from "../breadchris/CodeBlock";

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
        fetch(`/xctf/graph/`, {
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
        }
    }, []);

    const [flag, setFlag] = useState("");

    return (
        <div style={{ width: '100%', height: '100vh' }}>
            <PanelGroup direction="vertical">
                <Panel defaultSize={10}>
                    <input className={"input"} onChange={(e) => {
                        setFlag(e.target.value);
                    }} placeholder={"flag"} />
                    <button className={"btn"} onClick={() => {
                        const id = generateUUID();
                        setSyncedNodes(nodes.concat([{
                            id: id,
                            position: screenToFlowPosition({
                                x: 400,
                                y: 400,
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
                        nodeOrigin={[0, 0]}
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

const schema = BlockNoteSchema.create({
    blockSpecs: {
        ...defaultBlockSpecs,
        procode: CodeBlock,
    },
    inlineContentSpecs: {
        ...defaultInlineContentSpecs,
    }
});

export const Editor = ({ props }) => {
    const sendUpdate = (doc) => {
        fetch(`/xctf/report/`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(doc),
        }).then((response) => {
            if (!response.ok) {
                console.error('Failed to update report');
            }
        }).catch((error) => {
            console.error('Failed to update graph:', error);
        });
    }

    const debouncedUpdate = useDebounce(sendUpdate, 500);
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
            schema: schema,
        });

        saveToStorage(e.document);

        // (async () => {
        //     document.getElementById("html").value = await e.blocksToFullHTML(e.document);
        //     document.getElementById("markdown").value = await e.blocksToMarkdownLossy()
        //     document.getElementById("blocknote").value = JSON.stringify(e.document);
        // })();

        return e;
    }, [initialContent]);

    if (editor === undefined) {
        return <div>Loading...</div>;
    }

    return (
        <BlockNoteView
            editor={editor}
            onChange={async () => {
                saveToStorage(editor.document);
                debouncedUpdate(editor.document);
            }}
            slashMenu={false}
        >
            <SuggestionMenuController
                triggerCharacter={"/"}
                getItems={async (query) =>
                    filterSuggestionItems(
                        [
                            ...getDefaultReactSlashMenuItems(editor),
                            insertCode(),
                        ],
                        query
                    )
                }
            />
        </BlockNoteView>
    );
}

const e = document.getElementById('editor');
if (e) {
    const r = createRoot(e);
    const props = e.getAttribute('props');
    r.render((
        <Editor props={JSON.parse(props)} />
    ));
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
