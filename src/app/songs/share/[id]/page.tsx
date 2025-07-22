
// src/app/songs/share/[id]/page.tsx
'use client';

import { useState, useEffect, useMemo } from 'react';
import { useParams, notFound } from 'next/navigation';
import { getCloudSongById, type Song, type LyricLine } from '@/lib/db';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Copy, Check, Music, Guitar } from 'lucide-react';
import Image from 'next/image';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { transposeChord } from '@/lib/chords';

function LoadingSkeleton() {
    return (
        <div className="space-y-8 max-w-2xl mx-auto">
            <div className="space-y-3 pt-8 text-center">
                <Skeleton className="h-10 w-3/4 mx-auto" />
                <Skeleton className="h-6 w-1/2 mx-auto" />
            </div>
             <div className="flex justify-center gap-4">
                <Skeleton className="h-11 w-48" />
            </div>
            <div className="space-y-4">
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-64 w-full" />
            </div>
        </div>
    )
}

const parseLyricsForDisplay = (
  line: string
): Array<{ chord: string | null; text: string }> => {
  const regex = /\[([^\]]+)\]([^\[]*)/g;
  const parts: Array<{ chord: string | null; text: string }> = [];
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(line)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ chord: null, text: line.substring(lastIndex, match.index) });
    }
    parts.push({ chord: match[1], text: match[2] });
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < line.length) {
    parts.push({ chord: null, text: line.substring(lastIndex) });
  }
  
  if (parts.length === 0) {
    return [{ chord: null, text: line }];
  }

  return parts;
};


const LyricLineDisplay = ({ line, showChords }: { line: LyricLine, showChords: boolean }) => {
    const parsedLine = useMemo(() => parseLyricsForDisplay(line.text), [line.text]);
    const cleanLyricText = useMemo(() => line.text.replace(/\[[^\]]+\]/g, '').trim(), [line.text]);
    const isSectionHeader = line.text.startsWith('(') && line.text.endsWith(')');
    const hasChords = parsedLine.some(p => p.chord);

    if (isSectionHeader) {
        return <p className="italic text-muted-foreground my-4">{`[ ${line.text.substring(1, line.text.length - 1)} ]`}</p>
    }

    if (!showChords || !hasChords) {
         return <div className="min-h-[1.5rem] whitespace-pre-wrap">{cleanLyricText}</div>;
    }

    return (
        <div className="flex flex-col items-start leading-tight mb-4">
            {/* Chord Line */}
            <div className="text-primary font-semibold text-sm -mb-1">
                {parsedLine.map((part, index) => (
                    <span key={`chord-${index}`} className="whitespace-pre">
                        <span>{part.chord ? transposeChord(part.chord, 0) : ''}</span>
                        <span className="text-transparent">{part.text}</span>
                    </span>
                ))}
            </div>
             {/* Lyric Line */}
            <div className="whitespace-pre-wrap">{cleanLyricText}</div>
        </div>
    );
};


function SharedSongContent() {
    const params = useParams();
    const { toast } = useToast();
    const id = Array.isArray(params.id) ? params.id[0] : params.id;
    
    const [song, setSong] = useState<Song | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isCopied, setIsCopied] = useState(false);
    const [showChords, setShowChords] = useState(true);
    
    const shareUrl = typeof window !== 'undefined' ? window.location.href : '';

    useEffect(() => {
        async function loadSong() {
            if (!id) return;
            try {
                setIsLoading(true);
                const loadedSong = await getCloudSongById(id);
                if (loadedSong) {
                    setSong(loadedSong);
                } else {
                    notFound();
                }
            } catch (err) {
                console.error("Failed to load shared song", err);
                notFound();
            } finally {
                setIsLoading(false);
            }
        }
        loadSong();
    }, [id]);

    const handleCopy = () => {
        navigator.clipboard.writeText(shareUrl).then(() => {
            setIsCopied(true);
            toast({
                title: "Link Copied!",
                description: "The shareable link has been copied to your clipboard.",
            });
            setTimeout(() => setIsCopied(false), 2000);
        }, (err) => {
            toast({
                title: "Error",
                description: "Could not copy the link.",
                variant: "destructive",
            });
        });
    };
    
    if (isLoading) {
        return <LoadingSkeleton />;
    }

    if (!song) {
        return notFound();
    }

    return (
      <div className="space-y-8 max-w-2xl mx-auto">
        <div className="space-y-2 pt-8 text-center">
            <h1 className="text-4xl font-bold font-headline">{song.title}</h1>
            <p className="text-xl text-muted-foreground">{song.artist}</p>
            <div className="text-sm text-muted-foreground pt-1">
                {song.originalKey && <span>Key: {song.originalKey}</span>}
                {song.bpm && <span className="before:content-['•'] before:mx-2">BPM: {song.bpm}</span>}
                {song.timeSignature && <span className="before:content-['•'] before:mx-2">Time: {song.timeSignature}</span>}
            </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <div className="flex items-center gap-2">
                 <Button onClick={handleCopy} variant="outline" className="w-32">
                    {isCopied ? <Check className="mr-2 h-4 w-4 text-green-500"/> : <Copy className="mr-2 h-4 w-4"/>}
                    {isCopied ? 'Copied!' : 'Copy Link'}
                 </Button>
                <Button asChild className="w-36">
                    <Link href={`/lyrics/${song.id}/player`}>
                        <Music className="mr-2 h-4 w-4" /> Open in Player
                    </Link>
                </Button>
            </div>
             <div className="flex items-center space-x-2 p-2 rounded-lg bg-muted/50">
                <Guitar className="h-4 w-4 text-muted-foreground" />
                <Label htmlFor="show-chords" className="text-sm font-medium">Show Chords</Label>
                <Switch id="show-chords" checked={showChords} onCheckedChange={setShowChords} />
            </div>
        </div>
        
        <div className="p-4 sm:p-6 bg-muted/30 rounded-lg leading-relaxed font-body">
             {song.lyrics.map((line, index) => (
                <LyricLineDisplay key={index} line={line} showChords={showChords} />
             ))}
        </div>
      </div>
    );
}

export default function SharedSongPage() {
    return (
        <div className="flex-grow flex flex-col bg-background min-h-screen">
             <header className='sticky top-0 z-40 w-full bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60'>
                <div className='flex h-16 items-center justify-between px-4 max-w-4xl mx-auto'>
                    <Link href='/' className='flex items-center space-x-2'>
                        <Image src='/icons/logo.png' alt='Rhythmic Reads' width={24} height={24} />
                        <span className='font-bold font-headline text-lg'>Rhythmic Reads</span>
                    </Link>
                </div>
            </header>
            <main className="flex-grow container mx-auto px-4 py-8 pb-24 md:pb-8 relative">
                <SharedSongContent />
            </main>
        </div>
    );
}
