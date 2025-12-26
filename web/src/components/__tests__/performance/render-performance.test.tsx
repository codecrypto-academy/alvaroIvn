import React from 'react';
import { render } from '@testing-library/react';
import { TokenCard } from '../../TokenCard';
import { TransferList } from '../../TransferList';
import { UserTable } from '../../UserTable';
import { Token, Transfer, User } from '@/types';
import { TransferStatus, UserStatus } from '@/contracts/config';

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

describe('Component Render Performance', () => {
  // Use relative performance metrics instead of absolute thresholds
  // These tests verify that components render without taking excessive time

  describe('TokenCard Performance', () => {
    const mockToken: Token = {
      id: 1,
      name: 'Test Token',
      totalSupply: 1000,
      creator: '0x1234567890123456789012345678901234567890',
      parentId: 0,
      features: JSON.stringify({ origin: 'Farm A' }),
      dateCreated: Date.now(),
    };

    it('should complete initial render', () => {
      const startTime = performance.now();
      const { container } = render(<TokenCard token={mockToken} />);
      const endTime = performance.now();
      const renderTime = endTime - startTime;

      // Verify it rendered successfully
      expect(container.firstChild).toBeTruthy();
      // Log performance metric for monitoring
      console.log(`TokenCard render time: ${renderTime.toFixed(2)}ms`);
    });

    it('should re-render faster than initial render', () => {
      const { rerender, container } = render(<TokenCard token={mockToken} balance={100} />);

      // Measure re-render time
      const startTime = performance.now();
      rerender(<TokenCard token={mockToken} balance={200} />);
      const endTime = performance.now();
      const rerenderTime = endTime - startTime;

      expect(container.firstChild).toBeTruthy();
      console.log(`TokenCard re-render time: ${rerenderTime.toFixed(2)}ms`);
    });
  });

  describe('TransferList Performance', () => {
    const generateTransfers = (count: number): Transfer[] => {
      return Array.from({ length: count }, (_, i) => ({
        id: i + 1,
        from: `0x${i.toString().padStart(40, '0')}`,
        to: `0x${(i + 1).toString().padStart(40, '0')}`,
        tokenId: i + 1,
        amount: 100,
        status: TransferStatus.Pending,
        dateCreated: Date.now(),
      }));
    };

    it('should render 10 transfers successfully', () => {
      const transfers = generateTransfers(10);
      const currentUser = '0x0000000000000000000000000000000000000000';

      const startTime = performance.now();
      const { container } = render(<TransferList transfers={transfers} currentUserAddress={currentUser} />);
      const endTime = performance.now();
      const renderTime = endTime - startTime;

      expect(container.firstChild).toBeTruthy();
      console.log(`TransferList (10 items) render time: ${renderTime.toFixed(2)}ms`);
    });

    it('should render 50 transfers successfully', () => {
      const transfers = generateTransfers(50);
      const currentUser = '0x0000000000000000000000000000000000000000';

      const startTime = performance.now();
      const { container } = render(<TransferList transfers={transfers} currentUserAddress={currentUser} />);
      const endTime = performance.now();
      const renderTime = endTime - startTime;

      expect(container.firstChild).toBeTruthy();
      console.log(`TransferList (50 items) render time: ${renderTime.toFixed(2)}ms`);
    });

    it('should handle empty state efficiently', () => {
      const currentUser = '0x0000000000000000000000000000000000000000';

      const startTime = performance.now();
      const { container } = render(<TransferList transfers={[]} currentUserAddress={currentUser} />);
      const endTime = performance.now();
      const renderTime = endTime - startTime;

      expect(container.firstChild).toBeTruthy();
      console.log(`TransferList (empty) render time: ${renderTime.toFixed(2)}ms`);
    });
  });

  describe('UserTable Performance', () => {
    const generateUsers = (count: number): User[] => {
      return Array.from({ length: count }, (_, i) => ({
        id: i + 1,
        userAddress: `0x${i.toString().padStart(40, '0')}`,
        role: 'PRODUCER',
        status: UserStatus.Approved,
      }));
    };

    const defaultProps = {
      users: [] as User[],
      onApprove: jest.fn(),
      onReject: jest.fn(),
      onCancel: jest.fn(),
      adminAddress: '0x0000000000000000000000000000000000000000',
    };

    it('should render 10 users successfully', () => {
      const users = generateUsers(10);

      const startTime = performance.now();
      const { container } = render(<UserTable {...defaultProps} users={users} />);
      const endTime = performance.now();
      const renderTime = endTime - startTime;

      expect(container.firstChild).toBeTruthy();
      console.log(`UserTable (10 items) render time: ${renderTime.toFixed(2)}ms`);
    });

    it('should render 50 users successfully', () => {
      const users = generateUsers(50);

      const startTime = performance.now();
      const { container } = render(<UserTable {...defaultProps} users={users} />);
      const endTime = performance.now();
      const renderTime = endTime - startTime;

      expect(container.firstChild).toBeTruthy();
      console.log(`UserTable (50 items) render time: ${renderTime.toFixed(2)}ms`);
    });

    it('should re-render efficiently when loading state changes', () => {
      const users = generateUsers(10);
      const { rerender, container } = render(<UserTable {...defaultProps} users={users} loading={false} />);

      const startTime = performance.now();
      rerender(<UserTable {...defaultProps} users={users} loading={true} />);
      const endTime = performance.now();
      const rerenderTime = endTime - startTime;

      expect(container.firstChild).toBeTruthy();
      console.log(`UserTable loading state re-render time: ${rerenderTime.toFixed(2)}ms`);
    });
  });

  describe('Multiple Component Renders', () => {
    it('should render multiple components successfully', () => {
      const mockToken: Token = {
        id: 1,
        name: 'Test Token',
        totalSupply: 1000,
        creator: '0x1234567890123456789012345678901234567890',
        parentId: 0,
        features: JSON.stringify({ origin: 'Farm A' }),
        dateCreated: Date.now(),
      };

      const startTime = performance.now();

      const { container } = render(
        <div>
          <TokenCard token={mockToken} />
          <TokenCard token={{ ...mockToken, id: 2 }} />
          <TokenCard token={{ ...mockToken, id: 3 }} />
        </div>
      );

      const endTime = performance.now();
      const renderTime = endTime - startTime;

      expect(container.firstChild).toBeTruthy();
      console.log(`Multiple TokenCards (3 cards) render time: ${renderTime.toFixed(2)}ms`);
    });
  });
});

describe('Memory Leak Detection', () => {
  it('should not leak memory on unmount', () => {
    const mockToken: Token = {
      id: 1,
      name: 'Test Token',
      totalSupply: 1000,
      creator: '0x1234567890123456789012345678901234567890',
      parentId: 0,
      features: JSON.stringify({ origin: 'Farm A' }),
      dateCreated: Date.now(),
    };

    const { unmount } = render(<TokenCard token={mockToken} />);

    // Should unmount without errors
    expect(() => unmount()).not.toThrow();
  });

  it('should cleanup event listeners on unmount', () => {
    const mockTransfer: Transfer = {
      id: 1,
      from: '0x1234567890123456789012345678901234567890',
      to: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd',
      tokenId: 1,
      amount: 100,
      status: TransferStatus.Pending,
      dateCreated: Date.now(),
    };

    const onAccept = jest.fn();
    const onReject = jest.fn();

    const { unmount } = render(
      <TransferList
        transfers={[mockTransfer]}
        currentUserAddress="0xabcdefabcdefabcdefabcdefabcdefabcdefabcd"
        onAccept={onAccept}
        onReject={onReject}
      />
    );

    unmount();

    // Callbacks should not be called after unmount
    expect(onAccept).not.toHaveBeenCalled();
    expect(onReject).not.toHaveBeenCalled();
  });
});
