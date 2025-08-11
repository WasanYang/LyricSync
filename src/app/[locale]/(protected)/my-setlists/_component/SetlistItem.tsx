'use client';

import { useState } from 'react';
import Link from 'next/link';
import { deleteSetlist, type Setlist } from '@/lib/db';
import { Button } from '@/components/ui/button';
import {
  Trash2,
  ListMusic,
  CheckCircle,
  Edit,
  Share2,
  Users,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { ShareSetlistDialog } from '@/components/ShareSetlistDialog';
import { useTranslations } from 'next-intl';
import LocalsLink from '@/components/ui/LocalsLink';

const SetlistItem = ({
  setlist,
  onSetlistChange,
}: {
  setlist: Setlist;
  onSetlistChange: () => void;
}) => {
  const t = useTranslations();
  const { toast } = useToast();
  const { user } = useAuth();
  const [isShareOpen, setIsShareOpen] = useState(false);
  const isOwner = setlist.source !== 'saved';

  const handleDelete = async () => {
    if (!user) return;
    try {
      await deleteSetlist(setlist.id, user.uid);
      toast({
        title: t('setlist.setlistRemovedToastTitle'),
        description: t('setlist.setlistRemovedToastDesc', {
          title: setlist.title,
        }),
      });
      onSetlistChange();
    } catch {
      toast({
        title: 'Error',
        description: t('setlist.setlistRemoveErrorToast'),
        variant: 'destructive',
      });
    }
  };

  const getStatusIcon = () => {
    let icon: React.ReactNode;
    let tooltipText: string;

    if (!isOwner) {
      icon = <Users className='h-5 w-5 text-purple-500 flex-shrink-0' />;
      tooltipText = t('setlist.savedFromTooltip', {
        authorName: setlist.authorName ?? '',
      });
    } else if (setlist.isPublic) {
      icon = <CheckCircle className='h-5 w-5 text-green-500 flex-shrink-0' />;
      tooltipText = 'Public Setlist';
    } else {
      icon = (
        <ListMusic className='h-5 w-5 text-muted-foreground flex-shrink-0' />
      );
      tooltipText = 'Private Setlist';
    }

    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <span className='flex items-center'>{icon}</span>
        </TooltipTrigger>
        <TooltipContent>
          <p>{tooltipText}</p>
        </TooltipContent>
      </Tooltip>
    );
  };

  const songCount = setlist.songIds?.length || 0;
  const linkHref = `/my-setlists/${setlist.id}`;

  return (
    <>
      <div
        className={cn(
          'p-3 rounded-lg bg-muted/50 flex items-center justify-between transition-colors',
          'hover:bg-muted'
        )}
      >
        <LocalsLink
          href={linkHref}
          key={setlist.id}
          className='flex-grow flex items-center gap-4 min-w-0'
        >
          {getStatusIcon()}
          <div className='flex-grow min-w-0'>
            <h2 className='font-headline font-semibold text-base truncate'>
              {setlist.title}
            </h2>
            <p className='text-sm text-muted-foreground'>
              {isOwner
                ? t('setlist.songCount', { count: songCount })
                : t('setlist.byAuthor', {
                    authorName: setlist.authorName ?? '',
                  })}
            </p>
          </div>
        </LocalsLink>
        <div className='flex items-center gap-1 ml-2'>
          {isOwner && (
            <>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    asChild
                    variant='ghost'
                    size='icon'
                    className='h-8 w-8 text-muted-foreground'
                  >
                    <LocalsLink
                      href={`/my-setlists/edit/${setlist.id}`}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Edit className='h-4 w-4' />
                    </LocalsLink>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{t('setlist.editTooltip')}</p>
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setIsShareOpen(true);
                    }}
                    variant='ghost'
                    size='icon'
                    className='h-8 w-8 text-muted-foreground'
                  >
                    <Share2 className='h-4 w-4' />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{t('setlist.shareTooltip')}</p>
                </TooltipContent>
              </Tooltip>
            </>
          )}

          <AlertDialog>
            <Tooltip>
              <TooltipTrigger asChild>
                <AlertDialogTrigger asChild>
                  <Button
                    variant='ghost'
                    size='icon'
                    className='h-8 w-8 text-muted-foreground hover:text-destructive'
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Trash2 className='h-4 w-4' />
                  </Button>
                </AlertDialogTrigger>
              </TooltipTrigger>
              <TooltipContent>
                <p>
                  {isOwner
                    ? t('setlist.deleteTooltip')
                    : t('setlist.removeFromListTooltip')}
                </p>
              </TooltipContent>
            </Tooltip>
            <AlertDialogContent onClick={(e) => e.stopPropagation()}>
              <AlertDialogHeader>
                <AlertDialogTitle>
                  {t('setlist.deleteDialogTitle')}
                </AlertDialogTitle>
                <AlertDialogDescription>
                  {isOwner
                    ? t('setlist.deleteDialogDesc', { title: setlist.title })
                    : t('setlist.removeDialogDesc', { title: setlist.title })}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  className='bg-destructive hover:bg-destructive/90'
                >
                  {isOwner
                    ? t('setlist.deleteButton')
                    : t('setlist.removeButton')}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
      {setlist.firestoreId && (
        <ShareSetlistDialog
          isOpen={isShareOpen}
          onOpenChange={setIsShareOpen}
          setlist={setlist}
          onStatusChange={onSetlistChange}
        />
      )}
    </>
  );
};

export default SetlistItem;
