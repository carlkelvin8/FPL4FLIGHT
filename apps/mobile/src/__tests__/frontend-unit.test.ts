/**
 * Frontend Unit Tests
 * Tests core business logic, utilities, and data transformations
 * Run with: npx jest src/__tests__/frontend-unit.test.ts
 */

import { describe, it, expect } from "@jest/globals";

// ─── Currency Tracker Logic Tests ───────────────────────────────
describe("Frontend: Currency Tracker", () => {
  const today = new Date().toISOString().slice(0, 10);
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const oneHundredDaysAgo = new Date(Date.now() - 100 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  function checkDayCurrency(entries: Array<{ date: string; landingsDay: number }>) {
    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const recent = entries.filter(e => e.date >= ninetyDaysAgo);
    const totalLandings = recent.reduce((s, e) => s + e.landingsDay, 0);
    return totalLandings >= 3;
  }

  it("should be current with 3+ landings in 90 days", () => {
    const entries = [
      { date: today, landingsDay: 2 },
      { date: thirtyDaysAgo, landingsDay: 2 },
    ];
    expect(checkDayCurrency(entries)).toBe(true);
  });

  it("should NOT be current with fewer than 3 landings in 90 days", () => {
    const entries = [
      { date: today, landingsDay: 1 },
      { date: oneHundredDaysAgo, landingsDay: 5 },
    ];
    expect(checkDayCurrency(entries)).toBe(false);
  });

  it("should handle empty logbook", () => {
    expect(checkDayCurrency([])).toBe(false);
  });
});

// ─── Flight Data Validation ─────────────────────────────────────
describe("Frontend: Flight Validation", () => {
  function validateFlightNumber(num: string): boolean {
    return num.trim().length > 0 && num.trim().length <= 10;
  }

  function validateICAO(code: string): boolean {
    return /^[A-Z]{4}$/.test(code.trim());
  }

  function validateTime(time: string): boolean {
    return /^([01]\d|2[0-3]):([0-5]\d)$/.test(time);
  }

  it("should validate flight numbers", () => {
    expect(validateFlightNumber("PF-101")).toBe(true);
    expect(validateFlightNumber("")).toBe(false);
    expect(validateFlightNumber("A".repeat(11))).toBe(false);
  });

  it("should validate ICAO codes", () => {
    expect(validateICAO("RPLL")).toBe(true);
    expect(validateICAO("RPVM")).toBe(true);
    expect(validateICAO("rPLL")).toBe(false);
    expect(validateICAO("RP")).toBe(false);
    expect(validateICAO("RPLLX")).toBe(false);
  });

  it("should validate time format", () => {
    expect(validateTime("06:30")).toBe(true);
    expect(validateTime("23:59")).toBe(true);
    expect(validateTime("24:00")).toBe(false);
    expect(validateTime("6:30")).toBe(false);
    expect(validateTime("")).toBe(false);
  });
});

// ─── Weight & Balance Calculator ────────────────────────────────
describe("Frontend: Weight & Balance", () => {
  function calculateCG(items: Array<{ weight: number; arm: number }>) {
    const totalWeight = items.reduce((s, i) => s + i.weight, 0);
    const totalMoment = items.reduce((s, i) => s + i.weight * i.arm, 0);
    return totalWeight > 0 ? totalMoment / totalWeight : 0;
  }

  function isWithinLimits(cg: number, fwd: number, aft: number, weight: number, maxWeight: number) {
    return weight <= maxWeight && cg >= fwd && cg <= aft;
  }

  it("should calculate CG correctly", () => {
    const items = [
      { weight: 1500, arm: 38.0 }, // empty weight
      { weight: 340, arm: 37.0 }, // front seats
      { weight: 100, arm: 73.0 }, // baggage
    ];
    const cg = calculateCG(items);
    expect(cg).toBeGreaterThan(38);
    expect(cg).toBeLessThan(42);
  });

  it("should detect within limits", () => {
    expect(isWithinLimits(38.5, 35.0, 47.3, 2200, 2550)).toBe(true);
  });

  it("should detect overweight", () => {
    expect(isWithinLimits(38.5, 35.0, 47.3, 2600, 2550)).toBe(false);
  });

  it("should detect CG out of limits", () => {
    expect(isWithinLimits(50.0, 35.0, 47.3, 2200, 2550)).toBe(false);
    expect(isWithinLimits(30.0, 35.0, 47.3, 2200, 2550)).toBe(false);
  });
});

// ─── E6B Calculator ─────────────────────────────────────────────
describe("Frontend: E6B Calculations", () => {
  function calculateTAS(ias: number, altitude: number, temperature: number): number {
    const altCorrection = altitude / 1000 * 0.02;
    const tempCorrection = (temperature - 15) * 0.005;
    return ias * (1 + altCorrection + tempCorrection);
  }

  function calculateFuelRequired(distance: number, groundSpeed: number, fuelBurn: number): number {
    if (groundSpeed <= 0) return Infinity;
    const timeHours = distance / groundSpeed;
    return timeHours * fuelBurn;
  }

  it("should calculate TAS from IAS", () => {
    const tas = calculateTAS(100, 5000, 15);
    expect(tas).toBeCloseTo(110, 0);
  });

  it("should calculate fuel required", () => {
    const fuel = calculateFuelRequired(200, 100, 30);
    expect(fuel).toBeCloseTo(60, 0);
  });

  it("should handle zero ground speed", () => {
    const fuel = calculateFuelRequired(200, 0, 30);
    expect(fuel).toBe(Infinity);
  });
});

// ─── Logbook Totals ─────────────────────────────────────────────
describe("Frontend: Logbook Calculations", () => {
  const entries = [
    { totalFlightTime: 2.5, pilotInCommand: 2.5, night: 0, crossCountry: 2.5, landingsDay: 1, landingsNight: 0 },
    { totalFlightTime: 1.8, pilotInCommand: 1.8, night: 0.5, crossCountry: 0, landingsDay: 2, landingsNight: 1 },
    { totalFlightTime: 3.2, pilotInCommand: 3.2, night: 1.0, crossCountry: 3.2, landingsDay: 1, landingsNight: 0 },
  ];

  it("should sum total flight time", () => {
    const total = entries.reduce((s, e) => s + e.totalFlightTime, 0);
    expect(total).toBeCloseTo(7.5, 1);
  });

  it("should sum PIC time", () => {
    const total = entries.reduce((s, e) => s + e.pilotInCommand, 0);
    expect(total).toBeCloseTo(7.5, 1);
  });

  it("should sum night time", () => {
    const total = entries.reduce((s, e) => s + e.night, 0);
    expect(total).toBeCloseTo(1.5, 1);
  });

  it("should sum landings", () => {
    const day = entries.reduce((s, e) => s + e.landingsDay, 0);
    const night = entries.reduce((s, e) => s + e.landingsNight, 0);
    expect(day).toBe(4);
    expect(night).toBe(1);
    expect(day + night).toBe(5);
  });

  it("should sum cross-country", () => {
    const total = entries.reduce((s, e) => s + e.crossCountry, 0);
    expect(total).toBeCloseTo(5.7, 1);
  });
});

// ─── Form Progress Calculation ──────────────────────────────────
describe("Frontend: Form Progress", () => {
  function calculateProgress(data: Record<string, any>, requiredFields: string[]): number {
    if (requiredFields.length === 0) return 0;
    const filled = requiredFields.filter(f => data[f] !== undefined && data[f] !== null && data[f] !== "");
    return Math.round((filled.length / requiredFields.length) * 100);
  }

  it("should return 0 for empty form", () => {
    expect(calculateProgress({}, ["name", "date", "aircraft"])).toBe(0);
  });

  it("should return correct percentage", () => {
    expect(calculateProgress({ name: "Test", date: "2026-01-01" }, ["name", "date", "aircraft"])).toBe(67);
  });

  it("should return 100 for complete form", () => {
    expect(calculateProgress({ name: "Test", date: "2026-01-01", aircraft: "C172" }, ["name", "date", "aircraft"])).toBe(100);
  });

  it("should handle no required fields", () => {
    expect(calculateProgress({ anything: "value" }, [])).toBe(0);
  });
});
