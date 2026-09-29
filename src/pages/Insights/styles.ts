import styled, { css } from 'styled-components';

import { colors, radius } from '../../styles/theme';

export const KpiGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 16px;
  margin-bottom: 24px;

  @media (max-width: 1280px) {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
`;

export const Kpi = styled.div`
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
    white-space: nowrap;
    font-weight: 600;
    font-variant-numeric: tabular-nums;
    color: ${colors.text};
  }
`;

export type DeltaTone = 'good' | 'bad' | 'neutral';

export const Delta = styled.small<{ tone: DeltaTone }>`
  display: block;
  min-height: 18px;
  margin-top: 4px;
  font-size: 12px;
  font-variant-numeric: tabular-nums;

  ${props => {
    if (props.tone === 'good') {
      return css`
        color: ${colors.success};
      `;
    }

    if (props.tone === 'bad') {
      return css`
        color: ${colors.danger};
      `;
    }

    return css`
      color: ${colors.textSubtle};
    `;
  }}
`;

export const Row = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 24px;
  margin-bottom: 24px;

  @media (max-width: 1180px) {
    grid-template-columns: minmax(0, 1fr);
  }
`;

// Barras horizontais (ocupação por barbeiro, serviços)
export const BarList = styled.ul`
  list-style: none;
  padding: 16px 20px 20px;

  li + li {
    margin-top: 14px;
  }

  header {
    display: flex;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 6px;
    font-size: 13px;
    color: ${colors.text};

    span:last-child {
      color: ${colors.textMuted};
      font-variant-numeric: tabular-nums;
      white-space: nowrap;
    }
  }
`;

export const Track = styled.div`
  height: 8px;
  border-radius: 4px;
  background: ${colors.borderStrong};
  overflow: hidden;
`;

export const Fill = styled.div<{ value: number; color?: string }>`
  width: ${props => Math.round(Math.min(1, props.value) * 100)}%;
  height: 100%;
  border-radius: 4px;
  background: ${props => props.color || colors.primary};
  transition: width 0.3s;
`;

// Mapa de calor: dias da semana × horas
export const Heatmap = styled.div<{ columns: number }>`
  display: grid;
  grid-template-columns: 44px repeat(${props => props.columns}, minmax(0, 1fr));
  gap: 4px;
  padding: 16px 20px 20px;
  font-size: 12px;

  span {
    display: flex;
    align-items: center;
    color: ${colors.textMuted};
  }

  .hour {
    justify-content: center;
    font-variant-numeric: tabular-nums;
  }
`;

export const Cell = styled.div<{ value: number }>`
  height: 30px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-variant-numeric: tabular-nums;
  color: ${props => (props.value > 0.55 ? colors.onPrimary : colors.textMuted)};
  background: ${props =>
    props.value > 0
      ? `rgba(${colors.primaryRgb}, ${0.12 + props.value * 0.88})`
      : colors.sunken};
`;

export const Legend = styled.p`
  padding: 0 20px 16px;
  font-size: 12px;
  color: ${colors.textSubtle};
`;

export const LostHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-left: auto;

  select {
    width: auto;
    height: 32px;
  }
`;

export const LostTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;

  th {
    padding: 10px 12px;
    text-align: left;
    font-size: 12px;
    font-weight: 500;
    color: ${colors.textSubtle};
    text-transform: uppercase;
    letter-spacing: 0.04em;
    border-bottom: 1px solid ${colors.border};
  }

  td {
    height: 52px;
    padding: 0 12px;
    border-bottom: 1px solid ${colors.border};
    color: ${colors.text};
    white-space: nowrap;
  }

  th:first-child,
  td:first-child {
    padding-left: 20px;
  }

  th:last-child,
  td:last-child {
    padding-right: 20px;
  }

  tbody tr:last-child td {
    border-bottom: 0;
  }

  .num {
    text-align: right;
    font-variant-numeric: tabular-nums;
  }

  td a {
    color: ${colors.text};
    text-decoration: none;

    &:hover {
      color: ${colors.primary};
    }
  }

  td small {
    display: block;
    font-size: 12px;
    color: ${colors.textMuted};
  }
`;

export const Actions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 6px;

  a {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    border: 1px solid ${colors.borderStrong};
    border-radius: ${radius.md};
    color: ${colors.textMuted};

    &:hover {
      background: ${colors.surfaceHover};
      color: ${colors.text};
    }
  }

  svg {
    width: 15px;
    height: 15px;
  }
`;
