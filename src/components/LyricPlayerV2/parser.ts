// src/components/LyricPlayerV2/parser.ts
import { ParsedLyricLine } from './types';

export function parseLyricsV2(lyricString: string): ParsedLyricLine[] {
  if (!lyricString) return [];
  
  const lines = lyricString.split('\n');
  const parsed: ParsedLyricLine[] = [];

  for (const line of lines) {
    const trimmedLine = line.trim();

    if (trimmedLine === '') {
      parsed.push({ type: 'empty' });
      continue;
    }

    // Check for section header: (Verse), (Chorus), etc.
    if (trimmedLine.startsWith('(') && trimmedLine.endsWith(')')) {
      parsed.push({
        type: 'section',
        content: trimmedLine.substring(1, trimmedLine.length - 1),
      });
      continue;
    }

    // Check for chord line: [C] [G] etc.
    if (/^\[.*\]/.test(trimmedLine)) {
       parsed.push({
         type: 'chords',
         content: line, // Preserve spacing
       });
       continue;
    }

    // Otherwise, it's a lyric line
    parsed.push({
      type: 'lyrics',
      content: line,
    });
  }

  return parsed;
}
