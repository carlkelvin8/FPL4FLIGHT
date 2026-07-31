import type { Metadata } from "next";

import { supabaseConfigured } from "@/lib/supabase/server";
import { AipRepository } from "@/features/aip";
import type { AipDocument } from "@/features/aip";
import { AipDocumentList } from "@/features/aip/components/aip-document-list";

export const metadata: Metadata = {
  title: "AIP Documents",
};

function totalSize(documents: AipDocument[]): string {
  const bytes = documents.reduce((sum, doc) => sum + doc.size, 0);
  if (bytes === 0) return "0 MB";
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default async function AipPage() {
  if (!supabaseConfigured()) {
    return (
      <section>
        <h1 className="text-2xl font-semibold text-runway-900">AIP Documents</h1>
        <p className="mt-4 text-sm text-runway-500">
          Configure Supabase environment variables to manage AIP documents.
        </p>
      </section>
    );
  }

  let documents: Awaited<ReturnType<AipRepository["listDocuments"]>>;
  try {
    documents = await new AipRepository().listDocuments();
  } catch {
    return (
      <section>
        <h1 className="text-2xl font-semibold text-runway-900">AIP Documents</h1>
        <p className="mt-4 text-sm text-red-700" role="alert">
          Failed to load AIP documents. Check that your Supabase connection is healthy.
        </p>
      </section>
    );
  }

  const storageBaseUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/aip-docs`;

  return (
    <section>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-runway-900">AIP Documents</h1>
          <p className="mt-1 text-sm text-runway-500">
            Aeronautical Information Publication — Philippine AIP PDFs.
          </p>
        </div>
        <div className="flex gap-3">
          <div className="rounded-xl border border-runway-200 bg-white px-4 py-3 shadow-sm">
            <p className="text-xs font-medium text-runway-500">Documents</p>
            <p className="mt-1 text-xl font-bold text-runway-900">{documents.length}</p>
          </div>
          <div className="rounded-xl border border-runway-200 bg-white px-4 py-3 shadow-sm">
            <p className="text-xs font-medium text-runway-500">Total Size</p>
            <p className="mt-1 text-xl font-bold text-runway-900">{totalSize(documents)}</p>
          </div>
        </div>
      </div>

      <AipDocumentList documents={documents} storageBaseUrl={storageBaseUrl} />
    </section>
  );
}
