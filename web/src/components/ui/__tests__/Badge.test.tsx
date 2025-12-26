import React from 'react';
import { render, screen } from '@testing-library/react';
import { Badge } from '../Badge';

describe('Badge Component', () => {
  it('renders badge with children', () => {
    render(<Badge>Test Badge</Badge>);
    expect(screen.getByText('Test Badge')).toBeInTheDocument();
  });

  it('applies default variant by default', () => {
    render(<Badge>Default Badge</Badge>);
    const badge = screen.getByText('Default Badge');
    expect(badge).toHaveClass('bg-gray-100', 'text-gray-800');
  });

  it('applies success variant when specified', () => {
    render(<Badge variant="success">Success Badge</Badge>);
    const badge = screen.getByText('Success Badge');
    expect(badge).toHaveClass('bg-green-100', 'text-green-800');
  });

  it('applies warning variant when specified', () => {
    render(<Badge variant="warning">Warning Badge</Badge>);
    const badge = screen.getByText('Warning Badge');
    expect(badge).toHaveClass('bg-yellow-100', 'text-yellow-800');
  });

  it('applies danger variant when specified', () => {
    render(<Badge variant="danger">Danger Badge</Badge>);
    const badge = screen.getByText('Danger Badge');
    expect(badge).toHaveClass('bg-red-100', 'text-red-800');
  });

  it('applies info variant when specified', () => {
    render(<Badge variant="info">Info Badge</Badge>);
    const badge = screen.getByText('Info Badge');
    expect(badge).toHaveClass('bg-blue-100', 'text-blue-800');
  });

  it('applies custom className', () => {
    render(<Badge className="custom-class">Custom Badge</Badge>);
    const badge = screen.getByText('Custom Badge');
    expect(badge).toHaveClass('custom-class');
  });

  it('renders as a span element', () => {
    render(<Badge>Badge</Badge>);
    const badge = screen.getByText('Badge');
    expect(badge.tagName).toBe('SPAN');
  });

  it('applies base styling classes', () => {
    render(<Badge>Styled Badge</Badge>);
    const badge = screen.getByText('Styled Badge');
    expect(badge).toHaveClass('inline-flex', 'items-center', 'px-2.5', 'py-0.5', 'rounded-full', 'text-xs', 'font-medium');
  });
});
