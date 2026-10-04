import styled, { css } from 'styled-components';
import { Link } from 'react-router-dom';

import { colors } from '../../styles/theme';
import { FixedDialog } from '../Dashboard/AppointmentDetails/styles';

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

    /* Só ícones, como nas outras tabelas (o nome fica no title) */
    .label {
      display: none;
    }

    button {
      width: 32px;
      padding: 0;
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

// --- Página do usuário -------------------------------------------------------

export const BackLink = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 16px;
  color: ${colors.textMuted};
  font-size: 14px;
  text-decoration: none;

  &:hover {
    color: ${colors.text};
  }
`;

export const PageTop = styled.div`
  margin-bottom: 20px;

  img {
    width: 48px;
    height: 48px;
  }

  h1 {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
    margin: 0;
    font-size: 24px;
    font-weight: 600;
    color: ${colors.text};
  }
`;

export const CardGrid = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 2fr) minmax(0, 1fr);
  gap: 20px;
  margin-bottom: 20px;

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
  }

  /* Os dois cartões com a mesma altura */
  > * {
    display: flex;
    flex-direction: column;
  }

  > * > div:last-child {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 14px;
  }
`;

// Botões no pé do cartão
export const CardActions = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 8px;
  margin-top: auto;
  padding-top: 16px;
`;
