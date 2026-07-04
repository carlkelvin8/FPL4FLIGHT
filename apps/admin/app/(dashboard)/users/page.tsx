import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Users",
};

/**
 * User management page.
 * Full implementation — search, filters, role management — in Task 27.
 */
export default function UsersPage() {
  return (
    <section>
      <h1 className="text-2xl font-semibold text-runway-900">Users</h1>
      <p className="mt-2 text-sm text-runway-700">
        User management is implemented in Task 27.
      </p>
    </section>
  );
}
