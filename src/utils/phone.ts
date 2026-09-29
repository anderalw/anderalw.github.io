// Telefones brasileiros: o sistema guarda só os números e o front formata

export function onlyDigits(value: string): string {
  return value.replace(/\D/g, '');
}

// Máscara enquanto digita, com DDD: "11999990000" -> "(11) 99999-0000".
// Aceita no máximo 11 números (DDD + celular)
export function maskPhone(value: string): string {
  const digits = onlyDigits(value).slice(0, 11);

  if (digits.length === 0) return '';
  if (digits.length <= 2) return `(${digits}`;

  const ddd = digits.slice(0, 2);
  const number = digits.slice(2);

  if (number.length <= 4) return `(${ddd}) ${number}`;

  // Fixo (8 números) ou celular (9): o traço fica antes dos 4 últimos
  const split = number.length === 9 ? 5 : 4;

  return `(${ddd}) ${number.slice(0, split)}-${number.slice(split)}`;
}

// Exibição de um telefone gravado. Números sem DDD (8 ou 9) ganham só o
// traço; formatos inesperados aparecem como estão
export function formatPhone(value: string): string {
  const digits = onlyDigits(value);

  if (digits.length === 10 || digits.length === 11) return maskPhone(digits);

  if (digits.length === 8 || digits.length === 9) {
    const split = digits.length - 4;

    return `${digits.slice(0, split)}-${digits.slice(split)}`;
  }

  return value;
}

// Link tel: só com números (e o "+" do código do país)
export function phoneHref(value: string): string {
  return `tel:${value.replace(/[^\d+]/g, '')}`;
}

// Parece um telefone digitado (números, espaço, parênteses, + e -)?
export function looksLikePhone(value: string): boolean {
  return /^[\d\s()+-]+$/.test(value.trim()) && /\d/.test(value);
}
