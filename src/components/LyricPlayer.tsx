
'use client';

import { useState, useEffect, useRef, useReducer, useCallback, useMemo } from 'react';
import type { Song, LyricLine } from '@/lib/songs';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Play, Pause, SkipBack, SkipForward, Repeat, Settings, Minus, Plus, Guitar } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { Switch } from '@/components/ui/switch';

type State = {
  isPlaying: boolean;
  currentTime: number;
  currentLineIndex: number;
  isFinished: boolean;
  fontSize: number;
  showChords: boolean;
};

type Action =
  | { type: 'TOGGLE_PLAY' }
  | { type: 'RESTART' }
  | { type: 'SET_TIME'; payload: number }
  | { type: 'TICK'; payload: number }
  | { type: 'SET_LINE'; payload: number }
  | { type: 'FINISH' }
  | { type: 'SET_FONT_SIZE'; payload: number }
  | { type: 'TOGGLE_CHORDS' };

const initialState: State = {
  isPlaying: false,
  currentTime: 0,
  currentLineIndex: -1,
  isFinished: false,
  fontSize: 24,
  showChords: true,
};

function lyricPlayerReducer(state: State, action: Action): State {
  switch (action.type) {
    case 'TOGGLE_PLAY':
      return { ...state, isPlaying: !state.isPlaying, isFinished: false };
    case 'RESTART':
      return { ...state, currentTime: 0, currentLineIndex: -1, isPlaying: true, isFinished: false };
    case 'SET_TIME':
      return { ...state, currentTime: action.payload };
    case 'TICK':
      return { ...state, currentTime: state.currentTime + action.payload };
    case 'SET_LINE':
      return { ...state, currentLineIndex: action.payload };
    case 'FINISH':
      return { ...state, isPlaying: false, isFinished: true };
    case 'SET_FONT_SIZE':
        const newSize = Math.max(16, Math.min(48, action.payload));
        return { ...state, fontSize: newSize };
    case 'TOGGLE_CHORDS':
        return { ...state, showChords: !state.showChords };
    default:
      return state;
  }
}

const parseLyrics = (line: string): Array<{ chord: string | null; text: string }> => {
    const regex = /\[([^\]]+)\]([^\[]*)/g;
    const parts: Array<{ chord: string | null; text: string }> = [];
    let lastIndex = 0;
    let match;

    if (line.trim().startsWith('[') && line.trim().endsWith(']')) {
        const chordsOnly = line.replace(/\[/g, ' ').replace(/\]/g, '  ').trim();
        if (!chordsOnly.includes(' ')) {
             parts.push({ chord: chordsOnly, text: '' });
             return parts;
        }
    }


    // Handle initial text before the first chord
    const firstChordMatch = line.match(/\[/);
    if (firstChordMatch && firstChordMatch.index! > 0) {
        parts.push({ chord: null, text: line.substring(0, firstChordMatch.index) });
        lastIndex = firstChordMatch.index!;
    } else if (!firstChordMatch) {
      // No chords in the line at all
      parts.push({ chord: null, text: line });
      return parts;
    }

    while ((match = regex.exec(line)) !== null) {
        parts.push({ chord: match[1], text: match[2] });
        lastIndex = match.index + match[0].length;
    }
    
    // If there's remaining text after the last chord
    if (lastIndex < line.length) {
        parts.push({ chord: null, text: line.substring(lastIndex) });
    }

    // If the line had no chords at all, the above logic results in one part with the whole line.
    return parts.length > 0 ? parts : [{ chord: null, text: line }];
};

const LyricLineDisplay = ({ line, showChords }: { line: LyricLine; showChords: boolean }) => {
    const parsedLine = useMemo(() => parseLyrics(line.text), [line.text]);
    const hasChords = useMemo(() => parsedLine.some(p => p.chord), [parsedLine]);

    if (!showChords || !hasChords) {
        return <p>{line.text.replace(/\[[^\]]+\]/g, '')}</p>;
    }

    return (
        <div className="whitespace-pre-wrap">
            {parsedLine.map((part, index) => (
                <div key={index} className="relative inline-block leading-tight align-bottom mb-4">
                   <span className="absolute bottom-full left-0 text-accent font-bold whitespace-pre">
                        {part.chord}
                    </span>
                    <span>{part.text}</span>
                </div>
            ))}
        </div>
    );
};

export default function LyricPlayer({ song }: { song: Song }) {
  const [state, dispatch] = useReducer(lyricPlayerReducer, initialState);
  const { isPlaying, currentTime, currentLineIndex, isFinished, fontSize, showChords } = state;
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lineRefs = useRef<(HTMLLIElement | null)[]>([]);
  const scrollContainerRef = useRef<HTMLUListElement | null>(null);

  const duration = song.lyrics.length > 0 ? song.lyrics[song.lyrics.length - 1].time + 5 : 100;

  const handleSeek = (value: number[]) => {
    dispatch({ type: 'SET_TIME', payload: value[0] });
  };
  
  const handleSkip = (direction: 'forward' | 'backward') => {
    const nextIndex = direction === 'forward' ? currentLineIndex + 1 : currentLineIndex - 1;
    if (nextIndex >= 0 && nextIndex < song.lyrics.length) {
        dispatch({ type: 'SET_TIME', payload: song.lyrics[nextIndex].time });
    } else if (direction === 'backward' && nextIndex < 0) {
        dispatch({ type: 'SET_TIME', payload: 0 });
    }
  };

  const changeFontSize = (amount: number) => {
    dispatch({ type: 'SET_FONT_SIZE', payload: fontSize + amount });
  }

  useEffect(() => {
    if (isPlaying) {
      intervalRef.current = setInterval(() => {
        dispatch({ type: 'TICK', payload: 0.1 });
      }, 100);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isPlaying]);

  useEffect(() => {
    const newCurrentLineIndex = song.lyrics.findIndex(line => line.time > currentTime) - 1;
    if (song.lyrics.length > 0 && currentTime > 0 && newCurrentLineIndex === -2) {
      dispatch({ type: 'SET_LINE', payload: song.lyrics.length - 1 });
    } else if (newCurrentLineIndex !== currentLineIndex) {
      dispatch({ type: 'SET_LINE', payload: newCurrentLineIndex });
    }

    if (currentTime >= duration) {
      dispatch({ type: 'FINISH' });
    }
  }, [currentTime, song.lyrics, currentLineIndex, duration]);

  useEffect(() => {
    const activeLine = lineRefs.current[currentLineIndex];
    const container = scrollContainerRef.current;
    if (activeLine && container) {
      const containerRect = container.getBoundingClientRect();
      const lineRect = activeLine.getBoundingClientRect();
      const scrollOffset = lineRect.top - containerRect.top - containerRect.height / 2 + lineRect.height / 2;
      
      container.scrollTo({
        top: container.scrollTop + scrollOffset,
        behavior: 'smooth',
      });
    }
  }, [currentLineIndex]);

  return (
    <div className="w-full h-full flex flex-col">
      {/* Header Info */}
      <div className="text-center pt-16 md:pt-4 mb-4 flex-shrink-0">
        <h1 className="font-headline text-3xl font-bold">{song.title}</h1>
        <p className="font-body text-lg text-muted-foreground">{song.artist}</p>
      </div>

      {/* Lyrics Scroll Area */}
      <ul
        ref={scrollContainerRef}
        className="flex-grow w-full overflow-y-auto scroll-smooth px-4"
        style={{ fontSize: `${fontSize}px`}}
      >
        {song.lyrics.map((line, index) => (
          <li
            key={index}
            ref={el => lineRefs.current[index] = el}
            className={cn(
              'rounded-md transition-all duration-300 text-center font-bold',
               'min-h-[1.5em]', // Ensure consistent line height even for empty lines
              index === currentLineIndex
                ? 'text-foreground scale-105'
                : 'text-muted-foreground/50'
            )}
            style={{
                paddingTop: showChords && line.text.includes('[') ? '1em' : '0',
                marginBottom: '0.8rem',
            }}
          >
             <LyricLineDisplay line={line} showChords={showChords} />
          </li>
        ))}
      </ul>

      {/* Player Controls - Fixed at bottom */}
      <div className="w-full max-w-4xl mx-auto space-y-4 p-4 flex-shrink-0">
        <Slider
          value={[currentTime]}
          max={duration}
          step={0.1}
          onValueChange={handleSeek}
        />
        <div className="flex justify-between items-center w-full">
          <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" onClick={() => handleSkip('backward')} aria-label="Skip Backward">
                  <SkipBack />
              </Button>
              <Button size="lg" className="bg-primary hover:bg-primary/90 rounded-full w-16 h-16" onClick={() => dispatch({type: 'TOGGLE_PLAY'})} aria-label={isPlaying ? "Pause" : "Play"}>
                  {isPlaying ? <Pause className="w-8 h-8"/> : <Play className="w-8 h-8"/>}
              </Button>
               <Button variant="ghost" size="icon" onClick={() => handleSkip('forward')} aria-label="Skip Forward">
                  <SkipForward />
              </Button>
               <Button variant="ghost" size="icon" onClick={() => dispatch({type: 'RESTART'})} aria-label="Restart">
                  <Repeat />
              </Button>
          </div>
          
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Settings">
                <Settings />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-60" side="top" align="end">
              <div className="grid gap-4">
                <div className="space-y-2">
                  <h4 className="font-medium font-headline leading-none">Settings</h4>
                  <p className="text-sm text-muted-foreground">
                    Adjust lyric display.
                  </p>
                </div>
                <div className="grid gap-2">
                    <div className="flex items-center justify-between">
                        <Label htmlFor="show-chords" className="flex items-center gap-2">
                            <Guitar className="h-4 w-4" />
                            Show Chords
                        </Label>
                        <Switch
                            id="show-chords"
                            checked={showChords}
                            onCheckedChange={() => dispatch({ type: 'TOGGLE_CHORDS' })}
                        />
                    </div>
                    <Label htmlFor="font-size">Font Size</Label>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="icon" onClick={() => changeFontSize(-2)} disabled={fontSize <= 16}><Minus className="h-4 w-4" /></Button>
                        <span className="font-mono text-sm w-8 text-center">{fontSize}px</span>
                        <Button variant="outline" size="icon" onClick={() => changeFontSize(2)} disabled={fontSize >= 48}><Plus className="h-4 w-4" /></Button>
                    </div>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>
    </div>
  );
}

    