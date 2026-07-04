-- =============================================================================
-- Migration 008: Audit Logging Triggers
-- PilotForms™ SaaS Platform
-- REQ-17 (append-only audit trail), REQ-17.1 (record every mutation)
--
-- Adds a generic audit log function and attaches it to every table that
-- holds sensitive or compliance-relevant data:
--   • public.form_templates   — template create/update/delete
--   • public.form_instances   — form submit/edit/delete
--   • public.subscriptions    — subscription state changes
--
-- The audit_logs table was created in 001_initial_schema.sql.
-- RLS policies making it append-only (no UPDATE/DELETE) were applied in
-- 002_rls_policies.sql.
--
-- auth.uid() is called inside the trigger function. For mutations triggered
-- by the service role (e.g., subscription webhooks) auth.uid() returns NULL,
-- which is recorded as-is so the log is still complete.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Generic audit log function
-- Captures OLD and NEW row values for INSERT / UPDATE / DELETE operations.
-- SECURITY DEFINER so the function can always write to audit_logs regardless
-- of the calling role's direct table permissions.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.audit_log_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.audit_logs (user_id, action, resource, resource_id, new_value)
    VALUES (
      auth.uid(),
      'INSERT',
      TG_TABLE_NAME,
      NEW.id::TEXT,
      to_jsonb(NEW)
    );

  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO public.audit_logs (user_id, action, resource, resource_id, old_value, new_value)
    VALUES (
      auth.uid(),
      'UPDATE',
      TG_TABLE_NAME,
      NEW.id::TEXT,
      to_jsonb(OLD),
      to_jsonb(NEW)
    );

  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO public.audit_logs (user_id, action, resource, resource_id, old_value)
    VALUES (
      auth.uid(),
      'DELETE',
      TG_TABLE_NAME,
      OLD.id::TEXT,
      to_jsonb(OLD)
    );
  END IF;

  -- Return NEW for INSERT/UPDATE, OLD for DELETE (required by Postgres)
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- ---------------------------------------------------------------------------
-- Attach audit trigger to: public.form_templates
-- Audits template creation, edits, versioning, and deprecation (REQ-17.1)
-- ---------------------------------------------------------------------------
CREATE TRIGGER audit_form_templates
  AFTER INSERT OR UPDATE OR DELETE ON public.form_templates
  FOR EACH ROW EXECUTE FUNCTION public.audit_log_changes();

-- ---------------------------------------------------------------------------
-- Attach audit trigger to: public.form_instances
-- Audits every form draft save, completion, and sync event (REQ-17.1)
-- ---------------------------------------------------------------------------
CREATE TRIGGER audit_form_instances
  AFTER INSERT OR UPDATE OR DELETE ON public.form_instances
  FOR EACH ROW EXECUTE FUNCTION public.audit_log_changes();

-- ---------------------------------------------------------------------------
-- Attach audit trigger to: public.subscriptions
-- Audits trial starts, plan changes, cancellations, and payment failures
-- (REQ-17.1 + REQ-7)
-- ---------------------------------------------------------------------------
CREATE TRIGGER audit_subscriptions
  AFTER INSERT OR UPDATE OR DELETE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.audit_log_changes();
