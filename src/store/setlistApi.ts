import { createApi, fakeBaseQuery } from '@reduxjs/toolkit/query/react';
import { getFirestore, doc, getDoc, setDoc } from 'firebase/firestore';
import { app } from '@/lib/firebase'; // ต้อง config firebase app แล้ว

export const setlistApi = createApi({
  reducerPath: 'setlistApi',
  baseQuery: fakeBaseQuery(),
  endpoints: (builder) => ({
    getUserSetlist: builder.query<any, string>({
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
