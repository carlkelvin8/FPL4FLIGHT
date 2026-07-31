"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { AipRepository } from "./repository";

const DeleteDocumentSchema = z.object({
  path: z
    .string()
    .min(1)
    .max(500)
    .regex(/^Part_[123]_-_(GEN|ENR|AD)\/.+\.pdf$/i, "Invalid document path"),
});

export type ActionState = {
  error: string | null;
  success: boolean;
};

export async function deleteAipDocument(path: string): Promise<ActionState> {
  const parsed = DeleteDocumentSchema.safeParse({ path });
  if (!parsed.success) {
    return { error: "Invalid document path.", success: false };
  }

  try {
    await new AipRepository().deleteDocument(parsed.data.path);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to delete document.", success: false };
  }

  revalidatePath("/aip");
  return { error: null, success: true };
}
