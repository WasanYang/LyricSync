
import { getSongs, type Song } from '@/lib/songs';
import SongCard from '@/components/SongCard';
import Header from '@/components/Header';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel"
import BottomNavBar from '@/components/BottomNavBar';


// In a real app, these would come from an API
const featuredSongs = getSongs().slice(0, 4);
const recentReleases = getSongs().slice(2, 4).reverse();
const popularHits = getSongs().slice(1, 4);

interface SongSectionProps {
  title: string;
  songs: Song[];
}

function SongSection({ title, songs }: SongSectionProps) {
  return (
    <section>
      <h2 className="text-2xl font-headline font-semibold mb-4">{title}</h2>
      <Carousel
        opts={{
          align: "start",
          loop: false,
        }}
        className="w-full"
      >
        <CarouselContent className="-ml-4">
          {songs.map((song) => (
            <CarouselItem key={song.id} className="basis-2/5 md:basis-1/4 pl-4">
              <SongCard song={song} />
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>
    </section>
  )
}


export default function Home() {
  return (
    <div className="flex-grow flex flex-col">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8 space-y-12 pb-24 md:pb-8">
        <SongSection title="Featured Songs" songs={featuredSongs} />
        <SongSection title="Recent Releases" songs={recentReleases} />
        <SongSection title="Popular Hits" songs={popularHits} />
      </main>
      <BottomNavBar />
    </div>
  );
}
