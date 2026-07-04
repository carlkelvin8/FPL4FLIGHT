-- =============================================================================
-- Seed Data: Development Environment
-- PilotForms™ SaaS Platform
--
-- Usage:  supabase db reset   (runs all migrations then this file)
--
-- Creates:
--   • 1 admin user  (admin@pilotforms.dev / Admin1234!)
--   • 1 sample pilot user  (pilot@pilotforms.dev / Pilot1234!)
--   • 3 aviation form templates: preflight checklist, flight log, weight & balance
--   • Active subscriptions for both seed users
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Seed users in auth.users (Supabase's internal table)
-- We use gen_random_uuid() so IDs are stable-ish across resets when the
-- function call order is the same; for truly stable IDs pin them explicitly.
-- ---------------------------------------------------------------------------

-- Admin user
INSERT INTO auth.users (
  id,
  instance_id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at
) VALUES (
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000000',
  'authenticated',
  'authenticated',
  'admin@pilotforms.dev',
  -- bcrypt hash of 'Admin1234!'
  crypt('Admin1234!', gen_salt('bf', 12)),
  now(),
  '{"provider": "email", "providers": ["email"]}',
  '{"full_name": "Platform Admin"}',
  now(),
  now()
) ON CONFLICT (id) DO NOTHING;

-- Pilot user
INSERT INTO auth.users (
  id,
  instance_id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at
) VALUES (
  '00000000-0000-0000-0000-000000000002',
  '00000000-0000-0000-0000-000000000000',
  'authenticated',
  'authenticated',
  'pilot@pilotforms.dev',
  crypt('Pilot1234!', gen_salt('bf', 12)),
  now(),
  '{"provider": "email", "providers": ["email"]}',
  '{"full_name": "Jane Aviator"}',
  now(),
  now()
) ON CONFLICT (id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- Profiles (normally created by the auth trigger; seed them directly)
-- ---------------------------------------------------------------------------
INSERT INTO public.profiles (id, full_name, role, created_at, updated_at) VALUES
  ('00000000-0000-0000-0000-000000000001', 'Platform Admin', 'admin', now(), now()),
  ('00000000-0000-0000-0000-000000000002', 'Jane Aviator',   'pilot', now(), now())
ON CONFLICT (id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- Pilot profile for the sample pilot
-- ---------------------------------------------------------------------------
INSERT INTO public.pilot_profiles (
  user_id,
  license_number,
  license_type,
  license_expiry,
  certificate_number,
  ratings,
  endorsements
) VALUES (
  '00000000-0000-0000-0000-000000000002',
  'P-123456',
  'Commercial Pilot License',
  '2027-12-31',
  'CPL-78910',
  ARRAY['Instrument Rating', 'Multi-Engine'],
  ARRAY['High Performance', 'Complex Aircraft']
) ON CONFLICT (user_id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- Form Templates
-- ---------------------------------------------------------------------------

-- 1. Preflight Inspection Checklist
INSERT INTO public.form_templates (
  id,
  slug,
  name,
  description,
  version,
  schema,
  is_active,
  deprecated,
  created_by,
  created_at,
  updated_at
) VALUES (
  '10000000-0000-0000-0000-000000000001',
  'preflight-inspection-checklist',
  'Preflight Inspection Checklist',
  'Standard preflight inspection checklist for general aviation single-engine aircraft.',
  1,
  '{
    "sections": [
      {
        "id": "documentation",
        "title": "Documentation",
        "fields": [
          {
            "id": "registration_valid",
            "type": "checkbox",
            "label": "Aircraft registration is current and onboard",
            "required": true
          },
          {
            "id": "airworthiness_cert",
            "type": "checkbox",
            "label": "Airworthiness certificate is displayed",
            "required": true
          },
          {
            "id": "weight_balance_data",
            "type": "checkbox",
            "label": "Weight and balance data is current",
            "required": true
          },
          {
            "id": "pilot_certificate",
            "type": "checkbox",
            "label": "Pilot certificate and medical certificate available",
            "required": true
          }
        ]
      },
      {
        "id": "exterior",
        "title": "Exterior Inspection",
        "fields": [
          {
            "id": "aircraft_registration",
            "type": "text",
            "label": "Aircraft Registration N-Number",
            "required": true,
            "maxLength": 10,
            "placeholder": "e.g. N12345"
          },
          {
            "id": "fuel_level",
            "type": "dropdown",
            "label": "Fuel Level",
            "required": true,
            "options": ["Full", "3/4", "1/2", "1/4", "Low"]
          },
          {
            "id": "oil_level",
            "type": "numeric",
            "label": "Oil Level (quarts)",
            "required": true,
            "min": 4,
            "max": 8,
            "unit": "qt"
          },
          {
            "id": "tires_condition",
            "type": "dropdown",
            "label": "Tires Condition",
            "required": true,
            "options": ["Good", "Worn", "Flat", "Requires Maintenance"]
          },
          {
            "id": "damage_noted",
            "type": "checkbox",
            "label": "No visible damage or anomalies found",
            "required": true
          },
          {
            "id": "damage_notes",
            "type": "text",
            "label": "Damage / Anomaly Notes",
            "required": false,
            "maxLength": 500,
            "conditional": {
              "fieldId": "damage_noted",
              "operator": "equals",
              "value": false
            }
          }
        ]
      },
      {
        "id": "sign_off",
        "title": "Sign-Off",
        "fields": [
          {
            "id": "inspection_date",
            "type": "date",
            "label": "Inspection Date",
            "required": true
          },
          {
            "id": "pilot_signature",
            "type": "signature",
            "label": "Pilot Signature",
            "required": true
          }
        ]
      }
    ],
    "metadata": {
      "formType": "preflight",
      "regulatoryBasis": "14 CFR Part 91",
      "estimatedMinutes": 15
    }
  }'::jsonb,
  true,
  false,
  '00000000-0000-0000-0000-000000000001',
  now(),
  now()
) ON CONFLICT (id) DO NOTHING;


-- 2. Flight Log
INSERT INTO public.form_templates (
  id,
  slug,
  name,
  description,
  version,
  schema,
  is_active,
  deprecated,
  created_by,
  created_at,
  updated_at
) VALUES (
  '10000000-0000-0000-0000-000000000002',
  'flight-log',
  'Flight Log Entry',
  'Digital pilot logbook entry capturing flight details, conditions, and hours for regulatory compliance.',
  1,
  '{
    "sections": [
      {
        "id": "flight_details",
        "title": "Flight Details",
        "fields": [
          {
            "id": "flight_date",
            "type": "date",
            "label": "Date of Flight",
            "required": true
          },
          {
            "id": "aircraft_registration",
            "type": "text",
            "label": "Aircraft Registration",
            "required": true,
            "maxLength": 10
          },
          {
            "id": "aircraft_make_model",
            "type": "text",
            "label": "Aircraft Make & Model",
            "required": true,
            "maxLength": 50
          },
          {
            "id": "departure_airport",
            "type": "text",
            "label": "Departure Airport (ICAO)",
            "required": true,
            "maxLength": 4,
            "placeholder": "e.g. KLAX"
          },
          {
            "id": "arrival_airport",
            "type": "text",
            "label": "Arrival Airport (ICAO)",
            "required": true,
            "maxLength": 4,
            "placeholder": "e.g. KSFO"
          },
          {
            "id": "route",
            "type": "text",
            "label": "Route of Flight",
            "required": false,
            "maxLength": 200
          }
        ]
      },
      {
        "id": "times",
        "title": "Times",
        "fields": [
          {
            "id": "off_block_time",
            "type": "time",
            "label": "Off-Block Time (UTC)",
            "required": true
          },
          {
            "id": "airborne_time",
            "type": "time",
            "label": "Wheels Up Time (UTC)",
            "required": true
          },
          {
            "id": "landing_time",
            "type": "time",
            "label": "Wheels Down Time (UTC)",
            "required": true
          },
          {
            "id": "on_block_time",
            "type": "time",
            "label": "On-Block Time (UTC)",
            "required": true
          },
          {
            "id": "total_flight_hours",
            "type": "numeric",
            "label": "Total Flight Time (hours)",
            "required": true,
            "min": 0,
            "max": 24,
            "unit": "h"
          },
          {
            "id": "night_hours",
            "type": "numeric",
            "label": "Night Hours",
            "required": false,
            "min": 0,
            "max": 24,
            "unit": "h"
          },
          {
            "id": "instrument_hours",
            "type": "numeric",
            "label": "Instrument Hours",
            "required": false,
            "min": 0,
            "max": 24,
            "unit": "h"
          },
          {
            "id": "landings_day",
            "type": "numeric",
            "label": "Day Landings",
            "required": true,
            "min": 0,
            "max": 999,
            "unit": ""
          },
          {
            "id": "landings_night",
            "type": "numeric",
            "label": "Night Landings",
            "required": false,
            "min": 0,
            "max": 999,
            "unit": ""
          }
        ]
      },
      {
        "id": "conditions",
        "title": "Flight Conditions",
        "fields": [
          {
            "id": "flight_rules",
            "type": "dropdown",
            "label": "Flight Rules",
            "required": true,
            "options": ["VFR", "IFR", "SVFR"]
          },
          {
            "id": "flight_type",
            "type": "dropdown",
            "label": "Type of Operation",
            "required": true,
            "options": ["Solo", "Dual", "PIC", "SIC", "Student"]
          },
          {
            "id": "remarks",
            "type": "text",
            "label": "Remarks",
            "required": false,
            "maxLength": 500
          }
        ]
      },
      {
        "id": "sign_off",
        "title": "Sign-Off",
        "fields": [
          {
            "id": "pilot_signature",
            "type": "signature",
            "label": "Pilot in Command Signature",
            "required": true
          }
        ]
      }
    ],
    "metadata": {
      "formType": "flightLog",
      "regulatoryBasis": "14 CFR Part 61.51",
      "estimatedMinutes": 10
    }
  }'::jsonb,
  true,
  false,
  '00000000-0000-0000-0000-000000000001',
  now(),
  now()
) ON CONFLICT (id) DO NOTHING;


-- 3. Weight and Balance Worksheet
INSERT INTO public.form_templates (
  id,
  slug,
  name,
  description,
  version,
  schema,
  is_active,
  deprecated,
  created_by,
  created_at,
  updated_at
) VALUES (
  '10000000-0000-0000-0000-000000000003',
  'weight-and-balance',
  'Weight & Balance Worksheet',
  'Pre-flight weight and balance calculation worksheet for general aviation aircraft.',
  1,
  '{
    "sections": [
      {
        "id": "aircraft_info",
        "title": "Aircraft Information",
        "fields": [
          {
            "id": "aircraft_registration",
            "type": "text",
            "label": "Aircraft Registration",
            "required": true,
            "maxLength": 10
          },
          {
            "id": "aircraft_make_model",
            "type": "text",
            "label": "Make & Model",
            "required": true,
            "maxLength": 50
          },
          {
            "id": "calculation_date",
            "type": "date",
            "label": "Date",
            "required": true
          },
          {
            "id": "basic_empty_weight",
            "type": "numeric",
            "label": "Basic Empty Weight (lbs)",
            "required": true,
            "min": 0,
            "max": 99999,
            "unit": "lbs"
          },
          {
            "id": "basic_empty_arm",
            "type": "numeric",
            "label": "Basic Empty Arm (in)",
            "required": true,
            "min": 0,
            "max": 9999,
            "unit": "in"
          }
        ]
      },
      {
        "id": "loading",
        "title": "Loading",
        "fields": [
          {
            "id": "pilot_weight",
            "type": "numeric",
            "label": "Pilot Weight (lbs)",
            "required": true,
            "min": 0,
            "max": 500,
            "unit": "lbs"
          },
          {
            "id": "copilot_weight",
            "type": "numeric",
            "label": "Co-Pilot / Passenger (front) Weight (lbs)",
            "required": false,
            "min": 0,
            "max": 500,
            "unit": "lbs"
          },
          {
            "id": "rear_passenger_weight",
            "type": "numeric",
            "label": "Rear Passenger(s) Weight (lbs)",
            "required": false,
            "min": 0,
            "max": 999,
            "unit": "lbs"
          },
          {
            "id": "baggage_weight",
            "type": "numeric",
            "label": "Baggage Weight (lbs)",
            "required": false,
            "min": 0,
            "max": 999,
            "unit": "lbs"
          },
          {
            "id": "fuel_gallons",
            "type": "numeric",
            "label": "Usable Fuel (gallons)",
            "required": true,
            "min": 0,
            "max": 999,
            "unit": "gal"
          }
        ]
      },
      {
        "id": "results",
        "title": "Results",
        "fields": [
          {
            "id": "gross_weight",
            "type": "numeric",
            "label": "Calculated Gross Weight (lbs)",
            "required": true,
            "min": 0,
            "max": 99999,
            "unit": "lbs"
          },
          {
            "id": "cg_position",
            "type": "numeric",
            "label": "CG Position (in)",
            "required": true,
            "min": 0,
            "max": 9999,
            "unit": "in"
          },
          {
            "id": "within_limits",
            "type": "checkbox",
            "label": "Weight and CG are within aircraft limitations",
            "required": true
          },
          {
            "id": "wb_photo",
            "type": "photo",
            "label": "Weight & Balance Chart Photo (optional)",
            "required": false,
            "maxPhotos": 2
          }
        ]
      },
      {
        "id": "sign_off",
        "title": "Sign-Off",
        "fields": [
          {
            "id": "pilot_signature",
            "type": "signature",
            "label": "Pilot Signature",
            "required": true
          }
        ]
      }
    ],
    "metadata": {
      "formType": "weightAndBalance",
      "regulatoryBasis": "14 CFR Part 91.9",
      "estimatedMinutes": 20
    }
  }'::jsonb,
  true,
  false,
  '00000000-0000-0000-0000-000000000001',
  now(),
  now()
) ON CONFLICT (id) DO NOTHING;


-- ---------------------------------------------------------------------------
-- Subscriptions  (one per user)
-- ---------------------------------------------------------------------------

-- Admin: active annual subscription
INSERT INTO public.subscriptions (
  id,
  user_id,
  status,
  plan,
  trial_ends_at,
  current_period_end,
  external_id
) VALUES (
  '20000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000001',
  'active',
  'annual',
  null,
  now() + INTERVAL '1 year',
  'ADMIN_INTERNAL'
) ON CONFLICT (id) DO NOTHING;

-- Pilot: active 14-day trial
INSERT INTO public.subscriptions (
  id,
  user_id,
  status,
  plan,
  trial_ends_at,
  current_period_end,
  external_id
) VALUES (
  '20000000-0000-0000-0000-000000000002',
  '00000000-0000-0000-0000-000000000002',
  'trialing',
  'monthly',
  now() + INTERVAL '14 days',
  now() + INTERVAL '14 days',
  null
) ON CONFLICT (id) DO NOTHING;
