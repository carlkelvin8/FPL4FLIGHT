"use server";

import { revalidatePath } from "next/cache";
import { ChatModerationRepository } from "./repository";

export type ActionState = {
  error: string | null;
  success: boolean;
};

function getRepo(): ChatModerationRepository {
  return new ChatModerationRepository();
}

export async function deleteMessage(id: string): Promise<ActionState> {
  try {
    await getRepo().deleteMessage(id);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to delete message.", success: false };
  }
  revalidatePath("/chat");
  return { error: null, success: true };
}

export async function deleteMessages(ids: string[]): Promise<ActionState> {
  try {
    await getRepo().deleteMessages(ids);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to delete messages.", success: false };
  }
  revalidatePath("/chat");
  return { error: null, success: true };
}

export async function togglePinMessage(id: string): Promise<ActionState & { pinned?: boolean }> {
  try {
    const pinned = await getRepo().togglePin(id);
    revalidatePath("/chat");
    return { error: null, success: true, pinned };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to toggle pin.", success: false };
  }
}

export async function banUser(userId: string, reason: string): Promise<ActionState> {
  try {
    // Get current admin user ID (simplified — in production use session)
    await getRepo().banUser(userId, reason, "admin");
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to ban user.", success: false };
  }
  revalidatePath("/chat");
  return { error: null, success: true };
}

export async function unbanUser(userId: string): Promise<ActionState> {
  try {
    await getRepo().unbanUser(userId);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to unban user.", success: false };
  }
  revalidatePath("/chat");
  return { error: null, success: true };
}
