-- =============================================================================
-- Migration 002: Row Level Security Policies
-- PilotForms™ SaaS Platform
-- REQ-5.7 (data isolation), REQ-8, REQ-17.3 (audit log immutability)
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Enable RLS on every table
-- ---------------------------------------------------------------------------
ALTER TABLE public.profiles        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pilot_profiles  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.aircraft        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.form_templates  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.form_instances  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.signatures      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attachments     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sync_tokens     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sync_state      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.device_tokens   ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- Helper: inline admin check (avoids recursive RLS on profiles)
-- ---------------------------------------------------------------------------
-- We read role directly from JWT claims set by the auth trigger so we don't
-- recurse into public.profiles inside a policy.

-- ---------------------------------------------------------------------------
-- profiles: owner read/update only
-- ---------------------------------------------------------------------------
CREATE POLICY "profiles_owner_select" ON public.profiles
  FOR SELECT USING (id = auth.uid());

CREATE POLICY "profiles_owner_update" ON public.profiles
  FOR UPDATE USING (id = auth.uid());

-- Admin can read all profiles
CREATE POLICY "profiles_admin_select" ON public.profiles
  FOR SELECT USING (auth.jwt() ->> 'role' = 'admin');

-- ---------------------------------------------------------------------------
-- pilot_profiles: owner only
-- ---------------------------------------------------------------------------
CREATE POLICY "pilot_profiles_owner" ON public.pilot_profiles
  FOR ALL USING (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- aircraft: owner only
-- ---------------------------------------------------------------------------
CREATE POLICY "aircraft_owner" ON public.aircraft
  FOR ALL USING (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- subscriptions: owner read + admin full access (REQ-7)
-- ---------------------------------------------------------------------------
CREATE POLICY "subscriptions_owner_select" ON public.subscriptions
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "subscriptions_admin_all" ON public.subscriptions
  FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- Service role handles inserts/updates from webhook (no policy needed for
-- service_role because it bypasses RLS by default in Supabase).

-- ---------------------------------------------------------------------------
-- payments: owner read, admin full access
-- ---------------------------------------------------------------------------
CREATE POLICY "payments_owner_select" ON public.payments
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "payments_admin_all" ON public.payments
  FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- ---------------------------------------------------------------------------
-- form_templates: authenticated users read; admins write (REQ-3)
-- ---------------------------------------------------------------------------
CREATE POLICY "templates_read" ON public.form_templates
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "templates_admin_write" ON public.form_templates
  FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- ---------------------------------------------------------------------------
-- form_instances: owner all + admin read (REQ-5.7)
-- ---------------------------------------------------------------------------
CREATE POLICY "form_instances_owner" ON public.form_instances
  FOR ALL USING (user_id = auth.uid());

CREATE POLICY "form_instances_admin_read" ON public.form_instances
  FOR SELECT USING (auth.jwt() ->> 'role' = 'admin');

-- ---------------------------------------------------------------------------
-- signatures: owner of the parent form instance
-- ---------------------------------------------------------------------------
CREATE POLICY "signatures_owner" ON public.signatures
  FOR ALL USING (user_id = auth.uid());

CREATE POLICY "signatures_admin_read" ON public.signatures
  FOR SELECT USING (auth.jwt() ->> 'role' = 'admin');

-- ---------------------------------------------------------------------------
-- attachments: owner via form_instance join
-- ---------------------------------------------------------------------------
CREATE POLICY "attachments_owner" ON public.attachments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.form_instances fi
      WHERE fi.id = form_instance_id
        AND fi.user_id = auth.uid()
    )
  );

CREATE POLICY "attachments_admin_read" ON public.attachments
  FOR SELECT USING (auth.jwt() ->> 'role' = 'admin');

-- ---------------------------------------------------------------------------
-- sync_tokens: owner only
-- ---------------------------------------------------------------------------
CREATE POLICY "sync_tokens_owner" ON public.sync_tokens
  FOR ALL USING (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- sync_state: owner only
-- ---------------------------------------------------------------------------
CREATE POLICY "sync_state_owner" ON public.sync_state
  FOR ALL USING (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- audit_logs: admin SELECT only — no UPDATE/DELETE (append-only REQ-17.3)
-- Inserts are performed exclusively by the service role via Edge Functions /
-- database triggers, which bypass RLS. Authenticated users have no access.
-- ---------------------------------------------------------------------------
CREATE POLICY "audit_logs_admin_select" ON public.audit_logs
  FOR SELECT USING (auth.jwt() ->> 'role' = 'admin');

-- Explicitly deny INSERT for regular authenticated users.
-- (Service role bypasses RLS; this blocks any JWT-authenticated attempt.)
CREATE POLICY "audit_logs_deny_user_insert" ON public.audit_logs
  FOR INSERT WITH CHECK (false);

-- ---------------------------------------------------------------------------
-- notifications: owner only
-- ---------------------------------------------------------------------------
CREATE POLICY "notifications_owner" ON public.notifications
  FOR ALL USING (user_id = auth.uid());

CREATE POLICY "notifications_admin_read" ON public.notifications
  FOR SELECT USING (auth.jwt() ->> 'role' = 'admin');

-- ---------------------------------------------------------------------------
-- device_tokens: owner only
-- ---------------------------------------------------------------------------
CREATE POLICY "device_tokens_owner" ON public.device_tokens
  FOR ALL USING (user_id = auth.uid());

CREATE POLICY "device_tokens_admin_read" ON public.device_tokens
  FOR SELECT USING (auth.jwt() ->> 'role' = 'admin');
