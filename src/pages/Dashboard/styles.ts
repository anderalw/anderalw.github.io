import styled, { css } from 'styled-components';
import { shade, transparentize } from 'polished';

import { colors, radius } from '../../styles/theme';

// Limites da altura de 1 hora na grade (px). A altura real é calculada
// para o dia inteiro caber na tela e chega ao CSS pela variável
// --hour-height, definida no Grid
export const MIN_HOUR_HEIGHT = 28;
export const MAX_HOUR_HEIGHT = 120;
// Abaixo desta altura, o card mostra só horário e cliente
export const COMPACT_HOUR_HEIGHT = 60;
// Largura da coluna com as horas (px)
export const TIME_COLUMN_WIDTH = 64;
// Espaço entre a grade e as bordas da tela (px); o de baixo entra no
// cálculo da altura das horas
export const AGENDA_PADDING = 24;

// Ocupa a altura da tela: barra de ferramentas em cima e a grade embaixo
export const AgendaArea = styled.section`
  height: 100vh;
  display: flex;
  flex-direction: column;
  padding: 0 ${AGENDA_PADDING}px ${AGENDA_PADDING}px;
`;

export const Toolbar = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  height: 64px;
  flex-shrink: 0;

  h1 {
    margin-left: 12px;
    font-size: 18px;
    font-weight: 600;
    letter-spacing: -0.01em;
    color: ${colors.text};

    &::first-letter {
      text-transform: uppercase;
    }
  }

  > span {
    margin-left: auto;
    color: ${colors.textMuted};
    font-size: 13px;
  }
`;

export const TodayButton = styled.button`
  height: 32px;
  margin-right: 8px;
  padding: 0 14px;
  border: 1px solid ${colors.borderStrong};
  border-radius: ${radius.md};
  background: ${colors.surface};
  color: ${colors.text};
  font-size: 13px;
  font-weight: 500;
  transition: background-color 0.15s;

  &:hover {
    background: ${colors.surfaceHover};
  }
`;

export const NavButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: 0;
  border-radius: ${radius.md};
  background: transparent;
  color: ${colors.textMuted};
  transition: background-color 0.15s, color 0.15s;

  &:hover {
    background: ${colors.surfaceHover};
    color: ${colors.text};
  }

  svg {
    width: 18px;
    height: 18px;
  }
`;

/* Sem barra de rolagem: a altura das horas é ajustada para o dia caber
   na tela, e as colunas dividem a largura disponível */
export const Grid = styled.div`
  position: relative;
  overflow: hidden;
  background: ${colors.surface};
  border: 1px solid ${colors.border};
  border-radius: ${radius.lg};
`;

interface ColumnsProps {
  columns: number;
}

const gridColumns = css<ColumnsProps>`
  display: grid;
  grid-template-columns: ${TIME_COLUMN_WIDTH}px repeat(
      ${props => Math.max(props.columns, 1)},
      minmax(0, 1fr)
    );
`;

export const GridHeader = styled.div<ColumnsProps>`
  ${gridColumns}
  border-bottom: 1px solid ${colors.border};
`;

export const ProviderHeader = styled.div<{ color: string }>`
  position: relative;
  display: flex;
  align-items: center;
  padding: 10px 12px;
  border-left: 1px solid ${colors.border};
  min-width: 0;

  /* Faixa na cor do barbeiro */
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 12px;
    right: 12px;
    height: 3px;
    border-radius: 0 0 3px 3px;
    background: ${props => props.color};
  }

  img {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    object-fit: cover;
    flex-shrink: 0;
  }

  div {
    margin-left: 10px;
    display: flex;
    flex-direction: column;
    min-width: 0;
  }

  strong {
    color: ${colors.text};
    font-weight: 600;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  small {
    color: ${colors.textMuted};
    font-size: 12px;
    font-variant-numeric: tabular-nums;
  }
`;

export const YouBadge = styled.span`
  display: inline-block;
  margin-left: 6px;
  padding: 0 6px;
  border-radius: 4px;
  background: ${colors.primarySoft};
  color: ${colors.primary};
  font-size: 11px;
  font-weight: 600;
  vertical-align: 1px;
`;

export const GridBody = styled.div<ColumnsProps>`
  ${gridColumns}
  position: relative;
`;

export const TimeColumn = styled.div`
  span {
    display: block;
    height: var(--hour-height);
    padding-right: 8px;
    text-align: right;
    font-size: 12px;
    color: ${colors.textMuted};
    /* O rótulo fica alinhado com a linha que abre a hora */
    transform: translateY(-7px);
  }

  span:first-child {
    transform: none;
  }
`;

export const ProviderColumn = styled.div`
  position: relative;
  border-left: 1px solid ${colors.border};
`;

export const HourCell = styled.div<{ off: boolean; bookable?: boolean }>`
  display: block;
  width: 100%;
  height: var(--hour-height);
  border: 0;
  border-bottom: 1px solid ${colors.border};
  background: transparent;

  /* Hora livre dentro do expediente: clicar abre um novo agendamento */
  ${props =>
    props.bookable &&
    css`
      cursor: pointer;

      &:hover,
      &:focus-visible {
        background: rgba(255, 144, 0, 0.08);
        outline: none;
      }
    `}

  /* Fora do expediente: fundo liso mais escuro. O hachurado fica só para os
     bloqueios, para os dois não se confundirem */
  ${props =>
    props.off &&
    css`
      background: ${colors.sunken};
    `}
`;

export const DayOffLabel = styled.span`
  position: absolute;
  top: 12px;
  left: 0;
  right: 0;
  text-align: center;
  color: ${colors.textSubtle};
  font-size: 13px;
`;

interface AppointmentCardProps {
  color: string;
  past: boolean;
  // Situação registrada; 'pending' = já começou e ninguém registrou
  attendance?: 'completed' | 'no_show' | 'pending' | null;
  // Futuro e confirmado pelo cliente
  confirmed?: boolean;
  // Horas baixas: esconde o telefone e junta horário e cliente
  compact: boolean;
}

// Botão: abre os detalhes do agendamento (clique ou Enter pelo teclado)
export const AppointmentCard = styled.button<AppointmentCardProps>`
  position: absolute;
  left: 4px;
  right: 4px;
  z-index: 1;
  display: block;
  padding: ${props => (props.compact ? '2px 8px' : '6px 8px')};
  border: 0;
  border-radius: 6px;
  border-left: 4px solid ${props => props.color};
  background: ${props => shade(0.55, props.color)};
  color: inherit;
  font: inherit;
  text-align: left;
  overflow: hidden;
  /* Já terminou: fundo e texto mais escuros. Sem opacity no card, para o
     que está por baixo (ex: "Folga") não aparecer através dele */
  ${props =>
    props.past &&
    css`
      background: ${shade(0.78, props.color)};

      > * {
        opacity: 0.6;
      }
    `}
  transition: transform 0.1s, box-shadow 0.1s;

  /* Atendido: ✓ antes do horário */
  ${props =>
    props.attendance === 'completed' &&
    css`
      time::before {
        content: '✓ ';
        color: ${colors.success};
        font-weight: 700;
      }
    `}

  /* Faltou: nome riscado e aviso no horário */
  ${props =>
    props.attendance === 'no_show' &&
    css`
      strong {
        text-decoration: line-through;
      }

      time::after {
        content: ' · faltou';
        color: ${colors.danger};
        font-weight: 600;
      }
    `}

  /* Confirmado pelo cliente: aviso verde no horário */
  ${props =>
    props.confirmed &&
    css`
      time::after {
        content: ' · confirmado';
        color: ${colors.success};
        font-weight: 600;
      }
    `}

  /* A confirmar: bolinha no canto, para lembrar de registrar */
  ${props =>
    props.attendance === 'pending' &&
    css`
      &::after {
        content: '';
        position: absolute;
        top: 6px;
        right: 6px;
        width: 7px;
        height: 7px;
        border-radius: 50%;
        background: ${colors.primary};
      }
    `}

  &:hover {
    transform: scale(1.02);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.35);
  }

  &:focus-visible {
    outline: 2px solid ${colors.text};
    outline-offset: 1px;
  }

  time {
    display: block;
    font-size: 12px;
    color: ${colors.text};
    opacity: 0.85;
  }

  strong {
    display: block;
    color: #fff;
    font-size: 14px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  small {
    display: block;
    font-size: 12px;
    color: ${colors.text};
    opacity: 0.75;
  }

  ${props =>
    props.compact &&
    css`
      white-space: nowrap;
      text-overflow: ellipsis;
      line-height: 18px;

      time,
      strong {
        display: inline;
      }

      time {
        margin-right: 6px;
        font-size: 11px;
      }

      strong {
        font-size: 13px;
      }

      small {
        display: none;
      }
    `}
`;

interface BufferStripProps {
  color: string;
  past: boolean;
}

// Intervalo entre atendimentos: faixa hachurada logo abaixo do card, na cor
// do barbeiro, para mostrar que esse tempo também está ocupado
export const BufferStrip = styled.div<BufferStripProps>`
  position: absolute;
  left: 4px;
  right: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  border-radius: 0 0 6px 6px;
  border-left: 4px solid ${props => transparentize(0.5, props.color)};
  background: repeating-linear-gradient(
    -45deg,
    ${props => transparentize(0.72, props.color)},
    ${props => transparentize(0.72, props.color)} 4px,
    transparent 4px,
    transparent 8px
  );
  opacity: ${props => (props.past ? 0.5 : 1)};

  span {
    font-size: 11px;
    line-height: 1;
    color: ${props => transparentize(0.2, props.color)};
    white-space: nowrap;
  }
`;

export const NowLine = styled.div`
  position: absolute;
  left: ${TIME_COLUMN_WIDTH}px;
  right: 0;
  z-index: 2;
  height: 2px;
  background: #ff4d4f;
  pointer-events: none;

  &::before {
    content: '';
    position: absolute;
    left: -6px;
    top: -5px;
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background: #ff4d4f;
  }
`;

export const EmptyState = styled.p`
  padding: 48px;
  text-align: center;
  color: ${colors.textMuted};
`;

// Alternância entre as visões de dia e de semana
export const ViewSwitch = styled.div`
  display: inline-flex;
  margin-left: 16px;
  padding: 2px;
  border: 1px solid ${colors.borderStrong};
  border-radius: ${radius.md};
  background: ${colors.sunken};

  button {
    height: 26px;
    padding: 0 12px;
    border: 0;
    border-radius: 6px;
    background: transparent;
    color: ${colors.textMuted};
    font-size: 13px;
    font-weight: 500;
    transition: background-color 0.15s, color 0.15s;

    &:hover {
      color: ${colors.text};
    }

    &[aria-pressed='true'] {
      background: ${colors.surfaceHover};
      color: ${colors.text};
    }
  }
`;

// Filtro de barbeiro da visão semanal
export const ProviderFilter = styled.select`
  height: 32px;
  margin-left: 8px;
  padding: 0 8px;
  border: 1px solid ${colors.borderStrong};
  border-radius: ${radius.md};
  background: ${colors.surface};
  color: ${colors.text};
  font-size: 13px;
  cursor: pointer;

  &:focus {
    outline: none;
    border-color: ${colors.primary};
  }
`;

// Cabeçalho de cada dia na visão semanal: clicar abre o dia
export const DayHeader = styled.button<{ today: boolean }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: 8px 4px;
  border: 0;
  border-left: 1px solid ${colors.border};
  background: transparent;
  color: ${colors.textMuted};
  transition: background-color 0.15s;

  &:hover {
    background: ${colors.surfaceHover};
  }

  small {
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: ${props => (props.today ? colors.primary : colors.textSubtle)};
  }

  strong {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 30px;
    height: 30px;
    border-radius: 50%;
    font-size: 16px;
    font-weight: 600;
    font-variant-numeric: tabular-nums;
    color: ${props => (props.today ? colors.onPrimary : colors.text)};
    background: ${props => (props.today ? colors.primary : 'transparent')};
  }
`;

// Horário bloqueado (almoço, consulta, férias): hachurado com a cor do
// barbeiro, clicável para ver o motivo e remover
export const BlockCard = styled.button<{ color: string; compact: boolean }>`
  position: absolute;
  left: 2px;
  right: 2px;
  display: flex;
  flex-direction: ${props => (props.compact ? 'row' : 'column')};
  align-items: ${props => (props.compact ? 'center' : 'flex-start')};
  gap: ${props => (props.compact ? '6px' : '1px')};
  overflow: hidden;
  padding: ${props => (props.compact ? '0 8px' : '6px 8px')};
  border: 1px dashed ${colors.borderStrong};
  border-left: 3px solid ${props => props.color};
  border-radius: 6px;
  background: repeating-linear-gradient(
    -45deg,
    ${colors.sunken},
    ${colors.sunken} 6px,
    ${colors.surfaceHover} 6px,
    ${colors.surfaceHover} 12px
  );
  color: ${colors.textMuted};
  text-align: left;
  font-size: 12px;
  line-height: 16px;
  white-space: nowrap;

  strong {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-weight: 600;
    color: ${colors.text};

    /* Ícone de repetição */
    svg {
      width: 11px;
      height: 11px;
      flex-shrink: 0;
    }
  }

  span {
    overflow: hidden;
    text-overflow: ellipsis;
    color: ${colors.textMuted};
  }

  &:hover,
  &:focus-visible {
    border-color: ${colors.textSubtle};
    border-left-color: ${props => props.color};
    outline: none;
  }
`;

// Menu do horário livre: fundo transparente que fecha ao clicar fora
export const MenuBackdrop = styled.div`
  position: fixed;
  inset: 0;
  z-index: 9;
`;

export const Menu = styled.div`
  position: fixed;
  min-width: 220px;
  padding: 6px;
  border: 1px solid ${colors.borderStrong};
  border-radius: ${radius.md};
  background: ${colors.surface};
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.45);
`;

export const MenuHeader = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 8px 10px 10px;
  margin-bottom: 4px;
  border-bottom: 1px solid ${colors.border};

  > svg {
    flex-shrink: 0;
    margin-top: 2px;
    color: ${colors.textMuted};
  }

  div {
    display: flex;
    flex-direction: column;
  }

  strong {
    font-size: 13px;
    font-weight: 600;
    color: ${colors.text};

    &::first-letter {
      text-transform: uppercase;
    }
  }

  small {
    font-size: 12px;
    color: ${colors.textMuted};
  }
`;

export const MenuItem = styled.button`
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  height: 34px;
  padding: 0 10px;
  border: 0;
  border-radius: 6px;
  background: transparent;
  color: ${colors.text};
  font-size: 14px;
  text-align: left;

  svg {
    width: 16px;
    height: 16px;
    color: ${colors.primary};
  }

  &:hover,
  &:focus-visible {
    background: ${colors.surfaceHover};
    outline: none;
  }
`;

// Opção de remover, em vermelho
export const DangerMenuItem = styled(MenuItem)`
  color: ${colors.danger};

  svg {
    color: ${colors.danger};
  }
`;
