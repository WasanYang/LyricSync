import { Skeleton } from '@/components/ui/skeleton';
import { Song } from '@/lib/songs';
import SongListItem from './SongListItem';

export default function SearchCategory({
  title,
  songs,
  isLoading,
}: {
  title: string;
  songs: Song[];
  isLoading?: boolean;
}) {
  if (isLoading) {
    return (
      <section>
        <h2 className='text-xl font-bold font-headline mb-4'>
          <Skeleton className='h-6 w-32' />
        </h2>
        <div className='grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2'>
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className='h-14 w-full' />
          ))}
        </div>
      </section>
    );
  }

  if (songs.length === 0) return null;

  return (
    <section>
      <h2 className='text-xl font-bold font-headline mb-4'>{title}</h2>
      <div className='grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2'>
        {songs.map((song) => (
          <SongListItem key={song.id} song={song} />
        ))}
      </div>
    </section>
  );
}
