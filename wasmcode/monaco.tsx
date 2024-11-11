import React, {useEffect, useState, useRef, MutableRefObject} from 'react';
import MonacoEditor, { type Monaco, loader } from '@monaco-editor/react';
import { createRoot } from 'react-dom/client';
import {createVimModeAdapter, StatusBarAdapter} from './vim';
import { getTimeNowUsageMarkers, asyncDebounce } from './utils';
import { attachCustomCommands } from './commands';
import { registerGoLanguageProviders } from './autocomplete/register';
import { LeapMonacoBinding } from './LeapMonacoBinding';
import {RemoteCursorManager, RemoteSelectionManager} from './collab';
import * as monaco from 'monaco-editor';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import {GoSyntaxChecker} from "./checker";
import {ParseResponse} from "./analyzer/bootstrap";
import {spawnLanguageWorker} from "./language/client";
import {DocumentMetadataCache} from "./autocomplete/cache";

function listenEvent(eventName, callback) {
    document.addEventListener(eventName, (event) => {
        callback(event.detail);
    });
}


let loaderConfigured = false;
export const configureMonacoLoader = () => {
    if (loaderConfigured) {
        return;
    }

    loader.config({ monaco });
    loaderConfigured = true;
};

// TODO breadchris should be dist
const nodeModules = '/static/node_modules/monaco-editor/esm/vs/';
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

interface State {
    code: string;
    result: string;
    parse: ParseResponse;
    selectedFunction: string;
}

const metadataCache = new DocumentMetadataCache();

export const CodeEditor = ({ props }) => {
    const {onChange, collab, serverURL, id, fileName, darkMode, func, vimModeEnabled, isServerEnvironment, code: initialCode} = props;

    const syntaxChecker = useRef<GoSyntaxChecker>(null);
    const [code, setCode] = useState(initialCode);
    const [data, setData] = useState(localStorage.getItem('data') || '{}');
    const [result, setResult] = useState('');
    const [state, setState] = useState<State>({
        code: '',
        result: '',
        parse: {
            error: '',
            functions: [],
        },
        selectedFunction: '',
    });
    const analyzer = useRef();
    const editorInstance = useRef<monaco.editor.IStandaloneCodeEditor>();
    const vimAdapter = useRef();
    const vimCommandAdapter: MutableRefObject<StatusBarAdapter> = useRef();
    const monacoInstance = useRef();
    const disposables = useRef([]);
    const cursors = useRef();
    const selection = useRef();
    const debouncedAnalyzeFunc = useRef(
        asyncDebounce(async (fileName, code) => await doAnalyze(fileName, code), ANALYZE_DEBOUNCE_TIME)
    );
    const client = useRef();
    const [connected, setConnected] = useState(false);

    useEffect(() => {
        syntaxChecker.current = new GoSyntaxChecker();
        const [langWorker, workerDisposer] = spawnLanguageWorker()
        disposables.current = registerGoLanguageProviders((a: any) => {
            console.log(a);
        }, metadataCache, langWorker);

        return () => {
            disposables.current.forEach((d) => d.dispose());
            analyzer.current?.dispose();
            vimAdapter.current?.dispose();
            workerDisposer.dispose();
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
        // if (vimModeEnabled) {
        //     editor.onKeyDown((e) => {
        //         vimCommandAdapter.current?.handleKeyDownEvent(e, '');
        //     });
        // }

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

        (async () => {
            await runCode()
        })();

        listenEvent('example', (data) => {
            editor.setValue(document.getElementById(data.id).textContent);
        });

        if (collab) {
            const cursorsManager = new RemoteCursorManager({
                editor,
                tooltips: true,
                tooltipDuration: 2,
            });
            cursors.current = cursorsManager;

            const selectionManager = new RemoteSelectionManager({
                editor,
            })
            selection.current = selectionManager;
            const leapClient = new leap_client();
            leapClient.on('error', (body) => console.error(body));
            leapClient.on('disconnect', () => {
                console.log('we are disconnected and stuff')
                // TODO breadchris add reconnect logic
                setConnected(false);
            });
            leapClient.on('connect', (body) => {
                console.log('we are connected and stuff', body);
                leapClient.subscribe(file);
                setConnected(true);
            });
            leapClient.on('user', (update) => console.log('user update', update));
            leapClient.on('global_metadata', (update) => {
                console.log('global_metadata update', update);

                if (update.metadata.type === 'cursor_update') {
                    try {
                        cursorsManager.getCursor(update.client.username);
                    } catch (e) {
                        cursorsManager.addCursor(update.client.username, 'red', update.client.username);
                    } finally {
                        cursorsManager.setCursorPosition(update.client.username, {
                            lineNumber: update.metadata.body.position.lineNumber,
                            column: update.metadata.body.position.column,
                        });
                    }
                }

                if (update.metadata.type === 'selection_update') {
                    console.log('selection_update', update);
                    // try {
                    //     // cursorsManager.getCursor(update.client.username);
                    //     selectionManager.setSelectionOffsets(update.client.username, );
                    // } catch (e) {
                    //     cursorsManager.addCursor(update.client.username, 'red', update.client.username);
                    // } finally {
                    //     cursorsManager.setCursorPosition(update.client.username, {
                    //         lineNumber: update.metadata.body.position.lineNumber,
                    //         column: update.metadata.body.position.column,
                    //     });
                    // }
                    // const start = {
                    //     lineNumber: update.metadata.body.selection.startLineNumber,
                    //     column: update.metadata.body.selection.startColumn,
                    // };
                    //
                    // const end = {
                    //     lineNumber: update.metadata.body.selection.endLineNumber,
                    //     column: update.metadata.body.selection.endColumn,
                    // };
                    //
                    // console.log('Setting selection', start, end);
                    // selectionManager.setSelectionPositions(update.client.username || '1', start, end);
                }
            });

            new LeapMonacoBinding(leapClient, editor, file);

            leapClient.connect('ws://' + window.location.host + '/leaps/ws?username=' + id.current);

            client.current = leapClient;

            editor.onDidChangeCursorSelection((e) => {
                const { selection } = e;

                leapClient.send_global_metadata({
                    type: 'selection_update',
                    body: {
                        selection,
                        document: {
                            id: file,
                        },
                    },
                });
            })

            editor.onDidChangeCursorPosition((e) => {
                const { position } = e;
                console.log(`Cursor position: ${position.lineNumber}:${position.column}`);

                leapClient.send_global_metadata({
                    type: 'cursor_update',
                    body: {
                        position,
                        document: {
                            id: file,
                        },
                    },
                });
            });

            disposables.current.push(
                {
                    dispose: () => {
                        leapClient.close();
                    }
                }
            )
        }
        // if (vimModeEnabled) {
        //     editor.onKeyDown((e) => {
        //         vimCommandAdapter.current?.handleKeyDownEvent(e, '');
        //     });
        // }

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

        actions.forEach((action) => editor.addAction(action));
        attachCustomCommands(editor);
        editor.focus();

        debouncedAnalyzeFunc.current(fileName, code);
    };

    const runCode = async (d?: string) => {
        if (syntaxChecker.current && editorInstance.current) {
            const r = await syntaxChecker.current.parseCode(editorInstance.current.getValue());
            console.log(r)
            setState((state) => ({ ...state, parse: r }));
            if (r.error) {
                console.error(r.error);
                return;
            }

            const f = state.selectedFunction || (state.parse?.functions[0] || '');
            if (!f) {
                setResult('No function to run');
                return;
            }

            const res = await syntaxChecker.current.runCode({
                func: f,
                code: editorInstance.current.getValue()
            });
            if (res.error) {
                setResult(res.error);
                return;
            }
            setResult(res.output);
        }
    };

    useEffect(() => {
        runCode();
    }, [state.selectedFunction]);

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

    const onCodeChange = (newVal, e) => {
        localStorage.setItem('data', newVal);
        if (syntaxChecker.current && editorInstance.current) {
            syntaxChecker.current.requestModelMarkers(editorInstance.current.getModel(), editorInstance.current, {});
        }
        setCode(newVal);
        runCode();
        if (onChange) {
            onChange(newVal);
        }
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

            <PanelGroup direction="vertical">
                <Panel>
                    <PanelGroup direction="horizontal">
                        <Panel defaultSize={20}>
                            {/*{connected ? <div className={"bg-green-500 text-white p-2"}>Connected</div> : <div className={"bg-red-500 text-white p-2"}>Disconnected</div>}*/}
                            {state.parse && (
                                <>
                                    {state.parse.error && <div className={"bg-red-500 text-white p-2"}>{state.parse.error}</div>}
                                    <ul>
                                        {state.parse.functions?.map((f) => (
                                            <li key={f} className={"bg-blue-500 text-white p-2"} onClick={() => {
                                                setState((state) => ({ ...state, selectedFunction: f }));
                                            }}>{f}</li>
                                        ))}
                                    </ul>
                                </>
                            )}
                        </Panel>
                        <PanelResizeHandle className="w-2 bg-gray-300"/>
                        <Panel>
                            <MonacoEditor
                                language={LANGUAGE_GOLANG}
                                theme={darkMode ? 'vs-dark' : 'vs-light'}
                                value={code}
                                defaultValue={code}
                                path={fileName}
                                options={{}}
                                onChange={onCodeChange}
                                onMount={(e, m) => editorDidMount(e, m, fileName)}
                                loading={<span className={'loading loading-spinner'}>Loading...</span>}
                            />
                        </Panel>

                        {/*<PanelResizeHandle className="h-2 bg-gray-300"/>*/}
                        {/*<Panel defaultSize={20}>*/}
                        {/*    <iframe className={"w-full h-full"} src={"/chat"} />*/}
                        {/*</Panel>*/}
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

const monacoElements = document.querySelectorAll('[data-content-type="monaco"]');
console.log('loading monaco editors', monacoElements)
monacoElements.forEach(element => {
    const r = createRoot(element);

    // TODO breadchris get props from data
    const code = element.getAttribute('data-data');
    const props = {
        serverURL: "http://localhost:8080",
        id: "1",
        fileName: "main.go",
        darkMode: true,
        func: "main.Render",
        vimModeEnabled: false,
        code: code,
    }
    console.log("loading monaco editor", props);
    r.render(<CodeEditor props={props} />);
});

const s = document.getElementById('monaco-editor');
if (s) {
    const r = createRoot(s);

    // TODO breadchris get props from data
    let props = JSON.parse(s.getAttribute('data-props'));
    props = {
        ...props,
        darkMode: false,
        vimModeEnabled: true,
        isServerEnvironment: false,
    }
    console.log("loading monaco editor", props);
    r.render(<CodeEditor props={props} />);
}
