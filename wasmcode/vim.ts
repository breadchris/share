import { type editor, type IKeyboardEvent, KeyCode } from 'monaco-editor'
import { VimMode } from 'monaco-vim'
import VimModeKeymap from 'monaco-vim/lib/cm/keymap_vim'

export type Nullable<T> = T | null

// This implementation is quite hacky, but still better than
// having a huge list of all possible keys except printable.
const regularKeyRegex = /^.$/
const isPrintableKey = (key: string) => regularKeyRegex.test(key)

const registryOutputPrefix = '----------Registers----------'

interface CommandInputOpts {
  bottom?: boolean
  selectValueOnOpen?: boolean
  closeOnEnter?: boolean
  onKeyDown?: (e: KeyboardEvent, input: HTMLInputElement, closeFn: Function) => void
  onKeyUp?: (e: KeyboardEvent, input: HTMLInputElement, closeFn: Function) => void
  value: string
}

// customCommands is list of custom VIM commands that trigger
// different store actions.
const customCommands = [
  // {
  //   name: 'write',
  //   short: 'w',
  // },
  // {
  //   name: 'share',
  // },
]

class VimModeKeymapAdapter extends VimModeKeymap {
  private commandsAttached = false

  constructor(
    // "dispatch" is reserved method in inner class.
    editorInstance: editor.IStandaloneCodeEditor,
  ) {
    super(editorInstance)
  }

  attach() {
    if (!this.commandsAttached) {
      this.attachCommands()
      this.commandsAttached = true
    }

    super.attach()
  }

  private attachCommands() {
    customCommands.forEach(({ name, short, action }) => {
      VimMode.Vim.defineEx(name, short, () => {
      })
    })
  }
}

export { VimModeKeymap }

/**
 * StatusBarAdapter is monaco-vim command handler and report status bar
 * adapter which maps it to application state.
 */
export class StatusBarAdapter {
  private commandResultCallback?: Nullable<(val: string) => void>
  private currentOpts?: Nullable<CommandInputOpts>

  constructor(
    private readonly editor: editor.IStandaloneCodeEditor,
  ) {}

  /**
   * Method called on command result, usually an error.
   *
   * Library passes pre-formated styled HTML element for display.
   * @param result
   */
  showNotification(result: HTMLElement) {
    // When registry command appears, library just sends
    // the same HTML element with error red color and
    // as a result, registry prompt is unreadable and displayed as error.
    //
    // This dirty hack tries to resolve this issue at least partially.
    this.commandResultCallback = null
    const message = result.textContent!
    if (message.startsWith(registryOutputPrefix)) {
      // TODO: implement proper registries display
      return
    }

    const isError = result.style.color === 'red'
  }

  /**
   * Called by VimModeKeymap on command start
   * @param text DocumentFragment which contains info about command character
   * @param callback Callback to submit command
   * @param options Command handle arguments (unused)
   */
  setSec(text: DocumentFragment, callback: (val: string) => void, options: CommandInputOpts) {
    this.currentOpts = options
    this.commandResultCallback = callback

    // Initial character is hidden inside an array of 2 spans as content of 1 span.
    // Idk who thought that this is a good idea, but we have to deal with it.
    const commandChar = text.firstChild?.textContent
  }

  onPromptClose(value: string) {
    this.commandResultCallback?.(value.substring(1))
    this.commandResultCallback = null
  }

  /**
   * Submits input event to VIM command handler
   * @param e
   * @param currentData
   */
  handleKeyDownEvent(e: IKeyboardEvent, currentData: string = '') {
    e.preventDefault()
    e.stopPropagation()

    switch (e.keyCode) {
      case KeyCode.Enter:
        this.onPromptClose(currentData)
        return
      case KeyCode.Escape:
        break
      case KeyCode.Backspace:
        return
      default:
        break
    }

    if (isPrintableKey(e.browserEvent.key)) {
    }
  }

  private closeInput() {
    this?.editor?.focus()
    this.currentOpts = null
  }
}

/**
 * Creates a vim-mode adapter attached to state dispatcher and editor instance
 * @param dispatch State dispatch function
 * @param editorInstance Monaco editor instance
 */
export const createVimModeAdapter = (
  editorInstance: editor.IStandaloneCodeEditor,
): [VimModeKeymap, StatusBarAdapter] => {
  const vimAdapter: VimModeKeymap = new VimModeKeymapAdapter(editorInstance)
  const statusAdapter = new StatusBarAdapter(editorInstance)

  vimAdapter.setStatusBar(statusAdapter)
  vimAdapter.on('vim-mode-change', (mode: any) => {
    // console.log('vim-mode-change', mode)
  })

  vimAdapter.on('vim-keypress', (key: string) => {
    // console.log('vim-keypress', key)
  })

  vimAdapter.on('vim-command-done', () => {
    // console.log('vim-command-done')
  })

  vimAdapter.on('dispose', () => {
    console.log('dispose')
  })

  return [vimAdapter, statusAdapter]
}
