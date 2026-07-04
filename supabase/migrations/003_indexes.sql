-- =============================================================================
-- Migration 003: Performance Indexes
-- PilotForms™ SaaS Platform
-- REQ-12.4 (FTS), REQ-19.5 (query performance)
-- =============================================================================

-- ---------------------------------------------------------------------------
-- form_templates
-- ---------------------------------------------------------------------------
CREATE INDEX idx_form_templates_slug
  ON public.form_templates (slug);

-- Partial index — only active templates are queried by mobile clients
CREATE INDEX idx_form_templates_active
  ON public.form_templates (is_active)
  WHERE is_active = true;

CREATE INDEX idx_form_templates_category
  ON public.form_templates (deprecated, is_active);   -- common filter combo

-- ---------------------------------------------------------------------------
-- form_instances
-- ---------------------------------------------------------------------------
CREATE INDEX idx_form_instances_user
  ON public.form_instances (user_id);

CREATE INDEX idx_form_instances_template
  ON public.form_instances (template_id);

CREATE INDEX idx_form_instances_status
  ON public.form_instances (status);

-- Most recent submissions first — used by history list (REQ-5.3)
CREATE INDEX idx_form_instances_submitted
  ON public.form_instances (submitted_at DESC);

-- Composite: user + status — common mobile query pattern
CREATE INDEX idx_form_instances_user_status
  ON public.form_instances (user_id, status);

-- JSONB GIN index for arbitrary key lookups on form data (REQ-12)
CREATE INDEX idx_form_instances_data_gin
  ON public.form_instances USING GIN (data jsonb_path_ops);

-- Full-text search index on serialised form data (REQ-12.4)
CREATE INDEX idx_form_instances_fts
  ON public.form_instances USING GIN (to_tsvector('english', data::text));

-- ---------------------------------------------------------------------------
-- audit_logs
-- ---------------------------------------------------------------------------
CREATE INDEX idx_audit_logs_user
  ON public.audit_logs (user_id);

CREATE INDEX idx_audit_logs_resource
  ON public.audit_logs (resource, resource_id);

CREATE INDEX idx_audit_logs_created
  ON public.audit_logs (created_at DESC);

-- ---------------------------------------------------------------------------
-- subscriptions
-- ---------------------------------------------------------------------------
CREATE INDEX idx_subscriptions_user
  ON public.subscriptions (user_id);

CREATE INDEX idx_subscriptions_status
  ON public.subscriptions (status);

-- Expiry scan — used by the subscription expiry cron (REQ-7.7)
CREATE INDEX idx_subscriptions_period_end
  ON public.subscriptions (current_period_end);

-- ---------------------------------------------------------------------------
-- notifications
-- ---------------------------------------------------------------------------
CREATE INDEX idx_notifications_user_unread
  ON public.notifications (user_id, read)
  WHERE read = false;

-- ---------------------------------------------------------------------------
-- device_tokens
-- ---------------------------------------------------------------------------
CREATE INDEX idx_device_tokens_user
  ON public.device_tokens (user_id);

-- ---------------------------------------------------------------------------
-- sync_tokens / sync_state
-- ---------------------------------------------------------------------------
CREATE INDEX idx_sync_tokens_user_device
  ON public.sync_tokens (user_id, device_id);

CREATE INDEX idx_sync_state_user_device
  ON public.sync_state (user_id, device_id);

-- ---------------------------------------------------------------------------
-- attachments
-- ---------------------------------------------------------------------------
CREATE INDEX idx_attachments_form_instance
  ON public.attachments (form_instance_id);

-- ---------------------------------------------------------------------------
-- signatures
-- ---------------------------------------------------------------------------
CREATE INDEX idx_signatures_form_instance
  ON public.signatures (form_instance_id);

-- ---------------------------------------------------------------------------
-- pilot_profiles
-- ---------------------------------------------------------------------------
CREATE INDEX idx_pilot_profiles_user
  ON public.pilot_profiles (user_id);

-- ---------------------------------------------------------------------------
-- aircraft
-- ---------------------------------------------------------------------------
CREATE INDEX idx_aircraft_user
  ON public.aircraft (user_id);

CREATE INDEX idx_aircraft_registration
  ON public.aircraft (registration_number);
