import type { Metadata } from "next";

import { AnimatedCounter } from "./AnimatedCounter";
import { AnimatedHeadline } from "./AnimatedHeadline";
import { LandingNav } from "./LandingNav";
import { Marquee } from "./Marquee";
import { PricingSection } from "./PricingSection";
import { Reveal } from "./Reveal";

export const metadata: Metadata = {
  title: "FPL4FLIGHT — Digital Flight Planning for Philippine Pilots",
  description:
    "FPL4FLIGHT is the all-in-one aviation app for Filipino pilots. Digital ICAO flight plans, CAAP forms, pilot logbook, E6B calculator, NOTAM viewer, weather, and real-time pilot chat.",
  openGraph: {
    title: "FPL4FLIGHT — Digital Flight Planning for Philippine Pilots",
    description:
      "All-in-one aviation app. ICAO flight plans, CAAP forms, logbook, E6B, weather, NOTAMs & pilot chat.",
    type: "website",
    url: "https://fpl4flight.io/home",
  },
};

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-brand-200 bg-brand-50 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.1em] text-brand-600">
      <span className="relative flex h-2 w-2">
        <span className="animate-pulse-ring absolute inline-flex h-2 w-2 rounded-full bg-brand-400" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-brand-500" />
      </span>
      {children}
    </span>
  );
}

function SectionHeader({
  label,
  title,
  subtitle,
}: {
  label: string;
  title: React.ReactNode;
  subtitle: string;
}) {
  return (
    <div className="mx-auto mb-14 max-w-2xl text-center">
      <Pill>{label}</Pill>
      <h2 className="mb-4 text-3xl font-extrabold leading-tight text-runway-900 md:text-4xl">{title}</h2>
      <p className="text-lg text-runway-500">{subtitle}</p>
    </div>
  );
}

const features = [
  {
    icon: "✈️",
    tile: "from-blue-500 to-indigo-600",
    title: "ICAO Flight Plans",
    body: "Create and submit CAAP-compliant ICAO flight plans (ATS 2019-1). Fill out forms digitally with auto-populated aircraft data and export to PDF.",
  },
  {
    icon: "📄",
    tile: "from-emerald-500 to-teal-600",
    title: "Digital CAAP Forms",
    body: "Access PNP arrival checklists, pre-flight checklists, passenger manifests, and flight logbooks. All forms match official government templates with pixel-perfect PDF export.",
  },
  {
    icon: "💬",
    tile: "from-violet-500 to-purple-600",
    title: "Pilot Community Chat",
    body: "Connect with fellow pilots in real-time. Share weather reports, coordinate flights, exchange NOTAMs, and collaborate across multiple channels with reactions, replies, and voice messages.",
  },
  {
    icon: "🗺️",
    tile: "from-amber-500 to-orange-600",
    title: "Live Map & Tracking",
    body: "Full-screen GPS map with real-time position, speed, altitude, and heading. Track flights with background GPS and view track polylines across 20+ Philippine airports.",
  },
  {
    icon: "📋",
    tile: "from-cyan-500 to-sky-600",
    title: "Pilot Logbook",
    body: "Comprehensive hour logging — PIC, SIC, Dual, Day, Night, IFR and more. Includes currency tracker per FAR 61.57 rules and PDF export.",
  },
  {
    icon: "⚡",
    tile: "from-rose-500 to-red-600",
    title: "Flight Scheduling",
    body: "Organize your flights with Today, Tomorrow, and Upcoming sections. Full flight details with route visualization, gate info, PIC assignments, and status tracking.",
  },
  {
    icon: "🔧",
    tile: "from-blue-500 to-indigo-600",
    title: "Aircraft Management",
    body: "Maintain your fleet with detailed aircraft profiles — registration, type, ICAO equipment codes, wake turbulence category, and emergency/survival equipment configuration.",
  },
  {
    icon: "📝",
    tile: "from-emerald-500 to-teal-600",
    title: "Custom Form Builder",
    body: "Create your own form templates with sections and field types — text, textarea, select, checkbox. Save templates to the cloud and share with your team.",
  },
  {
    icon: "📷",
    tile: "from-violet-500 to-purple-600",
    title: "QR Code Sharing",
    body: "Generate QR codes for form links, flight plans, or custom URLs. Share instantly with ground crew, dispatch, or fellow pilots.",
  },
  {
    icon: "🔒",
    tile: "from-amber-500 to-orange-600",
    title: "Offline Mode & Sync",
    body: "Work offline with automatic data synchronization when you reconnect. Your forms, flights, and logbook entries are always safe with cloud backup.",
  },
  {
    icon: "🎓",
    tile: "from-cyan-500 to-sky-600",
    title: "Digital Pilot ID",
    body: "Elegant glass-design digital pilot identification card. Store your license number, type, and medical certificate expiry — all accessible from your pocket.",
  },
  {
    icon: "👥",
    tile: "from-rose-500 to-red-600",
    title: "Team & Fleet Management",
    body: "Manage crew members with role-based access, share aircraft fleets, and maintain audit trails. Perfect for flight schools and charter operators.",
  },
];

const tools = [
  { icon: "☁️", tone: "bg-sky-100", name: "Weather & METAR", body: "Real-time METAR & TAF by ICAO code" },
  { icon: "⚠️", tone: "bg-amber-100", name: "NOTAM Viewer", body: "Live NOTAMs with search history" },
  { icon: "📈", tone: "bg-blue-100", name: "E6B Calculator", body: "TAS, wind correction, fuel planning" },
  { icon: "⚖️", tone: "bg-emerald-100", name: "Weight & Balance", body: "CG envelope & PDF export" },
  { icon: "🗺️", tone: "bg-violet-100", name: "Flight Planning", body: "VFR/IFR plans with fuel calcs" },
  { icon: "🧭", tone: "bg-cyan-100", name: "Navigation Log", body: "Waypoint-by-waypoint planning" },
  { icon: "📖", tone: "bg-orange-100", name: "AIP Reference", body: "Philippine AIP — GEN, ENR, AD" },
  { icon: "⏰", tone: "bg-rose-100", name: "Duty Tracker", body: "CAAP/ICAO FRMS compliance" },
];

const promos = [
  {
    tone: "from-brand-500 via-brand-600 to-brand-800",
    badge: "Limited Time",
    title: "30% Off Annual Pro",
    body: "Go annual and save big. Get Pro at just ₱350/month when you commit to yearly billing. Unlock unlimited aircraft, flights, offline mode, and PDF export.",
    href: "#pricing",
    cta: "Claim Offer",
  },
  {
    tone: "from-emerald-500 via-green-600 to-emerald-900",
    badge: "Student Pilots",
    title: "Free Pro for Students",
    body: "Currently enrolled in flight school? Email us with your student ID and get Pro features free for 6 months. Build your logbook from day one.",
    href: "mailto:support@fpl4flight.io",
    cta: "Apply Now",
  },
  {
    tone: "from-amber-500 via-orange-600 to-amber-900",
    badge: "Refer & Earn",
    title: "Refer a Pilot, Get Rewards",
    body: "Share FPL4FLIGHT with your crew. For every pilot who signs up through your referral, you both earn 1 month of Pro free.",
    href: "#download",
    cta: "Start Referring",
  },
];

const testimonials = [
  {
    initials: "JM",
    quote:
      "FPL4FLIGHT replaced my paper logbook, E6B, and CAAP forms. Everything I need is in one app. The PDF export on real government templates is a game-changer.",
    name: "Capt. Jose Mendoza",
    role: "ATP Pilot, Cebu Pacific",
  },
  {
    initials: "AR",
    quote:
      "As a flight instructor, I recommend FPL4FLIGHT to all my students. The flight planning tools and NOTAM viewer save hours of pre-flight preparation.",
    name: "Capt. Ana Reyes",
    role: "CFI, Airborne Aviation Academy",
  },
  {
    initials: "RD",
    quote:
      "The duty tracker with CAAP fatigue limits is incredibly useful. No more mental math on rest requirements. Offline mode means I can log flights even without internet.",
    name: "Capt. Rico Delgado",
    role: "Charter Pilot, PAL Express",
  },
];

const marqueeItems = [
  { icon: "✈️", label: "ICAO Flight Plans" },
  { icon: "📄", label: "CAAP Forms" },
  { icon: "☁️", label: "Weather & METAR" },
  { icon: "⚠️", label: "NOTAM Viewer" },
  { icon: "📈", label: "E6B Calculator" },
  { icon: "🗺️", label: "Live Tracking" },
  { icon: "📋", label: "Pilot Logbook" },
  { icon: "💬", label: "Pilot Chat" },
  { icon: "⚖️", label: "Weight & Balance" },
  { icon: "🔒", label: "Offline Mode" },
];

const trustedBy = [
  "Cebu Pacific",
  "Philippine Airlines",
  "PAL Express",
  "Airborne Aviation Academy",
  "AeroMag Aviation",
];

function ShineBar() {
  return (
    <span className="pointer-events-none absolute inset-0 overflow-hidden">
      <span className="animate-shimmer absolute inset-y-0 left-0 w-1/3 -skew-x-12 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
    </span>
  );
}

function HeroVisual() {
  return (
    <div className="relative mx-auto w-full max-w-sm">
      <div className="pointer-events-none absolute -inset-10 rounded-full bg-gradient-to-tr from-brand-400/30 via-indigo-400/20 to-purple-400/30 blur-3xl" />

      <div className="animate-spin-slow pointer-events-none absolute -inset-8 rounded-full border-2 border-dashed border-brand-300/40" />

      <div className="animate-float absolute -left-12 top-14 z-20 hidden rounded-2xl border border-runway-100 bg-white/95 px-4 py-3 shadow-xl shadow-runway-900/10 backdrop-blur sm:block">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-100 text-lg">☁️</span>
          <div>
            <p className="text-xs font-semibold text-runway-900">METAR RPVM</p>
            <p className="text-xs text-runway-500">26°C · CAVOK · 10km</p>
          </div>
        </div>
      </div>

      <div className="animate-float-delayed absolute -right-10 top-32 z-20 hidden rounded-2xl border border-runway-100 bg-white/95 px-4 py-3 shadow-xl shadow-runway-900/10 backdrop-blur sm:block">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-green-100 text-green-600">✓</span>
          <div>
            <p className="text-xs font-semibold text-runway-900">Flight Plan Submitted</p>
            <p className="text-xs text-runway-500">MNL → CEB · 09:30</p>
          </div>
        </div>
      </div>

      <div className="animate-float-x absolute -bottom-6 left-6 z-20 hidden rounded-2xl border border-runway-100 bg-white/95 px-4 py-3 shadow-xl shadow-runway-900/10 backdrop-blur sm:block">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-100 text-brand-600">📋</span>
          <div>
            <p className="text-xs font-semibold text-runway-900">CAAP Form · ATS 2019-1</p>
            <p className="text-xs text-runway-500">Ready for submission</p>
          </div>
        </div>
      </div>

      {[
        { top: "12%", left: "2%", delay: "0s" },
        { top: "55%", right: "0%", delay: "-1s" },
        { top: "78%", left: "-4%", delay: "-2s" },
      ].map((s, i) => (
        <span
          key={i}
          className="animate-float-fast pointer-events-none absolute z-10 text-xl text-brand-400"
          style={{ top: s.top, left: s.left, right: s.right, animationDelay: s.delay }}
        >
          ✦
        </span>
      ))}

      <div className="relative z-10 rounded-[3rem] border-[10px] border-runway-900 bg-runway-900 p-2 shadow-2xl shadow-runway-900/40">
        <div className="overflow-hidden rounded-[2.4rem] bg-white">
          <div className="flex items-center justify-between bg-runway-50 px-6 py-3">
            <span className="text-xs font-bold text-runway-900">FPL4FLIGHT</span>
            <span className="flex gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
              <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
              <span className="h-2.5 w-2.5 rounded-full bg-green-400" />
            </span>
          </div>

          <div className="space-y-4 p-6">
            <div>
              <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-runway-400">
                New Flight Plan
              </p>
              <div className="animate-gradient-x flex items-center justify-between rounded-2xl bg-gradient-to-r from-brand-600 via-indigo-600 to-brand-800 px-5 py-4 text-white [background-size:200%_200%]">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-widest opacity-80">Route</p>
                  <p className="text-xl font-black tracking-tight">MNL → CEB</p>
                </div>
                <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-bold">VFR</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Aircraft", value: "RP-C1234" },
                { label: "Type", value: "Cessna 172" },
                { label: "Departure", value: "09:30 UTC" },
                { label: "Altitude", value: "6,500 ft" },
              ].map((row) => (
                <div key={row.label} className="rounded-xl bg-runway-50 px-4 py-2.5">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-runway-400">
                    {row.label}
                  </p>
                  <p className="text-sm font-bold text-runway-900">{row.value}</p>
                </div>
              ))}
            </div>

            <button
              type="button"
              className="shimmer-sweep w-full rounded-xl bg-brand-600 py-3 text-sm font-bold text-white shadow-lg shadow-brand-600/30"
            >
              Submit Flight Plan
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-brand-50 via-white to-white px-6 pt-36 pb-24">
      <div
        className="pointer-events-none absolute inset-0 [mask-image:radial-gradient(ellipse_70%_50%_at_50%_0%,#000_0%,transparent_100%)]"
        aria-hidden="true"
        style={{
          backgroundImage: "radial-gradient(circle, rgba(59,130,246,0.28) 1.5px, transparent 1.5px)",
          backgroundSize: "40px 40px",
        }}
      />
      <div className="animate-blob pointer-events-none absolute -right-40 -top-40 h-[600px] w-[600px] bg-brand-500/15 blur-3xl" />
      <div
        className="animate-blob pointer-events-none absolute -left-44 top-32 h-[520px] w-[520px] bg-purple-400/15 blur-3xl"
        style={{ animationDelay: "-4s" }}
      />
      <div
        className="animate-blob pointer-events-none absolute bottom-0 left-1/2 h-[420px] w-[420px] -translate-x-1/2 bg-cyan-400/10 blur-3xl"
        style={{ animationDelay: "-8s" }}
      />

      <div className="relative mx-auto grid max-w-6xl grid-cols-1 items-center gap-16 lg:grid-cols-2">
        <Reveal>
          <div>
            <a
              href="#download"
              className="group mb-6 inline-flex items-center gap-2 rounded-full border border-brand-200 bg-white px-4 py-1.5 text-sm font-semibold text-brand-700 shadow-sm transition hover:border-brand-300"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-pulse-ring absolute inline-flex h-2 w-2 rounded-full bg-brand-400" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-brand-500" />
              </span>
              New — Free Pro for student pilots
              <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
            </a>

            <h1 className="mb-6 text-5xl font-black leading-[1.05] tracking-tight text-runway-900 md:text-6xl">
              <AnimatedHeadline text="Your Complete" className="block" />
              <AnimatedHeadline
                text="Digital Flight Deck"
                delayBase={90}
                className="text-gradient-animate block"
              />
            </h1>

            <p className="mb-10 max-w-xl text-lg leading-relaxed text-runway-500">
              ICAO flight plans, CAAP forms, pilot logbook, E6B calculator, NOTAMs, live weather, and
              real-time pilot chat — all in one powerful app built for Philippine skies.
            </p>

            <div className="mb-12 flex flex-wrap gap-4">
              <a
                href="#download"
                className="shimmer-sweep inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand-500 via-brand-600 to-indigo-600 px-7 py-3.5 text-base font-semibold text-white shadow-lg shadow-brand-600/30 transition hover:-translate-y-0.5 hover:shadow-xl hover:shadow-brand-600/40"
              >
                <svg viewBox="0 0 24 24" className="h-5 w-5 fill-white">
                  <path d="M3 20.5V3.5C3 2.91 3.34 2.39 3.84 2.15L13.69 12L3.84 21.85C3.34 21.61 3 21.09 3 20.5ZM16.81 15.12L6.05 21.34L14.54 12.85L16.81 15.12ZM20.16 10.81C20.5 11.08 20.75 11.5 20.75 12C20.75 12.5 20.53 12.9 20.18 13.18L17.89 14.5L15.39 12L17.89 9.5L20.16 10.81ZM6.05 2.66L16.81 8.88L14.54 11.15L6.05 2.66Z" />
                </svg>
                Download Free on Android
              </a>
              <a
                href="#features"
                className="group inline-flex items-center gap-2 rounded-xl border-[1.5px] border-runway-200 bg-white px-7 py-3.5 text-base font-semibold text-runway-700 transition hover:border-brand-300 hover:bg-brand-50 hover:text-brand-600"
              >
                Explore Features
                <svg
                  viewBox="0 0 24 24"
                  className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                >
                  <path d="M5 12h14m0 0l-6-6m6 6l-6 6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </a>
            </div>

            <div className="grid max-w-lg grid-cols-2 gap-x-8 gap-y-6 sm:grid-cols-4">
              {[
                { value: 35, suffix: "+", label: "Aviation Tools" },
                { value: 60, suffix: "+", label: "Features" },
                { value: 20, suffix: "+", label: "PH Airports" },
                { value: 100, suffix: "%", label: "CAAP Compliant" },
              ].map((s) => (
                <div key={s.label}>
                  <strong className="block text-3xl font-black text-brand-600">
                    <AnimatedCounter value={s.value} suffix={s.suffix} />
                  </strong>
                  <span className="text-sm font-medium text-runway-500">{s.label}</span>
                </div>
              ))}
            </div>
          </div>
        </Reveal>

        <Reveal delay={150}>
          <HeroVisual />
        </Reveal>
      </div>
    </section>
  );
}

function MarqueeStrip() {
  return (
    <section className="border-y border-runway-100 bg-runway-900 py-10 text-white">
      <div className="mx-auto max-w-6xl px-6">
        <p className="mb-6 text-center text-xs font-bold uppercase tracking-[0.2em] text-runway-400">
          Trusted by pilots from
        </p>
        <Marquee speed={26}>
          {trustedBy.map((name) => (
            <span key={name} className="mx-6 flex items-center gap-3 text-lg font-bold tracking-tight text-runway-300">
              <span className="h-1.5 w-1.5 rounded-full bg-brand-500" />
              {name}
            </span>
          ))}
        </Marquee>
        <div className="mt-8 border-t border-runway-800 pt-8">
          <Marquee reverse speed={32}>
            {marqueeItems.map((item) => (
              <span
                key={item.label}
                className="mx-6 flex items-center gap-3 rounded-full border border-runway-800 bg-runway-800/60 px-5 py-2.5 text-sm font-semibold text-runway-200"
              >
                <span className="text-lg">{item.icon}</span>
                {item.label}
              </span>
            ))}
          </Marquee>
        </div>
      </div>
    </section>
  );
}

function FeaturesSection() {
  return (
    <section id="features" className="relative overflow-hidden bg-runway-50 py-24 px-6">
      <div className="animate-blob pointer-events-none absolute left-1/2 top-0 h-64 w-[700px] -translate-x-1/2 bg-brand-100/60 blur-3xl" />
      <div className="relative mx-auto max-w-6xl">
        <Reveal>
          <SectionHeader
            label="Features"
            title={
              <>
                Everything a Pilot Needs,{" "}
                <span className="text-gradient-animate">in One App</span>
              </>
            }
            subtitle="From pre-flight planning to post-flight logging — FPL4FLIGHT covers every phase of your flight operations."
          />
        </Reveal>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f, i) => (
            <Reveal key={f.title} delay={(i % 3) * 80}>
              <div className="shimmer-sweep group relative h-full overflow-hidden rounded-3xl border border-runway-200 bg-white p-8 transition-all duration-300 hover:-translate-y-1.5 hover:border-brand-300 hover:shadow-2xl hover:shadow-brand-600/10">
                <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-brand-500 to-indigo-500 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                <div
                  className={`mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${f.tile} text-2xl shadow-lg shadow-brand-900/10 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6`}
                >
                  {f.icon}
                </div>
                <h3 className="mb-2 text-lg font-bold text-runway-900">{f.title}</h3>
                <p className="text-sm leading-relaxed text-runway-500">{f.body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function ToolsSection() {
  return (
    <section id="tools" className="bg-white py-24 px-6">
      <div className="mx-auto max-w-6xl">
        <Reveal>
          <SectionHeader
            label="Aviation Tools"
            title={
              <>
                Professional Tools,{" "}
                <span className="text-gradient-animate">Right in Your Pocket</span>
              </>
            }
            subtitle="Replace your E6B, flight computer, and paper references with a single app."
          />
        </Reveal>

        <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
          {tools.map((t, i) => (
            <Reveal key={t.name} delay={(i % 4) * 60}>
              <div className="shimmer-sweep group rounded-2xl border border-runway-200 bg-white p-7 text-center transition-all duration-300 hover:-translate-y-1 hover:border-brand-300 hover:shadow-xl hover:shadow-brand-600/10">
                <div
                  className={`mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl ${t.tone} text-3xl transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6`}
                >
                  {t.icon}
                </div>
                <h4 className="mb-1 text-sm font-bold text-runway-900">{t.name}</h4>
                <p className="text-xs leading-relaxed text-runway-500">{t.body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function ShowcaseSection() {
  return (
    <section className="relative overflow-hidden bg-runway-50 py-24 px-6">
      <div className="animate-blob pointer-events-none absolute -right-32 top-24 h-72 w-72 bg-brand-200/40 blur-3xl" />
      <div
        className="animate-blob pointer-events-none absolute -left-32 bottom-24 h-72 w-72 bg-purple-200/40 blur-3xl"
        style={{ animationDelay: "-6s" }}
      />
      <div className="relative mx-auto grid max-w-6xl grid-cols-1 items-center gap-16 lg:grid-cols-2">
        <Reveal>
          <div>
            <Pill>Why FPL4FLIGHT</Pill>
            <h2 className="mb-6 text-3xl font-extrabold leading-tight text-runway-900 md:text-4xl">
              Designed by Pilots,{" "}
              <span className="text-gradient-animate">for Pilots</span>
            </h2>
            <p className="mb-8 max-w-xl text-lg leading-relaxed text-runway-500">
              We built FPL4FLIGHT because Filipino pilots deserve a modern, purpose-built tool that
              understands CAAP requirements and the realities of flying in the Philippines.
            </p>
            <ul className="flex flex-col gap-4">
              {[
                "CAAP-compliant ICAO flight plan forms (ATS 2019-1)",
                "Pixel-perfect PDF export on real government templates",
                "20+ Philippine airports with ICAO codes & coordinates",
                "Real-time METAR, TAF, and NOTAM data",
                "Works offline — sync when you land",
                "Free starter plan with no credit card required",
              ].map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm text-runway-700">
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-indigo-600 text-xs font-bold text-white shadow-sm">
                    ✓
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </Reveal>

        <Reveal delay={150}>
          <HeroVisual />
        </Reveal>
      </div>
    </section>
  );
}

function PromosSection() {
  return (
    <section id="promos" className="bg-white py-24 px-6">
      <div className="mx-auto max-w-6xl">
        <Reveal>
          <SectionHeader
            label="Promotions"
            title={
              <>
                Special Offers &{" "}
                <span className="text-gradient-animate">Campaigns</span>
              </>
            }
            subtitle="Take advantage of exclusive deals and limited-time promotions for Filipino aviation professionals."
          />
        </Reveal>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {promos.map((p, i) => (
            <Reveal key={p.title} delay={i * 80}>
              <div
                className={`shimmer-sweep group relative overflow-hidden rounded-3xl bg-gradient-to-br ${p.tone} p-8 text-white transition-all duration-300 hover:-translate-y-1.5 hover:shadow-2xl hover:shadow-brand-600/30 md:p-10`}
              >
                <div className="animate-blob pointer-events-none absolute -right-12 -top-12 h-48 w-48 bg-white/10 blur-xl transition-transform duration-500 group-hover:scale-125" />
                <div className="pointer-events-none absolute -bottom-16 -left-16 h-40 w-40 rounded-full bg-white/5" />
                <ShineBar />
                <span className="relative mb-4 inline-block rounded-full bg-white/20 px-3 py-1 text-xs font-bold uppercase tracking-wider backdrop-blur">
                  {p.badge}
                </span>
                <h3 className="relative mb-2 text-2xl font-extrabold">{p.title}</h3>
                <p className="relative mb-6 text-sm leading-relaxed opacity-90">{p.body}</p>
                <a
                  href={p.href}
                  className="relative inline-flex items-center gap-2 rounded-xl border border-white/25 bg-white/15 px-5 py-2.5 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/30"
                >
                  {p.cta}
                  <svg viewBox="0 0 24 24" className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M5 12h14m0 0l-6-6m6 6l-6 6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </a>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function TestimonialsSection() {
  return (
    <section className="bg-white py-24 px-6">
      <div className="mx-auto max-w-6xl">
        <Reveal>
          <SectionHeader
            label="Trusted by Pilots"
            title={
              <>
                What Pilots Are{" "}
                <span className="text-gradient-animate">Saying</span>
              </>
            }
            subtitle="Hear from aviation professionals who use FPL4FLIGHT every day."
          />
        </Reveal>

        <Reveal>
          <div className="mx-auto mb-10 flex w-fit items-center gap-3 rounded-full border border-runway-200 bg-runway-50 px-5 py-2.5">
            <span className="tracking-widest text-amber-500">★★★★★</span>
            <span className="text-sm font-bold text-runway-900">4.9/5</span>
            <span className="text-sm text-runway-500">from 500+ Filipino pilots</span>
          </div>
        </Reveal>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {testimonials.map((t, i) => (
            <Reveal key={t.name} delay={i * 80}>
              <div className="shimmer-sweep relative flex h-full flex-col rounded-3xl border border-runway-200 bg-gradient-to-b from-runway-50 to-white p-8 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-runway-200/40">
                <span className="absolute right-7 top-6 text-6xl font-black leading-none text-brand-100">
                  &ldquo;
                </span>
                <div className="mb-4 tracking-[0.2em] text-amber-500">★★★★★</div>
                <blockquote className="relative mb-6 flex-1 text-sm italic leading-relaxed text-runway-700">
                  {t.quote}
                </blockquote>
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-indigo-600 text-sm font-bold text-white shadow-md shadow-brand-600/20">
                    {t.initials}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-runway-900">{t.name}</div>
                    <div className="text-xs text-runway-500">{t.role}</div>
                  </div>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function CTASection() {
  return (
    <section id="download" className="relative overflow-hidden bg-gradient-to-br from-brand-600 via-brand-700 to-brand-900 px-6 py-24 text-center text-white">
      <div className="animate-blob pointer-events-none absolute -left-24 -top-24 h-80 w-80 bg-white/10 blur-3xl" />
      <div
        className="animate-blob pointer-events-none absolute -bottom-32 -right-24 h-96 w-96 bg-indigo-400/20 blur-3xl"
        style={{ animationDelay: "-5s" }}
      />
      <div
        className="animate-blob pointer-events-none absolute left-1/3 top-1/2 h-64 w-64 bg-cyan-300/10 blur-3xl"
        style={{ animationDelay: "-9s" }}
      />
      <div className="animate-spin-slow pointer-events-none absolute left-1/4 top-1/2 h-40 w-40 -translate-y-1/2 rounded-full border border-white/15" />
      <div
        className="animate-spin-slow pointer-events-none absolute left-1/4 top-1/2 h-40 w-40 -translate-y-1/2 rounded-full border border-dashed border-white/15"
        style={{ animationDuration: "12s" }}
      />

      <div className="relative mx-auto max-w-3xl">
        <Reveal>
          <h2 className="mb-5 text-4xl font-black leading-tight md:text-5xl">
            Ready to Upgrade Your{" "}
            <span className="bg-gradient-to-r from-white via-brand-200 to-white bg-clip-text text-transparent">
              Flight Deck?
            </span>
          </h2>
          <p className="mx-auto mb-10 max-w-xl text-lg opacity-90">
            Join thousands of Filipino pilots using FPL4FLIGHT. Download free today — no credit card
            required.
          </p>

          <div className="mb-10 flex flex-wrap justify-center gap-4">
            <a
              href="https://play.google.com/store/apps/details?id=io.pilotforms.app"
              target="_blank"
              rel="noopener noreferrer"
              className="shimmer-sweep inline-flex items-center gap-3 rounded-2xl border border-white/20 bg-white/10 px-6 py-3.5 backdrop-blur transition hover:-translate-y-0.5 hover:bg-white/20"
            >
              <svg viewBox="0 0 24 24" className="h-7 w-7 fill-white">
                <path d="M3 20.5V3.5C3 2.91 3.34 2.39 3.84 2.15L13.69 12L3.84 21.85C3.34 21.61 3 21.09 3 20.5ZM16.81 15.12L6.05 21.34L14.54 12.85L16.81 15.12ZM20.16 10.81C20.5 11.08 20.75 11.5 20.75 12C20.75 12.5 20.53 12.9 20.18 13.18L17.89 14.5L15.39 12L17.89 9.5L20.16 10.81ZM6.05 2.66L16.81 8.88L14.54 11.15L6.05 2.66Z" />
              </svg>
              <span className="text-left">
                <span className="block text-[10px] opacity-80">Get it on</span>
                <span className="block text-base font-bold">Google Play</span>
              </span>
            </a>
            <a
              href="mailto:support@fpl4flight.io?subject=iOS%20TestFlight%20Request"
              className="shimmer-sweep inline-flex items-center gap-3 rounded-2xl border border-white/20 bg-white/10 px-6 py-3.5 backdrop-blur transition hover:-translate-y-0.5 hover:bg-white/20"
            >
              <svg viewBox="0 0 24 24" className="h-7 w-7 fill-white">
                <path d="M18.71 19.5C17.88 20.74 17 21.95 15.66 21.97C14.32 22 13.89 21.18 12.37 21.18C10.84 21.18 10.37 21.95 9.1 22C7.79 22.05 6.8 20.68 5.96 19.47C4.25 16.56 2.93 11.3 4.7 7.72C5.57 5.94 7.36 4.86 9.28 4.84C10.56 4.81 11.78 5.72 12.57 5.72C13.36 5.72 14.85 4.62 16.4 4.8C17.07 4.83 18.89 5.08 20.04 6.82C19.91 6.88 17.72 8.08 17.75 10.72C17.78 13.82 20.49 14.89 20.52 14.9C20.49 14.97 20.1 16.33 18.71 19.5ZM13 3.5C13.73 2.67 14.94 2.04 15.94 2C16.07 3.17 15.6 4.35 14.9 5.19C14.21 6.04 13.07 6.7 11.95 6.61C11.8 5.46 12.36 4.26 13 3.5Z" />
              </svg>
              <span className="text-left">
                <span className="block text-[10px] opacity-80">Coming soon to</span>
                <span className="block text-base font-bold">App Store</span>
              </span>
            </a>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-2 text-sm">
            {["Free forever plan", "No credit card required", "Cancel anytime"].map((note) => (
              <span key={note} className="flex items-center gap-2 opacity-90">
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                {note}
              </span>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="bg-runway-950 px-6 pb-8 pt-16 text-runway-400">
      <div className="mx-auto mb-12 grid max-w-6xl grid-cols-2 gap-10 md:grid-cols-4">
        <div className="col-span-2 md:col-span-1">
          <div className="mb-3 flex items-center gap-2">
            <span className="animate-wiggle flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-indigo-600 text-lg font-black text-white">
              ✈
            </span>
            <h3 className="text-xl font-extrabold tracking-tight text-white">FPL4FLIGHT</h3>
          </div>
          <p className="mb-5 text-sm leading-relaxed">
            Digital flight planning, ICAO forms, pilot logbook &amp; aviation tools for Philippine
            pilots. Built with love by aviators, for aviators.
          </p>
          <div className="flex gap-3">
            {["M", "X", "F", "I"].map((s) => (
              <a
                key={s}
                href="#"
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-runway-800 text-sm font-bold text-runway-300 transition hover:border-brand-500 hover:bg-brand-600 hover:text-white"
              >
                {s}
              </a>
            ))}
          </div>
        </div>
        <div>
          <h4 className="mb-4 text-xs font-bold uppercase tracking-widest text-runway-200">Product</h4>
          {[
            { label: "Features", href: "#features" },
            { label: "Aviation Tools", href: "#tools" },
            { label: "Pricing", href: "#pricing" },
            { label: "Promos", href: "#promos" },
            { label: "Download", href: "#download" },
          ].map((l) => (
            <a key={l.label} href={l.href} className="block py-1.5 text-sm transition hover:text-white">
              {l.label}
            </a>
          ))}
        </div>
        <div>
          <h4 className="mb-4 text-xs font-bold uppercase tracking-widest text-runway-200">Company</h4>
          <a href="#" className="block py-1.5 text-sm transition hover:text-white">About Us</a>
          <a href="mailto:support@fpl4flight.io" className="block py-1.5 text-sm transition hover:text-white">Support</a>
          <a href="#" className="block py-1.5 text-sm transition hover:text-white">Changelog</a>
          <a href="#" className="block py-1.5 text-sm transition hover:text-white">Blog</a>
        </div>
        <div>
          <h4 className="mb-4 text-xs font-bold uppercase tracking-widest text-runway-200">Legal</h4>
          <a href="https://fpl4flight.io/privacy" className="block py-1.5 text-sm transition hover:text-white">Privacy Policy</a>
          <a href="#" className="block py-1.5 text-sm transition hover:text-white">Terms of Service</a>
          <a href="mailto:privacy@fpl4flight.io" className="block py-1.5 text-sm transition hover:text-white">Data Requests</a>
        </div>
      </div>
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 border-t border-runway-800 pt-6 text-sm">
        <span>&copy; 2026 FPL4FLIGHT. All rights reserved.</span>
        <span className="flex items-center gap-4">
          <a href="mailto:support@fpl4flight.io" className="transition hover:text-white">
            support@fpl4flight.io
          </a>
          <a href="/login" className="transition hover:text-white">Admin Sign In</a>
        </span>
      </div>
    </footer>
  );
}

export default function LandingPage() {
  return (
    <main className="overflow-x-clip bg-white font-sans text-runway-800 antialiased">
      <LandingNav />
      <Hero />
      <MarqueeStrip />
      <FeaturesSection />
      <ToolsSection />
      <ShowcaseSection />
      <PromosSection />
      <PricingSection />
      <TestimonialsSection />
      <CTASection />
      <Footer />
    </main>
  );
}
