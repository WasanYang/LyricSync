// src/app/songs/share/[id]/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useParams, notFound } from 'next/navigation';
import { getCloudSongById, type Song, type LyricLine } from '@/lib/db';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Copy, Check, Music, ArrowLeft } from 'lucide-react';
import Image from 'next/image';
import { useToast } from '@/hooks/use-toast';
import { transposeChord } from '@/lib/chords';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

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

const LyricSection = ({ text, isHeader }: { text: string; isHeader: boolean; }) => {
    if (isHeader) {
        return <h3 className="font-bold text-lg mt-6 mb-2">{text}</h3>
    }
    
    // Remove chords and split into lines
    const lines = text.split('\n').map(line => {
      // Remove the measure number and pipe: "4 | [C]Hello" -> "[C]Hello"
      const textOnly = line.split('|').slice(1).join('|').trim();
      // Remove chords: "[C]Hello" -> "Hello"
      return textOnly.replace(/\[[^\]]+\]/g, '').trim();
    });

    return (
        <div className="whitespace-pre-wrap leading-relaxed">
            {lines.map((line, idx) => (
                <div key={idx} className="min-h-[1.5em]">
                    {line}
                </div>
            ))}
        </div>
    );
}

function SharedSongContent() {
    const params = useParams();
    const { toast } = useToast();
    const id = Array.isArray(params.id) ? params.id[0] : params.id;
    
    const [song, setSong] = useState<Song | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isCopied, setIsCopied] = useState(false);
    
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
    
    const formattedLyrics = song.lyrics.map(l => `${l.measures} | ${l.text}`).join('\n');
    const sections = formattedLyrics.split(/\n(?=0\s*\|\s*\()/g);


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

        <div className="flex flex-wrap gap-2 justify-center">
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button onClick={handleCopy} variant="outline">
                            {isCopied ? <Check className="mr-2 h-4 w-4 text-green-500"/> : <Copy className="mr-2 h-4 w-4"/>}
                            {isCopied ? 'Copied!' : 'Copy Link'}
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent><p>{shareUrl}</p></TooltipContent>
                </Tooltip>
            </TooltipProvider>
            <Button asChild>
                <Link href={`/lyrics/${song.id}/player`}>
                    <Music className="mr-2 h-4 w-4" /> Open in Player
                </Link>
            </Button>
        </div>
        
        <div className="p-4 sm:p-6 bg-muted/30 rounded-lg">
             {sections.map((section, index) => {
                const isHeader = section.startsWith('0 | (');
                const text = isHeader ? section.replace(/0\s*\|\s*\((.*)\)/, '$1') : section;
                return <LyricSection key={index} text={text} isHeader={isHeader} />
             })}
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
