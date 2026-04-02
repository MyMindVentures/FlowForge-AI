import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import Auth from './Auth';

describe('Auth', () => {
  it('renders login screen', () => {
    render(<Auth onLogin={vi.fn()} />);
    
    expect(screen.getByText('FlowForge AI')).toBeInTheDocument();
    expect(screen.getByText('Sign in with Google')).toBeInTheDocument();
  });

  it('calls onLogin when button is clicked', () => {
    const onLoginMock = vi.fn();
    render(<Auth onLogin={onLoginMock} />);
    
    const loginButton = screen.getByText('Sign in with Google').closest('button');
    fireEvent.click(loginButton!);
    
    expect(onLoginMock).toHaveBeenCalledTimes(1);
  });
});
