"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

const navLinks = [
  { href: "#features", label: "Features" },
  { href: "#tools", label: "Tools" },
  { href: "#pricing", label: "Pricing" },
  { href: "#promos", label: "Promos" },
];

export function LandingNav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <nav
        className={`fixed inset-x-0 top-0 z-50 border-b bg-white/80 backdrop-blur-xl transition-all duration-300 ${
          scrolled ? "border-runway-200 shadow-lg shadow-runway-900/5" : "border-transparent"
        }`}
        aria-label="Site navigation"
      >
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Link href="/home" className="flex items-center gap-2.5">
            <span className="relative flex h-9 w-9 overflow-hidden rounded-xl shadow-md shadow-brand-600/20">
              <Image src="/logo.png" alt="FPL4FLIGHT" fill className="object-cover" />
            </span>
            <span className="text-lg font-extrabold tracking-tight text-runway-900">
              FPL4FLIGHT
            </span>
          </Link>

          <div className="hidden items-center gap-8 md:flex">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-runway-600 transition-colors hover:text-brand-600"
              >
                {link.label}
              </a>
            ))}
            <Link
              href="/login"
              className="text-sm font-semibold text-runway-700 transition-colors hover:text-brand-600"
            >
              Sign In
            </Link>
            <Link
              href="#download"
              className="animate-gradient-x inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand-500 via-indigo-600 to-brand-700 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-brand-600/25 transition hover:-translate-y-0.5 hover:shadow-brand-600/40 [background-size:200%_200%]"
            >
              Download Free
            </Link>
          </div>

          <button
            className="text-runway-700 md:hidden"
            onClick={() => setOpen((v) => !v)}
            aria-label="Toggle menu"
            aria-expanded={open}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 12h18M3 6h18M3 18h18" />
            </svg>
          </button>
        </div>
      </nav>

      {open && (
        <div className="fixed inset-x-0 bottom-0 top-16 z-40 flex flex-col gap-1 overflow-y-auto bg-white p-6 md:hidden">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className="rounded-xl px-3 py-3 text-lg font-medium text-runway-700 transition-colors hover:bg-runway-50 hover:text-brand-600"
            >
              {link.label}
            </a>
          ))}
          <Link
            href="/login"
            onClick={() => setOpen(false)}
            className="rounded-xl px-3 py-3 text-lg font-medium text-runway-700 transition-colors hover:bg-runway-50 hover:text-brand-600"
          >
            Sign In
          </Link>
          <Link
            href="#download"
            onClick={() => setOpen(false)}
            className="mt-4 inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-brand-600 to-brand-700 px-6 py-3.5 text-base font-semibold text-white shadow-lg shadow-brand-600/25"
          >
            Download Free
          </Link>
        </div>
      )}
    </>
  );
}
