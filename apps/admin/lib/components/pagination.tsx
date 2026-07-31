"use client";

interface Props {
  page: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}

export function Pagination({ page, totalPages, totalItems, pageSize, onPageChange, onPageSizeChange }: Props) {
  if (totalPages <= 1 && totalItems <= pageSize) return null;

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 border-t border-runway-200 px-4 py-3">
      <span className="text-xs text-runway-500">
        {totalItems > 0 ? `${(page - 1) * pageSize + 1}–${Math.min(page * pageSize, totalItems)} of ${totalItems}` : "0 results"}
      </span>

      <div className="flex items-center gap-3">
        <select
          value={pageSize}
          onChange={(e) => onPageSizeChange(Number(e.target.value))}
          className="rounded-lg border border-runway-300 bg-white px-2 py-1.5 text-xs text-runway-700 focus:border-brand-400 focus:outline-none"
        >
          {[10, 25, 50, 100].map((n) => (
            <option key={n} value={n}>{n} / page</option>
          ))}
        </select>

        <div className="flex items-center gap-1">
          <button
            onClick={() => onPageChange(1)}
            disabled={page <= 1}
            className="rounded-lg px-2 py-1.5 text-xs font-medium text-runway-600 transition-colors hover:bg-runway-100 disabled:cursor-not-allowed disabled:opacity-40"
          >
            ««
          </button>
          <button
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1}
            className="rounded-lg px-2 py-1.5 text-xs font-medium text-runway-600 transition-colors hover:bg-runway-100 disabled:cursor-not-allowed disabled:opacity-40"
          >
            «
          </button>
          <span className="min-w-[4rem] text-center text-xs font-medium text-runway-700">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages}
            className="rounded-lg px-2 py-1.5 text-xs font-medium text-runway-600 transition-colors hover:bg-runway-100 disabled:cursor-not-allowed disabled:opacity-40"
          >
            »
          </button>
          <button
            onClick={() => onPageChange(totalPages)}
            disabled={page >= totalPages}
            className="rounded-lg px-2 py-1.5 text-xs font-medium text-runway-600 transition-colors hover:bg-runway-100 disabled:cursor-not-allowed disabled:opacity-40"
          >
            »»
          </button>
        </div>
      </div>
    </div>
  );
}
