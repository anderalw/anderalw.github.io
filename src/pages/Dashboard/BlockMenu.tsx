import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { addDays, differenceInCalendarDays, format, isSameDay } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';
import { FiSlash, FiTrash2 } from 'react-icons/fi';

import { ParsedBlock, describeDays } from './agenda';
import { MenuBackdrop, Menu, MenuHeader, DangerMenuItem } from './styles';

interface BlockMenuProps {
  // Ponto do clique na tela, onde o menu abre
  x: number;
  y: number;
  block: ParsedBlock;
  providerName: string;
  removing: boolean;
  onRemove(): void;
  onClose(): void;
}

const MARGIN = 8;

// 'yyyy-MM-dd' → 'dd/MM'
const shortDate = (value: string): string =>
  `${value.slice(8, 10)}/${value.slice(5, 7)}`;

const isMidnight = (date: Date): boolean =>
  date.getHours() === 0 && date.getMinutes() === 0;

// Bloqueio de dias inteiros (de meia-noite a meia-noite)
function wholeDays({ parsedStart, parsedEnd }: ParsedBlock): number {
  return isMidnight(parsedStart) && isMidnight(parsedEnd)
    ? differenceInCalendarDays(parsedEnd, parsedStart)
    : 0;
}

// "11:00 – 12:00" no mesmo dia, "Dia inteiro", "01/10 a 02/10" em dias
// inteiros e "20/05 18:00 – 21/05 12:00" nos outros casos
export function blockRange(block: ParsedBlock): string {
  const { parsedStart, parsedEnd } = block;
  const days = wholeDays(block);

  if (days === 1) return 'Dia inteiro';

  if (days > 1) {
    return `${format(parsedStart, 'dd/MM')} a ${format(
      addDays(parsedEnd, -1),
      'dd/MM',
    )}`;
  }

  if (isSameDay(parsedStart, parsedEnd)) {
    return `${format(parsedStart, 'HH:mm')} – ${format(parsedEnd, 'HH:mm')}`;
  }

  return `${format(parsedStart, 'dd/MM HH:mm')} – ${format(
    parsedEnd,
    'dd/MM HH:mm',
  )}`;
}

// Menu que abre ao clicar num horário bloqueado: mostra o período e o
// motivo, com a opção de remover o bloqueio
const BlockMenu: React.FC<BlockMenuProps> = ({
  x,
  y,
  block,
  providerName,
  removing,
  onRemove,
  onClose,
}) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const firstItemRef = useRef<HTMLButtonElement>(null);
  const [position, setPosition] = useState({ left: x, top: y });

  // Mantém o menu inteiro dentro da tela
  useLayoutEffect(() => {
    const menu = menuRef.current;

    if (!menu) return;

    const { width, height } = menu.getBoundingClientRect();
    const left =
      x + width + MARGIN > window.innerWidth ? Math.max(MARGIN, x - width) : x;
    const top =
      y + height + MARGIN > window.innerHeight
        ? Math.max(MARGIN, y - height)
        : y;

    setPosition({ left, top });
  }, [x, y]);

  useEffect(() => {
    firstItemRef.current?.focus();

    function handleKeyDown(event: KeyboardEvent): void {
      if (event.key === 'Escape' && !removing) onClose();
    }

    window.addEventListener('keydown', handleKeyDown);

    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, removing]);

  const { recurrence } = block;

  // Um dia só: mostra a data antes do horário
  const sameDay =
    isSameDay(block.parsedStart, block.parsedEnd) || wholeDays(block) === 1;

  return (
    <MenuBackdrop
      onMouseDown={event => {
        if (event.target === event.currentTarget && !removing) onClose();
      }}
    >
      <Menu
        ref={menuRef}
        role="menu"
        aria-label={`Bloqueio de ${providerName}`}
        style={position}
      >
        <MenuHeader>
          <FiSlash />
          <div>
            <strong>{block.reason || 'Horário bloqueado'}</strong>
            {recurrence ? (
              <>
                <small>
                  {`${describeDays(recurrence.days_of_week)} · ${
                    recurrence.start_time
                  } – ${recurrence.end_time}`}
                </small>
                <small>
                  {`A partir de ${shortDate(recurrence.starts_on)} · ${
                    recurrence.ends_on
                      ? `até ${shortDate(recurrence.ends_on)}`
                      : 'sem data de fim'
                  }`}
                </small>
              </>
            ) : (
              <small>
                {sameDay &&
                  `${format(block.parsedStart, "EEE, d 'de' MMM", {
                    locale: ptBR,
                  })} · `}
                {blockRange(block)}
              </small>
            )}
            <small>{providerName}</small>
          </div>
        </MenuHeader>

        <DangerMenuItem
          ref={firstItemRef}
          type="button"
          role="menuitem"
          disabled={removing}
          onClick={onRemove}
        >
          <FiTrash2 />
          {removing && 'Removendo...'}
          {!removing &&
            (recurrence
              ? 'Remover repetição (todos os dias)'
              : 'Remover bloqueio')}
        </DangerMenuItem>
      </Menu>
    </MenuBackdrop>
  );
};

export default BlockMenu;
