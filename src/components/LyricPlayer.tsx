
'use client';

import { useState, useEffect, useRef, useReducer, useCallback, useMemo } from 'react';
import type { Song, LyricLine } from '@/lib/songs';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Play, Pause, Repeat, Minus, Plus, Guitar, Palette, ArrowLeft, Settings, SkipBack, SkipForward, Highlighter, List, Clock, X, Move } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { Switch } from '@/components/ui/switch';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Separator } from '@/components/ui/separator';


type HighlightMode = 'line' | 'section' | 'none';

type State = {
  isPlaying: boolean;
  currentTime: number;
  currentLineIndex: number;
  isFinished: boolean;
  fontSize: number;
  showChords: boolean;
  chordColor: string;
  highlightMode: HighlightMode;
  showSectionNavigator: boolean;
  bpm: number;
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
  | { type: 'SET_CHORD_COLOR'; payload: string }
  | { type: 'SET_HIGHLIGHT_MODE'; payload: HighlightMode }
  | { type: 'TOGGLE_SECTION_NAVIGATOR' }
  | { type: 'SET_BPM'; payload: number };

const initialState: State = {
  isPlaying: false,
  currentTime: 0,
  currentLineIndex: -1,
  isFinished: false,
  fontSize: 16,
  showChords: true,
  chordColor: 'hsl(var(--chord-color))',
  highlightMode: 'line',
  showSectionNavigator: true,
  bpm: 120,
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
    case 'SET_HIGHLIGHT_MODE':
        return { ...state, highlightMode: action.payload };
    case 'TOGGLE_SECTION_NAVIGATOR':
        return { ...state, showSectionNavigator: !state.showSectionNavigator };
    case 'SET_BPM':
        const newBpm = Math.max(40, Math.min(240, action.payload));
        return { ...state, bpm: newBpm };
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
    { name: 'Default', value: 'hsl(var(--chord-color))' },
    { name: 'Blue', value: 'hsl(221.2 83.2% 53.3%)' },
    { name: 'Green', value: 'hsl(142.1 76.2% 36.3%)' },
    { name: 'Orange', value: 'hsl(24.6 95% 53.1%)' },
];

const HIGHLIGHT_OPTIONS: { value: HighlightMode, label: string }[] = [
    { value: 'line', label: 'Line' },
    { value: 'section', label: 'Section' },
    { value: 'none', label: 'None' },
];

// Assuming a "standard" or "default" BPM for normal playback speed (1.0x)
const DEFAULT_BPM_FOR_NORMAL_SPEED = 120;

export default function LyricPlayer({ song }: { song: Song }) {
  const [state, dispatch] = useReducer(lyricPlayerReducer, initialState);
  const { isPlaying, currentTime, currentLineIndex, isFinished, fontSize, showChords, chordColor, highlightMode, showSectionNavigator, bpm } = state;
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const lineRefs = useRef<(HTMLLIElement | null)[]>([]);
  const [currentSectionIndex, setCurrentSectionIndex] = useState<number>(-1);

  // Drag and drop state for section navigator
  const navigatorRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  useEffect(() => {
    // Set initial position on client-side to avoid hydration mismatch
    setPosition({ x: 16, y: window.innerHeight / 2 - 100 });
  }, []);

  const handleDragMouseDown = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    if (navigatorRef.current) {
      setIsDragging(true);
      const rect = navigatorRef.current.getBoundingClientRect();
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
    }
  }, []);

  const handleDragTouchStart = useCallback((e: React.TouchEvent<HTMLButtonElement>) => {
    if (navigatorRef.current) {
      setIsDragging(true);
      const touch = e.touches[0];
      const rect = navigatorRef.current.getBoundingClientRect();
      setDragOffset({
        x: touch.clientX - rect.left,
        y: touch.clientY - rect.top,
      });
    }
  }, []);

  const handleDragMouseUp = useCallback(() => setIsDragging(false), []);
  const handleDragTouchEnd = useCallback(() => setIsDragging(false), []);


  const handleDragMouseMove = useCallback((e: MouseEvent) => {
    if (isDragging) {
      setPosition({
        x: e.clientX - dragOffset.x,
        y: e.clientY - dragOffset.y,
      });
    }
  }, [isDragging, dragOffset]);

  const handleDragTouchMove = useCallback((e: TouchEvent) => {
    if (isDragging) {
      const touch = e.touches[0];
      setPosition({
        x: touch.clientX - dragOffset.x,
        y: touch.clientY - dragOffset.y,
      });
    }
  }, [isDragging, dragOffset]);
  
  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleDragMouseMove);
      window.addEventListener('mouseup', handleDragMouseUp);
      window.addEventListener('touchmove', handleDragTouchMove);
      window.addEventListener('touchend', handleDragTouchEnd);
    } else {
      window.removeEventListener('mousemove', handleDragMouseMove);
      window.removeEventListener('mouseup', handleDragMouseUp);
      window.removeEventListener('touchmove', handleDragTouchMove);
      window.removeEventListener('touchend', handleDragTouchEnd);
    }

    return () => {
      window.removeEventListener('mousemove', handleDragMouseMove);
      window.removeEventListener('mouseup', handleDragMouseUp);
      window.removeEventListener('touchmove', handleDragTouchMove);
      window.removeEventListener('touchend', handleDragTouchEnd);
    };
  }, [isDragging, handleDragMouseMove, handleDragMouseUp, handleDragTouchMove, handleDragTouchEnd]);

  
  const duration = song.lyrics.length > 0 ? song.lyrics[song.lyrics.length - 1].time + 5 : 100;

  const playbackRate = useMemo(() => bpm / DEFAULT_BPM_FOR_NORMAL_SPEED, [bpm]);

  const sections = useMemo(() => {
    return song.lyrics
      .map((line, index) => ({...line, originalIndex: index}))
      .filter(line => line.text.startsWith('(') && line.text.endsWith(')'))
      .map((line, index) => ({
          name: line.text.substring(1, line.text.length - 1),
          time: line.time,
          index: line.originalIndex,
          uniqueKey: `${line.text.substring(1, line.text.length - 1)}-${index}`,
      }));
  }, [song.lyrics]);

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

  const handleSectionJump = (time: number) => {
    dispatch({ type: 'SET_TIME', payload: time });
  };

  const changeFontSize = (amount: number) => {
    dispatch({ type: 'SET_FONT_SIZE', payload: fontSize + amount });
  }

  const handleBpmChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10);
    if (!isNaN(value)) {
        dispatch({ type: 'SET_BPM', payload: value });
    }
  };

  useEffect(() => {
    if (isPlaying) {
      const intervalTime = 100 / playbackRate;
      intervalRef.current = setInterval(() => {
        dispatch({ type: 'TICK', payload: 0.1 });
      }, intervalTime);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isPlaying, playbackRate]);

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

  const currentSection = useMemo(() => {
    if (currentLineIndex < 0) return null;
    
    let sectionIdx = -1;
    for (let i = sections.length - 1; i >= 0; i--) {
        if (sections[i].index <= currentLineIndex) {
            sectionIdx = i;
            break;
        }
    }
    
    if (sectionIdx !== -1) {
      const section = sections[sectionIdx];
      return { ...section, numericIndex: sectionIdx };
    }
    return null;
  }, [currentLineIndex, sections]);


  useEffect(() => {
    if(currentSection?.numericIndex !== currentSectionIndex) {
      setCurrentSectionIndex(currentSection?.numericIndex ?? -1);
    }
  }, [currentSection, currentSectionIndex]);

  useEffect(() => {
    if (highlightMode !== 'none') {
        const activeLine = lineRefs.current[currentLineIndex];
        const container = scrollContainerRef.current;
        if (activeLine && container) {
            const containerRect = container.getBoundingClientRect();
            const lineRect = activeLine.getBoundingClientRect();
            const desiredScrollTop = container.scrollTop + (lineRect.top - containerRect.top) - (containerRect.height / 2) + (lineRect.height / 2);

            container.scrollTo({
                top: desiredScrollTop,
                behavior: 'smooth'
            });
        }
    }
  }, [currentLineIndex, highlightMode]);

  return (
    <div className="flex flex-col bg-background h-screen overflow-hidden">
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
          
          <div className="absolute right-0 flex items-center gap-0">
            <div className="flex items-center">
                <Button variant="ghost" size="icon" onClick={() => changeFontSize(-2)} disabled={fontSize <= 16} className="w-8 h-8"><Minus className="h-4 w-4"/></Button>
                <Button variant="ghost" size="icon" onClick={() => changeFontSize(2)} disabled={fontSize >= 48} className="w-8 h-8"><Plus className="h-4 w-4"/></Button>
            </div>
            
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon"><Settings /></Button>
              </SheetTrigger>
              <SheetContent className="w-[380px] sm:w-[540px]">
                <SheetHeader>
                  <SheetTitle>Player Settings</SheetTitle>
                  <SheetDescription>
                    Customize your lyric viewing experience.
                  </SheetDescription>
                </SheetHeader>
                <div className="space-y-6 py-6">
                    <div>
                      <h3 className="text-lg font-medium mb-3">Display</h3>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between rounded-lg border p-3">
                           <div className="flex items-start gap-3">
                              <List className="h-5 w-5 mt-1 text-muted-foreground" />
                              <div>
                                <Label htmlFor="show-section-nav" className="font-semibold">Section Navigator</Label>
                                <p className="text-xs text-muted-foreground">Show the floating section shortcuts.</p>
                              </div>
                           </div>
                           <Switch
                              id="show-section-nav"
                              checked={showSectionNavigator}
                              onCheckedChange={() => dispatch({ type: 'TOGGLE_SECTION_NAVIGATOR' })}
                            />
                        </div>
                        <div className="flex items-center justify-between rounded-lg border p-3">
                           <div className="flex items-start gap-3">
                              <Guitar className="h-5 w-5 mt-1 text-muted-foreground" />
                              <div>
                                <Label htmlFor="show-chords" className="font-semibold">Guitar Chords</Label>
                                <p className="text-xs text-muted-foreground">Display chords above the lyrics.</p>
                              </div>
                           </div>
                           <Switch
                                id="show-chords"
                                checked={showChords}
                                onCheckedChange={() => dispatch({ type: 'TOGGLE_CHORDS' })}
                            />
                        </div>

                         <div className="rounded-lg border p-3 space-y-3">
                           <div className="flex items-start gap-3">
                              <Palette className="h-5 w-5 mt-1 text-muted-foreground" />
                              <div>
                                <Label className="font-semibold">Chord Color</Label>
                                <p className="text-xs text-muted-foreground">Choose a color for the chords.</p>
                              </div>
                           </div>
                           <RadioGroup 
                              value={chordColor}
                              onValueChange={(value) => dispatch({ type: 'SET_CHORD_COLOR', payload: value })}
                              className="flex space-x-2"
                            >
                              {CHORD_COLOR_OPTIONS.map((option) => (
                                <Label key={option.value} className="cursor-pointer">
                                  <RadioGroupItem value={option.value} id={`color-${option.value}`} className="sr-only" />
                                  <div 
                                    className={cn("w-8 h-8 rounded-full border-2", chordColor === option.value ? 'border-primary' : 'border-transparent')}
                                    style={{ backgroundColor: option.value }}
                                    title={option.name}
                                  />
                                </Label>
                              ))}
                            </RadioGroup>
                        </div>
                        
                        <div className="rounded-lg border p-3 space-y-3">
                           <div className="flex items-start gap-3">
                              <Highlighter className="h-5 w-5 mt-1 text-muted-foreground" />
                              <div>
                                <Label className="font-semibold">Highlight Style</Label>
                                <p className="text-xs text-muted-foreground">How to highlight active lyrics.</p>
                              </div>
                           </div>
                           <RadioGroup 
                              value={highlightMode}
                              onValueChange={(value: HighlightMode) => dispatch({ type: 'SET_HIGHLIGHT_MODE', payload: value })}
                              className="grid grid-cols-3 gap-2"
                            >
                                {HIGHLIGHT_OPTIONS.map(option => (
                                    <Label key={option.value} className={cn(
                                      "flex items-center justify-center cursor-pointer rounded-md border p-4 text-sm font-semibold hover:bg-accent hover:text-accent-foreground",
                                      highlightMode === option.value && "border-primary ring-2 ring-primary"
                                    )}>
                                        <RadioGroupItem value={option.value} id={`highlight-${option.value}`} className="sr-only" />
                                        {option.label}
                                    </Label>
                                ))}
                            </RadioGroup>
                        </div>
                      </div>
                    </div>

                    <Separator />

                    <div>
                      <h3 className="text-lg font-medium mb-3">Playback</h3>
                      <div className="rounded-lg border p-3">
                        <div className="flex items-start gap-3">
                            <Clock className="h-5 w-5 mt-1 text-muted-foreground" />
                            <div>
                              <Label htmlFor="bpm-input" className="font-semibold">Playback BPM</Label>
                              <p className="text-xs text-muted-foreground">Adjust the playback speed (beats per minute).</p>
                            </div>
                         </div>
                         <div className="flex items-center gap-2 mt-3">
                             <Button variant="outline" size="icon" onClick={() => dispatch({ type: 'SET_BPM', payload: bpm - 1 })}><Minus className="h-4 w-4"/></Button>
                             <Input
                                id="bpm-input"
                                type="number"
                                value={bpm}
                                onChange={handleBpmChange}
                                min="40"
                                max="240"
                                className="text-center"
                            />
                            <Button variant="outline" size="icon" onClick={() => dispatch({ type: 'SET_BPM', payload: bpm + 1 })}><Plus className="h-4 w-4"/></Button>
                         </div>
                      </div>
                    </div>
                </div>
              </SheetContent>
            </Sheet>

          </div>
        </div>
      </header>
      
      {/* Section Navigator */}
      {showSectionNavigator && (
        <div 
          ref={navigatorRef}
          className="fixed z-20 pointer-events-auto flex flex-col items-center gap-2"
          style={{ top: `${position.y}px`, left: `${position.x}px` }}
        >
          <div className="flex items-center gap-1">
             <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 cursor-grab active:cursor-grabbing bg-transparent text-muted-foreground/60"
                onMouseDown={handleDragMouseDown}
                onTouchStart={handleDragTouchStart}
              >
                <Move className="h-3 w-3" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-6 w-6 bg-transparent text-muted-foreground/60"
                onClick={() => dispatch({ type: 'TOGGLE_SECTION_NAVIGATOR' })}
              >
                  <X className="h-3 w-3"/>
              </Button>
          </div>

          <div className="flex flex-col gap-2">
            {sections.map((section, index) => (
                <button
                    key={section.uniqueKey}
                    onDoubleClick={() => handleSectionJump(section.time)}
                    className={cn(
                        "text-xs font-bold py-1 px-3 rounded-full shadow-md transition-all duration-300",
                        index === currentSectionIndex
                            ? "bg-primary text-primary-foreground" 
                            : "bg-background/40 text-muted-foreground/60 hover:bg-muted/80 hover:text-muted-foreground"
                    )}
                >
                    {section.name}
                </button>
            ))}
          </div>
        </div>
      )}
        
      {/* Lyrics Scroll Area */}
      <div ref={scrollContainerRef} className="w-full h-full relative overflow-y-auto">
        <ul
            className="w-full px-12 pt-32 pb-48"
            style={{ fontSize: `${fontSize}px` }}
        >
            {song.lyrics.map((line, index) => {
            const parsedLine = parseLyrics(line.text);
            const hasText = parsedLine.some(p => p.text.trim() !== '');
            const hasChords = parsedLine.some(p => p.chord);
            
            const isSectionHeader = line.text.startsWith('(') && line.text.endsWith(')');
            
            if (isSectionHeader) {
                return (
                    <li key={index} ref={el => lineRefs.current[index] = el} style={{ height: `calc(${fontSize}px * 0.5)` }}></li>
                );
            }

            if (!showChords && !hasText && hasChords) {
                return null;
            }
            const isSectionBreak = !hasText && !hasChords && line.text.trim() === '';
            
            const lineSection = sections.slice().reverse().find(s => s.index <= index);
            const isLineInCurrentSection = lineSection?.uniqueKey === currentSection?.uniqueKey;

            const isHighlighted = highlightMode !== 'none' && (
              (highlightMode === 'line' && index === currentLineIndex) ||
              (highlightMode === 'section' && isLineInCurrentSection)
            );

            return (
                <li
                key={index}
                ref={el => lineRefs.current[index] = el}
                className={cn(
                    'rounded-md transition-all duration-300 text-center font-bold flex justify-center items-center',
                    isSectionBreak ? 'h-[1.2em]' : 'min-h-[2.5rem] py-2',
                    isHighlighted
                    ? 'text-foreground scale-105'
                    : 'text-muted-foreground/50'
                )}
                style={{ minHeight: isSectionBreak ? 'auto' : `calc(${fontSize}px * 1.5)`}}
                >
                {!isSectionBreak && <LyricLineDisplay line={line} showChords={showChords} chordColor={chordColor} />}
                </li>
            )
            })}
        </ul>
      </div>


      {/* Player Controls - Fixed at bottom */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/80 backdrop-blur-sm pointer-events-auto">
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
