const { Client } = require("pg");

const client = new Client({
  host: "aws-0-ap-northeast-1.pooler.supabase.com",
  port: 6543,
  user: "postgres.lushoozwafaqekfjlocb",
  password: "Carlpogi@1029",
  database: "postgres",
  ssl: { rejectUnauthorized: false },
});

const migrations = [
  // Remove templates not from the PDF
  `DELETE FROM form_templates WHERE slug IN ('icao-fpl', 'pre-flight-checklist', 'weight-balance');`,
  `NOTIFY pgrst, 'reload schema';`,
];

async function run() {
  try {
    await client.connect();
    console.log("Connected to database!");

    for (let i = 0; i < migrations.length; i++) {
      try {
        await client.query(migrations[i]);
        console.log(`✓ Migration ${i + 1}/${migrations.length} done`);
      } catch (e) {
        console.log(`⚠ Migration ${i + 1} skipped: ${e.message}`);
      }
    }

    console.log("\n✅ All migrations complete!");
  } catch (e) {
    console.error("Connection failed:", e.message);
  } finally {
    await client.end();
  }
}

run();
