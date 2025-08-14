import { Setlist } from '@/lib/db';
import { User } from 'firebase/auth';
import { Skeleton } from './ui/skeleton';
import { Button } from './ui/button';
import Link from 'next/link';
import { ChevronRight, ListMusic, Music } from 'lucide-react';
import { useTranslations } from 'next-intl';
import LocalsLink from './ui/LocalsLink';

function RecentSetlistItem({ setlist }: { setlist: Setlist }) {
  const isOwner = setlist.source !== 'saved';
  const songCount = setlist.songIds.length;
  const linkHref = isOwner
    ? `/my-setlists/${setlist.id}`
    : `/shared/setlists/${setlist.firestoreId}`;
  const t = useTranslations('setlist');
  return (
    <LocalsLink
      href={linkHref}
      className='block p-3 rounded-lg bg-muted hover:bg-muted/80 transition-colors'
    >
      <div className='flex items-center justify-between'>
        <div className='flex items-center gap-3'>
          {isOwner ? (
            <ListMusic className='h-5 w-5 text-muted-foreground flex-shrink-0' />
          ) : (
            <Music className='h-5 w-5 text-purple-500 flex-shrink-0' />
          )}
          <div>
            <p className='font-semibold font-headline truncate'>
              {setlist.title}
            </p>
            <p className='text-sm text-muted-foreground'>
              {isOwner
                ? t('songCount', { count: songCount })
                : t('byAuthor', { authorName: setlist.authorName })}
            </p>
          </div>
        </div>
        <ChevronRight className='h-5 w-5 text-muted-foreground' />
      </div>
    </LocalsLink>
  );
}

export function RecentSetlists({
  user,
  recentSetlists,
  isLoadingSetlists,
}: {
  user: User | null;
  recentSetlists: Setlist[];
  isLoadingSetlists: boolean;
}) {
  const t = useTranslations('home');

  if (isLoadingSetlists) {
    return (
        <div className='space-y-4'>
          <Skeleton className='h-7 w-32' />
          <div className='space-y-2'>
            <Skeleton className='h-16 w-full' />
            <Skeleton className='h-16 w-full' />
          </div>
        </div>
      );
  }

  if (recentSetlists.length === 0) {
      return null;
  }


  return (
    <section>
        <div className='flex items-center justify-between mb-4'>
        <h2 className='text-xl font-headline font-semibold'>
            {t('recentSetlists')}
        </h2>
        <Button variant='link' asChild style={{ color: '#1DB954' }}>
            <LocalsLink href='/my-setlists'>{t('viewAll')}</LocalsLink>
        </Button>
        </div>
        <div className='space-y-2'>
        {recentSetlists.map((setlist) => (
            <RecentSetlistItem key={setlist.id} setlist={setlist} />
        ))}
        </div>
    </section>
  );
}
