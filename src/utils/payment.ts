// Formas de pagamento registradas no atendimento (iguais às da API);
// 'membership' = incluso no plano do clube ou num pacote (nada a receber)
export type PaymentMethod = 'pix' | 'credit' | 'debit' | 'cash' | 'membership';

// Formas de receber dinheiro (para escolher na tela)
export const PAYMENT_METHODS: PaymentMethod[] = [
  'pix',
  'credit',
  'debit',
  'cash',
];

export const PAYMENT_LABELS: Record<PaymentMethod, string> = {
  pix: 'Pix',
  credit: 'Crédito',
  debit: 'Débito',
  cash: 'Dinheiro',
  membership: 'Incluso no plano',
};

// "4500" -> "45,00": valor para mostrar num campo de texto
export function centsToInput(cents: number): string {
  return (cents / 100).toFixed(2).replace('.', ',');
}
