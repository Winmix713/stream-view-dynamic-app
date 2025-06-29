
export class MemoryManager {
  private static instance: MemoryManager;
  private cache = new Map<string, { data: any; timestamp: number; size: number }>();
  private readonly MAX_CACHE_SIZE = 50 * 1024 * 1024; // 50MB
  private readonly CACHE_TTL = 10 * 60 * 1000; // 10 minutes
  private currentCacheSize = 0;

  static getInstance(): MemoryManager {
    if (!MemoryManager.instance) {
      MemoryManager.instance = new MemoryManager();
    }
    return MemoryManager.instance;
  }

  private constructor() {}

  set(key: string, data: any): void {
    const serialized = JSON.stringify(data);
    const size = new Blob([serialized]).size;

    // Clean old entries if cache is getting full
    if (this.currentCacheSize + size > this.MAX_CACHE_SIZE) {
      this.cleanup();
    }

    // Remove existing entry if updating
    if (this.cache.has(key)) {
      const existing = this.cache.get(key)!;
      this.currentCacheSize -= existing.size;
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      size
    });
    this.currentCacheSize += size;
  }

  /**
   * Store data in cache (alias for set method)
   */
  async store(key: string, data: any): Promise<void> {
    this.set(key, data);
  }

  get(key: string): any | null {
    const cached = this.cache.get(key);
    if (!cached) return null;

    // Check if expired
    if (Date.now() - cached.timestamp > this.CACHE_TTL) {
      this.cache.delete(key);
      this.currentCacheSize -= cached.size;
      return null;
    }

    return cached.data;
  }

  private cleanup(): void {
    const entries = Array.from(this.cache.entries());
    entries.sort((a, b) => a[1].timestamp - b[1].timestamp);

    // Remove oldest 25% of entries
    const toRemove = Math.ceil(entries.length * 0.25);
    for (let i = 0; i < toRemove; i++) {
      const [key, value] = entries[i];
      this.cache.delete(key);
      this.currentCacheSize -= value.size;
    }
  }

  clear(): void {
    this.cache.clear();
    this.currentCacheSize = 0;
  }

  getStats(): { size: number; entries: number; maxSize: number } {
    return {
      size: this.currentCacheSize,
      entries: this.cache.size,
      maxSize: this.MAX_CACHE_SIZE
    };
  }
}

export const memoryManager = MemoryManager.getInstance();
