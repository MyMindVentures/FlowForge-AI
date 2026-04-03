import React from 'react';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ToastProvider, useToast } from './Toast';

const TestComponent = () => {
  const { showToast } = useToast();
  return (
    <button onClick={() => showToast('Test Message', 'success')}>
      Show Toast
    </button>
  );
};

describe('Toast Component', () => {
  it('renders and shows toast when triggered', async () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );

    const button = screen.getByText('Show Toast');
    fireEvent.click(button);

    const toastMessage = await screen.findByText('Test Message');
    expect(toastMessage).toBeInTheDocument();
  });

  it('removes toast when close button is clicked', async () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );

    fireEvent.click(screen.getByText('Show Toast'));
    
    const closeButton = await screen.findByRole('button', { name: '' }); // The X icon button
    fireEvent.click(closeButton);

    await waitFor(() => {
      expect(screen.queryByText('Test Message')).not.toBeInTheDocument();
    });
  });

  it('automatically removes toast after timeout', async () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );

    fireEvent.click(screen.getByText('Show Toast'));
    expect(screen.getByText('Test Message')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.queryByText('Test Message')).not.toBeInTheDocument();
    }, { timeout: 4000 });
  });
});


