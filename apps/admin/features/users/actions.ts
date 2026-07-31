"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createSupabaseServiceClient } from "@/lib/supabase/server";
import { UserRepository, type UpdateUserInput } from "./repository";

let repo: UserRepository | null = null;
function getRepo(): UserRepository {
  if (!repo) repo = new UserRepository();
  return repo;
}

const CreateSchema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  full_name: z.string().min(1, "Name is required"),
  role: z.enum(["pilot", "admin"]),
});

const UpdateSchema = z.object({
  id: z.string().min(1),
  full_name: z.string().min(1).optional(),
  role: z.enum(["pilot", "admin"]).optional(),
});

export type ActionState = {
  error: string | null;
  success: boolean;
};

export async function createUser(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = CreateSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    full_name: formData.get("full_name"),
    role: formData.get("role"),
  });

  if (!parsed.success) {
    const first = parsed.error.errors[0];
    return { error: first?.message ?? "Invalid input", success: false };
  }

  try {
    const serviceClient = createSupabaseServiceClient();
    const { data: authUser, error: authError } = await serviceClient.auth.admin.createUser({
      email: parsed.data.email,
      password: parsed.data.password,
      email_confirm: true,
      user_metadata: { role: parsed.data.role, full_name: parsed.data.full_name },
    });

    if (authError) throw new Error(authError.message);
    if (!authUser.user) throw new Error("Failed to create user");

    const { error: profileError } = await serviceClient
      .from("profiles")
      .insert({
        id: authUser.user.id,
        full_name: parsed.data.full_name,
        role: parsed.data.role,
      });

    if (profileError) throw new Error(profileError.message);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to create user.", success: false };
  }

  revalidatePath("/users");
  return { error: null, success: true };
}

export async function updateUser(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = UpdateSchema.safeParse({
    id: formData.get("id"),
    full_name: formData.get("full_name") || undefined,
    role: formData.get("role") || undefined,
  });

  if (!parsed.success) {
    const first = parsed.error.errors[0];
    return { error: first?.message ?? "Invalid input", success: false };
  }

  try {
    const input: Record<string, unknown> = {};
    if (parsed.data.full_name) input.full_name = parsed.data.full_name;
    if (parsed.data.role) input.role = parsed.data.role;
    await getRepo().update(parsed.data.id, input as UpdateUserInput);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to update user.", success: false };
  }

  revalidatePath("/users");
  return { error: null, success: true };
}

export async function deleteUser(id: string): Promise<ActionState> {
  try {
    await getRepo().delete(id);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to delete user.", success: false };
  }

  revalidatePath("/users");
  return { error: null, success: true };
}
