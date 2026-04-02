import { pageRangeLabel, totalPages } from "@/lib/pagination";

type Props = {
  page: number;
  pageSize: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  className?: string;
};

export function PaginationBar({ page, pageSize, totalItems, onPageChange, className = "" }: Props) {
  const pages = totalPages(totalItems, pageSize);
  if (totalItems <= pageSize) return null;

  const { start, end } = pageRangeLabel(page, pageSize, totalItems);

  return (
    <nav
      className={`flex flex-col gap-3 border-t border-slate-200/80 pt-4 sm:flex-row sm:items-center sm:justify-between ${className}`}
      aria-label="Pagination"
    >
      <p className="text-sm text-slate-600">
        Showing{" "}
        <span className="font-medium text-slate-800">
          {start}–{end}
        </span>{" "}
        of <span className="font-medium text-slate-800">{totalItems}</span>
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Previous
        </button>
        <span className="px-1 text-sm text-slate-500">
          Page {page} of {pages}
        </span>
        <button
          type="button"
          disabled={page >= pages}
          onClick={() => onPageChange(page + 1)}
          className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Next
        </button>
      </div>
    </nav>
  );
}
