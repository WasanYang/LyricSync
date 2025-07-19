import { getSongs } from '@/lib/songs';
import SongCard from '@/components/SongCard';
import Header from '@/components/Header';
import BottomNavBar from '@/components/BottomNavBar';
import { cn } from '@/lib/utils';

export default function Home() {
  const songs = getSongs();

  return (
    <div className="flex-grow flex flex-col">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8 pb-24 md:pb-8">
        <div className="space-y-8">
          <div>
            <h1 className="text-4xl font-headline font-bold tracking-tight">Welcome to Rhythmic Reads</h1>
            <p className="text-muted-foreground mt-2">Your favorite lyrics, perfectly in sync.</p>
          </div>
          
          <section>
            <h2 className="text-2xl font-headline font-semibold mb-4">Featured Songs</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-x-6 gap-y-8">
              {songs.map((song) => (
                <SongCard key={song.id} song={song} />
              ))}
            </div>
          </section>
        </div>
      </main>
      <BottomNavBar />
    </div>
  );
}
