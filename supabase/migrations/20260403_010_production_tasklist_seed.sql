alter table public.tasks
  add column if not exists category text,
  add column if not exists source_document text,
  add column if not exists source_key text,
  add column if not exists sort_order integer;

create unique index if not exists tasks_project_source_key_unique_idx
  on public.tasks (project_id, source_key)
  where source_key is not null;

with production_templates (source_key, category, title, description, priority, sort_order) as (
  values
    ('infrastructure-cicd-pipeline', 'Infrastructure & Deployment', 'CI/CD Pipeline', 'Set up GitHub Actions for automated testing and deployment to Cloud Run.', 'Critical', 100),
    ('infrastructure-environment-management', 'Infrastructure & Deployment', 'Environment Management', 'Separate development, staging, and production environments with distinct Firebase projects.', 'Critical', 110),
    ('infrastructure-monitoring-alerting', 'Infrastructure & Deployment', 'Monitoring & Alerting', 'Integrate Sentry for error tracking and Google Cloud Monitoring for performance metrics.', 'High', 120),
    ('infrastructure-custom-domain-ssl', 'Infrastructure & Deployment', 'Custom Domain & SSL', 'Configure a custom domain with managed SSL certificates.', 'High', 130),
    ('security-firestore-rules-audit', 'Security Hardening', 'Firestore Rules Audit', 'Conduct a final security audit of firestore.rules using the Devil''s Advocate approach.', 'Critical', 200),
    ('security-api-key-rotation', 'Security Hardening', 'API Key Rotation', 'Implement a system for rotating third-party API keys such as Stripe and Gemini.', 'High', 210),
    ('security-rate-limiting', 'Security Hardening', 'Rate Limiting', 'Implement server-side rate limiting for AI endpoints to prevent abuse.', 'Critical', 220),
    ('security-pii-protection', 'Security Hardening', 'PII Protection', 'Ensure all Personally Identifiable Information is encrypted or strictly access-controlled.', 'Critical', 230),
    ('data-offline-persistence', 'Data & State Management', 'Offline Persistence', 'Enable Firestore offline persistence for better mobile experience.', 'Medium', 300),
    ('data-optimistic-ui-updates', 'Data & State Management', 'Optimistic UI Updates', 'Implement optimistic updates for all CRUD operations to improve perceived performance.', 'High', 310),
    ('data-migration-scripts', 'Data & State Management', 'Data Migration Scripts', 'Create scripts for handling schema changes in Firestore.', 'High', 320),
    ('data-backup-strategy', 'Data & State Management', 'Backup Strategy', 'Configure automated daily backups for the Firestore database.', 'High', 330),
    ('ai-prompt-engineering-versioning', 'AI/LLM Optimization', 'Prompt Engineering Versioning', 'Store and version all prompt templates in Firestore.', 'High', 400),
    ('ai-cost-tracking', 'AI/LLM Optimization', 'Cost Tracking', 'Implement granular cost tracking per user and project for AI usage.', 'High', 410),
    ('ai-model-fallback', 'AI/LLM Optimization', 'Model Fallback', 'Implement logic to fallback to alternative models if the primary model fails.', 'High', 420),
    ('ai-response-streaming', 'AI/LLM Optimization', 'Response Streaming', 'Transition AI responses to streaming for better user experience in long-form content.', 'Medium', 430),
    ('ux-comprehensive-error-boundaries', 'User Experience (UX)', 'Comprehensive Error Boundaries', 'Ensure every major component is wrapped in an Error Boundary with recovery options.', 'High', 500),
    ('ux-accessibility-audit', 'User Experience (UX)', 'Accessibility (A11y) Audit', 'Perform a full accessibility audit (WCAG 2.1) and fix identified issues.', 'High', 510),
    ('ux-performance-profiling', 'User Experience (UX)', 'Performance Profiling', 'Optimize bundle size and initial load time for LCP, FID, and CLS.', 'High', 520),
    ('ux-user-feedback-loop', 'User Experience (UX)', 'User Feedback Loop', 'Add an in-app feedback mechanism for users to report bugs or suggest features.', 'Medium', 530),
    ('business-subscription-management', 'Business & Compliance', 'Subscription Management', 'Integrate Stripe for billing and subscription management.', 'High', 600),
    ('business-terms-privacy-policy', 'Business & Compliance', 'Terms of Service & Privacy Policy', 'Draft and integrate legal documents.', 'High', 610),
    ('business-gdpr-ccpa-compliance', 'Business & Compliance', 'GDPR/CCPA Compliance', 'Implement data deletion and export requests for users.', 'Critical', 620),
    ('business-analytics', 'Business & Compliance', 'Analytics', 'Integrate Mixpanel or Google Analytics for user behavior tracking.', 'Medium', 630),
    ('testing-unit-tests-coverage', 'Testing', 'Unit Tests', 'Achieve more than 80 percent coverage for core utility functions and hooks.', 'High', 700),
    ('testing-integration-tests', 'Testing', 'Integration Tests', 'Test critical flows like onboarding, project creation, and AI generation.', 'High', 710),
    ('testing-end-to-end-tests', 'Testing', 'End-to-End (E2E) Tests', 'Implement Playwright or Cypress tests for the most critical user paths.', 'High', 720),
    ('testing-load-testing', 'Testing', 'Load Testing', 'Simulate high concurrent user traffic to identify bottlenecks.', 'Medium', 730)
)
update public.tasks as existing
set
  title = production_templates.title,
  description = production_templates.description,
  priority = production_templates.priority,
  category = production_templates.category,
  source_document = 'PRODUCTION_TASKS.md',
  sort_order = production_templates.sort_order,
  updated_at = timezone('utc', now())
from production_templates
where existing.source_key = production_templates.source_key;

with production_templates (source_key, category, title, description, priority, sort_order) as (
  values
    ('infrastructure-cicd-pipeline', 'Infrastructure & Deployment', 'CI/CD Pipeline', 'Set up GitHub Actions for automated testing and deployment to Cloud Run.', 'Critical', 100),
    ('infrastructure-environment-management', 'Infrastructure & Deployment', 'Environment Management', 'Separate development, staging, and production environments with distinct Firebase projects.', 'Critical', 110),
    ('infrastructure-monitoring-alerting', 'Infrastructure & Deployment', 'Monitoring & Alerting', 'Integrate Sentry for error tracking and Google Cloud Monitoring for performance metrics.', 'High', 120),
    ('infrastructure-custom-domain-ssl', 'Infrastructure & Deployment', 'Custom Domain & SSL', 'Configure a custom domain with managed SSL certificates.', 'High', 130),
    ('security-firestore-rules-audit', 'Security Hardening', 'Firestore Rules Audit', 'Conduct a final security audit of firestore.rules using the Devil''s Advocate approach.', 'Critical', 200),
    ('security-api-key-rotation', 'Security Hardening', 'API Key Rotation', 'Implement a system for rotating third-party API keys such as Stripe and Gemini.', 'High', 210),
    ('security-rate-limiting', 'Security Hardening', 'Rate Limiting', 'Implement server-side rate limiting for AI endpoints to prevent abuse.', 'Critical', 220),
    ('security-pii-protection', 'Security Hardening', 'PII Protection', 'Ensure all Personally Identifiable Information is encrypted or strictly access-controlled.', 'Critical', 230),
    ('data-offline-persistence', 'Data & State Management', 'Offline Persistence', 'Enable Firestore offline persistence for better mobile experience.', 'Medium', 300),
    ('data-optimistic-ui-updates', 'Data & State Management', 'Optimistic UI Updates', 'Implement optimistic updates for all CRUD operations to improve perceived performance.', 'High', 310),
    ('data-migration-scripts', 'Data & State Management', 'Data Migration Scripts', 'Create scripts for handling schema changes in Firestore.', 'High', 320),
    ('data-backup-strategy', 'Data & State Management', 'Backup Strategy', 'Configure automated daily backups for the Firestore database.', 'High', 330),
    ('ai-prompt-engineering-versioning', 'AI/LLM Optimization', 'Prompt Engineering Versioning', 'Store and version all prompt templates in Firestore.', 'High', 400),
    ('ai-cost-tracking', 'AI/LLM Optimization', 'Cost Tracking', 'Implement granular cost tracking per user and project for AI usage.', 'High', 410),
    ('ai-model-fallback', 'AI/LLM Optimization', 'Model Fallback', 'Implement logic to fallback to alternative models if the primary model fails.', 'High', 420),
    ('ai-response-streaming', 'AI/LLM Optimization', 'Response Streaming', 'Transition AI responses to streaming for better user experience in long-form content.', 'Medium', 430),
    ('ux-comprehensive-error-boundaries', 'User Experience (UX)', 'Comprehensive Error Boundaries', 'Ensure every major component is wrapped in an Error Boundary with recovery options.', 'High', 500),
    ('ux-accessibility-audit', 'User Experience (UX)', 'Accessibility (A11y) Audit', 'Perform a full accessibility audit (WCAG 2.1) and fix identified issues.', 'High', 510),
    ('ux-performance-profiling', 'User Experience (UX)', 'Performance Profiling', 'Optimize bundle size and initial load time for LCP, FID, and CLS.', 'High', 520),
    ('ux-user-feedback-loop', 'User Experience (UX)', 'User Feedback Loop', 'Add an in-app feedback mechanism for users to report bugs or suggest features.', 'Medium', 530),
    ('business-subscription-management', 'Business & Compliance', 'Subscription Management', 'Integrate Stripe for billing and subscription management.', 'High', 600),
    ('business-terms-privacy-policy', 'Business & Compliance', 'Terms of Service & Privacy Policy', 'Draft and integrate legal documents.', 'High', 610),
    ('business-gdpr-ccpa-compliance', 'Business & Compliance', 'GDPR/CCPA Compliance', 'Implement data deletion and export requests for users.', 'Critical', 620),
    ('business-analytics', 'Business & Compliance', 'Analytics', 'Integrate Mixpanel or Google Analytics for user behavior tracking.', 'Medium', 630),
    ('testing-unit-tests-coverage', 'Testing', 'Unit Tests', 'Achieve more than 80 percent coverage for core utility functions and hooks.', 'High', 700),
    ('testing-integration-tests', 'Testing', 'Integration Tests', 'Test critical flows like onboarding, project creation, and AI generation.', 'High', 710),
    ('testing-end-to-end-tests', 'Testing', 'End-to-End (E2E) Tests', 'Implement Playwright or Cypress tests for the most critical user paths.', 'High', 720),
    ('testing-load-testing', 'Testing', 'Load Testing', 'Simulate high concurrent user traffic to identify bottlenecks.', 'Medium', 730)
)
insert into public.tasks (
  id,
  project_id,
  title,
  description,
  status,
  priority,
  category,
  source_document,
  source_key,
  sort_order,
  created_at,
  updated_at
)
select
  projects.id || ':' || production_templates.source_key,
  projects.id,
  production_templates.title,
  production_templates.description,
  'planned',
  production_templates.priority,
  production_templates.category,
  'PRODUCTION_TASKS.md',
  production_templates.source_key,
  production_templates.sort_order,
  timezone('utc', now()),
  timezone('utc', now())
from public.projects as projects
cross join production_templates
where not exists (
  select 1
  from public.tasks as existing
  where existing.project_id = projects.id
    and existing.source_key = production_templates.source_key
);

comment on column public.tasks.category is 'Human-readable production task category such as Infrastructure & Deployment or Testing.';
comment on column public.tasks.source_document is 'Source document that defines the task template, for example PRODUCTION_TASKS.md.';
comment on column public.tasks.source_key is 'Stable template key used to upsert canonical project tasks without duplicating them.';
comment on column public.tasks.sort_order is 'Stable display order for grouped tasklist rendering.';