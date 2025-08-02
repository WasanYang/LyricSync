// src/lib/local-storage.ts
// LocalStorage utilities for user preferences and simple data

export type HighlightMode = 'line' | 'section' | 'none';
export type FontWeight = 400 | 600 | 700;

interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  fontSize: number;
  fontWeight: FontWeight;
  highlightMode: HighlightMode;
  defaultKey: string;
  autoScroll: boolean;
  showChords: boolean;
  floatingControls: boolean;
  floatingNavigator: boolean;
  language: 'th' | 'en';
  soundEnabled: boolean;
  vibrationEnabled: boolean;
}

interface RecentActivity {
  lastVisitedSongs: string[];
  lastVisitedSetlists: string[];
  searchHistory: string[];
  favoriteGenres: string[];
}

interface AppState {
  lastActiveTab: string;
  onboardingCompleted: boolean;
  installPromptDismissed: boolean;
  lastSyncTimestamp: number;
  offlineMode: boolean;
}

class LocalStorageManager {
  private readonly KEYS = {
    USER_PREFERENCES: 'worship_user_preferences',
    RECENT_ACTIVITY: 'worship_recent_activity',
    APP_STATE: 'worship_app_state',
    CACHE_TIMESTAMPS: 'worship_cache_timestamps',
  } as const;

  // Default values
  private readonly DEFAULT_PREFERENCES: UserPreferences = {
    theme: 'system',
    fontSize: 16,
    fontWeight: 400,
    highlightMode: 'line',
    defaultKey: 'C',
    autoScroll: true,
    showChords: true,
    floatingControls: true,
    floatingNavigator: true,
    language: 'th',
    soundEnabled: true,
    vibrationEnabled: true,
  };

  private readonly DEFAULT_ACTIVITY: RecentActivity = {
    lastVisitedSongs: [],
    lastVisitedSetlists: [],
    searchHistory: [],
    favoriteGenres: [],
  };

  private readonly DEFAULT_APP_STATE: AppState = {
    lastActiveTab: 'home',
    onboardingCompleted: false,
    installPromptDismissed: false,
    lastSyncTimestamp: 0,
    offlineMode: false,
  };

  // Utility methods
  private safeGet<T>(key: string, defaultValue: T): T {
    try {
      if (typeof window === 'undefined' || !window.localStorage) {
        return defaultValue;
      }

      const item = localStorage.getItem(key);
      if (!item) return defaultValue;

      return JSON.parse(item);
    } catch (error) {
      console.warn(`Failed to get ${key} from localStorage:`, error);
      return defaultValue;
    }
  }

  private safeSet<T>(key: string, value: T): boolean {
    try {
      if (typeof window === 'undefined' || !window.localStorage) {
        return false;
      }

      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.warn(`Failed to set ${key} in localStorage:`, error);
      return false;
    }
  }

  private safeRemove(key: string): boolean {
    try {
      if (typeof window === 'undefined' || !window.localStorage) {
        return false;
      }

      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.warn(`Failed to remove ${key} from localStorage:`, error);
      return false;
    }
  }

  // User Preferences
  getUserPreferences(): UserPreferences {
    return this.safeGet(this.KEYS.USER_PREFERENCES, this.DEFAULT_PREFERENCES);
  }

  setUserPreferences(preferences: Partial<UserPreferences>): boolean {
    const current = this.getUserPreferences();
    const updated = { ...current, ...preferences };
    return this.safeSet(this.KEYS.USER_PREFERENCES, updated);
  }

  resetUserPreferences(): boolean {
    return this.safeSet(this.KEYS.USER_PREFERENCES, this.DEFAULT_PREFERENCES);
  }

  // Specific preference getters/setters
  getTheme(): UserPreferences['theme'] {
    return this.getUserPreferences().theme;
  }

  setTheme(theme: UserPreferences['theme']): boolean {
    return this.setUserPreferences({ theme });
  }

  getFontSize(): number {
    return this.getUserPreferences().fontSize;
  }

  setFontSize(fontSize: number): boolean {
    return this.setUserPreferences({
      fontSize: Math.max(12, Math.min(24, fontSize)),
    });
  }

  getDefaultKey(): string {
    return this.getUserPreferences().defaultKey;
  }

  setDefaultKey(defaultKey: string): boolean {
    return this.setUserPreferences({ defaultKey });
  }

  // Recent Activity
  getRecentActivity(): RecentActivity {
    return this.safeGet(this.KEYS.RECENT_ACTIVITY, this.DEFAULT_ACTIVITY);
  }

  setRecentActivity(activity: Partial<RecentActivity>): boolean {
    const current = this.getRecentActivity();
    const updated = { ...current, ...activity };
    return this.safeSet(this.KEYS.RECENT_ACTIVITY, updated);
  }

  addToRecentSongs(songId: string, maxItems: number = 20): boolean {
    const activity = this.getRecentActivity();
    const filtered = activity.lastVisitedSongs.filter((id) => id !== songId);
    const updated = [songId, ...filtered].slice(0, maxItems);

    return this.setRecentActivity({ lastVisitedSongs: updated });
  }

  addToRecentSetlists(setlistId: string, maxItems: number = 10): boolean {
    const activity = this.getRecentActivity();
    const filtered = activity.lastVisitedSetlists.filter(
      (id) => id !== setlistId
    );
    const updated = [setlistId, ...filtered].slice(0, maxItems);

    return this.setRecentActivity({ lastVisitedSetlists: updated });
  }

  addToSearchHistory(query: string, maxItems: number = 50): boolean {
    if (!query.trim()) return false;

    const activity = this.getRecentActivity();
    const filtered = activity.searchHistory.filter(
      (q) => q.toLowerCase() !== query.toLowerCase()
    );
    const updated = [query.trim(), ...filtered].slice(0, maxItems);

    return this.setRecentActivity({ searchHistory: updated });
  }

  clearSearchHistory(): boolean {
    return this.setRecentActivity({ searchHistory: [] });
  }

  // App State
  getAppState(): AppState {
    return this.safeGet(this.KEYS.APP_STATE, this.DEFAULT_APP_STATE);
  }

  setAppState(state: Partial<AppState>): boolean {
    const current = this.getAppState();
    const updated = { ...current, ...state };
    return this.safeSet(this.KEYS.APP_STATE, updated);
  }

  isOnboardingCompleted(): boolean {
    return this.getAppState().onboardingCompleted;
  }

  setOnboardingCompleted(completed: boolean): boolean {
    return this.setAppState({ onboardingCompleted: completed });
  }

  isInstallPromptDismissed(): boolean {
    return this.getAppState().installPromptDismissed;
  }

  setInstallPromptDismissed(dismissed: boolean): boolean {
    return this.setAppState({ installPromptDismissed: dismissed });
  }

  getLastActiveTab(): string {
    return this.getAppState().lastActiveTab;
  }

  setLastActiveTab(tab: string): boolean {
    return this.setAppState({ lastActiveTab: tab });
  }

  isOfflineMode(): boolean {
    return this.getAppState().offlineMode;
  }

  setOfflineMode(offline: boolean): boolean {
    return this.setAppState({ offlineMode: offline });
  }

  // Cache management
  getCacheTimestamp(key: string): number {
    const timestamps = this.safeGet(
      this.KEYS.CACHE_TIMESTAMPS,
      {} as Record<string, number>
    );
    return timestamps[key] || 0;
  }

  setCacheTimestamp(key: string, timestamp: number = Date.now()): boolean {
    const timestamps = this.safeGet(
      this.KEYS.CACHE_TIMESTAMPS,
      {} as Record<string, number>
    );
    timestamps[key] = timestamp;
    return this.safeSet(this.KEYS.CACHE_TIMESTAMPS, timestamps);
  }

  isCacheExpired(key: string, maxAge: number): boolean {
    const timestamp = this.getCacheTimestamp(key);
    return Date.now() - timestamp > maxAge;
  }

  // Batch operations
  exportUserData(): string {
    const data = {
      preferences: this.getUserPreferences(),
      activity: this.getRecentActivity(),
      appState: this.getAppState(),
      timestamp: Date.now(),
    };

    return JSON.stringify(data, null, 2);
  }

  importUserData(jsonData: string): boolean {
    try {
      const data = JSON.parse(jsonData);

      if (data.preferences) {
        this.setUserPreferences(data.preferences);
      }

      if (data.activity) {
        this.setRecentActivity(data.activity);
      }

      if (data.appState) {
        this.setAppState(data.appState);
      }

      return true;
    } catch (error) {
      console.error('Failed to import user data:', error);
      return false;
    }
  }

  // Cleanup and maintenance
  clearAllData(): boolean {
    try {
      Object.values(this.KEYS).forEach((key) => {
        this.safeRemove(key);
      });
      return true;
    } catch (error) {
      console.error('Failed to clear all data:', error);
      return false;
    }
  }

  getStorageUsage(): { [key: string]: number } {
    const usage: { [key: string]: number } = {};

    Object.entries(this.KEYS).forEach(([name, key]) => {
      try {
        const item = localStorage.getItem(key);
        usage[name] = item ? new Blob([item]).size : 0;
      } catch {
        usage[name] = 0;
      }
    });

    return usage;
  }

  // Migration helper
  migrateFromOldKeys(): boolean {
    // Migrate from old localStorage keys if they exist
    const oldMappings = {
      theme: 'theme',
      fontSize: 'fontSize',
      defaultKey: 'defaultKey',
      autoScroll: 'autoScroll',
      showChords: 'showChords',
    };

    let migrated = false;
    const preferences = this.getUserPreferences();

    Object.entries(oldMappings).forEach(([oldKey, newProp]) => {
      try {
        const oldValue = localStorage.getItem(oldKey);
        if (oldValue && !(newProp in preferences)) {
          const parsed = JSON.parse(oldValue);
          this.setUserPreferences({
            [newProp]: parsed,
          } as Partial<UserPreferences>);
          localStorage.removeItem(oldKey);
          migrated = true;
        }
      } catch {
        // Ignore migration errors
      }
    });

    return migrated;
  }
}

export const localStorageManager = new LocalStorageManager();

// Auto-migrate on first load
if (typeof window !== 'undefined') {
  localStorageManager.migrateFromOldKeys();
}
