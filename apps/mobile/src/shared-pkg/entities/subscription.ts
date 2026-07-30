/**
 * Subscription domain entity — framework agnostic.
 */

export interface Subscription {
  id: string;
  userId: string;
  status: "trialing" | "active" | "past_due" | "canceled" | "expired";
  plan: "monthly" | "annual";
  trialEndsAt: Date | null;
  currentPeriodEnd: Date;
}
