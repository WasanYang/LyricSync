// src/components/player/LyricLineDisplay.tsx
'use client';

import { useMemo } from 'react';
import type { LyricLine } from '@/lib/songs';
import { transposeChord } from '@/lib/chords';

type FontWeight = 400 | 600 | 700;

interface LyricLineDisplayProps {
  line: LyricLine;
  showChords: boolean;
  chordColor: string;
  transpose: number;
  fontWeight: FontWeight;
  fontSize: number;
}

const parseLyrics = (
  line: string
): Array<{ chord: string | null; text: string }> => {
  const regex = /\[([^\]]+)\]([^\[]*)/g;
  const parts: Array<{ chord: string | null; text: string }> = [];
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(line)) !== null) {
    // Text before the current match
    if (match.index > lastIndex) {
      parts.push({ chord: null, text: line.substring(lastIndex, match.index) });
    }

    let text = match[2];
    // If the text part is empty and there's another chord immediately after, add a space.
    if (text === '' && line.substring(regex.lastIndex).startsWith('[')) {
      text = ' ';
    }

    parts.push({ chord: match[1], text });
    lastIndex = regex.lastIndex;
  }

  // Text after the last match
  if (lastIndex < line.length) {
    parts.push({ chord: null, text: line.substring(lastIndex) });
  }

  // If the line was empty or only whitespace
  if (parts.length === 0 && line.trim() === '') {
    return [{ chord: null, text: line }];
  }

  if (parts.length === 0) {
    return [{ chord: null, text: line }];
  }

  return parts;
};

export default function LyricLineDisplay({
  line,
  showChords,
  chordColor,
  transpose,
  fontWeight,
  fontSize,
}: LyricLineDisplayProps) {
  const parsedLine = useMemo(() => parseLyrics(line.text), [line.text]);
  const hasChords = useMemo(
    () => parsedLine.some((p) => p.chord),
    [parsedLine]
  );
  const cleanLyricText = useMemo(
    () =>
      line.text
        .replace(/\[[^\]]+\]/g, '')
        .trimEnd()
        .trimStart(),
    [line.text]
  );

  if (!showChords) {
    return <p style={{ fontWeight }}>{cleanLyricText}</p>;
  }

  if (!hasChords) {
    return <p style={{ fontWeight }}>{cleanLyricText}</p>;
  }

  return (
    <div className='flex flex-col items-start leading-snug'>
      {/* Chord Line */}
      <div
        className='-mb-1.5'
        style={{
          color: chordColor,
          fontSize: `calc(${fontSize}px - 2px)`,
          marginBottom: '-1.5px',
        }}
      >
        {parsedLine.map((part, index) => (
          <span key={`chord-${index}`} className='whitespace-pre'>
            <span>
              {part.chord
                ? part.chord
                    .split(/(\s*\|\s*)/)
                    .map((segment) => {
                      // If it's a separator (|), keep it as is
                      if (segment.trim() === '|' || segment.includes('|')) {
                        return segment;
                      }
                      // If it's a chord, transpose it
                      const trimmedSegment = segment.trim();
                      if (trimmedSegment && trimmedSegment !== '') {
                        return transposeChord(trimmedSegment, transpose);
                      }
                      return segment;
                    })
                    .join('')
                : ''}
            </span>
            <span
              aria-hidden='true'
              style={{ visibility: 'hidden', fontWeight }}
            >
              {part.text}
            </span>
          </span>
        ))}
      </div>
      {/* Lyric Line */}
      <div style={{ fontWeight }}>{cleanLyricText}</div>
    </div>
  );
}
