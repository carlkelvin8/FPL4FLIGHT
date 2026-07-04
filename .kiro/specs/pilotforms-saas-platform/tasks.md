# Implementation Plan: PilotForms™ SaaS Platform

## Overview

36 tasks organized across 12 phases: Foundation → Auth → Offline/Sync → Templates → Forms → PDF → Subscriptions → Notifications → Admin Analytics/Audit → Security/Performance → Testing → Deployment. Complete phases in order; tasks within the same wave can run in parallel.

## Tasks

- [x] 1. Initialize Monorepo Structure
  - Initialize a Turborepo monorepo with `apps/mobile`, `apps/admin`, and `packages/shared` workspaces
  - Configure root `package.json` with shared scripts (`test`, `lint`, `build`, `typecheck`)
  - Add shared TypeScript config in `packages/shared/tsconfig.json` extended by each app
  - Configure ESLint + Prettier with shared rules across all workspaces
  - Add `.gitignore`, `README.md`, and root environment variable templates (`.env.example`)
  - _Satisfies: Design — Architecture Principles_

- [x] 2. Supabase Project Setup
  - Install Supabase CLI and initialize local dev environment (`supabase init`)
  - Create `supabase/migrations/001_initial_schema.sql` with all tables from the Data Models section
  - Create `supabase/migrations/002_rls_policies.sql` with all Row Level Security policies
  - Create `supabase/migrations/003_indexes.sql` with all performance indexes including FTS index
  - Add `supabase/seed.sql` with admin user and sample form templates for development
  - Document `supabase start` and `supabase db reset` in the project README
  - _Satisfies: REQ-5, REQ-7, REQ-8, REQ-17 | Design — Data Models_

- [x] 3. Shared TypeScript Domain Types Package
  - Create `packages/shared/src/entities/` with all TypeScript entity types from the Design (FormTemplate, FormInstance, Subscription, Session, AppError, etc.)
  - Create `packages/shared/src/types/result.ts` with the `Result<T>` discriminated union type
  - Create `packages/shared/src/types/dtos.ts` with `CreateFormDto`, `UpdateFormDto`, `SignInDto`, `FormFilters`, `PaginatedResult<T>`
  - Create `packages/shared/src/interfaces/` with all repository interfaces (`IFormRepository`, `IAuthRepository`, `ISyncEngine`, `IEncryptionService`, `IFormTemplateRepository`)
  - Export all types via `packages/shared/src/index.ts`
  - Write unit tests verifying entity types compile correctly and `Result<T>` narrows properly
  - _Satisfies: Design — Domain Layer, Key Interfaces_

- [x] 4. Mobile App Scaffold (React Native + Expo)
  - Bootstrap Expo project in `apps/mobile` using `npx create-expo-app` with TypeScript template
  - Install core dependencies: `@supabase/supabase-js`, `expo-sqlite`, `@tanstack/react-query`, `zustand`, `expo-secure-store`, `expo-file-system`, `react-native-gesture-handler`, `react-native-reanimated`
  - Create feature-based folder structure matching the Design module layout
  - Configure path aliases in `tsconfig.json` (`@features/*`, `@core/*`, `@shared/*`)
  - Set up Expo Router with `app/(auth)/` and `app/(app)/` route groups
  - Configure `app.config.ts` with environment variables via `expo-constants`
  - _Satisfies: Design — Mobile App Feature Module Structure_

- [x] 5. Admin Dashboard Scaffold (Next.js 14)
  - Bootstrap Next.js 14 project in `apps/admin` with App Router and TypeScript
  - Install dependencies: `@supabase/supabase-js`, `@supabase/ssr`, `@tanstack/react-query`, `zustand`, `tailwindcss`, `recharts`, `react-hook-form`, `zod`
  - Create folder structure: `app/(auth)/login`, `app/(dashboard)/`, `features/`, `lib/supabase/`
  - Create Supabase server client (`lib/supabase/server.ts`) and browser client (`lib/supabase/client.ts`) following the SSR pattern
  - Configure Tailwind CSS with custom color palette aligned to aviation/PilotForms branding
  - Configure `vercel.json` and environment variable setup for Vercel deployment
  - _Satisfies: Design — Admin Dashboard Module Structure_

- [x] 6. Supabase Auth Configuration
  - Write a Supabase database trigger to auto-create `public.profiles` row on `auth.users` insert
  - Add `check_password_complexity` Postgres function and enforce via application-layer validation
  - Configure rate limiting in Supabase Auth (max 5 failed attempts per 15-minute window)
  - Set JWT expiry to 30 days and configure refresh token rotation
  - _Satisfies: REQ-1_

- [x] 7. Mobile Auth Feature
  - Create `AuthRepository` implementing `IAuthRepository` using Supabase JS client
  - Implement `SignInUseCase`, `SignOutUseCase`, `RegisterUseCase`, `RefreshTokenUseCase` in `features/auth/usecases/`
  - Create Zustand `authStore` tracking `session`, `user`, `isLoading`, `error`
  - Build `LoginScreen` with email/password fields, validation, and error display
  - Build `RegisterScreen` with password strength indicator and confirmation field
  - Build `MFAScreen` for OTP code entry after initial sign-in
  - Store JWT and refresh token in `expo-secure-store` via `EncryptionService`
  - Implement session restoration on app launch (check SecureStore before showing login)
  - Write unit tests for all auth use cases covering success and error paths
  - _Satisfies: REQ-1, REQ-8 | Design — auth feature_

- [~] 8. Admin Dashboard Auth
  - Create Next.js middleware (`middleware.ts`) to protect all `/dashboard` routes, redirecting unauthenticated users to `/login`
  - Build `app/(auth)/login/page.tsx` with email/password form using `react-hook-form` + `zod`
  - Implement server action for sign-in that verifies `role = 'admin'` from JWT claims before allowing access
  - Create `useSession` hook for client components to read the current admin session
  - Add sign-out functionality in the dashboard header
  - _Satisfies: REQ-1 (admin path)_

- [~] 9. SQLite Offline Database (Mobile)
  - Create `core/database/schema.ts` defining all SQLite tables (`local_form_instances`, `local_form_templates`, `sync_queue`)
  - Implement `DatabaseMigrationService` to run schema migrations on app upgrade
  - Create `LocalFormRepository` implementing `IFormRepository` against SQLite for offline reads/writes
  - Create `LocalFormTemplateRepository` for caching templates in SQLite
  - Implement `EncryptionService` wrapping `expo-crypto` AES-256 to encrypt `data` field before SQLite writes
  - Write integration tests for all SQLite repository operations using an in-memory SQLite instance
  - _Satisfies: REQ-2, REQ-8 | Design — Mobile SQLite Schema, IEncryptionService_

- [~] 10. Sync Engine
  - Create `SyncEngine` class implementing `ISyncEngine` in `features/sync/SyncEngine.ts`
  - Implement `SyncQueue` that persists pending operations to the `sync_queue` SQLite table with retry count tracking
  - Implement network status detection using `@react-native-community/netinfo` to trigger automatic sync on reconnect
  - Implement upload logic: dequeue operations in FIFO order, POST to Supabase, mark as synced on 2xx
  - Implement exponential backoff retry (3 retries: 1s, 2s, 4s) for failed sync operations
  - Implement `ConflictResolver` using last-write-wins by `updated_at` timestamp; surface conflicts to user via notification when auto-resolution is not possible
  - Implement device sync token management (`sync_tokens` table) to enable delta sync
  - Implement full sync on first login or after 7+ days offline (download all user data)
  - Expose `syncStatus` observable from `SyncEngine` for UI sync indicator
  - Write unit tests for `ConflictResolver` covering all conflict scenarios
  - Write integration tests for `SyncEngine` using mock Supabase client — verify idempotence property
  - _Satisfies: REQ-2, REQ-16, REQ-20 | Design — ISyncEngine, Correctness Properties_

- [x] 11. Form Template JSON Schema and Parser
  - Define `FormSchema` JSON Schema spec (using JSON Schema Draft-07) in `packages/shared/src/form-schema/schema.json`
  - Implement `FormParser` in `packages/shared/src/form-schema/FormParser.ts` using `ajv` for JSON Schema validation
  - Implement `FormTemplateFormatter` serializing `FormTemplate` entities back to validated JSON
  - Validate uniqueness of field IDs within a template as part of `FormParser.parse()`
  - Return structured `ParseError` with field path and message on validation failure
  - Write property-based tests with `fast-check` verifying the round-trip property: `parse(format(t)) ≡ t`
  - Write unit tests for all supported field types and conditional rule syntax
  - _Satisfies: REQ-3, REQ-9 | Design — Correctness Properties_

- [x] 12. Form Template Management (Admin Dashboard)
  - Build `app/(dashboard)/forms/page.tsx` listing all templates with name, version, status, and last-updated date
  - Build visual form builder at `app/(dashboard)/forms/[id]/page.tsx` — drag-and-drop field ordering, field config panel
  - Implement `FormTemplateRepository` (admin) for CRUD operations against Supabase
  - On publish, call Supabase Edge Function `send-notification` to push template-updated notification to affected users
  - Display full version history for each template with diff view between versions
  - Implement "deprecate" action that sets `deprecated = true` without deleting (enforce REQ-18 backend guard)
  - Write API route tests for `/api/v1/forms` covering create, update, version, and deprecate
  - _Satisfies: REQ-3, REQ-18 | Design — Admin form-builder feature_

- [~] 13. Template Sync to Mobile
  - On mobile app launch and after auth, call Supabase to fetch templates updated since last sync token
  - Persist fetched templates to `local_form_templates` SQLite table via `LocalFormTemplateRepository`
  - Subscribe to Supabase Realtime `form_templates` table changes; trigger template download when INSERT or UPDATE detected
  - Show sync progress indicator during initial template download
  - Write integration test verifying templates sync within 10 seconds of publish
  - _Satisfies: REQ-3 (criteria 3, 5)_

- [~] 14. Form Field Components (Mobile)
  - Create base `FieldWrapper` component with label, required indicator, and error message display
  - Implement `TextField` component with platform-native keyboard and `maxLength` enforcement
  - Implement `NumericField` component with numeric keyboard and min/max range validation
  - Implement `DateField` and `TimeField` components using platform date/time pickers
  - Implement `DropdownField` component with searchable option list
  - Implement `CheckboxField` component
  - Implement `SignatureField` component using `react-native-signature-canvas` — capture to PNG at 300 DPI with transparent background; allow clear and re-capture
  - Implement `PhotoField` component with camera capture and gallery picker via `expo-image-picker`; compress to max 2 MB using `expo-image-manipulator`; support up to 10 photos
  - Write React Native Testing Library tests for each field component covering valid input, invalid input, error display, and accessibility
  - _Satisfies: REQ-3 (field types), REQ-4, REQ-10, REQ-11_

- [~] 15. Form Renderer and Editor Screen
  - Build `FormRenderer` component that iterates `FormSchema.sections` and renders the appropriate field component for each `FormField` type
  - Implement conditional field visibility: evaluate `ConditionalRule` against current form data and show/hide fields reactively
  - Implement field-level validation on blur with error message display within 200ms
  - Implement form-level validation on submit — prevent submission if any required fields are empty or rules violated
  - Build `FormEditorScreen` combining `FormRenderer` with header showing template name and auto-save status
  - Implement auto-save to SQLite every 30 seconds using a background interval
  - Preserve unsaved input through app backgrounding using `AppState` listener
  - Write Detox E2E test for full form completion flow: select template → fill all field types → submit
  - _Satisfies: REQ-4 | Design — FormRenderer_

- [~] 16. Form List and Detail Screens (Mobile)
  - Build `FormListScreen` showing tabs: "My Forms" (submitted) and "Templates" (available to fill)
  - Implement TanStack Query hook `useForms` fetching paginated form history from Supabase with 20 per page
  - Build `FormDetailScreen` showing all field values with read-only rendering using the correct template version
  - Add search bar on `FormListScreen` with debounced full-text search against Supabase
  - Implement filter chips for Form_Template type, date range, and status
  - Display sync status badge on each form item (synced / pending / conflict)
  - Display template version number on `FormDetailScreen` per REQ-18
  - _Satisfies: REQ-5, REQ-12, REQ-18_

- [~] 17. Client-Side PDF Export (Mobile)
  - Implement `PDFGeneratorService` in `features/forms/services/PDFGeneratorService.ts` using `react-native-html-to-pdf`
  - Build an HTML template that renders all form sections, field labels, values, and section headers in an aviation-style layout
  - Embed signature images inline as base64 in the HTML template
  - Embed photos inline at positions defined by `PhotoField` placement in the schema
  - Include PDF metadata: form type, submission date, pilot name, unique form ID (REQ-6 criteria 5)
  - After generation, present share sheet options: save to device, share via email, copy to Files app
  - Write property-based tests verifying all field values present in generated PDF HTML output (round-trip property)
  - _Satisfies: REQ-6_

- [~] 18. Server-Side PDF Generation (Edge Function)
  - Create Supabase Edge Function `generate-pdf` using `pdf-lib` for high-fidelity branded PDFs
  - Accept `form_instance_id` via POST body; fetch form data and template from Postgres
  - Fetch signature and photo files from Supabase Storage using service role
  - Render PDF with branded header, all form fields, embedded images, and footer with form ID
  - Upload generated PDF to Supabase Storage and return a signed URL (1-hour expiry)
  - Add the `/api/v1/forms/[id]/export` admin API route that calls this Edge Function
  - Write integration tests for the Edge Function with mock form data including signatures and photos
  - _Satisfies: REQ-6_

- [~] 19. Subscription Data Layer
  - Create `SubscriptionRepository` for CRUD on `public.subscriptions` table
  - Implement `SubscriptionUseCase` with methods: `getStatus`, `startTrial`, `cancelSubscription`
  - Create a Postgres function `is_subscription_active(user_id)` returning boolean — used by RLS extension
  - Write Supabase Edge Function `process-subscription` to handle App Store and Play Store server-to-server notifications (webhook)
  - Implement payment failure retry logic: retry 3 times over 7 days via scheduled function, then set status to `past_due`
  - _Satisfies: REQ-7_

- [~] 20. Mobile Subscription UI and Payment Integration
  - Install `react-native-purchases` (RevenueCat) for unified IAP across iOS and Android
  - Configure RevenueCat products for monthly and annual plans in both App Store and Google Play
  - Build `PaywallScreen` showing plan options, pricing, and free trial callout
  - Build `SubscriptionScreen` showing current plan, renewal date, and cancel option
  - Implement access gate in `FormEditorScreen`: check subscription status before allowing new form creation; show `PaywallScreen` if `status ∉ {active, trialing}`
  - Implement 14-day free trial initiation on first registration
  - Write unit tests for the subscription access gate invariant
  - _Satisfies: REQ-7_

- [~] 21. Subscription Management (Admin Dashboard)
  - Build `app/(dashboard)/subscriptions/page.tsx` showing all subscribers with status, plan, and revenue
  - Add manual override controls: extend trial, cancel, or reactivate subscription for a user
  - Display MRR, ARR, churn rate, and new subscriber metrics on the overview page
  - Write API route tests for subscription override actions
  - _Satisfies: REQ-7, REQ-14_

- [~] 22. Push Notification Infrastructure
  - Configure Firebase Cloud Messaging project; add `google-services.json` to mobile app
  - Configure Apple Push Notification Service; add APNs key to Supabase / FCM
  - Install `expo-notifications` and implement `NotificationService` in `features/notifications/NotificationService.ts`
  - Register device push token on login and store in a `device_tokens` table in Supabase
  - Create Supabase Edge Function `send-notification` accepting `{ userId, title, body, type }` — dispatches via FCM (Android) or APNS (iOS) using the stored token
  - Track delivery status in `public.notifications` table; retry failed deliveries once after 1 hour via cron
  - _Satisfies: REQ-15_

- [~] 23. Notification Triggers
  - Add DB trigger on `form_templates` UPDATE to call `send-notification` Edge Function for users who submitted that template in the past 30 days
  - Add subscription expiry notification: cron function queries subscriptions expiring in 7, 3, and 1 day — sends email (SendGrid) + push
  - In `SyncEngine`, after 3 consecutive sync failures call `NotificationService.showLocalNotification` with troubleshooting guidance
  - Build notification preferences screen in mobile app (enable/disable per notification type)
  - Display unread notification badge on app icon using `expo-notifications` badge API
  - Build notification inbox screen in the mobile app showing all notifications with read/unread state
  - _Satisfies: REQ-15_

- [~] 24. Analytics Aggregation
  - Create materialized view `analytics_daily` in Postgres aggregating daily signups, form submissions, and subscription events
  - Create Supabase Edge Function (cron, every 15 min) `aggregate-analytics` to refresh the materialized view
  - Build `/api/v1/analytics` route returning summary metrics for a given date range
  - Write unit tests for analytics aggregation logic
  - _Satisfies: REQ-14_

- [~] 25. Admin Dashboard Analytics UI
  - Build analytics overview page with line chart (Recharts) for DAU/MAU, form submissions over time
  - Add bar chart for most-used form templates
  - Add retention/churn rate cards with percentage change from previous period
  - Add system health metrics panel: API p95 latency, sync success rate, error rate (pull from Supabase logs)
  - Implement CSV export for all analytics data via a server action
  - Implement date range picker to filter all charts and metrics
  - _Satisfies: REQ-14_

- [~] 26. Audit Log Viewer (Admin Dashboard)
  - Build `app/(dashboard)/audit/page.tsx` with searchable, filterable table of `audit_logs`
  - Add filters: user, action type, resource type, date range
  - Implement CSV and JSON export for filtered audit log results within 10 seconds
  - Add Postgres function to archive audit logs older than 1 year to a cold storage table
  - Write pgTAP tests verifying audit log is append-only (no UPDATE/DELETE permitted via RLS)
  - _Satisfies: REQ-17_

- [~] 27. User Management (Admin Dashboard)
  - Build `app/(dashboard)/users/page.tsx` with paginated user list, search, and role filter
  - Show per-user details: subscription status, form count, last active date
  - Implement admin actions: suspend account, reset password, change role
  - Write API route tests for all admin user actions
  - _Satisfies: REQ-14_

- [~] 28. Encryption and Secure Storage
  - Implement `EncryptionService` for mobile using `expo-crypto` for AES-256 encryption of all SQLite data fields
  - Verify all auth tokens stored in `expo-secure-store` (not AsyncStorage)
  - Create Supabase Edge Function `rotate-encryption-keys` triggered by cron every 90 days
  - Implement re-encryption of existing data during key rotation without data loss
  - Write property-based test verifying encrypt/decrypt round-trip: `decrypt(encrypt(p)) = p`
  - Conduct a code review checklist item to verify no `console.log` of sensitive field values
  - _Satisfies: REQ-8 | Design — Correctness Properties_

- [~] 29. Error Handling and Resilience
  - Add global `ErrorBoundary` component to mobile app root catching unhandled React errors and showing a recovery screen
  - Implement centralized `AppError` handler in mobile that maps Supabase/network errors to `ErrorCode` enum
  - Implement exponential backoff retry wrapper `withRetry(fn, maxAttempts=3)` used by all network calls
  - Implement circuit breaker for Supabase Edge Function calls — open after 5 failures, recover after 60s
  - Configure Supabase connection pooling (PgBouncer) in transaction mode for API routes
  - Add `AppState` listener to mobile to queue all pending sync on background-to-foreground transition
  - Write unit tests for `withRetry` verifying retry count, backoff delays, and final error propagation
  - _Satisfies: REQ-20 | Design — Error Handling_

- [~] 30. Performance Optimizations
  - Add Postgres `pg_stat_statements` monitoring and identify slow queries during load testing
  - Verify all query filters use indexed columns; add missing indexes if identified
  - Configure TanStack Query `staleTime` and `cacheTime` for form templates (high) and form instances (medium)
  - Implement list virtualization in `FormListScreen` using `FlashList` from `@shopify/flash-list` for large form histories
  - Lazy load form field components using dynamic imports
  - Enable Gzip/Brotli compression on all Next.js API routes via Vercel config
  - Run load test simulating 1,000 concurrent users; verify p95 response time < 500ms
  - _Satisfies: REQ-19_

- [~] 31. Unit and Integration Test Suite
  - Configure Vitest for `packages/shared` and `apps/admin`; configure Jest for `apps/mobile`
  - Write unit tests for all use cases achieving 90% coverage in the domain layer
  - Write integration tests for all repository implementations against local Supabase
  - Write pgTAP tests for all RLS policies verifying data isolation between users
  - Write pgTAP tests verifying audit log is append-only
  - Add `npm run test:coverage` script and fail CI if domain layer drops below 90%
  - _Satisfies: Design — Testing Strategy_

- [~] 32. Property-Based Tests
  - Install `fast-check` in `packages/shared`
  - Write PBT for `FormParser` round-trip: `parse(format(t)) ≡ t` for all valid templates
  - Write PBT for `SyncEngine` idempotence: applying same operations twice yields same server state
  - Write PBT for `EncryptionService` round-trip: `decrypt(encrypt(p)) = p`
  - Write PBT for subscription access gate invariant: blocked status always prevents form creation
  - _Satisfies: REQ-6, REQ-9, REQ-16 | Design — Correctness Properties_

- [~] 33. E2E Tests
  - Configure Detox for mobile E2E with iOS and Android simulators
  - Write Detox test: full auth flow (register → MFA → login → logout)
  - Write Detox test: offline form cycle (fill form offline → reconnect → verify sync)
  - Write Detox test: subscription paywall gate (expired trial → attempt form → paywall shown)
  - Write Detox test: PDF export (complete form → export PDF → verify share sheet)
  - Configure Playwright for admin E2E
  - Write Playwright test: admin login → create form template → publish → verify notification sent
  - Write Playwright test: audit log export (filter → export CSV → verify row count)
  - _Satisfies: Design — Testing Strategy, Critical Test Paths_

- [~] 34. CI/CD Pipeline
  - Create GitHub Actions workflow `.github/workflows/ci.yml`: lint → typecheck → unit tests → integration tests on every PR
  - Create `.github/workflows/deploy-admin.yml`: on merge to `main`, run `vercel deploy --prod` for the admin app
  - Create `.github/workflows/deploy-supabase.yml`: on merge to `main`, run `supabase db push` for migrations and deploy Edge Functions
  - Add Expo EAS Build configuration for iOS and Android production builds
  - Configure branch protection: require CI pass and 1 code review before merge to `main`
  - _Satisfies: Design — Deployment_

- [~] 35. Monitoring and Observability
  - Configure Supabase built-in logs for all Edge Function invocations
  - Add Sentry SDK to mobile app for crash reporting with `SENTRY_DSN` from env
  - Add Sentry SDK to admin Next.js app for server-side error tracking
  - Set up uptime monitoring on the Supabase project URL using an external monitor (e.g., Better Uptime)
  - Create a Supabase Edge Function health check endpoint `/health` returning `{ status: "ok", timestamp }`
  - Configure backup failure alert: Edge Function monitors last backup timestamp and alerts via email if > 25 hours since last backup
  - _Satisfies: REQ-13, REQ-20_

- [~] 36. Security Hardening
  - Run `supabase db lint` and resolve all warnings on the production schema
  - Verify all API routes validate input using `zod` before touching the database
  - Add `Content-Security-Policy`, `X-Frame-Options`, and `Strict-Transport-Security` headers to Next.js `next.config.js`
  - Rotate all development secrets before first production deploy
  - Review and tighten Supabase Storage bucket policies: pilots can only access their own files
  - Perform a dependency audit (`npm audit`) and resolve all high/critical CVEs
  - Document security runbook: key rotation procedure, incident response steps, backup restore procedure
  - _Satisfies: REQ-8, REQ-17_

## Task Dependency Graph

```json
{
  "waves": [
    {
      "wave": 1,
      "tasks": ["1"],
      "description": "Monorepo foundation — must complete before anything else"
    },
    {
      "wave": 2,
      "tasks": ["2", "3", "4", "5"],
      "description": "Supabase setup, shared types, and app scaffolds — all depend only on task 1"
    },
    {
      "wave": 3,
      "tasks": ["6", "11"],
      "description": "Auth config (needs Supabase) and form parser (needs shared types) — parallel"
    },
    {
      "wave": 4,
      "tasks": ["7", "8", "12"],
      "description": "Mobile auth, admin auth, template management — depend on auth config and form parser"
    },
    {
      "wave": 5,
      "tasks": ["9", "13", "19", "22", "24", "26", "27"],
      "description": "SQLite DB, template sync, subscription data layer, push infra, analytics, audit, users — parallel"
    },
    {
      "wave": 6,
      "tasks": ["10", "14", "20", "21", "23", "25", "28"],
      "description": "Sync engine, field components, subscription UI, admin subscription, notification triggers, analytics UI, encryption — parallel"
    },
    {
      "wave": 7,
      "tasks": ["15", "29"],
      "description": "Form renderer/editor and error handling — depend on field components and sync engine"
    },
    {
      "wave": 8,
      "tasks": ["16", "17", "18", "30"],
      "description": "Form list/detail, client PDF, server PDF, performance optimizations — depend on form renderer"
    },
    {
      "wave": 9,
      "tasks": ["31", "32", "33"],
      "description": "Unit/integration tests, PBTs, E2E tests — require full feature completion"
    },
    {
      "wave": 10,
      "tasks": ["34"],
      "description": "CI/CD pipeline — requires test suites to be in place"
    },
    {
      "wave": 11,
      "tasks": ["35"],
      "description": "Monitoring and observability — depends on CI/CD"
    },
    {
      "wave": 12,
      "tasks": ["36"],
      "description": "Security hardening — final production readiness step"
    }
  ]
}
```

## Notes

- Tasks 1–5 (Phase 1: Foundation) must be completed before any subsequent phases begin.
- Tasks 6–8 (Phase 2: Auth) depend on the monorepo and Supabase being initialized.
- Tasks 9–10 (Phase 3: Offline/Sync) depend on the mobile scaffold and auth being in place.
- Tasks 11–13 (Phase 4: Templates) depend on shared types and the form parser.
- Tasks 14–16 (Phase 5: Forms) depend on field components and the form renderer.
- Tasks 17–18 (Phase 6: PDF) build on the form rendering layer.
- Tasks 19–21 (Phase 7: Subscriptions) require the Supabase data layer.
- Tasks 22–23 (Phase 8: Notifications) depend on auth and subscription state.
- Tasks 24–27 (Phase 9: Admin Analytics/Audit/Users) are mostly independent of mobile features.
- Tasks 28–30 (Phase 10: Security/Performance) harden existing implementations.
- Tasks 31–33 (Phase 11: Testing) consolidate coverage across the full stack.
- Tasks 34–36 (Phase 12: Deployment/DevOps) finalize the production pipeline.

- [~] 22. Set up push notification infrastructure: configure Firebase Cloud Messaging and Apple Push Notification Service; implement NotificationService using expo-notifications; register device push tokens on login storing in device_tokens table; create send-notification Supabase Edge Function dispatching via FCM/APNS; track delivery status in notifications table with 1-hour retry cron
  - _Requirements: REQ-15_

- [~] 23. Implement notification triggers: DB trigger on form_templates UPDATE notifying users who submitted that template in the past 30 days; cron function for subscription expiry notifications at 7, 3, and 1 day before expiry via SendGrid email and push; SyncEngine local notification after 3 consecutive sync failures; notification preferences screen; unread badge via expo-notifications badge API; in-app notification inbox screen
  - _Requirements: REQ-15_

- [~] 24. Build analytics aggregation: create materialized view analytics_daily in Postgres for daily signups, form submissions, and subscription events; create Edge Function cron (every 15 min) aggregate-analytics refreshing the view; build /api/v1/analytics route returning summary metrics for a date range; write unit tests for aggregation logic
  - _Requirements: REQ-14_

- [~] 25. Build admin analytics dashboard UI: line chart (Recharts) for DAU/MAU and form submissions over time; bar chart for most-used form templates; retention and churn rate cards with period-over-period change; system health metrics panel (API p95 latency, sync success rate, error rate); CSV export server action; date range picker filtering all charts
  - _Requirements: REQ-14_

- [~] 26. Build audit log viewer in admin dashboard: searchable filterable table of audit_logs with filters for user, action type, resource type, and date range; CSV and JSON export within 10 seconds; Postgres function archiving logs older than 1 year to cold storage; write pgTAP tests verifying audit_logs table is append-only (no UPDATE/DELETE via RLS)
  - _Requirements: REQ-17_

- [~] 27. Build user management page in admin dashboard: paginated user list with search and role filter; per-user details (subscription status, form count, last active); admin actions to suspend, reset password, and change role; write API route tests for all user management actions
  - _Requirements: REQ-14_

- [~] 28. Implement security hardening: EncryptionService with AES-256 for all SQLite data fields; verify all auth tokens in expo-secure-store; create rotate-encryption-keys Edge Function cron running every 90 days with re-encryption of existing data; write PBT verifying decrypt(encrypt(p)) = p; dependency audit resolving all high/critical CVEs; secure Supabase Storage bucket policies restricting pilots to their own files
  - _Requirements: REQ-8_

- [~] 29. Implement error handling and resilience: global ErrorBoundary in mobile root; centralized AppError handler mapping Supabase/network errors to ErrorCode enum; withRetry(fn, maxAttempts=3) wrapper with exponential backoff used by all network calls; circuit breaker for Edge Function calls (open after 5 failures, recover after 60s); Supabase PgBouncer connection pooling in transaction mode; write unit tests for withRetry verifying retries, delays, and final error propagation
  - _Requirements: REQ-20_

- [~] 30. Implement performance optimizations: verify all query filters use indexed columns; configure TanStack Query staleTime and cacheTime per data type; implement list virtualization in FormListScreen using @shopify/flash-list; enable Gzip/Brotli compression on Next.js API routes; run load test simulating 1,000 concurrent users and verify p95 response time under 500ms
  - _Requirements: REQ-19_


- [~] 31. Set up unit and integration test suite: configure Vitest for packages/shared and apps/admin; configure Jest for apps/mobile; write unit tests for all use cases targeting 90% domain layer coverage; write repository integration tests against local Supabase; write pgTAP tests for all RLS policies verifying data isolation; add test:coverage script failing CI below 90% domain coverage
  - _Requirements: Design — Testing Strategy_

- [~] 32. Write property-based tests using fast-check: FormParser round-trip parse(format(t)) ≡ t for all valid templates; SyncEngine idempotence (applying same operations twice yields same server state); EncryptionService round-trip decrypt(encrypt(p)) = p; subscription access gate invariant (blocked status always prevents form creation)
  - _Requirements: REQ-6, REQ-9, REQ-16_

- [~] 33. Write E2E tests: configure Detox for iOS and Android simulators; write Detox tests for full auth flow, offline form cycle, subscription paywall gate, and PDF export; configure Playwright for admin E2E; write Playwright tests for admin login → template publish → notification verification, and audit log CSV export
  - _Requirements: Design — Critical Test Paths_

- [~] 34. Set up CI/CD pipeline: GitHub Actions workflow for lint → typecheck → unit tests → integration tests on every PR; deploy-admin workflow running vercel deploy --prod on merge to main; deploy-supabase workflow running supabase db push and Edge Function deploy on merge to main; Expo EAS Build configuration for iOS and Android; branch protection requiring CI pass and 1 review
  - _Requirements: Design — Deployment_

- [~] 35. Set up monitoring and observability: configure Sentry SDK in mobile app and admin Next.js for crash and error reporting; set up uptime monitoring on Supabase project URL; create /health Edge Function endpoint; configure backup failure alert via Edge Function checking last backup timestamp and sending email alert if over 25 hours
  - _Requirements: REQ-13, REQ-20_

- [~] 36. Security hardening and production readiness: run supabase db lint and resolve all warnings; verify all API routes validate input with zod; add Content-Security-Policy, X-Frame-Options, and Strict-Transport-Security headers to next.config.js; rotate all development secrets before first production deploy; document security runbook covering key rotation procedure, incident response, and backup restore procedure
  - _Requirements: REQ-8, REQ-17_

## Task Dependency Graph

```
1 (monorepo) → 2 (supabase schema) → 3 (shared types)
3 → 4 (mobile scaffold) → 6 (supabase auth config) → 7 (mobile auth) → 9 (SQLite offline DB) → 10 (sync engine)
3 → 5 (admin scaffold) → 6 → 8 (admin auth)
3 → 11 (form parser) → 12 (admin template builder) → 13 (template sync to mobile)
9 + 13 → 14 (field components) → 15 (form renderer) → 16 (form list/detail)
15 → 17 (client PDF)
2 → 18 (server PDF edge function)
7 → 19 (subscription data layer) → 20 (mobile subscription UI)
8 + 19 → 21 (admin subscription mgmt)
2 → 22 (push notification infra) → 23 (notification triggers)
2 → 24 (analytics aggregation) → 25 (analytics UI)
2 → 26 (audit log viewer)
8 → 27 (user management)
9 → 28 (security / encryption hardening)
10 → 29 (error handling / resilience)
16 + 20 → 30 (performance optimizations)
7 + 10 + 11 + 15 → 31 (unit/integration tests)
11 + 10 → 32 (property-based tests)
20 + 15 + 7 → 33 (E2E tests)
31 + 32 + 33 → 34 (CI/CD pipeline)
34 → 35 (monitoring)
34 → 36 (security hardening / production)
```

## Notes

- Tasks 1–5 (foundation) must be completed before any feature work begins.
- Tasks 6–8 (auth) are prerequisites for all data-access tasks.
- Tasks 9–10 (offline + sync) unlock all mobile form tasks.
- Task 11 (form parser) must be complete before admin template builder (12) and mobile renderer (15).
- RevenueCat (Task 20) requires App Store and Play Store developer accounts with configured products before integration can be tested on device.
- Supabase local development (`supabase start`) is required for Tasks 9, 11, 13, 18, 24, 31. Document setup in README.
- All 36 tasks map directly to requirements in `requirements.md` and design decisions in `design.md`.
