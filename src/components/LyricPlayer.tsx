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
import type { Song } from '@/lib/songs';
import { cn } from '@/lib/utils';
import { ALL_NOTES } from '@/lib/chords';
import FloatingKeyControls from './FloatingKeyControls';
import FloatingSectionNavigator from './FloatingSectionNavigator';
import { useFloatingControls } from '@/hooks/use-floating-controls';
import { useFloatingNavigator } from '@/hooks/use-floating-navigator';
import { useTheme } from 'next-themes';
import {
  PlayerHeader,
  PlayerControls,
  LyricLineDisplay,
  SettingsSheet,
} from './player';
import {
  localStorageManager,
  type FontWeight,
  type HighlightMode,
} from '@/lib/local-storage';
import { Metronome } from '@/lib/metronome';

type State = {
  isPlaying: boolean;
  currentTime: number;
  currentLineIndex: number;
  isFinished: boolean;
  fontSize: number;
  fontWeight: FontWeight;
  showChords: boolean;
  chordColor: string;
  inlineCommentColor: string;
  highlightMode: HighlightMode;
  bpm: number;
  transpose: number;
  isMetronomeEnabled: boolean;
  metronomeVolume: number;
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
  | { type: 'SET_INLINE_COMMENT_COLOR'; payload: string }
  | { type: 'SET_HIGHLIGHT_MODE'; payload: HighlightMode }
  | { type: 'SET_TRANSPOSE'; payload: number }
  | { type: 'TRANSPOSE_UP' }
  | { type: 'TRANSPOSE_DOWN' }
  | { type: 'RESET_TRANSPOSE' }
  | { type: 'SET_BPM'; payload: number }
  | { type: 'TOGGLE_METRONOME' }
  | { type: 'SET_METRONOME_VOLUME'; payload: number }
  | { type: 'RESET_PLAYER_STATE'; payload: PlayerSettings };

type PlayerSettings = {
  bpm?: number;
  fontSize?: number;
  fontWeight?: FontWeight;
  highlightMode?: HighlightMode;
  showChords?: boolean;
  inlineCommentColor?: string;
  isMetronomeEnabled?: boolean;
  metronomeVolume?: number;
};

const getInitialState = (settings: PlayerSettings): State => ({
  isPlaying: false,
  currentTime: 0,
  currentLineIndex: 0,
  isFinished: false,
  fontSize: settings.fontSize || 16,
  fontWeight: settings.fontWeight || 400,
  showChords: settings.showChords !== false, // default to true
  chordColor: 'hsl(var(--primary))',
  inlineCommentColor:
    settings.inlineCommentColor || 'hsl(var(--destructive))',
  highlightMode: settings.highlightMode || 'line',
  bpm: settings.bpm || 120,
  transpose: 0,
  isMetronomeEnabled: settings.isMetronomeEnabled || false,
  metronomeVolume: settings.metronomeVolume || 0.5,
});

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
    case 'SET_FONT_SIZE': {
      const newSize = Math.max(16, Math.min(48, action.payload));
      localStorageManager.setUserPreferences({ fontSize: newSize });
      return { ...state, fontSize: newSize };
    }
    case 'SET_FONT_WEIGHT':
      localStorageManager.setUserPreferences({ fontWeight: action.payload });
      return { ...state, fontWeight: action.payload };
    case 'TOGGLE_CHORDS':
      localStorageManager.setUserPreferences({ showChords: !state.showChords });
      return { ...state, showChords: !state.showChords };
    case 'SET_CHORD_COLOR':
      return { ...state, chordColor: action.payload };
    case 'SET_INLINE_COMMENT_COLOR':
      localStorageManager.setUserPreferences({
        inlineCommentColor: action.payload,
      });
      return { ...state, inlineCommentColor: action.payload };
    case 'SET_HIGHLIGHT_MODE':
      localStorageManager.setUserPreferences({
        highlightMode: action.payload,
      });
      return { ...state, highlightMode: action.payload };
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
    case 'TOGGLE_METRONOME':
      localStorageManager.setUserPreferences({
        isMetronomeEnabled: !state.isMetronomeEnabled,
      });
      return { ...state, isMetronomeEnabled: !state.isMetronomeEnabled };
    case 'SET_METRONOME_VOLUME':
      localStorageManager.setUserPreferences({
        metronomeVolume: action.payload,
      });
      return { ...state, metronomeVolume: action.payload };
    case 'RESET_PLAYER_STATE':
      return getInitialState({
        ...action.payload,
        bpm: action.payload.bpm,
      });
    default:
      return state;
  }
}

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
  onClose,
}: LyricPlayerProps) {
  const [initialState, setInitialState] = useState<State | null>(null);
  const metronomeRef = useRef<Metronome | null>(null);

  useEffect(() => {
    // This effect runs only on the client
    const prefs = localStorageManager.getUserPreferences();
    setInitialState(
      getInitialState({
        bpm: song.bpm,
        fontSize: prefs.fontSize,
        fontWeight: prefs.fontWeight,
        highlightMode: prefs.highlightMode,
        showChords: prefs.showChords,
        inlineCommentColor: prefs.inlineCommentColor,
        isMetronomeEnabled: prefs.isMetronomeEnabled,
        metronomeVolume: prefs.metronomeVolume,
      })
    );
    if (!metronomeRef.current) {
      metronomeRef.current = new Metronome();
    }
  }, [song.id, song.bpm]);

  const [state, dispatch] = useReducer(lyricPlayerReducer, getInitialState({}));
  const {
    isPlaying,
    currentTime,
    currentLineIndex,
    isFinished,
    fontSize,
    fontWeight,
    showChords,
    chordColor,
    inlineCommentColor,
    highlightMode,
    bpm,
    transpose,
    isMetronomeEnabled,
    metronomeVolume,
  } = state;

  useEffect(() => {
    if (initialState) {
      dispatch({ type: 'RESET_PLAYER_STATE', payload: initialState });
    }
  }, [initialState]);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const lineRefs = useRef<(HTMLLIElement | null)[]>([]);

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const floatingControls = useFloatingControls();
  const floatingNavigator = useFloatingNavigator();

  const { theme, setTheme } = useTheme();

  const { processedLyrics, totalDuration, timeSignatureBeats } = useMemo(() => {
    let cumulativeTime = 0;
    const currentBpm = typeof bpm === 'number' && bpm > 0 ? bpm : 120;
    const timeSignature = song.timeSignature || '4/4';
    const beats = parseInt(timeSignature.split('/')[0], 10) || 4;
    const secondsPerMeasure = (60 / currentBpm) * beats;

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
      timeSignatureBeats: beats,
    };
  }, [song.lyrics, bpm, song.timeSignature]);

  useEffect(() => {
    dispatch({
      type: 'RESET_PLAYER_STATE',
      payload: {
        ...localStorageManager.getUserPreferences(),
        bpm: song.bpm,
      },
    });
  }, [song.id, song.bpm]);

  useEffect(() => {
    if (metronomeRef.current) {
      metronomeRef.current.setBpm(bpm);
      metronomeRef.current.setTimeSignature(timeSignatureBeats);
      metronomeRef.current.setVolume(metronomeVolume);
    }
  }, [bpm, timeSignatureBeats, metronomeVolume]);

  useEffect(() => {
    if (isPlaying && isMetronomeEnabled) {
      metronomeRef.current?.start();
    } else {
      metronomeRef.current?.stop();
    }
    // Cleanup function to stop metronome when component unmounts
    return () => {
      metronomeRef.current?.stop();
    };
  }, [isPlaying, isMetronomeEnabled]);

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  const sections = useMemo(() => {
    return processedLyrics
      .filter((line) => line.text.startsWith('(') && line.text.endsWith(')'))
      .map((line) => ({
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
  if (!initialState) {
    return (
      <div className='flex h-screen flex-col overflow-hidden bg-background'>
        {/* Simplified Loading Skeleton */}
      </div>
    );
  }
  return (
    <>
      <div className='flex flex-col bg-background h-full overflow-hidden'>
        <PlayerHeader
          title={song.title}
          onClose={onClose}
          isSetlistMode={isSetlistMode}
        />

        <FloatingSectionNavigator
          sections={sections}
          currentSection={currentSection}
          onSectionJump={handleSectionJump}
          onClose={floatingNavigator.toggleVisibility}
          isVisible={floatingNavigator.isVisible}
          onToggleVisibility={floatingNavigator.toggleVisibility}
        />

        <FloatingKeyControls
          showChords={showChords}
          currentKey={currentKey}
          transpose={transpose}
          onToggleChords={() => dispatch({ type: 'TOGGLE_CHORDS' })}
          onKeyChange={handleKeyChange}
          onTransposeUp={() => dispatch({ type: 'TRANSPOSE_UP' })}
          onTransposeDown={() => dispatch({ type: 'TRANSPOSE_DOWN' })}
          onClose={floatingControls.toggleVisibility}
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
              const isComment = line.text.trim().startsWith('*');
              const isSectionHeader =
                line.text.startsWith('(') && line.text.endsWith(')');

              if (isComment) {
                return (
                  <li
                    key={`${song.id}-${line.originalIndex}-comment`}
                    ref={(el) => {
                      lineRefs.current[index] = el;
                    }}
                    className='pt-2 text-left'
                  >
                    <p
                      className='text-muted-foreground italic'
                      style={{ fontSize: `calc(${fontSize}px * 0.9)` }}
                    >
                      {line.text.substring(1).trim()}
                    </p>
                  </li>
                );
              }

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
              const hasText = line.text.replace(/\[[^\]]+\]/g, '').trim() !== '';
              const hasChords = /\[[^\]]+\]/.test(line.text);
              

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
                      : 'text-muted-foreground/60',
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
                      inlineCommentColor={inlineCommentColor}
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
          inlineCommentColor={inlineCommentColor}
          showFloatingControls={floatingControls.isVisible}
          showFloatingNavigator={floatingNavigator.isVisible}
          theme={theme || 'light'}
          bpm={bpm}
          isMetronomeEnabled={isMetronomeEnabled}
          metronomeVolume={metronomeVolume}
          onToggleChords={() => dispatch({ type: 'TOGGLE_CHORDS' })}
          onTransposeDown={() => dispatch({ type: 'TRANSPOSE_DOWN' })}
          onTransposeUp={() => dispatch({ type: 'TRANSPOSE_UP' })}
          onKeyChange={handleKeyChange}
          onFontSizeChange={changeFontSize}
          onHighlightModeChange={(mode: HighlightMode) =>
            dispatch({ type: 'SET_HIGHLIGHT_MODE', payload: mode })
          }
          onInlineCommentColorChange={(color: string) =>
            dispatch({ type: 'SET_INLINE_COMMENT_COLOR', payload: color })
          }
          onToggleFloatingControls={floatingControls.toggleVisibility}
          onToggleFloatingNavigator={floatingNavigator.toggleVisibility}
          onToggleTheme={toggleTheme}
          onBpmChange={(bpm: number) =>
            dispatch({ type: 'SET_BPM', payload: bpm })
          }
          onResetSettings={() =>
            dispatch({
              type: 'RESET_PLAYER_STATE',
              payload: {
                ...localStorageManager.getUserPreferences(),
                bpm: song.bpm,
              },
            })
          }
          onToggleMetronome={() => dispatch({ type: 'TOGGLE_METRONOME' })}
          onMetronomeVolumeChange={(vol: number) =>
            dispatch({ type: 'SET_METRONOME_VOLUME', payload: vol })
          }
        />
      </div>
    </>
  );
}
