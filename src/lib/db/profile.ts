import type { User as SupabaseUser } from '@supabase/supabase-js';
import { getDefaultAdminEmail, mapSupabaseUserToProviderData, setCurrentUser, supabase, type AuthenticatedUser } from '../../lib/supabase/appClient';
import type { UserProfile } from '../../types';
import { mapDbRecordToApp } from './pathMap';

function mapAppUserProfile(record: Record<string, unknown>, fallbackUid: string): UserProfile {
  const mapped = mapDbRecordToApp<UserProfile & { id?: string }>(record);
  const recordId = typeof record.id === 'string' ? record.id : fallbackUid;

  return {
    ...mapped,
    uid: mapped.uid || recordId,
  };
}

function defaultProfile(user: SupabaseUser): UserProfile {
  const isAdmin = (user.email || '').toLowerCase() === getDefaultAdminEmail().toLowerCase();
  const now = new Date().toISOString();
  const firstName = user.user_metadata?.first_name as string | undefined;
  const lastName = user.user_metadata?.last_name as string | undefined;
  const aliasName = user.user_metadata?.alias_name as string | undefined;
  const githubUsername = (user.user_metadata?.user_name as string | undefined)
    || (user.user_metadata?.preferred_username as string | undefined)
    || undefined;
  const githubProfileUrl = (user.user_metadata?.profile as string | undefined)
    || (user.user_metadata?.html_url as string | undefined)
    || undefined;
  const githubAvatarUrl = (user.user_metadata?.avatar_url as string | undefined) || undefined;

  return {
    uid: user.id,
    email: user.email || '',
    displayName: (user.user_metadata?.full_name as string | undefined) || (user.user_metadata?.name as string | undefined) || user.email || 'Anonymous',
    photoURL: (user.user_metadata?.avatar_url as string | undefined) || undefined,
    firstName,
    lastName,
    aliasName,
    secondaryEmail: (user.user_metadata?.secondary_email as string | undefined) || undefined,
    phone: (user.user_metadata?.phone as string | undefined) || undefined,
    jobTitle: (user.user_metadata?.job_title as string | undefined) || undefined,
    functionTitle: (user.user_metadata?.function_title as string | undefined) || undefined,
    organizationId: (user.user_metadata?.organization_id as string | undefined) || undefined,
    organizationName: (user.user_metadata?.organization_name as string | undefined) || undefined,
    githubUsername,
    githubProfileUrl,
    githubPrimaryEmail: (user.user_metadata?.github_primary_email as string | undefined) || undefined,
    githubAvatarUrl,
    githubUserId: (user.user_metadata?.github_user_id as string | undefined) || undefined,
    bio: (user.user_metadata?.bio as string | undefined) || undefined,
    role: isAdmin ? 'Admin' : 'Builder',
    onboarded: isAdmin,
    storytellingCompleted: isAdmin,
    createdAt: now,
    updatedAt: now,
    lastLogin: now,
    settings: {
      theme: 'dark',
      notifications: true,
    },
  };
}

function toAuthenticatedUser(sessionUser: SupabaseUser, profile: UserProfile): AuthenticatedUser {
  return {
    uid: profile.uid,
    authUserId: sessionUser.id,
    email: profile.email || sessionUser.email || null,
    displayName: profile.displayName || (sessionUser.user_metadata?.full_name as string | undefined) || null,
    photoURL: profile.photoURL || (sessionUser.user_metadata?.avatar_url as string | undefined) || null,
    emailVerified: Boolean(sessionUser.email_confirmed_at),
    isAnonymous: false,
    tenantId: null,
    providerData: mapSupabaseUserToProviderData(sessionUser),
  };
}

/**
 * Ensures the authenticated Supabase user has a corresponding FlowForge app profile.
 */
export async function ensureUserProfile(sessionUser: SupabaseUser) {
  const byAuthUser = await supabase
    .from('app_users')
    .select('*')
    .eq('auth_user_id', sessionUser.id)
    .maybeSingle();

  if (byAuthUser.error) {
    throw byAuthUser.error;
  }

  let row = byAuthUser.data;

  if (!row && sessionUser.email) {
    const byEmail = await supabase
      .from('app_users')
      .select('*')
      .eq('email', sessionUser.email)
      .maybeSingle();

    if (byEmail.error) {
      throw byEmail.error;
    }

    row = byEmail.data;
  }

  const baseProfile = defaultProfile(sessionUser);
  const updatePayload = {
    auth_user_id: sessionUser.id,
    email: sessionUser.email || baseProfile.email,
    display_name: (sessionUser.user_metadata?.full_name as string | undefined) || (sessionUser.user_metadata?.name as string | undefined) || baseProfile.displayName,
    photo_url: (sessionUser.user_metadata?.avatar_url as string | undefined) || baseProfile.photoURL || null,
    last_login: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  if (row) {
    const { data, error } = await supabase
      .from('app_users')
      .update(updatePayload)
      .eq('id', row.id)
      .select('*')
      .single();

    if (error) {
      throw error;
    }

    const profile = mapAppUserProfile(data as Record<string, unknown>, sessionUser.id);
    const authUser = toAuthenticatedUser(sessionUser, profile);
    setCurrentUser(authUser);
    return { profile, authUser };
  }

  const insertPayload = {
    id: sessionUser.id,
    ...updatePayload,
    first_name: baseProfile.firstName || null,
    last_name: baseProfile.lastName || null,
    alias_name: baseProfile.aliasName || null,
    secondary_email: baseProfile.secondaryEmail || null,
    phone: baseProfile.phone || null,
    job_title: baseProfile.jobTitle || null,
    function_title: baseProfile.functionTitle || null,
    organization_name: baseProfile.organizationName || null,
    organization_id: baseProfile.organizationId || null,
    github_username: baseProfile.githubUsername || null,
    github_profile_url: baseProfile.githubProfileUrl || null,
    github_primary_email: baseProfile.githubPrimaryEmail || null,
    github_avatar_url: baseProfile.githubAvatarUrl || null,
    github_user_id: baseProfile.githubUserId || null,
    bio: baseProfile.bio || null,
    role: baseProfile.role,
    onboarded: baseProfile.onboarded,
    storytelling_completed: baseProfile.storytellingCompleted,
    created_at: baseProfile.createdAt,
    settings: baseProfile.settings,
  };

  const { data, error } = await supabase
    .from('app_users')
    .insert(insertPayload)
    .select('*')
    .single();

  if (error) {
    throw error;
  }

  const profile = mapAppUserProfile(data as Record<string, unknown>, sessionUser.id);
  const authUser = toAuthenticatedUser(sessionUser, profile);
  setCurrentUser(authUser);
  return { profile, authUser };
}

