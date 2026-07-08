const SUPABASE_URL = "https://pvmwqdltacipxoadoglk.supabase.co";
const SERVICE_ROLE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB2bXdxZGx0YWNpcHhvYWRvZ2xrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MzEwOTQ3NCwiZXhwIjoyMDk4Njg1NDc0fQ.UYOMaMXNf8QMPes4VD9WU5lgNqpTip-4rdfU8HvFh68";
const ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB2bXdxZGx0YWNpcHhvYWRvZ2xrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMxMDk0NzQsImV4cCI6MjA5ODY4NTQ3NH0.SH-sJGb97MYF3sLEdTsc1T5Ehx-eSxwkBk_Pq9mXKno";

const headers = {
  apikey: ANON_KEY,
  Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
  "Content-Type": "application/json",
};

const users = [
  { email: "pilot@pilotforms.dev", password: "Pilot1234!", full_name: "Jane Aviator", role: "pilot" },
  { email: "instructor@pilotforms.dev", password: "Pilot1234!", full_name: "Mike Johnson", role: "pilot" },
  { email: "student@pilotforms.dev", password: "Pilot1234!", full_name: "Sarah Connor", role: "pilot" },
  { email: "atp@pilotforms.dev", password: "Pilot1234!", full_name: "Capt. David Miller", role: "pilot" },
];

async function findUserByEmail(email) {
  const resp = await fetch(
    `${SUPABASE_URL}/auth/v1/admin/users?email=${encodeURIComponent(email)}`,
    { headers },
  );
  if (!resp.ok) throw new Error(`List failed: ${await resp.text()}`);
  const data = await resp.json();
  const match = data.users?.find((u) => u.email === email);
  return match ? match.id : null;
}

async function createUser(email, password) {
  const resp = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
    method: "POST",
    headers,
    body: JSON.stringify({ email, password, email_confirm: true }),
  });
  if (!resp.ok) throw new Error(`Create failed: ${await resp.text()}`);
  const data = await resp.json();
  return data.id;
}

async function upsertProfile(userId, fullName, role) {
  const resp = await fetch(`${SUPABASE_URL}/rest/v1/profiles?on_conflict=id`, {
    method: "POST",
    headers: { ...headers, Prefer: "resolution=merge-duplicates" },
    body: JSON.stringify({ id: userId, full_name: fullName, role }),
  });
  if (!resp.ok) throw new Error(`Profile failed: ${await resp.text()}`);
}

async function main() {
  for (const u of users) {
    let userId = await findUserByEmail(u.email);
    if (userId) {
      console.log(`✓ ${u.email.padEnd(35)} already exists`);
    } else {
      userId = await createUser(u.email, u.password);
      console.log(`✓ ${u.email.padEnd(35)} created (${userId})`);
    }
    await upsertProfile(userId, u.full_name, u.role);
    console.log(`  ${''.padEnd(35)} profile upserted`);
  }
  console.log("\n--- All users seeded ---");
  console.log("Password for all pilots: Pilot1234!");
}

main().catch(console.error);
