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

const CodeEditor = ({ fileName, darkMode, func, vimModeEnabled, isServerEnvironment, code: initialCode }) => {
    const [code, setCode] = useState(initialCode);
    const [data, setData] = useState(localStorage.getItem('data') || '{}');
    const [result, setResult] = useState('');
    const analyzer = useRef();
    const editorInstance = useRef();
    const vimAdapter = useRef();
    const vimCommandAdapter: MutableRefObject<StatusBarAdapter> = useRef();
    const monacoInstance = useRef();
    const disposables = useRef([]);
    const cursors = useRef();
    const id = useRef(makeid(5));
    const debouncedAnalyzeFunc = useRef(
        asyncDebounce(async (fileName, code) => await doAnalyze(fileName, code), ANALYZE_DEBOUNCE_TIME)
    );
    const client = useRef();

    useEffect(() => {
        disposables.current = registerGoLanguageProviders();

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
        editor.onDidChangeCursorPosition((e) => {
            const { position } = e;
            console.log(`Cursor position: ${position.lineNumber}:${position.column}`);
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

        const cursorsManager = new RemoteCursorManager({
            editor,
            tooltips: true,
            tooltipDuration: 2,
        });
        cursors.current = cursorsManager;

        const leapClient = new leap_client();

        editor.onKeyDown((e) => {
            if (vimModeEnabled) {
                return;
            }
            vimCommandAdapter.current?.handleKeyDownEvent(e, '');
        });
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

        const [vimAdapterInstance, statusAdapter] = createVimModeAdapter(editor);
        vimAdapter.current = vimAdapterInstance;
        vimCommandAdapter.current = statusAdapter;

        leapClient.on('error', (body) => console.error(body));
        leapClient.on('disconnect', () => console.log('we are disconnected and stuff'));
        leapClient.on('connect', (body) => {
            console.log('we are connected and stuff', body);
            leapClient.subscribe(file);
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
        });

        new LeapMonacoBinding(leapClient, editor, file);

        leapClient.connect('ws://' + window.location.host + '/leaps/ws?username=' + id.current);

        client.current = leapClient;

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
                    leapClient.close();
                }
            }
        )

        actions.forEach((action) => editor.addAction(action));
        attachCustomCommands(editor);
        editor.focus();

        debouncedAnalyzeFunc.current(fileName, code);
    };

    const runCode = async (d?: string) => {
        console.log("Running code", editorInstance.current.getValue());
        // get select value from "#function"
        // const func = document.getElementById("function").value;

        const res = await fetch('/code/', {
            method: 'POST',
            body: JSON.stringify({ code: editorInstance.current?.getValue(), func: func, data: d || data }),
            headers: {
                'Content-Type': 'application/json',
            },
        });
        setResult(await res.text());
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


    return (
        <>
            <dialog id="my_modal_1" className="modal" ref={modalRef}>
                <div className="modal-box">
                    <iframe src={"https://daisyui.com/components/"} className={"w-full h-96"}></iframe>
                    <form method="dialog" className="modal-backdrop">
                        <button>close</button>
                    </form>
                </div>
            </dialog>

            <PanelGroup direction="horizontal">
                <Panel defaultSize={20}>
                    <div className={"overflow-auto h-full"} hx-get={`/wasmcode/sidebar?file=${fileName}`} hx-trigger="load"></div>
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
                    </PanelGroup>
                </Panel>
                <PanelResizeHandle className="w-2 bg-gray-300"/>
                <Panel>
                    <PanelGroup direction="vertical">
                        <Panel>
                            <div className={"overflow-auto h-full"} dangerouslySetInnerHTML={{__html: result}}/>
                        </Panel>
                        <PanelResizeHandle className="h-2 bg-gray-300"/>
                        <Panel defaultSize={20}>
                            <MonacoEditor
                                language={LANGUAGE_GOLANG}
                                theme={darkMode ? 'vs-dark' : 'vs-light'}
                                value={data}
                                defaultValue={data}
                                options={{}}
                                onChange={onDataChange}
                                onMount={(e, m) => dataEditorDidMount(e, m)}
                                loading={<span className={'loading loading-spinner'}>Loading...</span>}
                            />
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
    r.render(<CodeEditor darkMode={false} fileName={fileName} func={func} vimModeEnabled={true} isServerEnvironment={false}/>);
}