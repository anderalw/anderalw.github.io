import React, { useEffect, useMemo, useRef } from 'react';
import { format } from 'date-fns';
import { FiZap } from 'react-icons/fi';

import {
  AgendaProvider,
  ParsedAppointment,
  ParsedBlock,
  providerColor,
  toHour,
} from './agenda';
import {
  MenuBackdrop,
  Menu,
  MenuHeader,
  WalkInItem,
  WalkInStatus,
} from './styles';

interface WalkInMenuProps {
  // Canto do botão "Encaixe", onde o menu abre
  x: number;
  y: number;
  now: Date;
  providers: AgendaProvider[];
  // Todos (para a cor de cada um ser a mesma da agenda)
  allProviders: AgendaProvider[];
  appointments: ParsedAppointment[];
  blocks: ParsedBlock[];
  onPick(provider: AgendaProvider, start: Date, color: string): void;
  onClose(): void;
}

interface Availability {
  provider: AgendaProvider;
  // null: não atende mais hoje
  freeAt: Date | null;
  // Minutos livres a partir de freeAt (null: até o fim do expediente)
  freeMinutes: number | null;
  reason?: string;
}

const STEP_MS = 5 * 60 * 1000;

function atHour(day: Date, hour: number): Date {
  const date = new Date(day);

  date.setHours(0, Math.round(hour * 60), 0, 0);

  return date;
}

// Primeiro horário livre de cada barbeiro a partir de agora (de 5 em 5
// minutos) e quanto tempo ele fica livre até o próximo compromisso
function availability(
  provider: AgendaProvider,
  now: Date,
  appointments: ParsedAppointment[],
  blocks: ParsedBlock[],
): Availability {
  if (!provider.schedule) {
    return { provider, freeAt: null, freeMinutes: null, reason: 'Folga' };
  }

  const workStart = atHour(now, toHour(provider.schedule.start_time));
  const workEnd = atHour(now, toHour(provider.schedule.end_time));
  const busy = [
    ...appointments
      .filter(item => item.provider_id === provider.id)
      .map(item => ({ start: item.parsedDate, end: item.parsedBlockedUntil })),
    ...blocks
      .filter(item => item.provider_id === provider.id)
      .map(item => ({ start: item.parsedStart, end: item.parsedEnd })),
  ];

  let freeAt = new Date(Math.ceil(now.getTime() / STEP_MS) * STEP_MS);

  if (freeAt < workStart) freeAt = workStart;

  // Pula o que estiver ocupando o horário até achar uma folga
  for (;;) {
    const at = freeAt;
    const covering = busy.find(item => item.start <= at && item.end > at);

    if (!covering) break;

    freeAt = new Date(Math.ceil(covering.end.getTime() / STEP_MS) * STEP_MS);
  }

  if (freeAt >= workEnd) {
    return {
      provider,
      freeAt: null,
      freeMinutes: null,
      reason: 'Sem horário hoje',
    };
  }

  const next = busy
    .filter(item => item.start > freeAt)
    .reduce<Date | null>(
      (first, item) => (!first || item.start < first ? item.start : first),
      null,
    );
  const until = next && next < workEnd ? next : null;

  return {
    provider,
    freeAt,
    freeMinutes: until
      ? Math.round((until.getTime() - freeAt.getTime()) / 60000)
      : null,
  };
}

function statusText(item: Availability, now: Date): string {
  if (!item.freeAt) return item.reason || '';

  const when =
    item.freeAt.getTime() - now.getTime() < STEP_MS
      ? 'Livre agora'
      : `Livre às ${format(item.freeAt, 'HH:mm')}`;

  if (item.freeMinutes === null) return `${when} · até o fim do dia`;

  return `${when} · ${item.freeMinutes} min até o próximo`;
}

// Cliente chegou sem hora marcada: mostra quem está livre agora (ou o quanto
// antes) e abre o agendamento já no horário certo
const WalkInMenu: React.FC<WalkInMenuProps> = ({
  x,
  y,
  now,
  providers,
  allProviders,
  appointments,
  blocks,
  onPick,
  onClose,
}) => {
  const firstItemRef = useRef<HTMLButtonElement>(null);

  const list = useMemo(
    () =>
      providers
        .map(provider => availability(provider, now, appointments, blocks))
        .sort((a, b) => {
          if (!a.freeAt) return 1;
          if (!b.freeAt) return -1;

          return a.freeAt.getTime() - b.freeAt.getTime();
        }),
    [providers, now, appointments, blocks],
  );

  useEffect(() => {
    firstItemRef.current?.focus();

    function handleKeyDown(event: KeyboardEvent): void {
      if (event.key === 'Escape') onClose();
    }

    window.addEventListener('keydown', handleKeyDown);

    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const firstFree = list.findIndex(item => !!item.freeAt);

  return (
    <MenuBackdrop
      onMouseDown={event => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <Menu
        role="menu"
        aria-label="Encaixar cliente"
        style={{ right: Math.max(8, window.innerWidth - x), top: y }}
      >
        <MenuHeader>
          <FiZap />
          <div>
            <strong>Encaixar agora</strong>
            <small>Cliente sem horário marcado</small>
          </div>
        </MenuHeader>

        {list.length === 0 && (
          <WalkInStatus as="p" style={{ padding: '8px 10px' }}>
            Nenhum barbeiro disponível para você encaixar.
          </WalkInStatus>
        )}

        {list.map((item, index) => {
          const color = providerColor(item.provider.id, allProviders);

          return (
            <WalkInItem
              key={item.provider.id}
              ref={index === firstFree ? firstItemRef : undefined}
              type="button"
              role="menuitem"
              color={color}
              disabled={!item.freeAt}
              onClick={() =>
                item.freeAt && onPick(item.provider, item.freeAt, color)
              }
            >
              <span>{item.provider.name}</span>
              <WalkInStatus free={!!item.freeAt}>
                {statusText(item, now)}
              </WalkInStatus>
            </WalkInItem>
          );
        })}
      </Menu>
    </MenuBackdrop>
  );
};

export default WalkInMenu;
