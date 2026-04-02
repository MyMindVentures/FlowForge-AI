import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import RoleSelection from './RoleSelection';

vi.mock('motion/react', () => ({
  motion: {
    button: ({ children, whileHover, whileTap, ...props }: any) => <button {...props}>{children}</button>,
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  }
}));

describe('RoleSelection', () => {
  it('renders role options', () => {
    render(<RoleSelection onSelect={vi.fn()} />);
    
    expect(screen.getByText('Select Your Role')).toBeInTheDocument();
    expect(screen.getByText('Architect')).toBeInTheDocument();
    expect(screen.getByText('Builder')).toBeInTheDocument();
  });

  it('calls onSelect with Architect when Architect is clicked', () => {
    const onSelectMock = vi.fn();
    render(<RoleSelection onSelect={onSelectMock} />);
    
    const architectButton = screen.getByText('Architect').closest('button');
    fireEvent.click(architectButton!);
    
    expect(onSelectMock).toHaveBeenCalledWith('Architect');
  });

  it('calls onSelect with Builder when Builder is clicked', () => {
    const onSelectMock = vi.fn();
    render(<RoleSelection onSelect={onSelectMock} />);
    
    const builderButton = screen.getByText('Builder').closest('button');
    fireEvent.click(builderButton!);
    
    expect(onSelectMock).toHaveBeenCalledWith('Builder');
  });
});
