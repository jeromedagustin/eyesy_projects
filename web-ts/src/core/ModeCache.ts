/**
 * Mode Cache - Caches mode assets (images, fonts, etc.) in IndexedDB
 * Improves load times and prepares for cloud-based mode distribution
 */

const DB_NAME = 'eyesy-mode-cache';
const DB_VERSION = 1;
const STORE_IMAGES = 'images';
const STORE_ASSETS = 'assets';
const STORE_METADATA = 'metadata';

export interface CachedImage {
  url: string;
  blob: Blob;
  width: number;
  height: number;
  timestamp: number;
  version: string;
}

export interface CachedAsset {
  url: string;
  blob: Blob;
  type: 'image' | 'font' | 'data' | 'other';
  timestamp: number;
  version: string;
}

export interface ModeMetadata {
  modeId: string;
  version: string;
  assets: string[]; // URLs of assets for this mode
  timestamp: number;
}

export class ModeCache {
  private db: IDBDatabase | null = null;
  private cacheVersion = '1.0.0'; // Increment to invalidate old cache

  /**
   * Initialize IndexedDB for mode caching
   */
  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        console.error('Failed to open ModeCache IndexedDB:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create object stores if they don't exist
        if (!db.objectStoreNames.contains(STORE_IMAGES)) {
          const imageStore = db.createObjectStore(STORE_IMAGES, { keyPath: 'url' });
          imageStore.createIndex('timestamp', 'timestamp', { unique: false });
          imageStore.createIndex('version', 'version', { unique: false });
        }

        if (!db.objectStoreNames.contains(STORE_ASSETS)) {
          const assetStore = db.createObjectStore(STORE_ASSETS, { keyPath: 'url' });
          assetStore.createIndex('timestamp', 'timestamp', { unique: false });
          assetStore.createIndex('version', 'version', { unique: false });
          assetStore.createIndex('type', 'type', { unique: false });
        }

        if (!db.objectStoreNames.contains(STORE_METADATA)) {
          const metadataStore = db.createObjectStore(STORE_METADATA, { keyPath: 'modeId' });
          metadataStore.createIndex('version', 'version', { unique: false });
          metadataStore.createIndex('timestamp', 'timestamp', { unique: false });
        }
      };
    });
  }

  /**
   * Cache an image
   */
  async cacheImage(url: string, blob: Blob, width: number, height: number): Promise<void> {
    if (!this.db) {
      await this.init();
    }

    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      const transaction = this.db.transaction([STORE_IMAGES], 'readwrite');
      const store = transaction.objectStore(STORE_IMAGES);

      const cachedImage: CachedImage = {
        url,
        blob,
        width,
        height,
        timestamp: Date.now(),
        version: this.cacheVersion,
      };

      const request = store.put(cachedImage);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Get a cached image
   */
  async getCachedImage(url: string): Promise<CachedImage | null> {
    if (!this.db) {
      await this.init();
    }

    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      const transaction = this.db.transaction([STORE_IMAGES], 'readonly');
      const store = transaction.objectStore(STORE_IMAGES);
      const request = store.get(url);

      request.onsuccess = () => {
        const cached = request.result as CachedImage | undefined;
        if (cached && cached.version === this.cacheVersion) {
          resolve(cached);
        } else {
          // Version mismatch or not found
          resolve(null);
        }
      };

      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Cache a generic asset (font, data file, etc.)
   */
  async cacheAsset(url: string, blob: Blob, type: CachedAsset['type']): Promise<void> {
    if (!this.db) {
      await this.init();
    }

    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      const transaction = this.db.transaction([STORE_ASSETS], 'readwrite');
      const store = transaction.objectStore(STORE_ASSETS);

      const cachedAsset: CachedAsset = {
        url,
        blob,
        type,
        timestamp: Date.now(),
        version: this.cacheVersion,
      };

      const request = store.put(cachedAsset);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Get a cached asset
   */
  async getCachedAsset(url: string): Promise<CachedAsset | null> {
    if (!this.db) {
      await this.init();
    }

    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      const transaction = this.db.transaction([STORE_ASSETS], 'readonly');
      const store = transaction.objectStore(STORE_ASSETS);
      const request = store.get(url);

      request.onsuccess = () => {
        const cached = request.result as CachedAsset | undefined;
        if (cached && cached.version === this.cacheVersion) {
          resolve(cached);
        } else {
          resolve(null);
        }
      };

      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Cache mode metadata
   */
  async cacheModeMetadata(modeId: string, assets: string[]): Promise<void> {
    if (!this.db) {
      await this.init();
    }

    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      const transaction = this.db.transaction([STORE_METADATA], 'readwrite');
      const store = transaction.objectStore(STORE_METADATA);

      const metadata: ModeMetadata = {
        modeId,
        version: this.cacheVersion,
        assets,
        timestamp: Date.now(),
      };

      const request = store.put(metadata);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Get cached mode metadata
   */
  async getModeMetadata(modeId: string): Promise<ModeMetadata | null> {
    if (!this.db) {
      await this.init();
    }

    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      const transaction = this.db.transaction([STORE_METADATA], 'readonly');
      const store = transaction.objectStore(STORE_METADATA);
      const request = store.get(modeId);

      request.onsuccess = () => {
        const metadata = request.result as ModeMetadata | undefined;
        if (metadata && metadata.version === this.cacheVersion) {
          resolve(metadata);
        } else {
          resolve(null);
        }
      };

      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Clear all cached data for a specific mode
   */
  async clearModeCache(modeId: string): Promise<void> {
    if (!this.db) {
      await this.init();
    }

    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      // Get mode metadata to find all assets
      this.getModeMetadata(modeId).then((metadata) => {
        if (!metadata) {
          resolve();
          return;
        }

        const transaction = this.db!.transaction([STORE_IMAGES, STORE_ASSETS, STORE_METADATA], 'readwrite');
        
        // Delete all images and assets for this mode
        const imageStore = transaction.objectStore(STORE_IMAGES);
        const assetStore = transaction.objectStore(STORE_ASSETS);
        const metadataStore = transaction.objectStore(STORE_METADATA);

        // Delete each asset
        const deletePromises = metadata.assets.map((url) => {
          return new Promise<void>((resolveDelete) => {
            imageStore.delete(url).onsuccess = () => resolveDelete();
            assetStore.delete(url).onsuccess = () => resolveDelete();
            resolveDelete(); // Continue even if not found
          });
        });

        Promise.all(deletePromises).then(() => {
          // Delete metadata
          metadataStore.delete(modeId).onsuccess = () => resolve();
          metadataStore.onerror = () => reject(transaction.error);
        });
      }).catch(reject);
    });
  }

  /**
   * Clear all cached data (useful for cache invalidation)
   */
  async clearAllCache(): Promise<void> {
    if (!this.db) {
      await this.init();
    }

    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      const transaction = this.db.transaction([STORE_IMAGES, STORE_ASSETS, STORE_METADATA], 'readwrite');
      
      transaction.objectStore(STORE_IMAGES).clear();
      transaction.objectStore(STORE_ASSETS).clear();
      transaction.objectStore(STORE_METADATA).clear();

      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  }

  /**
   * Get cache size estimate (approximate)
   */
  async getCacheSize(): Promise<number> {
    if (!this.db) {
      await this.init();
    }

    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      let totalSize = 0;

      const transaction = this.db.transaction([STORE_IMAGES, STORE_ASSETS], 'readonly');
      const imageStore = transaction.objectStore(STORE_IMAGES);
      const assetStore = transaction.objectStore(STORE_ASSETS);

      let completed = 0;
      const checkComplete = () => {
        completed++;
        if (completed === 2) {
          resolve(totalSize);
        }
      };

      // Count image sizes
      imageStore.openCursor().onsuccess = (event) => {
        const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
        if (cursor) {
          const cached = cursor.value as CachedImage;
          totalSize += cached.blob.size;
          cursor.continue();
        } else {
          checkComplete();
        }
      };

      // Count asset sizes
      assetStore.openCursor().onsuccess = (event) => {
        const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
        if (cursor) {
          const cached = cursor.value as CachedAsset;
          totalSize += cached.blob.size;
          cursor.continue();
        } else {
          checkComplete();
        }
      };
    });
  }

  /**
   * Set cache version (for invalidation)
   */
  setVersion(version: string): void {
    this.cacheVersion = version;
  }

  /**
   * Get current cache version
   */
  getVersion(): string {
    return this.cacheVersion;
  }
}

