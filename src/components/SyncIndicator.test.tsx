import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import SyncIndicator from './SyncIndicator';

describe('SyncIndicator', () => {
  it('renders syncing state correctly', () => {
    render(<SyncIndicator status="syncing" />);
    expect(screen.getByText('Syncing...')).toBeInTheDocument();
  });

  it('renders synced state correctly', () => {
    render(<SyncIndicator status="synced" />);
    expect(screen.getByText('Synced')).toBeInTheDocument();
  });

  it('renders offline state correctly', () => {
    render(<SyncIndicator status="offline" />);
    expect(screen.getByText('Offline')).toBeInTheDocument();
  });

  it('renders error state correctly', () => {
    render(<SyncIndicator status="error" />);
    expect(screen.getByText('Sync Error')).toBeInTheDocument();
  });
});


