// src/lib/migration.ts
// Migration utilities for moving from IndexedDB-based to Firebase-First architecture

import { localStorageManager } from './local-storage';
import { indexedDBManager } from './indexed-db-utils';

interface MigrationResult {
  success: boolean;
  migratedSongs: number;
  migratedSetlists: number;
  migratedPreferences: boolean;
  errors: string[];
}

class MigrationManager {
  private readonly OLD_DB_NAME = 'MyWorshipApp';
  private readonly OLD_VERSION = 1;

  async checkMigrationNeeded(): Promise<boolean> {
    try {
      // Check if old IndexedDB exists
      const databases = await indexedDB.databases();
      const oldDbExists = databases.some((db) => db.name === this.OLD_DB_NAME);

      // Check if migration flag exists
      const migrationCompleted =
        localStorageManager.getAppState().lastSyncTimestamp > 0;

      return oldDbExists && !migrationCompleted;
    } catch (error) {
      console.warn('Failed to check migration status:', error);
      return false;
    }
  }

  async migrateFromOldSystem(): Promise<MigrationResult> {
    const result: MigrationResult = {
      success: false,
      migratedSongs: 0,
      migratedSetlists: 0,
      migratedPreferences: false,
      errors: [],
    };

    try {
      // 1. Migrate user preferences from localStorage
      result.migratedPreferences = this.migratePreferences();

      // 2. Migrate songs and setlists from old IndexedDB
      const { songs, setlists, errors } = await this.migrateOldIndexedDB();
      result.migratedSongs = songs;
      result.migratedSetlists = setlists;
      result.errors.push(...errors);

      // 3. Initialize new IndexedDB for appropriate use cases
      await indexedDBManager.initialize();

      // 4. Clear old data (optional - could keep for backup)
      // await this.cleanupOldData();

      // 5. Mark migration as completed
      localStorageManager.setAppState({
        lastSyncTimestamp: Date.now(),
        onboardingCompleted: true,
      });

      result.success = result.errors.length === 0;

      console.log('Migration completed:', result);
      return result;
    } catch (error) {
      result.errors.push(
        `Migration failed: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
      );
      console.error('Migration error:', error);
      return result;
    }
  }

  private migratePreferences(): boolean {
    try {
      // Migrate theme preference
      const oldTheme = localStorage.getItem('theme');
      if (oldTheme && ['light', 'dark', 'system'].includes(oldTheme)) {
        localStorageManager.setTheme(oldTheme as any);
      }

      // Migrate other preferences
      const oldPrefs = {
        fontSize: localStorage.getItem('fontSize'),
        defaultKey: localStorage.getItem('defaultKey'),
        autoScroll: localStorage.getItem('autoScroll'),
        showChords: localStorage.getItem('showChords'),
      };

      const newPrefs: any = {};
      Object.entries(oldPrefs).forEach(([key, value]) => {
        if (value) {
          try {
            newPrefs[key] = JSON.parse(value);
          } catch {
            // If not JSON, use as string
            newPrefs[key] = value;
          }
        }
      });

      if (Object.keys(newPrefs).length > 0) {
        localStorageManager.setUserPreferences(newPrefs);
      }

      return true;
    } catch (error) {
      console.warn('Failed to migrate preferences:', error);
      return false;
    }
  }

  private async migrateOldIndexedDB(): Promise<{
    songs: number;
    setlists: number;
    errors: string[];
  }> {
    const result = { songs: 0, setlists: 0, errors: [] };

    try {
      // Open old database
      const oldDb = await this.openOldDatabase();
      if (!oldDb) {
        result.errors.push('Could not open old database');
        return result;
      }

      // Migrate songs
      try {
        const oldSongs = await this.getOldData(oldDb, 'songs');
        for (const oldSong of oldSongs) {
          try {
            // Convert old song format to new format
            const newSong = this.convertOldSong(oldSong);

            // Note: In real implementation, you would save to Firebase here
            // For now, we'll just log the conversion
            console.log('Would migrate song:', newSong.title);
            result.songs++;
          } catch (error) {
            result.errors.push(
              `Failed to migrate song ${oldSong.id}: ${error}`
            );
          }
        }
      } catch (error) {
        result.errors.push(`Failed to migrate songs: ${error}`);
      }

      // Migrate setlists
      try {
        const oldSetlists = await this.getOldData(oldDb, 'setlists');
        for (const oldSetlist of oldSetlists) {
          try {
            // Convert old setlist format to new format
            const newSetlist = this.convertOldSetlist(oldSetlist);

            // Note: In real implementation, you would save to Firebase here
            console.log('Would migrate setlist:', newSetlist.title);
            result.setlists++;
          } catch (error) {
            result.errors.push(
              `Failed to migrate setlist ${oldSetlist.id}: ${error}`
            );
          }
        }
      } catch (error) {
        result.errors.push(`Failed to migrate setlists: ${error}`);
      }

      oldDb.close();
    } catch (error) {
      result.errors.push(`Database migration failed: ${error}`);
    }

    return result;
  }

  private openOldDatabase(): Promise<IDBDatabase | null> {
    return new Promise((resolve) => {
      try {
        const request = indexedDB.open(this.OLD_DB_NAME, this.OLD_VERSION);

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => resolve(null);
        request.onblocked = () => resolve(null);

        // Don't trigger upgrade - we're just reading
        request.onupgradeneeded = () => resolve(null);
      } catch {
        resolve(null);
      }
    });
  }

  private getOldData(db: IDBDatabase, storeName: string): Promise<any[]> {
    return new Promise((resolve, reject) => {
      try {
        if (!db.objectStoreNames.contains(storeName)) {
          resolve([]);
          return;
        }

        const transaction = db.transaction([storeName], 'readonly');
        const store = transaction.objectStore(storeName);
        const request = store.getAll();

        request.onsuccess = () => resolve(request.result || []);
        request.onerror = () => reject(request.error);
      } catch (error) {
        reject(error);
      }
    });
  }

  private convertOldSong(oldSong: any): any {
    // Convert old song format to new database schema
    return {
      id: oldSong.id || `migrated-${Date.now()}-${Math.random()}`,
      title: oldSong.title || 'Untitled',
      artist: oldSong.artist || 'Unknown Artist',
      originalKey: oldSong.originalKey || 'C',
      bpm: oldSong.bpm || 120,
      lyrics: oldSong.lyrics || '',

      // New fields
      createdBy: 'migrated-user', // Should use actual user ID
      authorName: 'Migrated User',
      source: 'user' as const,
      isPublic: false,
      isOfficial: false,
      isSynced: false,
      needsSync: true,

      createdAt: oldSong.createdAt ? new Date(oldSong.createdAt) : new Date(),
      updatedAt: new Date(),

      usageCount: 0,
      downloadCount: 0,
      genre: oldSong.genre || 'unknown',
      tags: oldSong.tags || [],
      language: 'th' as const,
    };
  }

  private convertOldSetlist(oldSetlist: any): any {
    // Convert old setlist format to new database schema
    return {
      id: oldSetlist.id || `migrated-${Date.now()}-${Math.random()}`,
      title: oldSetlist.title || 'Untitled Setlist',
      description: oldSetlist.description || '',
      songIds: oldSetlist.songIds || [],

      // New fields
      userId: 'migrated-user', // Should use actual user ID
      authorName: 'Migrated User',
      isPublic: false,
      allowSave: false,
      isSynced: false,
      needsSync: true,

      createdAt: oldSetlist.createdAt
        ? new Date(oldSetlist.createdAt)
        : new Date(),
      updatedAt: new Date(),

      tags: oldSetlist.tags || [],
      saveCount: 0,
      viewCount: 0,
      category: 'worship' as const,
    };
  }

  async cleanupOldData(): Promise<void> {
    try {
      // Clean up old localStorage keys
      const oldKeys = [
        'theme',
        'fontSize',
        'defaultKey',
        'autoScroll',
        'showChords',
        'songs',
        'setlists',
        'userPreferences',
      ];

      oldKeys.forEach((key) => {
        try {
          localStorage.removeItem(key);
        } catch {
          // Ignore errors
        }
      });

      // Optionally delete old IndexedDB
      // await new Promise<void>((resolve, reject) => {
      //   const deleteRequest = indexedDB.deleteDatabase(this.OLD_DB_NAME);
      //   deleteRequest.onsuccess = () => resolve();
      //   deleteRequest.onerror = () => reject(deleteRequest.error);
      // });

      console.log('Old data cleanup completed');
    } catch (error) {
      console.warn('Failed to cleanup old data:', error);
    }
  }

  // Utility method to backup current data before migration
  async backupCurrentData(): Promise<string> {
    try {
      const backup = {
        timestamp: new Date().toISOString(),
        preferences: localStorageManager.getUserPreferences(),
        recentActivity: localStorageManager.getRecentActivity(),
        appState: localStorageManager.getAppState(),
        // Could include more data here
      };

      return JSON.stringify(backup, null, 2);
    } catch (error) {
      throw new Error(`Failed to create backup: ${error}`);
    }
  }

  // Method to restore from backup if migration fails
  async restoreFromBackup(backupData: string): Promise<boolean> {
    try {
      const backup = JSON.parse(backupData);

      if (backup.preferences) {
        localStorageManager.setUserPreferences(backup.preferences);
      }

      if (backup.recentActivity) {
        localStorageManager.setRecentActivity(backup.recentActivity);
      }

      if (backup.appState) {
        localStorageManager.setAppState(backup.appState);
      }

      return true;
    } catch (error) {
      console.error('Failed to restore from backup:', error);
      return false;
    }
  }
}

export const migrationManager = new MigrationManager();
