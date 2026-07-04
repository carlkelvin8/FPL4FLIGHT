"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { z } from "zod";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

const SignInSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export type SignInState = {
  error: string | null;
  success: boolean;
};

export async function signIn(
  _prevState: SignInState,
  formData: FormData,
): Promise<SignInState> {
  const parsed = SignInSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    const first = parsed.error.errors[0];
    return { error: first?.message ?? "Invalid input", success: false };
  }

  const supabase = createSupabaseServerClient();

  const { data, error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error) {
    return { error: "Invalid email or password.", success: false };
  }

  const metadataRole = data.user.app_metadata?.role as string | undefined;
  if (metadataRole === "admin") {
    revalidatePath("/", "layout");
    return { error: null, success: true };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", data.user.id)
    .maybeSingle();

  if (profile?.role !== "admin") {
    await supabase.auth.signOut();
    return { error: "Access denied. Admin privileges required.", success: false };
  }

    revalidatePath("/", "layout");
  return { error: null, success: true };
}

export async function signOut(): Promise<void> {
  const supabase = createSupabaseServerClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
}
