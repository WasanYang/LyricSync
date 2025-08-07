// src/lib/notifications.ts
import {
  collection,
  query,
  orderBy,
  getDocs,
  doc,
  getDoc,
  writeBatch,
  serverTimestamp,
  onSnapshot,
  setDoc,
  updateDoc,
  deleteDoc,
  Timestamp,
  where,
  limit,
} from 'firebase/firestore';
import { db } from './firebase';
import { useState, useEffect, useCallback } from 'react';

export interface AppNotification {
  id: string; // The original notification ID from the 'notifications' collection
  title: string;
  message: string; // Short message for panel
  details?: string; // Full markdown details
  targetUrl?: string;
  createdAt: number; // Timestamp
  // New fields for scheduling
  status: 'draft' | 'scheduled' | 'sent';
  scheduledAt?: number | null; // Timestamp for when to send
}

export interface UserNotification {
  notificationId: string;
  read: boolean;
}

// Admin function to create or update a notification document
export async function saveNotification(
  notificationData: Omit<AppNotification, 'createdAt'>
): Promise<string> {
  if (!db) throw new Error('Firebase not initialized.');

  const { id, ...dataToSave } = notificationData;

  const docRef = doc(db, 'notifications', id);

  await setDoc(
    docRef,
    {
      ...dataToSave,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(), // Keep track of edits
    },
    { merge: true }
  );

  return id;
}

function toMillisSafe(ts: unknown): number | null {
  // ถ้าไม่มีข้อมูลหรือไม่ใช่ Timestamp ให้คืน null
  if (
    !ts ||
    typeof ts !== 'object' ||
    typeof (ts as any).toMillis !== 'function'
  ) {
    return null;
  }
  return (ts as Timestamp).toMillis();
}

// Function to get a single notification for editing
export async function getNotification(
  id: string
): Promise<AppNotification | null> {
  if (!db) return null;
  const docRef = doc(db, 'notifications', id);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) return null;

  const data = docSnap.data();
  return {
    id: docSnap.id,
    ...data,
    createdAt: (data.createdAt as Timestamp)?.toMillis(),
    scheduledAt: toMillisSafe(data.scheduledAt),
  } as AppNotification;
}

// Function to fetch all notifications for the admin list
export async function getAllAdminNotifications(): Promise<AppNotification[]> {
  if (!db) return [];
  const notificationsRef = collection(db, 'notifications');
  const q = query(notificationsRef, orderBy('createdAt', 'desc'));

  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      createdAt: (data.createdAt as Timestamp)?.toMillis(),
      scheduledAt: toMillisSafe(data.scheduledAt),
    } as AppNotification;
  });
}

// Function to delete a notification
export async function deleteNotification(id: string): Promise<void> {
  if (!db) throw new Error('Firebase not initialized.');
  // Note: This only deletes the main notification. It doesn't remove it
  // from users' sub-collections for performance reasons. They will just
  // point to a non-existent document.
  const docRef = doc(db, 'notifications', id);
  await deleteDoc(docRef);
}

// This function would typically be a Cloud Function triggered on a schedule
// to check for and send scheduled notifications.
export async function sendNotification(notificationId: string) {
  if (!db) throw new Error('Firebase not initialized.');

  const notification = await getNotification(notificationId);
  if (!notification || notification.status !== 'scheduled') {
    throw new Error('Notification not found or not in a sendable state.');
  }

  // --- This part should be a Cloud Function ---
  const batch = writeBatch(db);
  const usersSnapshot = await getDocs(collection(db, 'users'));
  usersSnapshot.forEach((userDoc) => {
    const userNotifRef = doc(
      db,
      `users/${userDoc.id}/user_notifications`,
      notificationId
    );
    batch.set(userNotifRef, { read: false, createdAt: serverTimestamp() });
  });

  // Mark the notification as sent
  const notifRef = doc(db, 'notifications', notificationId);
  batch.update(notifRef, { status: 'sent' });

  await batch.commit();
  // --- End of Cloud Function part ---
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
  const q = query(
    userNotificationsRef,
    orderBy('createdAt', 'desc'),
    limit(50)
  );

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
        status: data.status,
        read: userNotifData.read,
      } as AppNotification & { read: boolean };
    }
    return null;
  });

  const notifications = (await Promise.all(notificationPromises)).filter(
    (n): n is AppNotification & { read: boolean } => n !== null
  );

  return notifications;
}

// Function to mark all unread notifications as read for a user
export async function markAllNotificationsAsRead(
  userId: string
): Promise<void> {
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
          status: data.status,
        };
      }
      return null;
    });

    const fetchedNotifications = (
      await Promise.all(notificationPromises)
    ).filter((n): n is AppNotification => n !== null);
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

  return {
    notifications,
    unreadCount,
    loading,
    refresh: () => userId && fetchAndSetNotifications(userId),
  };
}
