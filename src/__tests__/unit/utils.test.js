import { formatNumber, extractLanguages, convertTimeZone } from '../../utils/formatters';

describe('Utility Functions', () => {
  describe('formatNumber', () => {
    test('formats large numbers with commas', () => {
      expect(formatNumber(1000)).toBe('1,000');
      expect(formatNumber(1000000)).toBe('1,000,000');
      expect(formatNumber(1234567890)).toBe('1,234,567,890');
    });

    test('handles zero and negative numbers', () => {
      expect(formatNumber(0)).toBe('0');
      expect(formatNumber(-1000)).toBe('-1,000');
    });

    test('returns empty string for undefined or null values', () => {
      expect(formatNumber(undefined)).toBe('');
      expect(formatNumber(null)).toBe('');
    });
  });

  describe('extractLanguages', () => {
    test('extracts language names from language object', () => {
      const languages = { eng: 'English', spa: 'Spanish', fra: 'French' };
      expect(extractLanguages(languages)).toBe('English, Spanish, French');
    });

    test('handles single language', () => {
      const languages = { eng: 'English' };
      expect(extractLanguages(languages)).toBe('English');
    });

    test('returns empty string for undefined or null values', () => {
      expect(extractLanguages(undefined)).toBe('');
      expect(extractLanguages(null)).toBe('');
    });

    test('handles empty language object', () => {
      expect(extractLanguages({})).toBe('');
    });
  });

  describe('convertTimeZone', () => {
    test('converts UTC time to target timezone', () => {
      // Create a fixed date for testing (Jan 1, 2023 12:00:00 UTC)
      const utcDate = new Date(Date.UTC(2023, 0, 1, 12, 0, 0));
      
      // Test conversion to EST (UTC-5)
      const estResult = convertTimeZone(utcDate, 'America/New_York');
      expect(estResult.getHours()).toBe(7); // 12 UTC = 7 EST
      
      // Test conversion to JST (UTC+9)
      const jstResult = convertTimeZone(utcDate, 'Asia/Tokyo');
      expect(jstResult.getHours()).toBe(21); // 12 UTC = 21 JST
    });

    test('handles invalid timezone by returning original date', () => {
      const originalDate = new Date(2023, 0, 1, 12, 0, 0);
      const result = convertTimeZone(originalDate, 'Invalid/Timezone');
      expect(result).toEqual(originalDate);
    });

    test('handles null date input', () => {
      expect(() => convertTimeZone(null, 'America/New_York')).not.toThrow();
    });
  });
});
