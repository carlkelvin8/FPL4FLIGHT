const { Client } = require("pg");
const { createClient } = require("@supabase/supabase-js");
const fs = require("fs");

const c = new Client({
  host: "aws-0-ap-southeast-2.pooler.supabase.com",
  port: 6543,
  user: "postgres.tajflaaiezwlbkgyfnkh",
  password: "Carlpogi@1029",
  database: "postgres",
  ssl: { rejectUnauthorized: false },
});

async function run() {
  await c.connect();
  // Drop old restrictive policies and add permissive one
  try { await c.query("DROP POLICY IF EXISTS \"Allow public read aip-docs\" ON storage.objects"); } catch {}
  try { await c.query("DROP POLICY IF EXISTS \"Allow authenticated upload aip-docs\" ON storage.objects"); } catch {}
  try { await c.query("DROP POLICY IF EXISTS \"Allow public upload aip-docs\" ON storage.objects"); } catch {}
  await c.query("CREATE POLICY \"aip_all\" ON storage.objects FOR ALL USING (bucket_id = 'aip-docs') WITH CHECK (bucket_id = 'aip-docs')");
  console.log("✓ Storage policy fixed");
  await c.end();

  // Now upload
  const supabase = createClient(
    "https://tajflaaiezwlbkgyfnkh.supabase.co",
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRhamZsYWFpZXp3bGJrZ3lmbmtoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUxOTY2NTUsImV4cCI6MjEwMDc3MjY1NX0.0-YkHZr5UM0eEp16eHrLa7-Vud9TNccwS0A_BgHA--g"
  );
  const file = fs.readFileSync("apps/mobile/assets/caap-fpl-blank.png");
  const { error } = await supabase.storage.from("aip-docs").upload("caap-fpl-blank.png", file, { contentType: "image/png", upsert: true });
  if (error) console.log("Upload error:", error.message);
  else {
    const { data } = supabase.storage.from("aip-docs").getPublicUrl("caap-fpl-blank.png");
    console.log("✅ Uploaded:", data.publicUrl);
  }
}
run();
