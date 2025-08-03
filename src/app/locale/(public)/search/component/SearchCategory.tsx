import { Skeleton } from '@/components/ui/skeleton';
import { Song } from '@/lib/songs';
import { SongCarousel } from '@/components/SongCarousel';

export default function SearchCategory({
  title,
  songs,
  isLoading,
}: {
  title: string;
  songs: Song[];
  isLoading?: boolean;
}) {
  if (!isLoading && songs.length === 0) return null;

  return (
    <section>
      <h2 className='text-xl font-bold font-headline mb-4'>{title}</h2>
      <SongCarousel songs={songs} isLoading={isLoading} />
    </section>
  );
}
