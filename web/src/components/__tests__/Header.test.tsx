import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Header } from '../Header';
import { UserStatus } from '@/contracts/config';

// Mock Next.js Link
jest.mock('next/link', () => {
  return ({ children, href }: { children: React.ReactNode; href: string }) => {
    return <a href={href}>{children}</a>;
  };
});

// Mock useWallet hook
const mockConnect = jest.fn();
const mockDisconnect = jest.fn();
const mockUseWallet = {
  account: null as string | null,
  isConnected: false,
  isCorrectNetwork: true,
  isAdmin: false,
  formattedAccount: '',
  connect: mockConnect,
  disconnect: mockDisconnect,
};

jest.mock('@/hooks/useWallet', () => ({
  useWallet: () => mockUseWallet,
}));

// Mock web3 utilities
const mockGetUserInfo = jest.fn();
jest.mock('@/lib/web3', () => ({
  getUserInfo: (...args: any[]) => mockGetUserInfo(...args),
}));

describe('Header Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseWallet.account = null;
    mockUseWallet.isConnected = false;
    mockUseWallet.isCorrectNetwork = true;
    mockUseWallet.isAdmin = false;
    mockUseWallet.formattedAccount = '';
  });

  describe('Disconnected State', () => {
    it('renders connect button when not connected', () => {
      render(<Header />);

      expect(screen.getByRole('button', { name: /conectar metamask/i })).toBeInTheDocument();
    });

    it('calls connect when connect button is clicked', async () => {
      const user = userEvent.setup();
      render(<Header />);

      const connectButton = screen.getByRole('button', { name: /conectar metamask/i });
      await user.click(connectButton);

      expect(mockConnect).toHaveBeenCalled();
    });

    it('does not show navigation when disconnected', () => {
      render(<Header />);

      expect(screen.queryByRole('link', { name: /dashboard/i })).not.toBeInTheDocument();
    });

    it('renders logo with correct text', () => {
      render(<Header />);

      expect(screen.getByText('Supply Chain Tracker')).toBeInTheDocument();
    });

    it('renders short logo for mobile', () => {
      render(<Header />);

      expect(screen.getByText('SCT')).toBeInTheDocument();
    });

    it('renders logo link to home', () => {
      render(<Header />);

      const logoLink = screen.getByRole('link', { name: /supply chain tracker/i });
      expect(logoLink).toHaveAttribute('href', '/');
    });
  });

  describe('Connected State - Approved User', () => {
    beforeEach(() => {
      mockUseWallet.account = '0x1234567890123456789012345678901234567890';
      mockUseWallet.isConnected = true;
      mockUseWallet.formattedAccount = '0x123...7890';
      mockGetUserInfo.mockResolvedValue({
        id: 1,
        role: 'PRODUCER',
        status: UserStatus.Approved,
        account: '0x1234567890123456789012345678901234567890',
        dateRegistered: Date.now(),
      });
    });

    it('shows disconnect button when connected', async () => {
      render(<Header />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /desconectar/i })).toBeInTheDocument();
      });
    });

    it('displays formatted account address', async () => {
      render(<Header />);

      await waitFor(() => {
        expect(screen.getByText('0x123...7890')).toBeInTheDocument();
      });
    });

    it('displays user role badge', async () => {
      render(<Header />);

      await waitFor(() => {
        expect(screen.getByText('PRODUCER')).toBeInTheDocument();
      });
    });

    it('displays approved status badge', async () => {
      render(<Header />);

      await waitFor(() => {
        expect(screen.getByText('Aprobado')).toBeInTheDocument();
      });
    });

    it('shows navigation links for approved users', async () => {
      render(<Header />);

      await waitFor(() => {
        expect(screen.getByRole('link', { name: /dashboard/i })).toBeInTheDocument();
      });
    });

    it('calls disconnect when disconnect button is clicked', async () => {
      const user = userEvent.setup();
      render(<Header />);

      await waitFor(async () => {
        const disconnectButton = screen.getByRole('button', { name: /desconectar/i });
        await user.click(disconnectButton);
      });

      expect(mockDisconnect).toHaveBeenCalled();
    });

    it('shows hamburger menu button on mobile', async () => {
      render(<Header />);

      await waitFor(() => {
        const menuButton = screen.getByRole('button', { name: /abrir menú/i });
        expect(menuButton).toBeInTheDocument();
      });
    });

    it('toggles mobile menu when hamburger is clicked', async () => {
      const user = userEvent.setup();
      render(<Header />);

      await waitFor(async () => {
        const menuButton = screen.getByRole('button', { name: /abrir menú/i });
        await user.click(menuButton);
      });

      // Menu should be open, check for mobile-specific elements
      const mobileLinks = screen.getAllByRole('link', { name: /dashboard/i });
      expect(mobileLinks.length).toBeGreaterThan(1);
    });
  });

  describe('Connected State - Pending User', () => {
    beforeEach(() => {
      mockUseWallet.account = '0x1234567890123456789012345678901234567890';
      mockUseWallet.isConnected = true;
      mockUseWallet.formattedAccount = '0x123...7890';
      mockGetUserInfo.mockResolvedValue({
        id: 1,
        role: 'PRODUCER',
        status: UserStatus.Pending,
        account: '0x1234567890123456789012345678901234567890',
        dateRegistered: Date.now(),
      });
    });

    it('does not show navigation for pending users', async () => {
      render(<Header />);

      await waitFor(() => {
        expect(screen.queryByRole('link', { name: /dashboard/i })).not.toBeInTheDocument();
      });
    });

    it('displays pending status badge', async () => {
      render(<Header />);

      await waitFor(() => {
        expect(screen.getByText('Pendiente')).toBeInTheDocument();
      });
    });

    it('does not show hamburger menu for pending users', async () => {
      render(<Header />);

      await waitFor(() => {
        expect(screen.queryByRole('button', { name: /abrir menú/i })).not.toBeInTheDocument();
      });
    });
  });

  describe('Admin User Navigation', () => {
    beforeEach(() => {
      mockUseWallet.account = '0x1234567890123456789012345678901234567890';
      mockUseWallet.isConnected = true;
      mockUseWallet.isAdmin = true;
      mockUseWallet.formattedAccount = '0x123...7890';
      mockGetUserInfo.mockResolvedValue({
        id: 1,
        role: 'ADMIN',
        status: UserStatus.Approved,
        account: '0x1234567890123456789012345678901234567890',
        dateRegistered: Date.now(),
      });
    });

    it('shows admin navigation links', async () => {
      render(<Header />);

      await waitFor(() => {
        expect(screen.getAllByRole('link', { name: /tokens/i })[0]).toHaveAttribute('href', '/admin/tokens');
        expect(screen.getAllByRole('link', { name: /usuarios/i })[0]).toHaveAttribute('href', '/admin/users');
      });
    });

    it('does not show user navigation links for admin', async () => {
      render(<Header />);

      await waitFor(() => {
        expect(screen.queryByRole('link', { name: /mis tokens/i })).not.toBeInTheDocument();
        expect(screen.queryByRole('link', { name: /transferencias/i })).not.toBeInTheDocument();
      });
    });
  });

  describe('Regular User Navigation', () => {
    beforeEach(() => {
      mockUseWallet.account = '0x1234567890123456789012345678901234567890';
      mockUseWallet.isConnected = true;
      mockUseWallet.isAdmin = false;
      mockUseWallet.formattedAccount = '0x123...7890';
      mockGetUserInfo.mockResolvedValue({
        id: 2,
        role: 'PRODUCER',
        status: UserStatus.Approved,
        account: '0x1234567890123456789012345678901234567890',
        dateRegistered: Date.now(),
      });
    });

    it('shows user navigation links', async () => {
      render(<Header />);

      await waitFor(() => {
        expect(screen.getAllByRole('link', { name: /mis tokens/i })[0]).toHaveAttribute('href', '/tokens');
        expect(screen.getAllByRole('link', { name: /transferencias/i })[0]).toHaveAttribute('href', '/transfers');
      });
    });

    it('does not show admin navigation links for regular users', async () => {
      render(<Header />);

      await waitFor(() => {
        const tokenLinks = screen.queryAllByRole('link', { name: /^tokens$/i });
        const adminTokenLink = tokenLinks.find(link => link.getAttribute('href') === '/admin/tokens');
        expect(adminTokenLink).toBeUndefined();
      });
    });

    it('shows profile link for all approved users', async () => {
      render(<Header />);

      await waitFor(() => {
        expect(screen.getAllByRole('link', { name: /perfil/i })[0]).toHaveAttribute('href', '/profile');
      });
    });
  });

  describe('Network Warning', () => {
    beforeEach(() => {
      mockUseWallet.account = '0x1234567890123456789012345678901234567890';
      mockUseWallet.isConnected = true;
      mockUseWallet.isCorrectNetwork = false;
      mockUseWallet.formattedAccount = '0x123...7890';
    });

    it('shows network warning when on wrong network', () => {
      render(<Header />);

      expect(screen.getByText(/red incorrecta/i)).toBeInTheDocument();
    });

    it('does not show network warning when on correct network', () => {
      mockUseWallet.isCorrectNetwork = true;
      render(<Header />);

      expect(screen.queryByText(/red incorrecta/i)).not.toBeInTheDocument();
    });
  });

  describe('User Info Loading', () => {
    it('loads user info when connected', async () => {
      mockUseWallet.account = '0x1234567890123456789012345678901234567890';
      mockUseWallet.isConnected = true;
      mockGetUserInfo.mockResolvedValue({
        id: 1,
        role: 'MANUFACTURER',
        status: UserStatus.Approved,
        account: '0x1234567890123456789012345678901234567890',
        dateRegistered: Date.now(),
      });

      render(<Header />);

      await waitFor(() => {
        expect(mockGetUserInfo).toHaveBeenCalledWith('0x1234567890123456789012345678901234567890');
      });
    });

    it('handles user info loading error gracefully', async () => {
      mockUseWallet.account = '0x1234567890123456789012345678901234567890';
      mockUseWallet.isConnected = true;
      mockGetUserInfo.mockRejectedValue(new Error('Network error'));

      render(<Header />);

      await waitFor(() => {
        expect(mockGetUserInfo).toHaveBeenCalled();
      });

      // Should not display role or status badges on error
      expect(screen.queryByText('PRODUCER')).not.toBeInTheDocument();
    });

    it('does not display role for unregistered user', async () => {
      mockUseWallet.account = '0x1234567890123456789012345678901234567890';
      mockUseWallet.isConnected = true;
      mockGetUserInfo.mockResolvedValue({
        id: 0,
        role: '',
        status: 0,
        account: '0x0000000000000000000000000000000000000000',
        dateRegistered: 0,
      });

      render(<Header />);

      await waitFor(() => {
        expect(mockGetUserInfo).toHaveBeenCalled();
      });

      expect(screen.queryByText(/producer|manufacturer|distributor/i)).not.toBeInTheDocument();
    });
  });

  describe('Mobile Menu', () => {
    beforeEach(() => {
      mockUseWallet.account = '0x1234567890123456789012345678901234567890';
      mockUseWallet.isConnected = true;
      mockUseWallet.formattedAccount = '0x123...7890';
      mockGetUserInfo.mockResolvedValue({
        id: 1,
        role: 'PRODUCER',
        status: UserStatus.Approved,
        account: '0x1234567890123456789012345678901234567890',
        dateRegistered: Date.now(),
      });
    });

    it('opens and shows mobile menu content', async () => {
      const user = userEvent.setup();
      render(<Header />);

      // Open mobile menu
      await waitFor(async () => {
        const menuButton = screen.getByRole('button', { name: /abrir menú/i });
        await user.click(menuButton);
      });

      // Verify menu is open
      const menuButton = screen.getByRole('button', { name: /abrir menú/i });
      expect(menuButton.getAttribute('aria-expanded')).toBe('true');

      // Verify mobile menu contains navigation links
      const dashboardLinks = screen.getAllByRole('link', { name: /dashboard/i });
      expect(dashboardLinks.length).toBeGreaterThan(1);
    });

    it('shows disconnect button in mobile menu', async () => {
      const user = userEvent.setup();
      render(<Header />);

      await waitFor(async () => {
        const menuButton = screen.getByRole('button', { name: /abrir menú/i });
        await user.click(menuButton);
      });

      const disconnectButtons = screen.getAllByRole('button', { name: /desconectar/i });
      expect(disconnectButtons.length).toBeGreaterThan(1);
    });

    it('displays user info in mobile menu', async () => {
      const user = userEvent.setup();
      render(<Header />);

      await waitFor(async () => {
        const menuButton = screen.getByRole('button', { name: /abrir menú/i });
        await user.click(menuButton);
      });

      const formattedAccounts = screen.getAllByText('0x123...7890');
      expect(formattedAccounts.length).toBeGreaterThan(1);
    });
  });

  describe('Accessibility', () => {
    it('has aria-expanded attribute on hamburger button', async () => {
      mockUseWallet.account = '0x1234567890123456789012345678901234567890';
      mockUseWallet.isConnected = true;
      mockGetUserInfo.mockResolvedValue({
        id: 1,
        role: 'PRODUCER',
        status: UserStatus.Approved,
        account: '0x1234567890123456789012345678901234567890',
        dateRegistered: Date.now(),
      });

      render(<Header />);

      await waitFor(() => {
        const menuButton = screen.getByRole('button', { name: /abrir menú/i });
        expect(menuButton).toHaveAttribute('aria-expanded');
      });
    });

    it('has sr-only text on hamburger button', async () => {
      mockUseWallet.account = '0x1234567890123456789012345678901234567890';
      mockUseWallet.isConnected = true;
      mockGetUserInfo.mockResolvedValue({
        id: 1,
        role: 'PRODUCER',
        status: UserStatus.Approved,
        account: '0x1234567890123456789012345678901234567890',
        dateRegistered: Date.now(),
      });

      render(<Header />);

      await waitFor(() => {
        expect(screen.getByText('Abrir menú')).toBeInTheDocument();
      });
    });
  });
});
