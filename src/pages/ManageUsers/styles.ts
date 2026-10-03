import styled, { css } from 'styled-components';

import { colors, radius } from '../../styles/theme';
import { FixedDialog } from '../Dashboard/AppointmentDetails/styles';

export const Tabs = styled.div`
  display: inline-flex;
  gap: 4px;
  margin-bottom: 20px;
  padding: 4px;
  border: 1px solid ${colors.border};
  border-radius: ${radius.md};
  background: ${colors.surface};
`;

export const Tab = styled.button<{ selected: boolean }>`
  height: 32px;
  padding: 0 14px;
  border: 0;
  border-radius: 6px;
  background: transparent;
  color: ${colors.textMuted};
  font: inherit;
  font-size: 14px;
  font-weight: 500;

  ${props =>
    props.selected &&
    css`
      background: ${colors.surfaceHover};
      color: ${colors.text};
    `}
`;

export const Person = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;

  img {
    width: 36px;
    height: 36px;
    flex-shrink: 0;
    border-radius: 50%;
    object-fit: cover;
  }

  strong {
    display: flex;
    align-items: center;
    gap: 8px;
    font-weight: 500;
    color: ${colors.text};
  }

  small {
    display: block;
    color: ${colors.textMuted};
    font-size: 13px;
  }
`;

export const Row = styled.tr<{ inactive?: boolean }>`
  ${props =>
    props.inactive &&
    css`
      td > * {
        opacity: 0.55;
      }

      td.actions > * {
        opacity: 1;
      }
    `}

  td.actions {
    width: 1%;
    text-align: right;
    white-space: nowrap;

    /* Tela estreita: só o ícone (o nome fica no title) */
    @media (max-width: 1200px) {
      .label {
        display: none;
      }
    }
  }
`;

export const Muted = styled.span`
  color: ${colors.textMuted};
  font-size: 13px;
`;

// Modais de tamanho fixo (não mudam de altura com o conteúdo)
export const FormDialog = styled(FixedDialog)<{ wide?: boolean }>`
  max-width: ${props => (props.wide ? '640px' : '480px')};
  height: min(${props => (props.wide ? '720px' : '540px')}, 100%);
  padding: 0;
`;

export const DialogBody = styled.div`
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 20px 24px;
  overflow-y: auto;
`;

// Dois campos lado a lado
export const FieldRow = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px 16px;
  align-items: end;

  @media (max-width: 600px) {
    grid-template-columns: 1fr;
  }
`;

export const Hint = styled.p`
  margin: 0;
  color: ${colors.textMuted};
  font-size: 13px;
  line-height: 1.5;
`;

// Espaço reservado para a mensagem de erro
export const ErrorText = styled.p`
  min-height: 20px;
  margin: auto 0 0;
  color: ${colors.danger};
  font-size: 13px;
`;

export const PermissionGroups = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px 20px;

  @media (max-width: 600px) {
    grid-template-columns: 1fr;
  }
`;

export const PermissionGroup = styled.fieldset`
  margin: 0;
  padding: 0;
  border: 0;

  legend {
    margin-bottom: 6px;
    color: ${colors.textSubtle};
    font-size: 12px;
    font-weight: 600;
    letter-spacing: 0.04em;
    text-transform: uppercase;
  }

  label {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    padding: 3px 0;
    color: ${colors.text};
    font-size: 14px;
    line-height: 1.35;
    cursor: pointer;
  }

  input {
    margin-top: 2px;
    accent-color: ${colors.primary};
  }

  input:disabled + span {
    color: ${colors.textMuted};
  }
`;
