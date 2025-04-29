import {Handle, Position, useKeyPress, useReactFlow} from "@xyflow/react";
import React, {useCallback, useEffect, useRef, useState} from "react";
import ReactPlayer from "react-player/youtube";
import {defaultLayoutPlugin} from "@react-pdf-viewer/default-layout";
import {ScrollMode, Viewer, Worker} from "@react-pdf-viewer/core";
import {EpubReader} from "./graph";
import {Contents, Rendition} from "epubjs";
import {ReactReader} from "react-reader";
import {Node} from "./rpc/node_pb";
import * as Y from "yjs";
import ydoc from "./ydoc";
import {docsMap, nodesMap} from "./useNodesStateSynced";
import {prosemirrorToYXmlFragment} from "y-prosemirror";
import {useBlockNoteEditor} from "@blocknote/react";
import {BlockNoteEditor, blockToNode, PartialBlock} from "@blocknote/core";

function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (char) {
        const random = Math.random() * 16 | 0;
        const value = char === 'x' ? random : (random & 0x3 | 0x8);
        return value.toString(16);
    });
}

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

export const EpubReader: React.FC<{id: string, url: string}> = ({id, url}) => {
    const [selections, setSelections] = useState<ITextSelection[]>([])
    const [rendition, setRendition] = useState<Rendition | undefined>(undefined)
    const [location, setLocation] = useState<string | number>(0)
    const cmdAndNPressed = useKeyPress(['Meta+g']);
    const [current, setCurrent] = useState<ITextSelection | null>(null);

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
                                    Y.transact(ydoc, () => {
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

// export const AINode = (props) => {
//     const { data } = props;
//     const rf = useReactFlow();
//     const [text, setText] = useState(data.text);
//     const onChange = (e) => {
//         setText(e.target.value);
//         setSyncedNodes(rf.getNodes().map((node) => {
//             if (node.id === props.id) {
//                 return {
//                     ...node,
//                     data: {
//                         ...node.data,
//                         text: e.target.value,
//                     },
//                 };
//             }
//             return node;
//         }));
//     }
//
//     const setData = (newData) => {
//         setSyncedNodes(rf.getNodes().map((node) => {
//             if (node.id === props.id) {
//                 return {
//                     ...node,
//                     data: {
//                         ...node.data,
//                         ...newData,
//                     },
//                 };
//             }
//             return node;
//         }));
//     }
//     return (
//         <>
//             <Handle type="target" position={Position.Top}/>
//             <div className={"p-6 flex flex-col"}>
//                 {data.viewing ? (
//                     <div dangerouslySetInnerHTML={{__html: data.text}}/>
//                 ) : (
//                     <textarea onChange={onChange} value={data.text}/>
//                 )}
//                 <button onClick={() => {
//                     setData({ viewing: !data.viewing });
//                 }}>edit</button>
//                 <button onClick={() => {
//                     const id = generateUUID();
//                     setSyncedNodes(rf.getNodes().concat({
//                         id: id,
//                         position: {
//                             x: props.positionAbsoluteX,
//                             y: props.positionAbsoluteY + props.height,
//                         },
//                         type: 'ai',
//                         data: {
//                             viewing: true
//                         },
//                     }))
//                     setSyncedEdges(rf.getEdges().concat({
//                         id: generateUUID(),
//                         source: props.id,
//                         target: id,
//                     }));
//
//                     socketRef.current.send(JSON.stringify({
//                         type: 'ai',
//                         value: {
//                             id: id,
//                             text: text,
//                         },
//                     }));
//                 }}>submit
//                 </button>
//             </div>
//             <Handle type="source" position={Position.Bottom} id="a"/>
//         </>
//     );
// }


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
