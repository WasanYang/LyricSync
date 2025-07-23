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
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ALL_NOTES } from '@/lib/chords';
import { Separator } from './ui/separator';
import FloatingKeyControls from './FloatingKeyControls';
import FloatingSectionNavigator from './FloatingSectionNavigator';
import { useFloatingControls } from '@/hooks/use-floating-controls';
import { useFloatingNavigator } from '@/hooks/use-floating-navigator';
import {
  PlayerHeader,
  PlayerControls,
  LyricLineDisplay,
  SettingsSheet,
} from './player';

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
  showKeyControls: boolean;
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
  | { type: 'TOGGLE_KEY_CONTROLS' }
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
  showKeyControls: true,
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
    case 'TOGGLE_KEY_CONTROLS':
      return { ...state, showKeyControls: !state.showKeyControls };
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
        showKeyControls: true,
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
};

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
    showKeyControls,
    bpm,
    transpose,
  } = state;
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const lineRefs = useRef<(HTMLLIElement | null)[]>([]);

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Use floating controls hook for persistent visibility and position
  const floatingControls = useFloatingControls();

  // Use floating navigator hook for persistent visibility and position
  const floatingNavigator = useFloatingNavigator();

  const [theme, setThemeState] = useState<'light' | 'dark'>('light');

  const [keyControlsPosition, setKeyControlsPosition] = useState({
    x: 16,
    y: 90,
  });

  const [navPosition, setNavPosition] = useState({ x: 16, y: 300 });

  const { processedLyrics, totalDuration } = useMemo(() => {
    let cumulativeTime = 0;
    const currentBpm = typeof bpm === 'number' && bpm > 0 ? bpm : 120;
    const timeSignature = song.timeSignature || '4/4';
    const timeSignatureBeats = parseInt(timeSignature.split('/')[0], 10) || 4;
    const secondsPerMeasure = (60 / currentBpm) * timeSignatureBeats;

    const lyricsWithTiming = song.lyrics.map((line, index) => {
      const startTimeSeconds = cumulativeTime;
      const durationSeconds = line.measures * secondsPerMeasure;
      cumulativeTime += durationSeconds;
      const endTimeSeconds = cumulativeTime;

      return {
        ...line,
        originalIndex: index,
        startTimeSeconds,
        endTimeSeconds,
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
      setNavPosition({ x: 16, y: 450 });
      setKeyControlsPosition({ x: 16, y: 90 });
    } else {
      setNavPosition({ x: 16, y: 300 });
      setKeyControlsPosition({ x: 16, y: 90 });
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

  const sections = useMemo(() => {
    return processedLyrics
      .filter((line) => line.text.startsWith('(') && line.text.endsWith(')'))
      .map((line, index) => ({
        name: line.text.substring(1, line.text.length - 1),
        startTime: line.startTimeSeconds,
        index: line.originalIndex,
        uniqueKey: `${line.text.substring(1, line.text.length - 1)}-${
          line.originalIndex
        }`,
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
        (line) =>
          currentTime >= line.startTimeSeconds &&
          currentTime < line.endTimeSeconds &&
          line.measures > 0
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

  const handleSetLine = useCallback(
    (index: number) => {
      if (index >= 0 && index < processedLyrics.length) {
        const targetLine = processedLyrics[index];
        dispatch({ type: 'SET_TIME', payload: targetLine.startTimeSeconds });
        dispatch({ type: 'SET_LINE_INDEX', payload: index });
        scrollToLine(index);
      }
    },
    [processedLyrics, scrollToLine]
  );

  const handleNextLine = useCallback(() => {
    const nextPlayableIndex = processedLyrics.findIndex(
      (line, idx) => idx > currentLineIndex && line.measures > 0
    );
    if (nextPlayableIndex !== -1) {
      handleSetLine(nextPlayableIndex);
    }
  }, [currentLineIndex, processedLyrics, handleSetLine]);

  const handlePrevLine = useCallback(() => {
    const prevPlayableIndices = processedLyrics
      .map((line, idx) => ({ ...line, originalIndex: idx }))
      .filter(
        (line) => line.originalIndex < currentLineIndex && line.measures > 0
      );

    if (prevPlayableIndices.length > 0) {
      const prevIndex =
        prevPlayableIndices[prevPlayableIndices.length - 1].originalIndex;
      handleSetLine(prevIndex);
    }
  }, [currentLineIndex, processedLyrics, handleSetLine]);

  const handleSectionJump = (sectionIndex: number) => {
    const targetLine = processedLyrics.find(
      (l) => l.originalIndex === sectionIndex
    );
    if (targetLine) {
      const firstPlayableLineIndex = processedLyrics.findIndex(
        (l) =>
          l.startTimeSeconds >= targetLine.startTimeSeconds && l.measures > 0
      );
      if (firstPlayableLineIndex !== -1) {
        handleSetLine(firstPlayableLineIndex);
      } else {
        // Fallback: just jump to the section header time if no playable line is after it
        handleSetLine(
          processedLyrics.findIndex((l) => l.originalIndex === sectionIndex)
        );
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
    if (isNaN(seconds)) return '0:00';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <>
      <div className='flex flex-col bg-background h-full overflow-hidden'>
        <PlayerHeader
          title={song.title}
          onClose={onClose}
          isSetlistMode={isSetlistMode}
        />

        {/* Floating Section Navigator */}
        <FloatingSectionNavigator
          sections={sections}
          currentSection={currentSection}
          onSectionJump={handleSectionJump}
          onClose={() => dispatch({ type: 'TOGGLE_SECTION_NAVIGATOR' })}
          initialPosition={navPosition}
          isVisible={floatingNavigator.isVisible}
          onToggleVisibility={floatingNavigator.toggleVisibility}
        />

        {/* Floating Chord/Key Controls */}
        <FloatingKeyControls
          showChords={showChords}
          currentKey={currentKey}
          transpose={transpose}
          onToggleChords={() => dispatch({ type: 'TOGGLE_CHORDS' })}
          onKeyChange={handleKeyChange}
          onTransposeUp={() => dispatch({ type: 'TRANSPOSE_UP' })}
          onTransposeDown={() => dispatch({ type: 'TRANSPOSE_DOWN' })}
          onClose={() => dispatch({ type: 'TOGGLE_KEY_CONTROLS' })}
          initialPosition={keyControlsPosition}
          isVisible={floatingControls.isVisible}
          onToggleVisibility={floatingControls.toggleVisibility}
        />

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
                    ref={(el) => {
                      lineRefs.current[index] = el;
                    }}
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
                  ref={(el) => {
                    lineRefs.current[index] = el;
                  }}
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

        <PlayerControls
          isPlaying={isPlaying}
          isFinished={isFinished}
          currentTime={currentTime}
          totalDuration={totalDuration}
          currentLineIndex={currentLineIndex}
          processedLyricsLength={processedLyrics.length}
          bpm={bpm}
          isSetlistMode={isSetlistMode}
          onTogglePlay={() => dispatch({ type: 'TOGGLE_PLAY' })}
          onSliderChange={handleSliderChange}
          onPrevLine={handlePrevLine}
          onNextLine={handleNextLine}
          onOpenSettings={() => setIsSettingsOpen(true)}
          formatTime={formatTime}
        />

        <SettingsSheet
          isOpen={isSettingsOpen}
          onOpenChange={setIsSettingsOpen}
          showChords={showChords}
          currentKey={currentKey}
          fontSize={fontSize}
          highlightMode={highlightMode}
          showSectionNavigator={showSectionNavigator}
          showKeyControls={showKeyControls}
          showFloatingControls={floatingControls.isVisible}
          showFloatingNavigator={floatingNavigator.isVisible}
          theme={theme}
          bpm={bpm}
          onToggleChords={() => dispatch({ type: 'TOGGLE_CHORDS' })}
          onTransposeDown={() => dispatch({ type: 'TRANSPOSE_DOWN' })}
          onTransposeUp={() => dispatch({ type: 'TRANSPOSE_UP' })}
          onKeyChange={handleKeyChange}
          onFontSizeChange={changeFontSize}
          onHighlightModeChange={(mode: HighlightMode) =>
            dispatch({ type: 'SET_HIGHLIGHT_MODE', payload: mode })
          }
          onToggleSectionNavigator={() =>
            dispatch({ type: 'TOGGLE_SECTION_NAVIGATOR' })
          }
          onToggleKeyControls={() => dispatch({ type: 'TOGGLE_KEY_CONTROLS' })}
          onToggleFloatingControls={floatingControls.toggleVisibility}
          onToggleFloatingNavigator={floatingNavigator.toggleVisibility}
          onToggleTheme={toggleTheme}
          onBpmChange={(bpm: number) =>
            dispatch({ type: 'SET_BPM', payload: bpm })
          }
          onResetSettings={() =>
            dispatch({ type: 'RESET_PLAYER_STATE', payload: { bpm: song.bpm } })
          }
        />
      </div>
    </>
  );
}
