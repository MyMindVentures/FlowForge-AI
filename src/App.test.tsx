import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import App from './App';

describe('App', () => {
  it('renders onboarding for AI Product Interviewer', () => {
    render(<App />);

    expect(screen.getByText('AI Product Interviewer')).toBeInTheDocument();
    expect(screen.getByText('Create your first project')).toBeInTheDocument();
  });
});
