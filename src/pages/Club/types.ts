import { addDays, differenceInCalendarDays, format, parseISO } from 'date-fns';

import { PaymentMethod } from '../../utils/payment';

export interface PlanItem {
  service_id: string;
  service_name: string;
  // null = ilimitado no mês
  quantity: number | null;
}

export interface Plan {
  id: string;
  name: string;
  description: string | null;
  price_cents: number;
  items: PlanItem[];
  min_interval_days: number | null;
  // 0 = domingo; null = todos os dias
  weekdays: number[] | null;
  discount_percent: number;
  active: boolean;
}

export type MembershipState = 'pending' | 'active' | 'overdue' | 'canceled';

export interface MembershipView {
  id: string;
  client: { id: string; name: string };
  plan: { id: string; name: string; price_cents: number };
  status: 'pending' | 'active' | 'canceled';
  state: MembershipState;
  // 'yyyy-MM-dd', exclusivo
  paid_until: string | null;
  requested_at: string | null;
  started_at: string | null;
  canceled_at: string | null;
}

export interface MembershipDetails extends MembershipView {
  cycle: { start: string; end: string } | null;
  usage: Array<{
    service_id: string;
    service_name: string;
    quantity: number | null;
    used: number;
  }>;
  payments: Array<{
    id: string;
    amount_cents: number;
    payment_method: PaymentMethod;
    period_start: string;
    period_end: string;
    paid_at: string;
  }>;
}

export interface PlanNumbers {
  id: string;
  name: string;
  price_cents: number;
  active: boolean;
  subscribers: number;
  received_cents: number;
  uses: number;
  used_value_cents: number;
}

export interface ClubOverview {
  summary: {
    active: number;
    overdue: number;
    pending: number;
    monthly_cents: number;
    canceled_last_30_days: number;
  };
  memberships: MembershipView[];
  plans: PlanNumbers[];
}

// Dias depois do vencimento em que o plano ainda vale (igual à API)
export const GRACE_DAYS = 5;

// "2026-11-05" -> "05/11/2026"
export const formatDay = (day: string): string =>
  format(parseISO(day), 'dd/MM/yyyy');

// Última data coberta (o "pago até" da API é exclusivo)
export const lastPaidDay = (paidUntil: string): string =>
  format(addDays(parseISO(paidUntil), -1), 'dd/MM/yyyy');

export type StateTone =
  | 'success'
  | 'warning'
  | 'danger'
  | 'primary'
  | 'neutral';

// Situação para a tela: pedido, em dia, vence logo ou em atraso
export function stateInfo(
  membership: Pick<MembershipView, 'state' | 'paid_until'>,
  today = new Date(),
): { label: string; tone: StateTone } {
  if (membership.state === 'pending') {
    return { label: 'Pedido pelo site', tone: 'primary' };
  }

  if (membership.state === 'canceled') {
    return { label: 'Cancelada', tone: 'neutral' };
  }

  if (membership.state === 'overdue') {
    return { label: 'Em atraso', tone: 'danger' };
  }

  if (membership.paid_until) {
    const days = differenceInCalendarDays(
      parseISO(membership.paid_until),
      today,
    );

    if (days <= 0) {
      return { label: 'Vencida (na tolerância)', tone: 'warning' };
    }

    if (days <= 7) {
      return {
        label: days === 1 ? 'Vence amanhã' : `Vence em ${days} dias`,
        tone: 'warning',
      };
    }
  }

  return { label: 'Em dia', tone: 'success' };
}

// "Corte ilimitado · 2 barbas/mês"
export function describeItems(items: PlanItem[]): string {
  return items
    .map(item =>
      item.quantity === null
        ? `${item.service_name} ilimitado`
        : `${item.quantity}× ${item.service_name}/mês`,
    )
    .join(' · ');
}
