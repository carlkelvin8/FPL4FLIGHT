"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { AipDocument } from "../repository";
import { deleteAipDocument } from "../actions";
import { Pagination } from "@/lib/components/pagination";

interface Props {
  documents: AipDocument[];
  storageBaseUrl: string;
}

const FOLDER_OPTIONS = [
  { value: "all", label: "All folders" },
  { value: "Part_1_-_GEN", label: "GEN - General" },
  { value: "Part_2_-_ENR", label: "ENR - En Route" },
  { value: "Part_3_-_AD", label: "AD - Aerodromes" },
];

function formatSize(bytes: number): string {
  if (bytes === 0) return "—";
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function AipDocumentList({ documents, storageBaseUrl }: Props) {
  const router = useRouter();
  const [deletingPath, setDeletingPath] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [folder, setFolder] = useState("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return documents.filter((doc) => {
      if (folder !== "all" && doc.folder !== folder) return false;
      if (q && !doc.title.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [documents, query, folder]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const pageItems = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);

  function handleQueryChange(value: string) {
    setQuery(value);
    setPage(1);
  }

  function handleFolderChange(value: string) {
    setFolder(value);
    setPage(1);
  }

  function handlePageSizeChange(size: number) {
    setPageSize(size);
    setPage(1);
  }

  async function handleDelete(doc: AipDocument) {
    if (!confirm(`Delete "${doc.title}" permanently?\n\nThis cannot be undone.`)) return;
    setActionError(null);
    setDeletingPath(doc.path);
    const result = await deleteAipDocument(doc.path);
    setDeletingPath(null);
    if (result.error) {
      setActionError(result.error);
    } else {
      router.refresh();
    }
  }

  return (
    <div>
      {actionError && (
        <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700" role="alert">
          {actionError}
        </div>
      )}

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <input
          type="search"
          value={query}
          onChange={(e) => handleQueryChange(e.target.value)}
          placeholder="Search documents…"
          className="w-64 rounded-lg border border-runway-300 bg-white px-3 py-2 text-sm text-runway-700 placeholder-runway-400 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
        />
        <select
          value={folder}
          onChange={(e) => handleFolderChange(e.target.value)}
          className="rounded-lg border border-runway-300 bg-white px-3 py-2 text-sm text-runway-700 focus:border-brand-400 focus:outline-none"
        >
          {FOLDER_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {documents.length === 0 && (
        <div className="rounded-lg border border-runway-200 bg-white p-8 text-center text-sm text-runway-500">
          No AIP documents found. Upload PDFs to the <code className="font-mono text-xs">aip-docs</code> storage bucket.
        </div>
      )}

      {documents.length > 0 && filtered.length === 0 && (
        <div className="rounded-lg border border-runway-200 bg-white p-8 text-center text-sm text-runway-500">
          No documents match your filters.
        </div>
      )}

      {filtered.length > 0 && (
        <div className="overflow-hidden rounded-lg border border-runway-200 bg-white">
          <table className="min-w-full divide-y divide-runway-200">
            <thead className="bg-runway-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-runway-600">Document</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-runway-600">Folder</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-runway-600">Size</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-runway-600">Updated</th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-runway-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-runway-100">
              {pageItems.map((doc) => (
                <tr key={doc.id} className="transition-colors hover:bg-runway-50">
                  <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-runway-900">
                    {doc.title}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-runway-600">
                    {doc.folderLabel}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-runway-600">
                    {formatSize(doc.size)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-runway-600">
                    {doc.updated_at ? new Date(doc.updated_at).toLocaleDateString() : "—"}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right text-sm">
                    <div className="flex justify-end gap-2">
                      <a
                        href={`${storageBaseUrl}/${doc.path}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-md px-2.5 py-1 text-xs font-medium text-brand-600 transition-colors hover:bg-brand-50"
                      >
                        View
                      </a>
                      <button
                        onClick={() => handleDelete(doc)}
                        disabled={deletingPath === doc.path}
                        className="rounded-md px-2.5 py-1 text-xs font-medium text-red-600 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {deletingPath === doc.path ? "Deleting…" : "Delete"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <Pagination
            page={safePage}
            totalPages={totalPages}
            totalItems={filtered.length}
            pageSize={pageSize}
            onPageChange={setPage}
            onPageSizeChange={handlePageSizeChange}
          />
        </div>
      )}
    </div>
  );
}
