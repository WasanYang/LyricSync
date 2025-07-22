// src/components/LyricPlayer.tsx
'use client';

import {
  useState,
  useEffect,
  useReducer,
  useCallback,
  useMemo,
  useRef,
} from 'react';
import type { Song, LyricLine } from '@/lib/songs';
import { Button } from '@/components/ui/button';
import {
  Play,
  Pause,
  Repeat,
  Minus,
  Plus,
  Guitar,
  Palette,
  ArrowLeft,
  Settings,
  SkipBack,
  SkipForward,
  Highlighter,
  List,
  X,
  Move,
  Music,
  RotateCcw,
  Sun,
  Moon,
  ChevronRight,
  Text,
  CaseSensitive,
  ListMusic,
  ChevronUp,
  ChevronDown,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { Switch } from '@/components/ui/switch';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { transposeChord, ALL_NOTES } from '@/lib/chords';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Separator } from './ui/separator';

type HighlightMode = 'line' | 'section' | 'none';
type FontWeight = 400 | 600 | 700;

type State = {
  isPlaying: boolean;
  currentTime: number;
  currentLineIndex: number;
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
  | { type: 'SET_LINE_INDEX'; payload: number }
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
  currentLineIndex: 0,
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
        return {
          ...state,
          isPlaying: true,
          isFinished: false,
          currentTime: 0,
          currentLineIndex: 0,
        };
      }
      return { ...state, isPlaying: !state.isPlaying };
    case 'SET_TIME':
      return { ...state, currentTime: action.payload };
    case 'SET_LINE_INDEX':
      return { ...state, currentLineIndex: action.payload };
    case 'FINISH':
      return { ...state, isPlaying: false, isFinished: true };
    case 'RESET':
      return {
        ...state,
        isPlaying: false,
        isFinished: false,
        currentTime: 0,
        currentLineIndex: 0,
      };
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
      return {
        ...initialState,
        transpose: state.transpose,
        bpm: action.payload.bpm || initialState.bpm,
        showSectionNavigator: true, // always show on reset
      };
    default:
      return state;
  }
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

const LyricLineDisplay = ({
  line,
  showChords,
  chordColor,
  transpose,
  fontWeight,
  fontSize,
}: {
  line: LyricLine;
  showChords: boolean;
  chordColor: string;
  transpose: number;
  fontWeight: FontWeight;
  fontSize: number;
}) => {
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
    <div className='flex flex-col items-start leading-tight'>
      {/* Chord Line */}
      <div
        className='-mb-1'
        style={{
          color: chordColor,
          fontSize: `calc(${fontSize}px - 2px)`,
          marginBottom: '-1px',
        }}
      >
        {parsedLine.map((part, index) => (
          <span key={`chord-${index}`} className='whitespace-pre'>
            <span>
              {part.chord
                ? transposeChord(part.chord, transpose).replace(/\|/g, ' | ')
                : ''}
            </span>
            <span className='text-transparent' style={{ fontWeight }}>
              {part.text}
            </span>
          </span>
        ))}
      </div>
      {/* Lyric Line */}
      <div style={{ fontWeight }}>{cleanLyricText}</div>
    </div>
  );
};

const HIGHLIGHT_OPTIONS: { value: HighlightMode; label: string }[] = [
  { value: 'line', label: 'Line' },
  { value: 'section', label: 'Section' },
  { value: 'none', label: 'None' },
];

const FONT_WEIGHT_OPTIONS: {
  value: FontWeight;
  label: string;
  style: React.CSSProperties;
}[] = [
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

type ProcessedLyricLine = LyricLine & {
    originalIndex: number;
    startTimeSeconds: number;
    endTimeSeconds: number;
}

export default function LyricPlayer({
  song,
  isSetlistMode = false,
  onNextSong,
  onPrevSong,
  isNextDisabled,
  isPrevDisabled,
  onClose,
}: LyricPlayerProps) {
  const router = useRouter();
  const [state, dispatch] = useReducer(lyricPlayerReducer, initialState);
  const {
    isPlaying,
    currentTime,
    currentLineIndex,
    isFinished,
    fontSize,
    fontWeight,
    showChords,
    chordColor,
    highlightMode,
    showSectionNavigator,
    bpm,
    transpose,
  } = state;
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const lineRefs = useRef<(HTMLLIElement | null)[]>([]);

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const navigatorRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({ x: 16, y: 150 }); // x is now right offset
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  const [theme, setThemeState] = useState<'light' | 'dark'>('light');

  const { processedLyrics, totalDuration } = useMemo(() => {
    let cumulativeTime = 0;
    const currentBpm = typeof bpm === 'number' && bpm > 0 ? bpm : 120;
    const timeSignature = song.timeSignature || '4/4';
    const timeSignatureBeats = parseInt(timeSignature.split('/')[0], 10) || 4;
    const secondsPerMeasure = (60 / currentBpm) * timeSignatureBeats;

    const lyricsWithTiming = song.lyrics
        .map((line, index) => {
            const startTimeSeconds = cumulativeTime;
            const durationSeconds = line.measures * secondsPerMeasure;
            cumulativeTime += durationSeconds;
            const endTimeSeconds = cumulativeTime;
            
            return {
                ...line,
                originalIndex: index,
                startTimeSeconds,
                endTimeSeconds
            };
        });
    
    return {
        processedLyrics: lyricsWithTiming,
        totalDuration: cumulativeTime,
    };
  }, [song.lyrics, bpm, song.timeSignature]);

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
    document.documentElement.classList[theme === 'dark' ? 'add' : 'remove'](
      'dark'
    );
  }, [theme]);

  const toggleTheme = () => {
    setThemeState((prevTheme) => (prevTheme === 'dark' ? 'light' : 'dark'));
  };

  const handleDragMouseDown = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
        if (navigatorRef.current) {
            setIsDragging(true);
            const rect = navigatorRef.current.getBoundingClientRect();
            // Calculate offset from the right edge
            setDragOffset({
                x: window.innerWidth - e.clientX - rect.width,
                y: e.clientY - rect.top
            });
        }
    },
    []
);

const handleDragTouchStart = useCallback(
    (e: React.TouchEvent<HTMLButtonElement>) => {
        if (navigatorRef.current) {
            setIsDragging(true);
            const touch = e.touches[0];
            const rect = navigatorRef.current.getBoundingClientRect();
             // Calculate offset from the right edge
            setDragOffset({
                x: window.innerWidth - touch.clientX - rect.width,
                y: touch.clientY - rect.top
            });
        }
    },
    []
);

const handleDragMouseUp = useCallback(() => setIsDragging(false), []);
const handleDragTouchEnd = useCallback(() => setIsDragging(false), []);

const handleDragMouseMove = useCallback(
    (e: MouseEvent) => {
        if (isDragging && navigatorRef.current) {
             const newRight = window.innerWidth - e.clientX - dragOffset.x;
            setPosition({
                x: newRight,
                y: e.clientY - dragOffset.y,
            });
        }
    },
    [isDragging, dragOffset]
);

const handleDragTouchMove = useCallback(
    (e: TouchEvent) => {
        if (isDragging && navigatorRef.current) {
            const touch = e.touches[0];
            const newRight = window.innerWidth - touch.clientX - dragOffset.x;
            setPosition({
                x: newRight,
                y: touch.clientY - dragOffset.y,
            });
        }
    },
    [isDragging, dragOffset]
);


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
  }, [
    isDragging,
    handleDragMouseMove,
    handleDragMouseUp,
    handleDragTouchMove,
    handleDragTouchEnd,
  ]);

  const sections = useMemo(() => {
    return processedLyrics
      .filter((line) => line.text.startsWith('(') && line.text.endsWith(')'))
      .map((line, index) => ({
        name: line.text.substring(1, line.text.length - 1),
        startTime: line.startTimeSeconds,
        index: line.originalIndex,
        uniqueKey: `${line.text.substring(1, line.text.length - 1)}-${line.originalIndex}`,
      }));
  }, [processedLyrics]);

  const currentLine = useMemo(
    () => processedLyrics[currentLineIndex],
    [processedLyrics, currentLineIndex]
  );

  const currentSection = useMemo(() => {
    if (!sections || sections.length === 0 || !currentLine) {
      return null;
    }
    return sections
      .slice()
      .reverse()
      .find((s) => s.startTime <= currentLine.startTimeSeconds);
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
  
  // This effect updates the current line index based on the current time
  useEffect(() => {
    if (currentTime >= totalDuration && totalDuration > 0) {
      dispatch({ type: 'FINISH' });
    } else {
        const newIndex = processedLyrics.findIndex(
            (line) => currentTime >= line.startTimeSeconds && currentTime < line.endTimeSeconds && line.measures > 0
        );

        if (newIndex !== -1 && newIndex !== currentLineIndex) {
            dispatch({ type: 'SET_LINE_INDEX', payload: newIndex });
        }
    }
  }, [currentTime, totalDuration, processedLyrics, currentLineIndex]);


  const scrollToLine = useCallback(
    (index: number) => {
      if (highlightMode === 'none') return;
      const activeLine = lineRefs.current[index];
      const container = scrollContainerRef.current;
      if (activeLine && container) {
        const containerRect = container.getBoundingClientRect();
        const lineRect = activeLine.getBoundingClientRect();
        const desiredScrollTop =
          container.scrollTop +
          (lineRect.top - containerRect.top) -
          containerRect.height / 2 +
          lineRect.height / 2;

        container.scrollTo({
          top: desiredScrollTop,
          behavior: 'smooth',
        });
      }
    },
    [highlightMode]
  );

  useEffect(() => {
    scrollToLine(currentLineIndex);
  }, [currentLineIndex, scrollToLine]);

  const handleSliderChange = (value: number[]) => {
    const newTime = value[0];
    dispatch({ type: 'SET_TIME', payload: newTime });
  };
  
  const handleSetLine = useCallback((index: number) => {
    if (index >= 0 && index < processedLyrics.length) {
      const targetLine = processedLyrics[index];
      dispatch({ type: 'SET_TIME', payload: targetLine.startTimeSeconds });
      dispatch({ type: 'SET_LINE_INDEX', payload: index });
      scrollToLine(index);
    }
  }, [processedLyrics, scrollToLine]);

  const handleNextLine = useCallback(() => {
    const nextPlayableIndex = processedLyrics.findIndex((line, idx) => idx > currentLineIndex && line.measures > 0);
    if (nextPlayableIndex !== -1) {
        handleSetLine(nextPlayableIndex);
    }
  }, [currentLineIndex, processedLyrics, handleSetLine]);

  const handlePrevLine = useCallback(() => {
    const prevPlayableIndices = processedLyrics
        .map((line, idx) => ({...line, originalIndex: idx}))
        .filter(line => line.originalIndex < currentLineIndex && line.measures > 0);
    
    if (prevPlayableIndices.length > 0) {
        const prevIndex = prevPlayableIndices[prevPlayableIndices.length - 1].originalIndex;
        handleSetLine(prevIndex);
    }
  }, [currentLineIndex, processedLyrics, handleSetLine]);

  const handleSectionJump = (sectionIndex: number) => {
    const targetLine = processedLyrics.find(l => l.originalIndex === sectionIndex);
    if (targetLine) {
        const firstPlayableLineIndex = processedLyrics.findIndex(l => l.startTimeSeconds >= targetLine.startTimeSeconds && l.measures > 0);
        if (firstPlayableLineIndex !== -1) {
            handleSetLine(firstPlayableLineIndex);
        } else {
            // Fallback: just jump to the section header time if no playable line is after it
            handleSetLine(processedLyrics.findIndex(l => l.originalIndex === sectionIndex));
        }
    }
  };

  const changeFontSize = (amount: number) => {
    dispatch({ type: 'SET_FONT_SIZE', payload: fontSize + amount });
  };

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
    const newKeyIndex = (originalKeyIndex + transpose + 12 * 10) % 12;
    return ALL_NOTES[newKeyIndex];
  }, [transpose, song.originalKey]);

  const formatTime = (seconds: number) => {
    if (isNaN(seconds)) return "0:00";
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <>
      <div className='flex flex-col bg-background h-full overflow-hidden'>
        {!isSetlistMode && (
          <header className='fixed top-0 left-0 right-0 z-10 bg-background/80 backdrop-blur-sm pointer-events-auto'>
            <div className='relative container mx-auto flex items-center justify-between h-14'>
              <div className='absolute left-2 top-1/2 -translate-y-1/2'>
                {onClose ? (
                  <Button variant='ghost' size='icon' onClick={onClose}>
                    <ArrowLeft />
                    <span className='sr-only'>Close Preview</span>
                  </Button>
                ) : (
                  <Button
                    variant='ghost'
                    size='icon'
                    onClick={() => router.back()}
                  >
                    <ArrowLeft />
                    <span className='sr-only'>Back</span>
                  </Button>
                )}
              </div>

              <div className='flex-1 text-center min-w-0 px-12'>
                <h1 className='font-headline text-xl font-bold truncate'>
                  {song.title}
                </h1>
              </div>

              <div className='absolute right-2 top-1/2 -translate-y-1/2'>
                 <Sheet open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
                    <SheetTrigger asChild>
                      <Button variant='ghost' size='icon'>
                        <Settings />
                      </Button>
                    </SheetTrigger>
                    <SheetContent
                      side='right'
                      className='p-0 flex flex-col max-h-screen w-full max-w-xs'
                      onOpenAutoFocus={(e) => e.preventDefault()}
                    >
                      <SheetHeader className='p-4 border-b'>
                        <SheetTitle>Settings</SheetTitle>
                      </SheetHeader>
                      <ScrollArea className='flex-grow'>
                        <div className='p-4 space-y-6'>
                            {/* Chords Settings */}
                            <div className='space-y-4'>
                                <Label className="text-base font-semibold">Chords</Label>
                                <div className='flex items-center justify-between'>
                                    <Label htmlFor='show-chords' className="cursor-pointer">Show Chords</Label>
                                    <Switch
                                    id='show-chords'
                                    checked={showChords}
                                    onCheckedChange={() => dispatch({ type: 'TOGGLE_CHORDS' })}
                                    />
                                </div>
                                <div className='flex items-center justify-between'>
                                    <Label>Key</Label>
                                    <div className="flex items-center gap-1">
                                        <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => dispatch({type: 'TRANSPOSE_DOWN'})}><Minus className="h-4 w-4" /></Button>
                                        <Select value={currentKey} onValueChange={handleKeyChange}>
                                            <SelectTrigger className="w-[80px] h-7 text-xs">
                                                <SelectValue placeholder='Key' />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {ALL_NOTES.map((note) => (
                                                <SelectItem key={note} value={note} className='text-xs'>
                                                    {note}
                                                </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => dispatch({type: 'TRANSPOSE_UP'})}><Plus className="h-4 w-4" /></Button>
                                    </div>
                                </div>
                            </div>
                           
                            <Separator />
                            
                            {/* Display Settings */}
                            <div className='space-y-4'>
                                <Label className="text-base font-semibold">Display</Label>
                                 <div className='flex items-center justify-between'>
                                    <Label>Font Size</Label>
                                     <div className="flex items-center gap-1">
                                        <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => changeFontSize(-2)} disabled={fontSize <= 16}><Minus className="h-4 w-4" /></Button>
                                        <span className="w-10 text-center text-sm font-mono">{fontSize}px</span>
                                        <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => changeFontSize(2)} disabled={fontSize >= 48}><Plus className="h-4 w-4" /></Button>
                                     </div>
                                </div>
                                <div className='flex items-center justify-between'>
                                    <Label>Highlight</Label>
                                    <RadioGroup
                                    value={highlightMode}
                                    onValueChange={(value: HighlightMode) =>
                                        dispatch({
                                        type: 'SET_HIGHLIGHT_MODE',
                                        payload: value,
                                        })
                                    }
                                    className='flex items-center gap-1'
                                    >
                                    {HIGHLIGHT_OPTIONS.map((option) => (
                                        <Label
                                        key={option.value}
                                        className={cn(
                                            'flex h-7 w-14 items-center justify-center cursor-pointer rounded-md border text-xs opacity-75 hover:bg-accent hover:text-accent-foreground',
                                            highlightMode === option.value &&
                                            'border-primary bg-primary/10 text-primary opacity-100'
                                        )}
                                        >
                                        <RadioGroupItem
                                            value={option.value}
                                            id={`highlight-${option.value}`}
                                            className='sr-only'
                                        />
                                        {option.label}
                                        </Label>
                                    ))}
                                    </RadioGroup>
                                </div>
                                <div className='flex items-center justify-between'>
                                    <Label htmlFor='show-section-nav'>Navigator</Label>
                                    <Switch
                                    id='show-section-nav'
                                    checked={showSectionNavigator}
                                    onCheckedChange={() => dispatch({ type: 'TOGGLE_SECTION_NAVIGATOR' })}
                                    />
                                </div>
                                <div className='flex items-center justify-between'>
                                    <Label htmlFor='dark-mode'>Theme</Label>
                                    <Switch
                                    id='dark-mode'
                                    checked={theme === 'dark'}
                                    onCheckedChange={toggleTheme}
                                    />
                                </div>
                            </div>

                            <Separator />
                             {/* Other Settings */}
                            <div className='space-y-4'>
                                <Label className="text-base font-semibold">Playback</Label>
                                <div className='flex items-center justify-between'>
                                    <Label>BPM</Label>
                                    <div className="flex items-center gap-1">
                                        <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => dispatch({ type: 'SET_BPM', payload: bpm - 5 })}><Minus className="h-4 w-4" /></Button>
                                        <Input
                                            type='number'
                                            className='w-16 h-7 text-center'
                                            value={bpm}
                                            onChange={(e) =>
                                                dispatch({
                                                type: 'SET_BPM',
                                                payload: parseInt(e.target.value, 10) || bpm,
                                                })
                                            }
                                        />
                                        <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => dispatch({ type: 'SET_BPM', payload: bpm + 5 })}><Plus className="h-4 w-4" /></Button>
                                    </div>
                                </div>
                            </div>
                        </div>
                      </ScrollArea>
                    </SheetContent>
                  </Sheet>
              </div>
            </div>
          </header>
        )}

        {showSectionNavigator && sections.length > 0 && (
          <div
            ref={navigatorRef}
            className='fixed z-20 pointer-events-auto flex flex-col items-center gap-2'
            style={{ top: `${position.y}px`, right: `${position.x}px` }}
          >
            <div className='flex items-center gap-1'>
              <Button
                variant='ghost'
                size='icon'
                className='h-6 w-6 cursor-grab active:cursor-grabbing bg-transparent text-muted-foreground/60'
                onMouseDown={handleDragMouseDown}
                onTouchStart={handleDragTouchStart}
              >
                <Move className='h-3 w-3' />
              </Button>
              <Button
                variant='ghost'
                size='icon'
                className='h-6 w-6 bg-transparent text-muted-foreground/60'
                onClick={() => dispatch({ type: 'TOGGLE_SECTION_NAVIGATOR' })}
              >
                <X className='h-3 w-3' />
              </Button>
            </div>

            <div className='flex flex-col gap-2'>
              {sections.map((section, index) => (
                <button
                  key={section.uniqueKey}
                  onClick={() => handleSectionJump(section.index)}
                  className={cn(
                    'text-xs font-bold py-1 px-3 rounded-full shadow-md transition-all duration-300',
                    section.uniqueKey === currentSection?.uniqueKey
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-background/40 text-muted-foreground/60 hover:bg-muted/80 hover:text-muted-foreground'
                  )}
                >
                  {section.name}
                </button>
              ))}
            </div>
          </div>
        )}

        <div
          ref={scrollContainerRef}
          className='w-full h-full relative overflow-y-auto'
        >
          <ul
            className={cn(
              'w-full max-w-3xl mx-auto px-4 md:px-12',
              isSetlistMode ? 'pt-8 pb-32' : 'pt-20 pb-48 md:pb-24'
            )}
            style={{ fontSize: `${fontSize}px` }}
          >
            {processedLyrics.map((line, index) => {
              const parsedLine = parseLyrics(line.text);
              const hasText = parsedLine.some((p) => p.text.trim() !== '');
              const hasChords = parsedLine.some((p) => p.chord);

              const isSectionHeader =
                line.text.startsWith('(') && line.text.endsWith(')');

              if (isSectionHeader) {
                return (
                  <li
                    key={`${song.id}-${line.originalIndex}-header`}
                    ref={(el) => (lineRefs.current[index] = el)}
                    className='pt-4 pb-2 text-left'
                  >
                    <p
                      className='text-muted-foreground italic uppercase tracking-wider'
                      style={{ fontSize: `calc(${fontSize}px * 0.8)` }}
                    >
                      {`[${line.text.substring(1, line.text.length - 1)}]`}
                    </p>
                  </li>
                );
              }

              if (!showChords && !hasText && hasChords) {
                return null;
              }
              const isSectionBreak =
                !hasText && !hasChords && line.text.trim() === '';

              const lineSection = sections
                .slice()
                .reverse()
                .find((s) => s.index <= line.originalIndex);
              const isLineInCurrentSection =
                lineSection?.uniqueKey === currentSection?.uniqueKey;

              const isHighlighted =
                highlightMode !== 'none' &&
                ((highlightMode === 'line' && index === currentLineIndex) ||
                  (highlightMode === 'section' && isLineInCurrentSection));

              return (
                <li
                  key={`${song.id}-${line.originalIndex}`}
                  ref={(el) => (lineRefs.current[index] = el)}
                  className={cn(
                    'rounded-md transition-all duration-300 text-left flex justify-start items-center py-1 transform-origin-left',
                    isSectionBreak ? 'h-[0.5em]' : '',
                    isHighlighted
                      ? 'text-foreground scale-105'
                      : 'text-muted-foreground/40',
                    fontWeight === 400 && 'font-normal',
                    fontWeight === 600 && 'font-semibold',
                    fontWeight === 700 && 'font-bold'
                  )}
                  style={{
                    minHeight: isSectionBreak
                      ? 'auto'
                      : `calc(${fontSize}px * 1.2)`,
                  }}
                >
                  {!isSectionBreak && (
                    <LyricLineDisplay
                      line={line}
                      showChords={showChords}
                      chordColor={chordColor}
                      transpose={transpose}
                      fontWeight={fontWeight}
                      fontSize={fontSize}
                    />
                  )}
                </li>
              );
            })}
          </ul>
        </div>
        
        {isSetlistMode && (
             <div className="fixed top-20 right-4 z-20 pointer-events-auto">
                <div className="flex flex-col items-end gap-2 p-2 rounded-lg bg-background/50 backdrop-blur-sm">
                     <div className='flex items-center space-x-2'>
                        <Label htmlFor='show-chords' className="text-xs">Chords</Label>
                        <Switch
                        id='show-chords'
                        checked={showChords}
                        onCheckedChange={() => dispatch({ type: 'TOGGLE_CHORDS' })}
                        />
                    </div>
                     <div className='flex items-center space-x-2'>
                        <Label className="text-xs">Key</Label>
                        <div className="flex items-center gap-1">
                             <Button variant="outline" size="icon" className="h-6 w-6" onClick={() => dispatch({type: 'TRANSPOSE_DOWN'})}><ArrowDown className="h-3 w-3" /></Button>
                             <Select value={currentKey} onValueChange={handleKeyChange}>
                                <SelectTrigger className="w-[60px] h-6 text-xs">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {ALL_NOTES.map((note) => (
                                    <SelectItem key={note} value={note} className='text-xs'>
                                        {note}
                                    </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Button variant="outline" size="icon" className="h-6 w-6" onClick={() => dispatch({type: 'TRANSPOSE_UP'})}><ArrowUp className="h-3 w-3" /></Button>
                        </div>
                    </div>
                </div>
            </div>
        )}

        <div
          className={cn(
            'fixed bottom-0 left-0 right-0 pointer-events-none',
            isSetlistMode && 'bottom-16'
          )}
        >
          <div className='bg-background/50 backdrop-blur-sm pointer-events-auto py-2'>
            <div className='max-w-4xl mx-auto space-y-2 px-4'>
              <div className='flex items-center gap-4'>
                <span className='text-xs font-mono w-10 text-center'>
                  {formatTime(currentTime)}
                </span>
                <Slider
                  value={[currentTime]}
                  max={totalDuration}
                  step={0.1}
                  onValueChange={handleSliderChange}
                />
                <span className='text-xs font-mono w-10 text-center'>
                  {formatTime(totalDuration)}
                </span>
              </div>
              <div className='relative flex justify-center items-center w-full gap-4 h-12'>
                <div className='absolute left-0 top-1/2 -translate-y-1/2 flex items-center'>
                  <span className='text-xs font-bold text-muted-foreground'>
                    {bpm} BPM
                  </span>
                </div>
                <Button
                  variant='ghost'
                  size='icon'
                  onClick={handlePrevLine}
                  disabled={currentLineIndex <= 0}
                >
                  <SkipBack />
                </Button>
                <Button
                  variant='outline'
                  size='icon'
                  className='w-12 h-12 rounded-full'
                  onClick={() => dispatch({ type: 'TOGGLE_PLAY' })}
                >
                  {isFinished ? (
                    <Repeat className='h-6 w-6' />
                  ) : isPlaying ? (
                    <Pause className='h-6 w-6' />
                  ) : (
                    <Play className='h-6 w-6' />
                  )}
                </Button>
                <Button
                  variant='ghost'
                  size='icon'
                  onClick={handleNextLine}
                  disabled={currentLineIndex >= processedLyrics.length - 1}
                >
                  <SkipForward />
                </Button>
                <div className='absolute right-0 top-1/2 -translate-y-1/2 flex items-center'>
                  <Button
                    variant='ghost'
                    size='icon'
                    onClick={() => dispatch({ type: 'RESET' })}
                  >
                    <RotateCcw className='h-4 w-4' />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
