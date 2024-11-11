import type * as monaco from 'monaco-editor'
import * as Comlink from 'comlink'
import { addDays } from 'date-fns'
import {db, keyValue, PackageIndexItem, SymbolIndexItem} from '../db'

const completionVersionKey = 'completionItems.version'

const TTL_DAYS = 7

const getExpireTime = () => addDays(new Date(), TTL_DAYS)

const isPackageQuery = (q: SuggestionQuery): q is PackageSymbolQuery => 'packageName' in q


export class WorkerHandler {
  private cachePopulated = false
  private populatePromise?: Promise<void>

  /**
   * Store keeps completions in cache.
   *
   * Using in-memory cache doesn't make sense as Monaco mutates completions after submit.
   * Completions with mutated position are no longer validated, so either each new copy should be done
   * or it's much easier to just query the DB.
   */
  private readonly db = db
  private readonly keyValue = keyValue

  /**
   * Returns whether cache was previously populated.
   */
  isWarmUp() {
    return this.cachePopulated
  }

  /**
   * Returns list of predefined builtins.
   *
   * Used to speed-up hover operations.
   */
  async getBuiltinNames() {
    await this.checkCacheReady()
    const items = await this.db.symbolIndex.where({ packageName: 'builtin' }).toArray()
    return items.map(({ label }) => label)
  }

  private buildHoverFilter(query: HoverQuery): Partial<SymbolIndexItem> {
    const isPackageMember = 'packageName' in query
    if (!isPackageMember) {
      return {
        key: `builtin.${query.value}`,
      }
    }

    const pkgPath = findPackagePathFromContext(query.context, query.packageName)
    if (pkgPath) {
      return {
        key: `${pkgPath}.${query.value}`,
      }
    }

    return {
      packageName: query.packageName,
      label: query.value,
    }
  }

  /**
   * Returns hover documentation for a symbol.
   */
  async getHoverValue(query: HoverQuery): Promise<monaco.languages.Hover | null> {
    await this.checkCacheReady()
    const filter = this.buildHoverFilter(query)
    const entry = await this.db.symbolIndex.where(filter).first()
    if (!entry) {
      return null
    }

    return {
      contents: symbolHoverDoc(entry),
      range: query.context.range,
    }
  }

  /**
   * Returns list of known importable Go packages.
   *
   * Returns value from cache if available.
   * @returns
   */
  async getImportSuggestions() {
    // TODO: provide third-party packages using go proxy index.
    return await this.getStandardPackages()
  }

  /**
   * Returns symbol or literal suggestions by prefix and package name.
   */
  async getSymbolSuggestions(query: SuggestionQuery) {
    console.log(query)
    await this.checkCacheReady()

    if (isPackageQuery(query)) {
      return await this.getMemberSuggestion(query)
    }

    return await this.getLiteralSuggestion(query)
  }

  private async getMemberSuggestion({ value, packageName, context }: PackageSymbolQuery) {
    // If package with specified name is imported - filter symbols
    // to avoid overlap with packages with eponymous name.
    const packagePath = findPackagePathFromContext(context, packageName)

    const filter: Partial<SymbolIndexItem> = packagePath
      ? {
          packagePath,
        }
      : { packageName }

    if (value) {
      filter.prefix = value.charAt(0).toLowerCase()
    }

    const symbols = await this.db.symbolIndex.where(filter).toArray()
    return symbols.map((symbol) => completionFromSymbol(symbol, context, !!packagePath))
  }

  private async getLiteralSuggestion({ value, context }: LiteralQuery) {
    const packages = await this.db.packageIndex.where('prefix').equals(value).toArray()
    const builtins = await this.db.symbolIndex.where('packagePath').equals('builtin').toArray()

    const packageCompletions = packages.map((item) => completionFromPackage(item, context))
    const symbolsCompletions = builtins.map((item) => completionFromSymbol(item, context, false))

    return packageCompletions.concat(symbolsCompletions)
  }

  private async getStandardPackages() {
    await this.checkCacheReady()

    const results = await this.db.packageIndex.toArray()
    return results.map(importCompletionFromPackage)
  }

  private async checkCacheReady() {
    if (this.cachePopulated) {
      return true
    }

    // TODO: add invalidation by Go version
    const version = await this.keyValue.getItem<string>(completionVersionKey, (entry) => {
      // v2.2.0 didn't write TTL by mistake
      return typeof entry.expireAt !== 'undefined'
    })

    if (!version) {
      await this.populateCache()
      return true
    }

    const count = await this.db.packageIndex.count()
    this.cachePopulated = count > 0
    if (!this.cachePopulated) {
      await this.populateCache()
    }
    return this.cachePopulated
  }

  private async populateCache() {
    if (!this.populatePromise) {
      // Cache population might be triggered by multiple actors outside.
      this.populatePromise = (async () => {
        const rsp = await fetch('/static/go-index.json')
        if (!rsp.ok) {
          throw new Error(`${rsp.status} ${rsp.statusText}`)
        }

        const data: GoIndexFile = await rsp.json()
        if (data.version > 1) {
          console.warn(`unsupported symbol index version: ${data.version}, skip update.`)
          return
        }

        console.log(data)
        const packages = constructPackages(data.packages)
        const symbols = constructSymbols(data.symbols)

        await Promise.all([
          this.db.packageIndex.clear(),
          this.db.symbolIndex.clear(),
          this.db.packageIndex.bulkAdd(packages),
          this.db.symbolIndex.bulkAdd(symbols),
          this.keyValue.setItem(completionVersionKey, data.go, getExpireTime()),
        ])

        this.cachePopulated = true
      })()
    }

    await this.populatePromise
  }
}

Comlink.expose(new WorkerHandler())

export enum SymbolSourceKey {
  Name = 0,
  Path = 1,
}

type SymbolSource = [name: string, path: string]

/**
 * @see internal/pkgindex/index/types.go
 */
export interface Symbols {
  names: string[]
  docs: string[]
  details: string[]
  signatures: string[]
  insertTexts: string[]
  insertTextRules: monaco.languages.CompletionItemInsertTextRule[]
  kinds: monaco.languages.CompletionItemKind[]
  packages: SymbolSource[]
}

/**
 * @see internal/pkgindex/index/types.go
 */
export interface Packages {
  names: string[]
  paths: string[]
  docs: string[]
}

/**
 * Go index file response type.
 *
 * @see internal/pkgindex/index/types.go
 */
export interface GoIndexFile {
  /**
   * File format version.
   */
  version: number

  /**
   * Go version used to generate index.
   */
  go: string

  /**
   * List of standard packages.
   */
  packages: Packages

  /**
   * List of symbols of each package.
   */
  symbols: Symbols
}

export enum ImportClauseType {
  /**
   * There is no any import block.
   */
  None,

  /**
   * Single line import.
   */
  Single,

  /**
   * Multi-line import block with braces.
   */
  Block,
}

export interface ImportsContext {
  /**
   * Whether any error was detected during context build.
   */
  hasError?: boolean

  /**
   * List of import paths from all import blocks.
   */
  allPaths?: Set<string>

  /**
   * Start and end line of area containing all imports.
   *
   * This area will be monitored for changes to update document imports cache.
   */
  totalRange?: Pick<monaco.IRange, 'startLineNumber' | 'endLineNumber'>

  /**
   * Imports in a last block related to `range`.
   */
  blockPaths?: string[]

  /**
   * Type of nearest import block.
   */
  blockType: ImportClauseType

  /**
   * Position of nearest import block to insert new imports.
   *
   * If `blockType` is `ImportClauseType.None` - points to position
   * of nearest empty line after `package` clause.
   *
   * If there is no empty line after `package` clause - should point
   * to the end of clause statement + 1 extra column.
   *
   * Otherwise - should point to a full range of last `import` block.
   *
   * @see prependNewLine
   */
  range?: monaco.IRange

  /**
   * Indicates whether extra new line should be appended before `import` clause.
   *
   * Effective only when `range` is `ImportClauseType.None`.
   */
  prependNewLine?: boolean
}

export interface SuggestionContext {
  /**
   * Current edit range
   */
  range: monaco.IRange

  /**
   * Controls how auto import suggestions will be added.
   */
  imports: ImportsContext
}

export interface LiteralQuery {
  value: string
  context: SuggestionContext
}

export interface PackageSymbolQuery {
  packageName: string
  value?: string
  context: SuggestionContext
}

export type SuggestionQuery = LiteralQuery | PackageSymbolQuery

export type HoverQuery = LiteralQuery | Required<PackageSymbolQuery>


type CompletionItem = monaco.languages.CompletionItem

const getPrefix = (str: string) => str[0]?.toLowerCase() ?? ''

// Although monaco doesn't require actual range, it's defined as required in TS types.
// This is a stub value to satisfy type checks.
const stubRange = undefined as any as monaco.IRange

const packageCompletionKind = 8

const discardIfEmpty = (str: string, defaults?: string | undefined) => (str.length ? str : defaults)

const stringToMarkdown = (value: string): monaco.IMarkdownString | undefined => {
  if (!value.length) {
    return undefined
  }

  return {
    value,
    isTrusted: true,
  }
}

export const constructPackages = ({ names, paths, docs }: Packages): PackageIndexItem[] =>
    names.map((name, i) => ({
      name,
      importPath: paths[i],
      prefix: getPrefix(names[i]),
      documentation: stringToMarkdown(docs[i]),
    }))

export const constructSymbols = ({
                                   names,
                                   docs,
                                   details,
                                   signatures,
                                   insertTexts,
                                   insertTextRules,
                                   kinds,
                                   packages,
                                 }: Symbols): SymbolIndexItem[] =>
    names.map((name, i) => ({
      key: `${packages[i][SymbolSourceKey.Path]}.${name}`,
      label: name,
      detail: discardIfEmpty(details[i], name),
      signature: signatures[i],
      kind: kinds[i],
      insertText: insertTexts[i],
      insertTextRules: insertTextRules[i],
      prefix: getPrefix(name),
      packageName: packages[i][SymbolSourceKey.Name],
      packagePath: packages[i][SymbolSourceKey.Path],
      documentation: stringToMarkdown(docs[i]),
    }))

export const importCompletionFromPackage = ({ importPath, name, documentation }: PackageIndexItem): CompletionItem => ({
  label: importPath,
  documentation,
  detail: name,
  insertText: importPath,
  kind: packageCompletionKind,
  range: stubRange,
})

type ISingleEditOperation = monaco.editor.ISingleEditOperation

const importPackageTextEdit = (
    importPath: string,
    { imports }: SuggestionContext,
): ISingleEditOperation[] | undefined => {
  if (!imports.range || imports.allPaths?.has(importPath)) {
    return undefined
  }

  switch (imports.blockType) {
    case ImportClauseType.None: {
      const text = `import "${importPath}"\n`
      return [
        {
          text: imports.prependNewLine ? `\n${text}` : text,
          range: imports.range,
          forceMoveMarkers: true,
        },
      ]
    }
    case ImportClauseType.Single:
    case ImportClauseType.Block: {
      const importLines = (imports.blockPaths ?? [])
          .concat(importPath)
          .sort()
          .map((v) => `\t"${v}"`)
          .join('\n')

      return [
        {
          text: `import (\n${importLines}\n)`,
          range: imports.range,
          forceMoveMarkers: true,
        },
      ]
    }
  }
}

export const completionFromPackage = (
    { importPath, name, documentation }: PackageIndexItem,
    ctx: SuggestionContext,
): CompletionItem => ({
  label: name,
  documentation,
  detail: importPath,
  insertText: name,
  kind: packageCompletionKind,
  range: ctx.range,
  additionalTextEdits: importPackageTextEdit(importPath, ctx),
})

export const completionFromSymbol = (
    { packagePath, ...completionItem }: SymbolIndexItem,
    ctx: SuggestionContext,
    textEdits: boolean,
): CompletionItem => ({
  ...completionItem,
  range: ctx.range,
  additionalTextEdits: textEdits ? importPackageTextEdit(packagePath, ctx) : undefined,
})

const pkgNameFromPath = (importPath: string) => {
  const slashPos = importPath.lastIndexOf('/')
  return slashPos === -1 ? importPath : importPath.slice(slashPos + 1)
}

/**
 * Attempts to find first import path that matches package name.
 */
export const findPackagePathFromContext = ({ imports }: SuggestionContext, pkgName: string): string | undefined => {
  if (!imports.allPaths) {
    return undefined
  }

  if (imports.allPaths.has(pkgName)) {
    return pkgName
  }

  for (const importPath of imports.allPaths.keys()) {
    // TODO: support named imports
    if (pkgName === pkgNameFromPath(importPath)) {
      return importPath
    }
  }
}

const goDocDomain = 'pkg.go.dev'
export const symbolHoverDoc = ({
                                 label,
                                 packageName,
                                 packagePath,
                                 signature,
                                 documentation,
                               }: SymbolIndexItem): monaco.IMarkdownString[] => {
  const doc: monaco.IMarkdownString[] = []

  if (signature) {
    doc.push({
      value: '```go\n' + signature + '\n```',
    })
  }

  if (documentation) {
    doc.push(documentation)
  }

  const docLabel = packagePath === 'builtin' ? label : `${packageName}.${label}`
  const linkLabel = `\`${docLabel}\` on ${goDocDomain}`
  doc.push({
    value: `[${linkLabel}](https://${goDocDomain}/${packagePath}#${label})`,
    isTrusted: true,
  })

  return doc
}
