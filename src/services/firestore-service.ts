import { ColumnFiltersState } from '@tanstack/react-table';
import {
  Query,
  CollectionReference,
  getDocs,
  query,
  orderBy,
  limit,
  startAfter,
  DocumentData,
  where,
  QueryConstraint,
  getCountFromServer,
} from 'firebase/firestore';

export interface PaginationParams {
  pageIndex: number;
  pageSize: number;
}

export async function paginateAndCount<T>(
  collectionRef: CollectionReference<DocumentData>,
  orderByField: string,
  params: PaginationParams,
  columnFilters: ColumnFiltersState,
  mapFn: (doc: DocumentData) => Promise<T>
): Promise<{ items: T[]; totalCount: number }> {
  const filterConstraints: QueryConstraint[] = columnFilters
    .filter((filter) => filter.value)
    .map((filter) => where(filter.id, '==', filter.value));

  const countQuery = query(collectionRef, ...filterConstraints);
  const countSnapshot = await getCountFromServer(countQuery);
  const totalCount = countSnapshot.data().count;

  let lastVisibleDoc = undefined;
  if (params.pageIndex > 0) {
    const cursorQuery = query(
      collectionRef,
      orderBy(orderByField, 'asc'),
      limit(params.pageIndex * params.pageSize),
      ...filterConstraints
    );
    const cursorSnap = await getDocs(cursorQuery);
    lastVisibleDoc = cursorSnap.docs[cursorSnap.docs.length - 1];
  }

  const paginatedQuery: Query<DocumentData> = query(
    collectionRef,
    orderBy(orderByField, 'asc'),
    ...(lastVisibleDoc ? [startAfter(lastVisibleDoc)] : []),
    limit(params.pageSize),
    ...filterConstraints
  );

  const snapshot = await getDocs(paginatedQuery);
  const items = await Promise.all(snapshot.docs.map(mapFn));
  return { items, totalCount };
}
