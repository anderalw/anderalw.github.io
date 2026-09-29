import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';
import { FiCalendar, FiPlus } from 'react-icons/fi';

import { MenuBackdrop, Menu, MenuHeader, MenuItem } from './styles';

interface SlotMenuProps {
  // Ponto do clique na tela, onde o menu abre
  x: number;
  y: number;
  providerName: string;
  start: Date;
  onNewAppointment(): void;
  onClose(): void;
}

// Espaço mínimo entre o menu e as bordas da tela
const MARGIN = 8;

// Menu que abre ao clicar num horário livre da agenda
const SlotMenu: React.FC<SlotMenuProps> = ({
  x,
  y,
  providerName,
  start,
  onNewAppointment,
  onClose,
}) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const firstItemRef = useRef<HTMLButtonElement>(null);
  const [position, setPosition] = useState({ left: x, top: y });

  // Mantém o menu inteiro dentro da tela (perto das bordas, abre para o
  // outro lado do clique)
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

  // Foco na primeira opção; Esc fecha
  useEffect(() => {
    firstItemRef.current?.focus();

    function handleKeyDown(event: KeyboardEvent): void {
      if (event.key === 'Escape') onClose();
    }

    window.addEventListener('keydown', handleKeyDown);

    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <MenuBackdrop
      // Clicar fora fecha o menu
      onMouseDown={event => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <Menu
        ref={menuRef}
        role="menu"
        aria-label={`Horário das ${format(start, 'HH:mm')} com ${providerName}`}
        style={position}
      >
        <MenuHeader>
          <FiCalendar />
          <div>
            <strong>
              {format(start, "EEE, d 'de' MMM · HH:mm", { locale: ptBR })}
            </strong>
            <small>{providerName}</small>
          </div>
        </MenuHeader>

        <MenuItem
          ref={firstItemRef}
          type="button"
          role="menuitem"
          onClick={onNewAppointment}
        >
          <FiPlus />
          Novo agendamento
        </MenuItem>
      </Menu>
    </MenuBackdrop>
  );
};

export default SlotMenu;
