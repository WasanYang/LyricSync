export type LyricLine = {
  time: number; // in seconds
  text: string;
};

export type Song = {
  id: string;
  title: string;
  artist: string;
  lyrics: LyricLine[];
};

const songs: Song[] = [
  {
    id: '1',
    title: 'Starlight Echoes',
    artist: 'Celestial Sound',
    lyrics: [
      { time: 3, text: "In the quiet of the night," },
      { time: 6, text: "A single star begins to glow," },
      { time: 9, text: "Casting shadows in the light," },
      { time: 12, text: "A silent, cosmic show." },
      { time: 16, text: "We're just echoes in the starlight," },
      { time: 20, text: "Fading in and out of view," },
      { time: 24, text: "Dancing in the pale moonlight," },
      { time: 28, text: "Me and you." },
      { time: 32, text: "(Instrumental)" },
      { time: 38, text: "Across the void, a signal sent," },
      { time: 42, text: "A whispered word, a fleeting thought," },
      { time: 46, text: "On waves of ether, we're content," },
      { time: 50, text: "In this vastness we are caught." },
      { time: 54, text: "We're just echoes in the starlight," },
      { time: 58, text: "Fading in and out of view," },
      { time: 62, text: "Dancing in the pale moonlight," },
      { time: 66, text: "Me and you." },
    ],
  },
  {
    id: '2',
    title: 'Ocean Drive',
    artist: 'The Midnight Bloom',
    lyrics: [
      { time: 5, text: "Palm trees swaying in the breeze," },
      { time: 9, text: "Neon lights are calling me," },
      { time: 13, text: "Driving down the coastal road," },
      { time: 17, text: "Lifting off a heavy load." },
      { time: 21, text: "This is the life on Ocean Drive," },
      { time: 25, text: "Feeling so completely alive," },
      { time: 29, text: "Underneath the sunset skies," },
      { time: 33, text: "Reflected in your loving eyes." },
      { time: 40, text: "The city sleeps, but we're awake," },
      { time: 44, text: "For goodness, for heaven's sake," },
      { time: 48, text: "Let's chase the dawn until it breaks," },
      { time: 52, text: "No more sorrows, no more heartaches." },
      { time: 56, text: "This is the life on Ocean Drive," },
      { time: 60, text: "Feeling so completely alive," },
      { time: 64, text: "Underneath the sunset skies," },
      { time: 68, text: "Reflected in your loving eyes." },
    ],
  },
  {
    id: '3',
    title: 'City of Dreams',
    artist: 'Urban Canvas',
    lyrics: [
        { time: 4, text: "The rain is washing streets of chrome," },
        { time: 8, text: "Far away from what was home," },
        { time: 12, text: "A thousand faces pass me by," },
        { time: 16, text: "Reflected in a tearful eye." },
        { time: 20, text: "In this city of our dreams," },
        { time: 24, text: "Nothing's ever what it seems," },
        { time: 28, text: "Chasing flashing, distant gleams," },
        { time: 32, text: "Tearing at the very seams." },
        { time: 38, text: "The subway rattles, a lonely sound," },
        { time: 42, text: "Lost and never to be found," },
        { time: 46, text: "But in the pulse, a rhythm starts," },
        { time: 50, text: "Mending all the broken hearts." },
        { time: 54, text: "In this city of our dreams," },
        { time: 58, text: "Nothing's ever what it seems," },
        { time: 62, text: "Chasing flashing, distant gleams," },
        { time: 66, text: "Living out our wildest schemes." },
    ],
  },
];

export function getSongs(): Song[] {
  return songs;
}

export function getSongById(id: string): Song | undefined {
  return songs.find((song) => song.id === id);
}
