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

const email = "admin@pilotforms.app";
const password = "Admin123!";

async function main() {
  // Check if user already exists via Admin API
  const listResp = await fetch(
    `${SUPABASE_URL}/auth/v1/admin/users?email=${encodeURIComponent(email)}`,
    { headers },
  );
  if (!listResp.ok) {
    const text = await listResp.text();
    console.error("Failed to list users:", listResp.status, text);
    process.exit(1);
  }
  const listData = await listResp.json();
  let userId = listData.users?.[0]?.id;

  if (userId) {
    console.log("User already exists:", userId);
  } else {
    // Create user
    const createResp = await fetch(
      `${SUPABASE_URL}/auth/v1/admin/users`,
      {
        method: "POST",
        headers,
        body: JSON.stringify({
          email,
          password,
          email_confirm: true,
        }),
      },
    );
    if (!createResp.ok) {
      const text = await createResp.text();
      console.error("Failed to create user:", createResp.status, text);
      process.exit(1);
    }
    const createData = await createResp.json();
    userId = createData.id;
    console.log("User created:", userId);
  }

  // Upsert profile with admin role via Data API
  const profileResp = await fetch(
    `${SUPABASE_URL}/rest/v1/profiles?on_conflict=id`,
    {
      method: "POST",
      headers: {
        ...headers,
        "Content-Type": "application/json",
        Prefer: "resolution=merge-duplicates",
      },
      body: JSON.stringify({
        id: userId,
        full_name: "Admin User",
        role: "admin",
      }),
    },
  );
  if (!profileResp.ok) {
    const text = await profileResp.text();
    console.error("Failed to upsert profile:", profileResp.status, text);
    process.exit(1);
  }

  console.log("Profile upserted: admin role");
  console.log("\n--- Credentials ---");
  console.log("Email:    " + email);
  console.log("Password: " + password);
  console.log("Role:     admin");
  console.log("URL:      " + SUPABASE_URL);
}

main().catch(console.error);
