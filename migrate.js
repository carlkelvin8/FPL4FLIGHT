const { Client } = require("pg");

const client = new Client({
  host: process.env.DB_HOST || "aws-0-ap-southeast-2.pooler.supabase.com",
  port: parseInt(process.env.DB_PORT || "6543"),
  user: process.env.DB_USER || "postgres.tgzdztunswklbzbvbuxg",
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || "postgres",
  ssl: { rejectUnauthorized: false },
});

const migrations = [
  `CREATE TABLE IF NOT EXISTS profiles (id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE, full_name TEXT, role TEXT DEFAULT 'pilot', created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW());`,
  `CREATE TABLE IF NOT EXISTS form_templates (id UUID DEFAULT gen_random_uuid() PRIMARY KEY, slug TEXT NOT NULL, name TEXT NOT NULL, description TEXT, version INTEGER NOT NULL DEFAULT 1, schema JSONB NOT NULL DEFAULT '{}', is_active BOOLEAN DEFAULT true, deprecated BOOLEAN DEFAULT false, created_by UUID REFERENCES auth.users(id), created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW());`,
  `CREATE TABLE IF NOT EXISTS form_instances (id UUID DEFAULT gen_random_uuid() PRIMARY KEY, user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE, template_id TEXT NOT NULL, template_version INTEGER NOT NULL DEFAULT 1, status TEXT NOT NULL DEFAULT 'draft', data JSONB NOT NULL DEFAULT '{}', device_id TEXT, submitted_at TIMESTAMPTZ, created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW());`,
  `CREATE TABLE IF NOT EXISTS aircraft (id UUID DEFAULT gen_random_uuid() PRIMARY KEY, user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE, aircraft_id TEXT NOT NULL, type_of_aircraft TEXT NOT NULL DEFAULT '', wake_turbulence_category TEXT NOT NULL DEFAULT 'L', equipment TEXT NOT NULL DEFAULT '', surveillance TEXT NOT NULL DEFAULT '', emergency_radio JSONB NOT NULL DEFAULT '{"uhf":false,"vhf":false,"elt":false}', survival_equipment JSONB NOT NULL DEFAULT '{"polar":false,"maritime":false,"desert":false,"jungle":false}', jackets JSONB NOT NULL DEFAULT '{"light":false,"fluores":false,"uhf":false,"vhf":false}', dinghies JSONB NOT NULL DEFAULT '{"dinghies":false,"cover":false}', created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW());`,
  `CREATE TABLE IF NOT EXISTS flights (id UUID DEFAULT gen_random_uuid() PRIMARY KEY, user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE, flight_number TEXT NOT NULL, departure_code TEXT NOT NULL, departure_city TEXT DEFAULT '', departure_country TEXT DEFAULT '', departure_time TEXT NOT NULL, arrival_code TEXT NOT NULL, arrival_city TEXT DEFAULT '', arrival_country TEXT DEFAULT '', arrival_time TEXT NOT NULL, date TEXT NOT NULL, aircraft TEXT DEFAULT '', status TEXT NOT NULL DEFAULT 'scheduled', gate TEXT, pilot_in_command TEXT, remarks TEXT, created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW());`,
  `CREATE TABLE IF NOT EXISTS user_preferences (id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE, push_notifications BOOLEAN DEFAULT true, email_notifications BOOLEAN DEFAULT true, offline_mode BOOLEAN DEFAULT false, avatar_id TEXT DEFAULT 'captain', created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW());`,
  `ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;`,
  `ALTER TABLE form_templates ENABLE ROW LEVEL SECURITY;`,
  `ALTER TABLE form_instances ENABLE ROW LEVEL SECURITY;`,
  `ALTER TABLE aircraft ENABLE ROW LEVEL SECURITY;`,
  `ALTER TABLE flights ENABLE ROW LEVEL SECURITY;`,
  `ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;`,
  `DO $$ BEGIN CREATE POLICY "p1" ON profiles FOR SELECT USING (auth.uid()=id); EXCEPTION WHEN duplicate_object THEN NULL; END $$;`,
  `DO $$ BEGIN CREATE POLICY "p2" ON profiles FOR INSERT WITH CHECK (auth.uid()=id); EXCEPTION WHEN duplicate_object THEN NULL; END $$;`,
  `DO $$ BEGIN CREATE POLICY "p3" ON profiles FOR UPDATE USING (auth.uid()=id); EXCEPTION WHEN duplicate_object THEN NULL; END $$;`,
  `DO $$ BEGIN CREATE POLICY "t1" ON form_templates FOR SELECT USING (is_active=true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;`,
  `DO $$ BEGIN CREATE POLICY "f1" ON form_instances FOR SELECT USING (auth.uid()=user_id); EXCEPTION WHEN duplicate_object THEN NULL; END $$;`,
  `DO $$ BEGIN CREATE POLICY "f2" ON form_instances FOR INSERT WITH CHECK (auth.uid()=user_id); EXCEPTION WHEN duplicate_object THEN NULL; END $$;`,
  `DO $$ BEGIN CREATE POLICY "f3" ON form_instances FOR UPDATE USING (auth.uid()=user_id); EXCEPTION WHEN duplicate_object THEN NULL; END $$;`,
  `DO $$ BEGIN CREATE POLICY "f4" ON form_instances FOR DELETE USING (auth.uid()=user_id); EXCEPTION WHEN duplicate_object THEN NULL; END $$;`,
  `DO $$ BEGIN CREATE POLICY "a1" ON aircraft FOR SELECT USING (auth.uid()=user_id); EXCEPTION WHEN duplicate_object THEN NULL; END $$;`,
  `DO $$ BEGIN CREATE POLICY "a2" ON aircraft FOR INSERT WITH CHECK (auth.uid()=user_id); EXCEPTION WHEN duplicate_object THEN NULL; END $$;`,
  `DO $$ BEGIN CREATE POLICY "a3" ON aircraft FOR UPDATE USING (auth.uid()=user_id); EXCEPTION WHEN duplicate_object THEN NULL; END $$;`,
  `DO $$ BEGIN CREATE POLICY "a4" ON aircraft FOR DELETE USING (auth.uid()=user_id); EXCEPTION WHEN duplicate_object THEN NULL; END $$;`,
  `DO $$ BEGIN CREATE POLICY "fl1" ON flights FOR SELECT USING (auth.uid()=user_id); EXCEPTION WHEN duplicate_object THEN NULL; END $$;`,
  `DO $$ BEGIN CREATE POLICY "fl2" ON flights FOR INSERT WITH CHECK (auth.uid()=user_id); EXCEPTION WHEN duplicate_object THEN NULL; END $$;`,
  `DO $$ BEGIN CREATE POLICY "fl3" ON flights FOR UPDATE USING (auth.uid()=user_id); EXCEPTION WHEN duplicate_object THEN NULL; END $$;`,
  `DO $$ BEGIN CREATE POLICY "fl4" ON flights FOR DELETE USING (auth.uid()=user_id); EXCEPTION WHEN duplicate_object THEN NULL; END $$;`,
  `DO $$ BEGIN CREATE POLICY "up1" ON user_preferences FOR SELECT USING (auth.uid()=id); EXCEPTION WHEN duplicate_object THEN NULL; END $$;`,
  `DO $$ BEGIN CREATE POLICY "up2" ON user_preferences FOR INSERT WITH CHECK (auth.uid()=id); EXCEPTION WHEN duplicate_object THEN NULL; END $$;`,
  `DO $$ BEGIN CREATE POLICY "up3" ON user_preferences FOR UPDATE USING (auth.uid()=id); EXCEPTION WHEN duplicate_object THEN NULL; END $$;`,
  `CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS TRIGGER AS $$ BEGIN INSERT INTO public.profiles (id,role) VALUES (NEW.id,'pilot'); INSERT INTO public.user_preferences (id) VALUES (NEW.id); RETURN NEW; END; $$ LANGUAGE plpgsql SECURITY DEFINER;`,
  `DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;`,
  `CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();`,
  // Form templates managed separately (unique index on slug prevents duplicates)
  `CREATE UNIQUE INDEX IF NOT EXISTS form_templates_slug_unique ON form_templates(slug);`,
  `CREATE TABLE IF NOT EXISTS community_messages (id UUID DEFAULT gen_random_uuid() PRIMARY KEY, user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE, message TEXT NOT NULL, user_name TEXT DEFAULT '', created_at TIMESTAMPTZ DEFAULT NOW());`,
  `ALTER TABLE community_messages ENABLE ROW LEVEL SECURITY;`,
  `DO $$ BEGIN CREATE POLICY "cm1" ON community_messages FOR SELECT USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;`,
  `DO $$ BEGIN CREATE POLICY "cm2" ON community_messages FOR INSERT WITH CHECK (auth.uid()=user_id); EXCEPTION WHEN duplicate_object THEN NULL; END $$;`,
  // Enable Realtime on all tables
  `ALTER PUBLICATION supabase_realtime ADD TABLE aircraft;`,
  `ALTER PUBLICATION supabase_realtime ADD TABLE flights;`,
  `ALTER PUBLICATION supabase_realtime ADD TABLE form_instances;`,
  `ALTER PUBLICATION supabase_realtime ADD TABLE community_messages;`,
  `ALTER PUBLICATION supabase_realtime ADD TABLE user_preferences;`,
  // Chat channels
  `CREATE TABLE IF NOT EXISTS chat_channels (id TEXT PRIMARY KEY, name TEXT NOT NULL UNIQUE, description TEXT DEFAULT '', icon TEXT DEFAULT 'chatbubble-outline', created_by UUID REFERENCES auth.users(id), created_at TIMESTAMPTZ DEFAULT NOW());`,
  `ALTER TABLE chat_channels ENABLE ROW LEVEL SECURITY;`,
  `DO $$ BEGIN CREATE POLICY "cc1" ON chat_channels FOR SELECT USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;`,
  `DO $$ BEGIN CREATE POLICY "cc2" ON chat_channels FOR INSERT WITH CHECK (auth.uid() IS NOT NULL); EXCEPTION WHEN duplicate_object THEN NULL; END $$;`,
  `ALTER TABLE community_messages ADD COLUMN IF NOT EXISTS channel_id TEXT DEFAULT 'general';`,
  `UPDATE community_messages SET channel_id = 'general' WHERE channel_id IS NULL;`,
  `INSERT INTO chat_channels (id, name, description, icon) VALUES ('general', 'general', 'General pilot discussion', 'chatbubbles-outline') ON CONFLICT DO NOTHING;`,
  `INSERT INTO chat_channels (id, name, description, icon) VALUES ('flight-ops', 'flight-ops', 'Flight operations & planning', 'airplane-outline') ON CONFLICT DO NOTHING;`,
  `INSERT INTO chat_channels (id, name, description, icon) VALUES ('weather', 'weather', 'Weather reports & METAR discussion', 'cloud-outline') ON CONFLICT DO NOTHING;`,
  `INSERT INTO chat_channels (id, name, description, icon) VALUES ('atc', 'atc', 'ATC communications', 'radio-outline') ON CONFLICT DO NOTHING;`,
  `INSERT INTO chat_channels (id, name, description, icon) VALUES ('random', 'random', 'Off-topic chat', 'cafe-outline') ON CONFLICT DO NOTHING;`,
  `ALTER PUBLICATION supabase_realtime ADD TABLE chat_channels;`,
  // Message reactions table
  `CREATE TABLE IF NOT EXISTS message_reactions (id UUID DEFAULT gen_random_uuid() PRIMARY KEY, message_id UUID NOT NULL REFERENCES community_messages(id) ON DELETE CASCADE, user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE, emoji TEXT NOT NULL, created_at TIMESTAMPTZ DEFAULT NOW(), UNIQUE(message_id, user_id, emoji));`,
  `ALTER TABLE message_reactions ENABLE ROW LEVEL SECURITY;`,
  `DO $$ BEGIN CREATE POLICY "mr1" ON message_reactions FOR SELECT USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;`,
  `DO $$ BEGIN CREATE POLICY "mr2" ON message_reactions FOR INSERT WITH CHECK (auth.uid()=user_id); EXCEPTION WHEN duplicate_object THEN NULL; END $$;`,
  `DO $$ BEGIN CREATE POLICY "mr3" ON message_reactions FOR DELETE USING (auth.uid()=user_id); EXCEPTION WHEN duplicate_object THEN NULL; END $$;`,
  // Reply columns on community_messages
  `ALTER TABLE community_messages ADD COLUMN IF NOT EXISTS reply_to_id UUID REFERENCES community_messages(id) ON DELETE SET NULL;`,
  `ALTER TABLE community_messages ADD COLUMN IF NOT EXISTS reply_to_user_name TEXT DEFAULT '';`,
  `ALTER TABLE community_messages ADD COLUMN IF NOT EXISTS reply_to_content TEXT DEFAULT '';`,
  // Rich message columns
  `ALTER TABLE community_messages ADD COLUMN IF NOT EXISTS message_type TEXT DEFAULT 'text';`,
  `ALTER TABLE community_messages ADD COLUMN IF NOT EXISTS image_url TEXT;`,
  `ALTER TABLE community_messages ADD COLUMN IF NOT EXISTS voice_url TEXT;`,
  `ALTER TABLE community_messages ADD COLUMN IF NOT EXISTS voice_duration INTEGER;`,
  `ALTER TABLE community_messages ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION;`,
  `ALTER TABLE community_messages ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION;`,
  `ALTER TABLE community_messages ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN DEFAULT false;`,
  `ALTER TABLE community_messages ADD COLUMN IF NOT EXISTS mentions TEXT[] DEFAULT '{}';`,
  `NOTIFY pgrst, 'reload schema';`,
  // Pilot logbook table
  `CREATE TABLE IF NOT EXISTS pilot_logbook (id UUID DEFAULT gen_random_uuid() PRIMARY KEY, user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE, date TEXT NOT NULL, aircraft_id TEXT DEFAULT '', aircraft_type TEXT DEFAULT '', departure TEXT DEFAULT '', arrival TEXT DEFAULT '', route TEXT DEFAULT '', pic_hours DOUBLE PRECISION DEFAULT 0, sic_hours DOUBLE PRECISION DEFAULT 0, dual_hours DOUBLE PRECISION DEFAULT 0, night_hours DOUBLE PRECISION DEFAULT 0, ifr_hours DOUBLE PRECISION DEFAULT 0, total_hours DOUBLE PRECISION DEFAULT 0, landings INTEGER DEFAULT 0, remarks TEXT DEFAULT '', created_at TIMESTAMPTZ DEFAULT NOW());`,
  `ALTER TABLE pilot_logbook ENABLE ROW LEVEL SECURITY;`,
  `DO $$ BEGIN CREATE POLICY "pl1" ON pilot_logbook FOR SELECT USING (auth.uid()=user_id); EXCEPTION WHEN duplicate_object THEN NULL; END $$;`,
  `DO $$ BEGIN CREATE POLICY "pl2" ON pilot_logbook FOR INSERT WITH CHECK (auth.uid()=user_id); EXCEPTION WHEN duplicate_object THEN NULL; END $$;`,
  `DO $$ BEGIN CREATE POLICY "pl3" ON pilot_logbook FOR UPDATE USING (auth.uid()=user_id); EXCEPTION WHEN duplicate_object THEN NULL; END $$;`,
  `DO $$ BEGIN CREATE POLICY "pl4" ON pilot_logbook FOR DELETE USING (auth.uid()=user_id); EXCEPTION WHEN duplicate_object THEN NULL; END $$;`,
  // Duty tracker table
  `CREATE TABLE IF NOT EXISTS duty_tracker (id UUID DEFAULT gen_random_uuid() PRIMARY KEY, user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE, date TEXT NOT NULL, duty_start TEXT DEFAULT '', duty_end TEXT DEFAULT '', flight_time DOUBLE PRECISION DEFAULT 0, rest_before DOUBLE PRECISION DEFAULT 0, remarks TEXT DEFAULT '', created_at TIMESTAMPTZ DEFAULT NOW());`,
  `ALTER TABLE duty_tracker ENABLE ROW LEVEL SECURITY;`,
  `DO $$ BEGIN CREATE POLICY "dt1" ON duty_tracker FOR SELECT USING (auth.uid()=user_id); EXCEPTION WHEN duplicate_object THEN NULL; END $$;`,
  `DO $$ BEGIN CREATE POLICY "dt2" ON duty_tracker FOR INSERT WITH CHECK (auth.uid()=user_id); EXCEPTION WHEN duplicate_object THEN NULL; END $$;`,
  `DO $$ BEGIN CREATE POLICY "dt3" ON duty_tracker FOR UPDATE USING (auth.uid()=user_id); EXCEPTION WHEN duplicate_object THEN NULL; END $$;`,
  `DO $$ BEGIN CREATE POLICY "dt4" ON duty_tracker FOR DELETE USING (auth.uid()=user_id); EXCEPTION WHEN duplicate_object THEN NULL; END $$;`,
];

async function run() {
  try {
    await client.connect();
    console.log("Connected!");
    for (let i = 0; i < migrations.length; i++) {
      try { await client.query(migrations[i]); console.log(`✓ ${i+1}/${migrations.length}`); }
      catch (e) { console.log(`⚠ ${i+1}: ${e.message}`); }
    }
    console.log("\n✅ Done!");
  } catch (e) { console.error("Connection failed:", e.message); }
  finally { await client.end(); }
}
run();
