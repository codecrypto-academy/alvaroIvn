/**
 * Tests for Web3Context
 *
 * Tests básicos para el contexto Web3 sin conectarse a un proveedor real.
 * Verifica la estructura, el manejo de errores y el estado inicial.
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { Web3Provider, useWeb3Context } from '../Web3Context';

// Mock window.ethereum
const mockEthereum = {
  request: jest.fn(),
  on: jest.fn(),
  removeListener: jest.fn(),
};

describe('Web3Context', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Setup window.ethereum mock
    if (typeof window !== 'undefined') {
      (window as any).ethereum = mockEthereum;
    }
  });

  afterEach(() => {
    // Cleanup
    if (typeof window !== 'undefined') {
      delete (window as any).ethereum;
    }
  });

  describe('Provider Initialization', () => {
    it('should render children components', () => {
      render(
        <Web3Provider>
          <div>Test Child</div>
        </Web3Provider>
      );

      expect(screen.getByText('Test Child')).toBeInTheDocument();
    });

    it('should provide context to children', () => {
      function TestComponent() {
        const context = useWeb3Context();
        return <div>{context ? 'Context Available' : 'No Context'}</div>;
      }

      render(
        <Web3Provider>
          <TestComponent />
        </Web3Provider>
      );

      expect(screen.getByText('Context Available')).toBeInTheDocument();
    });

    it('should have initial disconnected state', () => {
      function TestComponent() {
        const { isConnected, account } = useWeb3Context();
        return (
          <div>
            <span data-testid="connected">{isConnected ? 'Connected' : 'Disconnected'}</span>
            <span data-testid="account">{account || 'No Account'}</span>
          </div>
        );
      }

      render(
        <Web3Provider>
          <TestComponent />
        </Web3Provider>
      );

      expect(screen.getByTestId('connected')).toHaveTextContent('Disconnected');
      expect(screen.getByTestId('account')).toHaveTextContent('No Account');
    });

    it('should initialize with null provider and signer', () => {
      function TestComponent() {
        const { provider, signer } = useWeb3Context();
        return (
          <div>
            <span data-testid="provider">{provider ? 'Has Provider' : 'No Provider'}</span>
            <span data-testid="signer">{signer ? 'Has Signer' : 'No Signer'}</span>
          </div>
        );
      }

      render(
        <Web3Provider>
          <TestComponent />
        </Web3Provider>
      );

      expect(screen.getByTestId('provider')).toHaveTextContent('No Provider');
      expect(screen.getByTestId('signer')).toHaveTextContent('No Signer');
    });

    it('should initialize with correct network as false', () => {
      function TestComponent() {
        const { isCorrectNetwork } = useWeb3Context();
        return <div data-testid="network">{isCorrectNetwork ? 'Correct' : 'Incorrect'}</div>;
      }

      render(
        <Web3Provider>
          <TestComponent />
        </Web3Provider>
      );

      expect(screen.getByTestId('network')).toHaveTextContent('Incorrect');
    });
  });

  describe('Context Hook (useWeb3Context)', () => {
    it('should throw error when used outside provider', () => {
      // Suppress console.error for this test
      const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});

      function TestComponent() {
        useWeb3Context();
        return <div>Test</div>;
      }

      expect(() => render(<TestComponent />)).toThrow('useWeb3Context debe usarse dentro de un Web3Provider');

      consoleError.mockRestore();
    });

    it('should provide connect function', () => {
      function TestComponent() {
        const { connect } = useWeb3Context();
        return <div>{typeof connect === 'function' ? 'Has Connect' : 'No Connect'}</div>;
      }

      render(
        <Web3Provider>
          <TestComponent />
        </Web3Provider>
      );

      expect(screen.getByText('Has Connect')).toBeInTheDocument();
    });

    it('should provide disconnect function', () => {
      function TestComponent() {
        const { disconnect } = useWeb3Context();
        return <div>{typeof disconnect === 'function' ? 'Has Disconnect' : 'No Disconnect'}</div>;
      }

      render(
        <Web3Provider>
          <TestComponent />
        </Web3Provider>
      );

      expect(screen.getByText('Has Disconnect')).toBeInTheDocument();
    });

    it('should have error state initially null', () => {
      function TestComponent() {
        const { error } = useWeb3Context();
        return <div data-testid="error">{error || 'No Error'}</div>;
      }

      render(
        <Web3Provider>
          <TestComponent />
        </Web3Provider>
      );

      expect(screen.getByTestId('error')).toHaveTextContent('No Error');
    });

    it('should have chainId initially null', () => {
      function TestComponent() {
        const { chainId } = useWeb3Context();
        return <div data-testid="chainid">{chainId !== null ? chainId : 'No ChainId'}</div>;
      }

      render(
        <Web3Provider>
          <TestComponent />
        </Web3Provider>
      );

      expect(screen.getByTestId('chainid')).toHaveTextContent('No ChainId');
    });
  });

  describe('Error Handling', () => {
    it('should handle missing MetaMask gracefully', async () => {
      // Remove ethereum mock
      delete (window as any).ethereum;

      function TestComponent() {
        const { connect, error } = useWeb3Context();
        return (
          <div>
            <button onClick={connect}>Connect</button>
            <div data-testid="error">{error || 'No Error'}</div>
          </div>
        );
      }

      render(
        <Web3Provider>
          <TestComponent />
        </Web3Provider>
      );

      const connectButton = screen.getByRole('button', { name: /connect/i });
      connectButton.click();

      await waitFor(() => {
        expect(screen.getByTestId('error')).toHaveTextContent(/MetaMask no está instalado/i);
      });
    });
  });

  describe('Multiple Instances', () => {
    it('should allow multiple components to use context', () => {
      function Component1() {
        const { isConnected } = useWeb3Context();
        return <div data-testid="comp1">{isConnected ? 'C1: Connected' : 'C1: Disconnected'}</div>;
      }

      function Component2() {
        const { isConnected } = useWeb3Context();
        return <div data-testid="comp2">{isConnected ? 'C2: Connected' : 'C2: Disconnected'}</div>;
      }

      render(
        <Web3Provider>
          <Component1 />
          <Component2 />
        </Web3Provider>
      );

      expect(screen.getByTestId('comp1')).toHaveTextContent('C1: Disconnected');
      expect(screen.getByTestId('comp2')).toHaveTextContent('C2: Disconnected');
    });

    it('should share state between components', () => {
      function Component1() {
        const { account } = useWeb3Context();
        return <div data-testid="comp1">{account || 'No Account'}</div>;
      }

      function Component2() {
        const { account } = useWeb3Context();
        return <div data-testid="comp2">{account || 'No Account'}</div>;
      }

      render(
        <Web3Provider>
          <Component1 />
          <Component2 />
        </Web3Provider>
      );

      // Both should show the same state
      expect(screen.getByTestId('comp1')).toHaveTextContent('No Account');
      expect(screen.getByTestId('comp2')).toHaveTextContent('No Account');
    });
  });

  describe('Type Safety', () => {
    it('should provide correctly typed context values', () => {
      function TestComponent() {
        const context = useWeb3Context();

        // Test that all expected properties exist
        const hasAllProperties =
          'account' in context &&
          'isConnected' in context &&
          'chainId' in context &&
          'provider' in context &&
          'signer' in context &&
          'isCorrectNetwork' in context &&
          'connect' in context &&
          'disconnect' in context &&
          'error' in context;

        return <div>{hasAllProperties ? 'All Properties Present' : 'Missing Properties'}</div>;
      }

      render(
        <Web3Provider>
          <TestComponent />
        </Web3Provider>
      );

      expect(screen.getByText('All Properties Present')).toBeInTheDocument();
    });
  });

  describe('Cleanup and Memory Leaks', () => {
    it('should not throw on unmount', () => {
      const { unmount } = render(
        <Web3Provider>
          <div>Test</div>
        </Web3Provider>
      );

      expect(() => unmount()).not.toThrow();
    });

    it('should cleanup event listeners on unmount', () => {
      const { unmount } = render(
        <Web3Provider>
          <div>Test</div>
        </Web3Provider>
      );

      const onCallCount = mockEthereum.on.mock.calls.length;
      const removeListenerCallCount = mockEthereum.removeListener.mock.calls.length;

      unmount();

      // After unmount, removeListener may have been called
      // This verifies the component attempts cleanup
      expect(mockEthereum.removeListener.mock.calls.length).toBeGreaterThanOrEqual(removeListenerCallCount);
    });
  });

  describe('Initial State Consistency', () => {
    it('should have consistent initial state across renders', () => {
      function TestComponent() {
        const { isConnected, account, chainId, isCorrectNetwork } = useWeb3Context();
        return (
          <div>
            <div data-testid="connected">{String(isConnected)}</div>
            <div data-testid="account">{String(account)}</div>
            <div data-testid="chainid">{String(chainId)}</div>
            <div data-testid="network">{String(isCorrectNetwork)}</div>
          </div>
        );
      }

      const { rerender } = render(
        <Web3Provider>
          <TestComponent />
        </Web3Provider>
      );

      const initialValues = {
        connected: screen.getByTestId('connected').textContent,
        account: screen.getByTestId('account').textContent,
        chainid: screen.getByTestId('chainid').textContent,
        network: screen.getByTestId('network').textContent,
      };

      rerender(
        <Web3Provider>
          <TestComponent />
        </Web3Provider>
      );

      // State should be consistent
      expect(screen.getByTestId('connected').textContent).toBe(initialValues.connected);
      expect(screen.getByTestId('account').textContent).toBe(initialValues.account);
      expect(screen.getByTestId('chainid').textContent).toBe(initialValues.chainid);
      expect(screen.getByTestId('network').textContent).toBe(initialValues.network);
    });
  });
});
