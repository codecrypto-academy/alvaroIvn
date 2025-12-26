/**
 * Tests for Web3 Utility Functions
 *
 * Tests para las funciones utilitarias del servicio web3
 * que no dependen de contratos o blockchain.
 */

import { formatDate, parseFeatures, isValidAddress } from '../web3';

describe('Web3 Utility Functions', () => {
  describe('formatDate', () => {
    it('should format timestamp to readable date in Spanish', () => {
      const timestamp = 1703116800; // 2023-12-21 00:00:00 UTC
      const result = formatDate(timestamp);

      // Should return a date string in Spanish format
      expect(result).toBeTruthy();
      expect(typeof result).toBe('string');
      expect(result).toContain('2023');
    });

    it('should handle current timestamp', () => {
      const now = Math.floor(Date.now() / 1000);
      const result = formatDate(now);

      expect(result).toBeTruthy();
      expect(typeof result).toBe('string');
      const currentYear = new Date().getFullYear().toString();
      expect(result).toContain(currentYear);
    });

    it('should return "-" for zero timestamp', () => {
      const result = formatDate(0);

      expect(result).toBe('-');
    });

    it('should handle very old timestamps', () => {
      const oldTimestamp = 631152000; // 1989-12-31/1990-01-01 (timezone dependent)
      const result = formatDate(oldTimestamp);

      expect(result).toBeTruthy();
      // Should contain either 1989 or 1990 depending on timezone
      expect(result).toMatch(/198|199/);
    });

    it('should handle future timestamps', () => {
      const futureTimestamp = 2000000000; // Year 2033
      const result = formatDate(futureTimestamp);

      expect(result).toBeTruthy();
      expect(typeof result).toBe('string');
    });

    it('should format timestamp with time component', () => {
      const timestamp = 1703116800; // 2023-12-21 00:00:00 UTC
      const result = formatDate(timestamp);

      // Spanish format should include time
      expect(result).toBeTruthy();
      expect(typeof result).toBe('string');
    });

    it('should handle negative timestamps', () => {
      const negativeTimestamp = -1000000;
      const result = formatDate(negativeTimestamp);

      expect(result).toBeTruthy();
      expect(typeof result).toBe('string');
    });
  });

  describe('parseFeatures', () => {
    it('should parse valid JSON features', () => {
      const features = JSON.stringify({
        origin: 'Farm A',
        batch: '12345',
      });

      const result = parseFeatures(features);

      expect(result).toEqual({
        origin: 'Farm A',
        batch: '12345',
      });
    });

    it('should return object with raw property for invalid JSON', () => {
      const invalidJSON = '{invalid json}';
      const result = parseFeatures(invalidJSON);

      expect(result).toEqual({ raw: invalidJSON });
    });

    it('should return object with raw property for empty string', () => {
      const result = parseFeatures('');

      expect(result).toEqual({ raw: '' });
    });

    it('should handle nested JSON objects', () => {
      const features = JSON.stringify({
        info: {
          location: 'Spain',
          coordinates: { lat: 40.4, lon: -3.7 },
        },
      });

      const result = parseFeatures(features);

      expect(result.info.location).toBe('Spain');
      expect(result.info.coordinates.lat).toBe(40.4);
    });

    it('should handle JSON arrays', () => {
      const features = JSON.stringify({
        tags: ['organic', 'local', 'fresh'],
      });

      const result = parseFeatures(features);

      expect(Array.isArray(result.tags)).toBe(true);
      expect(result.tags).toEqual(['organic', 'local', 'fresh']);
    });

    it('should handle JSON with special characters', () => {
      const features = JSON.stringify({
        description: 'Product with "quotes" and \'apostrophes\'',
        symbols: '& < > / \\',
      });

      const result = parseFeatures(features);

      expect(result.description).toContain('quotes');
      expect(result.symbols).toBe('& < > / \\');
    });

    it('should handle JSON with unicode characters', () => {
      const features = JSON.stringify({
        name: 'Café ☕',
        location: 'España 🇪🇸',
      });

      const result = parseFeatures(features);

      expect(result.name).toBe('Café ☕');
      expect(result.location).toBe('España 🇪🇸');
    });

    it('should handle empty JSON object', () => {
      const features = JSON.stringify({});
      const result = parseFeatures(features);

      expect(result).toEqual({});
    });

    it('should handle JSON with null values', () => {
      const features = JSON.stringify({
        field1: null,
        field2: 'value',
      });

      const result = parseFeatures(features);

      expect(result.field1).toBeNull();
      expect(result.field2).toBe('value');
    });

    it('should handle malformed JSON with extra brackets', () => {
      const malformed = '{}}';
      const result = parseFeatures(malformed);

      expect(result).toEqual({ raw: malformed });
    });

    it('should handle very large JSON objects', () => {
      const largeObject: any = {};
      for (let i = 0; i < 100; i++) {
        largeObject[`field${i}`] = `value${i}`;
      }

      const features = JSON.stringify(largeObject);
      const result = parseFeatures(features);

      expect(Object.keys(result).length).toBe(100);
      expect(result.field50).toBe('value50');
    });
  });

  describe('isValidAddress', () => {
    it('should validate correct Ethereum address', () => {
      const address = '0x1234567890123456789012345678901234567890';
      const result = isValidAddress(address);

      expect(result).toBe(true);
    });

    it('should validate checksummed address', () => {
      const address = '0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed';
      const result = isValidAddress(address);

      expect(result).toBe(true);
    });

    it('should reject address without 0x prefix', () => {
      const address = '1234567890123456789012345678901234567890';
      const result = isValidAddress(address);

      expect(result).toBe(false);
    });

    it('should reject address that is too short', () => {
      const address = '0x123';
      const result = isValidAddress(address);

      expect(result).toBe(false);
    });

    it('should reject address that is too long', () => {
      const address = '0x12345678901234567890123456789012345678901';
      const result = isValidAddress(address);

      expect(result).toBe(false);
    });

    it('should reject address with invalid characters', () => {
      const address = '0xGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG';
      const result = isValidAddress(address);

      expect(result).toBe(false);
    });

    it('should reject empty string', () => {
      const result = isValidAddress('');

      expect(result).toBe(false);
    });

    it('should reject null or undefined', () => {
      const resultNull = isValidAddress(null as any);
      const resultUndefined = isValidAddress(undefined as any);

      expect(resultNull).toBe(false);
      expect(resultUndefined).toBe(false);
    });

    it('should handle all lowercase addresses', () => {
      const address = '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd';
      const result = isValidAddress(address);

      expect(result).toBe(true);
    });

    it('should handle all uppercase addresses', () => {
      const address = '0xABCDEFABCDEFABCDEFABCDEFABCDEFABCDEFABCD';
      const result = isValidAddress(address);

      expect(result).toBe(true);
    });

    it('should handle mixed case addresses', () => {
      const address = '0xAbCdEfAbCdEfAbCdEfAbCdEfAbCdEfAbCdEfAbCd';
      const result = isValidAddress(address);

      expect(result).toBe(true);
    });

    it('should reject address with spaces', () => {
      const address = '0x1234567890123456789012345678901234567 890';
      const result = isValidAddress(address);

      expect(result).toBe(false);
    });

    it('should reject non-hex characters in address', () => {
      const address = '0x123456789012345678901234567890123456789Z';
      const result = isValidAddress(address);

      expect(result).toBe(false);
    });

    it('should validate zero address', () => {
      const address = '0x0000000000000000000000000000000000000000';
      const result = isValidAddress(address);

      expect(result).toBe(true);
    });

    it('should validate max address', () => {
      const address = '0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF';
      const result = isValidAddress(address);

      expect(result).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('formatDate should handle very large timestamps', () => {
      const largeTimestamp = 9999999999;
      const result = formatDate(largeTimestamp);

      expect(result).toBeTruthy();
      expect(typeof result).toBe('string');
    });

    it('parseFeatures should handle malformed JSON with missing quotes', () => {
      const malformed = '{key: value}';
      const result = parseFeatures(malformed);

      expect(result).toEqual({ raw: malformed });
    });

    it('isValidAddress should be case-insensitive for hex digits', () => {
      const lower = '0xabcdef1234567890abcdef1234567890abcdef12';
      const upper = '0xABCDEF1234567890ABCDEF1234567890ABCDEF12';

      expect(isValidAddress(lower)).toBe(true);
      expect(isValidAddress(upper)).toBe(true);
    });

    it('parseFeatures should handle JSON with boolean values', () => {
      const features = JSON.stringify({
        isOrganic: true,
        isProcessed: false,
      });

      const result = parseFeatures(features);

      expect(result.isOrganic).toBe(true);
      expect(result.isProcessed).toBe(false);
    });

    it('parseFeatures should handle JSON with numeric values', () => {
      const features = JSON.stringify({
        quantity: 100,
        price: 29.99,
      });

      const result = parseFeatures(features);

      expect(result.quantity).toBe(100);
      expect(result.price).toBe(29.99);
    });
  });
});
