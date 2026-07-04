import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { supabaseConfigured } from "@/lib/supabase/server";
import { FormTemplateRepository } from "@/features/form-builder/repository";
import { TemplateEditor } from "@/features/form-builder/components/template-editor";

interface Props {
  params: { id: string };
}

export const metadata: Metadata = {
  title: "Form Template Editor",
};

export default async function FormEditorPage({ params }: Props) {
  if (!supabaseConfigured()) {
    return (
      <section>
        <h1 className="text-2xl font-semibold text-runway-900">Form Template Editor</h1>
        <p className="mt-4 text-sm text-runway-500">
          Configure Supabase environment variables to edit form templates.
        </p>
      </section>
    );
  }

  const repo = new FormTemplateRepository();
  const template = await repo.getById(params.id);

  if (!template) notFound();

  return (
    <section>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-runway-900">{template.name}</h1>
        <p className="text-sm text-runway-500">
          {template.slug} &middot; v{template.version}
        </p>
      </div>
      <TemplateEditor template={template} />
    </section>
  );
}
