import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Audit Log",
};

/**
 * Audit log viewer page.
 * Full implementation — paginated table, filters, CSV export — in Task 26.
 */
export default function AuditPage() {
  return (
    <section>
      <h1 className="text-2xl font-semibold text-runway-900">Audit Log</h1>
      <p className="mt-2 text-sm text-runway-700">
        Audit log viewer is implemented in Task 26.
      </p>
    </section>
  );
}
