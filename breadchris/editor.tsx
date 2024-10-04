import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import "@blocknote/core/fonts/inter.css";
import {getDefaultReactSlashMenuItems, SuggestionMenuController, useCreateBlockNote} from "@blocknote/react";
import { BlockNoteView } from "@blocknote/mantine";
import "@blocknote/mantine/style.css";
import Reveal from 'reveal.js';
import 'reveal.js/dist/reveal.css';
import 'reveal.js/dist/theme/black.css';

import {
    Block,
    BlockNoteEditor,
    BlockNoteSchema,
    defaultBlockSpecs,
    filterSuggestionItems,
    PartialBlock
} from "@blocknote/core";

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

export const Editor = () => {
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
        if (initialContent === "loading") {
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
            schema: BlockNoteSchema.create({
                blockSpecs: {
                    ...defaultBlockSpecs,
                    procode: CodeBlock,
                }
            }),
        });
    }, [initialContent]);

    if (editor === undefined) {
        return "Loading content...";
    }

    // Renders the editor instance.
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
                        [...getDefaultReactSlashMenuItems(editor), insertCode()],
                        query
                    )
                }
            />
        </BlockNoteView>
    );
}


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
const e = document.getElementById('editor');
if (e) {
    const r = createRoot(e);
    r.render((
        <Editor />
    ));
}

const s = document.getElementById('slides');
if (s) {
    const r = createRoot(s);
    r.render((
        <Slides />
    ));
}
