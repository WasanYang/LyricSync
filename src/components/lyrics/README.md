// Unified lyric display components structure

// 1. Core Lyric Engine (shared logic)
interface LyricEngineProps {
  lyrics: LyricLine[];
  showChords?: boolean;
  transpose?: number;
  fontSize?: number;
  fontWeight?: FontWeight;
  chordColor?: string;
}

// 2. Basic Lyric Display (for static views)
interface BasicLyricDisplayProps extends LyricEngineProps {
  className?: string;
}

// 3. Advanced Lyric Player (for player views)
interface LyricPlayerProps extends LyricEngineProps {
  song: Song;
  autoScroll?: boolean;
  highlightMode?: HighlightMode;
  showFloatingControls?: boolean;
  onSectionChange?: (section: string) => void;
}

// Usage Examples:
/*
// Static song view
<BasicLyricDisplay 
  lyrics={song.lyrics} 
  showChords={showChords}
  className="space-y-2"
/>

// Full player view  
<LyricPlayer 
  song={song}
  autoScroll={true}
  showFloatingControls={true}
  highlightMode="line"
/>
*/
