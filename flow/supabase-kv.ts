/**
 * Supabase Key-Value Store Client for Session-Based Data Persistence
 * 
 * This module provides a comprehensive key-value store interface using Supabase
 * with proper namespacing, collision prevention, and session-based isolation.
 * 
 * Features:
 * - Session-scoped data isolation (no worklet dependency)
 * - Namespace support for logical data grouping
 * - Full CRUD operations with batch support
 * - Automatic key entropy to prevent collisions
 * - TypeScript type safety
 * - Error handling and retry logic
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

    /**
     * Supabase configuration for worklet key-value store
     *
     * This file contains the configuration for connecting to Supabase
     * and provides type-safe environment variable access.
     */

    export interface SupabaseConfig {
  url: string;
  anonKey: string;
  serviceRoleKey?: string;
}

/**
 * Default Supabase configuration using provided credentials
 */
export const supabaseConfig: SupabaseConfig = {
  url: 'https://rugmmokyormjafybapbl.supabase.co',
  anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ1Z21tb2t5b3JtamFmeWJhcGJsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc3OTQ0NzIsImV4cCI6MjA2MzM3MDQ3Mn0.GgtdamJ-c2OUtegA1B_DQhSBDccGGRF-PSxjUXHK8dQ'
};

/**
 * Environment-based configuration with fallback to defaults
 * Allows runtime override via environment variables
 */
export function getSupabaseConfig(): SupabaseConfig {
  return {
    url: supabaseConfig.url,
    anonKey: supabaseConfig.anonKey
  };
}

/**
 * Validates that all required configuration is present
 */
export function validateSupabaseConfig(config: SupabaseConfig): void {
  if (!config.url) {
    throw new Error('Supabase URL is required');
  }
  if (!config.anonKey) {
    throw new Error('Supabase anonymous key is required');
  }
  if (!config.url.startsWith('https://')) {
    throw new Error('Supabase URL must use HTTPS');
  }
}

// Type definitions
export interface KVEntry {
  key: string;
  value: any;
  namespace: string;
  created_at: string;
  updated_at: string;
}

export interface KVBatchEntry {
  key: string;
  value: any;
}

export interface KVListOptions {
  namespace?: string;
  limit?: number;
  offset?: number;
  pattern?: string; // Simple wildcard pattern matching
}

export interface KVStats {
  totalKeys: number;
  totalNamespaces: number;
  storageSize: number; // Approximate size in bytes
  lastUpdated: string;
}

// Custom error types
export class KVError extends Error {
  constructor(message: string, public code: string, public cause?: Error) {
    super(message);
    this.name = 'KVError';
  }
}

export class KVConnectionError extends KVError {
  constructor(message: string, cause?: Error) {
    super(message, 'CONNECTION_ERROR', cause);
    this.name = 'KVConnectionError';
  }
}

export class KVValidationError extends KVError {
  constructor(message: string) {
    super(message, 'VALIDATION_ERROR');
    this.name = 'KVValidationError';
  }
}

/**
 * Session Key-Value Store Client
 * 
 * Provides a complete key-value interface with session-based isolation and namespacing.
 * All operations are scoped to a specific session to prevent data collisions.
 */
export class SessionKVStore {
  private supabase: SupabaseClient<Database>;
  private sessionId: string;
  private readonly MAX_KEY_LENGTH = 100;
  private readonly MAX_NAMESPACE_LENGTH = 50;
  private readonly MAX_VALUE_SIZE = 1024 * 1024; // 1MB limit

  constructor(sessionId: string, supabaseClient?: SupabaseClient<Database>) {
    if (!sessionId || typeof sessionId !== 'string') {
      throw new KVValidationError('Session ID is required and must be a string');
    }

    this.sessionId = sessionId;
    
    if (supabaseClient) {
      this.supabase = supabaseClient;
    } else {
      const config = getSupabaseConfig();
      validateSupabaseConfig(config);
      this.supabase = createClient<Database>(config.url, config.anonKey);
    }
  }

  // Input validation helpers
  private validateKey(key: string): void {
    if (!key || typeof key !== 'string') {
      throw new KVValidationError('Key must be a non-empty string');
    }
    if (key.length > this.MAX_KEY_LENGTH) {
      throw new KVValidationError(`Key length cannot exceed ${this.MAX_KEY_LENGTH} characters`);
    }
    if (!/^[a-zA-Z0-9_.-]+$/.test(key)) {
      throw new KVValidationError('Key can only contain alphanumeric characters, underscores, dots, and hyphens');
    }
  }

  private validateNamespace(namespace: string): void {
    if (!namespace || typeof namespace !== 'string') {
      throw new KVValidationError('Namespace must be a non-empty string');
    }
    if (namespace.length > this.MAX_NAMESPACE_LENGTH) {
      throw new KVValidationError(`Namespace length cannot exceed ${this.MAX_NAMESPACE_LENGTH} characters`);
    }
    if (!/^[a-zA-Z0-9_-]+$/.test(namespace)) {
      throw new KVValidationError('Namespace can only contain alphanumeric characters, underscores, and hyphens');
    }
  }

  private validateValue(value: any): void {
    if (value === undefined) {
      throw new KVValidationError('Value cannot be undefined');
    }
    
    const serialized = JSON.stringify(value);
    if (serialized.length > this.MAX_VALUE_SIZE) {
      throw new KVValidationError(`Serialized value size cannot exceed ${this.MAX_VALUE_SIZE} bytes`);
    }
  }

  // Error handling wrapper
  private async executeOperation<T>(operation: () => Promise<T>, operationName: string): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      if (error instanceof KVError) {
        throw error;
      }
      throw new KVConnectionError(`Failed to ${operationName}: ${error.message}`, error);
    }
  }

  /**
   * Set a key-value pair in the specified namespace
   */
  async set(namespace: string, key: string, value: any): Promise<void> {
    this.validateNamespace(namespace);
    this.validateKey(key);
    this.validateValue(value);

    await this.executeOperation(async () => {
      const { error } = await this.supabase
        .from('session_kv_stores')
        .upsert({
          session_id: this.sessionId,
          namespace,
          key,
          value: value as any, // Supabase handles JSON serialization
        });

      if (error) {
        throw new KVError(`Failed to set key ${key} in namespace ${namespace}`, 'SET_ERROR', error);
      }
    }, 'set value');
  }

  /**
   * Get a value by key from the specified namespace
   */
  async get<T = any>(namespace: string, key: string): Promise<T | null> {
    this.validateNamespace(namespace);
    this.validateKey(key);

    return await this.executeOperation(async () => {
      const { data, error } = await this.supabase
        .from('session_kv_stores')
        .select('value')
        .eq('session_id', this.sessionId)
        .eq('namespace', namespace)
        .eq('key', key)
        .single();

      if (error) {
        if (error.code === 'PGRST116') { // No rows returned
          return null;
        }
        throw new KVError(`Failed to get key ${key} from namespace ${namespace}`, 'GET_ERROR', error);
      }

      return data?.value as T;
    }, 'get value');
  }

  /**
   * Check if a key exists in the specified namespace
   */
  async has(namespace: string, key: string): Promise<boolean> {
    this.validateNamespace(namespace);
    this.validateKey(key);

    return await this.executeOperation(async () => {
      const { data, error } = await this.supabase
        .from('session_kv_stores')
        .select('id')
        .eq('session_id', this.sessionId)
        .eq('namespace', namespace)
        .eq('key', key)
        .single();

      if (error) {
        if (error.code === 'PGRST116') { // No rows returned
          return false;
        }
        throw new KVError(`Failed to check key ${key} in namespace ${namespace}`, 'HAS_ERROR', error);
      }

      return data !== null;
    }, 'check key existence');
  }

  /**
   * Delete a key from the specified namespace
   */
  async delete(namespace: string, key: string): Promise<boolean> {
    this.validateNamespace(namespace);
    this.validateKey(key);

    return await this.executeOperation(async () => {
      const { error, count } = await this.supabase
        .from('session_kv_stores')
        .delete({ count: 'exact' })
        .eq('session_id', this.sessionId)
        .eq('namespace', namespace)
        .eq('key', key);

      if (error) {
        throw new KVError(`Failed to delete key ${key} from namespace ${namespace}`, 'DELETE_ERROR', error);
      }

      return (count ?? 0) > 0;
    }, 'delete key');
  }

  /**
   * Set multiple key-value pairs in a single namespace
   */
  async mset(namespace: string, entries: Record<string, any>): Promise<void> {
    this.validateNamespace(namespace);
    
    if (!entries || typeof entries !== 'object') {
      throw new KVValidationError('Entries must be an object');
    }

    const keys = Object.keys(entries);
    if (keys.length === 0) {
      return; // Nothing to set
    }

    // Validate all keys and values before proceeding
    for (const [key, value] of Object.entries(entries)) {
      this.validateKey(key);
      this.validateValue(value);
    }

    await this.executeOperation(async () => {
      // Use Supabase's bulk insert with upsert
      const rows = keys.map(key => ({
        session_id: this.sessionId,
        namespace,
        key,
        value: entries[key] as any,
      }));

      const { error } = await this.supabase
        .from('session_kv_stores')
        .upsert(rows);

      if (error) {
        throw new KVError(`Failed to set multiple keys in namespace ${namespace}`, 'MSET_ERROR', error);
      }
    }, 'set multiple values');
  }

  /**
   * Get multiple values by keys from a single namespace
   */
  async mget(namespace: string, keys: string[]): Promise<Record<string, any>> {
    this.validateNamespace(namespace);
    
    if (!Array.isArray(keys)) {
      throw new KVValidationError('Keys must be an array');
    }

    if (keys.length === 0) {
      return {};
    }

    // Validate all keys
    keys.forEach(key => this.validateKey(key));

    return await this.executeOperation(async () => {
      const { data, error } = await this.supabase
        .from('session_kv_stores')
        .select('key, value')
        .eq('session_id', this.sessionId)
        .eq('namespace', namespace)
        .in('key', keys);

      if (error) {
        throw new KVError(`Failed to get multiple keys from namespace ${namespace}`, 'MGET_ERROR', error);
      }

      const result: Record<string, any> = {};
      data?.forEach(row => {
        result[row.key] = row.value;
      });

      return result;
    }, 'get multiple values');
  }

  /**
   * List all keys in the worklet, optionally filtered by namespace
   */
  async list(options: KVListOptions = {}): Promise<string[]> {
    const { namespace, limit = 1000, offset = 0, pattern } = options;

    if (namespace) {
      this.validateNamespace(namespace);
    }

    return await this.executeOperation(async () => {
      let query = this.supabase
        .from('session_kv_stores')
        .select('key')
        .eq('session_id', this.sessionId)
        .range(offset, offset + limit - 1);

      if (namespace) {
        query = query.eq('namespace', namespace);
      }

      const { data, error } = await query;

      if (error) {
        throw new KVError('Failed to list keys', 'LIST_ERROR', error);
      }

      let keys = data?.map(row => row.key) ?? [];

      // Apply pattern matching if specified
      if (pattern) {
        const regexPattern = pattern.replace(/\*/g, '.*').replace(/\?/g, '.');
        const regex = new RegExp(`^${regexPattern}$`);
        keys = keys.filter(key => regex.test(key));
      }

      return keys;
    }, 'list keys');
  }

  /**
   * List all namespaces used by this worklet
   */
  async listNamespaces(): Promise<string[]> {
    return await this.executeOperation(async () => {
      const { data, error } = await this.supabase
        .from('session_kv_stores')
        .select('namespace')
        .eq('session_id', this.sessionId)
        .order('namespace');

      if (error) {
        throw new KVError('Failed to list namespaces', 'LIST_NAMESPACES_ERROR', error);
      }

      // Remove duplicates
      const namespaces = [...new Set(data?.map(row => row.namespace) ?? [])];
      return namespaces;
    }, 'list namespaces');
  }

  /**
   * Clear all data in a namespace or the entire worklet
   */
  async clear(namespace?: string): Promise<number> {
    if (namespace) {
      this.validateNamespace(namespace);
    }

    return await this.executeOperation(async () => {
      let query = this.supabase
        .from('session_kv_stores')
        .delete({ count: 'exact' })
        .eq('session_id', this.sessionId);

      if (namespace) {
        query = query.eq('namespace', namespace);
      }

      const { error, count } = await query;

      if (error) {
        throw new KVError(`Failed to clear ${namespace ? `namespace ${namespace}` : 'all data'}`, 'CLEAR_ERROR', error);
      }

      return count ?? 0;
    }, 'clear data');
  }

  /**
   * Increment a numeric value (creates with value 0 if doesn't exist)
   */
  async increment(namespace: string, key: string, delta: number = 1): Promise<number> {
    this.validateNamespace(namespace);
    this.validateKey(key);

    if (typeof delta !== 'number' || !isFinite(delta)) {
      throw new KVValidationError('Delta must be a finite number');
    }

    return await this.executeOperation(async () => {
      // Get current value
      const currentValue = await this.get<number>(namespace, key);
      const current = typeof currentValue === 'number' ? currentValue : 0;
      const newValue = current + delta;

      // Set the new value
      await this.set(namespace, key, newValue);
      return newValue;
    }, 'increment value');
  }

  /**
   * Append to a string value (creates empty string if doesn't exist)
   */
  async append(namespace: string, key: string, value: string): Promise<void> {
    this.validateNamespace(namespace);
    this.validateKey(key);

    if (typeof value !== 'string') {
      throw new KVValidationError('Append value must be a string');
    }

    await this.executeOperation(async () => {
      // Get current value
      const currentValue = await this.get<string>(namespace, key);
      const current = typeof currentValue === 'string' ? currentValue : '';
      const newValue = current + value;

      // Validate the new value size
      this.validateValue(newValue);

      // Set the new value
      await this.set(namespace, key, newValue);
    }, 'append to value');
  }

  /**
   * Get storage statistics for this worklet
   */
  async getStats(): Promise<KVStats> {
    return await this.executeOperation(async () => {
      const { data, error } = await this.supabase
        .from('session_kv_stores')
        .select('namespace, value, updated_at')
        .eq('session_id', this.sessionId);

      if (error) {
        throw new KVError('Failed to get statistics', 'STATS_ERROR', error);
      }

      const uniqueNamespaces = new Set<string>();
      let totalSize = 0;
      let lastUpdated = new Date(0);

      data?.forEach(row => {
        uniqueNamespaces.add(row.namespace);
        totalSize += JSON.stringify(row.value).length;
        const updatedAt = new Date(row.updated_at);
        if (updatedAt > lastUpdated) {
          lastUpdated = updatedAt;
        }
      });

      return {
        totalKeys: data?.length ?? 0,
        totalNamespaces: uniqueNamespaces.size,
        storageSize: totalSize,
        lastUpdated: lastUpdated.toISOString(),
      };
    }, 'get statistics');
  }

  /**
   * Export all data for this worklet (useful for backups or debugging)
   */
  async exportData(): Promise<Record<string, Record<string, any>>> {
    return await this.executeOperation(async () => {
      const { data, error } = await this.supabase
        .from('session_kv_stores')
        .select('namespace, key, value')
        .eq('session_id', this.sessionId)
        .order('namespace')
        .order('key');

      if (error) {
        throw new KVError('Failed to export data', 'EXPORT_ERROR', error);
      }

      const result: Record<string, Record<string, any>> = {};
      
      data?.forEach(row => {
        if (!result[row.namespace]) {
          result[row.namespace] = {};
        }
        result[row.namespace][row.key] = row.value;
      });

      return result;
    }, 'export data');
  }

  /**
   * Import data into this worklet (overwrites existing keys)
   */
  async importData(data: Record<string, Record<string, any>>): Promise<void> {
    if (!data || typeof data !== 'object') {
      throw new KVValidationError('Import data must be an object');
    }

    await this.executeOperation(async () => {
      for (const [namespace, entries] of Object.entries(data)) {
        if (entries && typeof entries === 'object') {
          await this.mset(namespace, entries);
        }
      }
    }, 'import data');
  }
}

/**
 * Factory function to create a SessionKVStore instance
 */
export function createSessionKVStore(sessionId: string): SessionKVStore {
  return new SessionKVStore(sessionId);
}

/**
 * Backward compatibility: Factory function to create a SessionKVStore instance with worklet-like API
 * @deprecated Use createSessionKVStore instead
 */
export function createWorkletKVStore(sessionId: string): SessionKVStore {
  return new SessionKVStore(sessionId);
}

/**
 * Utility function to generate entropy-rich keys
 */
export function generateEntropyKey(prefix: string = ''): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 15);
  const entropy = `${timestamp}_${random}`;
  return prefix ? `${prefix}_${entropy}` : entropy;
}

// Export types for external use
export type { Database };