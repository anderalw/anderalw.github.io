import styled, { css } from 'styled-components';

import { colors, radius } from '../../../styles/theme';
import { WideDialog } from '../modalLayout';

// Tamanho fixo: marcar "dia inteiro" ou aparecer um erro não muda a altura
export const BlockDialog = styled(WideDialog)`
  max-width: 560px;
  height: min(560px, 100%);
`;

export const Subtitle = styled.p`
  margin-top: 2px;
  font-size: 13px;
  color: ${colors.textMuted};
`;

export const Form = styled.form`
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;

  > :first-child {
    flex: 1;
  }

  /* Seletores nativos de data e hora no tema escuro */
  input[type='date'],
  input[type='time'] {
    color-scheme: dark;
  }
`;

export const Field = styled.label`
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 16px;

  > span {
    font-size: 13px;
    font-weight: 500;
    color: ${colors.textMuted};
  }
`;

// Data e hora lado a lado
export const PeriodRow = styled.div`
  display: grid;
  grid-template-columns: 56px minmax(0, 1fr) 120px;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;

  > span {
    font-size: 13px;
    font-weight: 500;
    color: ${colors.textMuted};
  }
`;

export const WholeDay = styled.label`
  display: inline-flex;
  align-items: center;
  gap: 10px;
  margin: 0 0 14px 68px;
  color: ${colors.text};
  font-size: 14px;
  cursor: pointer;

  input {
    width: 16px;
    height: 16px;
    accent-color: ${colors.primary};
    cursor: pointer;
  }
`;

export const Reasons = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 2px;
`;

export const ReasonChip = styled.button<{ selected: boolean }>`
  height: 28px;
  padding: 0 10px;
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

// Espaço sempre reservado: o erro aparece sem mexer no resto
export const FormError = styled.p`
  margin-top: 8px;
  min-height: 40px;
  padding: 0;
  font-size: 13px;
  line-height: 20px;
  color: ${colors.danger};
`;

export const Summary = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  border-radius: ${radius.md};
  background: ${colors.sunken};
  color: ${colors.textMuted};
  font-size: 13px;

  svg {
    flex-shrink: 0;
    color: ${colors.textSubtle};
  }
`;
