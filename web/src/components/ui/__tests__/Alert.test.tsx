import React from 'react';
import { render, screen } from '@testing-library/react';
import { Alert } from '../Alert';

describe('Alert Component', () => {
  it('renders alert with children', () => {
    render(<Alert>Alert Message</Alert>);
    expect(screen.getByText('Alert Message')).toBeInTheDocument();
  });

  it('has alert role', () => {
    render(<Alert>Alert</Alert>);
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('applies info variant by default', () => {
    render(<Alert>Info Alert</Alert>);
    const alert = screen.getByRole('alert');
    expect(alert).toHaveClass('bg-blue-50', 'border-blue-200', 'text-blue-800');
  });

  it('applies success variant when specified', () => {
    render(<Alert variant="success">Success Alert</Alert>);
    const alert = screen.getByRole('alert');
    expect(alert).toHaveClass('bg-green-50', 'border-green-200', 'text-green-800');
  });

  it('applies warning variant when specified', () => {
    render(<Alert variant="warning">Warning Alert</Alert>);
    const alert = screen.getByRole('alert');
    expect(alert).toHaveClass('bg-yellow-50', 'border-yellow-200', 'text-yellow-800');
  });

  it('applies error variant when specified', () => {
    render(<Alert variant="error">Error Alert</Alert>);
    const alert = screen.getByRole('alert');
    expect(alert).toHaveClass('bg-red-50', 'border-red-200', 'text-red-800');
  });

  it('applies base styling classes', () => {
    render(<Alert>Styled Alert</Alert>);
    const alert = screen.getByRole('alert');
    expect(alert).toHaveClass('p-4', 'rounded-md', 'border');
  });

  it('applies custom className', () => {
    render(<Alert className="custom-alert">Custom Alert</Alert>);
    const alert = screen.getByRole('alert');
    expect(alert).toHaveClass('custom-alert');
  });

  it('renders complex children', () => {
    render(
      <Alert>
        <div>
          <strong>Error:</strong> Something went wrong
        </div>
      </Alert>
    );
    expect(screen.getByText('Error:')).toBeInTheDocument();
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });
});
