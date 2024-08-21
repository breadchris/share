/* eslint-env browser */

import * as Y from 'yjs'
import { WebsocketProvider } from 'y-websocket'
// @ts-ignore
import { MonacoBinding } from 'y-monaco'
import * as monaco from 'monaco-editor'

const nodeModules = "/dist/node_modules/monaco-editor/esm/vs/"

// editor accessible from the window object
window.editor = null;

window.MonacoEnvironment = {
    getWorkerUrl: function (moduleId, label) {
        if (label === 'json') {
            return nodeModules + 'language/json/json.worker.js'
        }
        if (label === 'css' || label === 'scss' || label === 'less') {
            return nodeModules + 'language/css/css.worker.js'
        }
        if (label === 'html' || label === 'handlebars' || label === 'razor') {
            return nodeModules + 'language/html/html.worker.js'
        }
        if (label === 'typescript' || label === 'javascript') {
            return nodeModules + 'language/typescript/ts.worker.js'
        }
        return nodeModules + 'editor/editor.worker.js'
    }
}

window.addEventListener('load', () => {
    const ydoc = new Y.Doc()
    const provider = new WebsocketProvider('wss://justshare.io:1234', 'monaco', ydoc)
    const type = ydoc.getText('monaco')

    // TODO provide fallback

    window.editor = monaco.editor.create(/** @type {HTMLElement} */ (document.getElementById('monaco-editor')), {
        value: '',
        theme: 'vs-dark',
        lineNumbers: 'off',
        glyphMargin: false,
        folding: false,
        // Undocumented see https://github.com/Microsoft/vscode/issues/30795#issuecomment-410998882
        lineDecorationsWidth: 0,
        lineNumbersMinChars: 0
    });
    const monacoBinding = new MonacoBinding(type, /** @type {monaco.editor.ITextModel} */ (window.editor.getModel()), new Set([editor]), provider.awareness)

    // const connectBtn = /** @type {HTMLElement} */ (document.getElementById('y-connect-btn'))
    // connectBtn.addEventListener('click', () => {
    //     if (provider.shouldConnect) {
    //         provider.disconnect()
    //         connectBtn.textContent = 'Connect'
    //     } else {
    //         provider.connect()
    //         connectBtn.textContent = 'Disconnect'
    //     }
    // })

    // @ts-ignore
    window.example = { provider, ydoc, type, monacoBinding }
})