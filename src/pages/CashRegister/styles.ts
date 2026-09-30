import styled, { css } from 'styled-components';

import { colors, radius } from '../../styles/theme';

export const DateBar = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;

  input {
    width: 160px;
    color-scheme: dark;
  }
`;

export const Layout = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) 360px;
  gap: 24px;
  align-items: start;

  /* Abaixo disso a tabela não cabe ao lado do fechamento: um embaixo do outro */
  @media (max-width: 1360px) {
    grid-template-columns: minmax(0, 1fr);
  }
`;

// Atendimentos e, se houver, as mensalidades do clube
export const LeftColumn = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
  min-width: 0;
`;

// Aviso de atendimentos sem registro (amarelo)
export const PendingNote = styled.p`
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 40px;
  margin-bottom: 16px;
  padding: 10px 14px;
  border: 1px solid color-mix(in srgb, ${colors.warning} 35%, transparent);
  border-radius: ${radius.md};
  background: ${colors.warningSoft};
  font-size: 13px;
  color: ${colors.text};

  svg {
    flex-shrink: 0;
    width: 16px;
    height: 16px;
    color: ${colors.warning};
  }

  a {
    margin-left: auto;
    color: ${colors.primary};
    font-weight: 500;
    text-decoration: none;
    white-space: nowrap;

    &:hover {
      text-decoration: underline;
    }
  }
`;

export const ItemsTable = styled.table`
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
    white-space: nowrap;
  }

  td {
    height: 52px;
    padding: 0 12px;
    color: ${colors.text};
    border-bottom: 1px solid ${colors.border};
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

  td small {
    display: block;
    font-size: 12px;
    color: ${colors.textMuted};
  }

  .num {
    text-align: right;
    font-variant-numeric: tabular-nums;
  }

  select {
    height: 32px;
    width: 130px;
  }
`;

export const MethodSelect = styled.select<{ missing: boolean }>`
  padding: 0 8px;
  border: 1px solid ${colors.borderStrong};
  border-radius: ${radius.sm};
  background: ${colors.sunken};
  color: ${colors.text};
  font: inherit;
  font-size: 13px;
  cursor: pointer;

  ${props =>
    props.missing &&
    css`
      border-color: color-mix(in srgb, ${colors.warning} 60%, transparent);
      color: ${colors.warning};
    `}

  &:disabled {
    opacity: 0.5;
  }
`;

// Linhas "rótulo ....... valor" do fechamento
export const Lines = styled.dl`
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 10px 12px;
  font-size: 14px;

  dt {
    color: ${colors.textMuted};
  }

  dd {
    text-align: right;
    font-variant-numeric: tabular-nums;
    color: ${colors.text};
  }

  .total {
    padding-top: 10px;
    border-top: 1px solid ${colors.border};
    font-weight: 600;
  }
`;

export const Difference = styled.dd<{ tone: 'ok' | 'short' | 'over' }>`
  font-weight: 700;

  ${props => {
    if (props.tone === 'short') {
      return css`
        color: ${colors.danger} !important;
      `;
    }

    if (props.tone === 'over') {
      return css`
        color: ${colors.warning} !important;
      `;
    }

    return css`
      color: ${colors.success} !important;
    `;
  }}
`;

export const CloseForm = styled.form`
  display: flex;
  flex-direction: column;
  gap: 14px;

  label > span {
    display: block;
    margin-bottom: 6px;
    font-size: 13px;
    font-weight: 500;
    color: ${colors.textMuted};
  }

  input {
    font-variant-numeric: tabular-nums;
  }
`;

export const ClosedInfo = styled.p<{ warning?: boolean }>`
  margin-bottom: 14px;
  padding: 10px 12px;
  border-radius: ${radius.md};
  font-size: 13px;
  line-height: 1.4;
  background: ${props =>
    props.warning ? colors.warningSoft : colors.successSoft};
  color: ${props => (props.warning ? colors.warning : colors.success)};
`;

export const Notes = styled.p`
  margin-top: 14px;
  font-size: 13px;
  color: ${colors.textMuted};
  white-space: pre-line;
`;

export const FieldLabel = styled.label`
  display: block;
`;

export const FormError = styled.small`
  min-height: 16px;
  font-size: 12px;
  color: ${colors.danger};
`;

// Seis cartões numa linha (total, quatro formas e "sem forma")
export const CashCards = styled.div`
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 16px;
  margin-bottom: 24px;

  @media (max-width: 1180px) {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
`;
