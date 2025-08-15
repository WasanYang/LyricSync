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
import { PlayerHeaderV2 } from './PlayerHeaderV2';
import { ParsedLyricLine } from './types';
import { parseLyricsV2 } from './parser';
import { Separator } from '../ui/separator';
import { Button } from '../ui/button';
import { Pause, Play } from 'lucide-react';
import { Slider } from '../ui/slider';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { motion, AnimatePresence } from 'framer-motion';

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
  const headerRef = useRef<HTMLDivElement>(null);
  const [isScrolled, setIsScrolled] = useState(false);

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
    const container = scrollContainerRef.current;
    if (!container || !headerRef.current) return;

    const handleScroll = () => {
      const headerHeight = headerRef.current?.offsetHeight || 0;
      if (container.scrollTop > headerHeight) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, []);

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
        <p key={index} className='font-bold whitespace-pre-wrap'>
          {transposedChords.split(/(\s+)/).map((part, i) =>
            /\[.*?\]/.test(part) ? (
              <span
                key={i}
                className='inline-block bg-[#e7e7e7] text-black rounded-sm px-1 py-0.5'
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

  const Controls = ({ isSticky = false }: { isSticky?: boolean }) => (
    <div
      className={cn(
        'flex items-center justify-start gap-2 py-4',
        isSticky
          ? 'px-4 bg-background/80 backdrop-blur-sm border-b'
          : 'bg-transparent'
      )}
    >
      <Button
        onClick={handleTogglePlay}
        className={cn(
          'rounded-full font-semibold flex items-center gap-2',
          'bg-emerald-500 hover:bg-emerald-600 text-white'
        )}
      >
        {isPlaying ? (
          <Pause className='h-4 w-4' />
        ) : (
          <Play className='h-4 w-4' />
        )}
        Autoscroll
      </Button>
      <Popover>
        <PopoverTrigger asChild>
          <Button variant='outline' className='rounded-full font-semibold'>
            Speed: {scrollSpeed.toFixed(1)}x
          </Button>
        </PopoverTrigger>
        <PopoverContent className='w-40 p-2'>
          <Slider
            value={[scrollSpeed]}
            min={0.1}
            max={2}
            step={0.1}
            onValueChange={(value) =>
              dispatch({ type: 'SET_SCROLL_SPEED', payload: value[0] })
            }
          />
        </PopoverContent>
      </Popover>
    </div>
  );

  return (
    <div className='flex flex-col h-full overflow-hidden'>
      <PlayerHeaderV2
        title={song.title}
        artist={song.artist}
        onClose={onClose}
        showControls={showControls}
      />
      <div
        ref={scrollContainerRef}
        className='flex-grow w-full overflow-y-scroll scroll-smooth'
      >
        <AnimatePresence>
          {isScrolled && showControls && (
            <motion.div
              className='fixed top-14 left-0 right-0 z-10'
              initial={{ y: -100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -100, opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Controls isSticky />
            </motion.div>
          )}
        </AnimatePresence>
        <div className='max-w-2xl mx-auto font-mono text-lg leading-relaxed px-4'>
          <div ref={headerRef}>
            <div className='mb-4 pt-4'>
              <h1 className='font-headline text-2xl font-bold'>{song.title}</h1>
              <div className='text-md text-muted-foreground'>
                {song.artist && <span>{song.artist}</span>}
                {song.artist && song.originalKey && <span> • </span>}
                {song.originalKey && <span>Key: {song.originalKey}</span>}
              </div>
              <Separator className='my-2' />
            </div>
            {showControls && <Controls />}
          </div>
          {parsedLines.map(renderLine)}
        </div>
      </div>
    </div>
  );
}
