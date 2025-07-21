import React, {createContext, FC, useCallback, useContext, useEffect, useMemo, useRef, useState} from 'react';
import {
    Background,
    ReactFlow,
    ReactFlowProvider,
    useReactFlow,
    useKeyPress,
    ReactFlowInstance,
    Edge,
    Node as XYNode
} from '@xyflow/react';

import {
    BlockNoteEditor,
    BlockNoteSchema, blockToNode,
    defaultBlockSpecs, defaultInlineContentSpecs,
    filterSuggestionItems, insertOrUpdateBlock,
    PartialBlock
} from "@blocknote/core";
import {MdCode} from "react-icons/md";
import {ReactReader} from "react-reader";

import '@xyflow/react/dist/style.css';
import "@blocknote/core/fonts/inter.css";
import "@blocknote/mantine/style.css";

import {Panel, PanelGroup, PanelResizeHandle} from "react-resizable-panels";
import {createRoot} from 'react-dom/client';
import * as Y from 'yjs';
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
import useNodesStateSynced from "./useNodesStateSynced";
import useEdgesStateSynced from "./useEdgesStateSynced";
import {
    prosemirrorToYXmlFragment,
} from "y-prosemirror";
import {Contents, Rendition} from "epubjs";
import {useMap, useYDoc, useYjsProvider, YDocProvider} from "@y-sweet/react";
import {XmlFragment} from "yjs";
import {YMap} from "yjs/dist/src/types/YMap";
import {JsonValue} from "@bufbuild/protobuf";
import {ContentService} from "../breadchris/ContentService";
import {FileText, Link2, Image, Network, UploadCloud, X, Sparkles} from "lucide-react";
import BlockNoteAIEditor from "../aiapi/BlockNoteAIEditor";

interface AppState {
    runningAI: boolean;
    contentService: ContentService | null;
}

interface StateCtx {
    state: AppState;
    setState: React.Dispatch<React.SetStateAction<AppState>>;
}

const ContentServiceContext = createContext<StateCtx>(null);

interface ContentServiceProviderProps {
    url: string;  // URL will come as a prop
    children: React.ReactNode;
}

export const ContentServiceProvider: React.FC<ContentServiceProviderProps> = ({ url, children }) => {
    const [state, setState] = useState<AppState>({
        runningAI: false,
        contentService: null,
    });

    useEffect(() => {
        const service = new ContentService(url+"/llm/stream");
        setState((prev) => ({
            ...prev,
            contentService: service,
        }));
        return () => {
            service.close();
        };
    }, [url]);

    return (
        <ContentServiceContext.Provider value={{state, setState}}>
            {children}
        </ContentServiceContext.Provider>
    );
};

export const useContentService = (): StateCtx => {
    return useContext(ContentServiceContext);
};

function blocksToProsemirrorNode(
    editor: BlockNoteEditor,
    blocks: PartialBlock[]
) {
    const pmSchema = editor.pmSchema;
    const pmNodes = blocks.map((b) => blockToNode(b, pmSchema, undefined));

    const doc = pmSchema.topNodeType.create(
        null,
        pmSchema.nodes["blockGroup"].create(null, pmNodes)
    );
    return doc;
}

interface EditorProps {
    id: string;
    data: JsonValue;
}

const EditorNode:FC<EditorProps> = (props) => {
    const { id, data } = props;
    const d = Node.fromJson(data);
    const rf = useReactFlow();
    switch (d.type.case) {
        case "url":
            const url = d.type.value;
            const extension = url.split('.').pop();
            switch (extension) {
                case "epub":
                    return (
                        <div style={{
                            width: '600px',
                        }}>
                            <EpubReader id={id} url={url} />
                        </div>
                    );
                case "png":
                case "jpg":
                case "jpeg":
                case "gif":
                    return (
                        <>
                            <div className={"p-6 bg-green-100 overflow-y-scroll"} style={{width: "100%", maxHeight: "700px"}}>
                                <img style={{maxWidth: "400px"}} src={d.type.value} alt="Image Node" />
                            </div>
                        </>
                    );
                default:
                    return (
                        <div className={"p-6 bg-red-100 overflow-y-scroll"} style={{width: "100%", maxHeight: "700px"}}>
                            <h1>Unsupported image type</h1>
                            <p>{extension}</p>
                        </div>
                    );
            }
        case "text":
            return (
                <>
                    <div className={"p-6 bg-green-100 overflow-y-scroll"} style={{width: "700px", maxHeight: "700px"}}>
                        <div className={"nodrag"}>
                            <Editor props={{
                                provider_url: "",
                                room: "",
                                post: undefined,
                                text: d.type.value,
                                node: d,
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
                </>
            );
    }
}

let docsMap: YMap<XmlFragment>;
let nodesMap: YMap<XYNode>;

export default function GraphApp() {
    const doc = useYDoc();
    docsMap = useMap<XmlFragment>('docs');
    nodesMap = useMap<XYNode>('nodes');
    const edgesMap = useMap<Edge>('edges');
    const [nodes, onNodesChange] = useNodesStateSynced(nodesMap, edgesMap);
    const [edges, onEdgesChange, onConnect] = useEdgesStateSynced(edgesMap);
    const [state, setState] = useState<{
        view: 'text' | 'image' | 'url' | 'graph' | 'ai-editor';
    }>({
        view: 'graph',
    });
    const abortControllerRef = useRef<AbortController|undefined>(undefined);
    const {state: {contentService}, setState: setAppState} = useContentService();

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
            }).toJson().valueOf() || {},
        };
        Y.transact(doc, () => {
            nodesMap.set(id, newNode);
            docsMap.set(id, new Y.XmlFragment());
        });
    }, [cmdAndNPressed]);

    const rf = useReactFlow();

    useCopyPaste(rf, nodesMap);

    const nodeTypes = useMemo(() => {
        return {
            node: EditorNode,
        }
    }, []);

    const view = () => {
        switch (state.view) {
            case 'text':
                return (
                    <div className={"container mx-auto md:mt-32 overflow-y-scroll"} style={{width: "100%", maxHeight: "700px"}}>
                        <Editor props={{
                            provider_url: "",
                            room: "",
                            post: undefined,
                            text: "",
                            node: undefined,
                            username: "Anonymous",
                            onChange: (s: string) => {
                                console.log("onChange", s);
                            },
                        }} />
                    </div>
                );
            case 'image':
                return <ImageUploader onUpload={(async (files) => {
                    const uploaded = await Promise.all(files.map(async (file) => {
                        const body = new FormData();
                        body.append("file", file);

                        const ret = await fetch("/upload", {
                            method: "POST",
                            body: body,
                        });
                        return await ret.text();
                    }));

                    console.log("upload", uploaded);
                    uploaded.forEach((url) => {
                        const id = generateUUID();
                        const vp = rf.getViewport();
                        nodesMap.set(id, {
                            id: id,
                            type: 'node',
                            position: { x: vp.x, y: vp.y },
                            data: new Node({
                                id,
                                name: "asdf",
                                type: {
                                    case: "url",
                                    value: url
                                }
                            }).toJson(),
                        })
                    })
                })} />;
            case 'url':
                return <div>URL</div>;
            case 'ai-editor':
                return (
                    <div className="container mx-auto md:mt-16 px-4" style={{width: "100%", maxHeight: "calc(100vh - 120px)", overflowY: "auto"}}>
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                            <div className="p-6">
                                <div className="mb-4">
                                    <h2 className="text-lg font-semibold text-gray-900 mb-2">AI-Powered Editor</h2>
                                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                                        <p className="text-sm text-blue-800">
                                            Use <strong>/ai</strong> for AI assistance or click the AI button in the toolbar
                                        </p>
                                    </div>
                                </div>
                                
                                <BlockNoteAIEditor
                                    placeholder="Start writing or type '/' for commands. Try '/ai' for AI assistance!"
                                    onChange={(blocks) => {
                                        console.log("AI Editor content changed:", blocks);
                                    }}
                                    className="min-h-96"
                                />
                            </div>
                        </div>
                    </div>
                );
            case 'graph':
                return (
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
                );
        }
    }

    return (
        <div style={{ width: '100vw', height: '100vh' }}>
            {view()}
            <div className="fixed bottom-0 left-1/2 transform -translate-x-1/2 w-full max-w-lg px-4 pb-4 pointer-events-none">
                <div className="flex items-end justify-center space-x-8 px-6 py-3 bg-white bg-opacity-30 backdrop-blur-md rounded-full shadow-lg pointer-events-auto">
                    <button
                        onClick={() => {
                            setState((prev) => ({
                                ...prev,
                                view: 'graph',
                            }));
                        }}
                        className="group focus:outline-none"
                        aria-label="Network"
                    >
                        <Network className="w-8 h-8 transition-transform duration-150 group-hover:scale-125" />
                    </button>
                    <button
                        onClick={() => {
                            setState((prev) => ({
                                ...prev,
                                view: 'text',
                            }));
                        }}
                        className="group focus:outline-none"
                        aria-label="Insert text"
                    >
                        <FileText className="w-8 h-8 transition-transform duration-150 group-hover:scale-125" />
                    </button>
                    <button
                        onClick={() => {
                            setState((prev) => ({
                                ...prev,
                                view: 'image',
                            }));
                        }}
                        className="group focus:outline-none"
                        aria-label="Insert image"
                    >
                        <Image className="w-8 h-8 transition-transform duration-150 group-hover:scale-125" />
                    </button>
                    <button
                        onClick={() => {
                            setState((prev) => ({
                                ...prev,
                                view: 'url',
                            }));
                        }}
                        className="group focus:outline-none"
                        aria-label="Insert URL"
                    >
                        <Link2 className="w-8 h-8 transition-transform duration-150 group-hover:scale-125" />
                    </button>
                    <button
                        onClick={() => {
                            setState((prev) => ({
                                ...prev,
                                view: 'ai-editor',
                            }));
                        }}
                        className="group focus:outline-none"
                        aria-label="AI Editor"
                    >
                        <Sparkles className="w-8 h-8 transition-transform duration-150 group-hover:scale-125" />
                    </button>
                </div>
            </div>
        </div>
    );
}

interface ImageUploadProps {
    /** Called when the user clicks “Upload” */
    onUpload: (files: File[]) => void
    /** Optional cancel action */
    onCancel?: () => void
}

const ImageUploader: FC<ImageUploadProps> = ({ onUpload, onCancel }) => {
    const inputRef = useRef<HTMLInputElement>(null)
    const [files, setFiles] = useState<File[]>([])

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files) return
        setFiles(prev => [...prev, ...Array.from(e.target.files)])
        e.target.value = '' // allow re-selecting same file
    }

    const removeFile = (i: number) =>
        setFiles(prev => prev.filter((_, idx) => idx !== i))

    const triggerFileSelect = () => inputRef.current?.click()

    return (
        <div className="fixed inset-0 bg-opacity-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6 flex flex-col space-y-4">
                <h2 className="text-xl font-semibold text-gray-800">Select Images</h2>

                {/* hidden native file input */}
                <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    ref={inputRef}
                    onChange={handleFileChange}
                />

                <button
                    onClick={triggerFileSelect}
                    className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow"
                >
                    <UploadCloud className="w-5 h-5" />
                    <span>Select Images</span>
                </button>

                {/* preview grid */}
                {files.length > 0 && (
                    <div className="grid grid-cols-3 gap-4">
                        {files.map((file, idx) => (
                            <div key={idx} className="relative group">
                                <img
                                    src={URL.createObjectURL(file)}
                                    alt={file.name}
                                    className="w-full h-24 object-cover rounded"
                                />
                                <button
                                    onClick={() => removeFile(idx)}
                                    className="absolute top-1 right-1 bg-white bg-opacity-70 rounded-full p-1 opacity-0 group-hover:opacity-100 transition"
                                >
                                    <X className="w-4 h-4 text-red-600" />
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                {/* action buttons */}
                <div className="mt-auto flex justify-end space-x-3">
                    {onCancel && (
                        <button
                            onClick={onCancel}
                            className="px-4 py-2 text-gray-700 hover:text-gray-900"
                        >
                            Cancel
                        </button>
                    )}
                    <button
                        onClick={() => onUpload(files)}
                        disabled={files.length === 0}
                        className={`px-4 py-2 rounded-lg font-medium ${
                            files.length === 0
                                ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                                : 'bg-green-600 hover:bg-green-700 text-white'
                        }`}
                    >
                        Upload{files.length > 0 && ` (${files.length})`}
                    </button>
                </div>
            </div>
        </div>
    )
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

interface EditorPropsF {
    props: {
        provider_url: string;
        room: string;
        post: {
            Blocknote: string;
        } | undefined;
        node: Node;
        username: string;
        text: string;
        onChange: (s: string) => void;
        footer?: (editor: BlockNoteEditor) => React.ReactNode;
    };
}


function ClipItem(props: DragHandleMenuProps) {
    const editor = useBlockNoteEditor();
    const doc = useYDoc();

    const Components = useComponentsContext()!;
    const rf = useReactFlow();

    return (
        <Components.Generic.Menu.Item
            onClick={async () => {
                const b = editor.getBlock(props.block);

                const id = generateUUID();
                const node = {
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
                            value: ""
                        }
                    }).toJson(),
                };
                Y.transact(doc, () => {
                    nodesMap.set(id, node);
                    try {
                        docsMap.set(id, prosemirrorToYXmlFragment(blocksToProsemirrorNode(editor, [b])));
                    } catch (e) {
                        // may be causing error
                        console.error(e);
                        docsMap.set(id, prosemirrorToYXmlFragment(blocksToProsemirrorNode(editor, [])));
                    }
                });
            }}>
            Clip
        </Components.Generic.Menu.Item>
    );
}

export const Editor: FC<EditorPropsF> = ({ props }) => {
    const abortControllerRef = useRef<AbortController|undefined>(undefined);
    const provider = useYjsProvider();
    const doc = useYDoc();
    const {state: {contentService, runningAI}, setState} = useContentService();

    const rf = useReactFlow();

    const ctrlAndC = useKeyPress(['Meta+g']);

    const editor = useCreateBlockNote({
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
            provider: provider,
            fragment: props.node ? docsMap.get(props.node.id) : doc.getXmlFragment('scratch'),
            user: {
                name: props?.username || "Anonymous",
            }
        },
        schema: schema,
    });

    useEffect(() => {
        if (runningAI) {
            (async () => {
                const text = await editor.blocksToMarkdownLossy(editor.document);
                await inferFromSelectedText(editor, contentService, abortControllerRef, text);
                setState((prev) => ({
                    ...prev,
                    runningAI: false,
                }));
            })();
        }
    }, [runningAI]);

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


    const insertAI = (editor: typeof schema.BlockNoteEditor): DefaultReactSuggestionItem => ({
        title: "Ask AI",
        onItemClick: async () => {
            const text = await editor.blocksToMarkdownLossy(editor.document);
            void inferFromSelectedText(editor, contentService, abortControllerRef, text);
        },
        aliases: ["ai"],
        group: "Other",
        icon: <MdCode />,
    });

    if (editor === undefined) {
        return <div>Loading...</div>;
    }

    return (
        <div>
            <BlockNoteView
                editor={editor}
                sideMenu={false}
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
            {props.footer && props.footer(editor)}
        </div>
    );
}

const inferFromSelectedText = async (
    editor: BlockNoteEditor,
    contentService: ContentService,
    abortControllerRef: React.RefObject<AbortController | undefined>,
    prompt: string,
) => {
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
        // TODO breadchris add ai features
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
    nodesMap: YMap<XYNode>
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
            console.log("paste", text);
            if (text.match(/\.(jpeg|jpg|gif|png|epub)$/) != null) {
                const id = generateUUID();
                const vp = rfInstance.getViewport();
                nodesMap.set(id, {
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
                })
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

type ITextSelection = {
    text: string
    cfiRange: string
}

export const EpubReader: React.FC<{id: string, url: string}> = ({id, url}) => {
    const [selections, setSelections] = useState<ITextSelection[]>([])
    const [rendition, setRendition] = useState<Rendition | undefined>(undefined)
    const [location, setLocation] = useState<string | number>(0)
    const cmdAndNPressed = useKeyPress(['Meta+g']);
    const [current, setCurrent] = useState<ITextSelection | null>(null);
    const doc = useYDoc();

    useEffect(() => {
        if (!cmdAndNPressed) {
            return;
        }
        console.log("cmd+g pressed");
    }, [cmdAndNPressed]);
    useEffect(() => {
        if (rendition) {
            function setRenderSelection(cfiRange: string, contents: Contents) {
                if (rendition) {
                    setCurrent({
                        text: rendition.getRange(cfiRange).toString(),
                        cfiRange,
                    });
                    // const selection = contents.window.getSelection()
                    // selection?.removeAllRanges()
                }
            }
            rendition.on('selected', setRenderSelection)
            return () => {
                rendition?.off('selected', setRenderSelection)
            }
        }
    }, [setSelections, rendition])
    const editor = BlockNoteEditor.create();

    return (
        <div style={{ height: '100vh' }}>
            <div className="border border-stone-400 bg-white min-h-[100px] p-2 rounded">
                <h2 className="font-bold mb-1">Selections</h2>
                <button className={"btn"} onClick={() => {
                    setSelections((list) =>
                        list.concat(current)
                    )

                    rendition.annotations.add(
                        'highlight',
                        current.cfiRange,
                        {},
                        undefined,
                        'hl',
                        { fill: 'red', 'fill-opacity': '0.5', 'mix-blend-mode': 'multiply' }
                    )
                    // const selection = contents.window.getSelection()
                    // selection?.removeAllRanges()
                }}>Select</button>
                <ul className="grid grid-cols-1 divide-y divide-stone-400 border-t border-stone-400 -mx-2">
                    {selections.map(({ text, cfiRange }, i) => (
                        <li key={i} className="p-2">
                            <span>{text}</span>
                            <button
                                className="underline hover:no-underline text-sm mx-1"
                                onClick={async () => {
                                    const blocks = await editor.tryParseMarkdownToBlocks(text);
                                    // rendition?.display(cfiRange)
                                    const id = generateUUID();
                                    const node = {
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
                                                value: ""
                                            }
                                        }).toJson(),
                                    };
                                    Y.transact(doc, () => {
                                        // TODO sync
                                        nodesMap.set(id, node);
                                        docsMap.set(id, prosemirrorToYXmlFragment(blocksToProsemirrorNode(editor, blocks)));
                                    });
                                }}
                            >
                                Clip
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

new EventSource('/esbuild').addEventListener('message', (event) => {
    if (event.data === 'change') {
        location.reload()
    }
})
const g = document.getElementById('graph');
const p = g.getAttribute('data-props');
const props = JSON.parse(p);
const root = createRoot(g);
root.render((
    <ContentServiceProvider url={props.url}>
        <YDocProvider docId={props.id} authEndpoint={async (): Promise<any> => {
            const res = await fetch("/graph/auth", {
                method: "POST",
                body: JSON.stringify({
                    id: props.id,
                }),
            })
            return await res.json();
        }}>
            <ReactFlowProvider>
                <GraphApp props={props} />
                {/*<App />*/}
            </ReactFlowProvider>
        </YDocProvider>
    </ContentServiceProvider>
));
