const { parseContentSize } = require('./tools'); // Import the function from tools.js

describe('parseContentSize', () => {
  test('should return the number itself if it is a valid number and in bytes', () => {
    expect(parseContentSize(1024)).toBe(1024);
    expect(parseContentSize(0)).toBe(0);
  });

  test('should return null for non-number and non-string types', () => {
    expect(parseContentSize(undefined)).toBeNull();
    expect(parseContentSize(null)).toBeNull();
    expect(parseContentSize({})).toBeNull();
    expect(parseContentSize([])).toBeNull();
    expect(parseContentSize(() => {})).toBeNull();
  });

  test('should return null for invalid string formats', () => {
    expect(parseContentSize('10 GBs')).toBeNull(); // Invalid suffix
    expect(parseContentSize('random text')).toBeNull(); // Non-matching format
    expect(parseContentSize('10 kb mb')).toBeNull(); // Invalid multiple units
    expect(parseContentSize('')).toBeNull(); // Empty string
  });

  test('should handle valid numeric sizes with units', () => {
    expect(parseContentSize('1 KB')).toBe(1024); // Case-insensitive
    expect(parseContentSize('1 kb')).toBe(1024);
    expect(parseContentSize('2 MB')).toBe(2 * 1024 ** 2);
    expect(parseContentSize('3.5 GB')).toBe(3.5 * 1024 ** 3); // Decimal handling
    expect(parseContentSize('1 TB')).toBe(1024 ** 4);
    expect(parseContentSize('1 bytes')).toBe(1);
    expect(parseContentSize('1 B')).toBe(1);
  });

  test('should handle extra spaces around or within the input string', () => {
    expect(parseContentSize('  5  KB  ')).toBe(5 * 1024); // Handling leading/trailing spaces
    expect(parseContentSize('10     MB')).toBe(10 * 1024 ** 2); // Extra spaces within string
  });

  test('should handle no spaces around or within the input string', () => {
    expect(parseContentSize('  5KB  ')).toBe(5 * 1024); // Handling leading/trailing spaces
    expect(parseContentSize('10MB')).toBe(10 * 1024 ** 2); // Extra spaces within string
  });

  test('should handle edge cases for numeric parsing', () => {
    expect(parseContentSize('0 GB')).toBe(0); // Zero value
    expect(parseContentSize('0.0001 KB')).toBe(0.0001 * 1024); // Small decimal number
  });
});
