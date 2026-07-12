const { Client } = require("pg");
const c = new Client({ host: "aws-0-ap-southeast-2.pooler.supabase.com", port: 6543, user: "postgres.tgzdztunswklbzbvbuxg", password: "Carlpogi@1029", database: "postgres", ssl: { rejectUnauthorized: false } });

async function run() {
  await c.connect();
  console.log("Connected");
  
  await c.query("DROP TABLE IF EXISTS community_messages CASCADE");
  console.log("Dropped old table");
  
  await c.query(`CREATE TABLE community_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT NOW()
  )`);
  console.log("Created table with content column");
  
  await c.query("ALTER TABLE community_messages ENABLE ROW LEVEL SECURITY");
  await c.query("CREATE POLICY cm_select ON community_messages FOR SELECT USING (true)");
  await c.query("CREATE POLICY cm_insert ON community_messages FOR INSERT WITH CHECK (auth.uid() = user_id)");
  await c.query("CREATE POLICY cm_delete ON community_messages FOR DELETE USING (auth.uid() = user_id)");
  console.log("RLS done");
  
  await c.query("ALTER PUBLICATION supabase_realtime ADD TABLE community_messages");
  console.log("Realtime enabled");
  
  await c.query("NOTIFY pgrst, 'reload schema'");
  console.log("Schema reloaded");
  
  await c.end();
  console.log("Done!");
}

run().catch(e => { console.error(e.message); c.end(); });
