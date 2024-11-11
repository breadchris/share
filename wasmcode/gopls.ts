import { MonacoLanguageClient } from 'monaco-languageclient';
import {listen, toSocket, WebSocketMessageReader, WebSocketMessageWriter} from 'vscode-ws-jsonrpc';
import * as vscode from 'vscode';

const url = 'ws://localhost:8080/gopls';
const webSocket = new WebSocket(url);

webSocket.onopen = () => {
    console.log('WebSocket connection opened');

    const initializeParams = {
        jsonrpc: '2.0',
        method: 'initialize',
        params: {
            processId: null,
            rootUri: 'file:///Users/hacked/Documents/GitHub/share',
            capabilities: {
                textDocument: {
                    synchronization: {
                        didSave: true
                    },
                    completion: {
                        completionItem: {
                            snippetSupport: true
                        }
                    }
                },
                workspace: {
                    configuration: true
                }
            },
            "workspaceFolders": [
                {
                    "uri": "file:///Users/hacked/Documents/GitHub/share",
                    "name": "workspace"
                }
            ],
            trace: 'on'
        },
        id: 1
    };
    webSocket.send(JSON.stringify(initializeParams));
};

webSocket.onmessage = (event) => {
    const response = JSON.parse(event.data);

    console.log('Received response:', response);
    if (response.method === 'textDocument/publishDiagnostics') {
        const { diagnostics } = response.params;
        const monacoDiagnostics = diagnostics.map(diag => {
            return {
                severity: monaco.MarkerSeverity[diag.severity],
                startLineNumber: diag.range.start.line + 1,
                startColumn: diag.range.start.character + 1,
                endLineNumber: diag.range.end.line + 1,
                endColumn: diag.range.end.character + 1,
                message: diag.message
            };
        });

        monaco.editor.setModelMarkers(editor.getModel(), 'gopls', monacoDiagnostics);
    } else if (response.id === 5 && response.result) {
        // Handle hover information response
        const hover = response.result;
        if (hover && hover.contents) {
            console.log('Hover information:', hover.contents);
        }
    } else if (response.id === 1 && response.result) {
        const openParams = {
            jsonrpc: '2.0',
            method: 'initialized',
            id: 1
        };
        webSocket.send(JSON.stringify(openParams));
        // const openParams = {
        //     jsonrpc: '2.0',
        //     method: 'textDocument/didOpen',
        //     params: {
        //         textDocument: {
        //             uri: 'file:///Users/hacked/Documents/GitHub/share/main.go',
        //             languageId: 'go',
        //             version: 1,
        //             text: editor.getValue()
        //         }
        //     },
        //     id: 1
        // };
        // webSocket.send(JSON.stringify(openParams));
    }
};

webSocket.onerror = (error) => {
    console.error('WebSocket error:', error);
};

webSocket.onclose = () => {
    console.log('WebSocket connection closed');
};
//
// editor.onDidChangeModelContent((event) => {
//     const model = editor.getModel();
//     const content = model.getValue();
//
//     const changeParams = {
//         jsonrpc: '2.0',
//         method: 'textDocument/didChange',
//         params: {
//             textDocument: {
//                 uri: 'file:///Users/hacked/Documents/GitHub/share/main.go',
//                 version: 1
//             },
//             contentChanges: [
//                 {
//                     text: content
//                 }
//             ]
//         },
//         id: 2
//     };
//     webSocket.send(JSON.stringify(changeParams));
// });
//
// editor.onDidFocusEditorWidget(() => {
//     const focusParams = {
//         jsonrpc: '2.0',
//         method: 'window/didChangeFocus',
//         params: {
//             textDocument: {
//                 uri: 'file:///Users/hacked/Documents/GitHub/share/main.go'
//             }
//         },
//         id: 4
//     };
//     webSocket.send(JSON.stringify(focusParams));
// });
//
// editor.onDidChangeCursorSelection((event) => {
//     const hoverParams = {
//         jsonrpc: '2.0',
//         method: 'textDocument/hover',
//         params: {
//             textDocument: {
//                 uri: 'file:///Users/hacked/Documents/GitHub/share/main.go'
//             },
//             position: {
//                 line: event.selection.startLineNumber - 1,
//                 character: event.selection.startColumn - 1
//             }
//         },
//         id: 5
//     };
//     webSocket.send(JSON.stringify(hoverParams));
// });

function handleLanguageServerResponse(response) {
}

editor.onDidChangeCursorPosition((e) => {
    const requestCompletionParams = {
        jsonrpc: '2.0',
        method: 'textDocument/completion',
        params: {
            textDocument: {
                uri: 'file:///Users/hacked/Documents/GitHub/share/main.go'
            },
            position: {
                line: e.position.lineNumber - 1,
                character: e.position.column - 1
            }
        },
        id: 3
    }
    webSocket.send(JSON.stringify(requestCompletionParams));
});