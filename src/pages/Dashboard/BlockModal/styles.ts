import styled, { css } from 'styled-components';

import { colors, radius } from '../../../styles/theme';
import { inputStyles } from '../../../components/ui';
import { WideDialog } from '../modalLayout';
import { ViewSwitch } from '../styles';

// Tamanho fixo: marcar "dia inteiro" ou aparecer um erro não muda a altura
export const BlockDialog = styled(WideDialog)`
  max-width: 560px;
  height: min(600px, 100%);
`;

// Escolha de um ou mais barbeiros
export const PickerWrapper = styled.div`
  position: relative;
`;

export const PickerButton = styled.button`
  ${inputStyles}
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  text-align: left;
  cursor: pointer;

  span {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  svg {
    flex-shrink: 0;
    color: ${colors.textMuted};
  }
`;

// Abre por cima dos outros campos, sem empurrar nada
export const PickerList = styled.div`
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  right: 0;
  z-index: 2;
  max-height: 240px;
  overflow-y: auto;
  padding: 6px;
  border: 1px solid ${colors.borderStrong};
  border-radius: ${radius.md};
  background: ${colors.surface};
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.45);
`;

export const PickerOption = styled.label`
  display: flex;
  align-items: center;
  gap: 10px;
  height: 34px;
  padding: 0 10px;
  border-radius: 6px;
  color: ${colors.text};
  font-size: 14px;
  cursor: pointer;

  &:hover {
    background: ${colors.surfaceHover};
  }

  input {
    width: 16px;
    height: 16px;
    accent-color: ${colors.primary};
    cursor: pointer;
  }

  strong {
    font-weight: 600;
  }
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

  > :first-child {
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
    /* A lista de barbeiros abre por cima dos campos, sem criar rolagem */
    overflow: visible;
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
  line-height: 18px;

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
