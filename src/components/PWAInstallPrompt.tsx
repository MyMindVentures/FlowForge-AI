import React, { useEffect, useMemo, useState } from 'react';
import { Download, RefreshCw, WifiOff, X } from 'lucide-react';
import { AuditAction, AuditService } from '../services/audit';

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
};

const DISMISS_KEY = 'flowforge:pwa-install-dismissed';

function isStandaloneDisplayMode() {
  if (typeof window === 'undefined') {
    return false;
  }

  return window.matchMedia('(display-mode: standalone)').matches || (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
}

export default function PWAInstallPrompt() {
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [installDismissed, setInstallDismissed] = useState(false);
  const [updateReady, setUpdateReady] = useState(false);
  const [isOffline, setIsOffline] = useState(typeof navigator !== 'undefined' ? !navigator.onLine : false);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    setInstallDismissed(window.localStorage.getItem(DISMISS_KEY) === 'true');

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallEvent(event as BeforeInstallPromptEvent);
      void AuditService.log(AuditAction.PWA_INSTALL_PROMPT_SHOWN, {
        source: 'app_shell',
      });
    };

    const handleInstalled = () => {
      setInstallEvent(null);
      setInstallDismissed(true);
      void AuditService.log(AuditAction.PWA_INSTALLED, {
        displayMode: 'standalone',
      });
    };

    const handleUpdateReady = () => {
      setUpdateReady(true);
      void AuditService.log(AuditAction.PWA_UPDATE_READY, {
        source: 'service_worker',
      });
    };

    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleInstalled);
    window.addEventListener('flowforge:pwa-update-ready', handleUpdateReady as EventListener);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleInstalled);
      window.removeEventListener('flowforge:pwa-update-ready', handleUpdateReady as EventListener);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const shouldShowInstallPrompt = useMemo(() => {
    return Boolean(installEvent) && !installDismissed && !isStandaloneDisplayMode();
  }, [installDismissed, installEvent]);

  const dismissInstallPrompt = () => {
    window.localStorage.setItem(DISMISS_KEY, 'true');
    setInstallDismissed(true);
    void AuditService.log(AuditAction.PWA_INSTALL_DISMISSED, {
      source: 'app_shell',
    });
  };

  const handleInstall = async () => {
    if (!installEvent) {
      return;
    }

    await installEvent.prompt();
    const result = await installEvent.userChoice;

    if (result.outcome === 'dismissed') {
      dismissInstallPrompt();
      return;
    }

    setInstallEvent(null);
  };

  const handleRefresh = () => {
    window.location.reload();
  };

  return (
    <>
      {isOffline ? (
        <div className="fixed left-4 right-4 top-4 z-[90] mx-auto flex max-w-3xl items-center justify-between gap-4 rounded-2xl border border-amber-500/30 bg-[#18120a]/95 px-4 py-3 text-sm text-amber-100 shadow-2xl backdrop-blur-xl">
          <span className="flex items-center gap-3">
            <WifiOff size={18} />
            Offline mode is active. FlowForge will keep the shell responsive and retry data sync when the network returns.
          </span>
        </div>
      ) : null}

      {shouldShowInstallPrompt ? (
        <div className="fixed bottom-4 left-4 right-4 z-[90] mx-auto flex max-w-4xl flex-col gap-4 rounded-[28px] border border-white/10 bg-[#111111]/95 px-5 py-5 text-white shadow-2xl backdrop-blur-xl lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.28em] text-emerald-300">Install FlowForge</p>
            <p className="mt-2 text-lg font-semibold">Add the tablet-optimized workspace to your home screen.</p>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-400">The installable shell improves startup time, keeps the workspace available during unreliable connections, and preserves non-sensitive UI state for daily concept and development sessions.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => {
                void handleInstall();
              }}
              className="inline-flex items-center gap-2 rounded-2xl bg-emerald-500 px-4 py-3 text-sm font-semibold text-black transition hover:bg-emerald-400"
            >
              <Download size={18} />
              Install app
            </button>
            <button
              type="button"
              onClick={dismissInstallPrompt}
              className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-gray-200 transition hover:bg-white/10"
            >
              <X size={18} />
              Not now
            </button>
          </div>
        </div>
      ) : null}

      {updateReady ? (
        <div className="fixed bottom-4 left-4 right-4 z-[91] mx-auto flex max-w-3xl flex-col gap-4 rounded-2xl border border-sky-500/30 bg-[#08121a]/95 px-5 py-4 text-sky-50 shadow-2xl backdrop-blur-xl sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.28em] text-sky-300">Update Ready</p>
            <p className="mt-2 text-sm leading-6 text-sky-100">A fresh tablet shell is ready in the background. Refresh to switch to the latest offline assets and runtime fixes.</p>
          </div>
          <button
            type="button"
            onClick={handleRefresh}
            className="inline-flex items-center gap-2 rounded-2xl bg-sky-500 px-4 py-3 text-sm font-semibold text-black transition hover:bg-sky-400"
          >
            <RefreshCw size={18} />
            Refresh now
          </button>
        </div>
      ) : null}
    </>
  );
}