import { describe, expect, it } from 'vitest';

import { formatPhone, looksLikePhone, maskPhone, onlyDigits } from './phone';

describe('phone', () => {
  it('aplica a máscara aos poucos, enquanto digita', () => {
    expect(maskPhone('')).toBe('');
    expect(maskPhone('1')).toBe('(1');
    expect(maskPhone('11')).toBe('(11');
    expect(maskPhone('119')).toBe('(11) 9');
    expect(maskPhone('119999')).toBe('(11) 9999');
    expect(maskPhone('1133334444')).toBe('(11) 3333-4444');
    expect(maskPhone('11999990000')).toBe('(11) 99999-0000');
  });

  it('ignora o que não é número e corta depois de 11 números', () => {
    expect(maskPhone('(11) 99999-00001234')).toBe('(11) 99999-0000');
    expect(maskPhone('abc11x9')).toBe('(11) 9');
  });

  it('formata telefones gravados para exibir', () => {
    expect(formatPhone('11999990000')).toBe('(11) 99999-0000');
    expect(formatPhone('1133334444')).toBe('(11) 3333-4444');
    // Sem DDD
    expect(formatPhone('912345678')).toBe('91234-5678');
    // Formato inesperado fica como está
    expect(formatPhone('000')).toBe('000');
  });

  it('reconhece um termo de busca que parece telefone', () => {
    expect(looksLikePhone('(11) 9999')).toBe(true);
    expect(looksLikePhone('Maria')).toBe(false);
    expect(looksLikePhone('()')).toBe(false);
    expect(onlyDigits('(11) 9999-0000')).toBe('1199990000');
  });
});
