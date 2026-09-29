import styled, { css } from 'styled-components';

import { colors, radius } from '../../styles/theme';

// Período: atalhos e datas numa linha
export const PeriodBar = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;

  input {
    width: 150px;
    color-scheme: dark;
  }
`;

export const DateField = styled.label`
  display: flex;
  align-items: center;
  gap: 8px;
  color: ${colors.textMuted};
  font-size: 13px;
`;

export const Presets = styled.div`
  display: inline-flex;
  padding: 2px;
  border: 1px solid ${colors.borderStrong};
  border-radius: ${radius.md};
  background: ${colors.sunken};

  button {
    height: 30px;
    padding: 0 12px;
    border: 0;
    border-radius: 6px;
    background: transparent;
    color: ${colors.textMuted};
    font-size: 13px;
    font-weight: 500;

    &:hover {
      color: ${colors.text};
    }

    &[aria-pressed='true'] {
      background: ${colors.surfaceHover};
      color: ${colors.text};
    }
  }
`;

export const Cards = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
`;

type Tone = 'primary' | 'success' | 'danger' | 'warning' | 'neutral';

const toneColors: Record<Tone, string> = {
  primary: colors.primary,
  success: colors.success,
  danger: colors.danger,
  warning: '#fcc419',
  neutral: colors.textMuted,
};

export const StatCard = styled.div<{ tone: Tone }>`
  padding: 16px 18px;
  border: 1px solid ${colors.border};
  border-radius: ${radius.lg};
  background: ${colors.surface};

  span {
    display: block;
    font-size: 13px;
    color: ${colors.textMuted};
  }

  strong {
    display: block;
    margin-top: 6px;
    font-size: 24px;
    font-weight: 600;
    font-variant-numeric: tabular-nums;
    color: ${props => toneColors[props.tone]};
  }

  small {
    display: block;
    min-height: 18px;
    margin-top: 4px;
    font-size: 12px;
    color: ${colors.textSubtle};
  }
`;

// Gráfico de barras do faturamento por dia
export const Chart = styled.div`
  display: flex;
  align-items: flex-end;
  gap: 3px;
  height: 180px;
  padding: 20px 20px 8px;
`;

export const Bar = styled.div<{ height: number; empty: boolean }>`
  flex: 1;
  min-width: 2px;
  height: ${props => Math.max(props.height, 2)}%;
  border-radius: 3px 3px 0 0;
  background: ${props => (props.empty ? colors.border : colors.primary)};
  transition: background-color 0.1s;

  ${props =>
    !props.empty &&
    css`
      &:hover {
        background: ${colors.primaryHover};
      }
    `}
`;

export const ChartAxis = styled.div`
  display: flex;
  justify-content: space-between;
  padding: 0 20px 16px;
  font-size: 12px;
  color: ${colors.textSubtle};
`;

export const Tables = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 24px;
  margin-top: 24px;

  @media (max-width: 1180px) {
    grid-template-columns: minmax(0, 1fr);
  }
`;

export const EmptyRow = styled.p`
  padding: 28px 20px;
  text-align: center;
  color: ${colors.textMuted};
`;
