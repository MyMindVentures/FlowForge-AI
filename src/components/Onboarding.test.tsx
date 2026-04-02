import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import Onboarding from './Onboarding';

vi.mock('motion/react', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>
}));

describe('Onboarding', () => {
  it('renders first step and navigates to next step', () => {
    const onComplete = vi.fn();
    render(<Onboarding onComplete={onComplete} />);
    
    expect(screen.getByText('Ideation to Structure')).toBeInTheDocument();
    
    const nextButton = screen.getByText('Next Phase');
    fireEvent.click(nextButton);
    
    expect(screen.getByText('Design to Implementation')).toBeInTheDocument();
  });

  it('calls onComplete on the last step', () => {
    const onComplete = vi.fn();
    render(<Onboarding onComplete={onComplete} />);
    
    fireEvent.click(screen.getByText('Next Phase')); // Step 2
    fireEvent.click(screen.getByText('Next Phase')); // Step 3
    
    const getStartedButton = screen.getByText('Begin Journey');
    fireEvent.click(getStartedButton);
    
    expect(onComplete).toHaveBeenCalledTimes(1);
  });
});
