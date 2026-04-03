import { supabase } from '../supabase/appClient';
import { Task } from '../../types';

export const PRODUCTION_TASK_SOURCE_DOCUMENT = 'PRODUCTION_TASKS.md';

export type ProductionTaskTemplate = {
  sourceKey: string;
  category: string;
  title: string;
  description: string;
  priority: Task['priority'];
  sortOrder: number;
};

export const productionTaskTemplates: ProductionTaskTemplate[] = [
  {
    sourceKey: 'infrastructure-cicd-pipeline',
    category: 'Infrastructure & Deployment',
    title: 'CI/CD Pipeline',
    description: 'Set up GitHub Actions for automated testing and deployment to Cloud Run.',
    priority: 'Critical',
    sortOrder: 100,
  },
  {
    sourceKey: 'infrastructure-environment-management',
    category: 'Infrastructure & Deployment',
    title: 'Environment Management',
    description: 'Separate development, staging, and production environments with distinct Firebase projects.',
    priority: 'Critical',
    sortOrder: 110,
  },
  {
    sourceKey: 'infrastructure-monitoring-alerting',
    category: 'Infrastructure & Deployment',
    title: 'Monitoring & Alerting',
    description: 'Integrate Sentry for error tracking and Google Cloud Monitoring for performance metrics.',
    priority: 'High',
    sortOrder: 120,
  },
  {
    sourceKey: 'infrastructure-custom-domain-ssl',
    category: 'Infrastructure & Deployment',
    title: 'Custom Domain & SSL',
    description: 'Configure a custom domain with managed SSL certificates.',
    priority: 'High',
    sortOrder: 130,
  },
  {
    sourceKey: 'security-firestore-rules-audit',
    category: 'Security Hardening',
    title: 'Firestore Rules Audit',
    description: 'Conduct a final security audit of firestore.rules using the Devil\'s Advocate approach.',
    priority: 'Critical',
    sortOrder: 200,
  },
  {
    sourceKey: 'security-api-key-rotation',
    category: 'Security Hardening',
    title: 'API Key Rotation',
    description: 'Implement a system for rotating third-party API keys such as Stripe and Gemini.',
    priority: 'High',
    sortOrder: 210,
  },
  {
    sourceKey: 'security-rate-limiting',
    category: 'Security Hardening',
    title: 'Rate Limiting',
    description: 'Implement server-side rate limiting for AI endpoints to prevent abuse.',
    priority: 'Critical',
    sortOrder: 220,
  },
  {
    sourceKey: 'security-pii-protection',
    category: 'Security Hardening',
    title: 'PII Protection',
    description: 'Ensure all Personally Identifiable Information is encrypted or strictly access-controlled.',
    priority: 'Critical',
    sortOrder: 230,
  },
  {
    sourceKey: 'data-offline-persistence',
    category: 'Data & State Management',
    title: 'Offline Persistence',
    description: 'Enable Firestore offline persistence for better mobile experience.',
    priority: 'Medium',
    sortOrder: 300,
  },
  {
    sourceKey: 'data-optimistic-ui-updates',
    category: 'Data & State Management',
    title: 'Optimistic UI Updates',
    description: 'Implement optimistic updates for all CRUD operations to improve perceived performance.',
    priority: 'High',
    sortOrder: 310,
  },
  {
    sourceKey: 'data-migration-scripts',
    category: 'Data & State Management',
    title: 'Data Migration Scripts',
    description: 'Create scripts for handling schema changes in Firestore.',
    priority: 'High',
    sortOrder: 320,
  },
  {
    sourceKey: 'data-backup-strategy',
    category: 'Data & State Management',
    title: 'Backup Strategy',
    description: 'Configure automated daily backups for the Firestore database.',
    priority: 'High',
    sortOrder: 330,
  },
  {
    sourceKey: 'ai-prompt-engineering-versioning',
    category: 'AI/LLM Optimization',
    title: 'Prompt Engineering Versioning',
    description: 'Store and version all prompt templates in Firestore.',
    priority: 'High',
    sortOrder: 400,
  },
  {
    sourceKey: 'ai-cost-tracking',
    category: 'AI/LLM Optimization',
    title: 'Cost Tracking',
    description: 'Implement granular cost tracking per user and project for AI usage.',
    priority: 'High',
    sortOrder: 410,
  },
  {
    sourceKey: 'ai-model-fallback',
    category: 'AI/LLM Optimization',
    title: 'Model Fallback',
    description: 'Implement logic to fallback to alternative models if the primary model fails.',
    priority: 'High',
    sortOrder: 420,
  },
  {
    sourceKey: 'ai-response-streaming',
    category: 'AI/LLM Optimization',
    title: 'Response Streaming',
    description: 'Transition AI responses to streaming for better user experience in long-form content.',
    priority: 'Medium',
    sortOrder: 430,
  },
  {
    sourceKey: 'ux-comprehensive-error-boundaries',
    category: 'User Experience (UX)',
    title: 'Comprehensive Error Boundaries',
    description: 'Ensure every major component is wrapped in an Error Boundary with recovery options.',
    priority: 'High',
    sortOrder: 500,
  },
  {
    sourceKey: 'ux-accessibility-audit',
    category: 'User Experience (UX)',
    title: 'Accessibility (A11y) Audit',
    description: 'Perform a full accessibility audit (WCAG 2.1) and fix identified issues.',
    priority: 'High',
    sortOrder: 510,
  },
  {
    sourceKey: 'ux-performance-profiling',
    category: 'User Experience (UX)',
    title: 'Performance Profiling',
    description: 'Optimize bundle size and initial load time for LCP, FID, and CLS.',
    priority: 'High',
    sortOrder: 520,
  },
  {
    sourceKey: 'ux-user-feedback-loop',
    category: 'User Experience (UX)',
    title: 'User Feedback Loop',
    description: 'Add an in-app feedback mechanism for users to report bugs or suggest features.',
    priority: 'Medium',
    sortOrder: 530,
  },
  {
    sourceKey: 'business-subscription-management',
    category: 'Business & Compliance',
    title: 'Subscription Management',
    description: 'Integrate Stripe for billing and subscription management.',
    priority: 'High',
    sortOrder: 600,
  },
  {
    sourceKey: 'business-terms-privacy-policy',
    category: 'Business & Compliance',
    title: 'Terms of Service & Privacy Policy',
    description: 'Draft and integrate legal documents.',
    priority: 'High',
    sortOrder: 610,
  },
  {
    sourceKey: 'business-gdpr-ccpa-compliance',
    category: 'Business & Compliance',
    title: 'GDPR/CCPA Compliance',
    description: 'Implement data deletion and export requests for users.',
    priority: 'Critical',
    sortOrder: 620,
  },
  {
    sourceKey: 'business-analytics',
    category: 'Business & Compliance',
    title: 'Analytics',
    description: 'Integrate Mixpanel or Google Analytics for user behavior tracking.',
    priority: 'Medium',
    sortOrder: 630,
  },
  {
    sourceKey: 'testing-unit-tests-coverage',
    category: 'Testing',
    title: 'Unit Tests',
    description: 'Achieve more than 80 percent coverage for core utility functions and hooks.',
    priority: 'High',
    sortOrder: 700,
  },
  {
    sourceKey: 'testing-integration-tests',
    category: 'Testing',
    title: 'Integration Tests',
    description: 'Test critical flows like onboarding, project creation, and AI generation.',
    priority: 'High',
    sortOrder: 710,
  },
  {
    sourceKey: 'testing-end-to-end-tests',
    category: 'Testing',
    title: 'End-to-End (E2E) Tests',
    description: 'Implement Playwright or Cypress tests for the most critical user paths.',
    priority: 'High',
    sortOrder: 720,
  },
  {
    sourceKey: 'testing-load-testing',
    category: 'Testing',
    title: 'Load Testing',
    description: 'Simulate high concurrent user traffic to identify bottlenecks.',
    priority: 'Medium',
    sortOrder: 730,
  },
];

export function buildProductionTasks(projectId: string, timestamp = new Date().toISOString()): Array<Omit<Task, 'id'>> {
  return productionTaskTemplates.map((template) => ({
    projectId,
    title: template.title,
    description: template.description,
    status: 'planned',
    priority: template.priority,
    category: template.category,
    sourceDocument: PRODUCTION_TASK_SOURCE_DOCUMENT,
    sourceKey: template.sourceKey,
    sortOrder: template.sortOrder,
    createdAt: timestamp,
    updatedAt: timestamp,
  }));
}

export async function seedProductionTasksForProject(projectId: string) {
  const { data: existingRows, error: existingError } = await supabase!
    .from('tasks')
    .select('source_key')
    .eq('project_id', projectId)
    .eq('source_document', PRODUCTION_TASK_SOURCE_DOCUMENT);

  if (existingError) {
    throw existingError;
  }

  const existingSourceKeys = new Set((existingRows || []).map((row) => row.source_key).filter(Boolean));
  const timestamp = new Date().toISOString();
  const rowsToInsert = buildProductionTasks(projectId, timestamp)
    .filter((task) => !existingSourceKeys.has(task.sourceKey))
    .map((task) => ({
      id: `${projectId}:${task.sourceKey}`,
      project_id: task.projectId,
      title: task.title,
      description: task.description,
      status: task.status,
      priority: task.priority,
      category: task.category,
      source_document: task.sourceDocument,
      source_key: task.sourceKey,
      sort_order: task.sortOrder,
      created_at: task.createdAt,
      updated_at: task.updatedAt,
    }));

  if (rowsToInsert.length === 0) {
    return 0;
  }

  const { error: insertError } = await supabase!
    .from('tasks')
    .insert(rowsToInsert);

  if (insertError) {
    throw insertError;
  }

  return rowsToInsert.length;
}