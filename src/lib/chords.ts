
const NOTES_SHARP = ['A', 'A#', 'B', 'C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#'];
const NOTES_FLAT = ['A', 'Bb', 'B', 'C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab'];

const getNoteIndex = (note: string): number => {
    let index = NOTES_SHARP.indexOf(note);
    if (index !== -1) return index;
    index = NOTES_FLAT.indexOf(note);
    return index;
};

const getTransposedNote = (note: string, amount: number, useSharps: boolean): string => {
    const noteIndex = getNoteIndex(note);
    if (noteIndex === -1) return note;

    const newIndex = (noteIndex + amount + 12) % 12;
    return useSharps ? NOTES_SHARP[newIndex] : NOTES_FLAT[newIndex];
};

export const transposeChord = (chord: string, amount: number): string => {
    if (amount === 0) return chord;

    const chordRegex = /^([A-G][b#]?)(.*)$/;
    const match = chord.match(chordRegex);

    if (!match) return chord;

    const rootNote = match[1];
    const restOfChord = match[2];

    const useSharps = !rootNote.includes('b') || rootNote.length === 1;

    const newRoot = getTransposedNote(rootNote, amount, useSharps);

    return newRoot + restOfChord;
};
