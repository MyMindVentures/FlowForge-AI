import { CodeReliabilityObject, CodeReliabilitySnapshot, DefinitionOfDoneChecklist, Feature, Task, UIComponent, UIPage } from '../types';

const SOURCE_FILES = import.meta.glob('../**/*.{ts,tsx}', {
  eager: true,
  query: '?raw',
  import: 'default'
}) as Record<string, string>;

const TEST_FILES = import.meta.glob('../**/*.{test,spec}.{ts,tsx}', {
  eager: true,
  query: '?raw',
  import: 'default'
}) as Record<string, string>;

const CRITICAL_PLACEHOLDER_PATTERN = /\b(TODO|FIXME|XXX|placeholder|stub|mock this)\b/gi;
const COMMENT_PATTERN = /^\s*(\/\/|\/\*|\*)/;
const FUNCTION_DECL_PATTERN = /(export\s+)?(async\s+)?function\s+([A-Za-z0-9_]+)/g;
const FUNCTION_LINE_PATTERN = /(export\s+)?(async\s+)?function\s+[A-Za-z0-9_]+/;

const toFilePath = (modulePath: string) => modulePath.replace(/^\.\.\//, 'src/');

const inferRelatedEntity = (filePath: string, pages: UIPage[], components: UIComponent[], features: Feature[]) => {
  const fileName = filePath.split('/').pop()?.replace(/\.(ts|tsx)$/, '') ?? '';
  const page = pages.find((p) => p.name.toLowerCase() === fileName.toLowerCase());
  const component = components.find((c) => c.name.toLowerCase() === fileName.toLowerCase());
  const feature = features.find((f) => filePath.toLowerCase().includes(f.featureCode.toLowerCase()) || filePath.toLowerCase().includes(f.title.toLowerCase().replace(/\s+/g, '-')));

  return {
    relatedPage: page?.name,
    relatedComponent: component?.name,
    relatedFeature: feature?.title
  };
};

const issueSeverityFor = (issueType: CodeReliabilityObject['issueType']): CodeReliabilityObject['severity'] => {
  switch (issueType) {
    case 'blocking_error':
    case 'test_failure':
      return 'Critical';
    case 'missing_implementation':
    case 'placeholder_detected':
      return 'High';
    case 'missing_tests':
    case 'linking_issue':
      return 'Medium';
    default:
      return 'Low';
  }
};

export class CodeReliabilityService {
  static buildVerification(projectId: string, pages: UIPage[], components: UIComponent[], features: Feature[], tasks: Task[]) {
    const now = new Date().toISOString();
    const objects: CodeReliabilityObject[] = [];

    const sourceEntries = Object.entries(SOURCE_FILES)
      .filter(([file]) => !file.includes('.test.') && !file.includes('.spec.') && !file.endsWith('vite-env.d.ts'));

    let totalFunctionsChecked = 0;
    let missingCommentsCount = 0;
    let placeholderDetections = 0;
    let testPassCount = 0;
    let testFailCount = 0;

    for (const [modulePath, raw] of sourceEntries) {
      const filePath = toFilePath(modulePath);
      const placeholderMatches = [...raw.matchAll(CRITICAL_PLACEHOLDER_PATTERN)];
      const hasCriticalPlaceholder = placeholderMatches.length > 0;
      placeholderDetections += placeholderMatches.length;

      const functionMatches = [...raw.matchAll(FUNCTION_DECL_PATTERN)];
      totalFunctionsChecked += functionMatches.length;

      const lines = raw.split('\n');
      let fileMissingComments = 0;
      for (let i = 0; i < lines.length; i++) {
        if (FUNCTION_LINE_PATTERN.test(lines[i])) {
          const prev1 = lines[i - 1] ?? '';
          const prev2 = lines[i - 2] ?? '';
          if (!COMMENT_PATTERN.test(prev1) && !COMMENT_PATTERN.test(prev2)) {
            fileMissingComments++;
          }
        }
      }
      missingCommentsCount += fileMissingComments;

      const normalized = filePath.replace(/\.(ts|tsx)$/g, '').replace(/^src\//, '');
      const linkedTest = Object.keys(TEST_FILES).find((testPath) => testPath.replace(/^\.\.\//, '').replace(/\.(test|spec)\.(ts|tsx)$/g, '') === normalized);
      const testState: CodeReliabilityObject['testState'] = linkedTest ? 'passing' : 'missing';
      if (linkedTest) testPassCount += 1;
      else testFailCount += 1;

      const related = inferRelatedEntity(filePath, pages, components, features);
      const linkedTask = tasks.find((t) => t.title.toLowerCase().includes((related.relatedPage ?? related.relatedComponent ?? '').toLowerCase()));
      const hasBlockingTask = tasks.some((t) => t.status === 'failing' || t.priority === 'Critical') || linkedTask?.status === 'failing';

      const dod: DefinitionOfDoneChecklist = {
        implementationExists: true,
        noCriticalPlaceholder: !hasCriticalPlaceholder,
        commentsAdded: fileMissingComments === 0,
        testsAdded: Boolean(linkedTest),
        testsPassing: Boolean(linkedTest) && !hasBlockingTask,
        uiVisibleWhereRelevant: filePath.includes('/components/') ? Boolean(related.relatedPage || related.relatedComponent) : true,
        linkedCorrectly: Boolean(related.relatedPage || related.relatedComponent || related.relatedFeature),
        noBlockingErrors: !hasBlockingTask
      };

      const unresolvedCheck = Object.values(dod).some((value) => !value);

      if (fileMissingComments > 0) {
        objects.push(this.buildObject({
          id: `${projectId}-comments-${normalized.replace(/[^a-zA-Z0-9]/g, '-')}`,
          projectId,
          objectType: filePath.endsWith('.tsx') ? 'component' : 'file',
          objectName: filePath.split('/').pop() ?? filePath,
          filePath,
          issueType: 'missing_comments',
          status: 'open',
          commentsState: 'missing',
          testState,
          placeholderState: hasCriticalPlaceholder ? 'critical' : 'clean',
          implementationState: 'implemented',
          related,
          dod,
          errorDetails: `${fileMissingComments} function(s) missing contextual comments.`,
          now
        }));
      }

      if (hasCriticalPlaceholder) {
        objects.push(this.buildObject({
          id: `${projectId}-placeholder-${normalized.replace(/[^a-zA-Z0-9]/g, '-')}`,
          projectId,
          objectType: filePath.endsWith('.tsx') ? 'component' : 'file',
          objectName: filePath.split('/').pop() ?? filePath,
          filePath,
          issueType: 'placeholder_detected',
          status: 'open',
          commentsState: fileMissingComments > 0 ? 'partial' : 'good',
          testState,
          placeholderState: placeholderMatches.length > 1 ? 'critical' : 'warning',
          implementationState: 'implemented',
          related,
          dod,
          errorDetails: `Placeholder markers found (${placeholderMatches.length}).`,
          now
        }));
      }

      if (!linkedTest) {
        objects.push(this.buildObject({
          id: `${projectId}-tests-${normalized.replace(/[^a-zA-Z0-9]/g, '-')}`,
          projectId,
          objectType: filePath.endsWith('.tsx') ? 'component' : 'file',
          objectName: filePath.split('/').pop() ?? filePath,
          filePath,
          issueType: 'missing_tests',
          status: 'open',
          commentsState: fileMissingComments > 0 ? 'partial' : 'good',
          testState: 'missing',
          placeholderState: hasCriticalPlaceholder ? 'warning' : 'clean',
          implementationState: 'implemented',
          related,
          dod,
          errorDetails: 'No matching test file detected for this code object.',
          now
        }));
      }

      if (unresolvedCheck && !related.relatedPage && !related.relatedComponent && filePath.includes('/components/')) {
        objects.push(this.buildObject({
          id: `${projectId}-link-${normalized.replace(/[^a-zA-Z0-9]/g, '-')}`,
          projectId,
          objectType: 'component',
          objectName: filePath.split('/').pop() ?? filePath,
          filePath,
          issueType: 'linking_issue',
          status: 'open',
          commentsState: fileMissingComments > 0 ? 'partial' : 'good',
          testState,
          placeholderState: hasCriticalPlaceholder ? 'warning' : 'clean',
          implementationState: 'implemented',
          related,
          dod,
          errorDetails: 'Component appears unlinked to tracked pages/features in project graph.',
          now
        }));
      }
    }

    const blockers = objects.filter((o) => o.severity === 'Critical' || o.issueType === 'blocking_error').length;
    const unstableModules = objects.filter((o) => o.placeholderState !== 'clean' || o.testState !== 'passing').length;
    const failingPages = new Set(objects.filter((o) => o.relatedPage && o.status === 'open').map((o) => o.relatedPage)).size;
    const outOfSyncRecords = tasks.filter((t) => t.status === 'out_of_sync').length;

    const releaseRisk: CodeReliabilitySnapshot['productionReadiness']['releaseRisk'] =
      blockers > 5 ? 'Critical' : blockers > 2 ? 'High' : unstableModules > 10 ? 'Medium' : 'Low';

    const snapshot: Omit<CodeReliabilitySnapshot, 'id'> = {
      projectId,
      totalFilesChecked: sourceEntries.length,
      totalFunctionsChecked,
      testPassCount,
      testFailCount,
      missingCommentsCount,
      placeholderDetections,
      definitionOfDoneStatus: objects.some((o) => Object.values(o.definitionOfDone).some((v) => !v)) ? 'failing' : 'passing',
      productionReadiness: {
        blockers,
        unstableModules,
        failingPages,
        outOfSyncRecords,
        releaseRisk
      },
      checkedAt: now,
      createdAt: now,
      updatedAt: now
    };

    return { objects, snapshot };
  }

  private static buildObject(input: {
    id: string;
    projectId: string;
    objectType: CodeReliabilityObject['objectType'];
    objectName: string;
    filePath: string;
    issueType: CodeReliabilityObject['issueType'];
    status: CodeReliabilityObject['status'];
    implementationState: CodeReliabilityObject['implementationState'];
    commentsState: CodeReliabilityObject['commentsState'];
    testState: CodeReliabilityObject['testState'];
    placeholderState: CodeReliabilityObject['placeholderState'];
    related: { relatedFeature?: string; relatedPage?: string; relatedComponent?: string };
    dod: DefinitionOfDoneChecklist;
    now: string;
    errorDetails?: string;
  }): CodeReliabilityObject {
    return {
      id: input.id,
      projectId: input.projectId,
      objectType: input.objectType,
      objectName: input.objectName,
      filePath: input.filePath,
      issueType: input.issueType,
      severity: issueSeverityFor(input.issueType),
      status: input.status,
      relatedFeature: input.related.relatedFeature,
      relatedPage: input.related.relatedPage,
      relatedComponent: input.related.relatedComponent,
      implementationState: input.implementationState,
      commentsState: input.commentsState,
      testState: input.testState,
      placeholderState: input.placeholderState,
      errorDetails: input.errorDetails,
      definitionOfDone: input.dod,
      lastCheckedAt: input.now,
      createdAt: input.now,
      updatedAt: input.now
    };
  }
}
