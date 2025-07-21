
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Check, Copy } from 'lucide-react';
import type { Setlist } from '@/lib/db';

interface ShareSetlistDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  setlist: Setlist;
}

export function ShareSetlistDialog({ isOpen, onOpenChange, setlist }: ShareSetlistDialogProps) {
  const { toast } = useToast();
  const [shareUrl, setShareUrl] = useState('');
  const [isCopied, setIsCopied] = useState(false);

  useEffect(() => {
    if (setlist.firestoreId) {
      setShareUrl(`${window.location.origin}/setlists/shared/${setlist.firestoreId}`);
    }
  }, [setlist.firestoreId]);
  
  useEffect(() => {
      if (!isOpen) {
          // Reset copied state when dialog closes
          setTimeout(() => setIsCopied(false), 200);
      }
  }, [isOpen]);

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl).then(() => {
        setIsCopied(true);
        toast({
            title: "Link Copied!",
            description: "The shareable link has been copied to your clipboard.",
        });
    }, (err) => {
        toast({
            title: "Error",
            description: "Could not copy the link.",
            variant: "destructive",
        });
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share "{setlist.title}"</DialogTitle>
          <DialogDescription>
            Anyone with this link can view and save a copy of this setlist.
          </DialogDescription>
        </DialogHeader>
        <div className="flex items-center space-x-2">
          <div className="grid flex-1 gap-2">
            <Label htmlFor="link" className="sr-only">
              Link
            </Label>
            <Input id="link" defaultValue={shareUrl} readOnly />
          </div>
          <Button type="button" size="icon" className="px-3" onClick={handleCopy}>
            {isCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            <span className="sr-only">Copy Link</span>
          </Button>
        </div>
        <DialogFooter className="sm:justify-end">
          <DialogClose asChild>
            <Button type="button" variant="secondary">
              Done
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
