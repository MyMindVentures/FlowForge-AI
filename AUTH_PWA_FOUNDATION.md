# Auth And PWA Foundation

## Scope

This change adds the FlowForge-side foundation for enterprise-grade authentication and an installable tablet-first PWA shell.

- Social auth: Google, GitHub, Microsoft, Apple.
- Enterprise auth: SAML 2.0 and OIDC routed by work email or company domain.
- Passwordless: magic links and email one-time codes.
- MFA architecture: TOTP-first, optional SMS fallback, passkey-ready provider contract.
- Session controls: device/session registry, trusted devices, logout-all, revoke UX, auth telemetry.
- PWA shell: manifest, service worker, install prompt, offline shell, update prompt, touch-safe styling.

## Supabase-Native vs FlowForge-Managed

Supabase-native:

- Social OAuth/OIDC providers.
- Enterprise SSO via SAML 2.0 and OIDC.
- Password sign-in, password reset, email verification, magic links, OTP.
- Session issuance with short-lived access tokens and rotating refresh tokens.
- MFA with TOTP and phone-based flows where configured.
- Auth audit logs.

FlowForge-managed:

- Provider catalog and rollout metadata.
- Auth flow fallback and failure-state definitions.
- App-visible device session registry keyed by JWT `session_id`.
- Trusted-device flags and app-managed revoke UX.
- PWA install/update telemetry.

## Environment Flags

Frontend:

- `VITE_AUTH_REDIRECT_URL`
- `VITE_SUPABASE_EMAIL_OTP_ENABLED`
- `VITE_SUPABASE_APPLE_OAUTH_ENABLED`
- `VITE_SUPABASE_ENTERPRISE_SSO_ENABLED`
- `VITE_SUPABASE_PASSKEYS_ENABLED`
- `VITE_SUPABASE_TOTP_MFA_ENABLED`
- `VITE_SUPABASE_SMS_MFA_FALLBACK_ENABLED`

Provider secret references stored in Supabase data:

- `SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_ID`
- `SUPABASE_AUTH_EXTERNAL_GOOGLE_SECRET`
- `SUPABASE_AUTH_EXTERNAL_GITHUB_CLIENT_ID`
- `SUPABASE_AUTH_EXTERNAL_GITHUB_SECRET`
- `SUPABASE_AUTH_EXTERNAL_AZURE_CLIENT_ID`
- `SUPABASE_AUTH_EXTERNAL_AZURE_SECRET`
- `SUPABASE_AUTH_EXTERNAL_APPLE_CLIENT_ID`
- `SUPABASE_AUTH_EXTERNAL_APPLE_SECRET`
- `SUPABASE_AUTH_SSO_OIDC_CLIENT_ID`
- `SUPABASE_AUTH_SSO_OIDC_SECRET`
- `SUPABASE_AUTH_SSO_SAML_ENTITY_ID`
- `SUPABASE_AUTH_SSO_SAML_SIGNING_CERT`
- `SUPABASE_AUTH_SMS_PROVIDER_SECRET`

## Failure States And Fallback UX

Google/GitHub/Microsoft OAuth:

- Failures: provider disabled, popup blocked, redirect mismatch, org policy mismatch.
- Fallback: password or magic link.

Apple OAuth:

- Failures: missing client secret, provider disabled.
- Fallback: magic link.

Enterprise SSO:

- Failures: unknown domain, tenant not configured, invalid metadata.
- Fallback: support contact and email-based login.

Magic links:

- Failures: rate limiting, SMTP outage, expired link.
- Fallback: email one-time codes.

Email OTP:

- Failures: token template not configured, invalid code, rate limiting.
- Fallback: magic link.

Passkeys:

- Failures: browser unsupported, factor not enrolled.
- Fallback: TOTP.

TOTP:

- Failures: factor not enrolled, failed challenge.
- Fallback: SMS recovery when enabled.

SMS fallback:

- Failures: provider missing, code expired, rate limiting.
- Fallback: support contact.

## Migration Notes

- Apply `supabase/migrations/20260403_007_auth_pwa_foundation.sql` after the existing FlowForge Supabase foundation migrations.
- The migration creates public tables only; secrets are referenced by environment-variable name and are not stored in plaintext.
- Device-session revocation is currently app-managed using a FlowForge session registry keyed to the JWT `session_id` claim.
- Supabase still remains the source of truth for actual token issuance, refresh rotation, and provider configuration.

## Follow-Up Items

- Add generated PNG icon assets for iPad home-screen polish and splash screens.
- Add server-side or edge-function session enforcement if strict remote revocation is required before the next client refresh.
- Add mutation retry queueing if offline editing flows expand beyond the current shell resiliency model.