
// src/components/LyricPlayer.tsx
'use client';

import { useState, useEffect, useReducer, useCallback, useMemo, useRef } from 'react';
import type { Song, LyricLine } from '@/lib/songs';
import { Button } from '@/components/ui/button';
import { Play, Pause, Repeat, Minus, Plus, Guitar, Palette, ArrowLeft, Settings, SkipBack, SkipForward, Highlighter, List, X, Move, Music, RotateCcw, Sun, Moon, ChevronRight, Text, CaseSensitive, ListMusic, ChevronUp, ChevronDown } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { Switch } from '@/components/ui/switch';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { ScrollArea } from '@/components/ui/scroll-area';
import { transposeChord, ALL_NOTES } from '@/lib/chords';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';


type HighlightMode = 'line' | 'section' | 'none';
type FontWeight = 400 | 600 | 700;


type State = {
  isPlaying: boolean;
  currentTime: number;
  currentBarIndex: number;
  isFinished: boolean;
  fontSize: number;
  fontWeight: FontWeight;
  showChords: boolean;
  chordColor: string;
  highlightMode: HighlightMode;
  showSectionNavigator: boolean;
  bpm: number;
  transpose: number;
};

type Action =
  | { type: 'TOGGLE_PLAY' }
  | { type: 'SET_TIME'; payload: number }
  | { type: 'SET_BAR'; payload: number }
  | { type: 'FINISH' }
  | { type: 'RESET' }
  | { type: 'SET_FONT_SIZE'; payload: number }
  | { type: 'SET_FONT_WEIGHT'; payload: FontWeight }
  | { type: 'TOGGLE_CHORDS' }
  | { type: 'SET_CHORD_COLOR'; payload: string }
  | { type: 'SET_HIGHLIGHT_MODE'; payload: HighlightMode }
  | { type: 'TOGGLE_SECTION_NAVIGATOR' }
  | { type: 'SET_TRANSPOSE'; payload: number }
  | { type: 'TRANSPOSE_UP' }
  | { type: 'TRANSPOSE_DOWN' }
  | { type: 'RESET_TRANSPOSE' }
  | { type: 'SET_BPM'; payload: number }
  | { type: 'RESET_PLAYER_STATE'; payload: { bpm: number | undefined } };


const initialState: State = {
  isPlaying: false,
  currentTime: 0,
  currentBarIndex: 0,
  isFinished: false,
  fontSize: 16,
  fontWeight: 400,
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
      if (state.isFinished) {
        return { ...state, isPlaying: true, isFinished: false, currentTime: 0, currentBarIndex: 0 };
      }
      return { ...state, isPlaying: !state.isPlaying };
    case 'SET_TIME':
      return { ...state, currentTime: action.payload };
    case 'SET_BAR':
      return { ...state, currentBarIndex: action.payload };
    case 'FINISH':
      return { ...state, isPlaying: false, isFinished: true };
    case 'RESET':
        return { ...state, isPlaying: false, isFinished: false, currentTime: 0, currentBarIndex: 0 };
    case 'SET_FONT_SIZE':
        const newSize = Math.max(16, Math.min(48, action.payload));
        return { ...state, fontSize: newSize };
    case 'SET_FONT_WEIGHT':
        return { ...state, fontWeight: action.payload };
    case 'TOGGLE_CHORDS':
        return { ...state, showChords: !state.showChords };
    case 'SET_CHORD_COLOR':
        return { ...state, chordColor: action.payload };
    case 'SET_HIGHLIGHT_MODE':
        return { ...state, highlightMode: action.payload };
    case 'TOGGLE_SECTION_NAVIGATOR':
        return { ...state, showSectionNavigator: !state.showSectionNavigator };
    case 'SET_TRANSPOSE':
        return { ...state, transpose: action.payload };
    case 'TRANSPOSE_UP':
        return { ...state, transpose: state.transpose + 1 };
    case 'TRANSPOSE_DOWN':
        return { ...state, transpose: state.transpose - 1 };
    case 'RESET_TRANSPOSE':
        return { ...state, transpose: 0 };
    case 'SET_BPM':
        return { ...state, bpm: action.payload };
    case 'RESET_PLAYER_STATE':
        return {...initialState, transpose: state.transpose, bpm: action.payload.bpm || initialState.bpm};
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

const LyricLineDisplay = ({ line, showChords, chordColor, transpose, fontWeight }: { line: LyricLine; showChords: boolean; chordColor: string; transpose: number; fontWeight: FontWeight; }) => {
    const parsedLine = useMemo(() => parseLyrics(line.text), [line.text]);
    const hasChords = useMemo(() => parsedLine.some(p => p.chord), [parsedLine]);
    const hasText = useMemo(() => parsedLine.some(p => p.text.trim() !== ''), [parsedLine]);

    if (!showChords && !hasText && hasChords) {
        return null;
    }
    
    if (!showChords || !hasChords) {
        return <p style={{ fontWeight }}>{line.text.replace(/\[[^\]]+\]/g, '')}</p>;
    }
    
    return (
      <div className="flex flex-col items-start leading-tight">
        <div className="flex -mb-1" style={{ color: chordColor }}>
          {parsedLine.map((part, index) => (
            <div key={`chord-container-${index}`} className="flex-shrink-0 relative" style={{paddingRight: part.text ? '0.25em' : '0.5em'}}>
                <span className="font-bold whitespace-pre">{part.chord ? transposeChord(part.chord, transpose) : ''}</span>
                <span className="text-transparent whitespace-pre" style={{ fontWeight }}>{part.text}</span>
            </div>
          ))}
        </div>
        <div className="flex">
          {parsedLine.map((part, index) => (
            <div key={`text-container-${index}`} className="flex-shrink-0 relative" style={{paddingRight: part.text ? '0.25em' : '0.5em'}}>
              <span className="text-transparent font-bold whitespace-pre">{part.chord ? transposeChord(part.chord, transpose) : ''}</span>
              <span className="whitespace-pre" style={{ fontWeight }}>{part.text}</span>
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

const FONT_WEIGHT_OPTIONS: { value: FontWeight; label: string; style: React.CSSProperties }[] = [
    { value: 400, label: 'A', style: { fontWeight: 400 } },
    { value: 600, label: 'A', style: { fontWeight: 600 } },
    { value: 700, label: 'A', style: { fontWeight: 700 } },
];

interface LyricPlayerProps {
    song: Song;
    isSetlistMode?: boolean;
    onNextSong?: () => void;
    onPrevSong?: () => void;
    isNextDisabled?: boolean;
    isPrevDisabled?: boolean;
    onClose?: () => void;
}

export default function LyricPlayer({ 
    song, 
    isSetlistMode = false,
    onNextSong,
    onPrevSong,
    isNextDisabled,
    isPrevDisabled,
    onClose
}: LyricPlayerProps) {
  const router = useRouter();
  const [state, dispatch] = useReducer(lyricPlayerReducer, initialState);
  const { isPlaying, currentTime, currentBarIndex, isFinished, fontSize, fontWeight, showChords, chordColor, highlightMode, showSectionNavigator, bpm, transpose } = state;
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const lineRefs = useRef<(HTMLLIElement | null)[]>([]);

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isChordsSettingsOpen, setIsChordsSettingsOpen] = useState(false);
  const [isDisplaySettingsOpen, setIsDisplaySettingsOpen] = useState(false);

  const navigatorRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({ x: 16, y: 150 });
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  const [theme, setThemeState] = useState<'light' | 'dark'>('light');

  const uniqueLyrics = useMemo(() => {
    const unique: (LyricLine & { originalIndex: number })[] = [];
    const seenBars = new Set<number>();
    song.lyrics.forEach((line, index) => {
      if (line.bar > 0 && !seenBars.has(line.bar)) {
        unique.push({ ...line, originalIndex: index });
        seenBars.add(line.bar);
      } else if (line.text.startsWith('(')) {
        unique.push({ ...line, originalIndex: index });
      }
    });
    return unique.sort((a,b) => a.bar - b.bar || a.originalIndex - b.originalIndex);
  }, [song.lyrics]);

  const totalDuration = useMemo(() => {
    if (!bpm || bpm === 0 || uniqueLyrics.length === 0) return 100;
    const lastBar = Math.max(...uniqueLyrics.map(l => l.bar));
    const timeSignatureBeats = song.timeSignature ? parseInt(song.timeSignature.split('/')[0]) : 4;
    return (lastBar * timeSignatureBeats * 60) / bpm;
  }, [bpm, uniqueLyrics, song.timeSignature]);

  useEffect(() => {
    dispatch({ type: 'RESET_PLAYER_STATE', payload: { bpm: song.bpm } });
    if (isSetlistMode) {
      setPosition({ x: 16, y: 150 });
    }
  }, [song.id, song.bpm, isSetlistMode]);
  
  useEffect(() => {
    const isDarkMode = document.documentElement.classList.contains('dark');
    setThemeState(isDarkMode ? 'dark' : 'light');
  }, []);

  useEffect(() => {
    document.documentElement.classList[theme === 'dark' ? 'add' : 'remove']('dark');
  }, [theme]);

  const toggleTheme = () => {
    setThemeState(prevTheme => prevTheme === 'dark' ? 'light' : 'dark');
  };

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

  const sections = useMemo(() => {
    return song.lyrics
      .map((line, index) => ({...line, originalIndex: index}))
      .filter(line => line.text.startsWith('(') && line.text.endsWith(')'))
      .map((line, index) => ({
          name: line.text.substring(1, line.text.length - 1),
          bar: line.bar,
          index: line.originalIndex,
          uniqueKey: `${line.text.substring(1, line.text.length - 1)}-${index}`,
      }));
  }, [song.lyrics]);

  const currentLine = useMemo(() => uniqueLyrics[currentBarIndex], [uniqueLyrics, currentBarIndex]);
  
  const currentSection = useMemo(() => {
    if (!sections || sections.length === 0 || !currentLine) {
      return null;
    }
    return sections.slice().reverse().find(s => s.bar <= currentLine.bar);
  }, [currentLine, sections]);

  useEffect(() => {
    if (isPlaying) {
      intervalRef.current = setInterval(() => {
        dispatch({ type: 'SET_TIME', payload: currentTime + 0.1 });
      }, 100);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isPlaying, currentTime]);

  useEffect(() => {
    if (currentTime >= totalDuration) {
      dispatch({ type: 'FINISH' });
    } else {
      const timePerBeat = 60 / bpm;
      const timeSignatureBeats = song.timeSignature ? parseInt(song.timeSignature.split('/')[0], 10) : 4;
      const timePerBar = timePerBeat * timeSignatureBeats;
      
      const currentBarNumber = Math.floor(currentTime / timePerBar) + 1;

      const newIndex = uniqueLyrics.findIndex(l => l.bar >= currentBarNumber && !l.text.startsWith('('));
      
      if (newIndex !== -1 && newIndex !== currentBarIndex) {
        dispatch({ type: 'SET_BAR', payload: newIndex });
      }
    }
  }, [currentTime, bpm, totalDuration, uniqueLyrics, currentBarIndex, song.timeSignature]);
  
  const scrollToLine = useCallback((index: number) => {
    if (highlightMode === 'none') return;
    const activeLine = lineRefs.current[index];
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
  }, [highlightMode]);

  useEffect(() => {
    scrollToLine(currentBarIndex);
  }, [currentBarIndex, scrollToLine]);

  const handleSliderChange = (value: number[]) => {
    const newTime = value[0];
    dispatch({ type: 'SET_TIME', payload: newTime });

    const timePerBeat = 60 / bpm;
    const timeSignatureBeats = song.timeSignature ? parseInt(song.timeSignature.split('/')[0], 10) : 4;
    const timePerBar = timePerBeat * timeSignatureBeats;
    const currentBarNumber = Math.floor(newTime / timePerBar) + 1;
    const newIndex = uniqueLyrics.findIndex(l => l.bar >= currentBarNumber && !l.text.startsWith('('));

    if (newIndex !== -1) {
      dispatch({ type: 'SET_BAR', payload: newIndex });
    }
  };
  
  const handleSetBar = useCallback((index: number) => {
    if (index >= 0 && index < uniqueLyrics.length) {
      const targetLine = uniqueLyrics[index];
      const timePerBeat = 60 / bpm;
      const timeSignatureBeats = song.timeSignature ? parseInt(song.timeSignature.split('/')[0], 10) : 4;
      const timePerBar = timePerBeat * timeSignatureBeats;
      const newTime = (targetLine.bar -1) * timePerBar;
      
      dispatch({ type: 'SET_TIME', payload: newTime });
      dispatch({ type: 'SET_BAR', payload: index });
      scrollToLine(index);
    }
  }, [uniqueLyrics, bpm, song.timeSignature, scrollToLine]);

  const handleNextBar = useCallback(() => {
    handleSetBar(currentBarIndex + 1);
  }, [currentBarIndex, handleSetBar]);

  const handlePrevBar = useCallback(() => {
    handleSetBar(currentBarIndex - 1);
  }, [currentBarIndex, handleSetBar]);

  const handleSectionJump = (bar: number) => {
    const targetIndex = uniqueLyrics.findIndex(l => l.bar >= bar && !l.text.startsWith('('));
    if (targetIndex !== -1) {
      handleSetBar(targetIndex);
    }
  };

  const changeFontSize = (amount: number) => {
    dispatch({ type: 'SET_FONT_SIZE', payload: fontSize + amount });
  }
  
  const handleKeyChange = (selectedKey: string) => {
    const originalKeyIndex = ALL_NOTES.indexOf(song.originalKey || 'C');
    const selectedKeyIndex = ALL_NOTES.indexOf(selectedKey);
    if (originalKeyIndex !== -1 && selectedKeyIndex !== -1) {
      let diff = selectedKeyIndex - originalKeyIndex;
      if (diff > 6) diff -= 12;
      if (diff < -6) diff += 12;
      dispatch({ type: 'SET_TRANSPOSE', payload: diff });
    }
  };

  const currentKey = useMemo(() => {
    const originalKeyIndex = ALL_NOTES.indexOf(song.originalKey || 'C');
    if (originalKeyIndex === -1) return song.originalKey || 'C';
    const newKeyIndex = (originalKeyIndex + transpose + 12*10) % 12;
    return ALL_NOTES[newKeyIndex];
  }, [transpose, song.originalKey]);

  const handleOpenSubmenu = (setter: React.Dispatch<React.SetStateAction<boolean>>) => {
    setIsSettingsOpen(false);
    setTimeout(() => {
      setter(true);
    }, 150);
  };
  
  const handleCloseSubmenu = (setter: React.Dispatch<React.SetStateAction<boolean>>) => {
    setter(false);
    setTimeout(() => {
      setIsSettingsOpen(true);
    }, 150);
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <>
      <div className="flex flex-col bg-background h-full overflow-hidden">
        { !isSetlistMode && (
           <header className="fixed top-0 left-0 right-0 z-10 bg-background/80 backdrop-blur-sm pointer-events-auto">
              <div className="relative container mx-auto flex items-center justify-between h-14">
                <div className="flex-1 flex justify-start">
                    {onClose ? (
                      <Button variant="ghost" size="icon" onClick={onClose}>
                          <ArrowLeft />
                          <span className="sr-only">Close Preview</span>
                      </Button>
                    ) : (
                      <Button variant="ghost" size="icon" onClick={() => router.back()}>
                        <ArrowLeft />
                        <span className="sr-only">Back</span>
                      </Button>
                    )}
                </div>

                <div className="flex-1 text-center min-w-0">
                    <h1 className="font-headline text-xl font-bold truncate">{song.title}</h1>
                </div>
              
                <div className="flex-1 flex justify-end items-center gap-0">
                   {/* This space is intentionally left blank to balance the header */}
                </div>
              </div>
          </header>
        )}
        
        {showSectionNavigator && sections.length > 0 && (
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
                      onClick={() => handleSectionJump(section.bar)}
                      className={cn(
                          "text-xs font-bold py-1 px-3 rounded-full shadow-md transition-all duration-300",
                          section.uniqueKey === currentSection?.uniqueKey
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
              className={cn(
                  "w-full px-4 md:px-12",
                  isSetlistMode ? "pt-8 pb-32" : "pt-20 pb-48 md:pb-24"
              )}
              style={{ fontSize: `${fontSize}px` }}
          >
              {uniqueLyrics.map((line, index) => {
              const parsedLine = parseLyrics(line.text);
              const hasText = parsedLine.some(p => p.text.trim() !== '');
              const hasChords = parsedLine.some(p => p.chord);
              
              const isSectionHeader = line.text.startsWith('(') && line.text.endsWith(')');
              
              if (isSectionHeader) {
                  return (
                      <li key={`${song.id}-${line.originalIndex}-header`} ref={el => lineRefs.current[index] = el} className="pt-4 pb-2 text-center">
                          <p className="text-muted-foreground italic uppercase tracking-wider" style={{fontSize: `calc(${fontSize}px * 0.8)`}}>{line.text.substring(1, line.text.length - 1)}</p>
                      </li>
                  );
              }

              if (!showChords && !hasText && hasChords) {
                  return null;
              }
              const isSectionBreak = !hasText && !hasChords && line.text.trim() === '';
              
              const lineSection = sections.slice().reverse().find(s => s.index <= line.originalIndex);
              const isLineInCurrentSection = lineSection?.uniqueKey === currentSection?.uniqueKey;

              const isHighlighted = highlightMode !== 'none' && (
                (highlightMode === 'line' && index === currentBarIndex) ||
                (highlightMode === 'section' && isLineInCurrentSection)
              );

              return (
                  <li
                  key={`${song.id}-${line.originalIndex}`}
                  ref={el => lineRefs.current[index] = el}
                  className={cn(
                      'rounded-md transition-all duration-300 text-center flex justify-center items-center',
                      isSectionBreak ? 'h-[1.2em]' : 'min-h-[2.5rem] py-2',
                      isHighlighted
                      ? 'text-foreground scale-105'
                      : 'text-muted-foreground/40',
                      fontWeight === 400 && 'font-normal',
                      fontWeight === 600 && 'font-semibold',
                      fontWeight === 700 && 'font-bold'
                  )}
                  style={{ minHeight: isSectionBreak ? 'auto' : `calc(${fontSize}px * 1.5)`}}
                  >
                  {!isSectionBreak && <LyricLineDisplay line={line} showChords={showChords} chordColor={chordColor} transpose={transpose} fontWeight={fontWeight} />}
                  </li>
              )
              })}
          </ul>
        </div>


        <div className={cn("fixed bottom-0 left-0 right-0 pointer-events-none", isSetlistMode && "bottom-16")}>
          <div className="bg-background/50 backdrop-blur-sm pointer-events-auto py-2">
              <div className="max-w-4xl mx-auto space-y-2 px-4">
                  <div className="flex items-center gap-4">
                    <span className="text-xs font-mono w-10 text-center">{formatTime(currentTime)}</span>
                    <Slider
                      value={[currentTime]}
                      max={totalDuration}
                      step={0.1}
                      onValueChange={handleSliderChange}
                    />
                    <span className="text-xs font-mono w-10 text-center">{formatTime(totalDuration)}</span>
                  </div>
                  <div className="relative flex justify-center items-center w-full gap-4 h-12">
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 flex items-center">
                        <span className="text-xs font-bold text-muted-foreground">{bpm} BPM</span>
                      </div>
                      <Button variant="ghost" size="icon" onClick={handlePrevBar} disabled={currentBarIndex <= 0}>
                        <SkipBack />
                      </Button>
                      <Button variant="outline" size="icon" className="w-12 h-12 rounded-full" onClick={() => dispatch({ type: 'TOGGLE_PLAY' })}>
                          {isFinished ? <Repeat className="h-6 w-6"/> : (isPlaying ? <Pause className="h-6 w-6"/> : <Play className="h-6 w-6"/>)}
                      </Button>
                      <Button variant="ghost" size="icon" onClick={handleNextBar} disabled={currentBarIndex >= uniqueLyrics.length -1}>
                        <SkipForward />
                      </Button>
                      <div className="absolute right-0 top-1/2 -translate-y-1/2 flex items-center">
                          <Button variant="ghost" size="icon" onClick={() => dispatch({ type: 'RESET' })}>
                              <RotateCcw className="h-4 w-4" />
                          </Button>
                          <Sheet open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
                            <SheetTrigger asChild>
                                <Button variant="ghost" size="icon"><Settings /></Button>
                            </SheetTrigger>
                            <SheetContent 
                                side="bottom" 
                                className="p-0 flex flex-col max-h-[80vh] rounded-t-lg bg-background/95 backdrop-blur-sm" 
                                showCloseButton={false}
                                onOpenAutoFocus={(e) => e.preventDefault()}
                            >
                                <SheetHeader className="p-2 pb-0 text-left">
                                    <SheetTitle className="sr-only">Settings</SheetTitle>
                                </SheetHeader>
                                <ScrollArea className="flex-grow">
                                <div className="p-4 space-y-4">
                                    <button onClick={() => handleOpenSubmenu(setIsDisplaySettingsOpen)} className="w-full flex items-center justify-between py-2 text-left">
                                        <div className="flex items-center gap-4">
                                            <Text className="h-5 w-5 text-muted-foreground" />
                                            <Label className="cursor-pointer">Display</Label>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                        </div>
                                    </button>
                                    <button onClick={() => handleOpenSubmenu(setIsChordsSettingsOpen)} className="w-full flex items-center justify-between py-2 text-left">
                                        <div className="flex items-center gap-4">
                                            <Guitar className="h-5 w-5 text-muted-foreground" />
                                            <Label className="cursor-pointer">Chords</Label>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                        </div>
                                    </button>
                                    <div className="flex items-center justify-between py-2">
                                        <div className="flex items-center gap-4">
                                            <ListMusic className="h-5 w-5 text-muted-foreground" />
                                            <Label htmlFor="show-section-nav">Navigator</Label>
                                        </div>
                                        <Switch id="show-section-nav" checked={showSectionNavigator} onCheckedChange={() => dispatch({ type: 'TOGGLE_SECTION_NAVIGATOR' })} />
                                    </div>
                                    <div className="flex items-center justify-between py-2">
                                        <div className="flex items-center gap-4">
                                            <Highlighter className="h-5 w-5 text-muted-foreground" />
                                            <Label>Highlight</Label>
                                        </div>
                                        <RadioGroup value={highlightMode} onValueChange={(value: HighlightMode) => dispatch({ type: 'SET_HIGHLIGHT_MODE', payload: value })} className="flex items-center gap-1">
                                            {HIGHLIGHT_OPTIONS.map(option => (
                                                <Label key={option.value} className={cn("flex h-7 w-14 items-center justify-center cursor-pointer rounded-md border text-xs hover:bg-accent hover:text-accent-foreground", highlightMode === option.value && "border-primary bg-primary/10 text-primary")}>
                                                    <RadioGroupItem value={option.value} id={`highlight-${option.value}`} className="sr-only" />
                                                    {option.label}
                                                </Label>
                                            ))}
                                        </RadioGroup>
                                    </div>
                                    <div className="flex items-center justify-between py-2">
                                        <div className="flex items-center gap-4">
                                            {theme === 'dark' ? <Moon className="h-5 w-5 text-muted-foreground" /> : <Sun className="h-5 w-5 text-muted-foreground" />}
                                            <Label htmlFor="dark-mode">Theme</Label>
                                        </div>
                                        <Switch id="dark-mode" checked={theme === 'dark'} onCheckedChange={toggleTheme} />
                                    </div>
                                </div>
                                </ScrollArea>
                            </SheetContent>
                          </Sheet>
                      </div>
                  </div>
              </div>
          </div>
        </div>
      </div>

      <Sheet open={isChordsSettingsOpen} onOpenChange={setIsChordsSettingsOpen}>
          <SheetContent
              side="bottom" 
              className="p-0 flex flex-col max-h-[80vh] rounded-t-lg bg-background/95 backdrop-blur-sm"
              showCloseButton={false}
              onOpenAutoFocus={(e) => e.preventDefault()}
          >
              <SheetHeader className="p-2 pb-0 text-left">
                  <SheetTitle className="sr-only">Chord Settings</SheetTitle>
                  <div className="flex items-center h-[36px]">
                      <Button variant="ghost" size="icon" onClick={() => handleCloseSubmenu(setIsChordsSettingsOpen)} className="h-8 w-8">
                          <ArrowLeft className="h-4 w-4" />
                      </Button>
                  </div>
              </SheetHeader>
              <ScrollArea className="flex-grow">
                  <div className="p-4 space-y-4">
                      <div className="flex items-center justify-between py-2">
                          <Label htmlFor="show-chords">Show Chords</Label>
                          <Switch id="show-chords" checked={showChords} onCheckedChange={() => dispatch({ type: 'TOGGLE_CHORDS' })} />
                      </div>
                      <div className="space-y-4 pl-0">
                          <div className="flex items-center justify-between">
                              <Label className="text-muted-foreground">Key</Label>
                              <div className="flex items-center gap-2">
                                  <span className="font-bold w-12 text-center text-sm">{transpose !== 0 ? `${transpose > 0 ? '+' : ''}${transpose}` : 'Original'}</span>
                                  <Select value={currentKey} onValueChange={handleKeyChange}>
                                      <SelectTrigger className="w-[80px] h-8 text-xs">
                                          <SelectValue placeholder="Key" />
                                      </SelectTrigger>
                                      <SelectContent>
                                          {ALL_NOTES.map((note) => (
                                              <SelectItem key={note} value={note} className="text-xs">{note}</SelectItem>
                                          ))}
                                      </SelectContent>
                                  </Select>
                                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => dispatch({ type: 'RESET_TRANSPOSE' })} disabled={transpose === 0}>
                                      <RotateCcw className="h-4 w-4" />
                                  </Button>
                              </div>
                          </div>
                          <div className="flex items-center justify-between">
                              <Label className="text-muted-foreground">BPM</Label>
                               <div className="flex items-center gap-2">
                                    <Button variant="outline" size="icon" onClick={() => dispatch({ type: 'SET_BPM', payload: bpm - 5 })} className="w-8 h-8"><Minus className="h-4 w-4"/></Button>
                                    <Input 
                                      type="number" 
                                      className="w-16 h-8 text-center" 
                                      value={bpm} 
                                      onChange={(e) => dispatch({ type: 'SET_BPM', payload: parseInt(e.target.value, 10) || bpm })}
                                    />
                                    <Button variant="outline" size="icon" onClick={() => dispatch({ type: 'SET_BPM', payload: bpm + 5 })} className="w-8 h-8"><Plus className="h-4 w-4"/></Button>
                               </div>
                          </div>
                          <div className="flex items-center justify-between">
                              <Label className="text-muted-foreground">Color</Label>
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
              </ScrollArea>
          </SheetContent>
      </Sheet>
      
      <Sheet open={isDisplaySettingsOpen} onOpenChange={setIsDisplaySettingsOpen}>
          <SheetContent
              side="bottom" 
              className="p-0 flex flex-col max-h-[80vh] rounded-t-lg bg-background/95 backdrop-blur-sm"
              showCloseButton={false}
              onOpenAutoFocus={(e) => e.preventDefault()}
          >
              <SheetHeader className="p-2 pb-0 text-left">
                  <SheetTitle className="sr-only">Display Settings</SheetTitle>
                  <div className="flex items-center h-[36px]">
                      <Button variant="ghost" size="icon" onClick={() => handleCloseSubmenu(setIsDisplaySettingsOpen)} className="h-8 w-8">
                          <ArrowLeft className="h-4 w-4" />
                      </Button>
                  </div>
              </SheetHeader>
              <ScrollArea className="flex-grow">
                  <div className="p-4 space-y-6">
                      <div className="space-y-2">
                          <Label>Font Size</Label>
                              <div className="flex items-center gap-2">
                              <Button variant="outline" size="icon" onClick={() => changeFontSize(-2)} disabled={fontSize <= 16} className="w-10 h-10"><Minus className="h-4 w-4"/></Button>
                              <div className="flex-grow text-center font-mono text-lg">{fontSize}px</div>
                              <Button variant="outline" size="icon" onClick={() => changeFontSize(2)} disabled={fontSize >= 48} className="w-10 h-10"><Plus className="h-4 w-4"/></Button>
                          </div>
                      </div>
                          <div className="space-y-2">
                          <Label>Font Weight</Label>
                              <RadioGroup value={fontWeight.toString()} onValueChange={(value) => dispatch({ type: 'SET_FONT_WEIGHT', payload: parseInt(value) as FontWeight })} className="grid grid-cols-3 gap-2">
                              {FONT_WEIGHT_OPTIONS.map(option => (
                                  <Label key={option.value} className={cn("flex h-10 items-center justify-center cursor-pointer rounded-md border text-lg hover:bg-accent hover:text-accent-foreground", fontWeight === option.value && "border-primary bg-primary/10 text-primary")}>
                                      <RadioGroupItem value={option.value.toString()} id={`weight-${option.value}`} className="sr-only" />
                                      <span style={option.style}>{option.label}</span>
                                  </Label>
                              ))}
                          </RadioGroup>
                      </div>
                  </div>
              </ScrollArea>
          </SheetContent>
      </Sheet>
    </>
  );
}
