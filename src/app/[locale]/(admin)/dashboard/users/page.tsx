// src/app/[locale]/(admin)/dashboard/users/page.tsx
'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { getAllUsers } from '@/lib/db';
import type { User } from '@/lib/types/database';
import { Skeleton } from '@/components/ui/skeleton';
import Header from '@/components/Header';
import BottomNavBar from '@/components/BottomNavBar';
import { UserList } from '@/components/admin';
import { EmptyState, SearchInput, LoadingSkeleton } from '@/components/shared';
import { useToast } from '@/hooks/use-toast';
import { Users } from 'lucide-react';

export default function AdminUsersPage() {
  const { user, isSuperAdmin, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const loadUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      const allUsers = await getAllUsers();
      setUsers(allUsers);
    } catch {
      toast({
        title: 'Error',
        description: 'Could not fetch users.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    if (!authLoading) {
      if (!user || !isSuperAdmin) {
        router.replace('/');
      } else {
        loadUsers();
      }
    }
  }, [user, isSuperAdmin, authLoading, router, loadUsers]);

  const filteredUsers = useMemo(() => {
    if (!searchTerm) {
      return users;
    }
    return users.filter(
      (u) =>
        u.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [users, searchTerm]);

  if (authLoading || !user || !isSuperAdmin) {
    return <LoadingSkeleton />;
  }

  return (
    <div className='flex-grow flex flex-col'>
      <Header />
      <main className='flex-grow container mx-auto px-4 py-8 pb-24 md:pb-8'>
        <div className='space-y-8'>
          <h1 className='text-3xl font-bold font-headline'>Manage Users</h1>

          <SearchInput
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder='Search by name or email...'
          />

          {isLoading ? (
            <div className='space-y-2'>
              <Skeleton className='h-16 w-full' />
              <Skeleton className='h-16 w-full' />
              <Skeleton className='h-16 w-full' />
            </div>
          ) : users.length > 0 || searchTerm ? (
            <div className='space-y-6'>
              {filteredUsers.length > 0 ? (
                <UserList users={filteredUsers} />
              ) : (
                <EmptyState
                  icon={Users}
                  title='No Users Found'
                  description='No users matched your search criteria.'
                />
              )}
            </div>
          ) : (
            <EmptyState
              icon={Users}
              title='No Users in Database'
              description='There are no registered users yet.'
            />
          )}
        </div>
      </main>
      <BottomNavBar />
    </div>
  );
}
