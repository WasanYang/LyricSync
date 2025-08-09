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
  inlineCommentColor: string;
  transpose: number;
  fontWeight: FontWeight;
  fontSize: number;
}

// A more robust parser that can handle chords and inline comments
const parseRichLyrics = (
  line: string
): Array<{ type: 'chord' | 'text' | 'comment'; content: string }> => {
  const regex = /(\[[^\]]+\]|#[^#]+#)/g;
  const parts: Array<{ type: 'chord' | 'text' | 'comment'; content: string }> =
    [];
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(line)) !== null) {
    // Text before the current match
    if (match.index > lastIndex) {
      parts.push({ type: 'text', content: line.substring(lastIndex, match.index) });
    }

    const matchedContent = match[0];
    if (matchedContent.startsWith('[')) {
      parts.push({
        type: 'chord',
        content: matchedContent.substring(1, matchedContent.length - 1),
      });
    } else if (matchedContent.startsWith('#')) {
      parts.push({
        type: 'comment',
        content: matchedContent.substring(1, matchedContent.length - 1),
      });
    }
    lastIndex = regex.lastIndex;
  }

  // Text after the last match
  if (lastIndex < line.length) {
    parts.push({ type: 'text', content: line.substring(lastIndex) });
  }
  
  if (parts.length === 0) {
    return [{ type: 'text', content: line }];
  }

  return parts;
};


export default function LyricLineDisplay({
  line,
  showChords,
  chordColor,
  inlineCommentColor,
  transpose,
  fontWeight,
}: LyricLineDisplayProps) {
  const parsedLine = useMemo(() => parseRichLyrics(line.text), [line.text]);

  const hasChords = useMemo(
    () => parsedLine.some((p) => p.type === 'chord'),
    [parsedLine]
  );
  
  const cleanLyricText = useMemo(
    () =>
      parsedLine
        .filter((p) => p.type === 'text' || p.type === 'comment')
        .map((p) => p.content)
        .join('')
        .trimEnd()
        .trimStart(),
    [parsedLine]
  );


  if (!showChords && !hasChords) {
    return <p style={{ fontWeight }}>{cleanLyricText}</p>;
  }

  return (
    <div className='flex flex-col items-start leading-tight'>
      {/* Chord Line */}
      {showChords && (
        <div
          style={{
            color: chordColor,
          }}
          className="whitespace-pre"
        >
          {parsedLine.map((part, index) => {
             if (part.type === 'chord') {
               const transposed = part.content.split(/(\s*\|\s*)/).map(segment => {
                  if (segment.trim() === '|' || segment.includes('|')) {
                     return segment;
                  }
                  const trimmedSegment = segment.trim();
                  if (trimmedSegment) {
                    return transposeChord(trimmedSegment, transpose);
                  }
                  return segment;
               }).join('');
               return <span key={`chord-${index}`}>{transposed}</span>
             }
             if (part.type === 'text') {
                return <span key={`chord-pad-${index}`} className="invisible" style={{fontWeight}}>{part.content}</span>
             }
             if (part.type === 'comment') {
                return <span key={`chord-pad-${index}`} className="invisible" style={{fontWeight}}>{part.content}</span>
             }
             return null;
          })}
        </div>
      )}

      {/* Lyric Line */}
      <div style={{ fontWeight }} className="whitespace-pre">
        {parsedLine.map((part, index) => {
          if(part.type === 'text') {
            return <span key={`text-${index}`}>{part.content}</span>
          }
          if(part.type === 'comment') {
            return <span key={`comment-${index}`} style={{color: inlineCommentColor}} className="italic">{part.content}</span>
          }
          return null;
        })}
      </div>
    </div>
  );
}
