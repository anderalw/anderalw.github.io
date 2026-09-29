import styled, { css } from 'styled-components';

import { colors, radius } from '../../../styles/theme';
import { WideDialog } from '../modalLayout';
import { ViewSwitch } from '../styles';

// Tamanho fixo: marcar "dia inteiro" ou aparecer um erro não muda a altura
export const BlockDialog = styled(WideDialog)`
  max-width: 560px;
  height: min(600px, 100%);
`;

// Campo do motivo com os atalhos na mesma linha
export const ReasonRow = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;

  > input {
    flex: 1;
    min-width: 0;
  }
`;

// Barbeiro e o modo (uma vez ou repetir) na mesma linha
export const TopRow = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: end;
  gap: 12px;
  margin-bottom: 12px;

  > label {
    margin-bottom: 0;
  }
`;

// Uma vez / Repetir, na altura dos campos
export const ModeSwitch = styled(ViewSwitch)`
  margin-left: 0;

  button {
    height: 32px;
    padding: 0 14px;
  }
`;

// Os sete dias da semana, marcáveis
export const DayChips = styled.div`
  grid-column: span 2;
  display: flex;
  gap: 6px;

  button {
    width: 40px;
    padding: 0;
  }
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
  margin-bottom: 14px;

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
  min-height: 38px;
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
  margin: 0;
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
  flex-shrink: 0;
  gap: 6px;
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
// Resumo do que vai ser bloqueado; com erro, mostra o motivo em vermelho.
// Altura de duas linhas reservada: o texto trocar não mexe no resto
export const Summary = styled.div<{ error: boolean }>`
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 60px;
  padding: 10px 12px;
  border: 1px solid transparent;
  border-radius: ${radius.md};
  background: ${colors.sunken};
  color: ${colors.textMuted};
  font-size: 13px;
  line-height: 20px;

  svg {
    flex-shrink: 0;
    color: ${colors.textSubtle};
  }

  ${props =>
    props.error &&
    css`
      border-color: ${colors.danger};
      background: ${colors.dangerSoft};
      color: ${colors.danger};

      svg {
        color: ${colors.danger};
      }
    `}
`;
