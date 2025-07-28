import { Setlist } from '@/lib/db';
import Link from 'next/link';
import Image from 'next/image';

export default function RecommendedSetlistCard({
  setlist,
}: {
  setlist: Setlist & { description?: string };
}) {
  const songCount = setlist.songIds.length;

  return (
    <Link
      href={`/shared/setlists/${setlist.firestoreId}`}
      className='block group'
    >
      <div className='group relative space-y-1.5'>
        <div className='aspect-square w-full overflow-hidden rounded-md transition-all duration-300 ease-in-out group-hover:shadow-lg group-hover:shadow-primary/20'>
          <Image
            src={`https://placehold.co/300x300.png?text=${encodeURIComponent(
              setlist.title
            )}`}
            alt={setlist.title}
            width={300}
            height={300}
            className='h-full w-full object-cover transition-transform duration-300 group-hover:scale-105'
            data-ai-hint='stage lights'
          />
        </div>
        <div className='flex-grow min-w-0'>
          <p className='font-semibold font-headline text-sm truncate'>
            {setlist.title}
          </p>
          <p className='text-xs text-muted-foreground truncate'>
            {songCount} {songCount === 1 ? 'song' : 'songs'}
          </p>
        </div>
      </div>
    </Link>
  );
}
