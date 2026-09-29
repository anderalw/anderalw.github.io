import { addDays, max, min, parseISO, startOfDay } from 'date-fns';

// Tipos e regras comuns às visões de dia e de semana da agenda

export interface AgendaProvider {
  id: string;
  name: string;
  avatar_url: string | null;
  // false: desativado, aparece só nos dias em que já tinha atendimentos
  active: boolean;
  // null = folga neste dia da semana
  schedule: { start_time: string; end_time: string } | null;
}

export interface AgendaAppointment {
  id: string;
  date: string;
  // Fim do atendimento: início + duração do serviço
  end_date: string;
  // Fim do intervalo depois do atendimento (igual a end_date sem intervalo)
  blocked_until: string;
  provider_id: string;
  // null em agendamentos anteriores ao cadastro de serviços
  service: { id: string; name: string } | null;
  price_cents: number | null;
  created_at: string;
  // email null: cliente cadastrado pelo barbeiro sem e-mail
  client: {
    id: string;
    name: string;
    email: string | null;
    phone: string;
  } | null;
}

// Período em que o barbeiro não atende (almoço, consulta, férias). Pode
// começar antes ou terminar depois do dia mostrado
export interface AgendaBlock {
  id: string;
  provider_id: string;
  start_date: string;
  end_date: string;
  reason: string | null;
  // Bloqueio que se repete: a regra; null no avulso
  recurrence: {
    days_of_week: number[];
    start_time: string;
    end_time: string;
    // 'yyyy-MM-dd'; ends_on null = sem data de fim
    starts_on: string;
    ends_on: string | null;
  } | null;
}

export { default as describeDays } from '../../utils/describeDays';

export interface Agenda {
  providers: AgendaProvider[];
  appointments: AgendaAppointment[];
  blocks: AgendaBlock[];
}

export type ParsedBlock = AgendaBlock & {
  parsedStart: Date;
  parsedEnd: Date;
};

export function parseBlocks(blocks: AgendaBlock[] = []): ParsedBlock[] {
  return blocks.map(block => ({
    ...block,
    parsedStart: parseISO(block.start_date),
    parsedEnd: parseISO(block.end_date),
  }));
}

// Posição do bloqueio na coluna de um dia, cortado às horas mostradas.
// null se ele não aparece nesse intervalo
export function blockPosition(
  block: ParsedBlock,
  day: Date,
  startHour: number,
  endHour: number,
  hourHeight: number,
): { top: number; height: number } | null {
  const shownStart = startOfDay(day);
  shownStart.setHours(startHour);
  // endHour 24 vira a meia-noite do dia seguinte
  const shownEnd = startOfDay(day);
  shownEnd.setHours(endHour);

  const from = max([block.parsedStart, shownStart]);
  const to = min([block.parsedEnd, shownEnd, addDays(startOfDay(day), 1)]);

  if (to.getTime() <= from.getTime()) return null;

  const hour = 60 * 60 * 1000;

  return {
    top: ((from.getTime() - shownStart.getTime()) / hour) * hourHeight,
    height: ((to.getTime() - from.getTime()) / hour) * hourHeight,
  };
}

export type ParsedAppointment = AgendaAppointment & {
  parsedDate: Date;
  parsedEnd: Date;
  parsedBlockedUntil: Date;
};

export function parseAppointments(
  appointments: AgendaAppointment[],
): ParsedAppointment[] {
  return appointments.map(appointment => ({
    ...appointment,
    parsedDate: parseISO(appointment.date),
    parsedEnd: parseISO(appointment.end_date),
    parsedBlockedUntil: parseISO(appointment.blocked_until),
  }));
}

// Uma cor por barbeiro, como os calendários do Google Agenda
const PROVIDER_COLORS = [
  '#ff9000',
  '#4dabf7',
  '#51cf66',
  '#cc5de8',
  '#ff6b6b',
  '#20c997',
  '#fcc419',
  '#748ffc',
];

// A cor segue a ordem dos ativos por nome (depois os desativados): assim o
// barbeiro tem a mesma cor em qualquer dia e nas duas visões
export function providerColor(
  providerId: string,
  providers: AgendaProvider[],
): string {
  const byName = (a: AgendaProvider, b: AgendaProvider): number =>
    a.name.localeCompare(b.name);
  const ordered = [
    ...providers.filter(provider => provider.active).sort(byName),
    ...providers.filter(provider => !provider.active).sort(byName),
  ];
  const index = Math.max(
    0,
    ordered.findIndex(provider => provider.id === providerId),
  );

  return PROVIDER_COLORS[index % PROVIDER_COLORS.length];
}

export function toHour(time: string): number {
  return Number(time.split(':')[0]);
}

// Intervalo mostrado quando ninguém trabalha
export const DEFAULT_START_HOUR = 8;
export const DEFAULT_END_HOUR = 18;

// Da primeira hora de expediente à última, incluindo atendimentos que
// estejam fora desse intervalo
export function hourRange(
  schedules: { start_time: string; end_time: string }[],
  appointments: ParsedAppointment[],
): [number, number] {
  const starts: number[] = [];
  const ends: number[] = [];

  schedules.forEach(schedule => {
    starts.push(toHour(schedule.start_time));
    ends.push(toHour(schedule.end_time));
  });

  appointments.forEach(appointment => {
    const end = appointment.parsedEnd;

    starts.push(appointment.parsedDate.getHours());
    // Um atendimento que termina às 10:15 precisa da linha das 10h
    ends.push(Math.ceil(end.getHours() + end.getMinutes() / 60));
  });

  if (starts.length === 0) {
    return [DEFAULT_START_HOUR, DEFAULT_END_HOUR];
  }

  return [Math.min(...starts), Math.max(...ends)];
}

export const MONTHS = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
];
