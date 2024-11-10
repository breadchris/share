import React from "react";
import { createReactBlockSpec } from "@blocknote/react";
import { BlockNoteEditor, insertOrUpdateBlock } from "@blocknote/core";
import { MdCode } from "react-icons/md";
import ReactCodeMirror from "@uiw/react-codemirror";
import { langs } from "@uiw/codemirror-extensions-langs";
import {CodeEditor} from "../wasmcode/monaco";

const TYPE = "procode";

export const CodeBlock = createReactBlockSpec(
    {
        type: TYPE,
        propSchema: {
            data: {
                //@ts-ignore
                language: "golang",
                code: '',
            },
        },
        content: "none",
    },
    {
        render: ({ block, editor }) => {
            const { data } = block?.props;
            const onInputChange = (val: string) => {
                editor.updateBlock(block, {
                    //@ts-ignore
                    props: { ...block.props, data: val },
                });
            };

            return (
                <ReactCodeMirror
                    id={block?.id}
                    autoFocus
                    placeholder={"Write your code here..."}
                    style={{ width: "100%", resize: "vertical" }}
                    //@ts-ignore
                    extensions={[langs[data?.language ? data?.language : "go"]()]}
                    value={data}
                    theme={"dark"}
                    editable={editor.isEditable}
                    width="100%"
                    height="200px"
                    onChange={onInputChange}
                />
            );
        },
        toExternalHTML: ({ block }) => {
            return (
                <pre>
                  <code>{block?.props?.data}</code>
                </pre>
            );
        },
    }
);

export const insertCode = () => ({
    title: "Code",
    group: "Other",
    onItemClick: (editor: BlockNoteEditor) => {
        insertOrUpdateBlock(editor, {
            //@ts-ignore
            type: TYPE,
        });
    },
    aliases: ["code"],
    icon: <MdCode />,
    subtext: "Insert a code block.",
});

const MONACO_TYPE = "monaco";

const defaultCode = `
package main

import (
    . "github.com/breadchris/share/html"
)

func Render() *Node {
    return Div(
        H1(T("Hello, World!")),
    )
}
`;

export const MonacoBlock = createReactBlockSpec(
    {
        type: MONACO_TYPE,
        propSchema: {
            data: {
                //@ts-ignore
                language: "golang",
                code: '',
            },
        },
        content: "none",
    },
    {
        render: ({ block, editor }) => {
            const { data } = block?.props;
            const onInputChange = (val: string) => {
                editor.updateBlock(block, {
                    //@ts-ignore
                    props: { ...block.props, data: val },
                });
            };

            return (
                <div style={{height: '300px', width: "100%"}}>
                    <CodeEditor props={{
                        serverURL: "http://localhost:8080",
                        id: "1",
                        fileName: "main.go",
                        darkMode: true,
                        func: "main.Render",
                        vimModeEnabled: true,
                        code: data || defaultCode,
                        onChange: onInputChange,
                    }} />
                </div>
            );
        },
        toExternalHTML: ({ block }) => {
            const { data } = block?.props;
            const props = {
                serverURL: "http://localhost:8080",
                id: "1",
                fileName: "main.go",
                darkMode: true,
                func: "main.Render",
                vimModeEnabled: true,
                code: data,
            };

            return (
                <div style={{height: '300px', width: "100%"}} data-props={JSON.stringify(props)}></div>
            );
        },
    }
);

export const insertMonaco = () => ({
    title: "Monaco",
    group: "Other",
    onItemClick: (editor: BlockNoteEditor) => {
        insertOrUpdateBlock(editor, {
            //@ts-ignore
            type: MONACO_TYPE,
        });
    },
    aliases: ["monaco"],
    icon: <MdCode />,
    subtext: "Insert a code block.",
});
