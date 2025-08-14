// src/components/ProfileCard.tsx
'use client';

import { useEffect, useState, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { getAllSavedSongs, getSetlists } from '@/lib/db';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import {
  Music,
  ListMusic,
  User,
  LogOut,
  ChevronRight,
  Edit,
  Save,
  X,
  Loader2,
  Lock,
  Globe,
  Settings,
  ArrowLeft,
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { GoogleIcon } from '@/components/ui/GoogleIcon';
import { useTranslations } from 'next-intl';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import LocalsLink from '@/components/ui/LocalsLink';
import HamburgerMenu from '@/components/HamburgerMenu';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

function StatCard({
  icon: Icon,
  title,
  value,
  isLoading,
  href,
}: {
  icon: React.ElementType;
  title: string;
  value: number;
  isLoading: boolean;
  href: string;
}) {
  return (
    <LocalsLink href={href} className='block'>
      <Card className='hover:bg-muted/80 transition-colors'>
        <CardContent className='p-4 flex items-center justify-between'>
          <div className='flex items-center gap-4'>
            <div className='p-3 bg-muted rounded-full'>
              <Icon className='h-6 w-6 text-muted-foreground' />
            </div>
            <div>
              <p className='font-semibold'>{title}</p>
              {isLoading ? (
                <Skeleton className='h-6 w-12 mt-1' />
              ) : (
                <p className='text-sm text-muted-foreground'>
                  {value} {value === 1 ? 'item' : 'items'}
                </p>
              )}
            </div>
          </div>
          <ChevronRight className='h-5 w-5 text-muted-foreground' />
        </CardContent>
      </Card>
    </LocalsLink>
  );
}

function ProfileLoadingSkeleton() {
  const t = useTranslations('profile');

  return (
    <div className='p-4 space-y-8'>
      <div className='flex items-center justify-between'>
        <h2 className='text-lg font-semibold font-headline'>{t('title')}</h2>
        <Skeleton className='h-8 w-8' />
      </div>
      <div className='flex flex-col items-center text-center space-y-4'>
        <Skeleton className='h-24 w-24 rounded-full' />
        <div className='space-y-2'>
          <Skeleton className='h-7 w-48' />
          <Skeleton className='h-5 w-64' />
        </div>
      </div>
      <div>
        <h2 className='text-lg font-semibold mb-4'>{t('myMusic')}</h2>
        <div className='grid gap-4 md:grid-cols-1'>
          <Card>
            <CardContent className='p-4 flex items-center justify-between'>
              <div className='flex items-center gap-4'>
                <Skeleton className='h-12 w-12 rounded-full' />
                <div>
                  <Skeleton className='h-5 w-24' />
                  <Skeleton className='h-4 w-16 mt-1' />
                </div>
              </div>
              <Skeleton className='h-5 w-5' />
            </CardContent>
          </Card>
          <Card>
            <CardContent className='p-4 flex items-center justify-between'>
              <div className='flex items-center gap-4'>
                <Skeleton className='h-12 w-12 rounded-full' />
                <div>
                  <Skeleton className='h-5 w-24' />
                  <Skeleton className='h-4 w-16 mt-1' />
                </div>
              </div>
              <Skeleton className='h-5 w-5' />
            </CardContent>
          </Card>
        </div>
      </div>
      <Skeleton className='h-10 w-full' />
    </div>
  );
}

export default function ProfileCard() {
  const t = useTranslations('profile');
  const { toast } = useToast();
  const {
    user,
    loading: authLoading,
    logout,
    signInWithGoogle,
    updateProfileName,
    updateProfilePublicStatus,
  } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [songCount, setSongCount] = useState(0);
  const [setlistCount, setSetlistCount] = useState(0);
  const [isLoadingStats, setIsLoadingStats] = useState(true);

  const [isEditingName, setIsEditingName] = useState(false);
  const [newDisplayName, setNewDisplayName] = useState('');
  const [isSavingName, setIsSavingName] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const [isProfilePublic, setIsProfilePublic] = useState(
    user?.isProfilePublic || false
  );
  const [isUpdatingPublicStatus, setIsUpdatingPublicStatus] = useState(false);

  useEffect(() => {
    if (user?.isProfilePublic !== undefined) {
      setIsProfilePublic(user.isProfilePublic);
    }
  }, [user?.isProfilePublic]);

  useEffect(() => {
    async function fetchStats() {
      if (user && !user.isAnonymous) {
        setIsLoadingStats(true);
        try {
          const songs = await getAllSavedSongs(user.uid);
          const setlists = await getSetlists(user.uid);
          setSongCount(songs.length);
          setSetlistCount(setlists.length);
        } catch (error) {
          console.error('Failed to fetch user stats', error);
        } finally {
          setIsLoadingStats(false);
        }
      } else {
        setIsLoadingStats(false);
      }
    }
    fetchStats();
  }, [user]);

  useEffect(() => {
    if (isEditingName && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditingName]);

  const handleEditName = () => {
    if (user?.displayName) {
      setNewDisplayName(user.displayName);
      setIsEditingName(true);
    }
  };

  const handleCancelEdit = () => {
    setIsEditingName(false);
    setNewDisplayName('');
  };

  const handleSaveName = async () => {
    if (!newDisplayName.trim()) {
      toast({
        title: 'Invalid Name',
        description: 'Display name cannot be empty.',
        variant: 'destructive',
      });
      return;
    }
    if (newDisplayName.trim() === user?.displayName) {
      setIsEditingName(false);
      return;
    }
    setIsSavingName(true);
    try {
      await updateProfileName(newDisplayName.trim());
      toast({
        title: 'Name Updated',
        description: 'Your display name has been updated successfully.',
      });
      setIsEditingName(false);
    } catch {
      toast({
        title: 'Error',
        description: 'Could not update your display name.',
        variant: 'destructive',
      });
    } finally {
      setIsSavingName(false);
    }
  };

  const handlePublicToggle = async (checked: boolean) => {
    setIsUpdatingPublicStatus(true);
    try {
      await updateProfilePublicStatus(checked);
      setIsProfilePublic(checked);
      toast({
        title: t('publicStatusUpdated'),
        description: checked ? t('nowPublicDesc') : t('nowPrivateDesc'),
      });
    } catch {
      toast({
        title: 'Error',
        description: 'Could not update your profile status.',
        variant: 'destructive',
      });
    } finally {
      setIsUpdatingPublicStatus(false);
    }
  };

  const handleClose = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete('panel');
    router.replace(`${pathname}?${params.toString()}`);
  };

  if (authLoading || !user) {
    return <ProfileLoadingSkeleton />;
  }

  const isAnonymous = user.isAnonymous;

  return (
    <div className='p-4 space-y-8'>
      <div className='flex items-center justify-between'>
        <Button variant='ghost' size='icon' onClick={handleClose}>
          <ArrowLeft className='h-5 w-5' />
        </Button>
        <h2 className='text-lg font-semibold font-headline'>{t('title')}</h2>
        <Link href={`${pathname}?panel=settings`}>
          <Button variant='ghost' size='icon'>
            <Settings className='h-5 w-5' />
          </Button>
        </Link>
      </div>

      <div className='flex flex-col items-center text-center space-y-4'>
        <Avatar className='h-24 w-24 text-4xl'>
          {!isAnonymous && user.photoURL && (
            <AvatarImage
              src={user.photoURL}
              alt={user.displayName || 'User'}
            />
          )}
          <AvatarFallback>
            {isAnonymous ? (
              <User className='h-10 w-10' />
            ) : (
              user.displayName?.[0].toUpperCase() || 'U'
            )}
          </AvatarFallback>
        </Avatar>
        <div className='space-y-1'>
          {isEditingName ? (
            <div className='flex items-center gap-2'>
              <Input
                ref={inputRef}
                value={newDisplayName}
                onChange={(e) => setNewDisplayName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSaveName()}
                disabled={isSavingName}
                className='h-9'
              />
              <Button
                size='icon'
                onClick={handleSaveName}
                disabled={isSavingName}
                className='h-9 w-9'
              >
                {isSavingName ? (
                  <Loader2 className='h-4 w-4 animate-spin' />
                ) : (
                  <Save className='h-4 w-4' />
                )}
              </Button>
              <Button
                variant='ghost'
                size='icon'
                onClick={handleCancelEdit}
                disabled={isSavingName}
                className='h-9 w-9'
              >
                <X className='h-4 w-4' />
              </Button>
            </div>
          ) : (
            <div className='flex items-center gap-2 group'>
              <h1 className='text-2xl font-bold font-headline'>
                {isAnonymous ? t('guestUser') : user.displayName}
              </h1>
              {!isAnonymous && (
                <Button
                  variant='ghost'
                  size='icon'
                  onClick={handleEditName}
                  className='h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity'
                >
                  <Edit className='h-4 w-4 text-muted-foreground' />
                </Button>
              )}
            </div>
          )}
          {!isAnonymous && (
            <p className='text-muted-foreground'>{user.email}</p>
          )}
        </div>
      </div>

      {isAnonymous ? (
        <Card className='bg-muted'>
          <CardHeader>
            <CardTitle className='font-headline text-center'>
              {t('unlockTitle')}
            </CardTitle>
            <CardDescription className='text-center'>
              {t('unlockDesc')}
            </CardDescription>
          </CardHeader>
          <CardContent className='flex justify-center'>
            <Button onClick={signInWithGoogle} size='lg'>
              <GoogleIcon className='mr-2 h-5 w-5' />
              {t('signInGoogle')}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <div>
            <h2 className='text-lg font-semibold mb-4'>{t('myMusic')}</h2>
            <div className='grid gap-3 md:grid-cols-1'>
              <StatCard
                icon={Music}
                title={t('mySongs')}
                value={songCount}
                isLoading={isLoadingStats}
                href='/library'
              />
              <StatCard
                icon={ListMusic}
                title={t('mySetlists')}
                value={setlistCount}
                isLoading={isLoadingStats}
                href='/my-setlists'
              />
            </div>
          </div>
          <div>
            <h2 className='text-lg font-semibold mb-4'>
              {t('profile.title')}
            </h2>
            <Card>
              <CardContent className='p-4 flex items-center justify-between'>
                <div className='space-y-0.5'>
                  <Label
                    htmlFor='public-profile-switch'
                    className='flex items-center gap-2'
                  >
                    {isProfilePublic ? (
                      <Globe className='h-4 w-4 text-blue-500' />
                    ) : (
                      <Lock className='h-4 w-4 text-yellow-500' />
                    )}
                    {t('publicProfileLabel')}
                  </Label>
                  <p className='text-sm text-muted-foreground'>
                    {t('publicProfileDesc')}
                  </p>
                </div>
                <Switch
                  id='public-profile-switch'
                  checked={isProfilePublic}
                  onCheckedChange={handlePublicToggle}
                  disabled={isUpdatingPublicStatus}
                />
              </CardContent>
            </Card>
          </div>
        </>
      )}

      <Button
        onClick={logout}
        variant='outline'
        className='w-full'
      >
        <LogOut className='mr-2 h-4 w-4' /> {t('signOut')}
      </Button>
    </div>
  );
}
