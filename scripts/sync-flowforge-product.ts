import { createClient } from '@supabase/supabase-js';
import {
  FLOWFORGE_PROJECT_SLUG,
  FLOWFORGE_SYSTEM_OWNER,
  flowforgeComponentSeeds,
  flowforgeFeatureSeeds,
  flowforgeLayoutSeeds,
  flowforgePageSeeds,
  flowforgeProjectSeed,
  flowforgeUserflowSeeds,
} from '../src/lib/supabase/flowforgeCatalog';

function required(name: string) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing environment variable ${name}`);
  }
  return value;
}

function createAdminClient() {
  return createClient(
    required('VITE_SUPABASE_URL'),
    required('SUPABASE_SERVICE_ROLE_KEY'),
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
}

async function main() {
  const supabase = createAdminClient();
  const syncTimestamp = new Date().toISOString();

  const projectPayload = {
    ...flowforgeProjectSeed,
    last_synced_at: syncTimestamp,
    catalog_metadata: {
      ...flowforgeProjectSeed.catalog_metadata,
      last_seed_reason: 'flowforge-product-sync',
      synced_at: syncTimestamp,
    },
  };

  const { data: projectRow, error: projectError } = await supabase
    .from('projects')
    .upsert(projectPayload, { onConflict: 'slug' })
    .select('id, slug')
    .single();

  if (projectError || !projectRow) {
    throw new Error(`Failed to upsert project ${FLOWFORGE_PROJECT_SLUG}: ${projectError?.message ?? 'unknown error'}`);
  }

  const projectId = projectRow.id;

  const { error: memberError } = await supabase
    .from('project_members')
    .upsert(
      {
        project_id: projectId,
        member_auth_id: FLOWFORGE_SYSTEM_OWNER,
        role: 'owner',
      },
      { onConflict: 'project_id,member_auth_id' }
    );

  if (memberError) {
    throw new Error(`Failed to ensure project owner membership: ${memberError.message}`);
  }

  const pageRows = flowforgePageSeeds.map((page) => ({ ...page, project_id: projectId }));
  const { error: pageError } = await supabase.from('pages').upsert(pageRows, { onConflict: 'project_id,slug' });
  if (pageError) {
    throw new Error(`Failed to upsert pages: ${pageError.message}`);
  }

  const { data: pageLookupRows, error: pageLookupError } = await supabase
    .from('pages')
    .select('id, slug')
    .eq('project_id', projectId);
  if (pageLookupError) {
    throw new Error(`Failed to load pages after upsert: ${pageLookupError.message}`);
  }
  const pageIdBySlug = new Map((pageLookupRows ?? []).map((row) => [row.slug, row.id]));

  for (const layoutSeed of flowforgeLayoutSeeds) {
    const pageId = pageIdBySlug.get(layoutSeed.pageSlug);
    if (!pageId) {
      throw new Error(`Missing page for layout seed ${layoutSeed.pageSlug}`);
    }

    const layoutPayload = {
      page_id: pageId,
      name: layoutSeed.name,
      layout_type: layoutSeed.layout_type,
      description: layoutSeed.description,
      breakpoint: layoutSeed.breakpoint,
      grid_definition: layoutSeed.grid_definition,
      notes: layoutSeed.notes,
      version: layoutSeed.version,
      is_primary: layoutSeed.is_primary,
    };

    const { data: existingLayout, error: existingLayoutError } = await supabase
      .from('page_layouts')
      .select('id')
      .eq('page_id', pageId)
      .eq('is_primary', true)
      .maybeSingle();

    if (existingLayoutError) {
      throw new Error(`Failed to load layout for page ${layoutSeed.pageSlug}: ${existingLayoutError.message}`);
    }

    if (existingLayout && existingLayout.id) {
      const { error: updateLayoutError } = await supabase
        .from('page_layouts')
        .update(layoutPayload)
        .eq('id', existingLayout.id);

      if (updateLayoutError) {
        throw new Error(`Failed to update layout for page ${layoutSeed.pageSlug}: ${updateLayoutError.message}`);
      }
    } else {
      const { error: insertLayoutError } = await supabase.from('page_layouts').insert(layoutPayload);
      if (insertLayoutError) {
        throw new Error(`Failed to insert layout for page ${layoutSeed.pageSlug}: ${insertLayoutError.message}`);
      }
    }
  }

  const componentRows = flowforgeComponentSeeds.map((component) => ({ ...component, project_id: projectId }));
  const { error: componentError } = await supabase
    .from('components')
    .upsert(componentRows, { onConflict: 'project_id,slug' });
  if (componentError) {
    throw new Error(`Failed to upsert components: ${componentError.message}`);
  }

  const { data: componentLookupRows, error: componentLookupError } = await supabase
    .from('components')
    .select('id, slug')
    .eq('project_id', projectId);
  if (componentLookupError) {
    throw new Error(`Failed to load components after upsert: ${componentLookupError.message}`);
  }
  const componentIdBySlug = new Map((componentLookupRows ?? []).map((row) => [row.slug, row.id]));

  const featureRows = flowforgeFeatureSeeds.map(({ pageSlugs, componentSlugs, userflowSlugs, ...feature }) => ({
    ...feature,
    project_id: projectId,
  }));
  const { error: featureError } = await supabase
    .from('feature_cards')
    .upsert(featureRows, { onConflict: 'project_id,slug' });
  if (featureError) {
    throw new Error(`Failed to upsert feature cards: ${featureError.message}`);
  }

  const { data: featureLookupRows, error: featureLookupError } = await supabase
    .from('feature_cards')
    .select('id, slug')
    .eq('project_id', projectId);
  if (featureLookupError) {
    throw new Error(`Failed to load features after upsert: ${featureLookupError.message}`);
  }
  const featureIdBySlug = new Map((featureLookupRows ?? []).map((row) => [row.slug, row.id]));

  const userflowRows = flowforgeUserflowSeeds.map(({ steps, ...userflow }) => ({ ...userflow, project_id: projectId }));
  const { error: userflowError } = await supabase
    .from('userflows')
    .upsert(userflowRows, { onConflict: 'project_id,slug' });
  if (userflowError) {
    throw new Error(`Failed to upsert userflows: ${userflowError.message}`);
  }

  const { data: userflowLookupRows, error: userflowLookupError } = await supabase
    .from('userflows')
    .select('id, slug')
    .eq('project_id', projectId);
  if (userflowLookupError) {
    throw new Error(`Failed to load userflows after upsert: ${userflowLookupError.message}`);
  }
  const userflowIdBySlug = new Map((userflowLookupRows ?? []).map((row) => [row.slug, row.id]));

  const userflowStepRows = flowforgeUserflowSeeds.flatMap((userflow) => {
    const userflowId = userflowIdBySlug.get(userflow.slug);
    if (!userflowId) {
      throw new Error(`Missing userflow for step seed ${userflow.slug}`);
    }

    return userflow.steps.map((step) => {
      const pageId = pageIdBySlug.get(step.pageSlug);
      if (!pageId) {
        throw new Error(`Missing page ${step.pageSlug} for userflow ${userflow.slug}`);
      }

      return {
        userflow_id: userflowId,
        page_id: pageId,
        step_order: step.step_order,
        step_name: step.step_name,
        is_optional: step.is_optional,
        condition: step.condition,
        notes: step.notes,
      };
    });
  });

  if (userflowStepRows.length > 0) {
    const userflowIds = [...new Set(userflowStepRows.map((row) => row.userflow_id))];
    const { error: clearUserflowStepsError } = await supabase
      .from('userflow_pages')
      .delete()
      .in('userflow_id', userflowIds);
    if (clearUserflowStepsError) {
      throw new Error(`Failed to replace userflow steps: ${clearUserflowStepsError.message}`);
    }

    const { error: insertUserflowStepsError } = await supabase.from('userflow_pages').insert(userflowStepRows);
    if (insertUserflowStepsError) {
      throw new Error(`Failed to insert userflow steps: ${insertUserflowStepsError.message}`);
    }
  }

  const featurePageRows = flowforgeFeatureSeeds.flatMap((feature) => {
    const featureCardId = featureIdBySlug.get(feature.slug);
    if (!featureCardId) {
      throw new Error(`Missing feature card ${feature.slug}`);
    }

    return feature.pageSlugs.map((pageSlug) => {
      const pageId = pageIdBySlug.get(pageSlug);
      if (!pageId) {
        throw new Error(`Missing page ${pageSlug} for feature ${feature.slug}`);
      }

      return { feature_card_id: featureCardId, page_id: pageId };
    });
  });

  if (featurePageRows.length > 0) {
    const { error: featurePageError } = await supabase
      .from('feature_card_pages')
      .upsert(featurePageRows, { onConflict: 'feature_card_id,page_id' });
    if (featurePageError) {
      throw new Error(`Failed to upsert feature-page relationships: ${featurePageError.message}`);
    }
  }

  const featureComponentRows = flowforgeFeatureSeeds.flatMap((feature) => {
    const featureCardId = featureIdBySlug.get(feature.slug);
    if (!featureCardId) {
      throw new Error(`Missing feature card ${feature.slug}`);
    }

    return feature.componentSlugs.map((componentSlug) => {
      const componentId = componentIdBySlug.get(componentSlug);
      if (!componentId) {
        throw new Error(`Missing component ${componentSlug} for feature ${feature.slug}`);
      }

      return { feature_card_id: featureCardId, component_id: componentId };
    });
  });

  if (featureComponentRows.length > 0) {
    const { error: featureComponentError } = await supabase
      .from('feature_card_components')
      .upsert(featureComponentRows, { onConflict: 'feature_card_id,component_id' });
    if (featureComponentError) {
      throw new Error(`Failed to upsert feature-component relationships: ${featureComponentError.message}`);
    }
  }

  const featureUserflowRows = flowforgeFeatureSeeds.flatMap((feature) => {
    const featureCardId = featureIdBySlug.get(feature.slug);
    if (!featureCardId) {
      throw new Error(`Missing feature card ${feature.slug}`);
    }

    return feature.userflowSlugs.map((userflowSlug) => {
      const userflowId = userflowIdBySlug.get(userflowSlug);
      if (!userflowId) {
        throw new Error(`Missing userflow ${userflowSlug} for feature ${feature.slug}`);
      }

      return { feature_card_id: featureCardId, userflow_id: userflowId };
    });
  });

  if (featureUserflowRows.length > 0) {
    const { error: featureUserflowError } = await supabase
      .from('feature_card_userflows')
      .upsert(featureUserflowRows, { onConflict: 'feature_card_id,userflow_id' });
    if (featureUserflowError) {
      throw new Error(`Failed to upsert feature-userflow relationships: ${featureUserflowError.message}`);
    }
  }

  const { data: overviewRow, error: overviewError } = await supabase
    .from('project_overviews')
    .select('slug, feature_count, page_count, component_count, userflow_count, member_count, last_activity')
    .eq('slug', FLOWFORGE_PROJECT_SLUG)
    .single();

  if (overviewError || !overviewRow) {
    throw new Error(`Failed to load synced project overview: ${overviewError.message}`);
  }

  console.log(`Synced ${overviewRow.slug}`);
  console.log(`Features: ${overviewRow.feature_count}`);
  console.log(`Pages: ${overviewRow.page_count}`);
  console.log(`Components: ${overviewRow.component_count}`);
  console.log(`Userflows: ${overviewRow.userflow_count}`);
  console.log(`Members: ${overviewRow.member_count}`);
  console.log(`Last activity: ${overviewRow.last_activity}`);
}

void main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});