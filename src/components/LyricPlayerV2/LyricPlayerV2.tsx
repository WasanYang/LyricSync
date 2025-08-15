// src/components/LyricPlayerV2/LyricPlayerV2.tsx
'use client';

import {
  useState,
  useReducer,
  useRef,
  useCallback,
  useMemo,
  useEffect,
} from 'react';
import type { Song } from '@/lib/songs';
import { cn } from '@/lib/utils';
import { transposeChord } from '@/lib/chords';
import { PlayerControlsV2 } from './PlayerControlsV2';
import { PlayerHeaderV2 } from './PlayerHeaderV2';
import { ParsedLyricLine } from './types';
import { parseLyricsV2 } from './parser';

interface PlayerState {
  isPlaying: boolean;
  scrollSpeed: number; // 0.1 to 2.0
  transpose: number;
}

type Action =
  | { type: 'TOGGLE_PLAY' }
  | { type: 'SET_SCROLL_SPEED'; payload: number }
  | { type: 'SET_TRANSPOSE'; payload: number }
  | { type: 'RESET' };

const initialState: PlayerState = {
  isPlaying: false,
  scrollSpeed: 1.0,
  transpose: 0,
};

function playerReducer(state: PlayerState, action: Action): PlayerState {
  switch (action.type) {
    case 'TOGGLE_PLAY':
      return { ...state, isPlaying: !state.isPlaying };
    case 'SET_SCROLL_SPEED':
      return { ...state, scrollSpeed: action.payload };
    case 'SET_TRANSPOSE':
      return { ...state, transpose: action.payload };
    case 'RESET':
      return { ...initialState, scrollSpeed: state.scrollSpeed }; // Keep speed setting on reset
    default:
      return state;
  }
}

interface LyricPlayerV2Props {
  song: Song;
  onClose?: () => void;
  showControls?: boolean;
}

export function LyricPlayerV2({
  song,
  onClose,
  showControls = true,
}: LyricPlayerV2Props) {
  const [state, dispatch] = useReducer(playerReducer, initialState);
  const { isPlaying, scrollSpeed, transpose } = state;

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const animationFrameId = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  const isAtEndRef = useRef<boolean>(false);

  const parsedLines = useMemo(() => {
    if (typeof song.lyrics === 'string') {
      return parseLyricsV2(song.lyrics);
    }
    // Handle old format for backward compatibility if needed, otherwise return empty.
    return [];
  }, [song.lyrics]);

  const scroll = useCallback(
    (timestamp: number) => {
      if (!lastTimeRef.current) {
        lastTimeRef.current = timestamp;
      }

      const deltaTime = timestamp - lastTimeRef.current;
      lastTimeRef.current = timestamp;

      if (scrollContainerRef.current) {
        const container = scrollContainerRef.current;
        const scrollAmount = (deltaTime / 100) * scrollSpeed;
        container.scrollTop += scrollAmount;

        if (
          container.scrollTop >=
          container.scrollHeight - container.clientHeight
        ) {
          dispatch({ type: 'TOGGLE_PLAY' }); // Stop playing
          isAtEndRef.current = true;
        }
      }

      if (isPlaying) {
        animationFrameId.current = requestAnimationFrame(scroll);
      }
    },
    [isPlaying, scrollSpeed]
  );

  useEffect(() => {
    if (isPlaying) {
      animationFrameId.current = requestAnimationFrame(scroll);
    } else {
      cancelAnimationFrame(animationFrameId.current);
      lastTimeRef.current = 0;
    }

    return () => cancelAnimationFrame(animationFrameId.current);
  }, [isPlaying, scroll]);

  const handleTogglePlay = () => {
    if (isAtEndRef.current) {
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTop = 0;
      }
      isAtEndRef.current = false;
    }
    dispatch({ type: 'TOGGLE_PLAY' });
  };

  const handleTranspose = (amount: number) => {
    dispatch({ type: 'SET_TRANSPOSE', payload: transpose + amount });
  };

  const renderLine = (line: ParsedLyricLine, index: number) => {
    if (line.type === 'section') {
      return (
        <p
          key={index}
          className='pt-4 pb-2 text-sm font-bold text-muted-foreground uppercase tracking-wide'
        >
          {line.content}
        </p>
      );
    }

    if (line.type === 'lyrics') {
      return <p key={index}>{line.content}</p>;
    }

    if (line.type === 'chords') {
      const transposedChords = line.content.replace(
        /\[([^\]]+)\]/g,
        (match, chord) => {
          return `[${transposeChord(chord, transpose)}]`;
        }
      );

      return (
        <p key={index} className='font-bold text-primary whitespace-pre-wrap'>
          {transposedChords.split(/(\s+)/).map((part, i) =>
            /\[.*?\]/.test(part) ? (
              <span
                key={i}
                className='inline-block bg-muted/50 text-foreground rounded-sm px-1 py-0.5 mx-1'
              >
                {part.slice(1, -1)}
              </span>
            ) : (
              <span key={i}>{part}</span>
            )
          )}
        </p>
      );
    }

    if (line.type === 'empty') {
      return <div key={index} className='h-4' />;
    }

    return null;
  };

  return (
    <div className='flex flex-col h-full overflow-hidden'>
      <PlayerHeaderV2
        title={song.title}
        artist={song.artist}
        onClose={onClose}
      />
      <div
        ref={scrollContainerRef}
        className='flex-grow w-full overflow-y-scroll scroll-smooth px-4 pt-4 pb-32'
      >
        <div className='max-w-2xl mx-auto font-mono text-lg leading-relaxed'>
          {parsedLines.map(renderLine)}
        </div>
      </div>

      {showControls && (
        <PlayerControlsV2
          isPlaying={isPlaying}
          scrollSpeed={scrollSpeed}
          onTogglePlay={handleTogglePlay}
          onSpeedChange={(val) =>
            dispatch({ type: 'SET_SCROLL_SPEED', payload: val })
          }
          onTranspose={handleTranspose}
        />
      )}
    </div>
  );
}
