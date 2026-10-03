import styled from 'styled-components';

import { colors, radius } from '../../styles/theme';

// Busca no cabeçalho do card da lista
export const SearchField = styled.label`
  position: relative;
  flex: 1;
  max-width: 360px;

  svg {
    position: absolute;
    top: 50%;
    left: 12px;
    width: 16px;
    height: 16px;
    transform: translateY(-50%);
    color: ${colors.textSubtle};
    pointer-events: none;
  }

  input {
    padding-left: 36px;
  }
`;

export const ClientRow = styled.tr`
  cursor: pointer;

  td.name {
    min-width: 220px;
  }

  td.name a {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    color: ${colors.text};
    font-weight: 500;
    text-decoration: none;

    &:hover {
      color: ${colors.primary};
    }
  }

  td.name small {
    display: block;
    max-width: 230px;
    overflow: hidden;
    text-overflow: ellipsis;
    margin-top: 2px;
    font-size: 12px;
    color: ${colors.textMuted};
  }

  td {
    white-space: nowrap;
  }

  td.whatsapp {
    width: 52px;
    padding: 0 12px 0 0;
  }
`;

// Aviso de faltas (amarelo), ao lado do nome
export const AlertTag = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 1px 7px;
  border-radius: 999px;
  background: ${colors.warningSoft};
  color: ${colors.warning};
  font-size: 11px;
  font-weight: 600;
  white-space: nowrap;

  svg {
    width: 12px;
    height: 12px;
  }
`;

export const Pagination = styled.footer`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
  padding: 12px 20px;
  border-top: 1px solid ${colors.border};
  font-size: 13px;
  color: ${colors.textMuted};

  span {
    margin-right: 8px;
    font-variant-numeric: tabular-nums;
  }
`;

export const PolicyNote = styled.p`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
  padding: 10px 14px;
  border: 1px solid ${colors.border};
  border-radius: ${radius.md};
  background: ${colors.surface};
  font-size: 13px;
  color: ${colors.textMuted};

  svg {
    flex-shrink: 0;
    width: 16px;
    height: 16px;
    color: ${colors.warning};
  }
`;

// Recortes da lista (abaixo da busca)
export const FilterBar = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  min-height: 56px;
  padding: 10px 20px;
  border-bottom: 1px solid ${colors.border};

  select {
    height: 30px;
    width: auto;
    padding: 0 28px 0 10px;
    font-size: 13px;
  }

  small {
    margin-left: 4px;
    font-size: 12px;
    color: ${colors.textMuted};
  }
`;

export const FilterChip = styled.button<{ active: boolean }>`
  height: 30px;
  padding: 0 12px;
  border: 1px solid
    ${props => (props.active ? colors.primary : colors.borderStrong)};
  border-radius: 999px;
  background: ${props => (props.active ? colors.primarySoft : 'transparent')};
  color: ${props => (props.active ? colors.text : colors.textMuted)};
  font-size: 13px;
  font-weight: 500;
  white-space: nowrap;

  &:hover {
    color: ${colors.text};
    border-color: ${colors.primary};
  }
`;

// Cabeçalho que ordena a coluna
export const SortButton = styled.button<{ active: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 0;
  border: 0;
  background: none;
  color: ${props => (props.active ? colors.text : 'inherit')};
  font: inherit;
  text-transform: inherit;
  letter-spacing: inherit;

  /* Colunas de número (alinhadas à direita): a seta vai antes do nome */
  th.num & {
    flex-direction: row-reverse;
  }

  svg {
    width: 13px;
    height: 13px;
    opacity: ${props => (props.active ? 1 : 0)};
  }

  &:hover svg {
    opacity: ${props => (props.active ? 1 : 0.5)};
  }
`;

// Botão do WhatsApp na linha (não abre a ficha)
export const WhatsAppLink = styled.a`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: ${radius.md};
  color: ${colors.textMuted};

  svg {
    width: 17px;
    height: 17px;
  }

  &:hover {
    background: ${colors.successSoft};
    color: ${colors.success};
  }
`;

// Em telas estreitas a tabela rola de lado, sem estourar o cartão
export const TableScroll = styled.div`
  overflow-x: auto;

  /* Sete colunas: um pouco menos de espaço entre elas para caber tudo */
  th,
  td {
    padding-left: 12px;
    padding-right: 12px;
  }

  th:first-child,
  td:first-child {
    padding-left: 20px;
  }

  th:last-child,
  td:last-child {
    padding-right: 12px;
  }
`;
