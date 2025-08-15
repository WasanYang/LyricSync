// src/components/LyricPlayerV2/types.ts
export interface LyricLine {
    measures: number;
    text: string;
}

export type ParsedLyricLine =
  | { type: 'section'; content: string }
  | { type: 'chords'; content: string }
  | { type: 'lyrics'; content: string }
  | { type: 'empty' };
