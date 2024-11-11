import * as monaco from 'monaco-editor'
import { GoImportsCompletionProvider } from './imports/provider'
import {GoCompletionItemProvider} from "./symbols/provider";
import {LanguageWorker} from "../language/client";

/**
 * Registers all Go autocomplete providers for Monaco editor.
 */
export const registerGoLanguageProviders = (client: LanguageWorker) => {
  return [
    monaco.languages.registerCompletionItemProvider('go', new GoCompletionItemProvider(client)),
    monaco.languages.registerCompletionItemProvider('go', new GoImportsCompletionProvider()),
  ]
}
