'use client';

import { useState, useEffect, useRef, useReducer, useCallback, useMemo } from 'react';
import type { Song, LyricLine } from '@/lib/songs';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Play, Pause, Repeat, Minus, Plus, Guitar, Palette, ArrowLeft, Settings, SkipBack, SkipForward } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { Switch } from '@/components/ui/switch';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import Link from 'next/link';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"


type State = {
  isPlaying: boolean;
  currentTime: number;
  currentLineIndex: number;
  isFinished: boolean;
  fontSize: number;
  showChords: boolean;
  chordColor: string;
};

type Action =
  | { type: 'TOGGLE_PLAY' }
  | { type: 'RESTART' }
  | { type: 'SET_TIME'; payload: number }
  | { type: 'TICK'; payload: number }
  | { type: 'SET_LINE'; payload: number }
  | { type: 'FINISH' }
  | { type: 'SET_FONT_SIZE'; payload: number }
  | { type: 'TOGGLE_CHORDS' }
  | { type: 'SET_CHORD_COLOR'; payload: string };

const initialState: State = {
  isPlaying: false,
  currentTime: 0,
  currentLineIndex: -1,
  isFinished: false,
  fontSize: 16,
  showChords: true,
  chordColor: 'hsl(var(--chord-color))',
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
    case 'SET_CHORD_COLOR':
        return { ...state, chordColor: action.payload };
    default:
      return state;
  }
}

const parseLyrics = (line: string): Array<{ chord: string | null; text: string }> => {
    const regex = /\[([^\]]+)\]([^\[]*)/g;
    const parts: Array<{ chord: string | null; text: string }> = [];
    let lastIndex = 0;
    let match;

    while ((match = regex.exec(line)) !== null) {
      if (match.index > lastIndex) {
        parts.push({ chord: null, text: line.substring(lastIndex, match.index) });
      }
      parts.push({ chord: match[1], text: match[2] });
      lastIndex = regex.lastIndex;
    }

    if (lastIndex < line.length) {
      parts.push({ chord: null, text: line.substring(lastIndex) });
    }

    if (parts.length === 0) {
        if(line.trim().startsWith('[')){
            const chordOnlyRegex = /\[([^\]]+)\]/g;
            let chordMatch;
            while((chordMatch = chordOnlyRegex.exec(line)) !== null) {
                parts.push({ chord: chordMatch[1], text: '' });
            }
        }
        if(parts.length === 0){
             parts.push({chord: null, text: line});
        }
    }

    return parts;
};

const LyricLineDisplay = ({ line, showChords, chordColor }: { line: LyricLine; showChords: boolean; chordColor: string; }) => {
    const parsedLine = useMemo(() => parseLyrics(line.text), [line.text]);
    const hasChords = useMemo(() => parsedLine.some(p => p.chord), [parsedLine]);
    const hasText = useMemo(() => parsedLine.some(p => p.text.trim() !== ''), [parsedLine]);

    if (!showChords && !hasText && hasChords) {
        return null;
    }
    
    if (!showChords || !hasChords) {
        return <p>{line.text.replace(/\[[^\]]+\]/g, '')}</p>;
    }
    
    return (
      <div className="flex flex-col items-start leading-tight">
        <div className="flex -mb-1" style={{ color: chordColor }}>
          {parsedLine.map((part, index) => (
            <div key={`chord-container-${index}`} className="flex-shrink-0 relative" style={{paddingRight: part.text ? '0.25em' : '0.5em'}}>
                <span className="font-bold whitespace-pre">{part.chord || ''}</span>
                <span className="text-transparent whitespace-pre">{part.text}</span>
            </div>
          ))}
        </div>
        <div className="flex">
          {parsedLine.map((part, index) => (
            <div key={`text-container-${index}`} className="flex-shrink-0 relative" style={{paddingRight: part.text ? '0.25em' : '0.5em'}}>
              <span className="text-transparent font-bold whitespace-pre">{part.chord || ''}</span>
              <span className="whitespace-pre">{part.text}</span>
            </div>
          ))}
        </div>
      </div>
    );
};

const CHORD_COLOR_OPTIONS = [
    { value: 'hsl(var(--chord-color))' },
    { value: 'hsl(221.2 83.2% 53.3%)' },
    { value: 'hsl(142.1 76.2% 36.3%)' },
    { value: 'hsl(24.6 95% 53.1%)' },
];

export default function LyricPlayer({ song }: { song: Song }) {
  const [state, dispatch] = useReducer(lyricPlayerReducer, initialState);
  const { isPlaying, currentTime, currentLineIndex, isFinished, fontSize, showChords, chordColor } = state;
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lineRefs = useRef<(HTMLLIElement | null)[]>([]);
  const [currentSection, setCurrentSection] = useState<string>('');
  
  const duration = song.lyrics.length > 0 ? song.lyrics[song.lyrics.length - 1].time + 5 : 100;

  const handleSeek = (value: number[]) => {
    dispatch({ type: 'SET_TIME', payload: value[0] });
  };
  
  const handleSkip = (direction: 'forward' | 'backward') => {
    let nextIndex = -1;
    if (direction === 'forward') {
      nextIndex = song.lyrics.findIndex(line => line.time > currentTime);
    } else {
      const prevLineTime = song.lyrics.slice(0, currentLineIndex).reverse().find(line => line.time < currentTime)?.time ?? 0;
      dispatch({ type: 'SET_TIME', payload: prevLineTime });
      return;
    }
    
    if (nextIndex !== -1) {
        dispatch({ type: 'SET_TIME', payload: song.lyrics[nextIndex].time });
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
    if (activeLine) {
        activeLine.scrollIntoView({
            behavior: 'smooth',
            block: 'center'
        });

        // Update current section
        let section = '';
        for (let i = currentLineIndex; i >= 0; i--) {
            const line = song.lyrics[i];
            if (line.text.startsWith('(') && line.text.endsWith(')')) {
                section = line.text.substring(1, line.text.length - 1);
                break;
            }
        }
        setCurrentSection(section);
    }
  }, [currentLineIndex, song.lyrics]);

  return (
    <div className="flex flex-col bg-background h-screen">
      {/* Header Info */}
      <header className="fixed top-0 left-0 right-0 z-10 p-4 bg-background/80 backdrop-blur-sm pointer-events-auto">
        <div className="relative container mx-auto flex items-center justify-center h-10">
           <div className="absolute left-0">
             <Button asChild variant="ghost" size="icon">
              <Link href="/">
                <ArrowLeft />
                <span className="sr-only">Back to Home</span>
              </Link>
            </Button>
           </div>

          <div className="text-center">
              <h1 className="font-headline text-xl font-bold truncate">{song.title}</h1>
              <p className={cn(
                  "font-body text-sm text-muted-foreground transition-opacity duration-300",
                  isPlaying ? 'opacity-0' : 'opacity-100'
              )}>
                  {song.artist}
              </p>
          </div>
          
          <div className="absolute right-0 flex items-center gap-2">
            <div className="flex items-center">
                <Button variant="ghost" size="icon" onClick={() => changeFontSize(-2)} disabled={fontSize <= 16} className="w-8 h-8"><Minus className="h-4 w-4"/></Button>
                <Button variant="ghost" size="icon" onClick={() => changeFontSize(2)} disabled={fontSize >= 48} className="w-8 h-8"><Plus className="h-4 w-4"/></Button>
            </div>
            
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon"><Settings /></Button>
              </SheetTrigger>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle>Display Settings</SheetTitle>
                  <SheetDescription>
                    Adjust how lyrics are displayed on your screen.
                  </SheetDescription>
                </SheetHeader>
                <div className="grid gap-6 py-6">
                    <div className="flex items-center justify-between">
                        <Label htmlFor="show-chords" className="flex items-center gap-3">
                            <Guitar className="h-5 w-5" />
                            <span className="font-medium">Show Chords</span>
                        </Label>
                        <Switch
                            id="show-chords"
                            checked={showChords}
                            onCheckedChange={() => dispatch({ type: 'TOGGLE_CHORDS' })}
                        />
                    </div>
                    <div className="grid gap-4">
                        <Label className="flex items-center gap-3">
                            <Palette className="h-5 w-5" />
                            <span className="font-medium">Chord Color</span>
                        </Label>
                        <RadioGroup 
                            defaultValue={chordColor}
                            onValueChange={(value) => dispatch({ type: 'SET_CHORD_COLOR', payload: value })}
                            className="flex space-x-2"
                        >
                            {CHORD_COLOR_OPTIONS.map((option) => (
                                <Label key={option.value} className="cursor-pointer">
                                    <RadioGroupItem value={option.value} id={`color-${option.value}`} className="sr-only" />
                                    <div 
                                        className="w-8 h-8 rounded-full border-2"
                                        style={{ 
                                            backgroundColor: option.value,
                                            borderColor: chordColor === option.value ? 'hsl(var(--primary))' : 'transparent'
                                        }}>
                                    </div>
                                </Label>
                            ))}
                        </RadioGroup>
                    </div>
                </div>
              </SheetContent>
            </Sheet>

          </div>
        </div>
      </header>
      
      {/* Lyrics Scroll Area */}
      <div className="w-full h-full relative overflow-y-auto">
        {currentSection && (
          <div
            className="fixed left-4 top-1/2 -translate-y-1/2 transition-all duration-300 ease-out z-20 pointer-events-none"
          >
            <div className="bg-primary text-primary-foreground text-xs font-bold py-1 px-3 rounded-full shadow-lg">
              {currentSection}
            </div>
          </div>
        )}
        <ul
            className="w-full px-12 pt-32 pb-56"
            style={{ fontSize: `${fontSize}px` }}
        >
            {song.lyrics.map((line, index) => {
            const parsedLine = parseLyrics(line.text);
            const hasText = parsedLine.some(p => p.text.trim() !== '');
            const hasChords = parsedLine.some(p => p.chord);
            
            const isSectionHeader = line.text.startsWith('(') && line.text.endsWith(')');
            
            if (isSectionHeader) {
                return (
                    <li key={index} ref={el => lineRefs.current[index] = el} className="h-4"></li>
                );
            }

            if (!showChords && !hasText && hasChords) {
                return null;
            }
            const isSectionBreak = !hasText && !hasChords && line.text.trim() === '';

            return (
                <li
                key={index}
                ref={el => lineRefs.current[index] = el}
                className={cn(
                    'rounded-md transition-all duration-300 text-center font-bold flex justify-center items-center',
                    isSectionBreak ? 'h-[1.2em]' : 'min-h-[2.5rem] py-2',
                    index === currentLineIndex
                    ? 'text-foreground scale-105'
                    : 'text-muted-foreground/50'
                )}
                style={{ minHeight: isSectionBreak ? 'auto' : `${fontSize * 1.5}px`}}
                >
                {!isSectionBreak && <LyricLineDisplay line={line} showChords={showChords} chordColor={chordColor} />}
                </li>
            )
            })}
        </ul>
      </div>


      {/* Player Controls - Fixed at bottom */}
      <div className="absolute bottom-0 left-0 right-0 p-4 bg-background/80 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto space-y-4">
            <Slider
              value={[currentTime]}
              max={duration}
              step={0.1}
              onValueChange={handleSeek}
            />
            <div className="flex justify-center items-center w-full gap-2">
              <Button variant="ghost" size="icon" onClick={() => dispatch({type: 'RESTART'})} aria-label="Restart">
                  <Repeat />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => handleSkip('backward')} aria-label="Skip Backward">
                  <SkipBack />
              </Button>
              <Button size="lg" className="bg-primary hover:bg-primary/90 rounded-full w-16 h-16" onClick={() => dispatch({type: 'TOGGLE_PLAY'})} aria-label={isPlaying ? "Pause" : "Play"}>
                  {isPlaying ? <Pause className="w-8 h-8"/> : <Play className="w-8 h-8"/>}
              </Button>
              <Button variant="ghost" size="icon" onClick={() => handleSkip('forward')} aria-label="Skip Forward">
                  <SkipForward />
              </Button>
               <div className="w-10 h-10"></div>
            </div>
        </div>
      </div>
    </div>
  );
}
