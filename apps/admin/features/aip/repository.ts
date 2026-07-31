import { createSupabaseServerClient } from "@/lib/supabase/server";

export const AIP_FOLDERS = ["Part_1_-_GEN", "Part_2_-_ENR", "Part_3_-_AD"] as const;

export interface AipDocument {
  id: string;
  name: string;
  path: string;
  folder: string;
  folderLabel: string;
  title: string;
  size: number;
  updated_at: string | null;
}

const FOLDER_LABELS: Record<string, string> = {
  "Part_1_-_GEN": "GEN - General",
  "Part_2_-_ENR": "ENR - En Route",
  "Part_3_-_AD": "AD - Aerodromes",
};

function documentTitle(fileName: string): string {
  return fileName
    .replace(/_/g, " ")
    .replace(".pdf", "")
    .replace(/\s+-\s+/g, " – ");
}

export class AipRepository {
  private supabase = createSupabaseServerClient();

  async listDocuments(): Promise<AipDocument[]> {
    const documents: AipDocument[] = [];

    for (const folder of AIP_FOLDERS) {
      const { data, error } = await this.supabase.storage
        .from("aip-docs")
        .list(folder, { limit: 200, sortBy: { column: "name", order: "asc" } });

      if (error) throw new Error(error.message);

      for (const file of data ?? []) {
        if (!file.name.toLowerCase().endsWith(".pdf")) continue;

        documents.push({
          id: file.id ?? `${folder}/${file.name}`,
          name: file.name,
          path: `${folder}/${file.name}`,
          folder,
          folderLabel: FOLDER_LABELS[folder] ?? folder,
          title: documentTitle(file.name),
          size: (file.metadata?.size as number | undefined) ?? 0,
          updated_at: file.updated_at ?? null,
        });
      }
    }

    return documents.sort((a, b) => {
      const folderOrder = (f: string) => AIP_FOLDERS.indexOf(f as (typeof AIP_FOLDERS)[number]);
      if (folderOrder(a.folder) !== folderOrder(b.folder)) {
        return folderOrder(a.folder) - folderOrder(b.folder);
      }
      return a.title.localeCompare(b.title);
    });
  }

  async deleteDocument(path: string): Promise<void> {
    const { error } = await this.supabase.storage.from("aip-docs").remove([path]);
    if (error) throw new Error(error.message);
  }
}
