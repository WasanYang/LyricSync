import { createApi, fakeBaseQuery } from '@reduxjs/toolkit/query/react';
import {
  collection,
  doc,
  DocumentData,
  getCountFromServer,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  Query,
  startAfter,
  where,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { songFromDoc } from '@/lib/songs';
import { Song, toMillisSafe } from '@/lib/db';
import { paginateAndCount } from '@/services/firestore-service';
import { FetchDataParams } from '@/types/table';

type SearchSongsResult = {
  songs: Song[];
  // nextPageCursor: string | null; // ID ของเอกสารตัวสุดท้ายสำหรับใช้ในหน้าถัดไป
  totalCount: number; // จำนวนทั้งหมดของเอกสารในคอลเลกชัน
};

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
    searchCloudSongs: builder.mutation<SearchSongsResult, FetchDataParams>({
      async queryFn({ sorting, columnFilters, pagination }) {
        try {
          columnFilters.push({ id: 'source', value: 'system' });
          const { pageIndex = 0, pageSize = 10 } = pagination || {};
          const songCollection = collection(db, 'songs');
          const result = await paginateAndCount<Song>(
            songCollection,
            'title',
            { pageIndex, pageSize },
            columnFilters,
            async function (doc) {
              const data = doc.data();
              const song: Song = {
                id: doc.id,
                ...data,
                createdAt: toMillisSafe(data.createdAt),
                updatedAt: toMillisSafe(data.updatedAt),
              } as Song;
              return song;
            }
          );
          return {
            data: {
              songs: result.items,
              totalCount: result.totalCount,
            },
          };
        } catch (error: any) {
          console.error('Error searching cloud songs:', error);
          return {
            error: error instanceof Error ? error.message : String(error),
          };
        }
      },
    }),
  }),
});

export const { useGetCloudSongByIdQuery, useSearchCloudSongsMutation } =
  songApi;
