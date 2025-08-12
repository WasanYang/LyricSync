import {
  SortingState,
  ColumnFiltersState,
  PaginationState,
} from '@tanstack/react-table';

export interface ISearchParams {
  /**
   * pagination
   */
  p: string;
  /**
   * sorting
   */
  s: string;
  /**
   * column filters
   */
  f: string;
}

export interface FetchDataParams {
  sorting: SortingState;
  columnFilters: ColumnFiltersState;
  pagination: PaginationState;
}
