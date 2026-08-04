"use client";

import { useState } from "react";

interface PlanFeature {
  text: string;
  included: boolean;
}

interface Plan {
  name: string;
  desc: string;
  monthly: number;
  annual: number;
  period: string;
  features: PlanFeature[];
  cta: string;
  ctaClass: string;
  popular: boolean;
}

const plans: Plan[] = [
  {
    name: "Starter",
    desc: "Perfect for getting started",
    monthly: 0,
    annual: 0,
    period: "forever",
    features: [
      { text: "5 aircraft profiles", included: true },
      { text: "10 scheduled flights", included: true },
      { text: "Basic form templates", included: true },
      { text: "Map view", included: true },
      { text: "E6B calculator", included: true },
      { text: "Weather & METAR", included: true },
      { text: "PDF export", included: false },
      { text: "Offline mode", included: false },
    ],
    cta: "Get Started Free",
    ctaClass: "bg-runway-100 text-runway-700 hover:bg-runway-200",
    popular: false,
  },
  {
    name: "Pro",
    desc: "For serious pilots",
    monthly: 499,
    annual: 350,
    period: "/month",
    features: [
      { text: "Unlimited aircraft", included: true },
      { text: "Unlimited flights", included: true },
      { text: "All form templates", included: true },
      { text: "PDF export & email", included: true },
      { text: "Offline mode & sync", included: true },
      { text: "Flight planning & nav log", included: true },
      { text: "Duty tracker & logbook", included: true },
      { text: "Priority email support", included: true },
    ],
    cta: "Upgrade to Pro",
    ctaClass: "bg-brand-600 text-white hover:bg-brand-700",
    popular: true,
  },
  {
    name: "Team",
    desc: "For flight schools & operators",
    monthly: 1499,
    annual: 1049,
    period: "/month",
    features: [
      { text: "Everything in Pro", included: true },
      { text: "Up to 10 crew members", included: true },
      { text: "Role-based access control", included: true },
      { text: "Shared aircraft fleet", included: true },
      { text: "Audit trail & logs", included: true },
      { text: "Custom form builder", included: true },
      { text: "Team chat channels", included: true },
      { text: "Dedicated account manager", included: true },
    ],
    cta: "Contact Sales",
    ctaClass:
      "bg-white text-brand-600 border-[1.5px] border-brand-200 hover:bg-brand-50 hover:border-brand-300",
    popular: false,
  },
];

function formatPrice(n: number) {
  return n.toLocaleString("en-PH");
}

export function PricingSection() {
  const [annual, setAnnual] = useState(false);

  return (
    <section id="pricing" className="relative overflow-hidden bg-runway-50 py-24 px-6">
      <div className="pointer-events-none absolute -left-32 top-10 h-72 w-72 rounded-full bg-brand-200/40 blur-3xl" />
      <div className="pointer-events-none absolute -right-32 bottom-10 h-72 w-72 rounded-full bg-purple-200/40 blur-3xl" />

      <div className="relative mx-auto max-w-5xl">
        <div className="mx-auto mb-10 max-w-2xl text-center">
          <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-brand-200 bg-brand-50 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.1em] text-brand-600">
            <span className="h-1.5 w-1.5 rounded-full bg-brand-500" />
            Pricing
          </span>
          <h2 className="mb-4 text-3xl font-extrabold leading-tight text-runway-900 md:text-4xl">
            Simple, Transparent Pricing
          </h2>
          <p className="text-lg text-runway-500">Start free. Upgrade when you need more. No hidden fees.</p>
        </div>

        <div className="mb-12 flex items-center justify-center gap-4">
          <span className={`text-sm font-semibold ${!annual ? "text-runway-900" : "text-runway-400"}`}>
            Monthly
          </span>
          <button
            type="button"
            role="switch"
            aria-checked={annual}
            onClick={() => setAnnual((v) => !v)}
            className={`relative h-7 w-14 rounded-full transition-colors ${
              annual ? "bg-brand-600" : "bg-runway-300"
            }`}
            aria-label="Toggle annual billing"
          >
            <span
              className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-all ${
                annual ? "left-8" : "left-1"
              }`}
            />
          </button>
          <span className={`text-sm font-semibold ${annual ? "text-runway-900" : "text-runway-400"}`}>
            Annual
          </span>
          <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-bold text-green-700">
            Save 30%
          </span>
        </div>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-3 md:items-stretch">
          {plans.map((plan) => {
            const price = annual ? plan.annual : plan.monthly;
            return (
              <div
                key={plan.name}
                className={`relative flex flex-col rounded-3xl bg-white p-8 transition-all duration-300 hover:-translate-y-1.5 ${
                  plan.popular
                    ? "border-2 border-brand-500 shadow-2xl shadow-brand-600/20"
                    : "border border-runway-200 shadow-sm hover:shadow-xl hover:shadow-runway-200/50"
                }`}
              >
                {plan.popular && (
                  <span className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-brand-500 to-brand-700 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-white shadow-lg shadow-brand-600/30">
                    Most Popular
                  </span>
                )}

                <h3 className="mb-1 text-xl font-bold text-runway-900">{plan.name}</h3>
                <p className="mb-6 text-sm text-runway-500">{plan.desc}</p>

                <div className="mb-2 flex items-end gap-1">
                  <span className="text-lg font-bold text-runway-700">₱</span>
                  <span
                    className={`leading-none ${
                      plan.popular
                        ? "bg-gradient-to-r from-brand-600 to-brand-800 bg-clip-text text-transparent"
                        : "text-runway-900"
                    } text-6xl font-black`}
                  >
                    {formatPrice(price)}
                  </span>
                  <span className="mb-1 text-sm text-runway-400">{plan.period}</span>
                </div>
                {annual && price > 0 ? (
                  <p className="mb-6 text-sm font-semibold text-green-600">Billed annually — save 30%</p>
                ) : (
                  <p className="mb-6 text-sm">&nbsp;</p>
                )}

                <ul className="mb-8 flex flex-1 flex-col gap-3.5">
                  {plan.features.map((f) => (
                    <li key={f.text} className="flex items-center gap-3 text-sm text-runway-600">
                      <span
                        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
                          f.included
                            ? "bg-green-100 text-green-600"
                            : "bg-runway-100 text-runway-300"
                        }`}
                      >
                        {f.included ? "✓" : "✕"}
                      </span>
                      <span className={f.included ? "" : "text-runway-400"}>{f.text}</span>
                    </li>
                  ))}
                </ul>

                <a
                  href="#download"
                  className={`block rounded-xl px-4 py-3 text-center text-sm font-semibold transition ${plan.ctaClass}`}
                >
                  {plan.cta}
                </a>
              </div>
            );
          })}
        </div>

        <p className="mt-8 text-center text-sm text-runway-400">
          All prices in Philippine Peso (₱). VAT not included. Cancel anytime.
        </p>
      </div>
    </section>
  );
}
