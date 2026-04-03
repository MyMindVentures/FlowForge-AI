import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import ConfirmModal from './ConfirmModal';

vi.mock('motion/react', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>
}));

describe('ConfirmModal', () => {
  it('does not render when isOpen is false', () => {
    render(<ConfirmModal isOpen={false} title="Test" message="Test msg" onConfirm={vi.fn()} onClose={vi.fn()} />);
    expect(screen.queryByText('Test')).not.toBeInTheDocument();
  });

  it('renders correctly when isOpen is true', () => {
    render(<ConfirmModal isOpen={true} title="Test Title" message="Test message" onConfirm={vi.fn()} onClose={vi.fn()} />);
    expect(screen.getByText('Test Title')).toBeInTheDocument();
    expect(screen.getByText('Test message')).toBeInTheDocument();
  });

  it('calls onConfirm when confirm button is clicked', () => {
    const onConfirm = vi.fn();
    render(<ConfirmModal isOpen={true} title="Test" message="Test msg" onConfirm={onConfirm} onClose={vi.fn()} />);
    fireEvent.click(screen.getByText('Confirm'));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when cancel button is clicked', () => {
    const onClose = vi.fn();
    render(<ConfirmModal isOpen={true} title="Test" message="Test msg" onConfirm={vi.fn()} onClose={onClose} />);
    fireEvent.click(screen.getByText('Cancel'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});


