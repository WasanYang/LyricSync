// src/lib/permissions.ts
// Permission Logic for User-Generated Content

import type { Song, Setlist, Permissions } from './types/database';

export const songPermissions = (
  song: Song,
  currentUserId?: string
): Permissions => {
  const isOwner = song.createdBy === currentUserId;
  const isSystem = song.source === 'system';
  const isPublic = song.isPublic;

  return {
    canView: isOwner || isSystem || isPublic,
    canEdit: isOwner && !isSystem,
    canDelete: isOwner && !isSystem,
    canShare: isOwner || (isPublic && song.isSynced),
    canSave: !isOwner && (isSystem || isPublic),
  };
};

export const setlistPermissions = (
  setlist: Setlist,
  currentUserId?: string
): Permissions => {
  const isOwner = setlist.userId === currentUserId;
  const isPublic = setlist.isPublic;
  const allowSave = setlist.allowSave;

  return {
    canView: isOwner || isPublic,
    canEdit: isOwner,
    canDelete: isOwner,
    canShare: isOwner || (isPublic && setlist.isSynced),
    canSave: !isOwner && isPublic && allowSave,
  };
};

// Permission middleware for API calls
export const requirePermission = (
  resource: Song | Setlist,
  action: keyof Permissions,
  currentUserId?: string
) => {
  const permissions =
    'createdBy' in resource
      ? songPermissions(resource as Song, currentUserId)
      : setlistPermissions(resource as Setlist, currentUserId);

  if (!permissions[action]) {
    throw new Error(`Permission denied: Cannot ${action} this resource`);
  }

  return true;
};

// Helper functions for common permission checks
export const canUserEditSong = (song: Song, userId: string): boolean => {
  return songPermissions(song, userId).canEdit;
};

export const canUserEditSetlist = (
  setlist: Setlist,
  userId: string
): boolean => {
  return setlistPermissions(setlist, userId).canEdit;
};

export const canUserSaveSong = (song: Song, userId: string): boolean => {
  return songPermissions(song, userId).canSave;
};

export const canUserSaveSetlist = (
  setlist: Setlist,
  userId: string
): boolean => {
  return setlistPermissions(setlist, userId).canSave;
};

export const canUserShareContent = (
  content: Song | Setlist,
  userId: string
): boolean => {
  const permissions =
    'createdBy' in content
      ? songPermissions(content as Song, userId)
      : setlistPermissions(content as Setlist, userId);

  return permissions.canShare;
};
