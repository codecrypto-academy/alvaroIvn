import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TransferList } from '../TransferList';
import { Transfer } from '@/types';
import { TransferStatus } from '@/contracts/config';

// Mock formatDate utility
jest.mock('@/lib/web3', () => ({
  formatDate: (timestamp: number) => new Date(timestamp).toLocaleDateString(),
}));

const mockTransfers: Transfer[] = [
  {
    id: 1,
    from: '0x1234567890123456789012345678901234567890',
    to: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd',
    tokenId: 10,
    amount: 100,
    status: TransferStatus.Pending,
    dateCreated: Date.now(),
  },
  {
    id: 2,
    from: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd',
    to: '0x1234567890123456789012345678901234567890',
    tokenId: 20,
    amount: 50,
    status: TransferStatus.Accepted,
    dateCreated: Date.now(),
  },
  {
    id: 3,
    from: '0x1234567890123456789012345678901234567890',
    to: '0x9999999999999999999999999999999999999999',
    tokenId: 30,
    amount: 200,
    status: TransferStatus.Rejected,
    dateCreated: Date.now(),
  },
];

const currentUser = '0x1234567890123456789012345678901234567890';

describe('TransferList Component', () => {
  it('renders empty state when no transfers', () => {
    render(
      <TransferList
        transfers={[]}
        currentUserAddress={currentUser}
      />
    );

    expect(screen.getByText('No hay transferencias')).toBeInTheDocument();
  });

  it('renders table with transfers', () => {
    render(
      <TransferList
        transfers={mockTransfers}
        currentUserAddress={currentUser}
      />
    );

    expect(screen.getByText('#1')).toBeInTheDocument();
    expect(screen.getByText('#2')).toBeInTheDocument();
    expect(screen.getByText('#3')).toBeInTheDocument();
  });

  it('displays transfer details correctly', () => {
    render(
      <TransferList
        transfers={[mockTransfers[0]]}
        currentUserAddress={currentUser}
      />
    );

    expect(screen.getByText('#10')).toBeInTheDocument();
    expect(screen.getByText('100')).toBeInTheDocument();
  });

  it('identifies sender with "Tú" badge', () => {
    render(
      <TransferList
        transfers={[mockTransfers[0]]}
        currentUserAddress={currentUser}
      />
    );

    const badges = screen.getAllByText('Tú');
    expect(badges).toHaveLength(1);
  });

  it('identifies receiver with "Tú" badge', () => {
    render(
      <TransferList
        transfers={[mockTransfers[1]]}
        currentUserAddress={currentUser}
      />
    );

    const badges = screen.getAllByText('Tú');
    expect(badges).toHaveLength(1);
  });

  it('displays correct status badge for pending transfers', () => {
    render(
      <TransferList
        transfers={[mockTransfers[0]]}
        currentUserAddress={currentUser}
      />
    );

    expect(screen.getByText('Pendiente')).toBeInTheDocument();
  });

  it('displays correct status badge for accepted transfers', () => {
    render(
      <TransferList
        transfers={[mockTransfers[1]]}
        currentUserAddress={currentUser}
      />
    );

    expect(screen.getByText('Aceptada')).toBeInTheDocument();
  });

  it('displays correct status badge for rejected transfers', () => {
    render(
      <TransferList
        transfers={[mockTransfers[2]]}
        currentUserAddress={currentUser}
      />
    );

    expect(screen.getByText('Rechazada')).toBeInTheDocument();
  });

  it('shows accept and reject buttons for pending transfers received', () => {
    const pendingReceived: Transfer = {
      ...mockTransfers[0],
      from: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd',
      to: currentUser,
      status: TransferStatus.Pending,
    };

    render(
      <TransferList
        transfers={[pendingReceived]}
        currentUserAddress={currentUser}
        onAccept={jest.fn()}
        onReject={jest.fn()}
      />
    );

    expect(screen.getByRole('button', { name: /aceptar/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /rechazar/i })).toBeInTheDocument();
  });

  it('does not show action buttons for pending transfers sent', () => {
    const pendingSent: Transfer = {
      ...mockTransfers[0],
      from: currentUser,
      to: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd',
      status: TransferStatus.Pending,
    };

    render(
      <TransferList
        transfers={[pendingSent]}
        currentUserAddress={currentUser}
      />
    );

    expect(screen.queryByRole('button', { name: /aceptar/i })).not.toBeInTheDocument();
    expect(screen.getByText('Esperando aprobación')).toBeInTheDocument();
  });

  it('does not show action buttons for accepted transfers', () => {
    render(
      <TransferList
        transfers={[mockTransfers[1]]}
        currentUserAddress={currentUser}
      />
    );

    expect(screen.queryByRole('button', { name: /aceptar/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /rechazar/i })).not.toBeInTheDocument();
  });

  it('calls onAccept when accept button is clicked', async () => {
    const user = userEvent.setup();
    const onAccept = jest.fn();
    const pendingReceived: Transfer = {
      ...mockTransfers[0],
      from: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd',
      to: currentUser,
      status: TransferStatus.Pending,
    };

    render(
      <TransferList
        transfers={[pendingReceived]}
        currentUserAddress={currentUser}
        onAccept={onAccept}
      />
    );

    const acceptButton = screen.getByRole('button', { name: /aceptar/i });
    await user.click(acceptButton);

    expect(onAccept).toHaveBeenCalledWith(pendingReceived.id);
  });

  it('calls onReject when reject button is clicked', async () => {
    const user = userEvent.setup();
    const onReject = jest.fn();
    const pendingReceived: Transfer = {
      ...mockTransfers[0],
      from: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd',
      to: currentUser,
      status: TransferStatus.Pending,
    };

    render(
      <TransferList
        transfers={[pendingReceived]}
        currentUserAddress={currentUser}
        onReject={onReject}
      />
    );

    const rejectButton = screen.getByRole('button', { name: /rechazar/i });
    await user.click(rejectButton);

    expect(onReject).toHaveBeenCalledWith(pendingReceived.id);
  });

  it('disables buttons when loading', () => {
    const pendingReceived: Transfer = {
      ...mockTransfers[0],
      from: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd',
      to: currentUser,
      status: TransferStatus.Pending,
    };

    render(
      <TransferList
        transfers={[pendingReceived]}
        currentUserAddress={currentUser}
        onAccept={jest.fn()}
        onReject={jest.fn()}
        loading={true}
      />
    );

    expect(screen.getByRole('button', { name: /aceptar/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /rechazar/i })).toBeDisabled();
  });

  it('highlights receiver row with blue background', () => {
    const { container } = render(
      <TransferList
        transfers={[mockTransfers[1]]}
        currentUserAddress={currentUser}
      />
    );

    const row = container.querySelector('.bg-blue-50');
    expect(row).toBeInTheDocument();
  });

  it('formats addresses correctly', () => {
    render(
      <TransferList
        transfers={[mockTransfers[0]]}
        currentUserAddress={currentUser}
      />
    );

    expect(screen.getByText('0x123456...')).toBeInTheDocument();
    expect(screen.getByText('0xabcdef...')).toBeInTheDocument();
  });

  it('displays amount with locale formatting', () => {
    const largeTransfer: Transfer = {
      ...mockTransfers[0],
      amount: 1000000,
    };

    render(
      <TransferList
        transfers={[largeTransfer]}
        currentUserAddress={currentUser}
      />
    );

    expect(screen.getByText(/1[.,]000[.,]000/)).toBeInTheDocument();
  });

  it('renders table headers correctly', () => {
    render(
      <TransferList
        transfers={mockTransfers}
        currentUserAddress={currentUser}
      />
    );

    expect(screen.getByText('ID')).toBeInTheDocument();
    expect(screen.getByText('De')).toBeInTheDocument();
    expect(screen.getByText('Para')).toBeInTheDocument();
    expect(screen.getByText('Token ID')).toBeInTheDocument();
    expect(screen.getByText('Cantidad')).toBeInTheDocument();
    expect(screen.getByText('Estado')).toBeInTheDocument();
    expect(screen.getByText('Fecha')).toBeInTheDocument();
    expect(screen.getByText('Acciones')).toBeInTheDocument();
  });

  it('handles case-insensitive address comparison', () => {
    const transfer: Transfer = {
      ...mockTransfers[0],
      to: '0X1234567890123456789012345678901234567890', // Uppercase
    };

    render(
      <TransferList
        transfers={[transfer]}
        currentUserAddress={currentUser.toLowerCase()}
      />
    );

    const badges = screen.getAllByText('Tú');
    expect(badges.length).toBeGreaterThan(0);
  });
});
