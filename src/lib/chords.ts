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
  // Regex to find all valid chord structures within the input string.
  // It looks for a root note (A-G), optional sharps/flats, and any following characters
  // that are not a new root note. This handles simple, complex, and slash chords.
  const chordRegex = /([A-G][b#]?)([^A-G[\]]*)/g;

  return chord.replace(chordRegex, (match, rootNote, quality) => {
    // Check for slash chords (e.g., G/B)
    const slashParts = quality.split('/');
    const mainQuality = slashParts[0];
    let newSlashPart = '';

    if (slashParts.length > 1) {
      const slashNote = slashParts[1];
      // Check if the part after the slash is a valid note to be transposed
      const slashRootMatch = slashNote.match(/^([A-G][b#]?)/);
      if (slashRootMatch) {
        const transposedSlashNote = getTransposedNote(slashRootMatch[0], amount);
        newSlashPart = `/${transposedSlashNote}${slashNote.substring(
          slashRootMatch[0].length
        )}`;
      } else {
        // If not a valid note, keep it as is
        newSlashPart = `/${slashNote}`;
      }
    }

    const newRoot = getTransposedNote(rootNote, amount);
    return newRoot + mainQuality + newSlashPart;
  });
};
