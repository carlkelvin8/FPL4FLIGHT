"use client";

interface Props {
  selectedCount: number;
  onDeleteSelected: () => void;
  onClear: () => void;
}

export function BulkActionsBar({ selectedCount, onDeleteSelected, onClear }: Props) {
  if (selectedCount === 0) return null;

  return (
    <div className="flex items-center justify-between rounded-lg border border-brand-200 bg-brand-50 px-4 py-2.5">
      <span className="text-sm font-medium text-brand-800">{selectedCount} selected</span>
      <div className="flex gap-2">
        <button
          onClick={onClear}
          className="rounded-lg border border-runway-300 bg-white px-3 py-1.5 text-xs font-medium text-runway-700 transition-colors hover:bg-runway-50"
        >
          Clear
        </button>
        <button
          onClick={onDeleteSelected}
          className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-red-700"
        >
          Delete Selected
        </button>
      </div>
    </div>
  );
}
