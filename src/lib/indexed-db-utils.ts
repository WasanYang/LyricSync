// src/lib/indexed-db-utils.ts
// IndexedDB utilities for appropriate use cases (not song/setlist data)

interface ActivityLog {
  id: string;
  userId: string;
  action: 'play' | 'pause' | 'skip' | 'favorite' | 'share' | 'download';
  resourceType: 'song' | 'setlist';
  resourceId: string;
  timestamp: Date;
  metadata: Record<string, any>;
}

interface OfflineQueue {
  id: string;
  action: 'create_song' | 'update_setlist' | 'sync_favorites' | 'analytics';
  payload: any;
  createdAt: Date;
  retryCount: number;
  status: 'pending' | 'processing' | 'failed';
  priority: 'low' | 'medium' | 'high';
}

interface SearchCache {
  id: string;
  query: string;
  results: any[];
  searchedAt: Date;
  frequency: number;
  type: 'song' | 'setlist' | 'user';
}

interface Draft {
  id: string;
  type: 'song' | 'setlist';
  title: string;
  content: any;
  lastSaved: Date;
  autoSaveEnabled: boolean;
  userId: string;
}

interface MediaCache {
  id: string;
  url: string;
  blob: Blob;
  cachedAt: Date;
  size: number;
  mimeType: string;
  expiresAt?: Date;
}

interface PerformanceLog {
  id: string;
  page: string;
  loadTime: number;
  renderTime: number;
  memoryUsage: number;
  timestamp: Date;
  userAgent: string;
  deviceInfo: {
    platform: string;
    isMobile: boolean;
    screenSize: string;
  };
}

class IndexedDBManager {
  private dbName = 'MyWorshipApp';
  private version = 1;
  private db: IDBDatabase | null = null;

  async initialize(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Activity Logs
        if (!db.objectStoreNames.contains('activityLogs')) {
          const activityStore = db.createObjectStore('activityLogs', {
            keyPath: 'id',
          });
          activityStore.createIndex('userId', 'userId', { unique: false });
          activityStore.createIndex('timestamp', 'timestamp', {
            unique: false,
          });
          activityStore.createIndex('action', 'action', { unique: false });
        }

        // Offline Queue
        if (!db.objectStoreNames.contains('offlineQueue')) {
          const queueStore = db.createObjectStore('offlineQueue', {
            keyPath: 'id',
          });
          queueStore.createIndex('status', 'status', { unique: false });
          queueStore.createIndex('priority', 'priority', { unique: false });
          queueStore.createIndex('createdAt', 'createdAt', { unique: false });
        }

        // Search Cache
        if (!db.objectStoreNames.contains('searchCache')) {
          const searchStore = db.createObjectStore('searchCache', {
            keyPath: 'id',
          });
          searchStore.createIndex('query', 'query', { unique: false });
          searchStore.createIndex('frequency', 'frequency', { unique: false });
          searchStore.createIndex('searchedAt', 'searchedAt', {
            unique: false,
          });
        }

        // Drafts
        if (!db.objectStoreNames.contains('drafts')) {
          const draftStore = db.createObjectStore('drafts', { keyPath: 'id' });
          draftStore.createIndex('userId', 'userId', { unique: false });
          draftStore.createIndex('type', 'type', { unique: false });
          draftStore.createIndex('lastSaved', 'lastSaved', { unique: false });
        }

        // Media Cache
        if (!db.objectStoreNames.contains('mediaCache')) {
          const mediaStore = db.createObjectStore('mediaCache', {
            keyPath: 'id',
          });
          mediaStore.createIndex('url', 'url', { unique: true });
          mediaStore.createIndex('cachedAt', 'cachedAt', { unique: false });
          mediaStore.createIndex('size', 'size', { unique: false });
        }

        // Performance Logs
        if (!db.objectStoreNames.contains('performanceLogs')) {
          const perfStore = db.createObjectStore('performanceLogs', {
            keyPath: 'id',
          });
          perfStore.createIndex('page', 'page', { unique: false });
          perfStore.createIndex('timestamp', 'timestamp', { unique: false });
        }
      };
    });
  }

  private async getStore(
    storeName: string,
    mode: IDBTransactionMode = 'readonly'
  ): Promise<IDBObjectStore> {
    if (!this.db) {
      await this.initialize();
    }
    const transaction = this.db!.transaction([storeName], mode);
    return transaction.objectStore(storeName);
  }

  // Activity Logs
  async logActivity(
    activity: Omit<ActivityLog, 'id' | 'timestamp'>
  ): Promise<void> {
    try {
      const store = await this.getStore('activityLogs', 'readwrite');
      const log: ActivityLog = {
        ...activity,
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date(),
      };
      await store.add(log);
    } catch (error) {
      console.warn('Failed to log activity:', error);
    }
  }

  async getActivityLogs(
    userId: string,
    limit: number = 100
  ): Promise<ActivityLog[]> {
    try {
      const store = await this.getStore('activityLogs');
      const index = store.index('userId');
      const request = index.getAll(userId);

      return new Promise((resolve, reject) => {
        request.onsuccess = () => {
          const logs = request.result
            .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
            .slice(0, limit);
          resolve(logs);
        };
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.warn('Failed to get activity logs:', error);
      return [];
    }
  }

  // Offline Queue
  async addToQueue(
    queueItem: Omit<OfflineQueue, 'id' | 'createdAt' | 'retryCount' | 'status'>
  ): Promise<void> {
    try {
      const store = await this.getStore('offlineQueue', 'readwrite');
      const item: OfflineQueue = {
        ...queueItem,
        id: `queue-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        createdAt: new Date(),
        retryCount: 0,
        status: 'pending',
      };
      await store.add(item);
    } catch (error) {
      console.warn('Failed to add to queue:', error);
    }
  }

  async getQueueItems(
    status?: OfflineQueue['status']
  ): Promise<OfflineQueue[]> {
    try {
      const store = await this.getStore('offlineQueue');

      if (status) {
        const index = store.index('status');
        const request = index.getAll(status);
        return new Promise((resolve, reject) => {
          request.onsuccess = () => resolve(request.result);
          request.onerror = () => reject(request.error);
        });
      } else {
        const request = store.getAll();
        return new Promise((resolve, reject) => {
          request.onsuccess = () => resolve(request.result);
          request.onerror = () => reject(request.error);
        });
      }
    } catch (error) {
      console.warn('Failed to get queue items:', error);
      return [];
    }
  }

  async updateQueueItem(
    id: string,
    updates: Partial<OfflineQueue>
  ): Promise<void> {
    try {
      const store = await this.getStore('offlineQueue', 'readwrite');
      const request = store.get(id);

      return new Promise((resolve, reject) => {
        request.onsuccess = () => {
          const item = request.result;
          if (item) {
            Object.assign(item, updates);
            const updateRequest = store.put(item);
            updateRequest.onsuccess = () => resolve();
            updateRequest.onerror = () => reject(updateRequest.error);
          } else {
            reject(new Error('Queue item not found'));
          }
        };
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.warn('Failed to update queue item:', error);
    }
  }

  // Search Cache
  async cacheSearch(
    query: string,
    results: any[],
    type: SearchCache['type']
  ): Promise<void> {
    try {
      const store = await this.getStore('searchCache', 'readwrite');
      const id = `search-${type}-${btoa(query)}`;

      // Check if already exists to update frequency
      const existingRequest = store.get(id);

      return new Promise((resolve, reject) => {
        existingRequest.onsuccess = () => {
          const existing = existingRequest.result;
          const searchCache: SearchCache = {
            id,
            query,
            results,
            searchedAt: new Date(),
            frequency: existing ? existing.frequency + 1 : 1,
            type,
          };

          const putRequest = store.put(searchCache);
          putRequest.onsuccess = () => resolve();
          putRequest.onerror = () => reject(putRequest.error);
        };
        existingRequest.onerror = () => reject(existingRequest.error);
      });
    } catch (error) {
      console.warn('Failed to cache search:', error);
    }
  }

  async getSearchCache(
    query: string,
    type: SearchCache['type']
  ): Promise<SearchCache | null> {
    try {
      const store = await this.getStore('searchCache');
      const id = `search-${type}-${btoa(query)}`;
      const request = store.get(id);

      return new Promise((resolve, reject) => {
        request.onsuccess = () => {
          const result = request.result;
          // Check if cache is still fresh (within 1 hour)
          if (
            result &&
            Date.now() - result.searchedAt.getTime() < 60 * 60 * 1000
          ) {
            resolve(result);
          } else {
            resolve(null);
          }
        };
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.warn('Failed to get search cache:', error);
      return null;
    }
  }

  // Drafts
  async saveDraft(draft: Omit<Draft, 'id' | 'lastSaved'>): Promise<string> {
    try {
      const store = await this.getStore('drafts', 'readwrite');
      const id = `draft-${draft.type}-${Date.now()}`;
      const draftData: Draft = {
        ...draft,
        id,
        lastSaved: new Date(),
      };

      await store.put(draftData);
      return id;
    } catch (error) {
      console.warn('Failed to save draft:', error);
      throw error;
    }
  }

  async getDrafts(userId: string, type?: Draft['type']): Promise<Draft[]> {
    try {
      const store = await this.getStore('drafts');
      const index = store.index('userId');
      const request = index.getAll(userId);

      return new Promise((resolve, reject) => {
        request.onsuccess = () => {
          let drafts = request.result;
          if (type) {
            drafts = drafts.filter((draft) => draft.type === type);
          }
          drafts.sort((a, b) => b.lastSaved.getTime() - a.lastSaved.getTime());
          resolve(drafts);
        };
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.warn('Failed to get drafts:', error);
      return [];
    }
  }

  // Media Cache
  async cacheMedia(url: string, blob: Blob, expiresAt?: Date): Promise<void> {
    try {
      const store = await this.getStore('mediaCache', 'readwrite');
      const mediaCache: MediaCache = {
        id: btoa(url),
        url,
        blob,
        cachedAt: new Date(),
        size: blob.size,
        mimeType: blob.type,
        expiresAt,
      };

      await store.put(mediaCache);
    } catch (error) {
      console.warn('Failed to cache media:', error);
    }
  }

  async getCachedMedia(url: string): Promise<Blob | null> {
    try {
      const store = await this.getStore('mediaCache');
      const request = store.get(btoa(url));

      return new Promise((resolve, reject) => {
        request.onsuccess = () => {
          const result = request.result;
          if (result && (!result.expiresAt || result.expiresAt > new Date())) {
            resolve(result.blob);
          } else {
            resolve(null);
          }
        };
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.warn('Failed to get cached media:', error);
      return null;
    }
  }

  // Performance Logs
  async logPerformance(
    perfData: Omit<PerformanceLog, 'id' | 'timestamp'>
  ): Promise<void> {
    try {
      const store = await this.getStore('performanceLogs', 'readwrite');
      const log: PerformanceLog = {
        ...perfData,
        id: `perf-${Date.now()}`,
        timestamp: new Date(),
      };

      await store.add(log);

      // Keep only last 1000 entries
      this.cleanupPerformanceLogs();
    } catch (error) {
      console.warn('Failed to log performance:', error);
    }
  }

  private async cleanupPerformanceLogs(): Promise<void> {
    try {
      const store = await this.getStore('performanceLogs', 'readwrite');
      const request = store.getAll();

      request.onsuccess = () => {
        const logs = request.result.sort(
          (a, b) => b.timestamp.getTime() - a.timestamp.getTime()
        );
        if (logs.length > 1000) {
          const toDelete = logs.slice(1000);
          toDelete.forEach((log) => store.delete(log.id));
        }
      };
    } catch (error) {
      console.warn('Failed to cleanup performance logs:', error);
    }
  }

  // Cleanup methods
  async clearExpiredCache(): Promise<void> {
    const stores = ['searchCache', 'mediaCache'];
    const now = new Date();

    for (const storeName of stores) {
      try {
        const store = await this.getStore(storeName, 'readwrite');
        const request = store.getAll();

        request.onsuccess = () => {
          request.result.forEach((item) => {
            let shouldDelete = false;

            if (storeName === 'searchCache') {
              // Delete search cache older than 24 hours
              shouldDelete =
                now.getTime() - item.searchedAt.getTime() > 24 * 60 * 60 * 1000;
            } else if (storeName === 'mediaCache') {
              // Delete expired media cache
              shouldDelete = item.expiresAt && item.expiresAt < now;
            }

            if (shouldDelete) {
              store.delete(item.id);
            }
          });
        };
      } catch (error) {
        console.warn(`Failed to cleanup ${storeName}:`, error);
      }
    }
  }

  async getStorageUsage(): Promise<Record<string, number>> {
    const usage: Record<string, number> = {};
    const storeNames = [
      'activityLogs',
      'offlineQueue',
      'searchCache',
      'drafts',
      'mediaCache',
      'performanceLogs',
    ];

    for (const storeName of storeNames) {
      try {
        const store = await this.getStore(storeName);
        const request = store.getAll();

        await new Promise<void>((resolve) => {
          request.onsuccess = () => {
            usage[storeName] = request.result.length;
            resolve();
          };
          request.onerror = () => {
            usage[storeName] = 0;
            resolve();
          };
        });
      } catch (error) {
        usage[storeName] = 0;
      }
    }

    return usage;
  }
}

export const indexedDBManager = new IndexedDBManager();
