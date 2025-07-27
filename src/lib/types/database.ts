// src/lib/types/database.ts
// Database Schema Types for User-Generated Content

export interface User {
  uid: string; // Firebase Auth UID (Primary Key)
  email: string;
  displayName: string;
  photoURL?: string;
  createdAt: Date;
  updatedAt: Date;

  // User preferences
  preferences: {
    defaultKey: string;
    fontSize: number;
    theme: 'light' | 'dark';
    autoScroll: boolean;
    showChords: boolean;
  };

  // Statistics
  stats: {
    songsCreated: number;
    setlistsCreated: number;
    songsDownloaded: number;
    setlistsSaved: number;
  };

  // Subscription info (future use)
  subscription?: {
    plan: 'free' | 'premium';
    expiresAt?: Date;
    features: string[];
  };
}

export interface Song {
  id: string; // Auto-generated ID (Primary Key)
  firestoreId?: string; // For synced songs only

  // Basic Info
  title: string;
  artist: string;
  originalKey: string;
  bpm?: number;
  lyrics: string;

  // Ownership & Source
  createdBy: string; // User UID who created
  authorName: string; // Display name of creator
  source: 'system' | 'user'; // System songs vs user-created

  // Permissions & Status
  isPublic: boolean; // Can others see/use this song?
  isOfficial: boolean; // Is this an official/curated song?

  // Sync Status (for user songs only)
  isSynced: boolean; // Is synced to cloud?
  needsSync: boolean; // Has local changes?
  syncedAt?: Date; // Last sync time

  // Metadata
  createdAt: Date;
  updatedAt: Date;

  // Usage tracking
  usageCount: number; // How many times used in setlists
  downloadCount: number; // How many users downloaded

  // Categories and tags
  genre?: string;
  tags: string[];
  language: 'th' | 'en' | 'other';
}

export interface Setlist {
  id: string; // Local ID (Primary Key)
  firestoreId?: string; // Cloud ID when synced

  // Basic Info
  title: string;
  description?: string;
  songIds: string[]; // Array of song IDs (local references)

  // Ownership
  userId: string; // Owner's UID
  authorName: string; // Owner's display name

  // Permissions
  isPublic: boolean; // Can others see this setlist?
  allowSave: boolean; // Can others save to their library?

  // Sync Status
  isSynced: boolean; // Is synced to cloud?
  needsSync: boolean; // Has local changes?
  syncedAt?: Date; // Last sync time

  // Metadata
  createdAt: Date;
  updatedAt: Date;

  // Advanced features
  tags: string[]; // Categories/tags
  originalSetlistId?: string; // If this is saved from someone else

  // Usage tracking
  saveCount: number; // How many users saved this
  viewCount: number; // How many views

  // Organization
  category: 'worship' | 'concert' | 'practice' | 'other';
  estimatedDuration?: number; // in minutes
}

export interface UserSong {
  id: string; // Auto-generated ID
  userId: string; // User who saved the song
  songId: string; // Original song ID
  originalSongId?: string; // If saved from someone else

  // Save metadata
  savedAt: Date;
  savedFrom: 'search' | 'setlist' | 'share'; // How they found it

  // Personal settings
  personalKey?: string; // User's preferred key
  personalNotes?: string; // Personal notes
  isFavorite: boolean;

  // Local status
  isDownloaded: boolean; // Is available offline?
  downloadedAt?: Date;

  // Usage tracking
  lastPlayedAt?: Date;
  playCount: number;
}

export interface UserSetlist {
  id: string; // Auto-generated ID
  userId: string; // User who saved the setlist
  setlistId: string; // Original setlist ID (firestoreId)
  originalAuthorId: string; // Original creator's UID

  // Save metadata
  savedAt: Date;
  savedFrom: 'search' | 'share' | 'browse';

  // Personal settings
  personalTitle?: string; // User's custom title
  personalNotes?: string; // Personal notes
  isFavorite: boolean;

  // Permissions (inherited but cached)
  canEdit: boolean; // Always false for saved setlists
  canShare: boolean; // Based on original permissions

  // Usage tracking
  lastOpenedAt?: Date;
  openCount: number;
}

export interface SharedLink {
  id: string; // Auto-generated share ID
  type: 'song' | 'setlist';
  resourceId: string; // Song or Setlist firestoreId

  // Link settings
  createdBy: string; // Creator's UID
  expiresAt?: Date; // Optional expiration
  isActive: boolean;
  requiresAuth: boolean; // Public vs authenticated access

  // Usage tracking
  clickCount: number;
  lastAccessedAt?: Date;
  accessLog: Array<{
    timestamp: Date;
    userAgent: string;
    ip?: string;
  }>;

  // Metadata
  createdAt: Date;
}

// Enhanced types for better type safety
export interface SetlistWithSyncStatus extends Setlist {
  containsCustomSongs: boolean;
  syncStatus: 'synced' | 'needs_sync' | 'sync_error' | 'local_only';
}

export interface SongWithUserData extends Song {
  userSong?: UserSong;
  isUserFavorite: boolean;
  userKey?: string;
  userNotes?: string;
}

export interface SetlistWithUserData extends Setlist {
  userSetlist?: UserSetlist;
  isUserFavorite: boolean;
  userTitle?: string;
  userNotes?: string;
}

// Permission helper types
export interface Permissions {
  canView: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canShare: boolean;
  canSave: boolean;
}

export interface ContentPermissions {
  song: (song: Song, currentUserId?: string) => Permissions;
  setlist: (setlist: Setlist, currentUserId?: string) => Permissions;
}
