import Link from 'next/link';
import { type Song } from '@/lib/songs';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ArrowRight } from 'lucide-react';

interface SongCardProps {
  song: Song;
}

export default function SongCard({ song }: SongCardProps) {
  return (
    <Link href={`/lyrics/${song.id}`} className="group block">
      <Card className="h-full transition-all duration-300 ease-in-out group-hover:shadow-lg group-hover:border-primary group-hover:-translate-y-1">
        <CardHeader>
          <CardTitle className="font-headline text-lg flex justify-between items-center">
            {song.title}
            <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform duration-300 group-hover:translate-x-1 group-hover:text-primary" />
          </CardTitle>
          <CardDescription className="font-body">{song.artist}</CardDescription>
        </CardHeader>
      </Card>
    </Link>
  );
}
