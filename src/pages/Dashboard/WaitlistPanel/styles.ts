import styled, { css } from 'styled-components';

import { colors, radius } from '../../../styles/theme';

// Botão da barra da agenda (visão do dia). Largura fixa: a contagem muda
// sem empurrar o resto
export const WaitTrigger = styled.button<{ active: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 132px;
  height: 32px;
  margin-left: 8px;
  padding: 0 10px;
  border: 1px solid ${colors.borderStrong};
  border-radius: ${radius.md};
  background: ${colors.surface};
  color: ${colors.textMuted};
  font-size: 13px;
  font-weight: 500;
  white-space: nowrap;

  svg {
    flex-shrink: 0;
    width: 15px;
    height: 15px;
  }

  b {
    min-width: 18px;
    padding: 0 5px;
    border-radius: 999px;
    background: ${colors.surfaceHover};
    font-size: 12px;
    line-height: 18px;
  }

  &:hover {
    background: ${colors.surfaceHover};
  }

  &[aria-expanded='true'] {
    border-color: ${colors.textMuted};
  }

  ${props =>
    props.active &&
    css`
      color: ${colors.text};

      b {
        background: ${colors.primary};
        color: ${colors.onPrimary};
      }
    `}

  @media (max-width: 1180px) {
    width: 56px;

    .label {
      display: none;
    }
  }
`;

export const EntryText = styled.div`
  flex: 1;
  min-width: 0;
  padding-left: 12px;

  strong,
  small,
  em {
    display: block;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  strong {
    font-size: 13px;
    font-weight: 500;
    color: ${colors.text};
  }

  small {
    margin-top: 1px;
    font-size: 12px;
    color: ${colors.textMuted};
  }

  em {
    margin-top: 3px;
    font-size: 12px;
    font-style: normal;
    color: ${colors.textSubtle};
  }
`;

export const Tag = styled.span<{ tone: 'success' | 'primary' | 'muted' }>`
  display: inline-block;
  margin-left: 6px;
  padding: 0 6px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 600;
  line-height: 16px;
  vertical-align: 1px;

  ${props => {
    if (props.tone === 'success') {
      return css`
        color: ${colors.success};
        background: ${colors.successSoft};
      `;
    }

    if (props.tone === 'primary') {
      return css`
        color: ${colors.primary};
        background: ${colors.primarySoft};
      `;
    }

    return css`
      color: ${colors.textMuted};
      background: ${colors.surfaceHover};
    `;
  }}
`;

// Formulário para colocar um cliente na lista
export const AddForm = styled.form`
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px 20px;

  label > span {
    display: block;
    margin-bottom: 6px;
    font-size: 13px;
    font-weight: 500;
    color: ${colors.textMuted};
  }
`;

export const FormRow = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
`;

// Resultados da busca de clientes (altura fixa: não empurra o formulário)
export const Results = styled.ul`
  list-style: none;
  height: 132px;
  overflow-y: auto;
  border: 1px solid ${colors.border};
  border-radius: ${radius.md};
  background: ${colors.sunken};

  li + li {
    border-top: 1px solid ${colors.border};
  }

  button {
    display: block;
    width: 100%;
    padding: 7px 12px;
    border: 0;
    background: transparent;
    color: ${colors.text};
    font-size: 13px;
    text-align: left;

    small {
      margin-left: 6px;
      color: ${colors.textMuted};
    }

    &:hover,
    &[aria-pressed='true'] {
      background: ${colors.surfaceHover};
    }

    &[aria-pressed='true'] {
      box-shadow: inset 3px 0 0 ${colors.primary};
    }
  }

  p {
    padding: 12px;
    font-size: 13px;
    color: ${colors.textSubtle};
  }
`;

export const FormActions = styled.div`
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 8px;
  margin-top: auto;

  small {
    margin-right: auto;
    font-size: 12px;
    color: ${colors.danger};
  }
`;

export const AddButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: calc(100% - 40px);
  height: 36px;
  margin: 12px 20px;
  border: 1px dashed ${colors.borderStrong};
  border-radius: ${radius.md};
  background: transparent;
  color: ${colors.textMuted};
  font-size: 13px;
  font-weight: 500;

  svg {
    width: 15px;
    height: 15px;
  }

  &:hover {
    border-color: ${colors.primary};
    color: ${colors.primary};
  }
`;

export const RemoveButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: 1px solid ${colors.borderStrong};
  border-radius: ${radius.md};
  background: transparent;
  color: ${colors.textMuted};

  svg {
    width: 15px;
    height: 15px;
  }

  &:hover:not(:disabled) {
    border-color: ${colors.danger};
    background: ${colors.dangerSoft};
    color: ${colors.danger};
  }

  &:disabled {
    opacity: 0.5;
  }
`;

// Campo do formulário (rótulo em cima)
export const FieldLabel = styled.label`
  display: block;
`;
