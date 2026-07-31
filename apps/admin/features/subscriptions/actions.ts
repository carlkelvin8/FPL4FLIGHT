"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { SubscriptionRepository, type UpdateSubscriptionInput } from "./repository";

let repo: SubscriptionRepository | null = null;
function getRepo(): SubscriptionRepository {
  if (!repo) repo = new SubscriptionRepository();
  return repo;
}

const UpdateSchema = z.object({
  id: z.string().min(1),
  status: z.enum(["trialing", "active", "past_due", "canceled", "expired"]).optional(),
  plan: z.enum(["monthly", "annual"]).optional(),
  current_period_end: z.string().optional(),
});

export type ActionState = {
  error: string | null;
  success: boolean;
};

export async function updateSubscription(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = UpdateSchema.safeParse({
    id: formData.get("id"),
    status: formData.get("status") || undefined,
    plan: formData.get("plan") || undefined,
    current_period_end: formData.get("current_period_end") || undefined,
  });

  if (!parsed.success) {
    const first = parsed.error.errors[0];
    return { error: first?.message ?? "Invalid input", success: false };
  }

  try {
    const input: Record<string, unknown> = {};
    if (parsed.data.status) input.status = parsed.data.status;
    if (parsed.data.plan) input.plan = parsed.data.plan;
    if (parsed.data.current_period_end) input.current_period_end = parsed.data.current_period_end;
    await getRepo().update(parsed.data.id, input as UpdateSubscriptionInput);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to update subscription.", success: false };
  }

  revalidatePath("/subscriptions");
  return { error: null, success: true };
}

export async function deleteSubscription(id: string): Promise<ActionState> {
  try {
    await getRepo().delete(id);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to delete subscription.", success: false };
  }

  revalidatePath("/subscriptions");
  return { error: null, success: true };
}
