import { getSongs } from '@/lib/songs';
import SongCard from '@/components/SongCard';

export default function Home() {
  const songs = getSongs();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-headline font-bold tracking-tight">Welcome to Rhythmic Reads</h1>
        <p className="text-muted-foreground mt-2">Your favorite lyrics, perfectly in sync.</p>
      </div>
      
      <section>
        <h2 className="text-2xl font-headline font-semibold mb-4">Featured Songs</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {songs.map((song) => (
            <SongCard key={song.id} song={song} />
          ))}
        </div>
      </section>
    </div>
  );
}
