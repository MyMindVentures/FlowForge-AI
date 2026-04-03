import React, { useEffect, useMemo, useState } from 'react';
import { LaptopMinimal, ShieldCheck, Smartphone, Tablet, Trash2 } from 'lucide-react';
import {
  type AuthDeviceSessionRecord,
  getSessionIdFromAccessToken,
  listMyAuthDeviceSessions,
  revokeAuthDeviceSession,
  setAuthDeviceTrusted,
} from '../lib/auth/sessionRegistry';
import { getInitialSession } from '../lib/supabase/appClient';
import { useAuth } from '../context/AuthContext';
import { AuditAction, AuditService } from '../services/audit';

function getSessionIcon(session: AuthDeviceSessionRecord) {
  const label = `${session.deviceName || ''} ${session.platform || ''}`.toLowerCase();
  if (label.includes('ipad') || label.includes('tablet')) {
    return Tablet;
  }

  if (label.includes('android') || label.includes('iphone') || label.includes('phone')) {
    return Smartphone;
  }

  return LaptopMinimal;
}

export default function AuthSessionPanel() {
  const { logout, logoutAllSessions } = useAuth();
  const [sessions, setSessions] = useState<AuthDeviceSessionRecord[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<string | null>(null);

  const activeSessions = useMemo(() => sessions.filter((session) => !session.revokedAt), [sessions]);

  const refreshSessions = async () => {
    setLoading(true);
    setError(null);

    try {
      const [nextSessions, currentSession] = await Promise.all([
        listMyAuthDeviceSessions(),
        getInitialSession(),
      ]);

      setSessions(nextSessions);
      setCurrentSessionId(currentSession?.access_token ? getSessionIdFromAccessToken(currentSession.access_token) : null);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Failed to load device sessions.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void refreshSessions();
  }, []);

  const handleTrustToggle = async (session: AuthDeviceSessionRecord) => {
    const actionKey = `trust:${session.id}`;
    setPendingAction(actionKey);

    try {
      await setAuthDeviceTrusted(session.id, !session.isTrusted);
      await AuditService.log(AuditAction.AUTH_TRUSTED_DEVICE_UPDATED, {
        sessionId: session.id,
        isTrusted: !session.isTrusted,
      });
      await refreshSessions();
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : 'Failed to update trusted device status.');
    } finally {
      setPendingAction(null);
    }
  };

  const handleRevoke = async (session: AuthDeviceSessionRecord) => {
    const actionKey = `revoke:${session.id}`;
    setPendingAction(actionKey);

    try {
      await revokeAuthDeviceSession(session.id);
      await AuditService.log(AuditAction.AUTH_SESSION_REVOKED, {
        sessionId: session.id,
      });

      if (session.id === currentSessionId) {
        await logout();
        return;
      }

      await refreshSessions();
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : 'Failed to revoke the selected session.');
    } finally {
      setPendingAction(null);
    }
  };

  return (
    <section className="rounded-2xl lg:rounded-3xl border border-white/10 bg-[#141414] p-6 lg:p-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-emerald-300">Sessions</p>
          <h3 className="mt-3 text-xl font-bold text-white">Device And Session Control</h3>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-400">Review trusted devices, revoke a specific session, or sign out every active device. FlowForge stores a user-scoped session registry to support tablet fleets and long-running workspaces.</p>
        </div>
        <button
          type="button"
          onClick={() => {
            void logoutAllSessions();
          }}
          className="rounded-2xl border border-red-500/30 bg-red-500/10 px-5 py-3 text-sm font-semibold text-red-100 transition hover:bg-red-500/20"
        >
          Logout All Sessions
        </button>
      </div>

      {error ? (
        <div className="mt-5 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">{error}</div>
      ) : null}

      <div className="mt-6 grid gap-4">
        {loading ? (
          <div className="rounded-2xl border border-white/10 bg-black/20 px-5 py-4 text-sm text-gray-400">Loading sessions...</div>
        ) : activeSessions.length ? (
          activeSessions.map((session) => {
            const SessionIcon = getSessionIcon(session);
            const isCurrentSession = session.id === currentSessionId;

            return (
              <div key={session.id} className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-black/20 px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex items-start gap-4">
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-white">
                    <SessionIcon size={20} />
                  </span>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-semibold text-white">{session.deviceName || 'Current device'}</p>
                      {isCurrentSession ? <span className="rounded-full bg-indigo-500/15 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-indigo-200">Current</span> : null}
                      {session.isTrusted ? <span className="rounded-full bg-emerald-500/15 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-200">Trusted</span> : null}
                    </div>
                    <p className="mt-2 text-sm text-gray-400">{session.browser || 'Browser'} on {session.platform || 'Unknown platform'} via {session.providerKey || 'email'}.</p>
                    <p className="mt-1 text-xs uppercase tracking-[0.2em] text-gray-500">Last seen {new Date(session.lastSeenAt).toLocaleString()}</p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      void handleTrustToggle(session);
                    }}
                    disabled={Boolean(pendingAction)}
                    className="inline-flex items-center gap-2 rounded-2xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-2 text-sm font-semibold text-emerald-100 transition hover:bg-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <ShieldCheck size={16} />
                    {pendingAction === `trust:${session.id}` ? 'Saving...' : session.isTrusted ? 'Untrust device' : 'Trust device'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      void handleRevoke(session);
                    }}
                    disabled={Boolean(pendingAction)}
                    className="inline-flex items-center gap-2 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm font-semibold text-red-100 transition hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <Trash2 size={16} />
                    {pendingAction === `revoke:${session.id}` ? 'Revoking...' : 'Revoke session'}
                  </button>
                </div>
              </div>
            );
          })
        ) : (
          <div className="rounded-2xl border border-white/10 bg-black/20 px-5 py-4 text-sm text-gray-400">No active device sessions were found for this account yet.</div>
        )}
      </div>
    </section>
  );
}