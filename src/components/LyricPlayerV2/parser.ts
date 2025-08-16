// src/components/LyricPlayerV2/parser.ts
import { ParsedLyricLine } from './types';

// This new parser handles chord and lyric lines separately.
export function parseLyricsV2(lyricString: string): ParsedLyricLine[] {
  if (!lyricString) return [];

  const lines = lyricString.split('\n');
  const parsed: ParsedLyricLine[] = [];

  for (const line of lines) {
    const trimmedLine = line.trim();

    // Section header
    if (trimmedLine.startsWith('(') && trimmedLine.endsWith(')')) {
      parsed.push({
        type: 'section',
        content: trimmedLine.substring(1, trimmedLine.length - 1),
      });
      continue;
    }

    // Chord line: contains brackets and very few, if any, letters outside brackets
    const isChordLine =
      /\[.*\]/.test(line) && !/[a-zA-Z]{3,}/.test(line.replace(/\[[^\]]+\]/g, ''));
    
    if (trimmedLine === '') {
      parsed.push({ type: 'empty' });
    } else if (isChordLine) {
      parsed.push({ type: 'chords', content: line });
    } else {
      parsed.push({ type: 'lyrics', content: line });
    }
  }

  // Filter out multiple consecutive empty lines into one
  const finalParsed: ParsedLyricLine[] = [];
  let lastWasEmpty = false;
  for (const line of parsed) {
    if (line.type === 'empty') {
      if (!lastWasEmpty) {
        finalParsed.push(line);
      }
      lastWasEmpty = true;
    } else {
      finalParsed.push(line);
      lastWasEmpty = false;
    }
  }

  return finalParsed;
}
