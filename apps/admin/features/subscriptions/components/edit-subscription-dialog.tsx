"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { SubscriptionRow } from "../repository";
import { updateSubscription } from "../actions";

interface Props {
  subscription: SubscriptionRow;
  onClose: () => void;
  onSave: (updated: SubscriptionRow) => void;
}

export function EditSubscriptionDialog({ subscription, onClose, onSave }: Props) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState(subscription.status);
  const [plan, setPlan] = useState(subscription.plan);
  const [periodEnd, setPeriodEnd] = useState(subscription.current_period_end.slice(0, 16));

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    formData.set("id", subscription.id);
    const result = await updateSubscription({ error: null, success: false }, formData);

    if (result.error) {
      setError(result.error);
      setSaving(false);
    } else {
      onSave({
        ...subscription,
        status: status as SubscriptionRow["status"],
        plan: plan as SubscriptionRow["plan"],
        current_period_end: new Date(periodEnd).toISOString(),
      });
      router.refresh();
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl">
        <h2 className="mb-4 text-lg font-semibold text-runway-900">Edit Subscription</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-runway-700">User</label>
            <p className="mt-1 text-sm text-runway-900">{subscription.user_name || subscription.user_id}</p>
          </div>

          <div>
            <label htmlFor="status" className="block text-sm font-medium text-runway-700">Status</label>
            <select
              id="status"
              name="status"
              value={status}
              onChange={(e) => setStatus(e.target.value as SubscriptionRow["status"])}
              className="mt-1 block w-full rounded-lg border border-runway-300 px-3 py-2 text-sm shadow-sm focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-400"
            >
              <option value="trialing">Trialing</option>
              <option value="active">Active</option>
              <option value="past_due">Past Due</option>
              <option value="canceled">Canceled</option>
              <option value="expired">Expired</option>
            </select>
          </div>

          <div>
            <label htmlFor="plan" className="block text-sm font-medium text-runway-700">Billing Plan</label>
            <select
              id="plan"
              name="plan"
              value={plan}
              onChange={(e) => setPlan(e.target.value as SubscriptionRow["plan"])}
              className="mt-1 block w-full rounded-lg border border-runway-300 px-3 py-2 text-sm shadow-sm focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-400"
            >
              <option value="monthly">Monthly</option>
              <option value="annual">Annual</option>
            </select>
          </div>

          <div>
            <label htmlFor="current_period_end" className="block text-sm font-medium text-runway-700">Current Period End</label>
            <input
              id="current_period_end"
              name="current_period_end"
              type="datetime-local"
              value={periodEnd}
              onChange={(e) => setPeriodEnd(e.target.value)}
              className="mt-1 block w-full rounded-lg border border-runway-300 px-3 py-2 text-sm shadow-sm focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-400"
            />
          </div>

          {error && (
            <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700" role="alert">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-4 py-2 text-sm font-medium text-runway-700 transition-colors hover:bg-runway-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
