import React from 'react';
import styled, { css } from 'styled-components';

import { colors } from '../../styles/theme';

// Domingo a sábado, como no calendário
export const WEEKDAYS = [
  { day: 0, label: 'D', name: 'Domingo' },
  { day: 1, label: 'S', name: 'Segunda' },
  { day: 2, label: 'T', name: 'Terça' },
  { day: 3, label: 'Q', name: 'Quarta' },
  { day: 4, label: 'Q', name: 'Quinta' },
  { day: 5, label: 'S', name: 'Sexta' },
  { day: 6, label: 'S', name: 'Sábado' },
];

const Chips = styled.div`
  display: flex;
  gap: 6px;
`;

const Chip = styled.button<{ selected: boolean }>`
  width: 40px;
  height: 28px;
  padding: 0;
  border: 1px solid ${colors.borderStrong};
  border-radius: 999px;
  background: transparent;
  color: ${colors.textMuted};
  font-size: 13px;

  &:hover {
    color: ${colors.text};
    background: ${colors.surfaceHover};
  }

  ${props =>
    props.selected &&
    css`
      border-color: ${colors.primary};
      color: ${colors.primary};
      background: ${colors.primarySoft};
    `}
`;

interface WeekdayPickerProps {
  // Dias marcados (0 = domingo ... 6 = sábado)
  selected: number[];
  onToggle(day: number): void;
  className?: string;
}

// Os sete dias da semana como botões de marcar (bloqueio que se repete,
// dias de atendimento dos barbeiros)
const WeekdayPicker: React.FC<WeekdayPickerProps> = ({
  selected,
  onToggle,
  className,
}) => (
  <Chips role="group" aria-label="Dias da semana" className={className}>
    {WEEKDAYS.map(({ day, label, name }) => (
      <Chip
        key={day}
        type="button"
        title={name}
        aria-label={name}
        selected={selected.includes(day)}
        aria-pressed={selected.includes(day)}
        onClick={() => onToggle(day)}
      >
        {label}
      </Chip>
    ))}
  </Chips>
);

export default WeekdayPicker;
