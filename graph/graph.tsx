import React, {FC, useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {
    addEdge,
    Background,
    Handle,
    Position,
    ReactFlow,
    ReactFlowProvider,
    useReactFlow,
    OnNodesChange,
    OnEdgesChange,
    OnConnect,
    applyNodeChanges,
    applyEdgeChanges,
    useStoreApi,
    useKeyPress,
    ReactFlowInstance,
} from '@xyflow/react';

import {
    Block,
    BlockNoteEditor,
    BlockNoteSchema,
    defaultBlockSpecs, defaultInlineContentSpecs,
    filterSuggestionItems, insertOrUpdateBlock,
    PartialBlock
} from "@blocknote/core";
import {MdCode} from "react-icons/md";

import '@xyflow/react/dist/style.css';
import "@blocknote/core/fonts/inter.css";
import "@blocknote/mantine/style.css";

import {Panel, PanelGroup, PanelResizeHandle} from "react-resizable-panels";
import {createRoot} from 'react-dom/client';
import * as Y from 'yjs';
import {contentService} from "../breadchris/ContentService";
import {WebsocketProvider} from "y-websocket";
import {
    createReactInlineContentSpec,
    DefaultReactSuggestionItem,
    DragHandleMenu,
    DragHandleMenuProps,
    getDefaultReactSlashMenuItems,
    RemoveBlockItem,
    SideMenu,
    SideMenuController,
    SuggestionMenuController,
    useBlockNoteEditor,
    useComponentsContext, useCreateBlockNote
} from "@blocknote/react";
import {BlockNoteView} from "@blocknote/mantine";
import {Node} from './rpc/node_pb';

export const doc = new Y.Doc();

function EditorNode({ id, data }) {
    const d = Node.fromJson(data);
    const rf = useReactFlow();
    switch (d.type.case) {
        case "url":
            return (
                <>
                    <Handle type="target" position={Position.Top} />
                    <div className={"p-6 bg-green-100 overflow-y-scroll"} style={{width: "100%", maxHeight: "700px"}}>
                        <img style={{maxWidth: "400px"}} src={d.type.value} alt="Image Node" />
                    </div>
                    <Handle type="source" position={Position.Bottom} />
                </>
            );
        case "text":
            return (
                <>
                    <Handle type="target" position={Position.Top} />
                    <div className={"p-6 bg-green-100 overflow-y-scroll"} style={{width: "700px", maxHeight: "700px"}}>
                        <div className={"nodrag"}>
                            <Editor props={{
                                provider_url: "",
                                room: "",
                                post: undefined,
                                text: d.type.value,
                                username: "Anonymous",
                                onChange: (s: string) => {
                                    const nodes = rf.getNodes();
                                    const newNodes = nodes.map((n) => {
                                        if (n.id === id) {
                                            return {
                                                ...n,
                                                data: {
                                                    ...n.data,
                                                    text: s,
                                                },
                                            };
                                        }
                                        return n;
                                    });
                                    rf.setNodes(newNodes);
                                }
                            }} />
                        </div>
                    </div>
                    <Handle type="source" position={Position.Bottom} />
                </>
            );
    }
}

export default function GraphApp({ props }) {
    const { id, graph } = props;
    const [nodes, setNodes] = useState([]);
    const [edges, setEdges] = useState([]);

    useEffect(() => {
        if (!graph) {
            return;
        }
        setNodes(graph.nodes || []);
        setEdges(graph.edges || []);
    }, [graph]);

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
            type: 'node',
            data: new Node({
                id,
                name: "asdf",
                type: {
                    case: "text",
                    value: "text"
                }
            }).toJson(),
        };
        setSyncedNodes(nodes.concat(newNode));
    }, [cmdAndNPressed]);

    const rf = useReactFlow();

    useCopyPaste(rf);

    const nodeTypes = useMemo(() => {
        return {
            node: EditorNode,
        }
    }, []);

    return (
        <div style={{ width: '100vw', height: '100vh' }}>
            <PanelGroup direction="vertical">
                <Panel defaultSize={20}>
                    <div className={"h-full overflow-y-scroll"}>
                        <Editor props={props} />
                    </div>
                </Panel>
                <PanelResizeHandle className="h-2 bg-gray-300"/>
                <Panel>
                    <ReactFlow
                        nodes={nodes}
                        edges={edges}
                        onNodesChange={onNodesChange}
                        onEdgesChange={onEdgesChange}
                        fitView
                        fitViewOptions={{ padding: 2 }}
                        nodeOrigin={[0.5, 0]}
                        onConnect={onConnect}
                        nodeTypes={nodeTypes}
                    >
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
    </ReactFlowProvider>
));

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
        } | undefined;
        initialContent: string;
        username: string;
        text: string;
        onChange: (s: string) => void;
    };
}


function ClipItem(props: DragHandleMenuProps) {
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
                    type: 'node',
                    data: new Node({
                        id,
                        name: "asdf",
                        type: {
                            case: "text",
                            value: c
                        }
                    }).toJson(),
                }])
                rf.addEdges([
                    {
                        id: generateUUID(),
                        source: props.block.id,
                        target: id,
                    },
                ])
            }}>
            Clip
        </Components.Generic.Menu.Item>
    );
}

export const Editor: FC<EditorProps> = ({ props }) => {
    const abortControllerRef = useRef<AbortController|undefined>(undefined);
    const providerRef = useRef<WebsocketProvider|undefined>(undefined);
    const initialContent = props.initialContent ? JSON.parse(props.initialContent) : undefined;

    const rf = useReactFlow();

    const ctrlAndC = useKeyPress(['Meta+g']);

    const editor = useCreateBlockNote({
        initialContent: initialContent || undefined,
        uploadFile: async (file: File) => {
            const body = new FormData();
            body.append("file", file);

            const ret = await fetch("/upload", {
                method: "POST",
                body: body,
            });
            return await ret.text();
        },
        // TODO breadchris collaboration ID is node id
        // collaboration: {
        //     provider: providerRef.current,
        //     fragment: doc.getXmlFragment("blocknote"),
        //     user: {
        //         name: props?.username || "Anonymous",
        //     }
        // },
        schema: schema,
    });

    useEffect(() => {
        if (ctrlAndC) {
            console.log('ctrl+c pressed');
            (async () => {
                const b = editor.getSelection();
                if (!b) {
                    console.log('no selection');
                    return;
                }
                const c = await editor.blocksToMarkdownLossy(b.blocks);
                const id = generateUUID();
                rf.addNodes([{
                    id: id,
                    position: {
                        x: 100,
                        y: 100,
                    },
                    type: 'node',
                    data: new Node({
                        id,
                        name: "asdf",
                        type: {
                            case: "text",
                            value: c
                        }
                    }).toJson(),
                }])
            })()
        }
    }, [ctrlAndC]);

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

            for await (const exec of res) {
                content += exec;
                const blocks = await editor.tryParseMarkdownToBlocks(content);
                lastBlock = editor.replaceBlocks(lastBlock, blocks).insertedBlocks;
            }
        } catch (e: any) {
            console.log(e);
        } finally {
            abortControllerRef.current = undefined;
        }
    }

    const insertAI = (editor: typeof schema.BlockNoteEditor): DefaultReactSuggestionItem => ({
        title: "Ask AI",
        onItemClick: async () => {
            const text = await editor.blocksToMarkdownLossy(editor.document);
            void inferFromSelectedText(text);
        },
        aliases: ["ai"],
        group: "Other",
        icon: <MdCode />,
    });

    useEffect(() => {
        // TODO breadchris how to handle loading from storage when blocknote is provided
        // if (!props?.post?.Blocknote) {
        //     console.log("loading from storage");
        //     loadFromStorage().then((content) => {
        //         setInitialContent(content);
        //     });
        // }
    }, []);

    useEffect(() => {
        if (props.text !== '') {
            (async () => {
                console.log('parsing markdown', props.text)
                const blocks = await editor.tryParseMarkdownToBlocks(props.text);
                console.log("done parsing markdown", blocks)
                editor.replaceBlocks(editor.document, blocks);
            })()
        }
    }, [editor]);

    if (editor === undefined) {
        return <div>Loading...</div>;
    }

    const debouncedUpdate = useDebounce(props.onChange|| ((s: string) => {}), 500);

    return (
        <BlockNoteView
            editor={editor}
            sideMenu={false}
            onChange={async () => {
                debouncedUpdate(await editor.blocksToMarkdownLossy(editor.document));
                //saveToStorage(editor.document);
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
                                <ClipItem {...props}>Clip</ClipItem>
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

    return debouncedFunction as T;
}

export const useCopyPaste = (
    rfInstance: ReactFlowInstance | null,
) => {

    const onCopyCapture = useCallback(
        (event: ClipboardEvent) => {
            event.preventDefault();
            const nodes = JSON.stringify(
                rfInstance?.getNodes().filter((n) => n.selected)
            );

            event.clipboardData?.setData("flowchart:nodes", nodes);
        },
        [rfInstance]
    );

    const onPasteCapture = useCallback(
        (event: ClipboardEvent) => {
            event.preventDefault();

            const text = event.clipboardData?.getData('Text');
            if (text.match(/\.(jpeg|jpg|gif|png)$/) != null) {
                const id = generateUUID();
                const vp = rfInstance.getViewport();
                rfInstance?.addNodes([
                    {
                        id: id,
                        type: 'node',
                        position: { x: vp.x, y: vp.y },
                        data: new Node({
                            id,
                            name: "asdf",
                            type: {
                                case: "url",
                                value: text
                            }
                        }).toJson(),
                    },
                ]);
                return;
            }

            const nodes = JSON.parse(
                event.clipboardData?.getData("flowchart:nodes") || "[]"
            ) as Node[] | undefined;
            if (nodes) {
                const randomId = () => Math.random().toString(16).slice(2);
                rfInstance?.setNodes(
                    [
                        ...rfInstance.getNodes().map((n) => ({ ...n, selected: false })),
                        ...nodes.map((n) => ({
                            ...n,
                            selected: true,
                            id: randomId(),
                            position: { x: n.position.x + 10, y: n.position.y + 10 },
                        }))
                    ]);
            }
        },
        [rfInstance]
    );

    useEffect(() => {
        window.addEventListener("copy", onCopyCapture);
        return () => {
            window.removeEventListener("copy", onCopyCapture);
        };
    }, [onCopyCapture]);

    useEffect(() => {
        window.addEventListener("paste", onPasteCapture);
        return () => {
            window.removeEventListener("paste", onPasteCapture);
        };
    }, [onPasteCapture]);
};

function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (char) {
        const random = Math.random() * 16 | 0;
        const value = char === 'x' ? random : (random & 0x3 | 0x8);
        return value.toString(16);
    });
}
