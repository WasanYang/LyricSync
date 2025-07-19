
'use client';

import { useState, useEffect, useRef, useReducer, useCallback, useMemo } from 'react';
import type { Song, LyricLine } from '@/lib/songs';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Play, Pause, Repeat, Minus, Plus, Guitar, Palette, ArrowLeft, Settings, SkipBack, SkipForward, Highlighter, List, Clock, X, Move, Music, RotateCcw } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { Switch } from '@/components/ui/switch';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet"
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { transposeChord, ALL_NOTES } from '@/lib/chords';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"


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
  transpose: number;
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
  | { type: 'SET_BPM'; payload: number }
  | { type: 'SET_TRANSPOSE'; payload: number }
  | { type: 'TRANSPOSE_UP' }
  | { type: 'TRANSPOSE_DOWN' }
  | { type: 'RESET_TRANSPOSE' };

const initialState: State = {
  isPlaying: false,
  currentTime: 0,
  currentLineIndex: -1,
  isFinished: false,
  fontSize: 16,
  showChords: true,
  chordColor: 'hsl(var(--primary))',
  highlightMode: 'line',
  showSectionNavigator: true,
  bpm: 120,
  transpose: 0,
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
    case 'SET_TRANSPOSE':
        return { ...state, transpose: action.payload };
    case 'TRANSPOSE_UP':
        return { ...state, transpose: state.transpose + 1 };
    case 'TRANSPOSE_DOWN':
        return { ...state, transpose: state.transpose - 1 };
    case 'RESET_TRANSPOSE':
        return { ...state, transpose: 0 };
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

const LyricLineDisplay = ({ line, showChords, chordColor, transpose }: { line: LyricLine; showChords: boolean; chordColor: string; transpose: number; }) => {
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
                <span className="font-bold whitespace-pre">{part.chord ? transposeChord(part.chord, transpose) : ''}</span>
                <span className="text-transparent whitespace-pre">{part.text}</span>
            </div>
          ))}
        </div>
        <div className="flex">
          {parsedLine.map((part, index) => (
            <div key={`text-container-${index}`} className="flex-shrink-0 relative" style={{paddingRight: part.text ? '0.25em' : '0.5em'}}>
              <span className="text-transparent font-bold whitespace-pre">{part.chord ? transposeChord(part.chord, transpose) : ''}</span>
              <span className="whitespace-pre">{part.text}</span>
            </div>
          ))}
        </div>
      </div>
    );
};

const CHORD_COLOR_OPTIONS = [
    { name: 'Default', value: 'hsl(var(--primary))' },
    { name: 'Blue', value: 'hsl(221.2 83.2% 53.3%)' },
    { name: 'Green', value: 'hsl(142.1 76.2% 36.3%)' },
    { name: 'Orange', value: 'hsl(24.6 95% 53.1%)' },
];

const HIGHLIGHT_OPTIONS: { value: HighlightMode, label: string }[] = [
    { value: 'line', label: 'Line' },
    { value: 'section', label: 'Section' },
    { value: 'none', label: 'None' },
];

const DEFAULT_BPM_FOR_NORMAL_SPEED = 120;
const ORIGINAL_SONG_KEY_NOTE = 'A'; // Assuming the original key for song ID 4 is A

export default function LyricPlayer({ song }: { song: Song }) {
  const [state, dispatch] = useReducer(lyricPlayerReducer, initialState);
  const { isPlaying, currentTime, currentLineIndex, isFinished, fontSize, showChords, chordColor, highlightMode, showSectionNavigator, bpm, transpose } = state;
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const lineRefs = useRef<(HTMLLIElement | null)[]>([]);
  const [currentSectionIndex, setCurrentSectionIndex] = useState<number>(-1);

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const navigatorRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({ x: 16, y: 150 });
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  useEffect(() => {
    setPosition({ x: 16, y: 150 });
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
  
  const handleKeyChange = (selectedKey: string) => {
    const originalKeyIndex = ALL_NOTES.indexOf(ORIGINAL_SONG_KEY_NOTE);
    const selectedKeyIndex = ALL_NOTES.indexOf(selectedKey);
    if (originalKeyIndex !== -1 && selectedKeyIndex !== -1) {
      let diff = selectedKeyIndex - originalKeyIndex;
      dispatch({ type: 'SET_TRANSPOSE', payload: diff });
    }
  };

  const currentKey = useMemo(() => {
    const originalKeyIndex = ALL_NOTES.indexOf(ORIGINAL_SONG_KEY_NOTE);
    if (originalKeyIndex === -1) return ORIGINAL_SONG_KEY_NOTE;
    const newKeyIndex = (originalKeyIndex + transpose + 12) % 12;
    return ALL_NOTES[newKeyIndex];
  }, [transpose]);


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
  
  const renderSettingsContent = () => {
    return (
      <ScrollArea className="flex-grow" style={{ maxHeight: 'calc(80vh)'}}>
         <SheetTitle className="sr-only">Settings</SheetTitle>
        <div className="p-4 space-y-6 font-normal">
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <List className="h-5 w-5 text-muted-foreground" />
                <Label htmlFor="show-section-nav" className="font-normal">Navigator</Label>
              </div>
              <Switch id="show-section-nav" checked={showSectionNavigator} onCheckedChange={() => dispatch({ type: 'TOGGLE_SECTION_NAVIGATOR' })} />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Guitar className="h-5 w-5 text-muted-foreground" />
                <Label htmlFor="show-chords" className="font-normal">Chords</Label>
              </div>
              <Switch id="show-chords" checked={showChords} onCheckedChange={() => dispatch({ type: 'TOGGLE_CHORDS' })} />
            </div>

            <Separator />
          
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                      <Music className="h-5 w-5 text-muted-foreground" />
                      <Label className="font-normal">Key</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold w-12 text-center text-sm">{transpose > 0 ? `+${transpose}` : transpose}</span>
                    <Select value={currentKey} onValueChange={handleKeyChange}>
                      <SelectTrigger className="w-[100px] h-8">
                        <SelectValue placeholder="Key" />
                      </SelectTrigger>
                      <SelectContent>
                        {ALL_NOTES.map((note) => (
                          <SelectItem key={note} value={note}>{note}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => dispatch({ type: 'RESET_TRANSPOSE' })} disabled={transpose === 0}>
                        <RotateCcw className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                    <Palette className="h-5 w-5 text-muted-foreground" />
                    <Label className="font-normal">Color</Label>
                    </div>
                    <div className="flex items-center justify-start">
                      <RadioGroup value={chordColor} onValueChange={(value) => dispatch({ type: 'SET_CHORD_COLOR', payload: value })} className="flex flex-wrap gap-2 justify-start">
                      {CHORD_COLOR_OPTIONS.map((option) => (
                          <Label key={option.value} className="cursor-pointer">
                          <RadioGroupItem value={option.value} id={`color-${option.value}`} className="sr-only" />
                          <div className={cn("w-5 h-5 rounded-full border-2", chordColor === option.value ? 'border-primary ring-2 ring-primary ring-offset-2 ring-offset-background' : 'border-transparent')} style={{ backgroundColor: option.value }} title={option.name} />
                          </Label>
                      ))}
                      </RadioGroup>
                    </div>
                </div>
            </div>

            <Separator />

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                      <Highlighter className="h-5 w-5 text-muted-foreground" />
                      <Label className="font-normal">Highlight</Label>
                  </div>
                   <RadioGroup value={highlightMode} onValueChange={(value: HighlightMode) => dispatch({ type: 'SET_HIGHLIGHT_MODE', payload: value })} className="grid grid-cols-3 gap-2">
                      {HIGHLIGHT_OPTIONS.map(option => (
                          <Label key={option.value} className={cn("flex h-8 w-16 items-center justify-center cursor-pointer rounded-md border p-1 text-xs hover:bg-accent hover:text-accent-foreground", highlightMode === option.value && "border-primary bg-accent text-accent-foreground")}>
                              <RadioGroupItem value={option.value} id={`highlight-${option.value}`} className="sr-only" />
                              {option.label}
                          </Label>
                      ))}
                  </RadioGroup>
              </div>
              
              <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                      <Clock className="h-5 w-5 text-muted-foreground" />
                      <Label htmlFor="bpm-input" className="font-normal">BPM</Label>
                  </div>
                  <div className="flex items-center gap-2">
                      <Button variant="outline" size="icon" className="h-8 w-8 shrink-0 rounded-full" onClick={() => dispatch({ type: 'SET_BPM', payload: bpm - 1 })}><Minus className="h-4 w-4"/></Button>
                      <Input id="bpm-input" type="number" value={bpm} onChange={handleBpmChange} min="40" max="240" className="text-center font-normal h-8 w-16 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
                      <Button variant="outline" size="icon" className="h-8 w-8 shrink-0 rounded-full" onClick={() => dispatch({ type: 'SET_BPM', payload: bpm + 1 })}><Plus className="h-4 w-4"/></Button>
                  </div>
              </div>
            </div>
        </div>
      </ScrollArea>
    );
  }


  return (
    <div className="flex flex-col bg-background h-screen overflow-hidden">
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
            
            <Sheet open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon"><Settings /></Button>
              </SheetTrigger>
              <SheetContent side="bottom" className="p-0 flex flex-col max-h-[80vh] rounded-t-lg" showCloseButton={false}>
                {renderSettingsContent()}
              </SheetContent>
            </Sheet>

          </div>
        </div>
      </header>
      
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
                {!isSectionBreak && <LyricLineDisplay line={line} showChords={showChords} chordColor={chordColor} transpose={transpose} />}
                </li>
            )
            })}
        </ul>
      </div>


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
