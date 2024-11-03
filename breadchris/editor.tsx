import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
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
import Reveal from 'reveal.js';
import 'reveal.js/dist/reveal.css';
import 'reveal.js/dist/theme/black.css';
import * as Y from 'yjs';
import {WebsocketProvider} from "y-websocket";

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
    },
    inlineContentSpecs: {
        ...defaultInlineContentSpecs,
        mention: Mention,
    }
});

export const Editor = ({ props }) => {
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

        const aiBlocks = editor.insertBlocks(
            [
                {
                    content: "let me think...",
                },
            ],
            editor.getTextCursorPosition().block,
            "after"
        );

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
            let lastBlock = aiBlocks[0];

            let prevDepth = -1;
            let count = 0;
            const insertLine = (text: string) => {
                const newBlocks = editor.insertBlocks(
                    [
                        {
                            content: text,
                        },
                    ],
                    lastBlock,
                    count === 0 ? "nested" : "after"
                );
                return newBlocks[0];
            }
            for await (const exec of res) {
                // keep collecting until a newline is found
                content += exec;
                if (content.includes('\n')) {
                    const depth = countIndentationDepth(content);
                    content = content.trim()

                    lastBlock = insertLine(content);
                    content = '';
                    prevDepth = depth;
                    count += 1;
                }
            }
            if (content) {
                insertLine(content);
            }
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
    >("loading");

    // Loads the previously stored editor contents.
    useEffect(() => {
        loadFromStorage().then((content) => {
            setInitialContent(content);
        });
    }, []);
    // Creates a new editor instance.
    // We use useMemo + createBlockNoteEditor instead of useCreateBlockNote so we
    // can delay the creation of the editor until the initial content is loaded.
    const editor = useMemo(() => {
        if (initialContent === "loading" || (props?.provider_url && providerRef.current === undefined)) {
            return undefined;
        }

        // TODO breadchris when content is loaded, set the form inputs
        return BlockNoteEditor.create({
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
                    color: "blue",
                }
            },
            schema: schema,
        });
    }, [initialContent]);

    if (editor === undefined) {
        return <div>Loading...</div>;
    }

    return (
        <BlockNoteView
            editor={editor}
            onChange={async () => {
                saveToStorage(editor.document);
                document.getElementById("markdown").value = await editor.blocksToMarkdownLossy()
                document.getElementById("blocknote").value = JSON.stringify(editor.document);
            }}
            slashMenu={false}
        >
            <SuggestionMenuController
                triggerCharacter={"/"}
                getItems={async (query) =>
                    filterSuggestionItems(
                        [...getDefaultReactSlashMenuItems(editor), insertCode(), insertLocation(), insertAI(editor)],
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
import {CodeBlock, insertCode} from "./CodeBlock";
import {contentService} from "./ContentService";
import {insertLocation, LocationBlock} from "./LocationPicker";
const e = document.getElementById('editor');
if (e) {
    const r = createRoot(e);
    const props = e.getAttribute('props');
    r.render((
        <Editor props={JSON.parse(props)} />
    ));
}

const s = document.getElementById('slides');
if (s) {
    const r = createRoot(s);
    r.render((
        <Slides />
    ));
}
