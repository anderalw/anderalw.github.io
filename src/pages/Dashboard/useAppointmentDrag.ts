import React, { useCallback, useEffect, useRef, useState } from 'react';

import { AgendaProvider, ParsedAppointment } from './agenda';

// Arrastar um agendamento na agenda do dia: para cima/baixo muda o horário,
// para outra coluna troca de barbeiro. Ao soltar, quem chamou confirma

// O horário anda de 5 em 5 minutos
const SNAP_MINUTES = 5;
// Até aqui é um clique (abre os detalhes), não um arraste
const DRAG_THRESHOLD = 6;

export interface DragPreview {
  appointment: ParsedAppointment;
  provider_id: string;
  start: Date;
  end: Date;
}

export interface DropTarget {
  appointment: ParsedAppointment;
  from: AgendaProvider;
  to: AgendaProvider;
  start: Date;
  end: Date;
}

interface Options {
  day: Date;
  startHour: number;
  endHour: number;
  hourHeight: number;
  // Barbeiros que podem receber o agendamento
  providers: AgendaProvider[];
  // Corpo da grade: as colunas têm data-provider-id
  gridRef: React.RefObject<HTMLElement>;
  onDrop(target: DropTarget): void;
}

interface Pending {
  appointment: ParsedAppointment;
  from: AgendaProvider;
  pointerX: number;
  pointerY: number;
  // Distância do ponteiro ao topo do card
  grabOffset: number;
  durationMinutes: number;
  moved: boolean;
}

interface Target {
  provider: AgendaProvider;
  start: Date;
  end: Date;
}

// Coluna sob o ponteiro ou, fora da grade, a mais próxima
function columnAt(grid: HTMLElement, clientX: number): HTMLElement | null {
  const columns = Array.from(
    grid.querySelectorAll<HTMLElement>('[data-provider-id]'),
  );
  const distance = (element: HTMLElement): number => {
    const rect = element.getBoundingClientRect();

    if (clientX >= rect.left && clientX < rect.right) return 0;

    return Math.min(
      Math.abs(clientX - rect.left),
      Math.abs(clientX - rect.right),
    );
  };

  return columns.reduce<HTMLElement | null>(
    (closest, item) =>
      !closest || distance(item) < distance(closest) ? item : closest,
    null,
  );
}

export default function useAppointmentDrag(options: Options): {
  preview: DragPreview | null;
  startDrag(
    event: React.PointerEvent<HTMLElement>,
    appointment: ParsedAppointment,
    from: AgendaProvider,
  ): void;
  // Logo depois de arrastar, o clique do card não abre os detalhes
  wasDragging(): boolean;
} {
  // As funções abaixo ficam as mesmas durante o arraste (os ouvintes da
  // janela são registrados uma vez) e leem as opções mais recentes daqui
  const optionsRef = useRef(options);
  optionsRef.current = options;

  const pending = useRef<Pending | null>(null);
  const justDragged = useRef(false);
  const [preview, setPreview] = useState<DragPreview | null>(null);

  const targetAt = useCallback(
    (clientX: number, clientY: number, drag: Pending): Target | null => {
      const { gridRef, providers, startHour, endHour, hourHeight, day } =
        optionsRef.current;
      const grid = gridRef.current;
      const column = grid && columnAt(grid, clientX);
      const provider =
        column && providers.find(item => item.id === column.dataset.providerId);

      if (!column || !provider) return null;

      const top =
        clientY - column.getBoundingClientRect().top - drag.grabOffset - 2;
      const raw = startHour * 60 + (top / hourHeight) * 60;
      const snapped = Math.round(raw / SNAP_MINUTES) * SNAP_MINUTES;
      const minutes = Math.min(
        Math.max(snapped, startHour * 60),
        endHour * 60 - drag.durationMinutes,
      );

      const start = new Date(day);
      start.setHours(0, minutes, 0, 0);

      return {
        provider,
        start,
        end: new Date(start.getTime() + drag.durationMinutes * 60 * 1000),
      };
    },
    [],
  );

  const listeners = useRef<{
    move(event: PointerEvent): void;
    up(event: PointerEvent): void;
    key(event: KeyboardEvent): void;
  } | null>(null);

  const stop = useCallback(() => {
    pending.current = null;
    setPreview(null);
    document.body.style.removeProperty('user-select');
    document.body.style.removeProperty('cursor');

    if (listeners.current) {
      window.removeEventListener('pointermove', listeners.current.move);
      window.removeEventListener('pointerup', listeners.current.up);
      window.removeEventListener('keydown', listeners.current.key);
    }
  }, []);

  if (!listeners.current) {
    listeners.current = {
      move(event) {
        const drag = pending.current;

        if (!drag) return;

        if (
          !drag.moved &&
          Math.hypot(
            event.clientX - drag.pointerX,
            event.clientY - drag.pointerY,
          ) < DRAG_THRESHOLD
        ) {
          return;
        }

        drag.moved = true;
        document.body.style.setProperty('cursor', 'grabbing');

        const target = targetAt(event.clientX, event.clientY, drag);

        if (target) {
          setPreview({
            appointment: drag.appointment,
            provider_id: target.provider.id,
            start: target.start,
            end: target.end,
          });
        }
      },

      up(event) {
        const drag = pending.current;

        stop();

        if (!drag || !drag.moved) return;

        justDragged.current = true;
        // O clique que vem logo depois do pointerup é ignorado uma vez
        setTimeout(() => {
          justDragged.current = false;
        }, 0);

        const target = targetAt(event.clientX, event.clientY, drag);

        if (
          target &&
          (target.provider.id !== drag.from.id ||
            target.start.getTime() !== drag.appointment.parsedDate.getTime())
        ) {
          optionsRef.current.onDrop({
            appointment: drag.appointment,
            from: drag.from,
            to: target.provider,
            start: target.start,
            end: target.end,
          });
        }
      },

      // Esc cancela o arraste
      key(event) {
        if (event.key === 'Escape') stop();
      },
    };
  }

  const startDrag = useCallback(
    (
      event: React.PointerEvent<HTMLElement>,
      appointment: ParsedAppointment,
      from: AgendaProvider,
    ) => {
      // Só com o mouse: no toque, arrastar rola a agenda
      if (event.pointerType !== 'mouse' || event.button !== 0) return;
      if (!listeners.current) return;

      const rect = event.currentTarget.getBoundingClientRect();

      pending.current = {
        appointment,
        from,
        pointerX: event.clientX,
        pointerY: event.clientY,
        grabOffset: event.clientY - rect.top,
        durationMinutes: Math.round(
          (appointment.parsedEnd.getTime() - appointment.parsedDate.getTime()) /
            60000,
        ),
        moved: false,
      };
      document.body.style.setProperty('user-select', 'none');

      window.addEventListener('pointermove', listeners.current.move);
      window.addEventListener('pointerup', listeners.current.up);
      window.addEventListener('keydown', listeners.current.key);
    },
    [],
  );

  // Saiu da tela no meio de um arraste
  useEffect(() => stop, [stop]);

  const wasDragging = useCallback(() => justDragged.current, []);

  return { preview, startDrag, wasDragging };
}
