import { describe, expect, it } from 'vitest';

import { formatPrice, parsePrice } from './money';

describe('money', () => {
  it('formats cents as reais', () => {
    expect(formatPrice(4500).replace(/\s/g, ' ')).toBe('R$ 45,00');
    expect(formatPrice(104550).replace(/\s/g, ' ')).toBe('R$ 1.045,50');
  });

  it('parses prices typed by the admin', () => {
    expect(parsePrice('45')).toBe(4500);
    expect(parsePrice('45,5')).toBe(4550);
    expect(parsePrice('45,50')).toBe(4550);
    expect(parsePrice('R$ 1.045,00')).toBe(104500);
    expect(parsePrice('0')).toBe(0);
  });

  it('rejects invalid prices', () => {
    expect(parsePrice('')).toBeNull();
    expect(parsePrice('abc')).toBeNull();
    expect(parsePrice('-10')).toBeNull();
    expect(parsePrice('45,555')).toBeNull();
  });
});
