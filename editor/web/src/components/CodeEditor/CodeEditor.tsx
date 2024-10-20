import React, {createContext, useContext} from 'react'
import { Spinner } from '@fluentui/react'
import MonacoEditor, { type Monaco } from '@monaco-editor/react'
import * as monaco from 'monaco-editor'

import apiClient from '../../services/api'
import { createVimModeAdapter, type StatusBarAdapter, type VimModeKeymap } from '../StatusBar/vim/editor'
import { Analyzer } from '../../services/analyzer'
import { type MonacoSettings, TargetType } from '../../services/config'
import {
  connect,
  newMarkerAction,
  newMonacoParamsChangeDispatcher,
  runFileDispatcher,
  type StateDispatch,
} from '../../store'
import { type WorkspaceState, dispatchFormatFile, dispatchResetWorkspace, dispatchUpdateFile } from '../../store/workspace'
import { getTimeNowUsageMarkers, asyncDebounce, debounce } from './utils'
import { attachCustomCommands } from './commands'
import { LANGUAGE_GOLANG, stateToOptions } from './props'
import { configureMonacoLoader } from './loader'
import { registerGoLanguageProviders } from './autocomplete'
import type { VimState } from '../../store/vim/state'
import {LeapMonacoBinding} from "../../../../../code/LeapMonacoBinding";
import {RemoteCursorManager} from "../collab";

const ANALYZE_DEBOUNCE_TIME = 500

// ask monaco-editor/react to use our own Monaco instance.
configureMonacoLoader()

const mapWorkspaceProps = ({ files, selectedFile }: WorkspaceState) => {
  if (!selectedFile) {
    return {
      code: '',
      fileName: '',
    }
  }

  return {
    code: files?.[selectedFile],
    fileName: selectedFile,
  }
}

interface CodeEditorState {
  code?: string
  loading?: boolean
}

interface Props extends CodeEditorState {
  fileName: string
  darkMode: boolean
  vimModeEnabled: boolean
  isServerEnvironment: boolean
  options: MonacoSettings
  vim?: VimState | null
  dispatch: StateDispatch
}

function makeid(length) {
  let result = '';
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const charactersLength = characters.length;
  let counter = 0;
  while (counter < length) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
    counter += 1;
  }
  return result;
}

export let editor: monaco.editor.IStandaloneCodeEditor | undefined = undefined;

class CodeEditor extends React.Component<Props> {
  private analyzer?: Analyzer
  private editorInstance?: monaco.editor.IStandaloneCodeEditor
  private vimAdapter?: VimModeKeymap
  private vimCommandAdapter?: StatusBarAdapter
  private monaco?: Monaco
  private disposables?: monaco.IDisposable[]
  private cursors?: RemoteCursorManager = undefined;
  private id: string = makeid(5);

  private readonly debouncedAnalyzeFunc = asyncDebounce(async (fileName: string, code: string) => {
    return await this.doAnalyze(fileName, code)
  }, ANALYZE_DEBOUNCE_TIME)

  private readonly persistFontSize = debounce((fontSize: number) => {
    this.props.dispatch(
      newMonacoParamsChangeDispatcher({
        fontSize,
      }),
    )
  }, 1000)

  editorDidMount(editorInstance: monaco.editor.IStandaloneCodeEditor, monacoInstance: Monaco) {
    this.disposables = registerGoLanguageProviders(apiClient, this.props.dispatch)
    this.editorInstance = editorInstance
    editor = editorInstance;
    this.monaco = monacoInstance
    const cursors = new RemoteCursorManager({
        editor: editorInstance,
        tooltips: true,
        tooltipDuration: 2,
    });

    var client = new leap_client();

    editorInstance.onKeyDown((e) => this.onKeyDown(e))
    editorInstance.onDidChangeCursorPosition((e) => {
      const { position } = e
      console.log(`Cursor position: ${position.lineNumber}:${position.column}`)

      client.send_global_metadata({
        type: "cursor_update",
        body: {
          position: position,
          document: {
            id: "data/test.go",
          }
        }
      });
    });
    const [vimAdapter, statusAdapter] = createVimModeAdapter(this.props.dispatch, editorInstance)
    this.vimAdapter = vimAdapter
    this.vimCommandAdapter = statusAdapter

    client.on("error", function(body) {
      console.error(body)
    });

    client.on("disconnect", function() {
      console.log("we are disconnected and stuff");
    });

    client.on("connect", function(body) {
      console.log("we are connected and stuff", body);
      client.subscribe("data/test.go");
    });

    client.on("user", function(update) {
        console.log("user update", update);
    });

    client.on("global_metadata", function(update) {
        console.log("global_metadata update", update);

        if (update.metadata.type === "cursor_update") {
          try {
            cursors.getCursor(update.client.username)
          } catch (e) {
            cursors.addCursor(update.client.username, "red", update.client.username);
          } finally {
            cursors.setCursorPosition(update.client.username, {
              lineNumber: update.metadata.body.position.lineNumber,
              column: update.metadata.body.position.column
            });
          }
        }
    });

    new LeapMonacoBinding(client, editorInstance, "data/test.go");

    client.connect("ws://" + window.location.host + "/leaps/ws?username=" + this.id);

    // Font should be set only once during boot as when font size changes
    // by zoom and editor config object is updated - this cause infinite
    // font change calls with random values.
    if (this.props.options.fontSize) {
      editorInstance.updateOptions({
        fontSize: this.props.options.fontSize,
      })
    }

    if (this.props.vimModeEnabled) {
      console.log('Vim mode enabled')
      this.vimAdapter.attach()
    }

    if (Analyzer.supported()) {
      this.analyzer = new Analyzer()
    } else {
      console.info('Analyzer requires WebAssembly support')
    }

    const actions = [
      {
        id: 'clear',
        label: 'Reset contents',
        contextMenuGroupId: 'navigation',
        run: () => {
          this.props.dispatch(dispatchResetWorkspace)
        },
      },
      {
        id: 'run-code',
        label: 'Build And Run Code',
        contextMenuGroupId: 'navigation',
        keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter],
        run: (ed, ...args) => {
          this.props.dispatch(runFileDispatcher)
        },
      },
      {
        id: 'format-code',
        label: 'Format Code (goimports)',
        contextMenuGroupId: 'navigation',
        keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KeyF],
        run: (ed, ...args) => {
          this.props.dispatch(dispatchFormatFile())
        },
      },
      {
        id: 'cursor-position',
        label: 'Cursor Position',
        contextMenuGroupId: 'navigation',
        keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyC],
        run: (ed, ...args) => {
          const pos = ed.getPosition()
          console.log(ed.getValue())
          console.log(`Cursor position: ${pos.lineNumber}:${pos.column}`)
          apiClient.modify(ed.getValue(), { line: pos.lineNumber, col: pos.column }).then((res) => {
            ed.setValue(res.code)
          }).catch((err) => {
            console.error(err)
          })
        }
      }
    ]

    // Persist font size on zoom
    this.disposables.push(
      editorInstance.onDidChangeConfiguration((e) => {
        if (e.hasChanged(monaco.editor.EditorOption.fontSize)) {
          const newFontSize = editorInstance.getOption(monaco.editor.EditorOption.fontSize)
          this.persistFontSize(newFontSize)
        }
      }),
    )

    // Register custom actions
    actions.forEach((action) => editorInstance.addAction(action))
    attachCustomCommands(editorInstance)
    editorInstance.focus()

    const { fileName, code } = this.props
    void this.debouncedAnalyzeFunc(fileName, code)
  }

  private isFileOrEnvironmentChanged(prevProps) {
    return (
      prevProps.isServerEnvironment !== this.props.isServerEnvironment || prevProps.fileName !== this.props.fileName
    )
  }

  private applyVimModeChanges(prevProps) {
    if (prevProps?.vimModeEnabled === this.props.vimModeEnabled) {
      return
    }

    if (this.props.vimModeEnabled) {
      console.log('Vim mode enabled')
      this.vimAdapter?.attach()
      return
    }

    console.log('Vim mode disabled')
    this.vimAdapter?.dispose()
  }

  componentDidUpdate(prevProps) {
    if (this.isFileOrEnvironmentChanged(prevProps)) {
      // Update editor markers on file or environment changes
      void this.debouncedAnalyzeFunc(this.props.fileName, this.props.code)
    }

    this.applyVimModeChanges(prevProps)
  }

  componentWillUnmount() {
    this.disposables?.forEach((d) => d.dispose())
    this.analyzer?.dispose()
    this.vimAdapter?.dispose()

    if (!this.editorInstance) {
      return
    }

    // Shutdown instance to avoid dangling markers.
    this.monaco?.editor.removeAllMarkers(this.editorInstance.getId())
    this.monaco?.editor.getModels().forEach((m) => m.dispose())
    this.editorInstance.dispose()
  }

  onChange(newValue: string | undefined, _: monaco.editor.IModelContentChangedEvent) {
    if (!newValue) {
      return
    }

    this.props.dispatch(dispatchUpdateFile(this.props.fileName, newValue))
    const { fileName, code } = this.props
    void this.debouncedAnalyzeFunc(fileName, code)
  }

  private async doAnalyze(fileName: string, code: string) {
    if (!fileName.endsWith('.go')) {
      // Ignore non-go files
      return
    }

    // Code analysis contains 2 steps that run on different conditions:
    // 1. Run Go worker if it's available and check for errors
    // 2. Add warnings to `time.Now` calls if code runs on server.
    const promises = [
      this.analyzer?.getMarkers(code) ?? null,
      this.props.isServerEnvironment ? Promise.resolve(getTimeNowUsageMarkers(code, this.editorInstance!)) : null,
    ].filter((p) => !!p)

    const results = await Promise.allSettled(promises)
    const markers = results.flatMap((r) => {
      // Can't do in beautiful way due of TS strict checks.
      if (r.status === 'rejected') {
        console.error(r.reason)
        return []
      }

      return r.value ?? []
    })

    if (!this.editorInstance) return
    this.monaco?.editor.setModelMarkers(this.editorInstance.getModel()!, this.editorInstance.getId(), markers)
    this.props.dispatch(newMarkerAction(fileName, markers))
  }

  private onKeyDown(e: monaco.IKeyboardEvent) {
    const { vimModeEnabled, vim } = this.props
    if (!vimModeEnabled || !vim?.commandStarted) {
      return
    }

    this.vimCommandAdapter?.handleKeyDownEvent(e, vim?.keyBuffer)
  }

  render() {
    const options = stateToOptions(this.props.options)
    return (
      <>
        <MonacoEditor
            language={LANGUAGE_GOLANG}
            theme={this.props.darkMode ? 'vs-dark' : 'vs-light'}
            value={this.props.code}
            defaultValue={this.props.code}
            path={this.props.fileName}
            options={options}
            onChange={(newVal, e) => this.onChange(newVal, e)}
            onMount={(e, m) => this.editorDidMount(e, m)}
            loading={<Spinner key="spinner" label="Loading editor..." labelPosition="right" />}
        />
      </>
    )
  }
}

export const ConnectedCodeEditor = connect<CodeEditorState, {}>(({ workspace, ...s }) => ({
  ...mapWorkspaceProps(workspace),
  darkMode: s.settings.darkMode,
  vimModeEnabled: s.settings.enableVimMode,
  isServerEnvironment: s.runTarget.target === TargetType.Server,
  loading: s.status?.loading,
  options: s.monaco,
  vim: s.vim,
}))(CodeEditor)
