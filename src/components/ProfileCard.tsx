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
  LogIn,
  Heart,
  Info,
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { GoogleIcon } from '@/components/ui/GoogleIcon';
import { useTranslations } from 'next-intl';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import LocalsLink from './ui/LocalsLink';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Separator } from './ui/separator';

function ProfileLoadingSkeleton() {
  const t = useTranslations('profile');

  return (
    <div className='p-4 space-y-8'>
      <div className='flex items-center justify-between'>
        <Skeleton className='h-8 w-8' />
        <Skeleton className='h-6 w-24' />
        <Skeleton className='h-8 w-8' />
      </div>
      <div className='flex flex-col items-center text-center space-y-4'>
        <Skeleton className='h-24 w-24 rounded-full' />
        <div className='space-y-2'>
          <Skeleton className='h-7 w-48' />
          <Skeleton className='h-5 w-64' />
        </div>
      </div>
      <div className='space-y-2'>
        <Skeleton className='h-12 w-full' />
        <Skeleton className='h-12 w-full' />
      </div>
      <Skeleton className='h-10 w-full' />
    </div>
  );
}

const NavLink = ({
  href,
  icon: Icon,
  title,
  value,
  isLoading,
}: {
  href: string;
  icon: React.ElementType;
  title: string;
  value?: number;
  isLoading?: boolean;
}) => (
  <LocalsLink
    href={href}
    className='flex items-center p-3 rounded-lg transition-colors hover:bg-muted/80'
  >
    <Icon className='h-5 w-5 text-muted-foreground mr-4' />
    <span className='flex-grow font-medium'>{title}</span>
    {isLoading ? (
      <Skeleton className='h-5 w-8' />
    ) : (
      typeof value === 'number' && (
        <span className='text-sm text-muted-foreground'>{value}</span>
      )
    )}
    <ChevronRight className='h-5 w-5 text-muted-foreground ml-2' />
  </LocalsLink>
);

const FooterLink = ({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) => (
  <LocalsLink
    href={href}
    className='block text-center text-sm text-muted-foreground transition-colors hover:text-primary'
  >
    {children}
  </LocalsLink>
);

export default function ProfileCard() {
  const t = useTranslations('profile');
  const commonT = useTranslations();
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

  if (authLoading) {
    return <ProfileLoadingSkeleton />;
  }

  const isAnonymous = user?.isAnonymous ?? true;

  const renderUserProfile = () => (
    <div className='flex flex-col items-center text-center space-y-4'>
      <Avatar className='h-24 w-24 text-4xl'>
        {user && !isAnonymous && user.photoURL && (
          <AvatarImage src={user.photoURL} alt={user.displayName || 'User'} />
        )}
        <AvatarFallback>
          {user && !isAnonymous ? (
            user.displayName?.[0].toUpperCase() || 'U'
          ) : (
            <User className='h-10 w-10' />
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
              {user && !isAnonymous ? user.displayName : t('guestUser')}
            </h1>
            {user && !isAnonymous && (
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
        {user && !isAnonymous && (
          <p className='text-muted-foreground'>{user.email}</p>
        )}
      </div>
    </div>
  );

  const renderGuestContent = () => (
    <div className='text-center p-4 space-y-4'>
      <div className='flex justify-center'>
        <div className='w-24 h-24 rounded-full bg-muted flex items-center justify-center'>
          <User className='h-12 w-12 text-muted-foreground' />
        </div>
      </div>
      <h2 className='text-xl font-bold font-headline'>{t('unlockTitle')}</h2>
      <p className='text-muted-foreground'>{t('unlockDesc')}</p>
      <Button onClick={signInWithGoogle} size='lg' className='w-full'>
        <GoogleIcon className='mr-2 h-5 w-5' />
        {t('signInGoogle')}
      </Button>
      {user && isAnonymous && (
        <Button onClick={logout} variant='outline' className='w-full'>
          <LogOut className='mr-2 h-4 w-4' /> {t('signOut')}
        </Button>
      )}
    </div>
  );

  return (
    <div className='p-4 flex flex-col h-full'>
      <header className='flex items-center justify-between mb-6'>
        <Button variant='ghost' size='icon' onClick={handleClose}>
          <ArrowLeft className='h-5 w-5' />
        </Button>
        <h2 className='text-lg font-semibold font-headline'>{t('title')}</h2>
        <Link href={`${pathname}?panel=settings`}>
          <Button variant='ghost' size='icon'>
            <Settings className='h-5 w-5' />
          </Button>
        </Link>
      </header>

      {/* Main Content Area */}
      <div className='flex-grow space-y-8'>
        {user && !isAnonymous ? renderUserProfile() : renderGuestContent()}

        {user && !isAnonymous && (
          <>
            <div className='space-y-2'>
              <NavLink
                href='/library'
                icon={Music}
                title={t('mySongs')}
                value={songCount}
                isLoading={isLoadingStats}
              />
              <NavLink
                href='/my-setlists'
                icon={ListMusic}
                title={t('mySetlists')}
                value={setlistCount}
                isLoading={isLoadingStats}
              />
            </div>
            <div className='p-3 rounded-lg flex items-center justify-between'>
              <Label
                htmlFor='public-profile-switch'
                className='flex items-center gap-4 cursor-pointer'
              >
                {isProfilePublic ? (
                  <Globe className='h-5 w-5 text-muted-foreground' />
                ) : (
                  <Lock className='h-5 w-5 text-muted-foreground' />
                )}
                <span className='font-medium'>{t('publicProfileLabel')}</span>
              </Label>
              <Switch
                id='public-profile-switch'
                checked={isProfilePublic}
                onCheckedChange={handlePublicToggle}
                disabled={isUpdatingPublicStatus}
              />
            </div>
          </>
        )}
      </div>

      {/* Footer Links & Sign Out Button */}
      <div className='mt-auto space-y-6 pt-6'>
        <Separator />
        <div className='flex items-center justify-center gap-6'>
          <FooterLink href='/donate'>{commonT('supportUs')}</FooterLink>
          <FooterLink href='/welcome'>{commonT('aboutApp')}</FooterLink>
          <FooterLink href='/privacy-policy'>
            {commonT('privacyPolicy')}
          </FooterLink>
        </div>
        {user && !isAnonymous && (
          <Button onClick={logout} variant='ghost' className='w-full'>
            <LogOut className='mr-2 h-4 w-4' /> {t('signOut')}
          </Button>
        )}
      </div>
    </div>
  );
}
