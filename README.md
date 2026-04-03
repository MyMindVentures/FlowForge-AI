<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# FlowForge AI

The app now targets Supabase for database access and auth integration. Firebase remains in the repo only for one-time export during migration.

## Local setup

1. Run `npm install`.
2. Copy [.env.example](.env.example) to `.env.local` and fill in `VITE_SUPABASE_URL` plus either `VITE_SUPABASE_ANON_KEY` or `VITE_SUPABASE_PUBLISHABLE_KEY`.
3. Apply [supabase/migrations/20260403_001_flowforge_supabase_foundation.sql](supabase/migrations/20260403_001_flowforge_supabase_foundation.sql) to your Supabase project.
4. Start the app with `npm run dev`.

## Firebase to Supabase migration

1. Export the current Firebase dataset with `npm run migrate:firebase:export`.
2. Import it into Supabase with `npm run migrate:supabase:import`.
3. Validate counts with `npm run migrate:supabase:validate`.
4. If you need to undo the schema bootstrap, apply [supabase/rollback/20260403_001_flowforge_supabase_foundation_rollback.sql](supabase/rollback/20260403_001_flowforge_supabase_foundation_rollback.sql).

## Migration notes

- Existing Firestore document IDs are preserved as Postgres text primary keys.
- Imported Firebase user IDs remain the application-level `uid`; Supabase auth users are linked through `auth_user_id` for backward-compatible ownership checks.
- Exporting the live dataset requires Firebase Admin credentials. Without those credentials, the schema and app-code migration can be prepared, but the production data copy cannot be executed.
