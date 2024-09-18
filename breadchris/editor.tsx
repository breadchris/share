import React, {useCallback, useEffect, useRef, useState} from 'react';

import "@blocknote/core/fonts/inter.css";
import { useCreateBlockNote } from "@blocknote/react";
import { BlockNoteView } from "@blocknote/mantine";
import "@blocknote/mantine/style.css";

export const Editor = () => {
    // Creates a new editor instance.
    const editor = useCreateBlockNote();
    return <BlockNoteView editor={editor} />;
}

import {createRoot} from 'react-dom/client';
const root = createRoot(document.getElementById('editor'));
root.render((
    <Editor />
));
