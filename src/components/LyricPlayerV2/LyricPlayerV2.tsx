// src/components/LyricPlayerV2/LyricPlayerV2.tsx
'use client';

import {
  useState,
  useReducer,
  useRef,
  useCallback,
  useEffect,
  useMemo,
} from 'react';
import type { Song } from '@/lib/songs';
import { cn } from '@/lib/utils';
import { transposeChord } from '@/lib/chords';
import { ParsedLyricLine } from './types';
import { parseLyricsV2 } from './parser';
import { Button } from '../ui/button';
import {
  Pause,
  Play,
  Printer,
  Settings,
  Minus,
  Plus,
  LogOut,
} from 'lucide-react';
import { SettingsSheetV2 } from './SettingsSheetV2';
import FloatingSectionNavigator from '../FloatingSectionNavigator';
import { useFloatingNavigator } from '@/hooks/use-floating-navigator';
import { localStorageManager } from '@/lib/local-storage';
import { useTheme } from 'next-themes';
import { useRouter } from 'next/navigation';

interface PlayerState {
  isPlaying: boolean;
  scrollSpeed: number; // 0.1 to 5.0
  transpose: number;
  fontSize: number;
  showChords: boolean;
  chordColor: string;
  showChordHighlights: boolean;
}

type Action =
  | { type: 'TOGGLE_PLAY' }
  | { type: 'SET_SCROLL_SPEED'; payload: number }
  | { type: 'SET_TRANSPOSE'; payload: number }
  | { type: 'SET_FONT_SIZE'; payload: number }
  | { type: 'TOGGLE_CHORDS' }
  | { type: 'SET_CHORD_COLOR'; payload: string }
  | { type: 'TOGGLE_CHORD_HIGHLIGHTS' }
  | { type: 'RESET' };

const getInitialState = (): PlayerState => {
  const prefs = localStorageManager.getUserPreferences();
  return {
    isPlaying: false,
    scrollSpeed: 1.0,
    transpose: 0,
    fontSize: prefs.fontSize || 16,
    showChords: prefs.showChords !== false,
    chordColor: prefs.chordColor || 'hsl(0 0% 0%)',
    showChordHighlights: prefs.showChordHighlights !== false,
  };
};

function playerReducer(state: PlayerState, action: Action): PlayerState {
  switch (action.type) {
    case 'TOGGLE_PLAY':
      return { ...state, isPlaying: !state.isPlaying };
    case 'SET_SCROLL_SPEED':
      const newSpeed = Math.max(0.1, Math.min(5.0, action.payload));
      return { ...state, scrollSpeed: newSpeed };
    case 'SET_TRANSPOSE':
      return { ...state, transpose: action.payload };
    case 'SET_FONT_SIZE':
      localStorageManager.setUserPreferences({ fontSize: action.payload });
      return { ...state, fontSize: action.payload };
    case 'TOGGLE_CHORDS':
      localStorageManager.setUserPreferences({ showChords: !state.showChords });
      return { ...state, showChords: !state.showChords };
    case 'SET_CHORD_COLOR':
      localStorageManager.setUserPreferences({ chordColor: action.payload });
      return { ...state, chordColor: action.payload };
    case 'TOGGLE_CHORD_HIGHLIGHTS':
      localStorageManager.setUserPreferences({
        showChordHighlights: !state.showChordHighlights,
      });
      return { ...state, showChordHighlights: !state.showChordHighlights };
    case 'RESET':
      localStorageManager.resetUserPreferences();
      return getInitialState();
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
  const [state, dispatch] = useReducer(playerReducer, getInitialState());
  const {
    isPlaying,
    scrollSpeed,
    transpose,
    fontSize,
    showChords,
    chordColor,
    showChordHighlights,
  } = state;

  const { theme } = useTheme();
  const router = useRouter();

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const animationFrameId = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  const isAtEndRef = useRef<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const floatingNavigator = useFloatingNavigator();

  const parsedLines = useMemo(() => {
    if (typeof song.lyrics === 'string') {
      return parseLyricsV2(song.lyrics);
    }
    return [];
  }, [song.lyrics]);

  const sections = useMemo(() => {
    return parsedLines
      .map((line, index) => ({ ...line, uniqueKey: `${line.type}-${index}` }))
      .filter((line) => line.type === 'section')
      .map((line, index) => ({
        name: line.content,
        index: parsedLines.findIndex((l) => l.uniqueKey === line.uniqueKey), // Use the original index
        uniqueKey: line.uniqueKey,
        startTime: 0,
      }));
  }, [parsedLines]);

  const handleTogglePlay = useCallback(() => {
    if (isAtEndRef.current) {
      if (scrollContainerRef.current) scrollContainerRef.current.scrollTop = 0;
      isAtEndRef.current = false;
    }
    dispatch({ type: 'TOGGLE_PLAY' });
  }, []);

  const scroll = useCallback(
    (timestamp: number) => {
      if (!lastTimeRef.current) {
        lastTimeRef.current = timestamp;
      }
      const deltaTime = timestamp - lastTimeRef.current;
      lastTimeRef.current = timestamp;

      if (scrollContainerRef.current) {
        const container = scrollContainerRef.current;
        const scrollAmount = (deltaTime / 50) * scrollSpeed;
        container.scrollTop += scrollAmount;
        if (
          container.scrollTop >=
          container.scrollHeight - container.clientHeight - 1 // Add a 1px buffer
        ) {
          cancelAnimationFrame(animationFrameId.current);
          handleTogglePlay(); // Call the separate toggle function
          isAtEndRef.current = true;
          return; // Stop the animation loop
        }
      }
      animationFrameId.current = requestAnimationFrame(scroll);
    },
    [scrollSpeed, handleTogglePlay]
  );

  useEffect(() => {
    if (isPlaying) {
      lastTimeRef.current = 0; // Reset time on play
      animationFrameId.current = requestAnimationFrame(scroll);
    } else {
      cancelAnimationFrame(animationFrameId.current);
    }
    return () => cancelAnimationFrame(animationFrameId.current);
  }, [isPlaying, scroll]);

  const handleSectionJump = (sectionIndex: number) => {
    if (!scrollContainerRef.current) return;
    const section = sections.find((s) => s.index === sectionIndex);
    if (section) {
      const element = document.getElementById(section.uniqueKey);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  };

  const handleBack = () => {
    if (onClose) {
      onClose();
    } else {
      router.back();
    }
  };

  const renderLine = (line: ParsedLyricLine, index: number) => {
    const key = `${line.type}-${index}`;
    if (line.type === 'section') {
      return (
        <p
          key={key}
          id={key}
          className='pt-4 pb-2 text-sm font-bold uppercase tracking-wide'
        >
          [ {line.content} ]
        </p>
      );
    }

    if (line.type === 'lyrics') {
      return (
        <p key={key} className='font-body'>
          {line.content}
        </p>
      );
    }

    if (line.type === 'chords' && showChords) {
      const transposedChords = line.content.replace(
        /\[([^\]]+)\]/g,
        (match, chord) => `[${transposeChord(chord, transpose)}]`
      );
      return (
        <p
          key={key}
          className='font-bold whitespace-pre-wrap font-code'
          style={{ color: chordColor }}
        >
          {transposedChords.split(/(\s+)/).map((part, i) =>
            /\[.*?\]/.test(part) ? (
              <span
                key={i}
                className={cn(
                  'inline-block rounded-sm px-1 py-0.5',
                  showChordHighlights &&
                    (theme === 'dark'
                      ? 'bg-primary/20'
                      : 'bg-primary/10 text-primary-foreground')
                )}
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
      return <div key={key} className='h-4' />;
    }

    return null;
  };

  const Controls = () => (
    <div
      className={cn(
        'flex items-center justify-between gap-2 p-2 border-t',
        theme === 'dark'
          ? 'bg-black border-gray-800'
          : 'bg-white border-gray-200'
      )}
    >
      <div className='flex items-center gap-2'>
        <Button
          onClick={handleTogglePlay}
          className={cn(
            'h-10 rounded-md font-semibold flex items-center gap-2',
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
        <div
          className={cn(
            'flex items-center gap-1 rounded-md p-1 border h-10',
            'bg-white border-gray-300'
          )}
        >
          <Button
            variant='ghost'
            size='icon'
            className='h-8 w-8 rounded-md'
            onClick={() =>
              dispatch({ type: 'SET_SCROLL_SPEED', payload: scrollSpeed - 0.1 })
            }
          >
            <Minus className='h-4 w-4' />
          </Button>
          <span className='w-12 text-center text-sm font-semibold'>
            {scrollSpeed.toFixed(1)}x
          </span>
          <Button
            variant='ghost'
            size='icon'
            className='h-8 w-8 rounded-md'
            onClick={() =>
              dispatch({ type: 'SET_SCROLL_SPEED', payload: scrollSpeed + 0.1 })
            }
          >
            <Plus className='h-4 w-4' />
          </Button>
        </div>
        <div
          className={cn(
            'flex items-center gap-1 rounded-md p-1 border h-10',
            'bg-white border-gray-300'
          )}
        >
          <Button
            variant='ghost'
            size='icon'
            className='h-8 w-8 rounded-md'
            onClick={() =>
              dispatch({ type: 'SET_TRANSPOSE', payload: transpose - 1 })
            }
          >
            <Minus className='h-4 w-4' />
          </Button>
          <span className='w-12 text-center text-sm font-semibold'>
            Key {transpose >= 0 ? `+${transpose}` : transpose}
          </span>
          <Button
            variant='ghost'
            size='icon'
            className='h-8 w-8 rounded-md'
            onClick={() =>
              dispatch({ type: 'SET_TRANSPOSE', payload: transpose + 1 })
            }
          >
            <Plus className='h-4 w-4' />
          </Button>
        </div>
      </div>
      <div className='flex items-center'>
        <Button
          variant='ghost'
          size='icon'
          onClick={() => window.print()}
          aria-label='Print'
        >
          <Printer className='h-5 w-5' />
        </Button>
        <Button
          variant='ghost'
          size='icon'
          onClick={() => setIsSettingsOpen(true)}
        >
          <Settings className='h-5 w-5' />
        </Button>
      </div>
    </div>
  );

  return (
    <div
      className={cn(
        'flex flex-col h-full overflow-hidden print:bg-white print:text-black',
        theme === 'dark' ? 'bg-black text-white' : 'bg-white text-black'
      )}
    >
      <FloatingSectionNavigator
        sections={sections}
        currentSection={null}
        onSectionJump={handleSectionJump}
        onClose={floatingNavigator.toggleVisibility}
        isVisible={floatingNavigator.isVisible}
      />

      <div
        ref={scrollContainerRef}
        className='flex-grow w-full overflow-y-scroll scroll-smooth'
      >
        <div
          className='max-w-2xl mx-auto text-lg leading-relaxed px-4 pb-32 print:pb-4'
          style={{ fontSize: `${fontSize}px` }}
        >
          <div className='mb-4 pt-4 print:hidden'>
            <h1 className='font-headline text-2xl font-bold'>{song.title}</h1>
            <div
              className={cn(
                'text-md',
                theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
              )}
            >
              {song.artist && <div>{song.artist}</div>}
              {song.originalKey && <div>Key: {song.originalKey}</div>}
            </div>
          </div>
          {parsedLines.map(renderLine)}
        </div>
      </div>

      {showControls && (
        <div className='sticky bottom-0 left-0 right-0 z-10 print:hidden'>
          <div
            className={cn(
              'flex items-center justify-between gap-2 p-2 border-t',
              theme === 'dark'
                ? 'bg-black border-gray-800'
                : 'bg-white border-gray-200'
            )}
          >
            <div className='w-10'>
              <Button
                variant='ghost'
                size='icon'
                className='h-10 w-10'
                onClick={handleBack}
              >
                <LogOut className='h-5 w-5' />
              </Button>
            </div>
            <div className='flex items-center gap-2'>
              <Button
                onClick={handleTogglePlay}
                className={cn(
                  'h-10 rounded-md font-semibold flex items-center gap-2',
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
              <div
                className={cn(
                  'flex items-center gap-1 rounded-md p-1 border h-10',
                  'bg-white border-gray-300'
                )}
              >
                <Button
                  variant='ghost'
                  size='icon'
                  className='h-8 w-8 rounded-md'
                  onClick={() =>
                    dispatch({
                      type: 'SET_SCROLL_SPEED',
                      payload: scrollSpeed - 0.1,
                    })
                  }
                >
                  <Minus className='h-4 w-4' />
                </Button>
                <span className='w-12 text-center text-sm font-semibold text-black'>
                  {scrollSpeed.toFixed(1)}x
                </span>
                <Button
                  variant='ghost'
                  size='icon'
                  className='h-8 w-8 rounded-md'
                  onClick={() =>
                    dispatch({
                      type: 'SET_SCROLL_SPEED',
                      payload: scrollSpeed + 0.1,
                    })
                  }
                >
                  <Plus className='h-4 w-4' />
                </Button>
              </div>
              <div
                className={cn(
                  'flex items-center gap-1 rounded-md p-1 border h-10',
                  'bg-white border-gray-300'
                )}
              >
                <Button
                  variant='ghost'
                  size='icon'
                  className='h-8 w-8 rounded-md'
                  onClick={() =>
                    dispatch({
                      type: 'SET_TRANSPOSE',
                      payload: transpose - 1,
                    })
                  }
                >
                  <Minus className='h-4 w-4' />
                </Button>
                <span className='w-12 text-center text-sm font-semibold text-black'>
                  Key {transpose >= 0 ? `+${transpose}` : transpose}
                </span>
                <Button
                  variant='ghost'
                  size='icon'
                  className='h-8 w-8 rounded-md'
                  onClick={() =>
                    dispatch({
                      type: 'SET_TRANSPOSE',
                      payload: transpose + 1,
                    })
                  }
                >
                  <Plus className='h-4 w-4' />
                </Button>
              </div>
            </div>
            <div className='flex items-center w-10 justify-end'>
              <Button
                variant='ghost'
                size='icon'
                className='h-10 w-10'
                onClick={() => setIsSettingsOpen(true)}
              >
                <Settings className='h-5 w-5' />
              </Button>
            </div>
          </div>
        </div>
      )}

      <SettingsSheetV2
        isOpen={isSettingsOpen}
        onOpenChange={setIsSettingsOpen}
        fontSize={fontSize}
        showChords={showChords}
        chordColor={chordColor}
        showChordHighlights={showChordHighlights}
        dispatch={dispatch}
      />
    </div>
  );
}
