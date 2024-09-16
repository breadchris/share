import React, {useEffect} from 'react'
import {editor} from "~/components/features/workspace/CodeEditor";
import apiClient from "~/services/api/singleton.ts";

export const TailwindHelpers: React.FC = () => {
    const change = (change: string) => {
        const ed = editor;
        if (!ed) {
            return;
        }
        const pos = ed.getPosition()
        if (!pos) {
            return;
        }

        console.log(ed.getValue())
        console.log(`Cursor position: ${pos.lineNumber}:${pos.column}`)
        apiClient.modify(ed.getValue(), change, { line: pos.lineNumber, col: pos.column }).then((res) => {
            ed.setValue(res.code)
        }).catch((err) => {
            console.error(err)
        })
    }
    return (
        <div></div>
    );
}