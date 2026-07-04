"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { FormTemplate } from "@pilotforms/shared";
import { publishTemplate, deprecateTemplate, deleteTemplate } from "../actions";

interface Props {
  templates: FormTemplate[];
}

export function TemplateList({ templates }: Props) {
  const router = useRouter();
  const [actionError, setActionError] = useState<string | null>(null);

  async function handlePublish(id: string) {
    setActionError(null);
    const result = await publishTemplate(id);
    if (result.error) setActionError(result.error);
    else router.refresh();
  }

  async function handleDeprecate(id: string) {
    setActionError(null);
    const result = await deprecateTemplate(id);
    if (result.error) setActionError(result.error);
    else router.refresh();
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this template permanently?")) return;
    setActionError(null);
    const result = await deleteTemplate(id);
    if (result.error) setActionError(result.error);
    else router.refresh();
  }

  return (
    <div>
      {actionError && (
        <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700" role="alert">
          {actionError}
        </div>
      )}

      <div className="overflow-hidden rounded-lg border border-runway-200">
        <table className="min-w-full divide-y divide-runway-200">
          <thead className="bg-runway-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-runway-600">Name</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-runway-600">Slug</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-runway-600">Version</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-runway-600">Status</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-runway-600">Updated</th>
              <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-runway-600">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-runway-100 bg-white">
            {templates.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-sm text-runway-500">
                  No form templates yet.
                </td>
              </tr>
            )}
            {templates.map((t) => (
              <tr key={t.id} className="transition-colors hover:bg-runway-50">
                <td className="whitespace-nowrap px-4 py-3">
                  <Link
                    href={`/forms/${t.id}`}
                    className="text-sm font-medium text-brand-600 hover:text-brand-800"
                  >
                    {t.name}
                  </Link>
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-sm text-runway-600">
                  <code className="font-mono text-xs">{t.slug}</code>
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-sm text-runway-700">
                  v{t.version}
                </td>
                <td className="whitespace-nowrap px-4 py-3">
                  {t.deprecated ? (
                    <span className="inline-flex rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-700">
                      Deprecated
                    </span>
                  ) : t.isActive ? (
                    <span className="inline-flex rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700">
                      Published
                    </span>
                  ) : (
                    <span className="inline-flex rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-700">
                      Draft
                    </span>
                  )}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-sm text-runway-600">
                  {t.updatedAt.toLocaleDateString()}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-right text-sm">
                  <div className="flex justify-end gap-2">
                    <Link
                      href={`/forms/${t.id}`}
                      className="rounded-md px-2.5 py-1 text-xs font-medium text-brand-600 transition-colors hover:bg-brand-50"
                    >
                      Edit
                    </Link>
                    {!t.isActive && !t.deprecated && (
                      <button
                        onClick={() => handlePublish(t.id)}
                        className="rounded-md px-2.5 py-1 text-xs font-medium text-green-600 transition-colors hover:bg-green-50"
                      >
                        Publish
                      </button>
                    )}
                    {!t.deprecated && (
                      <button
                        onClick={() => handleDeprecate(t.id)}
                        className="rounded-md px-2.5 py-1 text-xs font-medium text-orange-600 transition-colors hover:bg-orange-50"
                      >
                        Deprecate
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(t.id)}
                      className="rounded-md px-2.5 py-1 text-xs font-medium text-red-600 transition-colors hover:bg-red-50"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
