import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import Auth from './Auth';

const defaultUsers = [
  {
    id: 'kevin',
    slug: 'kevin',
    displayName: 'Kevin De Vlieger',
    aliasName: 'The Architect',
    email: 'hello@mymindventures.io',
    role: 'Admin',
    passwordStatus: 'active',
    passwordLoginEnabled: true,
  },
  {
    id: 'loli',
    slug: 'loli',
    displayName: 'Loli Mariscal',
    aliasName: 'The Builder',
    email: 'supercabrawoman@gmail.com',
    role: 'Admin',
    passwordStatus: 'active',
    passwordLoginEnabled: true,
  },
];

const otpEnabledProviders = [
  {
    id: 'google',
    label: 'Google',
    description: 'OAuth2 / OpenID Connect via your Google account.',
    kind: 'oauth',
    oauthProvider: 'google',
  },
  {
    id: 'email_otp',
    label: 'Email One-Time Code',
    description: 'Passwordless sign-in using a short-lived verification code.',
    kind: 'passwordless',
  },
] as const;

describe('Auth', () => {
  it('renders login screen', () => {
    render(<Auth onLogin={vi.fn()} defaultUsers={defaultUsers} />);
    
    expect(screen.getByText('FlowForge AI')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in with google/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /kevin de vlieger/i })).toBeInTheDocument();
    expect(screen.getByText('Sign in with password')).toBeInTheDocument();
    expect(screen.getByText('Send magic link')).toBeInTheDocument();
    expect(screen.getByText(/email one-time codes are hidden/i)).toBeInTheDocument();
  });

  it('prefills the email when a default user is selected', () => {
    render(<Auth onLogin={vi.fn()} defaultUsers={defaultUsers} />);

    fireEvent.click(screen.getByRole('button', { name: /loli mariscal/i }));

    expect(screen.getByLabelText('Work Email')).toHaveValue('supercabrawoman@gmail.com');
  });

  it('submits an email and password login request', () => {
    const onPasswordLoginMock = vi.fn();
    render(<Auth onLogin={vi.fn()} onPasswordLogin={onPasswordLoginMock} />);

    fireEvent.change(screen.getByLabelText('Work Email'), {
      target: { value: 'test@example.com' },
    });
    fireEvent.change(screen.getByLabelText('Password'), {
      target: { value: 'secret-123' },
    });
    fireEvent.click(screen.getByText('Sign in with password'));

    expect(onPasswordLoginMock).toHaveBeenCalledWith('test@example.com', 'secret-123');
  });

  it('calls onProviderLogin when an OAuth provider button is clicked', () => {
    const onProviderLoginMock = vi.fn();
    render(<Auth onLogin={vi.fn()} onProviderLogin={onProviderLoginMock} />);
    
    const loginButton = screen.getByRole('button', { name: /sign in with google/i });
    fireEvent.click(loginButton!);
    
    expect(onProviderLoginMock).toHaveBeenCalledWith('google');
  });

  it('submits a magic link request', () => {
    const onMagicLinkLoginMock = vi.fn();
    render(<Auth onLogin={vi.fn()} onMagicLinkLogin={onMagicLinkLoginMock} />);

    fireEvent.change(screen.getByLabelText('Work Email'), {
      target: { value: 'test@example.com' },
    });
    fireEvent.click(screen.getByText('Send magic link'));

    expect(onMagicLinkLoginMock).toHaveBeenCalledWith('test@example.com');
  });

  it('submits one-time code verification', () => {
    const onOneTimeCodeVerifyMock = vi.fn();
    render(<Auth onLogin={vi.fn()} onOneTimeCodeVerify={onOneTimeCodeVerifyMock} providers={otpEnabledProviders as any} />);

    fireEvent.change(screen.getByLabelText('Work Email'), {
      target: { value: 'test@example.com' },
    });
    fireEvent.change(screen.getByLabelText('Verification Code'), {
      target: { value: '123456' },
    });
    fireEvent.click(screen.getByText('Verify code and sign in'));

    expect(onOneTimeCodeVerifyMock).toHaveBeenCalledWith('test@example.com', '123456');
  });

  it('submits one-time code request when OTP is enabled', () => {
    const onOneTimeCodeRequestMock = vi.fn();
    render(<Auth onLogin={vi.fn()} onOneTimeCodeRequest={onOneTimeCodeRequestMock} providers={otpEnabledProviders as any} />);

    fireEvent.change(screen.getByLabelText('Work Email'), {
      target: { value: 'test@example.com' },
    });
    fireEvent.click(screen.getByText('Email one-time code'));

    expect(onOneTimeCodeRequestMock).toHaveBeenCalledWith('test@example.com');
  });

  it('renders auth error details when provided', () => {
        render(<Auth onLogin={vi.fn()} error="Google sign-in is blocked for this app URL." />);

        expect(screen.getByText('Authentication Error')).toBeInTheDocument();
        expect(screen.getByText('Google sign-in is blocked for this app URL.')).toBeInTheDocument();
      });

  it('renders auth notice details when provided', () => {
    render(<Auth onLogin={vi.fn()} notice="Magic link sent to test@example.com." />);

    expect(screen.getByText('Authentication Update')).toBeInTheDocument();
    expect(screen.getByText('Magic link sent to test@example.com.')).toBeInTheDocument();
  });
});
