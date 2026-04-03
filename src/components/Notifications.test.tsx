import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import Notifications from './Notifications';

describe('Notifications', () => {
  it('renders notifications list', () => {
    render(<Notifications />);
    expect(screen.getByText('Notifications')).toBeInTheDocument();
    expect(screen.getByText('Feature Approved')).toBeInTheDocument();
    expect(screen.getByText('New Comment')).toBeInTheDocument();
    expect(screen.getByText('System Update')).toBeInTheDocument();
  });
});


