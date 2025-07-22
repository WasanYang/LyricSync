export type LyricLine = {
  measures: number; // Number of measures this line lasts for
  text: string; // Chords can be embedded like [Am]this.
};

export type Song = {
  id: string;
  title: string;
  artist: string;
  lyrics: LyricLine[];
  updatedAt: Date;
  originalKey?: string;
  bpm?: number;
  timeSignature?: string;
  source: 'system' | 'user'; // system: from the app, user: custom song or upload
  // Fields for user-uploaded songs
  userId?: string;
  uploaderName?: string;
  uploaderEmail?: string;
};

const songs: Song[] = [];

export function getSongs(): Song[] {
  return songs;
}

export function getSongById(id: string): Song | undefined {
  return songs.find((song) => song.id === id);
}
