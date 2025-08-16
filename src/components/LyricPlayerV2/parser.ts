// src/components/LyricPlayerV2/parser.ts
import { ParsedLyricLine } from './types';

// This new parser combines chord and lyric lines based on their sequence.
export function parseLyricsV2(lyricString: string): ParsedLyricLine[] {
  if (!lyricString) return [];

  const lines = lyricString.split('\n');
  const parsed: ParsedLyricLine[] = [];
  let tempChordLine: string | null = null;

  for (const line of lines) {
    const trimmedLine = line.trim();

    // Section header
    if (trimmedLine.startsWith('(') && trimmedLine.endsWith(')')) {
      if (tempChordLine) {
        // A chord line was hanging, push it as a lyric line
        parsed.push({ type: 'lyrics', content: tempChordLine });
        tempChordLine = null;
      }
      parsed.push({
        type: 'section',
        content: trimmedLine.substring(1, trimmedLine.length - 1),
      });
      continue;
    }

    // Chord line
    if (/^\[.*\]/.test(trimmedLine) && !/[a-zA-Z]/.test(trimmedLine.replace(/\[[^\]]+\]|\s/g, ''))) {
      if (tempChordLine) {
        // A chord line was hanging, push it as a lyric line
        parsed.push({ type: 'lyrics', content: tempChordLine });
      }
      tempChordLine = line; // Store it and wait for lyrics
      continue;
    }

    // Lyric line
    if (tempChordLine) {
      // We have a preceding chord line
      let combinedContent = '';
      const chordRegex = /\[([^\]]+)\]/g;
      let lastIndex = 0;
      let match;
      
      while ((match = chordRegex.exec(tempChordLine)) !== null) {
          // Get lyrics segment under this chord
          const lyricSegment = line.substring(lastIndex, match.index);
          combinedContent += lyricSegment + match[0];
          lastIndex = match.index;
      }
      // Append remaining lyrics
      combinedContent += line.substring(lastIndex);

      parsed.push({ type: 'lyrics', content: combinedContent.trim() });
      tempChordLine = null;
    } else if (trimmedLine === '') {
      parsed.push({ type: 'empty' });
    }
    else {
      // It's a lyric line without a preceding chord line
      parsed.push({ type: 'lyrics', content: line });
    }
  }

  // If a chord line is the last line in the song
  if (tempChordLine) {
    parsed.push({ type: 'lyrics', content: tempChordLine });
  }


  // Filter out multiple empty lines into one
  const finalParsed: ParsedLyricLine[] = [];
  let lastWasEmpty = false;
  for(const line of parsed){
      if(line.type === 'empty'){
          if(!lastWasEmpty){
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
