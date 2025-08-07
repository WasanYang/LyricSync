// src/lib/notifications.ts
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  doc,
  getDoc,
  writeBatch,
  serverTimestamp,
  onSnapshot,
} from 'firebase/firestore';
import { db } from './firebase';
import { useState, useEffect, useCallback } from 'react';

export interface AppNotification {
  id: string; // The original notification ID from the 'notifications' collection
  title: string;
  message: string;
  details?: string;
  targetUrl?: string;
  createdAt: number; // Timestamp
}

export interface UserNotification {
  notificationId: string;
  read: boolean;
}

// Function to fetch all notifications for a user (read and unread)
export async function getUserNotifications(
  userId: string
): Promise<AppNotification[]> {
  if (!db) return [];
  const userNotificationsRef = collection(
    db,
    'users',
    userId,
    'user_notifications'
  );
  const q = query(userNotificationsRef, orderBy('createdAt', 'desc'), limit(50));

  const querySnapshot = await getDocs(q);
  if (querySnapshot.empty) return [];

  const notificationPromises = querySnapshot.docs.map(async (docSnap) => {
    const userNotifData = docSnap.data();
    const notifDocRef = doc(db, 'notifications', docSnap.id);
    const notifDoc = await getDoc(notifDocRef);

    if (notifDoc.exists()) {
      const data = notifDoc.data();
      return {
        id: notifDoc.id,
        title: data.title,
        message: data.message,
        details: data.details,
        targetUrl: data.targetUrl,
        createdAt: data.createdAt.toMillis(),
        read: userNotifData.read,
      };
    }
    return null;
  });

  const notifications = (await Promise.all(notificationPromises)).filter(
    (n): n is AppNotification => n !== null
  );

  return notifications;
}

// Function to mark all unread notifications as read for a user
export async function markAllNotificationsAsRead(userId: string): Promise<void> {
  if (!db) return;
  const userNotificationsRef = collection(
    db,
    'users',
    userId,
    'user_notifications'
  );
  const q = query(userNotificationsRef, where('read', '==', false));

  const querySnapshot = await getDocs(q);
  if (querySnapshot.empty) return;

  const batch = writeBatch(db);
  querySnapshot.forEach((docSnap) => {
    batch.update(docSnap.ref, { read: true });
  });

  await batch.commit();
}

// Hook to get unread notifications and their count in real-time
export function useUnreadNotifications(userId?: string) {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchAndSetNotifications = useCallback(async (userId: string) => {
    if (!db) {
      setLoading(false);
      return;
    }
    const userNotificationsRef = collection(
      db,
      'users',
      userId,
      'user_notifications'
    );
    const q = query(
      userNotificationsRef,
      where('read', '==', false),
      orderBy('createdAt', 'desc'),
      limit(10)
    );

    const querySnapshot = await getDocs(q);
    const count = querySnapshot.size;
    setUnreadCount(count);

    const notificationPromises = querySnapshot.docs.map(async (docSnap) => {
      const notifDocRef = doc(db, 'notifications', docSnap.id);
      const notifDoc = await getDoc(notifDocRef);
      if (notifDoc.exists()) {
        const data = notifDoc.data();
        return {
          id: notifDoc.id,
          title: data.title,
          message: data.message,
          targetUrl: data.targetUrl,
          createdAt: data.createdAt.toMillis(),
        };
      }
      return null;
    });

    const fetchedNotifications = (await Promise.all(notificationPromises)).filter(
      (n): n is AppNotification => n !== null
    );
    setNotifications(fetchedNotifications);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    setLoading(true);
    fetchAndSetNotifications(userId); // Initial fetch

    const userNotificationsRef = collection(
      db,
      'users',
      userId,
      'user_notifications'
    );
    const q = query(userNotificationsRef, where('read', '==', false));

    const unsubscribe = onSnapshot(
      q,
      () => {
        // Re-fetch when a change is detected
        fetchAndSetNotifications(userId);
      },
      (error) => {
        console.error('Error listening to notifications:', error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [userId, fetchAndSetNotifications]);

  return { notifications, unreadCount, loading, refresh: () => userId && fetchAndSetNotifications(userId) };
}
