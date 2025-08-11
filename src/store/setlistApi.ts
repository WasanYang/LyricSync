import { createApi, fakeBaseQuery } from '@reduxjs/toolkit/query/react';
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  query,
  collection,
  where,
  getDocs,
} from 'firebase/firestore';
import { app, db } from '@/lib/firebase'; // ต้อง config firebase app แล้ว
import { Setlist, toMillisSafe } from '@/lib/db';

export const setlistApi = createApi({
  reducerPath: 'setlistApi',
  baseQuery: fakeBaseQuery(),
  endpoints: (builder) => ({
    getUserSetlist: builder.query<Setlist[], string>({
      async queryFn(userId) {
        try {
          if (!app) {
            return { error: 'Firebase app is not initialized.' };
          }
          const q = query(
            collection(db, 'setlists'),
            where('userId', '==', userId)
          );

          const querySnapshot = await getDocs(q);
          const setlists: Setlist[] = [];
          for (const docSnap of querySnapshot.docs) {
            const data = docSnap.data();
            setlists.push({
              id: docSnap.id,
              firestoreId: docSnap.id,
              isSynced: true,
              ...(data as any),
              createdAt: toMillisSafe(data.createdAt),
              updatedAt: toMillisSafe(data.updatedAt),
              syncedAt: toMillisSafe(data.syncedAt),
            });
          }
          console.log('Fetched setlists:', setlists);
          if (setlists.length > 0) {
            return { data: setlists };
          } else {
            return { error: 'No setlist data found.' };
          }
        } catch (error) {
          return {
            error: error instanceof Error ? error.message : String(error),
          };
        }
      },
    }),
    getSetlistById: builder.query<any, string>({
      async queryFn(id) {
        try {
          if (!app) {
            return { error: 'Firebase app is not initialized.' };
          }
          const db = getFirestore(app);
          const docRef = doc(db, 'setlists', id);
          const docSnap = await getDoc(docRef);
          if (!docSnap.exists()) return { error: 'Not found' };
          return { data: docSnap.data() };
        } catch (error) {
          return {
            error: error instanceof Error ? error.message : String(error),
          };
        }
      },
    }),
    createSetlist: builder.mutation<any, { id: string; data: any }>({
      async queryFn({ id, data }) {
        try {
          if (!app) {
            return { error: 'Firebase app is not initialized.' };
          }
          const db = getFirestore(app);
          const docRef = doc(db, 'setlists', id);
          await setDoc(docRef, data);
          return { data };
        } catch (error) {
          return {
            error: error instanceof Error ? error.message : String(error),
          };
        }
      },
    }),
  }),
});

export const {
  useGetUserSetlistQuery,
  useGetSetlistByIdQuery,
  useCreateSetlistMutation,
} = setlistApi;
