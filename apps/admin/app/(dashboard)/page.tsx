import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard",
};

/**
 * Analytics overview page.
 * Charts, metrics, and server-side data fetching are implemented in Tasks 24–25.
 */
export default function DashboardPage() {
  return (
    <section>
      <h1 className="text-2xl font-semibold text-runway-900">Overview</h1>
      <p className="mt-2 text-sm text-runway-700">
        Analytics dashboard is implemented in Tasks 24 and 25.
      </p>
    </section>
  );
}
