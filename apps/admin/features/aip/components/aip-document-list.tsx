"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { AipDocument } from "../repository";
import { deleteAipDocument } from "../actions";

interface Props {
  documents: AipDocument[];
  storageBaseUrl: string;
}

function formatSize(bytes: number): string {
  if (bytes === 0) return "—";
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function groupByFolder(documents: AipDocument[]): Map<string, AipDocument[]> {
  const groups = new Map<string, AipDocument[]>();
  for (const doc of documents) {
    const group = groups.get(doc.folderLabel) ?? [];
    group.push(doc);
    groups.set(doc.folderLabel, group);
  }
  return groups;
}

export function AipDocumentList({ documents, storageBaseUrl }: Props) {
  const router = useRouter();
  const [deletingPath, setDeletingPath] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

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

  const groups = groupByFolder(documents);

  return (
    <div>
      {actionError && (
        <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700" role="alert">
          {actionError}
        </div>
      )}

      {documents.length === 0 && (
        <div className="rounded-lg border border-runway-200 bg-white p-8 text-center text-sm text-runway-500">
          No AIP documents found. Upload PDFs to the <code className="font-mono text-xs">aip-docs</code> storage bucket.
        </div>
      )}

      {Array.from(groups.entries()).map(([folder, docs]) => (
        <div key={folder} className="mb-8">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-runway-900">{folder}</h2>
            <span className="text-sm text-runway-500">{docs.length} documents</span>
          </div>

          <div className="overflow-hidden rounded-lg border border-runway-200">
            <table className="min-w-full divide-y divide-runway-200">
              <thead className="bg-runway-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-runway-600">Document</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-runway-600">Size</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-runway-600">Updated</th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-runway-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-runway-100 bg-white">
                {docs.map((doc) => (
                  <tr key={doc.id} className="transition-colors hover:bg-runway-50">
                    <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-runway-900">
                      {doc.title}
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
          </div>
        </div>
      ))}
    </div>
  );
}
