const currency = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});

// 4500 -> "R$ 45,00"
export function formatPrice(cents: number): string {
  return currency.format(cents / 100);
}

// Preço de serviço para o cliente: zero vira "Sem custo" (orçamento, retorno)
export function formatServicePrice(cents: number): string {
  return cents === 0 ? 'Sem custo' : formatPrice(cents);
}

// "45", "45,5", "45,50" ou "R$ 1.045,00" -> centavos; null se inválido
export function parsePrice(text: string): number | null {
  const normalized = text
    .replace(/[R$\s]/g, '')
    .replace(/\./g, '')
    .replace(',', '.');

  if (!/^\d+(\.\d{1,2})?$/.test(normalized)) {
    return null;
  }

  return Math.round(Number(normalized) * 100);
}
