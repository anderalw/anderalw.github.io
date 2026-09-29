import React from 'react';

import { ParsedBlock, blockPosition } from './agenda';
import { blockRange } from './BlockMenu';
import { BlockCard } from './styles';
import { ClickPoint, clickPoint } from './WeekView';

// Abaixo desta altura o bloqueio mostra tudo numa linha
const COMPACT_BLOCK_HEIGHT = 40;

interface AgendaBlockCardProps {
  block: ParsedBlock;
  // Dia da coluna (o bloqueio pode continuar em outros dias)
  day: Date;
  startHour: number;
  endHour: number;
  hourHeight: number;
  color: string;
  providerName: string;
  onClick(block: ParsedBlock, point: ClickPoint): void;
}

// Bloqueio desenhado na coluna de um barbeiro, nas visões de dia e semana
const AgendaBlockCard: React.FC<AgendaBlockCardProps> = ({
  block,
  day,
  startHour,
  endHour,
  hourHeight,
  color,
  providerName,
  onClick,
}) => {
  const position = blockPosition(block, day, startHour, endHour, hourHeight);

  if (!position) return null;

  const height = Math.max(position.height - 4, 16);
  const title = block.reason || 'Bloqueado';
  const range = blockRange(block);

  return (
    <BlockCard
      type="button"
      aria-haspopup="menu"
      color={color}
      compact={height < COMPACT_BLOCK_HEIGHT}
      style={{ top: position.top + 2, height }}
      title={`${title} · ${range} · ${providerName}`}
      onClick={event => onClick(block, clickPoint(event))}
    >
      <strong>{title}</strong>
      <span>{range}</span>
    </BlockCard>
  );
};

export default AgendaBlockCard;
