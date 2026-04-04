<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# FlowForge AI

FlowForge AI now runs on Supabase for database access, realtime data, and auth integration.

## Local setup

1. Run `npm install`.
2. Copy [.env.example](.env.example) to `.env.local` and fill in `VITE_SUPABASE_URL` plus `VITE_SUPABASE_ANON_KEY`. `VITE_SUPABASE_PUBLISHABLE_KEY` and `VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY` are also accepted as compatibility aliases.
3. Run `npm run env:check` to verify the required frontend variables are present before starting the app.
4. Optional: set `VITE_AUTH_REDIRECT_URL` if the auth callback origin differs from the current browser origin.
5. In Supabase Auth, enable the providers you want to expose in the UI. The current frontend supports Google, GitHub, Microsoft (`azure` in Supabase), Apple, magic links, email one-time codes, password reset, and enterprise SSO initiation by company domain.
6. Add your local and deployed callback URLs to Supabase Auth redirect allow lists.
7. If your Supabase project already has the older `projects/pages/components` product schema in `public`, apply [supabase/migrations/20260403_000_archive_legacy_product_schema.sql](supabase/migrations/20260403_000_archive_legacy_product_schema.sql) first to archive it into `legacy_product` without data loss.
8. Apply [supabase/migrations/20260403_001_flowforge_supabase_foundation.sql](supabase/migrations/20260403_001_flowforge_supabase_foundation.sql) to install the FlowForge enterprise schema in `public`.
9. If you archived legacy product data, apply [supabase/migrations/20260403_002_import_legacy_product_data.sql](supabase/migrations/20260403_002_import_legacy_product_data.sql) to hydrate the FlowForge tables from `legacy_product`.
10. Apply [supabase/migrations/20260403_003_bootstrap_first_auth_admin.sql](supabase/migrations/20260403_003_bootstrap_first_auth_admin.sql) so the first real authenticated user is promoted to `Admin` automatically.
11. Apply [supabase/migrations/20260403_007_auth_pwa_foundation.sql](supabase/migrations/20260403_007_auth_pwa_foundation.sql) to add provider metadata, feature flags, session registry tables, RBAC permissions, and seeded FlowForge feature cards for auth modernization and tablet PWA rollout.
11. Start the app with `npm run dev`.

## Authentication status

- Implemented in the SPA layer: provider registry, Google/GitHub/Microsoft/Apple OAuth initiation, enterprise SSO initiation by work domain, password reset, passwordless magic-link requests, passwordless email code requests, email code verification, user-facing fallback states, device session inventory, trusted-device controls, and logout-all.
- Implemented in the FlowForge data layer: auth provider catalog, auth flow definitions with failure states, auth feature flags, scoped permissions, PWA install telemetry tables, and FlowForge feature/task seed data.
- Still planned for the auth backend layer: strict server-enforced remote single-session revocation, cookie-based server auth for CSRF-protected flows, passkey enrollment/challenge APIs, and production SMS provider rollout.

## Tablet PWA status

- Implemented in the client shell: `manifest.webmanifest`, service worker registration, cached app shell, install prompt, offline banner, background update prompt, and touch-friendly global styles.
- Current limitation: the repo uses SVG icons for installability. Production-grade iPad splash assets still need a generated PNG icon pipeline.

## Migration notes

- The files in `supabase/migrations/` are the canonical, versioned database history for this repository. Do not remove them unless they are replaced by an explicit new baseline migration strategy.
- The enterprise schema is designed to own `public`. If an older product schema already exists there, archive it into `legacy_product` first with [supabase/migrations/20260403_000_archive_legacy_product_schema.sql](supabase/migrations/20260403_000_archive_legacy_product_schema.sql).
- The archive/import pair in [supabase/migrations/20260403_000_archive_legacy_product_schema.sql](supabase/migrations/20260403_000_archive_legacy_product_schema.sql) and [supabase/migrations/20260403_002_import_legacy_product_data.sql](supabase/migrations/20260403_002_import_legacy_product_data.sql) is legacy-support only. Keep them for older installations, but they are conditional for greenfield setups.
- The archival migration preserves all existing legacy rows and records table-level row counts in `legacy_product.migration_inventory` for auditability.
- The legacy import migration hydrates FlowForge tables for users, projects, versions, features, pages, layouts, components, and audit logs. Legacy-only product structures that do not map to the current FlowForge app remain preserved in `legacy_product`.
- The auth bootstrap migration promotes the first linked Supabase Auth user to `Admin`, which makes the imported FlowForge project reachable even when the database was initialized from archived legacy data.
- The auth/PWA foundation migration stores provider secret references by environment-variable name only. Actual credentials still belong in Supabase Auth provider settings and environment-specific secret stores.
- Session revocation is currently app-managed through a FlowForge session registry keyed by the JWT `session_id`. Supabase still owns token rotation and provider-level session rules.

## Feature flags

- Frontend flags: `VITE_SUPABASE_EMAIL_OTP_ENABLED`, `VITE_SUPABASE_APPLE_OAUTH_ENABLED`, `VITE_SUPABASE_ENTERPRISE_SSO_ENABLED`, `VITE_SUPABASE_PASSKEYS_ENABLED`, `VITE_SUPABASE_TOTP_MFA_ENABLED`, `VITE_SUPABASE_SMS_MFA_FALLBACK_ENABLED`.
- Data-backed rollout flags seeded in Supabase: `auth.apple_oauth`, `auth.enterprise_sso`, `auth.email_otp`, `auth.passkeys_preview`, `auth.totp_mfa`, `auth.sms_mfa_fallback`, `auth.session_registry`, `pwa.install_prompt`, `pwa.offline_shell`, `pwa.background_updates`, `pwa.tablet_layouts`.

## Catalog sync

- Run `npm run sync:flowforge:product` after applying the latest migrations to upsert the canonical FlowForge AI project overview, pages, components, feature cards, userflows, and relationships.
- `scripts/check-env.mjs` remains part of the normal dev/build workflow through `npm run env:check`, `predev`, and `prebuild`.
- `scripts/sync-flowforge-product.ts` remains in the repository because it is still the supported repeatable catalog/bootstrap sync for the seeded FlowForge AI project.

## Legacy docs

- Historical Firebase/Firestore-era reports were moved to [docs/legacy/README.md](docs/legacy/README.md). They are retained for reference only and are not the current setup source of truth.
