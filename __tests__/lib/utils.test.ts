import { weightedSum, clamp, groupBy, median, formatBytes } from '../../lib/utils';

describe('utils', () => {
  describe('weightedSum', () => {
    it('computes weighted average correctly', () => {
      const result = weightedSum([
        { weight: 0.5, value: 1 },
        { weight: 0.5, value: 0 },
      ]);
      expect(result).toBe(0.5);
    });

    it('clamps result to [0, 1]', () => {
      expect(weightedSum([{ weight: 1, value: 2 }])).toBe(1);
      expect(weightedSum([{ weight: 1, value: -1 }])).toBe(0);
    });

    it('returns 0 for zero total weight', () => {
      expect(weightedSum([])).toBe(0);
    });
  });

  describe('clamp', () => {
    it('clamps values to range', () => {
      expect(clamp(5, 0, 10)).toBe(5);
      expect(clamp(-5, 0, 10)).toBe(0);
      expect(clamp(15, 0, 10)).toBe(10);
    });
  });

  describe('groupBy', () => {
    it('groups items by key function', () => {
      const items = [{ t: 'a' }, { t: 'b' }, { t: 'a' }];
      const grouped = groupBy(items, i => i.t);
      expect(grouped['a']).toHaveLength(2);
      expect(grouped['b']).toHaveLength(1);
    });
  });

  describe('median', () => {
    it('computes median of odd-length array', () => {
      expect(median([3, 1, 2])).toBe(2);
    });

    it('computes median of even-length array', () => {
      expect(median([1, 2, 3, 4])).toBe(2.5);
    });

    it('returns 0 for empty array', () => {
      expect(median([])).toBe(0);
    });
  });

  describe('formatBytes', () => {
    it('formats bytes correctly', () => {
      expect(formatBytes(0)).toBe('0 B');
      expect(formatBytes(1024)).toBe('1 KB');
      expect(formatBytes(1024 * 1024)).toBe('1 MB');
      expect(formatBytes(1.5 * 1024 * 1024)).toBe('1.5 MB');
    });
  });
});
