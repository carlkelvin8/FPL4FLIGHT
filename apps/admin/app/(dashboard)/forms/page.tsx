import type { Metadata } from "next";
import { FormTemplateRepository } from "@/features/form-builder/repository";
import { TemplateList } from "@/features/form-builder/components/template-list";
import { CreateTemplateDialog } from "@/features/form-builder/components/create-dialog";
import { supabaseConfigured } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Form Templates",
};

export default async function FormsPage() {
  if (!supabaseConfigured()) {
    return (
      <section>
        <h1 className="text-2xl font-semibold text-runway-900">Form Templates</h1>
        <p className="mt-4 text-sm text-runway-500">
          Configure Supabase environment variables to manage form templates.
        </p>
      </section>
    );
  }

  const repo = new FormTemplateRepository();
  const templates = await repo.list();

  return (
    <section>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-runway-900">Form Templates</h1>
        <CreateTemplateDialog />
      </div>
      <TemplateList templates={templates} />
    </section>
  );
}
