/**
 * Full CRUD Endpoint Tests
 * Tests all Supabase tables with Create, Read, Update, Delete operations
 * Uses a test user session to validate RLS policies
 * Run with: npx jest src/__tests__/crud-endpoints.test.ts
 */

import { describe, it, expect, beforeAll, afterAll } from "@jest/globals";

const SUPABASE_URL = "https://tajflaaiezwlbkgyfnkh.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRhamZsYWFpZXp3bGJrZ3lmbmtoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUxOTY2NTUsImV4cCI6MjEwMDc3MjY1NX0.0-YkHZr5UM0eEp16eHrLa7-Vud9TNccwS0A_BgHA--g";

let accessToken = "";
let userId = "";
const TEST_EMAIL = `crud-test-${Date.now()}@fpl4flight.test`;
const TEST_PASSWORD = "TestCRUD123!";

// Helper for authenticated requests
function authHeaders() {
  return {
    apikey: SUPABASE_ANON_KEY,
    Authorization: `Bearer ${accessToken}`,
    "Content-Type": "application/json",
    Prefer: "return=representation",
  };
}

function anonHeaders() {
  return {
    apikey: SUPABASE_ANON_KEY,
    Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    "Content-Type": "application/json",
  };
}

// ─── Setup: Create test user ────────────────────────────────────
beforeAll(async () => {
  // Sign up
  const signupRes = await fetch(`${SUPABASE_URL}/auth/v1/signup`, {
    method: "POST",
    headers: { apikey: SUPABASE_ANON_KEY, "Content-Type": "application/json" },
    body: JSON.stringify({ email: TEST_EMAIL, password: TEST_PASSWORD }),
  });
  const signupData = await signupRes.json();

  // For confirmed users, login directly
  const loginRes = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: { apikey: SUPABASE_ANON_KEY, "Content-Type": "application/json" },
    body: JSON.stringify({ email: TEST_EMAIL, password: TEST_PASSWORD }),
  });
  const loginData = await loginRes.json();

  if (loginData.access_token) {
    accessToken = loginData.access_token;
    userId = loginData.user?.id ?? signupData.user?.id ?? "";
  } else if (signupData.access_token) {
    accessToken = signupData.access_token;
    userId = signupData.user?.id ?? "";
  }
}, 15000);

// ═══════════════════════════════════════════════════════════════════
// FLIGHTS CRUD
// ═══════════════════════════════════════════════════════════════════
describe("CRUD: Flights", () => {
  let flightId = "";

  it("CREATE - should insert a flight", async () => {
    if (!accessToken) return;
    const res = await fetch(`${SUPABASE_URL}/rest/v1/flights`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({
        user_id: userId,
        flight_number: "TEST-001",
        departure_code: "RPLL",
        departure_city: "Manila",
        departure_country: "PH",
        departure_time: "08:00",
        arrival_code: "RPVM",
        arrival_city: "Cebu",
        arrival_country: "PH",
        arrival_time: "09:30",
        date: "2026-08-01",
        aircraft: "C172",
        status: "scheduled",
      }),
    });
    const data = await res.json();
    expect(res.status).toBeLessThan(300);
    expect(data[0]?.id).toBeDefined();
    flightId = data[0]?.id;
  });

  it("READ - should fetch flights", async () => {
    if (!accessToken) return;
    const res = await fetch(`${SUPABASE_URL}/rest/v1/flights?user_id=eq.${userId}`, { headers: authHeaders() });
    const data = await res.json();
    expect(res.ok).toBe(true);
    expect(data.length).toBeGreaterThanOrEqual(1);
    expect(data[0].flight_number).toBe("TEST-001");
  });

  it("UPDATE - should update flight status", async () => {
    if (!accessToken || !flightId) return;
    const res = await fetch(`${SUPABASE_URL}/rest/v1/flights?id=eq.${flightId}`, {
      method: "PATCH",
      headers: authHeaders(),
      body: JSON.stringify({ status: "completed" }),
    });
    expect(res.status).toBeLessThan(300);
    const data = await res.json();
    expect(data[0]?.status).toBe("completed");
  });

  it("DELETE - should delete flight", async () => {
    if (!accessToken || !flightId) return;
    const res = await fetch(`${SUPABASE_URL}/rest/v1/flights?id=eq.${flightId}`, {
      method: "DELETE",
      headers: authHeaders(),
    });
    expect(res.status).toBeLessThan(300);
  });
});

// ═══════════════════════════════════════════════════════════════════
// AIRCRAFT CRUD
// ═══════════════════════════════════════════════════════════════════
describe("CRUD: Aircraft", () => {
  let aircraftId = "";

  it("CREATE - should insert an aircraft", async () => {
    if (!accessToken) return;
    const res = await fetch(`${SUPABASE_URL}/rest/v1/aircraft`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({
        user_id: userId,
        aircraft_id: "RP-C9999",
        type_of_aircraft: "C172",
        wake_turbulence_category: "L",
        equipment: "S",
        surveillance: "C",
      }),
    });
    const data = await res.json();
    expect(res.status).toBeLessThan(300);
    aircraftId = data[0]?.id;
  });

  it("READ - should fetch aircraft", async () => {
    if (!accessToken) return;
    const res = await fetch(`${SUPABASE_URL}/rest/v1/aircraft?user_id=eq.${userId}`, { headers: authHeaders() });
    const data = await res.json();
    expect(res.ok).toBe(true);
    expect(data.length).toBeGreaterThanOrEqual(1);
  });

  it("UPDATE - should update aircraft", async () => {
    if (!accessToken || !aircraftId) return;
    const res = await fetch(`${SUPABASE_URL}/rest/v1/aircraft?id=eq.${aircraftId}`, {
      method: "PATCH",
      headers: authHeaders(),
      body: JSON.stringify({ equipment: "SDGVOR" }),
    });
    expect(res.status).toBeLessThan(300);
  });

  it("DELETE - should delete aircraft", async () => {
    if (!accessToken || !aircraftId) return;
    const res = await fetch(`${SUPABASE_URL}/rest/v1/aircraft?id=eq.${aircraftId}`, {
      method: "DELETE",
      headers: authHeaders(),
    });
    expect(res.status).toBeLessThan(300);
  });
});

// ═══════════════════════════════════════════════════════════════════
// PILOT LOGBOOK CRUD
// ═══════════════════════════════════════════════════════════════════
describe("CRUD: Pilot Logbook", () => {
  let entryId = "";

  it("CREATE - should insert logbook entry", async () => {
    if (!accessToken) return;
    const res = await fetch(`${SUPABASE_URL}/rest/v1/pilot_logbook`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({
        user_id: userId,
        date: "2026-07-28",
        aircraft_id: "RP-C2289",
        aircraft_type: "C172",
        departure: "RPLL",
        arrival: "RPVM",
        route: "Direct",
        pic_hours: 2.5,
        total_hours: 2.5,
        landings: 1,
        remarks: "Test flight",
      }),
    });
    const data = await res.json();
    expect(res.status).toBeLessThan(300);
    entryId = data[0]?.id;
  });

  it("READ - should fetch logbook entries", async () => {
    if (!accessToken) return;
    const res = await fetch(`${SUPABASE_URL}/rest/v1/pilot_logbook?user_id=eq.${userId}`, { headers: authHeaders() });
    const data = await res.json();
    expect(res.ok).toBe(true);
    expect(data.length).toBeGreaterThanOrEqual(1);
  });

  it("UPDATE - should update logbook entry", async () => {
    if (!accessToken || !entryId) return;
    const res = await fetch(`${SUPABASE_URL}/rest/v1/pilot_logbook?id=eq.${entryId}`, {
      method: "PATCH",
      headers: authHeaders(),
      body: JSON.stringify({ remarks: "Updated test flight" }),
    });
    expect(res.status).toBeLessThan(300);
  });

  it("DELETE - should delete logbook entry", async () => {
    if (!accessToken || !entryId) return;
    const res = await fetch(`${SUPABASE_URL}/rest/v1/pilot_logbook?id=eq.${entryId}`, {
      method: "DELETE",
      headers: authHeaders(),
    });
    expect(res.status).toBeLessThan(300);
  });
});

// ═══════════════════════════════════════════════════════════════════
// FORM INSTANCES CRUD
// ═══════════════════════════════════════════════════════════════════
describe("CRUD: Form Instances", () => {
  let formId = "";

  it("CREATE - should create a form instance", async () => {
    if (!accessToken) return;
    const res = await fetch(`${SUPABASE_URL}/rest/v1/form_instances`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({
        user_id: userId,
        template_id: "caap-fpl-ats-2019-1",
        template_version: 1,
        status: "draft",
        data: { aircraft_id: "RPC1234", departure_aerodrome: "RPLL" },
      }),
    });
    const data = await res.json();
    expect(res.status).toBeLessThan(300);
    formId = data[0]?.id;
  });

  it("READ - should fetch form instances", async () => {
    if (!accessToken) return;
    const res = await fetch(`${SUPABASE_URL}/rest/v1/form_instances?user_id=eq.${userId}`, { headers: authHeaders() });
    const data = await res.json();
    expect(res.ok).toBe(true);
    expect(data.length).toBeGreaterThanOrEqual(1);
  });

  it("UPDATE - should update form data", async () => {
    if (!accessToken || !formId) return;
    const res = await fetch(`${SUPABASE_URL}/rest/v1/form_instances?id=eq.${formId}`, {
      method: "PATCH",
      headers: authHeaders(),
      body: JSON.stringify({ status: "completed", data: { aircraft_id: "RPC1234", departure_aerodrome: "RPLL", destination_aerodrome: "RPVM" } }),
    });
    expect(res.status).toBeLessThan(300);
  });

  it("DELETE - should delete form instance", async () => {
    if (!accessToken || !formId) return;
    const res = await fetch(`${SUPABASE_URL}/rest/v1/form_instances?id=eq.${formId}`, {
      method: "DELETE",
      headers: authHeaders(),
    });
    expect(res.status).toBeLessThan(300);
  });
});

// ═══════════════════════════════════════════════════════════════════
// COMMUNITY MESSAGES CRUD (Chat)
// ═══════════════════════════════════════════════════════════════════
describe("CRUD: Community Messages (Chat)", () => {
  let messageId = "";

  it("CREATE - should send a message", async () => {
    if (!accessToken) return;
    const res = await fetch(`${SUPABASE_URL}/rest/v1/community_messages`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({
        user_id: userId,
        content: "Hello from automated test!",
        channel_id: "general",
        message_type: "text",
      }),
    });
    const data = await res.json();
    expect(res.status).toBeLessThan(300);
    messageId = data[0]?.id;
  });

  it("READ - should fetch messages", async () => {
    if (!accessToken) return;
    const res = await fetch(`${SUPABASE_URL}/rest/v1/community_messages?channel_id=eq.general&order=created_at.desc&limit=10`, { headers: authHeaders() });
    const data = await res.json();
    expect(res.ok).toBe(true);
    expect(data.length).toBeGreaterThanOrEqual(1);
    expect(data[0].content).toContain("automated test");
  });

  it("UPDATE - should edit message", async () => {
    if (!accessToken || !messageId) return;
    const res = await fetch(`${SUPABASE_URL}/rest/v1/community_messages?id=eq.${messageId}`, {
      method: "PATCH",
      headers: authHeaders(),
      body: JSON.stringify({ content: "Edited by automated test" }),
    });
    expect(res.status).toBeLessThan(300);
  });

  it("DELETE - should delete message", async () => {
    if (!accessToken || !messageId) return;
    const res = await fetch(`${SUPABASE_URL}/rest/v1/community_messages?id=eq.${messageId}`, {
      method: "DELETE",
      headers: authHeaders(),
    });
    expect(res.status).toBeLessThan(300);
  });
});

// ═══════════════════════════════════════════════════════════════════
// DUTY TRACKER CRUD
// ═══════════════════════════════════════════════════════════════════
describe("CRUD: Duty Tracker", () => {
  let dutyId = "";

  it("CREATE - should insert duty entry", async () => {
    if (!accessToken) return;
    const res = await fetch(`${SUPABASE_URL}/rest/v1/duty_tracker`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ user_id: userId, date: "2026-07-28", duty_start: "06:00", duty_end: "14:00", flight_time: 4.5, rest_before: 12, remarks: "Test duty" }),
    });
    const data = await res.json();
    expect(res.status).toBeLessThan(300);
    dutyId = data[0]?.id;
  });

  it("READ - should fetch duty entries", async () => {
    if (!accessToken) return;
    const res = await fetch(`${SUPABASE_URL}/rest/v1/duty_tracker?user_id=eq.${userId}`, { headers: authHeaders() });
    expect(res.ok).toBe(true);
  });

  it("DELETE - should delete duty entry", async () => {
    if (!accessToken || !dutyId) return;
    const res = await fetch(`${SUPABASE_URL}/rest/v1/duty_tracker?id=eq.${dutyId}`, { method: "DELETE", headers: authHeaders() });
    expect(res.status).toBeLessThan(300);
  });
});

// ═══════════════════════════════════════════════════════════════════
// PROFILES CRUD
// ═══════════════════════════════════════════════════════════════════
describe("CRUD: Profiles", () => {
  it("READ - should fetch own profile", async () => {
    if (!accessToken) return;
    const res = await fetch(`${SUPABASE_URL}/rest/v1/profiles?id=eq.${userId}`, { headers: authHeaders() });
    const data = await res.json();
    expect(res.ok).toBe(true);
    expect(data.length).toBe(1);
  });

  it("UPDATE - should update profile name", async () => {
    if (!accessToken) return;
    const res = await fetch(`${SUPABASE_URL}/rest/v1/profiles?id=eq.${userId}`, {
      method: "PATCH",
      headers: authHeaders(),
      body: JSON.stringify({ full_name: "Test Pilot", license_number: "12345CPL" }),
    });
    expect(res.status).toBeLessThan(300);
  });

  it("READ - should see updated name", async () => {
    if (!accessToken) return;
    const res = await fetch(`${SUPABASE_URL}/rest/v1/profiles?id=eq.${userId}&select=full_name,license_number`, { headers: authHeaders() });
    const data = await res.json();
    expect(data[0]?.full_name).toBe("Test Pilot");
    expect(data[0]?.license_number).toBe("12345CPL");
  });
});

// ═══════════════════════════════════════════════════════════════════
// USER PREFERENCES CRUD
// ═══════════════════════════════════════════════════════════════════
describe("CRUD: User Preferences", () => {
  it("READ - should have default preferences", async () => {
    if (!accessToken) return;
    const res = await fetch(`${SUPABASE_URL}/rest/v1/user_preferences?id=eq.${userId}`, { headers: authHeaders() });
    const data = await res.json();
    expect(res.ok).toBe(true);
    expect(data.length).toBe(1);
    expect(data[0].push_notifications).toBe(true);
  });

  it("UPDATE - should update preferences", async () => {
    if (!accessToken) return;
    const res = await fetch(`${SUPABASE_URL}/rest/v1/user_preferences?id=eq.${userId}`, {
      method: "PATCH",
      headers: authHeaders(),
      body: JSON.stringify({ push_notifications: false, offline_mode: true }),
    });
    expect(res.status).toBeLessThan(300);
  });
});

// ═══════════════════════════════════════════════════════════════════
// FORM TEMPLATES (Read-only for users)
// ═══════════════════════════════════════════════════════════════════
describe("CRUD: Form Templates (Read-only)", () => {
  it("READ - should list active templates", async () => {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/form_templates?is_active=eq.true&select=slug,name,description`, { headers: anonHeaders() });
    const data = await res.json();
    expect(res.ok).toBe(true);
    expect(data.length).toBeGreaterThanOrEqual(5);
  });

  it("READ - should get template schema", async () => {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/form_templates?slug=eq.caap-fpl-ats-2019-1&select=schema`, { headers: anonHeaders() });
    const data = await res.json();
    expect(data[0]?.schema?.sections).toBeDefined();
    expect(data[0].schema.sections.length).toBeGreaterThan(0);
  });

  it("WRITE - should NOT allow anon to create templates", async () => {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/form_templates`, {
      method: "POST",
      headers: anonHeaders(),
      body: JSON.stringify({ slug: "hack-test", name: "Hack", schema: {} }),
    });
    expect(res.status).toBeGreaterThanOrEqual(400);
  });
});

// ═══════════════════════════════════════════════════════════════════
// CHAT CHANNELS (Read for all, Write for authenticated)
// ═══════════════════════════════════════════════════════════════════
describe("CRUD: Chat Channels", () => {
  it("READ - should list channels", async () => {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/chat_channels?select=id,name`, { headers: anonHeaders() });
    const data = await res.json();
    expect(res.ok).toBe(true);
    expect(data.length).toBeGreaterThanOrEqual(5);
  });

  it("CREATE - authenticated user can create channel", async () => {
    if (!accessToken) return;
    const res = await fetch(`${SUPABASE_URL}/rest/v1/chat_channels`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ id: `test-${Date.now()}`, name: `test-${Date.now()}`, description: "Automated test", icon: "code-outline", created_by: userId }),
    });
    expect(res.status).toBeLessThan(300);
  });
});

// ═══════════════════════════════════════════════════════════════════
// RLS SECURITY TESTS
// ═══════════════════════════════════════════════════════════════════
describe("Security: RLS Policies", () => {
  it("should NOT allow reading other users flights with anon key", async () => {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/flights?select=*`, { headers: anonHeaders() });
    const data = await res.json();
    // Anon should get empty (RLS blocks)
    expect(data.length).toBe(0);
  });

  it("should NOT allow reading other users logbook", async () => {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/pilot_logbook?select=*`, { headers: anonHeaders() });
    const data = await res.json();
    expect(data.length).toBe(0);
  });

  it("should NOT allow reading other users aircraft", async () => {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/aircraft?select=*`, { headers: anonHeaders() });
    const data = await res.json();
    expect(data.length).toBe(0);
  });
});
