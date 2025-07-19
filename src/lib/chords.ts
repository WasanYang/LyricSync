
const NOTES_SHARP = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const NOTES_FLAT = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];

export const ALL_NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];


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
    
    // Prefer sharp or flat based on original chord notation
    return useSharpsForOriginal ? transposedNoteSharp : transposedNoteFlat;
};

export const transposeChord = (chord: string, amount: number): string => {
    if (amount === 0) return chord;

    const chordRegex = /^([A-G][b#]?)(.*)$/;
    const match = chord.match(chordRegex);

    if (!match) return chord;

    const rootNote = match[1];
    const restOfChord = match[2];

    const newRoot = getTransposedNote(rootNote, amount);

    return newRoot + restOfChord;
};
