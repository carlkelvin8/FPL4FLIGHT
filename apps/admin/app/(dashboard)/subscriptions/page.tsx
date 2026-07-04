import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Subscriptions",
};

/**
 * Subscriptions management page.
 * Full implementation — status table, override controls — in Task 21.
 */
export default function SubscriptionsPage() {
  return (
    <section>
      <h1 className="text-2xl font-semibold text-runway-900">Subscriptions</h1>
      <p className="mt-2 text-sm text-runway-700">
        Subscription management is implemented in Task 21.
      </p>
    </section>
  );
}
