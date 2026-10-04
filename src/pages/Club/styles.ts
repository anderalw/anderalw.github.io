import styled, { css } from 'styled-components';
import { Link } from 'react-router-dom';

import { colors, radius } from '../../styles/theme';
import { StateTone } from './types';

export const KpiGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 16px;
  margin-bottom: 24px;

  @media (max-width: 1180px) {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
`;

export const Kpi = styled.div<{ tone?: 'warning' | 'primary' }>`
  padding: 16px 18px;
  border: 1px solid ${colors.border};
  border-radius: ${radius.lg};
  background: ${colors.surface};

  > span {
    display: block;
    font-size: 13px;
    color: ${colors.textMuted};
  }

  strong {
    display: block;
    margin-top: 6px;
    font-size: 22px;
    font-weight: 600;
    font-variant-numeric: tabular-nums;
    white-space: nowrap;
    color: ${colors.text};
  }

  small {
    display: block;
    min-height: 18px;
    margin-top: 4px;
    font-size: 12px;
    color: ${colors.textSubtle};
  }

  ${props =>
    props.tone === 'warning' &&
    css`
      border-color: ${colors.warning};

      strong {
        color: ${colors.warning};
      }
    `}

  ${props =>
    props.tone === 'primary' &&
    css`
      border-color: ${colors.primary};

      strong {
        color: ${colors.primary};
      }
    `}
`;

export const Layout = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) 380px;
  gap: 24px;
  align-items: start;

  @media (max-width: 1280px) {
    grid-template-columns: minmax(0, 1fr);
  }
`;

export const Filters = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  padding: 12px 20px;
  border-bottom: 1px solid ${colors.border};
`;

export const FilterChip = styled.button<{ selected: boolean }>`
  height: 28px;
  padding: 0 12px;
  border: 1px solid ${colors.borderStrong};
  border-radius: 999px;
  background: transparent;
  color: ${colors.textMuted};
  font-size: 13px;

  &:hover {
    color: ${colors.text};
  }

  ${props =>
    props.selected &&
    css`
      border-color: ${colors.primary};
      background: ${colors.primarySoft};
      color: ${colors.primary};
    `}
`;

const TONES: Record<StateTone, { color: string; background: string }> = {
  success: { color: colors.success, background: colors.successSoft },
  warning: { color: colors.warning, background: colors.warningSoft },
  danger: { color: colors.danger, background: colors.dangerSoft },
  primary: { color: colors.primary, background: colors.primarySoft },
  neutral: { color: colors.textMuted, background: colors.surfaceHover },
};

export const StateBadge = styled.span<{ tone: StateTone }>`
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 500;
  white-space: nowrap;
  color: ${props => TONES[props.tone].color};
  background: ${props => TONES[props.tone].background};
`;

export const Actions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 4px;
`;

export const PlanList = styled.ul`
  list-style: none;

  li {
    padding: 16px 20px;
    border-top: 1px solid ${colors.border};
  }

  li:first-child {
    border-top: 0;
  }

  header {
    display: flex;
    align-items: center;
    gap: 8px;

    strong {
      font-size: 15px;
      color: ${colors.text};
    }

    span.price {
      margin-left: auto;
      font-weight: 600;
      font-variant-numeric: tabular-nums;
      color: ${colors.text};
    }
  }

  p {
    margin-top: 6px;
    font-size: 13px;
    line-height: 1.5;
    color: ${colors.textMuted};
  }

  footer {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-top: 10px;
  }
`;

// Recebido x valor usado nos últimos 30 dias
export const Numbers = styled.dl`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
  margin-top: 12px;
  padding: 10px 12px;
  border-radius: ${radius.md};
  background: ${colors.sunken};

  dt {
    font-size: 11px;
    color: ${colors.textSubtle};
  }

  dd {
    margin-top: 2px;
    font-size: 14px;
    font-weight: 600;
    font-variant-numeric: tabular-nums;
    color: ${colors.text};
  }

  dd.good {
    color: ${colors.success};
  }

  dd.bad {
    color: ${colors.danger};
  }
`;

export const Hint = styled.p`
  padding: 12px 20px;
  border-top: 1px solid ${colors.border};
  font-size: 13px;
  color: ${colors.textMuted};

  a {
    color: ${colors.primary};
  }
`;

// Nome do cliente na tabela: abre a ficha
export const ClientLink = styled(Link)`
  font-weight: 500;
  color: ${colors.text};
  text-decoration: none;
  white-space: nowrap;

  &:hover {
    color: ${colors.primary};
    text-decoration: underline;
  }
`;

// Tabela de assinantes: rola de lado em telas estreitas e com menos espaço
// entre as colunas, para as ações caberem ao lado do cartão de planos
export const TableScroll = styled.div`
  overflow-x: auto;

  th,
  td {
    padding-left: 12px;
    padding-right: 12px;
    white-space: nowrap;
  }

  th:first-child,
  td:first-child {
    padding-left: 20px;
  }

  th:last-child,
  td:last-child {
    padding-right: 16px;
  }
`;
