
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
  downloadCount?: number;
  // Fields for user-uploaded songs
  userId?: string;
  uploaderName?: string;
  uploaderEmail?: string;
};
