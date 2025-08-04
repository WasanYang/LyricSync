// src/components/ShareSetlistDialog.tsx
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
import { Switch } from './ui/switch';
import { updateSetlistPublicStatus } from '@/lib/db';
import { Separator } from './ui/separator';
import { useTranslations } from 'next-intl';

interface ShareSetlistDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  setlist: Setlist;
  onStatusChange: () => void;
}

export function ShareSetlistDialog({
  isOpen,
  onOpenChange,
  setlist,
  onStatusChange,
}: ShareSetlistDialogProps) {
  const t = useTranslations('shareSetlist');
  const { toast } = useToast();
  const [shareUrl, setShareUrl] = useState('');
  const [isCopied, setIsCopied] = useState(false);
  const [isPublic, setIsPublic] = useState(setlist.isPublic || false);

  useEffect(() => {
    if (setlist.firestoreId) {
      setShareUrl(
        `${window.location.origin}/shared/setlists/${setlist.firestoreId}`
      );
    }
    // Update internal state if the prop changes
    setIsPublic(setlist.isPublic || false);
  }, [setlist.firestoreId, setlist.isPublic]);

  useEffect(() => {
    if (!isOpen) {
      // Reset copied state when dialog closes
      setTimeout(() => setIsCopied(false), 200);
    }
  }, [isOpen]);

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl).then(
      () => {
        setIsCopied(true);
        toast({
          title: t('linkCopiedToastTitle'),
          description: t('linkCopiedToastDesc'),
        });
      },
      () => {
        toast({
          title: 'Error',
          description: 'Could not copy the link.',
          variant: 'destructive',
        });
      }
    );
  };

  const handlePublicToggle = async (checked: boolean) => {
    if (!setlist.firestoreId) return;
    try {
      setIsPublic(checked); // Optimistic UI update
      await updateSetlistPublicStatus(setlist.firestoreId, checked);
      toast({
        title: checked ? t('nowPublicToastTitle') : t('nowPrivateToastTitle'),
        description: checked
          ? t('nowPublicToastDesc')
          : t('nowPrivateToastDesc'),
      });
      onStatusChange(); // Refresh the list on the main page
    } catch {
      setIsPublic(!checked); // Revert on error
      toast({
        title: 'Error',
        description: "Could not update the setlist's status.",
        variant: 'destructive',
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-md'>
        <DialogHeader>
          <DialogTitle>{t('title', { title: setlist.title })}</DialogTitle>
          <DialogDescription>{t('desc')}</DialogDescription>
        </DialogHeader>
        <div className='space-y-4 py-2'>
          <div className='flex items-center space-x-2'>
            <div className='grid flex-1 gap-2'>
              <Label htmlFor='link' className='sr-only'>
                {t('linkLabel')}
              </Label>
              <Input id='link' defaultValue={shareUrl} readOnly />
            </div>
            <Button
              type='button'
              size='icon'
              className='px-3'
              onClick={handleCopy}
            >
              {isCopied ? (
                <Check className='h-4 w-4' />
              ) : (
                <Copy className='h-4 w-4' />
              )}
              <span className='sr-only'>{t('copyButton')}</span>
            </Button>
          </div>
          <Separator />
          <div className='flex items-center justify-between rounded-lg border p-3'>
            <div className='space-y-0.5'>
              <Label htmlFor='public-switch'>{t('publicSwitchLabel')}</Label>
              <p className='text-xs text-muted-foreground'>
                {t('publicSwitchDesc')}
              </p>
            </div>
            <Switch
              id='public-switch'
              checked={isPublic}
              onCheckedChange={handlePublicToggle}
            />
          </div>
        </div>
        <DialogFooter className='sm:justify-end'>
          <DialogClose asChild>
            <Button type='button' variant='secondary'>
              {t('doneButton')}
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
