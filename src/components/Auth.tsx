import React, { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { ArrowRight, Fingerprint, Github, Globe, KeyRound, LogIn, Mail, Shield, ShieldCheck, Sparkles, Zap } from 'lucide-react';
import type { AuthProviderDescriptor, AuthProviderId, DefaultLoginProfile } from '../lib/supabase/appClient';

interface AuthProps {
  onLogin: () => void;
  onPasswordLogin?: (email: string, password: string) => Promise<void> | void;
  onProviderLogin?: (provider: AuthProviderId) => Promise<void> | void;
  onEnterpriseSsoLogin?: (identifier: string) => Promise<void> | void;
  onMagicLinkLogin?: (email: string) => Promise<void> | void;
  onOneTimeCodeRequest?: (email: string) => Promise<void> | void;
  onOneTimeCodeVerify?: (email: string, code: string) => Promise<void> | void;
  onPasswordResetRequest?: (email: string) => Promise<void> | void;
  providers?: AuthProviderDescriptor[];
  defaultUsers?: DefaultLoginProfile[];
  error?: string | null;
  notice?: string | null;
}

const defaultProviders: AuthProviderDescriptor[] = [
  {
    id: 'google',
    label: 'Google',
    description: 'OAuth2 / OpenID Connect via your Google account.',
    kind: 'oauth',
    category: 'social',
    availability: 'available',
    supportsDirectClientFlow: true,
    oauthProvider: 'google',
  },
];

function getProviderIcon(providerId: AuthProviderId) {
  switch (providerId) {
    case 'apple':
      return ShieldCheck;
    case 'github':
      return Github;
    case 'azure':
      return Shield;
    case 'enterprise_oidc':
    case 'enterprise_saml':
      return ShieldCheck;
    case 'passkey':
      return Fingerprint;
    case 'totp':
    case 'sms_otp':
      return KeyRound;
    case 'magic_link':
      return Mail;
    case 'email_otp':
      return KeyRound;
    case 'google':
    default:
      return Globe;
  }
}

export default function Auth({ onLogin, onPasswordLogin, onProviderLogin, onEnterpriseSsoLogin, onMagicLinkLogin, onOneTimeCodeRequest, onOneTimeCodeVerify, onPasswordResetRequest, providers = defaultProviders, defaultUsers = [], error, notice }: AuthProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [oneTimeCode, setOneTimeCode] = useState('');
  const [enterpriseIdentifier, setEnterpriseIdentifier] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<string | null>(null);

  const oauthProviders = useMemo(() => providers.filter((provider) => provider.kind === 'oauth'), [providers]);
  const enterpriseProviders = useMemo(() => providers.filter((provider) => provider.kind === 'sso'), [providers]);
  const securityFactorProviders = useMemo(() => providers.filter((provider) => provider.kind === 'mfa'), [providers]);
  const emailOtpEnabled = useMemo(() => providers.some((provider) => provider.id === 'email_otp' && provider.availability === 'available'), [providers]);
  const activeError = localError || error;

  const handleDefaultUserSelection = (defaultUser: DefaultLoginProfile) => {
    setEmail(defaultUser.email);
    setLocalError(null);
  };

  const runAction = async (actionKey: string, action: () => Promise<void> | void) => {
    try {
      setLocalError(null);
      setPendingAction(actionKey);
      await action();
    } catch (actionError) {
      if (actionError instanceof Error) {
        setLocalError(actionError.message);
      } else {
        setLocalError('Authentication action failed. Try again.');
      }
    } finally {
      setPendingAction(null);
    }
  };

  const handleProviderLogin = async (providerId: AuthProviderId) => {
    await runAction(`provider:${providerId}`, async () => {
      if (onProviderLogin) {
        await onProviderLogin(providerId);
        return;
      }

      if (providerId === 'google') {
        await onLogin();
        return;
      }

      throw new Error('That sign-in option is not available yet.');
    });
  };

  const handleEnterpriseSso = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    await runAction('enterprise-sso', async () => {
      if (!onEnterpriseSsoLogin) {
        throw new Error('Enterprise SSO is not available yet.');
      }

      await onEnterpriseSsoLogin(enterpriseIdentifier);
    });
  };

  const handleMagicLinkSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    await runAction('magic-link', async () => {
      if (!onMagicLinkLogin) {
        throw new Error('Magic link sign-in is not available yet.');
      }

      await onMagicLinkLogin(email);
    });
  };

  const handlePasswordLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    await runAction('password', async () => {
      if (!onPasswordLogin) {
        throw new Error('Email and password sign-in is not available yet.');
      }

      await onPasswordLogin(email, password);
    });
  };

  const handleOneTimeCodeRequest = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    await runAction('otp-request', async () => {
      if (!onOneTimeCodeRequest) {
        throw new Error('One-time code sign-in is not available yet.');
      }

      await onOneTimeCodeRequest(email);
    });
  };

  const handleOneTimeCodeVerify = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    await runAction('otp-verify', async () => {
      if (!onOneTimeCodeVerify) {
        throw new Error('Verification code sign-in is not available yet.');
      }

      await onOneTimeCodeVerify(email, oneTimeCode);
    });
  };

  const handlePasswordReset = async () => {
    await runAction('password-reset', async () => {
      if (!onPasswordResetRequest) {
        throw new Error('Password reset is not available yet.');
      }

      await onPasswordResetRequest(email);
    });
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center p-6 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-indigo-900/20 via-[#0a0a0a] to-[#0a0a0a] overflow-hidden relative">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] opacity-20" />
      
      <motion.div 
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-20 h-20 bg-indigo-600 rounded-3xl flex items-center justify-center shadow-2xl shadow-indigo-500/40 mb-10 relative z-10"
      >
        <Sparkles className="text-white" size={40} />
      </motion.div>
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.5 }}
        className="text-center relative z-10"
      >
        <h1 className="text-5xl lg:text-7xl font-bold text-white mb-6 tracking-tighter">FlowForge AI</h1>
        <p className="text-gray-400 text-center max-w-lg mb-12 text-lg lg:text-xl leading-relaxed font-medium">
          The translation layer between product thinking and implementation thinking. Turn vague ideas into structured feature cards.
        </p>
        
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-12 max-w-2xl mx-auto">
          {[
            { icon: Shield, label: 'Secure PRDs', color: 'text-indigo-400' },
            { icon: Zap, label: 'AI Roadmap', color: 'text-amber-400' },
            { icon: Globe, label: 'Team Sync', color: 'text-emerald-400' },
          ].map((item, index) => (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4 + index * 0.1 }}
              className="p-4 rounded-2xl bg-white/5 border border-white/5 flex flex-col items-center gap-2"
            >
              <item.icon className={item.color} size={20} />
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{item.label}</span>
            </motion.div>
          ))}
        </div>

        <div className="mx-auto grid w-full max-w-5xl gap-6 lg:grid-cols-[1.2fr_1fr]">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6 text-left backdrop-blur-sm">
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-indigo-300">OAuth Providers</p>
            <p className="mt-3 text-sm leading-6 text-gray-400">Start with your existing identity provider. Google remains the default path for backward compatibility, while GitHub, Microsoft, and Apple sit behind the same provider-agnostic contract.</p>

            <div className="mt-6 grid gap-3">
              {oauthProviders.map((provider) => {
                const ProviderIcon = getProviderIcon(provider.id);
                const isPending = pendingAction === `provider:${provider.id}`;
                const isUnavailable = provider.availability === 'requires_config' || provider.supportsDirectClientFlow === false;

                return (
                  <button
                    key={provider.id}
                    onClick={() => {
                      void handleProviderLogin(provider.id);
                    }}
                    disabled={Boolean(pendingAction) || isUnavailable}
                    className="group flex items-center justify-between rounded-2xl border border-white/10 bg-black/30 px-5 py-4 text-left transition hover:border-indigo-400/50 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <span className="flex items-center gap-4">
                      <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-white">
                        <ProviderIcon size={20} />
                      </span>
                      <span>
                        <span className="block text-base font-semibold text-white">Sign in with {provider.label}</span>
                        <span className="block text-sm text-gray-400">{provider.description}</span>
                        {provider.availability !== 'available' ? (
                          <span className="mt-1 block text-xs font-bold uppercase tracking-[0.2em] text-amber-300">{provider.availability === 'preview' ? 'Preview rollout' : 'Needs provider config'}</span>
                        ) : null}
                      </span>
                    </span>
                    <span className="flex items-center gap-2 text-sm font-semibold text-gray-200">
                      {isUnavailable ? 'Configure' : isPending ? 'Redirecting...' : 'Continue'}
                      <ArrowRight className="transition group-hover:translate-x-1" size={18} />
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-5">
              <p className="text-xs font-bold uppercase tracking-[0.3em] text-emerald-300">Enterprise SSO</p>
              <p className="mt-3 text-sm leading-6 text-gray-400">Use your company email or domain to route into a Supabase SAML 2.0 or OIDC connection. This supports tenant-specific sign-in without hardcoding providers into the client.</p>

              <form className="mt-5 space-y-3" onSubmit={handleEnterpriseSso}>
                <input
                  type="text"
                  autoComplete="username"
                  value={enterpriseIdentifier}
                  onChange={(event) => setEnterpriseIdentifier(event.target.value)}
                  placeholder="name@company.com or company.com"
                  className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none transition focus:border-emerald-400"
                />
                <button
                  type="submit"
                  disabled={Boolean(pendingAction) || !enterpriseProviders.some((provider) => provider.availability === 'available')}
                  className="flex w-full items-center justify-center gap-3 rounded-2xl border border-emerald-400/30 bg-emerald-500/10 px-5 py-3 font-semibold text-emerald-100 transition hover:bg-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <ShieldCheck size={18} />
                  {pendingAction === 'enterprise-sso' ? 'Routing to SSO...' : 'Continue with enterprise SSO'}
                </button>
              </form>

              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                {enterpriseProviders.map((provider) => (
                  <div key={provider.id} className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
                    <p className="text-sm font-semibold text-white">{provider.label}</p>
                    <p className="mt-1 text-xs leading-5 text-gray-400">{provider.description}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-5">
              <p className="text-xs font-bold uppercase tracking-[0.3em] text-amber-300">Security Factors</p>
              <p className="mt-3 text-sm leading-6 text-gray-400">Passkeys, TOTP, and SMS fallback are wired as future-safe capability flags so the UX can surface rollout state without coupling the app to any single provider.</p>

              <div className="mt-5 grid gap-3">
                {securityFactorProviders.map((provider) => {
                  const ProviderIcon = getProviderIcon(provider.id);

                  return (
                    <div key={provider.id} className="flex items-center gap-4 rounded-2xl border border-white/10 bg-black/20 px-4 py-4">
                      <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 text-white">
                        <ProviderIcon size={18} />
                      </span>
                      <div>
                        <p className="text-sm font-semibold text-white">{provider.label}</p>
                        <p className="mt-1 text-xs leading-5 text-gray-400">{provider.description}</p>
                        <p className="mt-2 text-[10px] font-bold uppercase tracking-[0.2em] text-amber-300">{provider.availability === 'preview' ? 'Feature-flag rollout' : 'Requires backend setup'}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-black/30 p-6 text-left backdrop-blur-sm">
            {defaultUsers.length ? (
              <>
                <p className="text-xs font-bold uppercase tracking-[0.3em] text-amber-300">Default Users</p>
                <p className="mt-3 text-sm leading-6 text-gray-400">Pick Kevin or Loli to preload the correct email, then enter the current shared admin password.</p>

                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  {defaultUsers.map((defaultUser) => {
                    const isSelected = email === defaultUser.email;

                    return (
                      <button
                        key={defaultUser.id}
                        type="button"
                        onClick={() => handleDefaultUserSelection(defaultUser)}
                        className={`rounded-2xl border px-4 py-4 text-left transition ${isSelected ? 'border-amber-400/70 bg-amber-500/10' : 'border-white/10 bg-white/5 hover:border-amber-400/40 hover:bg-white/10'}`}
                      >
                        <span className="block text-sm font-semibold text-white">{defaultUser.displayName}</span>
                        <span className="mt-1 block text-xs uppercase tracking-[0.2em] text-amber-200/80">{defaultUser.aliasName || defaultUser.role}</span>
                        <span className="mt-3 block text-sm text-gray-400">{defaultUser.email}</span>
                      </button>
                    );
                  })}
                </div>

                <div className="my-6 h-px bg-white/10" />
              </>
            ) : null}

            <p className="text-xs font-bold uppercase tracking-[0.3em] text-sky-300">Email And Password</p>
            <p className="mt-3 text-sm leading-6 text-gray-400">Use the current shared admin password or your own Supabase password when direct sign-in is enabled for your account. Email verification and reset links stay in the same Supabase flow.</p>

            <form className="mt-6 space-y-3" onSubmit={handlePasswordLogin}>
              <label className="block text-xs font-bold uppercase tracking-[0.25em] text-gray-500" htmlFor="auth-email">
                Work Email
              </label>
              <input
                id="auth-email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="Pick Kevin or Loli, or type your email"
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition focus:border-sky-400"
              />
              <label className="block text-xs font-bold uppercase tracking-[0.25em] text-gray-500" htmlFor="auth-email-password">
                Password
              </label>
              <input
                id="auth-email-password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Enter your password"
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition focus:border-sky-400"
              />
              <button
                type="submit"
                disabled={Boolean(pendingAction)}
                className="flex w-full items-center justify-center gap-3 rounded-2xl border border-sky-400/30 bg-sky-500/10 px-5 py-3 font-semibold text-sky-100 transition hover:bg-sky-500/20 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <LogIn size={18} />
                {pendingAction === 'password' ? 'Signing in...' : 'Sign in with password'}
              </button>
              <button
                type="button"
                onClick={() => {
                  void handlePasswordReset();
                }}
                disabled={Boolean(pendingAction)}
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-gray-200 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {pendingAction === 'password-reset' ? 'Sending reset link...' : 'Send password reset link'}
              </button>
            </form>

            <div className="my-6 h-px bg-white/10" />

            <p className="text-xs font-bold uppercase tracking-[0.3em] text-emerald-300">Passwordless</p>
            <p className="mt-3 text-sm leading-6 text-gray-400">Use email-only sign-in for lower-friction access. Magic links work best on the same device. One-time codes support cross-device login and future MFA flows.</p>

            <form className="mt-6 space-y-3" onSubmit={handleMagicLinkSubmit}>
              <button
                type="submit"
                disabled={Boolean(pendingAction)}
                className="flex w-full items-center justify-center gap-3 rounded-2xl bg-white px-5 py-3 font-semibold text-black transition hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Mail size={18} />
                {pendingAction === 'magic-link' ? 'Sending magic link...' : 'Send magic link'}
              </button>
            </form>

            {emailOtpEnabled ? (
              <>
                <form className="mt-5 space-y-3" onSubmit={handleOneTimeCodeRequest}>
                  <button
                    type="submit"
                    disabled={Boolean(pendingAction)}
                    className="flex w-full items-center justify-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-5 py-3 font-semibold text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <KeyRound size={18} />
                    {pendingAction === 'otp-request' ? 'Sending code...' : 'Email one-time code'}
                  </button>
                </form>

                <form className="mt-5 space-y-3" onSubmit={handleOneTimeCodeVerify}>
                  <label className="block text-xs font-bold uppercase tracking-[0.25em] text-gray-500" htmlFor="auth-code">
                    Verification Code
                  </label>
                  <input
                    id="auth-code"
                    type="text"
                    inputMode="numeric"
                    value={oneTimeCode}
                    onChange={(event) => setOneTimeCode(event.target.value)}
                    placeholder="123456"
                    className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition focus:border-indigo-400"
                  />
                  <button
                    type="submit"
                    disabled={Boolean(pendingAction)}
                    className="flex w-full items-center justify-center gap-3 rounded-2xl border border-indigo-400/40 bg-indigo-500/10 px-5 py-3 font-semibold text-indigo-100 transition hover:bg-indigo-500/20 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <LogIn size={18} />
                    {pendingAction === 'otp-verify' ? 'Verifying code...' : 'Verify code and sign in'}
                  </button>
                </form>
              </>
            ) : (
              <div className="mt-5 rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-sm leading-6 text-gray-400">
                Email one-time codes stay disabled until the Supabase email template is switched to use the Token variable and VITE_SUPABASE_EMAIL_OTP_ENABLED=true is set for this environment.
              </div>
            )}
          </div>
        </div>

        {notice ? (
          <div className="mt-6 max-w-2xl rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-5 py-4 text-left">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-300">Authentication Update</p>
            <p className="mt-2 text-sm leading-6 text-emerald-100">{notice}</p>
          </div>
        ) : null}

        {activeError ? (
          <div className="mt-6 max-w-2xl rounded-2xl border border-amber-500/30 bg-amber-500/10 px-5 py-4 text-left">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-300">Authentication Error</p>
            <p className="mt-2 text-sm leading-6 text-amber-100">{activeError}</p>
          </div>
        ) : null}
      </motion.div>

      <div className="absolute bottom-12 left-0 right-0 text-center opacity-40">
        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Trusted by 10,000+ Product Teams</p>
      </div>
    </div>
  );
}
