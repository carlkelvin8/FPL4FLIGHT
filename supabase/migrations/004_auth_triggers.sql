-- =============================================================================
-- Migration 004: Auth Triggers
-- PilotForms™ SaaS Platform
-- REQ-1 (user registration flow), REQ-7 (14-day free trial on signup)
--
-- This migration wires up three database triggers:
--   1. on_auth_user_created  — auto-creates public.profiles on auth.users INSERT
--   2. trg_profiles_updated_at — already created in 001_initial_schema.sql (verified)
--   3. on_profile_created   — auto-creates a 14-day trialing subscription on
--                             public.profiles INSERT
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. handle_new_user()
--    Fires AFTER INSERT on auth.users.
--    Inserts a matching row into public.profiles, seeding full_name and role
--    from the raw_user_meta_data JSON that the client can pass at sign-up.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'pilot')
  );
  RETURN NEW;
END;
$$;

-- Attach to auth.users (runs with elevated privileges via SECURITY DEFINER)
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Note: profiles.updated_at sync is handled by the generic trigger
-- trg_profiles_updated_at created in 001_initial_schema.sql, which calls
-- public.set_updated_at() BEFORE UPDATE on public.profiles.
-- No additional trigger is needed here.
-- ---------------------------------------------------------------------------

-- ---------------------------------------------------------------------------
-- 2. handle_new_subscription()
--    Fires AFTER INSERT on public.profiles.
--    Auto-enrolls every new user in a 14-day free trial (REQ-7.5).
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_subscription()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.subscriptions (user_id, status, plan, trial_ends_at, current_period_end)
  VALUES (
    NEW.id,
    'trialing',
    'monthly',
    NOW() + INTERVAL '14 days',
    NOW() + INTERVAL '14 days'
  );
  RETURN NEW;
END;
$$;

-- Attach to public.profiles — fires after handle_new_user() creates the profile
CREATE TRIGGER on_profile_created
  AFTER INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_subscription();
