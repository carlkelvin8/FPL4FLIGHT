-- =============================================================================
-- Migration 001: Initial Schema
-- PilotForms™ SaaS Platform
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Extensions
-- ---------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";   -- trigram full-text search
CREATE EXTENSION IF NOT EXISTS "btree_gin"; -- GIN indexes on scalar types

-- ---------------------------------------------------------------------------
-- public.profiles  (extends auth.users)
-- A trigger in migration 006_auth_triggers.sql creates this row automatically
-- on auth.users INSERT.
-- ---------------------------------------------------------------------------
CREATE TABLE public.profiles (
  id          UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name   TEXT        NOT NULL DEFAULT '',
  role        TEXT        NOT NULL DEFAULT 'pilot'
                          CHECK (role IN ('pilot', 'admin')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- public.pilot_profiles  (one-to-one extension of profiles)
-- ---------------------------------------------------------------------------
CREATE TABLE public.pilot_profiles (
  id                 UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id            UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  license_number     TEXT,
  license_type       TEXT,
  license_expiry     DATE,
  certificate_number TEXT,
  ratings            TEXT[]      DEFAULT '{}',
  endorsements       TEXT[]      DEFAULT '{}',
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id)
);

-- ---------------------------------------------------------------------------
-- public.aircraft
-- ---------------------------------------------------------------------------
CREATE TABLE public.aircraft (
  id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  registration_number TEXT        NOT NULL,
  make                TEXT        NOT NULL,
  model               TEXT        NOT NULL,
  year                INTEGER,
  aircraft_type       TEXT,
  engine_type         TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (registration_number)
);

-- ---------------------------------------------------------------------------
-- public.subscriptions
-- ---------------------------------------------------------------------------
CREATE TABLE public.subscriptions (
  id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status              TEXT        NOT NULL
                                  CHECK (status IN ('trialing', 'active', 'past_due', 'canceled', 'expired')),
  plan                TEXT        NOT NULL
                                  CHECK (plan IN ('monthly', 'annual')),
  trial_ends_at       TIMESTAMPTZ,
  current_period_end  TIMESTAMPTZ NOT NULL,
  external_id         TEXT,       -- App Store / Play Store transaction ID
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- public.payments
-- ---------------------------------------------------------------------------
CREATE TABLE public.payments (
  id                     UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id        UUID          NOT NULL REFERENCES public.subscriptions(id) ON DELETE CASCADE,
  user_id                UUID          NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount                 NUMERIC(10,2) NOT NULL,
  currency               TEXT          NOT NULL DEFAULT 'USD',
  status                 TEXT          NOT NULL
                                       CHECK (status IN ('pending', 'succeeded', 'failed', 'refunded')),
  platform_transaction_id TEXT,
  paid_at                TIMESTAMPTZ,
  created_at             TIMESTAMPTZ   NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- public.form_templates
-- ---------------------------------------------------------------------------
CREATE TABLE public.form_templates (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  slug        TEXT        NOT NULL UNIQUE,
  name        TEXT        NOT NULL,
  description TEXT,
  version     INTEGER     NOT NULL DEFAULT 1,
  schema      JSONB       NOT NULL,         -- JSON form definition
  is_active   BOOLEAN     NOT NULL DEFAULT true,
  deprecated  BOOLEAN     NOT NULL DEFAULT false,
  created_by  UUID        REFERENCES public.profiles(id),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- public.form_instances
-- ---------------------------------------------------------------------------
CREATE TABLE public.form_instances (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  template_id      UUID        NOT NULL REFERENCES public.form_templates(id),
  template_version INTEGER     NOT NULL,
  status           TEXT        NOT NULL DEFAULT 'draft'
                               CHECK (status IN ('draft', 'completed', 'synced')),
  data             JSONB       NOT NULL DEFAULT '{}',
  device_id        TEXT,
  submitted_at     TIMESTAMPTZ,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- public.signatures
-- ---------------------------------------------------------------------------
CREATE TABLE public.signatures (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  form_instance_id UUID        NOT NULL REFERENCES public.form_instances(id) ON DELETE CASCADE,
  field_id         TEXT        NOT NULL,
  storage_path     TEXT        NOT NULL,    -- Supabase Storage path
  captured_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  user_id          UUID        NOT NULL REFERENCES public.profiles(id)
);

-- ---------------------------------------------------------------------------
-- public.attachments  (photo attachments)
-- ---------------------------------------------------------------------------
CREATE TABLE public.attachments (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  form_instance_id UUID        NOT NULL REFERENCES public.form_instances(id) ON DELETE CASCADE,
  field_id         TEXT        NOT NULL,
  storage_path     TEXT        NOT NULL,
  file_size_bytes  INTEGER,
  mime_type        TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- public.sync_tokens  (per-device sync state)
-- ---------------------------------------------------------------------------
CREATE TABLE public.sync_tokens (
  id        UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id   UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  device_id TEXT        NOT NULL,
  last_sync TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, device_id)
);

-- ---------------------------------------------------------------------------
-- public.sync_state  (extended sync tracking)
-- ---------------------------------------------------------------------------
CREATE TABLE public.sync_state (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  device_id      TEXT        NOT NULL,
  sync_token     TEXT,
  last_synced_at TIMESTAMPTZ,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, device_id)
);

-- ---------------------------------------------------------------------------
-- public.audit_logs  (append-only, BIGSERIAL PK for cheap ordering)
-- No UPDATE or DELETE policies — enforces immutability (REQ-17)
-- ---------------------------------------------------------------------------
CREATE TABLE public.audit_logs (
  id          BIGSERIAL   PRIMARY KEY,
  user_id     UUID        REFERENCES public.profiles(id),
  action      TEXT        NOT NULL,
  resource    TEXT        NOT NULL,
  resource_id TEXT,
  old_value   JSONB,
  new_value   JSONB,
  ip_address  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- public.notifications
-- ---------------------------------------------------------------------------
CREATE TABLE public.notifications (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type        TEXT        NOT NULL,
  title       TEXT        NOT NULL,
  body        TEXT        NOT NULL,
  read        BOOLEAN     NOT NULL DEFAULT false,
  delivered   BOOLEAN     NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- public.device_tokens  (push notification tokens, Task 22)
-- ---------------------------------------------------------------------------
CREATE TABLE public.device_tokens (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  device_id   TEXT        NOT NULL,
  platform    TEXT        NOT NULL CHECK (platform IN ('ios', 'android')),
  token       TEXT        NOT NULL,
  last_seen   TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, device_id)
);

-- ---------------------------------------------------------------------------
-- updated_at trigger function (reusable)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Attach trigger to every table that has updated_at
CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_pilot_profiles_updated_at
  BEFORE UPDATE ON public.pilot_profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_aircraft_updated_at
  BEFORE UPDATE ON public.aircraft
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_subscriptions_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_form_templates_updated_at
  BEFORE UPDATE ON public.form_templates
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_form_instances_updated_at
  BEFORE UPDATE ON public.form_instances
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_sync_state_updated_at
  BEFORE UPDATE ON public.sync_state
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
