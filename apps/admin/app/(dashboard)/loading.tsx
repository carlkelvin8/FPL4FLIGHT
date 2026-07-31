export default function Loading() {
  return (
    <section aria-busy="true">
      <div className="h-7 w-48 animate-pulse rounded bg-runway-200" />
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-runway-200 bg-white p-5">
            <div className="h-4 w-24 animate-pulse rounded bg-runway-100" />
            <div className="mt-3 h-8 w-12 animate-pulse rounded bg-runway-100" />
          </div>
        ))}
      </div>
      <div className="mt-8 h-64 animate-pulse rounded-lg border border-runway-200 bg-runway-50" />
    </section>
  );
}
