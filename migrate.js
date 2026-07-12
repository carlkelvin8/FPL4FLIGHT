const { Client } = require("pg");

const client = new Client({
  host: "aws-0-ap-southeast-2.pooler.supabase.com",
  port: 6543,
  user: "postgres.tgzdztunswklbzbvbuxg",
  password: "Carlpogi@1029",
  database: "postgres",
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
  `INSERT INTO form_templates (slug,name,description,version,schema,is_active) VALUES ('pnp-arrival','Arrival Flight Inspection','PNP Aviation Security Checklist',1,'{"sections":[{"title":"Aircraft","fields":[{"id":"q1","label":"1. Visually inspected interiors","type":"select","options":["COMPLIED","NOT COMPLIED"],"required":true},{"id":"q1r","label":"Remarks","type":"textarea"},{"id":"q2","label":"2. Check hazardous/prohibited items","type":"select","options":["COMPLIED","NOT COMPLIED"],"required":true},{"id":"q2r","label":"Remarks","type":"textarea"},{"id":"q3","label":"3. Check cargo bay before inspection","type":"select","options":["COMPLIED","NOT COMPLIED"],"required":true},{"id":"q3r","label":"Remarks","type":"textarea"}]},{"title":"Baggage/Cargo","fields":[{"id":"q4","label":"4. Monitor disembarkation","type":"select","options":["COMPLIED","NOT COMPLIED"],"required":true},{"id":"q4r","label":"Remarks","type":"textarea"},{"id":"q5","label":"5. Isolate suspected baggage","type":"select","options":["COMPLIED","NOT COMPLIED"],"required":true},{"id":"q5r","label":"Remarks","type":"textarea"},{"id":"q6","label":"6. Action on discrepancies","type":"select","options":["COMPLIED","NOT COMPLIED"],"required":true},{"id":"q6r","label":"Remarks","type":"textarea"}]},{"title":"Crew & Passengers","fields":[{"id":"q7","label":"1. Positive ID during boarding","type":"select","options":["COMPLIED","NOT COMPLIED"],"required":true},{"id":"q7r","label":"Remarks","type":"textarea"},{"id":"q8","label":"2. Profiling","type":"select","options":["COMPLIED","NOT COMPLIED"],"required":true},{"id":"q8r","label":"Remarks","type":"textarea"},{"id":"q9","label":"3. Action on documents","type":"select","options":["COMPLIED","NOT COMPLIED"],"required":true},{"id":"q9r","label":"Remarks","type":"textarea"}]},{"title":"Flight Details","fields":[{"id":"ac_id","label":"Aircraft Identification","type":"text","required":true},{"id":"date_time","label":"Date/Time","type":"text","required":true},{"id":"ac_type","label":"Type of Aircraft","type":"text","required":true},{"id":"itinerary","label":"Itinerary","type":"text","required":true},{"id":"pax","label":"Passengers & Nationality","type":"textarea","required":true},{"id":"pilot","label":"Pilot & Nationality","type":"text","required":true},{"id":"duty","label":"Duty Ramp/Gen Av","type":"text","required":true}]}]}',true) ON CONFLICT DO NOTHING;`,
  `INSERT INTO form_templates (slug,name,description,version,schema,is_active) VALUES ('pnp-preflight','Pre-Flight Inspection','PNP Aviation Security Checklist',1,'{"sections":[{"title":"Aircraft","fields":[{"id":"q1","label":"1. Visually inspected interiors","type":"select","options":["COMPLIED","NOT COMPLIED"],"required":true},{"id":"q1r","label":"Remarks","type":"textarea"},{"id":"q2","label":"2. Check hazardous/prohibited items","type":"select","options":["COMPLIED","NOT COMPLIED"],"required":true},{"id":"q2r","label":"Remarks","type":"textarea"},{"id":"q3","label":"3. Check cargo bay before loading","type":"select","options":["COMPLIED","NOT COMPLIED"],"required":true},{"id":"q3r","label":"Remarks","type":"textarea"}]},{"title":"Baggage/Cargo","fields":[{"id":"q4","label":"4. Monitor baggage and cargo","type":"select","options":["COMPLIED","NOT COMPLIED"],"required":true},{"id":"q4r","label":"Remarks","type":"textarea"},{"id":"q5","label":"5. Isolate suspected items","type":"select","options":["COMPLIED","NOT COMPLIED"],"required":true},{"id":"q5r","label":"Remarks","type":"textarea"},{"id":"q6","label":"6. Action on discrepancies","type":"select","options":["COMPLIED","NOT COMPLIED"],"required":true},{"id":"q6r","label":"Remarks","type":"textarea"}]},{"title":"Crew & Passengers","fields":[{"id":"q7","label":"7. Positive ID during boarding","type":"select","options":["COMPLIED","NOT COMPLIED"],"required":true},{"id":"q7r","label":"Remarks","type":"textarea"},{"id":"q8","label":"8. Profiling","type":"select","options":["COMPLIED","NOT COMPLIED"],"required":true},{"id":"q8r","label":"Remarks","type":"textarea"},{"id":"q9","label":"9. Action on documents","type":"select","options":["COMPLIED","NOT COMPLIED"],"required":true},{"id":"q9r","label":"Remarks","type":"textarea"}]},{"title":"Flight Details","fields":[{"id":"ac_id","label":"Aircraft Identification","type":"text","required":true},{"id":"date_time","label":"Date/Time","type":"text","required":true},{"id":"ac_type","label":"Type of Aircraft","type":"text","required":true},{"id":"itinerary","label":"Itinerary","type":"text","required":true},{"id":"pax","label":"Passengers & Nationality","type":"textarea","required":true},{"id":"pilot","label":"Pilot & Nationality","type":"text","required":true},{"id":"duty","label":"Duty Ramp/Gen Av","type":"text","required":true}]}]}',true) ON CONFLICT DO NOTHING;`,
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
  `NOTIFY pgrst, 'reload schema';`,
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
