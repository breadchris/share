import Dexie, { type Table } from 'dexie'

/**
 * IndexedDB-based cache implementation.
 */
export class DatabaseStorage extends Dexie {
  keyValue!: Table<CacheEntry, string>
  packageIndex!: Table<PackageIndexItem, string>
  symbolIndex!: Table<SymbolIndexItem, string>

  constructor() {
    super('CacheStore')

    this.version(2).stores({
      keyValue: 'key',
      packageIndex: 'importPath, prefix, name',
      symbolIndex: `
        key,
        packagePath,
        [packageName+prefix],
        [packageName+label],
        [packagePath+prefix]`,
    })
  }
}

export interface CacheEntry<T = any> {
  key: string
  value: T
  expireAt?: Date
}

/**
 * Abstract cache implementation
 */
export interface CacheStorage {
  /**
   * Return an item by key.
   *
   * Returns nothing if TTL is expired.
   */
  getItem: <T>(key: string) => Promise<T | undefined>

  /**
   * Remove an item by key.
   *
   * Returns whether deletion affected any record.
   */
  deleteItem: (key: string) => Promise<boolean>

  /**
   * Store an item
   * @param key Item key
   * @param value Value
   * @param expireAt Key expiration date.
   */
  setItem: <T>(key: string, value: T, expireAt?: Date) => Promise<void>

  /**
   * Truncate storage.
   */
  flush: () => Promise<void>
}

import type * as monaco from 'monaco-editor'

export type CompletionItem = monaco.languages.CompletionItem
export type CompletionItems = monaco.languages.CompletionItem[]

/**
 * Normalized version of CompletionItem that contains fixed types instead of union (e.g. Foo | Bar)
 */
export interface NormalizedCompletionItem extends Omit<monaco.languages.CompletionItem, 'label' | 'range'> {
  label: string
  documentation?: monaco.IMarkdownString
}

/**
 * Represents record from package index.
 */
export interface PackageIndexItem {
  /**
   * Full import path.
   */
  importPath: string

  /**
   * Package name.
   */
  name: string

  /**
   * Prefix for search by first letter supplied by Monaco.
   */
  prefix: string

  /**
   * Inherited from CompletionItem.
   */
  documentation?: monaco.IMarkdownString
}

/**
 * Represents record from symbol index.
 */
export interface SymbolIndexItem extends NormalizedCompletionItem {
  /**
   * Key is compound pair of package name and symbol name.
   *
   * E.g. `syscall/js.Value`
   */
  key: string

  /**
   * Prefix for search by first letter supplied by Monaco.
   */
  prefix: string

  /**
   * Full package path to which this symbol belongs.
   */
  packagePath: string

  /**
   * Package name part of package path
   */
  packageName: string

  /**
   * Signature represents full symbol signature to show on hover.
   */
  signature: string
}

import { isAfter } from 'date-fns'

type RecordValidator<T> = (entry: CacheEntry<T>) => boolean

export class KeyValueStore implements CacheStorage {
  constructor(private readonly db: DatabaseStorage) {}

  async getItem<T>(key: string, validate?: RecordValidator<T>): Promise<T | undefined> {
    const entry = await this.db.keyValue.get(key)
    if (entry?.expireAt && isAfter(new Date(), entry.expireAt)) {
      void this.deleteItem(key)
      return undefined
    }

    if (entry && validate && !validate(entry)) {
      void this.deleteItem(key)
      return undefined
    }

    return entry?.value as T | undefined
  }

  async deleteItem(key: string) {
    const n = await this.db.keyValue.where({ key }).delete()
    return n > 0
  }

  async setItem<T>(key: string, value: T, expireAt?: Date) {
    await this.deleteItem(key)
    await this.db.keyValue.put({ key, value, expireAt })
  }

  async flush() {
    await this.db.keyValue.clear()
  }
}

export const db = new DatabaseStorage()
export const keyValue = new KeyValueStore(db)
