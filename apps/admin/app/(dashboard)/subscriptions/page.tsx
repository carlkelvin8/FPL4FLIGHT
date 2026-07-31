import type { SubscriptionRow } from "@/features/subscriptions";
import { SubscriptionRepository } from "@/features/subscriptions";
import { SubscriptionList } from "@/features/subscriptions/components/subscription-list";

export default async function SubscriptionsPage() {
  const subs: SubscriptionRow[] = await new SubscriptionRepository().list().catch(() => []);

  const activeCount = subs.filter((s) => s.status === "active").length;
  const monthlyCount = subs.filter((s) => s.plan === "monthly").length;
  const annualCount = subs.filter((s) => s.plan === "annual").length;

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-runway-900">Subscriptions</h1>
        <p className="mt-1 text-sm text-runway-500">Manage subscription plans and billing.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-runway-200 bg-white p-5">
          <p className="text-sm font-medium text-runway-500">Total Subscriptions</p>
          <p className="mt-1 text-2xl font-semibold text-runway-900">{subs.length}</p>
        </div>
        <div className="rounded-xl border border-runway-200 bg-white p-5">
          <p className="text-sm font-medium text-runway-500">Active</p>
          <p className="mt-1 text-2xl font-semibold text-runway-900">{activeCount}</p>
        </div>
        <div className="rounded-xl border border-runway-200 bg-white p-5">
          <p className="text-sm font-medium text-runway-500">Monthly Plans</p>
          <p className="mt-1 text-2xl font-semibold text-runway-900">{monthlyCount}</p>
        </div>
        <div className="rounded-xl border border-runway-200 bg-white p-5">
          <p className="text-sm font-medium text-runway-500">Annual Plans</p>
          <p className="mt-1 text-2xl font-semibold text-runway-900">{annualCount}</p>
        </div>
      </div>

      <SubscriptionList subscriptions={subs} />
    </section>
  );
}
