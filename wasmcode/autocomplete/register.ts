import * as monaco from 'monaco-editor'
import { GoImportsCompletionProvider } from './imports/provider'

/**
 * Registers all Go autocomplete providers for Monaco editor.
 */
export const registerGoLanguageProviders = () => {
  return [
    // monaco.languages.registerCompletionItemProvider('go', new GoCompletionItemProvider(client)),
    monaco.languages.registerCompletionItemProvider('go', new GoImportsCompletionProvider()),
  ]
}
