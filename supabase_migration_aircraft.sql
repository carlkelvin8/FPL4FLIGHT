-- Create aircraft table for storing registered aircraft per user
CREATE TABLE IF NOT EXISTS aircraft (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  aircraft_id TEXT NOT NULL,
  type_of_aircraft TEXT NOT NULL DEFAULT '',
  wake_turbulence_category TEXT NOT NULL DEFAULT 'L',
  equipment TEXT NOT NULL DEFAULT '',
  surveillance TEXT NOT NULL DEFAULT '',
  emergency_radio JSONB NOT NULL DEFAULT '{"uhf": false, "vhf": false, "elt": false}',
  survival_equipment JSONB NOT NULL DEFAULT '{"polar": false, "maritime": false, "desert": false, "jungle": false}',
  jackets JSONB NOT NULL DEFAULT '{"light": false, "fluores": false, "uhf": false, "vhf": false}',
  dinghies JSONB NOT NULL DEFAULT '{"dinghies": false, "cover": false}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE aircraft ENABLE ROW LEVEL SECURITY;

-- Users can only see their own aircraft
CREATE POLICY "Users can view own aircraft" ON aircraft
  FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own aircraft
CREATE POLICY "Users can insert own aircraft" ON aircraft
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own aircraft
CREATE POLICY "Users can update own aircraft" ON aircraft
  FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own aircraft
CREATE POLICY "Users can delete own aircraft" ON aircraft
  FOR DELETE USING (auth.uid() = user_id);

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_aircraft_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER aircraft_updated_at
  BEFORE UPDATE ON aircraft
  FOR EACH ROW
  EXECUTE FUNCTION update_aircraft_updated_at();
