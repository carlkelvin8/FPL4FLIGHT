-- =============================================================================
-- Migration 010: AIP Documents Storage Policies
-- FPL4FLIGHT SaaS Platform
--
-- The mobile AIP Reference screen reads PDFs from the `aip-docs` bucket.
-- This migration guarantees the bucket exists and adds Storage RLS policies:
--   - SELECT: any authenticated user may list/read documents (mobile app)
--   - ALL   : admins may list, upload, update, and DELETE documents (admin panel)
-- Deletes in the admin panel require the JWT `role` claim to be `admin`,
-- matching the table policies in migration 002.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Ensure the bucket exists (idempotent). Public read via object URLs.
-- 50 MB limit, PDF only.
-- ---------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'aip-docs',
  'aip-docs',
  true,
  52428800,
  ARRAY['application/pdf']::text[]
)
ON CONFLICT (id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- RLS is on by default for storage.objects; make it explicit.
-- ---------------------------------------------------------------------------
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- Authenticated users can list/read AIP documents (mobile app listing).
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "aip_docs_authenticated_select" ON storage.objects;
CREATE POLICY "aip_docs_authenticated_select" ON storage.objects
  FOR SELECT
  USING (bucket_id = 'aip-docs' AND auth.role() = 'authenticated');

-- ---------------------------------------------------------------------------
-- Admins get full control, including DELETE, for the AIP bucket.
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "aip_docs_admin_all" ON storage.objects;
CREATE POLICY "aip_docs_admin_all" ON storage.objects
  FOR ALL
  USING (bucket_id = 'aip-docs' AND auth.jwt() ->> 'role' = 'admin')
  WITH CHECK (bucket_id = 'aip-docs' AND auth.jwt() ->> 'role' = 'admin');
