// src/components/LyricPlayerV2/types.ts
export interface LyricLine {
  measures: number;
  text: string;
}

export type ParsedLyricLine =
  | { type: 'section'; content: string; uniqueKey?: string }
  | { type: 'chords'; content: string; uniqueKey?: string }
  | { type: 'lyrics'; content: string; uniqueKey?: string }
  | { type: 'empty'; uniqueKey?: string };
