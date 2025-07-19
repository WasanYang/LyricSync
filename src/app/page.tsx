import { getSongs, type Song } from '@/lib/songs';
import SongCard from '@/components/SongCard';
import HomeHeader from '@/components/HomeHeader';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel"


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
            <CarouselItem key={song.id} className="basis-1/2 sm:basis-1/3 md:basis-1/4 lg:basis-1/5 pl-4">
              <SongCard song={song} />
            </CarouselItem>
          ))}
        </CarouselContent>
        <div className="hidden md:block">
            <CarouselPrevious className="absolute left-[-1.5rem] top-[calc(50%-2.5rem)]" />
            <CarouselNext className="absolute right-[-1.5rem] top-[calc(50%-2.5rem)]" />
        </div>
      </Carousel>
    </section>
  )
}


export default function Home() {
  return (
    <div className="flex-grow flex flex-col">
      <HomeHeader />
      <main className="flex-grow container mx-auto px-4 py-8 space-y-12">
        <SongSection title="Featured Songs" songs={featuredSongs} />
        <SongSection title="Recent Releases" songs={recentReleases} />
        <SongSection title="Popular Hits" songs={popularHits} />
      </main>
    </div>
  );
}
