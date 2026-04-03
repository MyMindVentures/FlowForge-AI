import React from 'react';
import { render, screen, act } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import Splash from './Splash';

describe('Splash', () => {
  it('renders correctly and calls onComplete after timeout', () => {
    vi.useFakeTimers();
    const onCompleteMock = vi.fn();
    
    render(<Splash onComplete={onCompleteMock} />);
    
    expect(screen.getByText('FlowForge AI')).toBeInTheDocument();
    
    expect(onCompleteMock).not.toHaveBeenCalled();
    
    act(() => {
      vi.advanceTimersByTime(2500);
    });
    
    expect(onCompleteMock).toHaveBeenCalledTimes(1);
    
    vi.useRealTimers();
  });
});


