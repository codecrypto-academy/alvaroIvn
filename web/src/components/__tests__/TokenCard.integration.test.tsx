import React from 'react';
import { render, screen } from '@testing-library/react';
import { TokenCard } from '../TokenCard';
import { Token } from '@/types';

// Mock Next.js Link
jest.mock('next/link', () => {
  return ({ children, href }: { children: React.ReactNode; href: string }) => {
    return <a href={href}>{children}</a>;
  };
});

// Mock web3 utilities
jest.mock('@/lib/web3', () => ({
  formatDate: (timestamp: number) => new Date(timestamp).toLocaleDateString(),
  parseFeatures: (features: string) => {
    try {
      return JSON.parse(features);
    } catch {
      return {};
    }
  },
}));

const mockToken: Token = {
  id: 1,
  name: 'Test Token',
  totalSupply: 1000,
  creator: '0x1234567890123456789012345678901234567890',
  parentId: 0,
  features: JSON.stringify({ origin: 'Farm A', quality: 'Premium' }),
  dateCreated: Date.now(),
};

describe('TokenCard Integration Test', () => {
  it('renders complete token card with all UI components', () => {
    render(
      <TokenCard
        token={mockToken}
        balance={800}
        showActions={true}
        userAccount="0x1234567890123456789012345678901234567890"
        userRole="PRODUCER"
      />
    );

    // Verify Card components are rendered
    expect(screen.getByText('Test Token')).toBeInTheDocument();
    expect(screen.getByText('ID: 1')).toBeInTheDocument();

    // Verify balance display
    expect(screen.getByText('Balance Total')).toBeInTheDocument();
    expect(screen.getByText(/1[.,]000/)).toBeInTheDocument(); // Accepts both comma and period
    expect(screen.getByText('Balance Disponible')).toBeInTheDocument();
    expect(screen.getByText('800')).toBeInTheDocument();

    // Verify creator display
    expect(screen.getByText('Creador')).toBeInTheDocument();

    // Verify features are displayed
    expect(screen.getByText('Características')).toBeInTheDocument();
    expect(screen.getByText(/"origin"/)).toBeInTheDocument();

    // Verify action buttons
    expect(screen.getByRole('button', { name: /ver detalles/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /transferir/i })).toBeInTheDocument();
  });

  it('displays pending transfers badge', () => {
    const tokenWithPending = { ...mockToken, pendingTransfers: 200 };

    render(
      <TokenCard
        token={tokenWithPending}
        balance={800}
        userAccount="0x1234567890123456789012345678901234567890"
        userRole="PRODUCER"
      />
    );

    expect(screen.getByText('200 en transferencias pendientes')).toBeInTheDocument();
  });

  it('displays derived token badge when parentId > 0', () => {
    const derivedToken = { ...mockToken, parentId: 5 };

    render(<TokenCard token={derivedToken} />);

    expect(screen.getByText('Derivado de #5')).toBeInTheDocument();
  });

  it('hides transfer button for admin users', () => {
    render(
      <TokenCard
        token={mockToken}
        balance={800}
        isAdmin={true}
        userAccount="0x1234567890123456789012345678901234567890"
        userRole="ADMIN"
      />
    );

    expect(screen.queryByRole('button', { name: /transferir/i })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /ver detalles/i })).toBeInTheDocument();
  });

  it('hides transfer button for consumer users', () => {
    render(
      <TokenCard
        token={mockToken}
        balance={800}
        userAccount="0x1234567890123456789012345678901234567890"
        userRole="CONSUMER"
      />
    );

    expect(screen.queryByRole('button', { name: /transferir/i })).not.toBeInTheDocument();
  });

  it('hides transfer button when balance is 0', () => {
    render(
      <TokenCard
        token={mockToken}
        balance={0}
        userAccount="0x1234567890123456789012345678901234567890"
        userRole="PRODUCER"
      />
    );

    expect(screen.queryByRole('button', { name: /transferir/i })).not.toBeInTheDocument();
  });

  it('hides transfer button when user is not the creator', () => {
    render(
      <TokenCard
        token={mockToken}
        balance={800}
        userAccount="0xDIFFERENTADDRESS000000000000000000000000"
        userRole="PRODUCER"
      />
    );

    expect(screen.queryByRole('button', { name: /transferir/i })).not.toBeInTheDocument();
  });

  it('shows transfer button only when all conditions are met', () => {
    render(
      <TokenCard
        token={mockToken}
        balance={800}
        isAdmin={false}
        userAccount="0x1234567890123456789012345678901234567890"
        userRole="PRODUCER"
      />
    );

    expect(screen.getByRole('button', { name: /transferir/i })).toBeInTheDocument();
  });

  it('hides all actions when showActions is false', () => {
    render(
      <TokenCard
        token={mockToken}
        balance={800}
        showActions={false}
        userAccount="0x1234567890123456789012345678901234567890"
        userRole="PRODUCER"
      />
    );

    expect(screen.queryByRole('button', { name: /ver detalles/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /transferir/i })).not.toBeInTheDocument();
  });

  it('handles token without features gracefully', () => {
    const tokenNoFeatures = { ...mockToken, features: '{}' };

    render(<TokenCard token={tokenNoFeatures} />);

    expect(screen.queryByText('Características')).not.toBeInTheDocument();
  });

  it('renders token without balance information', () => {
    render(<TokenCard token={mockToken} />);

    expect(screen.getByText('Balance Total')).toBeInTheDocument();
    expect(screen.queryByText('Balance Disponible')).not.toBeInTheDocument();
  });

  it('calculates available balance correctly', () => {
    const tokenWithPending = { ...mockToken, pendingTransfers: 300 };

    render(
      <TokenCard
        token={tokenWithPending}
        balance={1000}
        userAccount="0x1234567890123456789012345678901234567890"
        userRole="PRODUCER"
      />
    );

    // Available balance should be 1000 - 300 = 700
    expect(screen.getByText('700')).toBeInTheDocument();
  });

  it('links to correct token detail page', () => {
    render(<TokenCard token={mockToken} />);

    const detailsLink = screen.getByRole('link', { name: /ver detalles/i });
    expect(detailsLink).toHaveAttribute('href', '/tokens/1');
  });

  it('links to correct transfer page', () => {
    render(
      <TokenCard
        token={mockToken}
        balance={800}
        userAccount="0x1234567890123456789012345678901234567890"
        userRole="PRODUCER"
      />
    );

    const transferLink = screen.getByRole('link', { name: /transferir/i });
    expect(transferLink).toHaveAttribute('href', '/tokens/1/transfer');
  });

  it('displays formatted creator address', () => {
    render(<TokenCard token={mockToken} />);

    expect(screen.getByText('0x1234567890...')).toBeInTheDocument();
  });

  it('integrates Badge component correctly for derived tokens', () => {
    const derivedToken = { ...mockToken, parentId: 10 };

    const { container } = render(<TokenCard token={derivedToken} />);

    const badges = container.querySelectorAll('.inline-flex.items-center');
    expect(badges.length).toBeGreaterThan(0);
  });

  it('integrates Button components with correct variants', () => {
    render(
      <TokenCard
        token={mockToken}
        balance={800}
        userAccount="0x1234567890123456789012345678901234567890"
        userRole="PRODUCER"
      />
    );

    const detailsButton = screen.getByRole('button', { name: /ver detalles/i });
    const transferButton = screen.getByRole('button', { name: /transferir/i });

    expect(detailsButton).toHaveClass('bg-gray-200');
    expect(transferButton).toHaveClass('bg-primary-600');
  });

  it('handles case-insensitive creator comparison', () => {
    render(
      <TokenCard
        token={mockToken}
        balance={800}
        userAccount="0X1234567890123456789012345678901234567890" // Uppercase
        userRole="PRODUCER"
      />
    );

    expect(screen.getByRole('button', { name: /transferir/i })).toBeInTheDocument();
  });
});
