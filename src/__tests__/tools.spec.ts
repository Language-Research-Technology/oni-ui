import { describe, expect, it } from 'vitest';

import { parseContentSize } from '@/tools';

describe('parseContentSize', () => {
  it('should return the number itself if it is a valid number and in bytes', () => {
    expect(parseContentSize(1024)).toBe(1024);
    expect(parseContentSize(0)).toBe(0);
  });

  it('should return null for non-number and non-string types', () => {
    // @ts-expect-error normally takes string or number but we want to test other things
    expect(parseContentSize(undefined)).toBeNull();
    // @ts-expect-error normally takes string or number but we want to test other things
    expect(parseContentSize(null)).toBeNull();
    // @ts-expect-error normally takes string or number but we want to test other things
    expect(parseContentSize({})).toBeNull();
    // @ts-expect-error normally takes string or number but we want to test other things
    expect(parseContentSize([])).toBeNull();
    // @ts-expect-error normally takes string or number but we want to test other things
    expect(parseContentSize(() => {})).toBeNull();
  });

  it('should return null for invalid string formats', () => {
    expect(parseContentSize('10 GBs')).toBeNull(); // Invalid suffix
    expect(parseContentSize('random text')).toBeNull(); // Non-matching format
    expect(parseContentSize('10 kb mb')).toBeNull(); // Invalid multiple units
    expect(parseContentSize('')).toBeNull(); // Empty string
  });

  it('should handle valid numeric sizes with units', () => {
    expect(parseContentSize('1 KB')).toBe(1024); // Case-insensitive
    expect(parseContentSize('1 kb')).toBe(1024);
    expect(parseContentSize('2 MB')).toBe(2 * 1024 ** 2);
    expect(parseContentSize('3.5 GB')).toBe(3.5 * 1024 ** 3); // Decimal handling
    expect(parseContentSize('1 TB')).toBe(1024 ** 4);
    expect(parseContentSize('1 bytes')).toBe(1);
    expect(parseContentSize('1 B')).toBe(1);
  });

  it('should handle extra spaces around or within the input string', () => {
    expect(parseContentSize('  5  KB  ')).toBe(5 * 1024); // Handling leading/trailing spaces
    expect(parseContentSize('10     MB')).toBe(10 * 1024 ** 2); // Extra spaces within string
  });

  it('should handle no spaces around or within the input string', () => {
    expect(parseContentSize('  5KB  ')).toBe(5 * 1024); // Handling leading/trailing spaces
    expect(parseContentSize('10MB')).toBe(10 * 1024 ** 2); // Extra spaces within string
  });

  it('should handle edge cases for numeric parsing', () => {
    expect(parseContentSize('0 GB')).toBe(0); // Zero value
    expect(parseContentSize('0.0001 KB')).toBe(0.0001 * 1024); // Small decimal number
  });
});
