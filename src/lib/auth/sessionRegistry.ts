import type { Session } from '@supabase/supabase-js';
import { supabase, type AuthenticatedUser } from '../supabase/appClient';

export type AuthDeviceSessionRecord = {
  id: string;
  deviceName: string | null;
  platform: string | null;
  browser: string | null;
  userAgent: string | null;
  providerKey: string | null;
  isTrusted: boolean;
  expiresAt: string | null;
  lastSeenAt: string;
  revokedAt: string | null;
  revokeReason: string | null;
  createdAt: string;
  updatedAt: string;
};

function decodeJwtPayload(token: string) {
  const payload = token.split('.')[1];
  if (!payload) {
    return null;
  }

  try {
    const normalizedPayload = payload.replace(/-/g, '+').replace(/_/g, '/');
    const decodedPayload = atob(normalizedPayload);
    return JSON.parse(decodedPayload) as Record<string, unknown>;
  } catch {
    return null;
  }
}

export function getSessionIdFromAccessToken(accessToken: string) {
  const payload = decodeJwtPayload(accessToken);
  return typeof payload?.session_id === 'string' ? payload.session_id : null;
}

function getBrowserName(userAgent: string) {
  if (userAgent.includes('Edg/')) {
    return 'Edge';
  }

  if (userAgent.includes('CriOS') || userAgent.includes('Chrome/')) {
    return 'Chrome';
  }

  if (userAgent.includes('FxiOS') || userAgent.includes('Firefox/')) {
    return 'Firefox';
  }

  if (userAgent.includes('Safari/')) {
    return 'Safari';
  }

  return 'Browser';
}

function getDeviceName() {
  if (typeof navigator === 'undefined') {
    return 'Unknown device';
  }

  const userAgent = navigator.userAgent;
  if (/iPad/i.test(userAgent)) {
    return 'iPad';
  }

  if (/Android/i.test(userAgent) && /Mobile/i.test(userAgent)) {
    return 'Android phone';
  }

  if (/Android/i.test(userAgent)) {
    return 'Android tablet';
  }

  if (/Macintosh/i.test(userAgent)) {
    return 'Mac';
  }

  if (/Windows/i.test(userAgent)) {
    return 'Windows PC';
  }

  return 'Current device';
}

function mapSessionRow(row: Record<string, unknown>): AuthDeviceSessionRecord {
  return {
    id: String(row.id),
    deviceName: (row.device_name as string | null) || null,
    platform: (row.platform as string | null) || null,
    browser: (row.browser as string | null) || null,
    userAgent: (row.user_agent as string | null) || null,
    providerKey: (row.provider_key as string | null) || null,
    isTrusted: Boolean(row.is_trusted),
    expiresAt: (row.expires_at as string | null) || null,
    lastSeenAt: String(row.last_seen_at),
    revokedAt: (row.revoked_at as string | null) || null,
    revokeReason: (row.revoke_reason as string | null) || null,
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

export async function syncAuthSessionRecord(session: Session, user: AuthenticatedUser) {
  if (!supabase) {
    return null;
  }

  const sessionId = getSessionIdFromAccessToken(session.access_token);
  if (!sessionId) {
    return null;
  }

  const { data: existingSession, error: existingSessionError } = await supabase
    .from('auth_device_sessions')
    .select('id, revoked_at')
    .eq('id', sessionId)
    .maybeSingle();

  if (existingSessionError) {
    throw existingSessionError;
  }

  if (existingSession?.revoked_at) {
    throw new Error('This session has already been revoked. Sign in again to continue.');
  }

  const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown';
  const platform = typeof navigator !== 'undefined' ? navigator.platform : 'unknown';
  const providerKey = session.user.app_metadata?.provider || user.providerData[0]?.providerId || null;

  const { error } = await supabase.from('auth_device_sessions').upsert(
    {
      id: sessionId,
      auth_user_id: session.user.id,
      app_user_id: user.uid,
      provider_key: providerKey,
      device_name: getDeviceName(),
      platform,
      browser: getBrowserName(userAgent),
      user_agent: userAgent,
      is_trusted: false,
      expires_at: session.expires_at ? new Date(session.expires_at * 1000).toISOString() : null,
      last_seen_at: new Date().toISOString(),
    },
    { onConflict: 'id' }
  );

  if (error) {
    throw error;
  }

  return sessionId;
}

export async function listMyAuthDeviceSessions() {
  if (!supabase) {
    return [] as AuthDeviceSessionRecord[];
  }

  const { data, error } = await supabase
    .from('auth_device_sessions')
    .select('id, device_name, platform, browser, user_agent, provider_key, is_trusted, expires_at, last_seen_at, revoked_at, revoke_reason, created_at, updated_at')
    .order('last_seen_at', { ascending: false });

  if (error) {
    throw error;
  }

  return (data || []).map((row) => mapSessionRow(row as Record<string, unknown>));
}

export async function setAuthDeviceTrusted(sessionId: string, isTrusted: boolean) {
  if (!supabase) {
    return;
  }

  const { error } = await supabase
    .from('auth_device_sessions')
    .update({ is_trusted: isTrusted, updated_at: new Date().toISOString() })
    .eq('id', sessionId);

  if (error) {
    throw error;
  }
}

export async function revokeAuthDeviceSession(sessionId: string, reason = 'manual_revocation') {
  if (!supabase) {
    return;
  }

  const { error } = await supabase
    .from('auth_device_sessions')
    .update({
      revoked_at: new Date().toISOString(),
      revoke_reason: reason,
      updated_at: new Date().toISOString(),
    })
    .eq('id', sessionId);

  if (error) {
    throw error;
  }
}

export async function revokeAllAuthDeviceSessions(authUserId: string, reason = 'global_sign_out') {
  if (!supabase) {
    return;
  }

  const { error } = await supabase
    .from('auth_device_sessions')
    .update({
      revoked_at: new Date().toISOString(),
      revoke_reason: reason,
      updated_at: new Date().toISOString(),
    })
    .eq('auth_user_id', authUserId)
    .is('revoked_at', null);

  if (error) {
    throw error;
  }
}