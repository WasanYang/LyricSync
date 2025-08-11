import { createApi, fakeBaseQuery } from '@reduxjs/toolkit/query/react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { songFromDoc } from '@/lib/songs';

export const songApi = createApi({
  reducerPath: 'songApi',
  baseQuery: fakeBaseQuery(),
  endpoints: (builder) => ({
    getCloudSongById: builder.query<any, string>({
      async queryFn(id) {
        try {
          const docRef = doc(db, 'songs', id);
          const docSnap = await getDoc(docRef);

          if (docSnap.exists()) {
            console.log('da', songFromDoc(docSnap));
            return { data: songFromDoc(docSnap) };
          } else {
            return { error: 'Not found' };
          }
        } catch (error: any) {
          console.error('Error getting cloud song:', error);
          return {
            error: error instanceof Error ? error.message : String(error),
          };
        }
      },
    }),
  }),
});

export const { useGetCloudSongByIdQuery } = songApi;
