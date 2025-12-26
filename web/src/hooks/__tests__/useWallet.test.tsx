import React from 'react';
import { renderHook, waitFor } from '@testing-library/react';
import { useWallet } from '../useWallet';
import * as Web3Context from '@/contexts/Web3Context';
import * as web3Lib from '@/lib/web3';

// Mock del Web3Context
jest.mock('@/contexts/Web3Context');
jest.mock('@/lib/web3');

const mockWeb3ContextValue = {
  account: '0x1234567890123456789012345678901234567890',
  isConnected: true,
  chainId: 31337,
  isCorrectNetwork: true,
  error: null,
  provider: {} as any,
  signer: {} as any,
  connect: jest.fn(),
  disconnect: jest.fn(),
};

describe('useWallet Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (Web3Context.useWeb3Context as jest.Mock).mockReturnValue(mockWeb3ContextValue);
    // Default mock for getUserInfo
    (web3Lib.getUserInfo as jest.Mock).mockResolvedValue({
      id: 0,
      role: '',
      status: 0,
      account: '0x0000000000000000000000000000000000000000',
      dateRegistered: 0,
    });
  });

  it('returns wallet context values', () => {
    const { result } = renderHook(() => useWallet());

    expect(result.current.account).toBe('0x1234567890123456789012345678901234567890');
    expect(result.current.isConnected).toBe(true);
    expect(result.current.chainId).toBe(31337);
    expect(result.current.isCorrectNetwork).toBe(true);
  });

  it('provides connect and disconnect functions', () => {
    const { result } = renderHook(() => useWallet());

    expect(result.current.connect).toBeDefined();
    expect(result.current.disconnect).toBeDefined();
  });

  it('formats account address correctly', () => {
    const { result } = renderHook(() => useWallet());

    expect(result.current.formattedAccount).toBe('0x1234...7890');
  });

  it('returns empty string for formatted address when account is null', () => {
    (Web3Context.useWeb3Context as jest.Mock).mockReturnValue({
      ...mockWeb3ContextValue,
      account: null,
    });

    const { result } = renderHook(() => useWallet());

    expect(result.current.formattedAccount).toBe('');
  });

  it('detects admin account correctly', () => {
    // Mock admin address from contract config
    const adminAddress = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266';
    (Web3Context.useWeb3Context as jest.Mock).mockReturnValue({
      ...mockWeb3ContextValue,
      account: adminAddress,
    });

    const { result } = renderHook(() => useWallet());

    expect(result.current.isAdmin).toBe(true);
  });

  it('detects non-admin account correctly', () => {
    const { result } = renderHook(() => useWallet());

    expect(result.current.isAdmin).toBe(false);
  });

  it('loads user role when account is connected', async () => {
    const mockUserInfo = {
      id: 1,
      role: 'PRODUCER',
      status: 1,
      account: '0x1234567890123456789012345678901234567890',
      dateRegistered: Date.now(),
    };

    (web3Lib.getUserInfo as jest.Mock).mockResolvedValue(mockUserInfo);

    const { result } = renderHook(() => useWallet());

    // Wait for the effect to complete
    await waitFor(() => {
      expect(result.current.userRole).toBe('PRODUCER');
    });

    expect(result.current.isRegistered).toBe(true);
    expect(result.current.isCheckingRegistration).toBe(false);
  });

  it('handles user not registered', async () => {
    const mockUserInfo = {
      id: 0,
      role: '',
      status: 0,
      account: '0x0000000000000000000000000000000000000000',
      dateRegistered: 0,
    };

    (web3Lib.getUserInfo as jest.Mock).mockResolvedValue(mockUserInfo);

    const { result } = renderHook(() => useWallet());

    await waitFor(() => {
      expect(result.current.userRole).toBe(null);
    });

    expect(result.current.isRegistered).toBe(false);
    expect(result.current.isCheckingRegistration).toBe(false);
  });

  it('handles error when loading user info', async () => {
    (web3Lib.getUserInfo as jest.Mock).mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useWallet());

    await waitFor(() => {
      expect(result.current.userRole).toBe(null);
      expect(result.current.isCheckingRegistration).toBe(false);
    });

    expect(result.current.isRegistered).toBe(false);
  });

  it('sets isCheckingRegistration to true while loading', () => {
    (web3Lib.getUserInfo as jest.Mock).mockImplementation(
      () => new Promise((resolve) => setTimeout(resolve, 100))
    );

    const { result } = renderHook(() => useWallet());

    expect(result.current.isCheckingRegistration).toBe(true);
  });

  it('resets user role when account becomes null', async () => {
    const mockUserInfo = {
      id: 1,
      role: 'PRODUCER',
      status: 1,
      account: '0x1234567890123456789012345678901234567890',
      dateRegistered: Date.now(),
    };

    (web3Lib.getUserInfo as jest.Mock).mockResolvedValue(mockUserInfo);

    const { result, rerender } = renderHook(() => useWallet());

    await waitFor(() => {
      expect(result.current.userRole).toBe('PRODUCER');
    });

    // Change account to null
    (Web3Context.useWeb3Context as jest.Mock).mockReturnValue({
      ...mockWeb3ContextValue,
      account: null,
      isConnected: false,
    });

    rerender();

    await waitFor(() => {
      expect(result.current.userRole).toBe(null);
      expect(result.current.isCheckingRegistration).toBe(false);
    });
  });

  it('formatAddress helper works correctly', () => {
    const { result } = renderHook(() => useWallet());

    const formatted = result.current.formatAddress('0xABCDEF1234567890ABCDEF1234567890ABCDEF12');
    expect(formatted).toBe('0xABCD...EF12');
  });

  it('formatAddress returns empty string for null', () => {
    const { result } = renderHook(() => useWallet());

    const formatted = result.current.formatAddress(null);
    expect(formatted).toBe('');
  });
});
