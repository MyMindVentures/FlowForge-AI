import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import ErrorBoundary from './ErrorBoundary';

const ProblemChild = () => {
  throw new Error('Test error');
};

describe('ErrorBoundary', () => {
  it('renders children when there is no error', () => {
    render(
      <ErrorBoundary>
        <div>Safe Content</div>
      </ErrorBoundary>
    );
    
    expect(screen.getByText('Safe Content')).toBeInTheDocument();
  });

  it('renders error UI when a child throws', () => {
    // Suppress console.error for this test to keep output clean
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    render(
      <ErrorBoundary>
        <ProblemChild />
      </ErrorBoundary>
    );
    
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.getByText('Test error')).toBeInTheDocument();
    
    consoleSpy.mockRestore();
  });
});
