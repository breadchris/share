import React, {useEffect, useState, useRef, MutableRefObject} from 'react';
import MonacoEditor, { type Monaco, loader } from '@monaco-editor/react';
import { createRoot } from 'react-dom/client';
import {createVimModeAdapter, StatusBarAdapter} from './vim';
import { getTimeNowUsageMarkers, asyncDebounce } from './utils';
import { attachCustomCommands } from './commands';
import { registerGoLanguageProviders } from './autocomplete/register';
import { LeapMonacoBinding } from './LeapMonacoBinding';
import { RemoteCursorManager } from './collab';
import * as monaco from 'monaco-editor';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import {GoSyntaxChecker} from "./checker";
import { MonacoBinding } from "y-monaco";
import * as Y from "yjs";
import {WebrtcProvider} from "y-webrtc";
import {WebsocketProvider} from "y-websocket";
import { Awareness } from 'y-protocols/awareness';

function listenEvent(eventName, callback) {
    document.addEventListener(eventName, (event) => {
        callback(event.detail);
    });
}

// var ws = new WebSocket("ws://" + window.location.host + "/cursors/ws");
//
// var cursors = {};
//
// ws.onmessage = function(event) {
//     var data = JSON.parse(event.data);
//     var cursor = cursors[data.client_id];
//
//     if (!cursor) {
//         // Create a new cursor if it doesn't exist
//         var cursorElement = document.createElement("div");
//         cursorElement.id = data.client_id;
//         cursorElement.style.position = "absolute";
//         cursorElement.style.width = "10px";
//         cursorElement.style.height = "10px";
//         cursorElement.style.borderRadius = "50%";
//         cursorElement.style.backgroundColor = data.color;
//         document.body.appendChild(cursorElement);
//
//         cursor = cursors[data.client_id] = {
//             element: cursorElement,
//             currentX: data.data.x,
//             currentY: data.data.y,
//             targetX: data.data.x,
//             targetY: data.data.y,
//         };
//     }
//
//     // Update the target position
//     cursor.targetX = data.data.x;
//     cursor.targetY = data.data.y;
// };
//
// // Smoothly transition the cursor positions
// function smoothMove() {
//     Object.keys(cursors).forEach(function(clientId) {
//         var cursor = cursors[clientId];
//         // Calculate the difference between the current and target positions
//         var dx = cursor.targetX - cursor.currentX;
//         var dy = cursor.targetY - cursor.currentY;
//
//         // Apply a smoothing factor (e.g., 0.1) to make the movement gradual
//         cursor.currentX += dx * 0.1;
//         cursor.currentY += dy * 0.1;
//
//         // Update the cursor's position on the page
//         cursor.element.style.left = cursor.currentX + "px";
//         cursor.element.style.top = cursor.currentY + "px";
//     });
//
//     // Continue the animation loop
//     requestAnimationFrame(smoothMove);
// }
//
// // Start the animation loop
// smoothMove();
//
// // touch
// document.addEventListener("touchmove", function(event) {
//     ws.send(JSON.stringify({
//         type: "mousemove",
//         data: {x: event.touches[0].clientX, y: event.touches[0].clientY}
//     }));
// });
//
// document.addEventListener("mousemove", function(event) {
//     ws.send(JSON.stringify({
//         type: "mousemove",
//         data: {x: event.clientX, y: event.clientY}
//     }));
// });
//
// document.addEventListener("keydown", function(event) {
//     ws.send(JSON.stringify({
//         type: "keydown",
//         data: {key: event.key}
//     }));
// });
//
// document.addEventListener("keyup", function(event) {
//     ws.send(JSON.stringify({
//         type: "keyup",
//         data: {key: event.key}
//     }));
// });
//
// document.addEventListener("click", function(event) {
//     ws.send(JSON.stringify({
//         type: "click",
//         data: {x: event.clientX, y: event.clientY}
//     }));
// });



interface CursorsType {
    lineNumber: number,
    column: number
}
interface SelectionsType {
    startLineNumber: number,
    startColumn: number,
    endLineNumber: number,
    endColumn: number
}
export interface UsersType {
    cursor: {
        column?: number,
        lineNumber?: number
    },
    selection: {
        endColumn?: number, endLineNumber?: number, positionColumn?: number, positionLineNumber?: number, selectionStartColumn?: number, selectionStartLineNumber?: number, startColumn?: number, startLineNumber?: number
    },
    user: {
        color?: string, name?: string
    }
}

let loaderConfigured = false;
export const configureMonacoLoader = () => {
    if (loaderConfigured) {
        return;
    }

    loader.config({ monaco });
    loaderConfigured = true;
};

const nodeModules = '/dist/node_modules/monaco-editor/esm/vs/';
window.MonacoEnvironment = {
    getWorkerUrl: function (moduleId, label) {
        if (label === 'json') {
            return nodeModules + 'language/json/json.worker.js';
        }
        if (label === 'css' || label === 'scss' || label === 'less') {
            return nodeModules + 'language/css/css.worker.js';
        }
        if (label === 'html' || label === 'handlebars' || label === 'razor') {
            return nodeModules + 'language/html/html.worker.js';
        }
        if (label === 'typescript' || label === 'javascript') {
            return nodeModules + 'language/typescript/ts.worker.js';
        }
        return nodeModules + 'editor/editor.worker.js';
    },
};

const LANGUAGE_GOLANG = 'go';
const ANALYZE_DEBOUNCE_TIME = 500;

// ask monaco-editor/react to use our own Monaco instance.
configureMonacoLoader();

const makeid = (length) => {
    let result = '';
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const charactersLength = characters.length;
    let counter = 0;
    while (counter < length) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
        counter += 1;
    }
    return result;
};

const CodeEditor = ({ id, fileName, darkMode, func, vimModeEnabled, isServerEnvironment, code: initialCode }) => {
    const syntaxChecker = useRef<GoSyntaxChecker>(null);
    const [code, setCode] = useState(initialCode);
    const [data, setData] = useState(localStorage.getItem('data') || '{}');
    const [result, setResult] = useState('');
    const analyzer = useRef();
    const editorInstance = useRef<monaco.editor.IStandaloneCodeEditor>();
    const vimAdapter = useRef();
    const vimCommandAdapter: MutableRefObject<StatusBarAdapter> = useRef();
    const monacoInstance = useRef();
    const disposables = useRef([]);
    const cursors = useRef();
    const debouncedAnalyzeFunc = useRef(
        asyncDebounce(async (fileName, code) => await doAnalyze(fileName, code), ANALYZE_DEBOUNCE_TIME)
    );
    const client = useRef();
    const [awarenessElem, setAwareness] = useState<Awareness>();
    const [allUsers, setAllUsers] = useState<UsersType[]>([])

    useEffect(() => {
        disposables.current = registerGoLanguageProviders();
        syntaxChecker.current = new GoSyntaxChecker();

        return () => {
            disposables.current.forEach((d) => d.dispose());
            analyzer.current?.dispose();
            vimAdapter.current?.dispose();
            if (editorInstance.current) {
                monacoInstance.current?.editor.removeAllMarkers(editorInstance.current.getId());
                monacoInstance.current?.editor.getModels().forEach((m) => m.dispose());
                editorInstance.current.dispose();
            }
        };
    }, []);

    const doAnalyze = async (fileName, code) => {
        if (!fileName.endsWith('.go')) {
            return;
        }

        const promises = [
            analyzer.current?.getMarkers(code) ?? null,
            isServerEnvironment ? Promise.resolve(getTimeNowUsageMarkers(code, editorInstance.current)) : null,
        ].filter((p) => !!p);

        const results = await Promise.allSettled(promises);
        const markers = results.flatMap((r) => {
            if (r.status === 'rejected') {
                console.error(r.reason);
                return [];
            }
            return r.value ?? [];
        });

        if (!editorInstance.current) return;
        monacoInstance.current?.editor.setModelMarkers(editorInstance.current.getModel(), editorInstance.current.getId(), markers);
    };

    const dataEditorDidMount = (editor, monaco) => {
        editor.onKeyDown((e) => {
            if (vimModeEnabled) {
                return;
            }
            vimCommandAdapter.current?.handleKeyDownEvent(e, '');
        });

        const [vimAdapterInstance, statusAdapter] = createVimModeAdapter(editor);
        vimAdapter.current = vimAdapterInstance;
        vimCommandAdapter.current = statusAdapter;

        console.log('Vim mode enabled');
        vimAdapterInstance.attach();

        const actions = [
            {
                id: 'format-json',
                label: 'Format JSON',
                contextMenuGroupId: 'navigation',
                run: (editor) => {
                    const json = editor.getValue();
                    editor.setValue(JSON.stringify(JSON.parse(json), null, 2));
                },
            },
        ];

        actions.forEach((action) => editor.addAction(action));
    }

    const editorDidMount = (editor, monaco, file) => {
        editorInstance.current = editor;
        monacoInstance.current = monaco;

        listenEvent('example', (data) => {
            editor.setValue(document.getElementById(data.id).textContent);
        });

        const ydoc = new Y.Doc();
        // const provider = new WebrtcProvider("asdfasdfasdffdsfkjfjf", ydocument, { signaling: ['ws://192.168.1.88:4444'] });
        const provider = new WebsocketProvider(
            'ws://localhost:8080/wasmcode/ws',
            id,
            ydoc
        )
        const type = ydoc.getText("monaco");
        // if (type.length === 0) {
        //     type.insert(0, initialCode);
        // }


        const oncursorChange = (e: any) => {
            const position = e.position;
            // provider.awareness.setLocalStateField('cursor', position);
            // provider.awareness.setLocalStateField('user', { name, color: 'red' });
        }
        const onSelectionChange = (e: any) => {
            const selection = e.selection;
            // provider.awareness.setLocalStateField('selection', selection);
            // provider.awareness.setLocalStateField('user', { name, color: 'red' });
        }

        editor.onDidChangeCursorPosition(oncursorChange);
        editor.onDidChangeCursorSelection(onSelectionChange);

        const monacoBinding = new MonacoBinding(
            type,
            editor.getModel(),
            new Set([editor]),
            provider.awareness
        );

        provider.awareness.on('update', (update) => {
            const states = Array.from(provider.awareness.getStates().values()) as UsersType[];
            if (JSON.stringify(states) !== JSON.stringify(allUsers)) {
                // otherState.setState({ users: states });
                setAllUsers(states)
            }
        });

        provider.awareness.on('change', () => {
            const arr = Array.from(provider.awareness.getStates().values());

            for (let i = 0; i < arr.length; i++) {
                const cursor = arr[i].cursor;
                const selection = arr[i].selection;
                const user = arr[i].user?.color;
                const name = arr[i].user?.name;
                if (cursor) {
                    // try {
                    //     cursorsManager.getCursor(name);
                    // } catch (e) {
                    //     cursorsManager.addCursor(name, 'red', name);
                    // } finally {
                    //     cursorsManager.setCursorPosition(name, {
                    //         lineNumber: cursor.lineNumber,
                    //         column: cursor.column,
                    //     });
                    // }
                }
                if (selection) {
                }
            }
        })

        const cursorsManager = new RemoteCursorManager({
            editor,
            tooltips: true,
            tooltipDuration: 2,
        });
        cursors.current = cursorsManager;

        // const leapClient = new leap_client();

        editor.onKeyDown((e) => {
            if (vimModeEnabled) {
                return;
            }
            vimCommandAdapter.current?.handleKeyDownEvent(e, '');
        });
        editor.onDidChangeCursorPosition((e) => {
            const { position } = e;
            // console.log(`Cursor position: ${position.lineNumber}:${position.column}`);
        });

        const [vimAdapterInstance, statusAdapter] = createVimModeAdapter(editor);
        vimAdapter.current = vimAdapterInstance;
        vimCommandAdapter.current = statusAdapter;

        if (vimModeEnabled) {
            console.log('Vim mode enabled');
            vimAdapterInstance.attach();
        }

        const actions = [
            {
                id: 'clear',
                label: 'Reset contents',
                contextMenuGroupId: 'navigation',
                run: () => {
                    // this.props.dispatch(dispatchResetWorkspace)
                },
            },
            {
                id: 'run-code',
                label: 'Build And Run Code',
                contextMenuGroupId: 'navigation',
                keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter],
                run: () => runCode(),
            },
            {
                id: 'format-code',
                label: 'Format Code (goimports)',
                contextMenuGroupId: 'navigation',
                keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KeyF],
                run: () => {
                    // this.props.dispatch(dispatchFormatFile())
                },
            },
        ];

        disposables.current.push(
            editor.onDidChangeConfiguration((e) => {
                if (e.hasChanged(monaco.editor.EditorOption.fontSize)) {
                    const newFontSize = editor.getOption(monaco.editor.EditorOption.fontSize);
                }
            })
        );

        disposables.current.push(
            {
                dispose: () => {
                    // leapClient.close();
                }
            }
        )

        actions.forEach((action) => editor.addAction(action));
        attachCustomCommands(editor);
        editor.focus();

        debouncedAnalyzeFunc.current(fileName, code);
    };

    const runCode = async (d?: string) => {
        console.log("Running code");
        if (syntaxChecker.current && editorInstance.current) {
            const res = await syntaxChecker.current.runCode(editorInstance.current.getValue());
            if (res.error) {
                setResult(res.error);
                return;
            }
            setResult(res.output);
        }
    };

    useEffect(() => {
        debouncedAnalyzeFunc.current(fileName, code);
    }, [fileName, isServerEnvironment]);

    useEffect(() => {
        if (vimModeEnabled) {
            console.log('Vim mode enabled');
            vimAdapter.current?.attach();
        } else {
            console.log('Vim mode disabled');
            vimAdapter.current?.dispose();
        }
    }, [vimModeEnabled]);

    const onChange = (newVal, e) => {
        if (syntaxChecker.current && editorInstance.current) {
            syntaxChecker.current.requestModelMarkers(editorInstance.current.getModel(), editorInstance.current, {});
        }
        setCode(newVal);
        runCode();
    }

    const onDataChange = (newVal, e) => {
        setData(newVal);
        // save to local storage
        localStorage.setItem('data', newVal);
        runCode(newVal);
    }

    const modalRef = useRef(null);

    // Toggle the menu when ⌘K is pressed
    React.useEffect(() => {
        if (!modalRef.current) {
            return;
        }
        const listener = (event) => {
            if (event.key === 'k' && event.metaKey) {
                if (modalRef.current.open) {
                    modalRef.current.close();
                } else {
                    modalRef.current.showModal();
                }
            }
        };
        document.addEventListener('keydown', listener);
        return () => {
            document.removeEventListener('keydown', listener);
        };
    }, [modalRef])

    const [htmlContent, setHtmlContent] = useState('');

    useEffect(() => {
        // Fetch the HTML from /wasmcode/sidebar
        fetch('/wasmcode/sidebar')
            .then((response) => response.text())
            .then((html) => {
                setHtmlContent(html); // Store the HTML content
            })
            .catch((error) => {
                console.error('Error fetching HTML:', error);
            });
    }, []);

    return (
        <>
            <dialog id="my_modal_1" className="modal" ref={modalRef}>
                <div className="modal-box">
                    <form method="dialog" className="modal-backdrop">
                        <button className={"btn btn-primary"}>save</button>
                        <button className={"btn btn-neutral"}>close</button>
                    </form>
                </div>
            </dialog>

            <PanelGroup direction="horizontal">
                <Panel defaultSize={20}>
                    <div className={"overflow-auto h-full"} dangerouslySetInnerHTML={{__html: htmlContent}}/>
                </Panel>
                <PanelResizeHandle className="w-2 bg-gray-300"/>
                <Panel>
                    <PanelGroup direction="vertical">
                        <Panel>
                            <MonacoEditor
                                language={LANGUAGE_GOLANG}
                                theme={darkMode ? 'vs-dark' : 'vs-light'}
                                value={code}
                                defaultValue={code}
                                path={fileName}
                                options={{}}
                                onChange={onChange}
                                onMount={(e, m) => editorDidMount(e, m, fileName)}
                                loading={<span className={'loading loading-spinner'}>Loading...</span>}
                            />
                        </Panel>
                        {/*<PanelResizeHandle className="h-2 bg-gray-300"/>*/}
                        {/*<Panel defaultSize={20}>*/}
                        {/*    <MonacoEditor*/}
                        {/*        language={LANGUAGE_GOLANG}*/}
                        {/*        theme={darkMode ? 'vs-dark' : 'vs-light'}*/}
                        {/*        value={data}*/}
                        {/*        defaultValue={data}*/}
                        {/*        options={{}}*/}
                        {/*        onChange={onDataChange}*/}
                        {/*        onMount={(e, m) => dataEditorDidMount(e, m)}*/}
                        {/*        loading={<span className={'loading loading-spinner'}>Loading...</span>}*/}
                        {/*    />*/}
                        {/*</Panel>*/}
                    </PanelGroup>
                </Panel>
                <PanelResizeHandle className="w-2 bg-gray-300"/>
                <Panel>
                    <PanelGroup direction="vertical">
                        <Panel>
                            <div className={"overflow-auto h-full"} dangerouslySetInnerHTML={{__html: result}}/>
                        </Panel>
                    </PanelGroup>
                </Panel>
            </PanelGroup>
        </>
    );
};

const s = document.getElementById('monaco-editor');
if (s) {
    const r = createRoot(s);
    // get filename from data-filename attribute
    const fileName = s.getAttribute('data-filename');
    const func = s.getAttribute('data-function');
    const code = s.getAttribute('data-code');
    const id = s.getAttribute('data-id');
    r.render(<CodeEditor code={code} id={id} darkMode={false} fileName={fileName} func={func} vimModeEnabled={true} isServerEnvironment={false}/>);
}