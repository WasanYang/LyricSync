import { ListMusic, Music } from 'lucide-react';
import { Button } from './ui/button';
import Link from 'next/link';
import { User } from 'firebase/auth';

export function WelcomeUserCard({ user }: { user: User }) {
  return (
    <section>
      <h1 className='text-2xl font-bold font-headline mb-4'>
        Welcome back,{' '}
        {user.displayName ? user.displayName.split(' ')[0] : 'Guest'}!
      </h1>
      <div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
        <Button variant='outline' size='lg' className='justify-start' asChild>
          <Link href='/setlists'>
            <ListMusic className='mr-3 h-5 w-5' /> My Setlists
          </Link>
        </Button>
        <Button variant='outline' size='lg' className='justify-start' asChild>
          <Link href='/library'>
            <Music className='mr-3 h-5 w-5' /> My Library
          </Link>
        </Button>
      </div>
    </section>
  );
}
