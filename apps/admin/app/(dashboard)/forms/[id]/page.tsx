import { notFound } from "next/navigation";
import { FormTemplateRepository } from "@/features/form-builder";
import { TemplateEditor } from "@/features/form-builder/editor/TemplateEditor";

export default async function EditTemplatePage({ params }: { params: { id: string } }) {
  const repo = new FormTemplateRepository();
  const template = await repo.getById(params.id);

  if (!template) notFound();

  return (
    <TemplateEditor
      mode="edit"
      initial={{
        id: template.id,
        slug: template.slug,
        name: template.name,
        description: template.description,
        version: template.version,
        schema: template.schema,
        isActive: template.isActive,
        deprecated: template.deprecated,
        createdAt: template.createdAt.toISOString(),
        updatedAt: template.updatedAt.toISOString(),
      }}
    />
  );
}
