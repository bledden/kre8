/**
 * Simple LRU Cache implementation for API responses and config files
 * Thread-safe for single-threaded Node.js environment
 */

import { CACHE_CONFIG } from '../constants/index.js';

interface CacheEntry<T> {
  value: T;
  timestamp: number;
}

export class LRUCache<K, V> {
  private cache: Map<K, CacheEntry<V>>;
  private readonly maxSize: number;
  private readonly ttlMs: number;

  /**
   * Create a new LRU cache
   * @param maxSize Maximum number of entries (default: 100)
   * @param ttlMs Time-to-live in milliseconds (default: 5 minutes)
   */
  constructor(
    maxSize = CACHE_CONFIG.DEFAULT_MAX_SIZE,
    ttlMs = CACHE_CONFIG.DEFAULT_TTL_MS
  ) {
    this.cache = new Map();
    this.maxSize = maxSize;
    this.ttlMs = ttlMs;
  }

  /**
   * Get a value from cache
   * Returns undefined if not found or expired
   */
  get(key: K): V | undefined {
    const entry = this.cache.get(key);

    if (!entry) {
      return undefined;
    }

    // Check if expired
    if (Date.now() - entry.timestamp > this.ttlMs) {
      this.cache.delete(key);
      return undefined;
    }

    // Move to end (most recently used) by reinserting
    this.cache.delete(key);
    this.cache.set(key, entry);

    return entry.value;
  }

  /**
   * Set a value in cache
   */
  set(key: K, value: V): void {
    // Delete existing entry if present (to update position)
    if (this.cache.has(key)) {
      this.cache.delete(key);
    }

    // Evict oldest entries if at capacity
    while (this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey !== undefined) {
        this.cache.delete(oldestKey);
      }
    }

    this.cache.set(key, {
      value,
      timestamp: Date.now(),
    });
  }

  /**
   * Check if key exists and is not expired
   */
  has(key: K): boolean {
    return this.get(key) !== undefined;
  }

  /**
   * Delete a specific key
   */
  delete(key: K): boolean {
    return this.cache.delete(key);
  }

  /**
   * Clear all entries
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get current cache size
   */
  get size(): number {
    return this.cache.size;
  }

  /**
   * Get cache stats for debugging/monitoring
   */
  getStats(): { size: number; maxSize: number; ttlMs: number } {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      ttlMs: this.ttlMs,
    };
  }
}

// Singleton instances for different cache types
export const configCache = new LRUCache<string, unknown>(
  CACHE_CONFIG.CONFIG_CACHE_MAX_SIZE,
  CACHE_CONFIG.CONFIG_CACHE_TTL_MS
);
export const promptCache = new LRUCache<string, string>(
  CACHE_CONFIG.PROMPT_CACHE_MAX_SIZE,
  CACHE_CONFIG.PROMPT_CACHE_TTL_MS
);
