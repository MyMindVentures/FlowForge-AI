import { createClient } from '@supabase/supabase-js';
import type { ActivityItem, ChatMessage, Decision, Feature, InterviewMode, Project, VersionSnapshot } from './types';

function getSupabase() {
  const url = import.meta.env.VITE_SUPABASE_URL;
  const key =
    import.meta.env.VITE_SUPABASE_ANON_KEY ||
    import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
    import.meta.env.VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

  if (!url || !key) {
    throw new Error('Supabase environment variables are missing.');
  }

  return createClient(url, key);
}

/**
 * Returns true when Supabase environment config is present.
 */
export function isSupabaseReady(): boolean {
  return Boolean(
    import.meta.env.VITE_SUPABASE_URL &&
      (import.meta.env.VITE_SUPABASE_ANON_KEY ||
        import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
        import.meta.env.VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY),
  );
}

/**
 * Returns authenticated Supabase user id or null when unavailable.
 */
export async function getCurrentUserId(): Promise<string | null> {
  if (!isSupabaseReady()) return null;
  const supabase = getSupabase();
  const { data } = await supabase.auth.getUser();
  return data.user?.id ?? null;
}

/**
 * Lists projects and hydrates all project-related entities from Supabase tables.
 */
export async function listProjects(userId: string): Promise<Project[]> {
  const supabase = getSupabase();
  const { data, error } = await supabase.from('projects').select('*').eq('owner_id', userId).order('updated_at', { ascending: false });
  if (error) throw error;

  const rows = (data ?? []) as any[];
  return Promise.all(rows.map((row) => hydrateProject(row.id, row)));
}

/**
 * Creates a new project row in Supabase.
 */
export async function createProjectRecord(userId: string, payload: { name: string; description: string }): Promise<Project> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('projects')
    .insert({ owner_id: userId, name: payload.name, description: payload.description, roadmap: { MVP: [], Next: [], Later: [], Maybe: [] } })
    .select('*')
    .single();
  if (error) throw error;

  return hydrateProject(data.id, data);
}

/**
 * Updates project top-level columns and returns hydrated result.
 */
export async function updateProjectRecord(projectId: string, updates: Record<string, unknown>): Promise<Project> {
  const supabase = getSupabase();
  const { data, error } = await supabase.from('projects').update(updates).eq('id', projectId).select('*').single();
  if (error) throw error;

  return hydrateProject(projectId, data);
}

/**
 * Deletes a project row.
 */
export async function deleteProjectRecord(projectId: string): Promise<void> {
  const supabase = getSupabase();
  const { error } = await supabase.from('projects').delete().eq('id', projectId);
  if (error) throw error;
}

/**
 * Appends activity entry in activity_log table.
 */
export async function insertActivity(projectId: string, item: Omit<ActivityItem, 'id' | 'date'>): Promise<void> {
  const supabase = getSupabase();
  const { error } = await supabase.from('activity_log').insert({ project_id: projectId, type: item.type, title: item.title, reason: item.reason, impact: item.impact });
  if (error) throw error;
}

/**
 * Saves user and assistant chat messages in chat_sessions/chat_messages.
 */
export async function saveChatMessages(projectId: string, userId: string, mode: InterviewMode, messages: Array<Omit<ChatMessage, 'id' | 'timestamp'>>): Promise<void> {
  const supabase = getSupabase();
  const { data: session, error: sessionError } = await supabase.from('chat_sessions').insert({ project_id: projectId, mode, started_by: userId }).select('id').single();
  if (sessionError) throw sessionError;

  const { error } = await supabase.from('chat_messages').insert(
    messages.map((entry) => ({ chat_session_id: session.id, project_id: projectId, role: entry.role, mode: entry.mode, content: entry.content })),
  );
  if (error) throw error;
}

/**
 * Inserts a feature row and related feature_dependencies entries.
 */
export async function createFeatureRecord(projectId: string, feature: Omit<Feature, 'id' | 'createdAt' | 'updatedAt' | 'history'>): Promise<void> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('features')
    .insert({
      project_id: projectId,
      name: feature.name,
      description: feature.description,
      goal: feature.goal,
      user_value: feature.userValue,
      priority: feature.priority,
      status: feature.status,
      notes: feature.notes,
      decision_ids: feature.decisionIds,
      history: ['Feature added'],
    })
    .select('id')
    .single();
  if (error) throw error;

  if (feature.dependencies.length) {
    const { error: depError } = await supabase.from('feature_dependencies').insert(
      feature.dependencies.map((dep) => ({ project_id: projectId, feature_id: data.id, depends_on_feature_id: dep })),
    );
    if (depError) throw depError;
  }
}

/**
 * Updates feature row and dependency links.
 */
export async function updateFeatureRecord(projectId: string, featureId: string, updates: Partial<Feature>): Promise<void> {
  const supabase = getSupabase();
  const patch: Record<string, unknown> = {};
  if (updates.name !== undefined) patch.name = updates.name;
  if (updates.description !== undefined) patch.description = updates.description;
  if (updates.goal !== undefined) patch.goal = updates.goal;
  if (updates.userValue !== undefined) patch.user_value = updates.userValue;
  if (updates.priority !== undefined) patch.priority = updates.priority;
  if (updates.status !== undefined) patch.status = updates.status;
  if (updates.notes !== undefined) patch.notes = updates.notes;
  if (updates.decisionIds !== undefined) patch.decision_ids = updates.decisionIds;
  if (updates.history !== undefined) patch.history = updates.history;

  if (Object.keys(patch).length) {
    const { error } = await supabase.from('features').update(patch).eq('project_id', projectId).eq('id', featureId);
    if (error) throw error;
  }

  if (updates.dependencies) {
    await supabase.from('feature_dependencies').delete().eq('project_id', projectId).eq('feature_id', featureId);
    if (updates.dependencies.length) {
      const { error } = await supabase.from('feature_dependencies').insert(
        updates.dependencies.map((dep) => ({ project_id: projectId, feature_id: featureId, depends_on_feature_id: dep })),
      );
      if (error) throw error;
    }
  }
}

/**
 * Inserts a decision record.
 */
export async function createDecisionRecord(projectId: string, decision: Omit<Decision, 'id' | 'date'>): Promise<void> {
  const supabase = getSupabase();
  const { error } = await supabase
    .from('decisions')
    .insert({ project_id: projectId, title: decision.title, reasoning: decision.reasoning, linked_feature_ids: decision.linkedFeatureIds, impact: decision.impact });
  if (error) throw error;
}

/**
 * Persists a project version snapshot.
 */
export async function saveProjectVersion(projectId: string, version: Omit<VersionSnapshot, 'id' | 'createdAt'>): Promise<void> {
  const supabase = getSupabase();
  const { error } = await supabase
    .from('project_versions')
    .insert({ project_id: projectId, label: version.label, summary: version.summary, changed_items: version.changedItems, project_snapshot: version.projectSnapshot });
  if (error) throw error;
}

/**
 * Saves handoff outputs in developer_handoffs table.
 */
export async function saveDeveloperHandoff(projectId: string, userId: string, summary: string, payload: Record<string, unknown>): Promise<void> {
  const supabase = getSupabase();
  const { error } = await supabase.from('developer_handoffs').insert({ project_id: projectId, generated_by: userId, summary, payload });
  if (error) throw error;
}

async function hydrateProject(projectId: string, row?: any): Promise<Project> {
  const supabase = getSupabase();
  const projectRow = row ?? (await supabase.from('projects').select('*').eq('id', projectId).single()).data;

  const [featuresRes, depsRes, decisionsRes, versionsRes, activityRes, messagesRes] = await Promise.all([
    supabase.from('features').select('*').eq('project_id', projectId).order('updated_at', { ascending: false }),
    supabase.from('feature_dependencies').select('*').eq('project_id', projectId),
    supabase.from('decisions').select('*').eq('project_id', projectId).order('created_at', { ascending: false }),
    supabase.from('project_versions').select('*').eq('project_id', projectId).order('created_at', { ascending: false }),
    supabase.from('activity_log').select('*').eq('project_id', projectId).order('created_at', { ascending: false }),
    supabase.from('chat_messages').select('*').eq('project_id', projectId).order('created_at', { ascending: true }),
  ]);

  const dependenciesByFeature = new Map<string, string[]>();
  for (const dep of (depsRes.data ?? []) as any[]) {
    const current = dependenciesByFeature.get(dep.feature_id) ?? [];
    dependenciesByFeature.set(dep.feature_id, [...current, dep.depends_on_feature_id]);
  }

  const features: Feature[] = ((featuresRes.data ?? []) as any[]).map((feature) => ({
    id: feature.id,
    name: feature.name,
    description: feature.description,
    goal: feature.goal,
    userValue: feature.user_value,
    priority: feature.priority,
    status: feature.status,
    dependencies: dependenciesByFeature.get(feature.id) ?? [],
    notes: feature.notes,
    decisionIds: feature.decision_ids ?? [],
    history: feature.history ?? [],
    createdAt: feature.created_at,
    updatedAt: feature.updated_at,
  }));

  return {
    id: projectRow.id,
    name: projectRow.name,
    description: projectRow.description,
    status: projectRow.status,
    updatedAt: projectRow.updated_at,
    currentVersion: projectRow.current_version,
    activeMode: projectRow.active_mode,
    interviewPhase: projectRow.interview_phase,
    vision: projectRow.vision,
    problem: projectRow.problem,
    targetUsers: projectRow.target_users ?? [],
    features,
    mvpScope: projectRow.mvp_scope ?? [],
    futureIdeas: projectRow.future_ideas ?? [],
    openQuestions: projectRow.open_questions ?? [],
    decisions: ((decisionsRes.data ?? []) as any[]).map((decision) => ({
      id: decision.id,
      title: decision.title,
      reasoning: decision.reasoning,
      date: decision.created_at,
      linkedFeatureIds: decision.linked_feature_ids ?? [],
      impact: decision.impact,
    })),
    versions: ((versionsRes.data ?? []) as any[]).map((version) => ({
      id: version.id,
      label: version.label,
      createdAt: version.created_at,
      summary: version.summary,
      changedItems: version.changed_items ?? [],
      projectSnapshot: version.project_snapshot ?? {
        vision: '',
        problem: '',
        targetUsers: [],
        mvpScope: [],
        futureIdeas: [],
        openQuestions: [],
        userFlow: [],
        developerSummary: '',
      },
    })),
    activity: ((activityRes.data ?? []) as any[]).map((activity) => ({
      id: activity.id,
      type: activity.type,
      title: activity.title,
      reason: activity.reason,
      impact: activity.impact,
      date: activity.created_at,
    })),
    roadmap: projectRow.roadmap ?? { MVP: [], Next: [], Later: [], Maybe: [] },
    userFlow: projectRow.user_flow ?? [],
    developerSummary: projectRow.developer_summary,
    chatMessages: ((messagesRes.data ?? []) as any[]).map((message) => ({
      id: message.id,
      role: message.role,
      mode: message.mode,
      content: message.content,
      timestamp: message.created_at,
    })),
  };
}
