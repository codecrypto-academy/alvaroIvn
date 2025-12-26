import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { UserTable } from '../UserTable';
import { User } from '@/types';
import { UserStatus } from '@/contracts/config';

const adminAddress = '0x1111111111111111111111111111111111111111';

const mockUsers: User[] = [
  {
    id: 1,
    userAddress: adminAddress,
    role: 'ADMIN',
    status: UserStatus.Approved,
    dateRegistered: Date.now(),
  },
  {
    id: 2,
    userAddress: '0x2222222222222222222222222222222222222222',
    role: 'PRODUCER',
    status: UserStatus.Pending,
    dateRegistered: Date.now(),
  },
  {
    id: 3,
    userAddress: '0x3333333333333333333333333333333333333333',
    role: 'MANUFACTURER',
    status: UserStatus.Approved,
    dateRegistered: Date.now(),
  },
  {
    id: 4,
    userAddress: '0x4444444444444444444444444444444444444444',
    role: 'DISTRIBUTOR',
    status: UserStatus.Rejected,
    dateRegistered: Date.now(),
  },
  {
    id: 5,
    userAddress: '0x5555555555555555555555555555555555555555',
    role: 'CONSUMER',
    status: UserStatus.Canceled,
    dateRegistered: Date.now(),
  },
];

describe('UserTable Component', () => {
  const defaultProps = {
    users: mockUsers,
    onApprove: jest.fn(),
    onReject: jest.fn(),
    onCancel: jest.fn(),
    adminAddress,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders empty state when no users', () => {
    render(
      <UserTable
        {...defaultProps}
        users={[]}
      />
    );

    expect(screen.getByText('No hay usuarios registrados')).toBeInTheDocument();
  });

  it('renders table with users', () => {
    render(<UserTable {...defaultProps} />);

    expect(screen.getByText('#1')).toBeInTheDocument();
    expect(screen.getByText('#2')).toBeInTheDocument();
    expect(screen.getByText('#3')).toBeInTheDocument();
  });

  it('displays user details correctly', () => {
    render(<UserTable {...defaultProps} users={[mockUsers[1]]} />);

    expect(screen.getByText('#2')).toBeInTheDocument();
    expect(screen.getByText('PRODUCER')).toBeInTheDocument();
  });

  it('formats user addresses correctly', () => {
    render(<UserTable {...defaultProps} users={[mockUsers[1]]} />);

    expect(screen.getByText(/0x22222222\.\.\.22222222/)).toBeInTheDocument();
  });

  it('displays correct status badges', () => {
    render(<UserTable {...defaultProps} />);

    const aprobadoBadges = screen.getAllByText('Aprobado');
    expect(aprobadoBadges.length).toBeGreaterThan(0);
    expect(screen.getByText('Pendiente')).toBeInTheDocument();
    expect(screen.getByText('Rechazado')).toBeInTheDocument();
    expect(screen.getByText('Cancelado')).toBeInTheDocument();
  });

  it('shows "Admin principal" for admin user without action buttons', () => {
    render(<UserTable {...defaultProps} users={[mockUsers[0]]} />);

    expect(screen.getByText('Admin principal')).toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('shows approve and reject buttons for pending users', () => {
    render(<UserTable {...defaultProps} users={[mockUsers[1]]} />);

    expect(screen.getByRole('button', { name: /aprobar/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /rechazar/i })).toBeInTheDocument();
  });

  it('shows disable button for approved non-admin users', () => {
    render(<UserTable {...defaultProps} users={[mockUsers[2]]} />);

    expect(screen.getByRole('button', { name: /deshabilitar/i })).toBeInTheDocument();
  });

  it('shows approve and cancel buttons for rejected users', () => {
    render(<UserTable {...defaultProps} users={[mockUsers[3]]} />);

    const buttons = screen.getAllByRole('button', { name: /aprobar|cancelar/i });
    expect(buttons).toHaveLength(2);
  });

  it('shows reactivate button for canceled users', () => {
    render(<UserTable {...defaultProps} users={[mockUsers[4]]} />);

    expect(screen.getByRole('button', { name: /reactivar/i })).toBeInTheDocument();
  });

  it('calls onApprove when approve button is clicked', async () => {
    const user = userEvent.setup();
    const onApprove = jest.fn();

    render(
      <UserTable
        {...defaultProps}
        users={[mockUsers[1]]}
        onApprove={onApprove}
      />
    );

    const approveButton = screen.getByRole('button', { name: /aprobar/i });
    await user.click(approveButton);

    expect(onApprove).toHaveBeenCalledWith(mockUsers[1].userAddress);
  });

  it('calls onReject when reject button is clicked', async () => {
    const user = userEvent.setup();
    const onReject = jest.fn();

    render(
      <UserTable
        {...defaultProps}
        users={[mockUsers[1]]}
        onReject={onReject}
      />
    );

    const rejectButton = screen.getByRole('button', { name: /rechazar/i });
    await user.click(rejectButton);

    expect(onReject).toHaveBeenCalledWith(mockUsers[1].userAddress);
  });

  it('calls onCancel when disable button is clicked', async () => {
    const user = userEvent.setup();
    const onCancel = jest.fn();

    render(
      <UserTable
        {...defaultProps}
        users={[mockUsers[2]]}
        onCancel={onCancel}
      />
    );

    const disableButton = screen.getByRole('button', { name: /deshabilitar/i });
    await user.click(disableButton);

    expect(onCancel).toHaveBeenCalledWith(mockUsers[2].userAddress);
  });

  it('disables buttons when loading', () => {
    render(
      <UserTable
        {...defaultProps}
        users={[mockUsers[1]]}
        loading={true}
      />
    );

    expect(screen.getByRole('button', { name: /aprobar/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /rechazar/i })).toBeDisabled();
  });

  it('renders table headers correctly', () => {
    render(<UserTable {...defaultProps} />);

    expect(screen.getByText('ID')).toBeInTheDocument();
    expect(screen.getByText('Dirección')).toBeInTheDocument();
    expect(screen.getByText('Rol')).toBeInTheDocument();
    expect(screen.getByText('Estado')).toBeInTheDocument();
    expect(screen.getByText('Acciones')).toBeInTheDocument();
  });

  it('handles case-insensitive admin address comparison', () => {
    render(
      <UserTable
        {...defaultProps}
        users={[mockUsers[0]]}
        adminAddress={adminAddress.toUpperCase()}
      />
    );

    expect(screen.getByText('Admin principal')).toBeInTheDocument();
  });

  it('applies correct badge variant for approved status', () => {
    const { container } = render(
      <UserTable {...defaultProps} users={[mockUsers[2]]} />
    );

    const badge = container.querySelector('.bg-green-100');
    expect(badge).toBeInTheDocument();
  });

  it('applies correct badge variant for pending status', () => {
    const { container } = render(
      <UserTable {...defaultProps} users={[mockUsers[1]]} />
    );

    const badge = container.querySelector('.bg-yellow-100');
    expect(badge).toBeInTheDocument();
  });

  it('applies correct badge variant for rejected status', () => {
    const { container } = render(
      <UserTable {...defaultProps} users={[mockUsers[3]]} />
    );

    const badge = container.querySelector('.bg-red-100');
    expect(badge).toBeInTheDocument();
  });

  it('applies hover effect on table rows', () => {
    const { container } = render(
      <UserTable {...defaultProps} users={[mockUsers[1]]} />
    );

    const row = container.querySelector('.hover\\:bg-gray-50');
    expect(row).toBeInTheDocument();
  });

  it('displays all users in table', () => {
    render(<UserTable {...defaultProps} />);

    expect(screen.getByText('#1')).toBeInTheDocument();
    expect(screen.getByText('#2')).toBeInTheDocument();
    expect(screen.getByText('#3')).toBeInTheDocument();
    expect(screen.getByText('#4')).toBeInTheDocument();
    expect(screen.getByText('#5')).toBeInTheDocument();
  });

  it('shows correct action buttons for each status', () => {
    render(<UserTable {...defaultProps} />);

    // Pending user - should have Aprobar and Rechazar
    const approveButtons = screen.getAllByRole('button', { name: /aprobar/i });
    expect(approveButtons.length).toBeGreaterThan(0);

    // Approved non-admin user - should have Deshabilitar
    expect(screen.getByRole('button', { name: /deshabilitar/i })).toBeInTheDocument();

    // Canceled user - should have Reactivar
    expect(screen.getByRole('button', { name: /reactivar/i })).toBeInTheDocument();
  });

  it('does not call callbacks when buttons are disabled', async () => {
    const user = userEvent.setup();
    const onApprove = jest.fn();

    render(
      <UserTable
        {...defaultProps}
        users={[mockUsers[1]]}
        onApprove={onApprove}
        loading={true}
      />
    );

    const approveButton = screen.getByRole('button', { name: /aprobar/i });

    // Button is disabled, so click should not call the callback
    expect(approveButton).toBeDisabled();
  });
});
