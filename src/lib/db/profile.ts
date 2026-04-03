import type { User as SupabaseUser } from '@supabase/supabase-js';
import { getDefaultAdminEmail, mapSupabaseUserToProviderData, setCurrentUser, supabase, type AuthenticatedUser } from '../../firebase';
import type { UserProfile } from '../../types';
import { mapDbRecordToApp } from './pathMap';

function defaultProfile(user: SupabaseUser): UserProfile {
  const isAdmin = (user.email || '').toLowerCase() === getDefaultAdminEmail().toLowerCase();
  const now = new Date().toISOString();

  return {
    uid: user.id,
    email: user.email || '',
    displayName: (user.user_metadata?.full_name as string | undefined) || (user.user_metadata?.name as string | undefined) || user.email || 'Anonymous',
    photoURL: (user.user_metadata?.avatar_url as string | undefined) || undefined,
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

    const profile = mapDbRecordToApp<UserProfile>(data);
    const authUser = toAuthenticatedUser(sessionUser, profile);
    setCurrentUser(authUser);
    return { profile, authUser };
  }

  const insertPayload = {
    id: sessionUser.id,
    ...updatePayload,
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

  const profile = mapDbRecordToApp<UserProfile>(data);
  const authUser = toAuthenticatedUser(sessionUser, profile);
  setCurrentUser(authUser);
  return { profile, authUser };
}