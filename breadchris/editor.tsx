import React, {FC, useCallback, useEffect, useMemo, useRef, useState} from 'react';
import "@blocknote/core/fonts/inter.css";
import {
    createReactInlineContentSpec,
    DefaultReactSuggestionItem, DragHandleMenu, DragHandleMenuProps,
    getDefaultReactSlashMenuItems, RemoveBlockItem, SideMenu, SideMenuController,
    SuggestionMenuController, useBlockNoteEditor, useComponentsContext,
    useCreateBlockNote
} from "@blocknote/react";
import { BlockNoteView } from "@blocknote/mantine";
import "@blocknote/mantine/style.css";
import Reveal from 'reveal.js';
import 'reveal.js/dist/reveal.css';
import 'reveal.js/dist/theme/black.css';
import * as Y from 'yjs';
import {WebsocketProvider} from "y-websocket";
import { motion } from "framer-motion";

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
        procode: CodeBlock,
        location: LocationBlock,
        monaco: MonacoBlock,
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
    console.log(rf)

    return (
        <Components.Generic.Menu.Item
            onClick={() => {
                const b = editor.getBlock(props.block)
                rf.addNodes([{
                    id: 'asdf',
                    position: {
                        x: 100,
                        y: 100,
                    },
                    type: 'ai',
                    data: {
                        viewing: true
                    },
                }])
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
        // if (!props?.post?.Blocknote) {
            console.log("loading from storage");
            loadFromStorage().then((content) => {
                setInitialContent(content);
            });
        // }
    }, []);
    // Creates a new editor instance.
    // We use useMemo + createBlockNoteEditor instead of useCreateBlockNote so we
    // can delay the creation of the editor until the initial content is loaded.
    const editor = useMemo(() => {
        if (initialContent === "loading") { // || (props?.provider_url && providerRef.current === undefined)) {
            return undefined;
        }

        console.log("Creating editor with initial content", initialContent);

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
            // collaboration: {
            //     provider: providerRef.current,
            //     fragment: doc.getXmlFragment("blocknote"),
            //     user: {
            //         name: props?.username || "Anonymous",
            //     }
            // },
            schema: schema,
        });

        saveToStorage(e.document);

        (async () => {
            document.getElementById("html").value = await e.blocksToFullHTML(e.document);
            document.getElementById("markdown").value = await e.blocksToMarkdownLossy()
            document.getElementById("blocknote").value = JSON.stringify(e.document);
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
                console.log(editor.document)
                saveToStorage(editor.document);
                document.getElementById("html").value = await editor.blocksToFullHTML(editor.document);
                document.getElementById("markdown").value = await editor.blocksToMarkdownLossy()
                document.getElementById("blocknote").value = JSON.stringify(editor.document);
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
                            insertCode(),
                            insertLocation(),
                            insertAI(editor),
                            insertMonaco(),
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

import {createRoot} from 'react-dom/client';
import {CodeBlock, insertCode, insertMonaco, MonacoBlock} from "./CodeBlock";
import {contentService} from "./ContentService";
import {insertLocation, LocationBlock} from "./LocationPicker";
import {useReactFlow} from "@xyflow/react";
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
