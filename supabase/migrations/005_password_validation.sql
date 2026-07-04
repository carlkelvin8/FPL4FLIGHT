-- =============================================================================
-- Migration 005: Password Complexity Validation
-- PilotForms™ SaaS Platform
-- REQ-1.2 (password complexity requirements)
--
-- Provides a server-side Postgres function for password complexity validation.
--
-- Enforcement strategy (layered):
--   Primary  — application layer (mobile app + admin dashboard) enforces rules
--              using Zod schemas BEFORE the password is sent to Supabase Auth.
--   Secondary — this Postgres function is available for double-validation in
--               Supabase Edge Functions (e.g., a custom /register endpoint)
--               that call it via `SELECT public.check_password_complexity($1)`.
--
-- Password rules (REQ-1.2):
--   • Minimum 8 characters
--   • At least one uppercase letter  [A-Z]
--   • At least one lowercase letter  [a-z]
--   • At least one digit             [0-9]
--   • At least one special character [^a-zA-Z0-9]
-- =============================================================================

CREATE OR REPLACE FUNCTION public.check_password_complexity(password TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
BEGIN
  -- Minimum 8 characters
  IF length(password) < 8 THEN
    RETURN FALSE;
  END IF;

  -- At least one uppercase letter
  IF password !~ '[A-Z]' THEN
    RETURN FALSE;
  END IF;

  -- At least one lowercase letter
  IF password !~ '[a-z]' THEN
    RETURN FALSE;
  END IF;

  -- At least one digit
  IF password !~ '[0-9]' THEN
    RETURN FALSE;
  END IF;

  -- At least one special character (any character that is not alphanumeric)
  IF password !~ '[^a-zA-Z0-9]' THEN
    RETURN FALSE;
  END IF;

  RETURN TRUE;
END;
$$;

-- ---------------------------------------------------------------------------
-- Usage from an Edge Function:
--
--   const { data, error } = await supabase.rpc('check_password_complexity', {
--     password: candidatePassword,
--   });
--   if (!data) throw new Error('Password does not meet complexity requirements');
--
-- The Zod schema enforced in the mobile app (apps/mobile) and admin dashboard
-- (apps/admin) mirrors these exact rules so errors are surfaced to the user
-- before the network call is made.
-- ---------------------------------------------------------------------------
