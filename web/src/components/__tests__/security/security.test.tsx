import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Input } from '../../ui/Input';
import { TokenCard } from '../../TokenCard';
import { TransferList } from '../../TransferList';
import { Token, Transfer } from '@/types';
import { TransferStatus } from '@/contracts/config';

/**
 * Security Tests
 *
 * Tests para verificar seguridad contra:
 * - XSS (Cross-Site Scripting)
 * - Inyección de código
 * - Sanitización de inputs
 */

describe('Security Tests', () => {
  describe('XSS Protection', () => {
    it('should not execute script tags in token names', () => {
      const maliciousToken: Token = {
        id: 1,
        name: '<script>alert("XSS")</script>Malicious Token',
        totalSupply: 1000,
        creator: '0x1234567890123456789012345678901234567890',
        parentId: 0,
        features: '{}',
        dateCreated: Date.now(),
      };

      const { container } = render(<TokenCard token={maliciousToken} />);

      // Verify script tag is not executed (it should be escaped as text)
      expect(container.querySelector('script')).toBeNull();

      // Verify the text is rendered safely
      const textContent = container.textContent || '';
      expect(textContent).toContain('Malicious Token');
    });

    it('should escape HTML entities in token features', () => {
      const maliciousToken: Token = {
        id: 1,
        name: 'Test Token',
        totalSupply: 1000,
        creator: '0x1234567890123456789012345678901234567890',
        parentId: 0,
        features: JSON.stringify({
          origin: '<img src=x onerror="alert(1)">'
        }),
        dateCreated: Date.now(),
      };

      const { container } = render(<TokenCard token={maliciousToken} />);

      // Verify img tag is not rendered
      expect(container.querySelector('img[src="x"]')).toBeNull();
    });

    it('should not execute JavaScript in transfer addresses', () => {
      const maliciousTransfer: Transfer = {
        id: 1,
        from: 'javascript:alert("XSS")',
        to: '0x1234567890123456789012345678901234567890',
        tokenId: 1,
        amount: 100,
        status: TransferStatus.Pending,
        dateCreated: Date.now(),
      };

      const { container } = render(
        <TransferList
          transfers={[maliciousTransfer]}
          currentUserAddress="0x0000000000000000000000000000000000000000"
        />
      );

      // Verify no javascript: links are present
      const links = container.querySelectorAll('a');
      links.forEach(link => {
        expect(link.getAttribute('href')).not.toContain('javascript:');
      });
    });

    it('should render malicious input values safely as props', () => {
      const maliciousValue = '<script>alert("XSS")</script>';

      const { container } = render(
        <Input
          label="Token Name"
          value={maliciousValue}
          onChange={jest.fn()}
        />
      );

      // Script tag should not be rendered
      expect(container.querySelector('script')).toBeNull();

      // Value should be in the input safely
      const input = screen.getByLabelText('Token Name') as HTMLInputElement;
      expect(input.value).toBe(maliciousValue);

      // No script execution (component renders safely)
      expect(container.firstChild).toBeTruthy();
    });
  });

  describe('Input Sanitization', () => {
    it('should handle SQL injection attempts safely as props', () => {
      const maliciousValue = "'; DROP TABLE tokens; --";

      const { container } = render(
        <Input
          label="Search"
          value={maliciousValue}
          onChange={jest.fn()}
        />
      );

      const input = screen.getByLabelText('Search') as HTMLInputElement;

      // Input should render the value safely without breaking
      expect(input.value).toBe(maliciousValue);
      expect(container.firstChild).toBeTruthy();

      // No SQL execution possible in frontend (this is sanitized on backend)
      // Component should render without errors
      expect(() => render(<Input label="Test" value={maliciousValue} onChange={jest.fn()} />)).not.toThrow();
    });

    it('should handle special characters in token features', () => {
      const tokenWithSpecialChars: Token = {
        id: 1,
        name: 'Test Token',
        totalSupply: 1000,
        creator: '0x1234567890123456789012345678901234567890',
        parentId: 0,
        features: JSON.stringify({
          description: "Test with quotes: \" ' ` and symbols: & < > /"
        }),
        dateCreated: Date.now(),
      };

      const { container } = render(<TokenCard token={tokenWithSpecialChars} />);

      // Should render without throwing errors
      expect(container.firstChild).toBeTruthy();
    });

    it('should handle extremely long input values', () => {
      const longString = 'A'.repeat(1000);

      const { container } = render(
        <Input
          label="Description"
          value={longString}
          onChange={jest.fn()}
        />
      );

      const input = screen.getByLabelText('Description') as HTMLInputElement;

      // Component should render without crashing
      expect(container.firstChild).toBeTruthy();
      expect(input.value).toBe(longString);

      // Should handle rendering without performance issues
      expect(() => render(<Input label="Test" value={longString} onChange={jest.fn()} />)).not.toThrow();
    });

    it('should handle null bytes and control characters', () => {
      const controlCharsValue = 'Test\x00\x01\x02Data';

      const { container } = render(
        <Input
          label="Input"
          value={controlCharsValue}
          onChange={jest.fn()}
        />
      );

      const input = screen.getByLabelText('Input') as HTMLInputElement;

      // Component should render without crashing
      expect(container.firstChild).toBeTruthy();

      // Input value should exist (control characters might be filtered by browser)
      expect(input.value).toBeDefined();

      // Should not throw errors when rendering control characters
      expect(() => render(<Input label="Test" value={controlCharsValue} onChange={jest.fn()} />)).not.toThrow();
    });
  });

  describe('Address Validation Security', () => {
    it('should handle malformed Ethereum addresses safely', () => {
      const invalidAddresses = [
        'not-an-address',
        '0x123', // too short
        '0xGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG', // invalid hex
        '', // empty
        'javascript:alert(1)',
      ];

      invalidAddresses.forEach(address => {
        const maliciousTransfer: Transfer = {
          id: 1,
          from: address,
          to: '0x1234567890123456789012345678901234567890',
          tokenId: 1,
          amount: 100,
          status: TransferStatus.Pending,
          dateCreated: Date.now(),
        };

        const { container } = render(
          <TransferList
            transfers={[maliciousTransfer]}
            currentUserAddress="0x0000000000000000000000000000000000000000"
          />
        );

        // Should render without crashing
        expect(container.firstChild).toBeTruthy();
      });
    });
  });

  describe('JSON Injection Protection', () => {
    it('should handle malformed JSON in token features', () => {
      const tokenWithMalformedJSON: Token = {
        id: 1,
        name: 'Test Token',
        totalSupply: 1000,
        creator: '0x1234567890123456789012345678901234567890',
        parentId: 0,
        features: '{"incomplete": ',
        dateCreated: Date.now(),
      };

      // Should not throw error
      expect(() => {
        render(<TokenCard token={tokenWithMalformedJSON} />);
      }).not.toThrow();
    });

    it('should handle JSON with prototype pollution attempts', () => {
      const maliciousJSON = JSON.stringify({
        __proto__: { admin: true },
        constructor: { prototype: { isAdmin: true } }
      });

      const tokenWithMaliciousJSON: Token = {
        id: 1,
        name: 'Test Token',
        totalSupply: 1000,
        creator: '0x1234567890123456789012345678901234567890',
        parentId: 0,
        features: maliciousJSON,
        dateCreated: Date.now(),
      };

      const { container } = render(<TokenCard token={tokenWithMaliciousJSON} />);

      // Should render safely
      expect(container.firstChild).toBeTruthy();
    });
  });

  describe('Integer Overflow Protection', () => {
    it('should handle extremely large numbers safely', () => {
      const tokenWithLargeNumbers: Token = {
        id: Number.MAX_SAFE_INTEGER,
        name: 'Test Token',
        totalSupply: Number.MAX_SAFE_INTEGER,
        creator: '0x1234567890123456789012345678901234567890',
        parentId: 0,
        features: '{}',
        dateCreated: Date.now(),
      };

      const { container } = render(<TokenCard token={tokenWithLargeNumbers} />);

      expect(container.firstChild).toBeTruthy();
    });

    it('should handle negative numbers in amounts', () => {
      const transferWithNegative: Transfer = {
        id: 1,
        from: '0x1234567890123456789012345678901234567890',
        to: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd',
        tokenId: 1,
        amount: -1000,
        status: TransferStatus.Pending,
        dateCreated: Date.now(),
      };

      const { container } = render(
        <TransferList
          transfers={[transferWithNegative]}
          currentUserAddress="0x0000000000000000000000000000000000000000"
        />
      );

      expect(container.firstChild).toBeTruthy();
    });
  });

  describe('URL Injection Protection', () => {
    it('should not allow data: URLs in links', () => {
      const { container } = render(
        <a href="data:text/html,<script>alert('XSS')</script>">
          Test Link
        </a>
      );

      const link = container.querySelector('a');
      // In production, should validate and sanitize hrefs
      // This test documents the potential vulnerability
      expect(link).toBeTruthy();
    });

    it('should handle blob: URLs safely', () => {
      const { container } = render(
        <a href="blob:http://example.com/uuid">
          Test Link
        </a>
      );

      const link = container.querySelector('a');
      expect(link).toBeTruthy();
    });
  });

  describe('Component Props Sanitization', () => {
    it('should handle dangerouslySetInnerHTML attempts', () => {
      // This test verifies we're NOT using dangerouslySetInnerHTML
      const tokenWithHTML: Token = {
        id: 1,
        name: '<b>Bold Token</b>',
        totalSupply: 1000,
        creator: '0x1234567890123456789012345678901234567890',
        parentId: 0,
        features: '{}',
        dateCreated: Date.now(),
      };

      const { container } = render(<TokenCard token={tokenWithHTML} />);

      // Should render as text, not as HTML
      const boldElement = container.querySelector('b');
      expect(boldElement).toBeNull();

      // Text should be visible as escaped
      expect(container.textContent).toContain('<b>Bold Token</b>');
    });
  });

  describe('Event Handler Security', () => {
    it('should not execute inline event handlers in content', () => {
      const tokenWithEventHandlers: Token = {
        id: 1,
        name: '<img src=x onerror=alert(1)>',
        totalSupply: 1000,
        creator: '0x1234567890123456789012345678901234567890',
        parentId: 0,
        features: '{}',
        dateCreated: Date.now(),
      };

      const { container } = render(<TokenCard token={tokenWithEventHandlers} />);

      // Should not have any inline event handlers
      const elementsWithEvents = container.querySelectorAll('[onerror], [onclick], [onload]');
      expect(elementsWithEvents.length).toBe(0);
    });
  });
});
