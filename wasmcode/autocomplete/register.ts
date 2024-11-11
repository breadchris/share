import * as monaco from 'monaco-editor'

import { GoSymbolsCompletionItemProvider } from './symbols/provider'
import { GoImportsCompletionProvider } from './imports/provider'
import { GoHoverProvider } from './hover/provider'
import type { StateDispatch } from '../state'
import type { DocumentMetadataCache } from './cache'
import type { LanguageWorker } from '../language/client'

export enum LanguageID {
  Go = 'go',
  GoMod = 'go.mod',
  GoSum = 'go.sum',
}

/**
 * Registers all Go autocomplete providers for Monaco editor.
 */
export const registerGoLanguageProviders = (
  dispatcher: StateDispatch,
  cache: DocumentMetadataCache,
  langWorker: LanguageWorker,
) => {
  return [
    monaco.languages.registerCompletionItemProvider(
      LanguageID.Go,
      new GoSymbolsCompletionItemProvider(dispatcher, cache, langWorker),
    ),
    monaco.languages.registerCompletionItemProvider(
      LanguageID.Go,
      new GoImportsCompletionProvider(dispatcher, cache, langWorker),
    ),
    monaco.languages.registerHoverProvider(LanguageID.Go, new GoHoverProvider(langWorker, cache)),
  ]
}
