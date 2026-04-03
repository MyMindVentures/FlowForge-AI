import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import PWAInstallPrompt from './PWAInstallPrompt';

vi.mock('../services/audit', () => ({
  AuditAction: {
    PWA_INSTALL_PROMPT_SHOWN: 'PWA_INSTALL_PROMPT_SHOWN',
    PWA_INSTALL_DISMISSED: 'PWA_INSTALL_DISMISSED',
    PWA_INSTALLED: 'PWA_INSTALLED',
    PWA_UPDATE_READY: 'PWA_UPDATE_READY',
  },
  AuditService: {
    log: vi.fn().mockResolvedValue(undefined),
  },
}));

describe('PWAInstallPrompt', () => {
  beforeEach(() => {
    window.localStorage.clear();
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        addListener: vi.fn(),
        removeListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });
  });

  it('renders an install banner after the browser fires beforeinstallprompt', () => {
    render(<PWAInstallPrompt />);

    const installEvent = new Event('beforeinstallprompt');
    Object.assign(installEvent, {
      preventDefault: vi.fn(),
      prompt: vi.fn().mockResolvedValue(undefined),
      userChoice: Promise.resolve({ outcome: 'accepted', platform: 'web' }),
    });

    fireEvent(window, installEvent);

    expect(screen.getByText('Install app')).toBeInTheDocument();
  });
});