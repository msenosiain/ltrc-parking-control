export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  pages: number;
  currentPage: number;
}
