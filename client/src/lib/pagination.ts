/** Default page size for quiz / game / admin content lists */
export const CONTENT_PAGE_SIZE = 8;

/** Modules per page on the public Lessons map sidebar */
export const LESSON_MODULE_PAGE_SIZE = 5;

export function totalPages(itemCount: number, pageSize: number): number {
  if (itemCount <= 0) return 1;
  return Math.max(1, Math.ceil(itemCount / pageSize));
}

export function slicePage<T>(items: readonly T[], page: number, pageSize: number): T[] {
  const start = (page - 1) * pageSize;
  return items.slice(start, start + pageSize);
}

export function pageRangeLabel(page: number, pageSize: number, totalItems: number): { start: number; end: number } {
  if (totalItems === 0) return { start: 0, end: 0 };
  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, totalItems);
  return { start, end };
}
