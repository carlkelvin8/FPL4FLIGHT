import type { Metadata } from "next";

import { LoginForm } from "./LoginForm";

export const metadata: Metadata = {
  title: "Sign In",
};

function BrandLogo() {
  return (
    <svg className="h-8 w-8" viewBox="0 0 40 40" fill="none" aria-hidden="true">
      <rect width="40" height="40" rx="10" className="fill-brand-600" />
      <path d="M12 28V12l16 8-16 8z" className="fill-white" />
    </svg>
  );
}

function DotPattern() {
  return (
    <svg className="absolute inset-0 -z-10 h-full w-full stroke-runway-200/50 [mask-image:radial-gradient(ellipse_60%_50%_at_50%_40%,#000_0%,transparent_100%)]" aria-hidden="true">
      <defs>
        <pattern id="dot-grid" width="32" height="32" patternUnits="userSpaceOnUse">
          <circle cx="2" cy="2" r="1.5" fill="currentColor" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#dot-grid)" />
    </svg>
  );
}

export default function LoginPage() {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-gradient-to-b from-sky-50 via-white to-white p-4">
      <DotPattern />

      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mb-4 inline-flex items-center justify-center gap-2.5">
            <BrandLogo />
            <span className="text-lg font-bold tracking-tight text-runway-900">
              FPL4FLIGHT
            </span>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-runway-900">
            Welcome back
          </h1>
          <p className="mt-1.5 text-sm text-runway-500">
            Sign in to your admin dashboard.
          </p>
        </div>

        <div className="rounded-xl border border-runway-200 bg-white p-6 shadow-lg shadow-runway-200/25 transition-shadow hover:shadow-xl hover:shadow-runway-200/30 sm:p-8">
          <LoginForm />
        </div>

        <div className="mt-6 text-center">
          <p className="text-xs text-runway-400">
            &copy; {new Date().getFullYear()} FPL4FLIGHT.
          </p>
        </div>
      </div>
    </div>
  );
}
