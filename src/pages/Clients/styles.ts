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
    margin-top: 2px;
    font-size: 12px;
    color: ${colors.textMuted};
  }

  td {
    white-space: nowrap;
  }
`;

// Aviso de faltas (amarelo), ao lado do nome
export const AlertTag = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 1px 7px;
  border-radius: 999px;
  background: rgba(252, 196, 25, 0.12);
  color: #fcc419;
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
    color: #fcc419;
  }
`;
