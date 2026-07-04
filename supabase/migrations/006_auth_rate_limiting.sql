-- =============================================================================
-- Migration 006: Auth Rate Limiting
-- PilotForms™ SaaS Platform
-- REQ-1.3 (max 5 failed login attempts per 15-minute window)
--
-- Implements application-layer rate limiting for authentication actions:
--   • auth_rate_limits table  — stores per-identifier attempt records
--   • check_rate_limit()      — returns FALSE when limit is exceeded
--   • record_failed_attempt() — inserts a new attempt record on failure
--   • cleanup_old_rate_limits() — deletes records older than 1 hour (cron)
--
-- Called from Supabase Edge Functions that wrap the sign-in flow.
-- RLS ensures only the service role can read/write this table.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Table: auth_rate_limits
-- Tracks failed authentication attempts per identifier (email or IP address).
-- ---------------------------------------------------------------------------
CREATE TABLE public.auth_rate_limits (
  id            BIGSERIAL    PRIMARY KEY,
  identifier    TEXT         NOT NULL,           -- email address or IP
  action        TEXT         NOT NULL DEFAULT 'sign_in',
  attempted_at  TIMESTAMPTZ  NOT NULL DEFAULT now()
);

-- Index for fast per-identifier lookups within a time window
CREATE INDEX idx_auth_rate_limits_identifier
  ON public.auth_rate_limits (identifier, attempted_at DESC);

-- ---------------------------------------------------------------------------
-- RLS: restrict to service role only
-- Regular authenticated users (JWT-based) have no access.
-- Service role bypasses RLS by default in Supabase — these policies block
-- any JWT-authenticated request from reading or inserting rate limit data.
-- ---------------------------------------------------------------------------
ALTER TABLE public.auth_rate_limits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "rate_limits_deny_users_select" ON public.auth_rate_limits
  FOR SELECT USING (false);

CREATE POLICY "rate_limits_deny_users_insert" ON public.auth_rate_limits
  FOR INSERT WITH CHECK (false);

-- ---------------------------------------------------------------------------
-- Function: check_rate_limit(p_identifier TEXT) → BOOLEAN
-- Returns TRUE  — identifier is under the limit (allow the attempt)
-- Returns FALSE — identifier has ≥ 5 attempts in the last 15 minutes (block)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.check_rate_limit(p_identifier TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
DECLARE
  attempt_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO attempt_count
  FROM public.auth_rate_limits
  WHERE identifier    = p_identifier
    AND attempted_at  > NOW() - INTERVAL '15 minutes';

  RETURN attempt_count < 5;
END;
$$;

-- ---------------------------------------------------------------------------
-- Function: record_failed_attempt(p_identifier TEXT, p_action TEXT)
-- Inserts a failed-attempt record for the given identifier.
-- Called by the Edge Function after a failed sign-in.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.record_failed_attempt(
  p_identifier TEXT,
  p_action     TEXT DEFAULT 'sign_in'
)
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO public.auth_rate_limits (identifier, action)
  VALUES (p_identifier, p_action);
END;
$$;

-- ---------------------------------------------------------------------------
-- Function: cleanup_old_rate_limits()
-- Deletes attempt records older than 1 hour.
-- Intended to be called by a pg_cron job or Supabase cron Edge Function
-- (e.g., every 30 minutes) to keep the table small.
--
-- Example pg_cron schedule (run in the Supabase dashboard SQL editor):
--   SELECT cron.schedule('cleanup-rate-limits', '*/30 * * * *',
--     $$SELECT public.cleanup_old_rate_limits()$$);
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.cleanup_old_rate_limits()
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM public.auth_rate_limits
  WHERE attempted_at < NOW() - INTERVAL '1 hour';

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;
