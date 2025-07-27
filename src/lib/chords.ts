const NOTES_SHARP = [
  'C',
  'C#',
  'D',
  'D#',
  'E',
  'F',
  'F#',
  'G',
  'G#',
  'A',
  'A#',
  'B',
];
const NOTES_FLAT = [
  'C',
  'Db',
  'D',
  'Eb',
  'E',
  'F',
  'Gb',
  'G',
  'Ab',
  'A',
  'Bb',
  'B',
];

export const ALL_NOTES = [
  'C',
  'C#',
  'D',
  'Eb',
  'E',
  'F',
  'F#',
  'G',
  'G#',
  'A',
  'Bb',
  'B',
];

const getNoteIndex = (note: string): number => {
  let index = NOTES_SHARP.indexOf(note);
  if (index !== -1) return index;
  index = NOTES_FLAT.indexOf(note);
  return index;
};

const getTransposedNote = (note: string, amount: number): string => {
  const noteIndex = getNoteIndex(note);
  if (noteIndex === -1) return note;

  const newIndex = (noteIndex + amount + 12) % 12;

  const useSharpsForOriginal = !note.includes('b');
  const transposedNoteSharp = NOTES_SHARP[newIndex];
  const transposedNoteFlat = NOTES_FLAT[newIndex];

  if (transposedNoteSharp === transposedNoteFlat) {
    return transposedNoteSharp;
  }

  // Special case: Always prefer Bb over A#
  if (transposedNoteSharp === 'A#') {
    return 'Bb';
  }

  // Prefer sharp or flat based on original chord notation
  return useSharpsForOriginal ? transposedNoteSharp : transposedNoteFlat;
};

export const transposeChord = (chord: string, amount: number): string => {
  if (amount === 0) return chord;

  // Handle multi-chord groups like [G/B|C|D|G]
  if (chord.includes('|')) {
    return chord
      .split('|')
      .map((c) => transposeChord(c, amount))
      .join('|');
  }

  // This regex handles standard chords, slash chords (e.g., G/B), and complex chords (e.g., Asus4, Cmaj7).
  // 1. ([A-G][b#]?): Captures the root note (e.g., 'A', 'C#', 'Bb').
  // 2. ([^/]*): Captures the chord quality (e.g., 'sus4', 'maj7', 'm') - everything until a slash or the end.
  // 3. (.*): Captures the bass note for slash chords (e.g., '/B') or is empty.
  const chordRegex = /^([A-G][b#]?)([^/]*)(.*)$/;
  const match = chord.match(chordRegex);

  if (!match) return chord;

  const [, rootNote, quality, slashPart] = match;

  const newRoot = getTransposedNote(rootNote, amount);

  let newSlashPart = '';
  if (slashPart) {
    const slashNoteRegex = /^\/([A-G][b#]?)/;
    const slashMatch = slashPart.match(slashNoteRegex);
    if (slashMatch) {
      const slashNote = slashMatch[1];
      newSlashPart = `/${getTransposedNote(slashNote, amount)}`;
    } else {
      newSlashPart = slashPart; // Keep original if it doesn't match a note
    }
  }

  return newRoot + quality + newSlashPart;
};
