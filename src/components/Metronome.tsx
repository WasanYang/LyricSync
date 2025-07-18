'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Play, Pause } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function Metronome() {
  const [bpm, setBpm] = useState(120);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isVisualTick, setIsVisualTick] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isPlaying) {
      const interval = 60000 / bpm;
      intervalRef.current = setInterval(() => {
        setIsVisualTick(true);
        setTimeout(() => setIsVisualTick(false), 100);
      }, interval);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      setIsVisualTick(false);
    }
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isPlaying, bpm]);

  const handleBpmChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10);
    if (value >= 40 && value <= 240) {
      setBpm(value);
    }
  };

  return (
    <div className="space-y-4">
        <h3 className="font-headline font-semibold">Metronome</h3>
        <div className="flex items-center gap-4">
            <div
            className={cn(
                'w-8 h-8 rounded-full bg-muted transition-all',
                isVisualTick && 'bg-primary scale-110'
            )}
            />
            <Button variant="outline" size="icon" onClick={() => setIsPlaying(!isPlaying)}>
            {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </Button>
        </div>
        <div>
            <Label htmlFor="bpm">BPM</Label>
            <Input
            id="bpm"
            type="number"
            value={bpm}
            onChange={handleBpmChange}
            min="40"
            max="240"
            />
        </div>
    </div>
  );
}
