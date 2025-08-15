import { Timestamp } from 'firebase/firestore';

export type LyricLine = {
  measures: number; // Number of measures this line lasts for
  text: string; // Chords can be embedded like [Am]this.
};

export type Song = {
  id: string;
  title: string;
  artist: string;
  lyrics: LyricLine[] | string; // Updated to allow simple string for V2
  updatedAt: number;
  originalKey?: string;
  bpm?: number;
  timeSignature?: string;
  url?: string; // Link to YouTube, Spotify, etc.
  source: 'system' | 'user'; // system: from the app, user: custom song or upload
  downloadCount?: number;
  // Fields for user-uploaded songs
  userId?: string;
  uploaderName?: string;
  uploaderEmail?: string;
};

export const songFromDoc = (doc: any): Song => {
  const data = doc.data();
  let updatedAt: any;
  if (data.updatedAt instanceof Timestamp) {
    updatedAt = data.updatedAt.toMillis();
  } else if (typeof data.updatedAt === 'number') {
    updatedAt = data.updatedAt;
  } else if (typeof data.updatedAt === 'string') {
    updatedAt = Date.parse(data.updatedAt);
  } else {
    updatedAt = Date.now();
  }
  return {
    id: doc.id,
    title: data.title,
    artist: data.artist,
    lyrics: data.lyrics,
    originalKey: data.originalKey,
    bpm: data.bpm,
    timeSignature: data.timeSignature,
    url: data.url,
    userId: data.userId,
    uploaderName: data.uploaderName,
    uploaderEmail: data.uploaderEmail,
    source: data.source,
    downloadCount: data.downloadCount || 0,
    updatedAt, // เก็บเป็น number (timestamp)
  };
};
