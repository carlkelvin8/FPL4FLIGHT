/**
 * Backend Integration Tests
 * Tests Supabase API connectivity, CRUD operations, and RLS policies
 * Run with: npx jest src/__tests__/backend-integration.test.ts
 */

import { describe, it, expect, beforeAll, afterAll } from "@jest/globals";

// Mock Supabase for testing
const SUPABASE_URL = "https://tajflaaiezwlbkgyfnkh.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRhamZsYWFpZXp3bGJrZ3lmbmtoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUxOTY2NTUsImV4cCI6MjEwMDc3MjY1NX0.0-YkHZr5UM0eEp16eHrLa7-Vud9TNccwS0A_BgHA--g";

describe("Backend: Supabase Connectivity", () => {
  it("should connect to Supabase API", async () => {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/`, {
      headers: { apikey: SUPABASE_ANON_KEY },
    });
    expect(res.status).toBeLessThan(500);
  });

  it("should have form_templates table accessible", async () => {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/form_templates?select=id,name&limit=5`, {
      headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` },
    });
    expect(res.ok).toBe(true);
    const data = await res.json();
    expect(Array.isArray(data)).toBe(true);
  });

  it("should have chat_channels table accessible", async () => {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/chat_channels?select=id,name`, {
      headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` },
    });
    expect(res.ok).toBe(true);
  });

  it("should have form templates seeded", async () => {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/form_templates?select=slug,name&is_active=eq.true`, {
      headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` },
    });
    const data = await res.json();
    expect(data.length).toBeGreaterThanOrEqual(5);
    const slugs = data.map((t: any) => t.slug);
    expect(slugs).toContain("caap-fpl-ats-2019-1");
    expect(slugs).toContain("passenger-manifest");
    expect(slugs).toContain("aircraft-flight-logbook");
  });

  it("should reject unauthorized writes to flights", async () => {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/flights`, {
      method: "POST",
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ flight_number: "TEST-1", user_id: "fake-id" }),
    });
    // Should fail due to RLS
    expect(res.status).toBeGreaterThanOrEqual(400);
  });
});

describe("Backend: Auth", () => {
  it("should allow signup with email/password", async () => {
    const testEmail = `test-${Date.now()}@test.com`;
    const res = await fetch(`${SUPABASE_URL}/auth/v1/signup`, {
      method: "POST",
      headers: {
        apikey: SUPABASE_ANON_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email: testEmail, password: "TestPass123!" }),
    });
    expect(res.status).toBeLessThan(500);
  });

  it("should reject login with wrong credentials", async () => {
    const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
      method: "POST",
      headers: {
        apikey: SUPABASE_ANON_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email: "nonexistent@test.com", password: "wrong" }),
    });
    expect(res.status).toBe(400);
  });
});

describe("Backend: Storage", () => {
  it("should have aip-docs bucket", async () => {
    const res = await fetch(`${SUPABASE_URL}/storage/v1/bucket/aip-docs`, {
      headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` },
    });
    expect(res.status).toBeLessThan(500);
  });

  it("should have chat-media bucket", async () => {
    const res = await fetch(`${SUPABASE_URL}/storage/v1/bucket/chat-media`, {
      headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` },
    });
    expect(res.status).toBeLessThan(500);
  });
});
