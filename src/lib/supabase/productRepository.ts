import { getSupabaseClient } from './client';
import type {
  ProductFeatureCardInsert,
  ProductFeatureCardRow,
  ProductPageInsert,
  ProductPageLayoutInsert,
  ProductPageLayoutRow,
  ProductPageRow,
  ProductProjectOverviewRow,
  ProductProjectInsert,
  ProductProjectRow,
  ProductProjectUpdate,
  ProductUserflowInsert,
  ProductUserflowPageRow,
  ProductUserflowRow,
} from '../../types/productSchema';

export async function listProductProjects() {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .order('updated_at', { ascending: false });

  if (error) {
    throw error;
  }

  return (data ?? []) as ProductProjectRow[];
}

export async function listProductProjectOverviews(options?: {
  visibility?: 'private' | 'internal' | 'shared' | 'public';
  limit?: number;
}) {
  const supabase = getSupabaseClient();
  let query = supabase
    .from('project_overviews')
    .select('*')
    .order('featured_rank', { ascending: false })
    .order('last_activity', { ascending: false });

  if (options?.visibility) {
    query = query.eq('visibility', options.visibility);
  }

  if (options?.limit) {
    query = query.limit(options.limit);
  }

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  return (data ?? []) as ProductProjectOverviewRow[];
}

export async function getProductProjectBySlug(slug: string) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('slug', slug)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return (data ?? null) as ProductProjectRow | null;
}

export async function createProductProject(project: ProductProjectInsert) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('projects')
    .insert(project)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data as ProductProjectRow;
}

export async function upsertProductProject(project: ProductProjectInsert) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('projects')
    .upsert(project, { onConflict: 'slug' })
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data as ProductProjectRow;
}

export async function listProjectFeatureCards(projectId: string) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('feature_cards')
    .select('*')
    .eq('project_id', projectId)
    .order('updated_at', { ascending: false });

  if (error) {
    throw error;
  }

  return (data ?? []) as ProductFeatureCardRow[];
}

export async function createFeatureCard(featureCard: ProductFeatureCardInsert) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('feature_cards')
    .insert(featureCard)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data as ProductFeatureCardRow;
}

export async function listProjectPages(projectId: string) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('pages')
    .select('*')
    .eq('project_id', projectId)
    .order('updated_at', { ascending: false });

  if (error) {
    throw error;
  }

  return (data ?? []) as ProductPageRow[];
}

export async function createPage(page: ProductPageInsert) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('pages')
    .insert(page)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data as ProductPageRow;
}

export async function createPageLayout(layout: ProductPageLayoutInsert) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('page_layouts')
    .insert(layout)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data as ProductPageLayoutRow;
}

export async function listProjectUserflows(projectId: string) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('userflows')
    .select('*')
    .eq('project_id', projectId)
    .order('updated_at', { ascending: false });

  if (error) {
    throw error;
  }

  return (data ?? []) as ProductUserflowRow[];
}

export async function createUserflow(userflow: ProductUserflowInsert) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('userflows')
    .insert(userflow)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data as ProductUserflowRow;
}

export async function getUserflowSteps(userflowId: string) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('userflow_pages')
    .select('*')
    .eq('userflow_id', userflowId)
    .order('step_order', { ascending: true });

  if (error) {
    throw error;
  }

  return (data ?? []) as ProductUserflowPageRow[];
}

