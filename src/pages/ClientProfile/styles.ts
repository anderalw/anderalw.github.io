import styled, { css } from 'styled-components';

import { colors, radius } from '../../styles/theme';
import { Table } from '../../components/ui';

export const BackLink = styled.div`
  margin-bottom: 16px;

  a {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    color: ${colors.textMuted};
    font-size: 13px;
    text-decoration: none;

    &:hover {
      color: ${colors.text};
    }

    svg {
      width: 16px;
      height: 16px;
    }
  }
`;

// Cabeçalho da ficha: avatar, nome, contatos e selos
export const Header = styled.header`
  display: flex;
  align-items: center;
  gap: 16px;
  min-height: 72px;
  margin-bottom: 24px;

  img {
    width: 64px;
    height: 64px;
    flex-shrink: 0;
    border-radius: 50%;
  }

  h1 {
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 22px;
    font-weight: 600;
    letter-spacing: -0.01em;
    color: ${colors.text};
  }

  > div {
    flex: 1;
    min-width: 0;
  }

  > :last-child {
    flex: none;
    display: flex;
    gap: 8px;
  }
`;

export const Contacts = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px 16px;
  margin-top: 6px;
  font-size: 13px;
  color: ${colors.textMuted};

  a,
  span {
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }

  a {
    color: ${colors.textMuted};
    text-decoration: none;

    &:hover {
      color: ${colors.primary};
    }
  }

  svg {
    width: 14px;
    height: 14px;
  }
`;

export const Layout = styled.div`
  display: grid;
  grid-template-columns: 320px minmax(0, 1fr);
  gap: 24px;
  align-items: start;

  @media (max-width: 1100px) {
    grid-template-columns: minmax(0, 1fr);
  }
`;

export const NotesArea = styled.textarea`
  display: block;
  width: 100%;
  height: 180px;
  padding: 10px 12px;
  border: 1px solid ${colors.borderStrong};
  border-radius: ${radius.md};
  background: ${colors.sunken};
  color: ${colors.text};
  font: inherit;
  font-size: 14px;
  line-height: 1.5;
  resize: none;

  &::placeholder {
    color: ${colors.textSubtle};
  }

  &:focus {
    outline: none;
    border-color: ${colors.primary};
    box-shadow: 0 0 0 3px ${colors.primarySoft};
  }
`;

export const NotesFooter = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-top: 10px;
  min-height: 30px;

  small {
    font-size: 12px;
    color: ${colors.textSubtle};
  }
`;

export const Filters = styled.div`
  display: inline-flex;
  margin-left: auto;
  padding: 2px;
  border: 1px solid ${colors.borderStrong};
  border-radius: ${radius.md};
  background: ${colors.sunken};

  button {
    height: 26px;
    padding: 0 10px;
    border: 0;
    border-radius: 6px;
    background: transparent;
    color: ${colors.textMuted};
    font-size: 12px;
    font-weight: 500;
    white-space: nowrap;

    &:hover {
      color: ${colors.text};
    }

    &[aria-pressed='true'] {
      background: ${colors.surfaceHover};
      color: ${colors.text};
    }
  }
`;

export type HistoryTone =
  | 'success'
  | 'danger'
  | 'primary'
  | 'warning'
  | 'muted';

const toneColors: Record<HistoryTone, string> = {
  success: colors.success,
  danger: colors.danger,
  primary: colors.primary,
  warning: colors.warning,
  muted: colors.textMuted,
};

export const StatusTag = styled.span<{ tone: HistoryTone }>`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 2px 8px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 500;
  white-space: nowrap;

  ${props => css`
    color: ${toneColors[props.tone]};
    background: ${props.tone === 'muted'
      ? colors.surfaceHover
      : `color-mix(in srgb, ${toneColors[props.tone]} 12%, transparent)`};
  `}

  &::before {
    content: '';
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: currentColor;
  }
`;

export const HistoryRow = styled.tr<{ canceled: boolean }>`
  cursor: pointer;

  td {
    white-space: nowrap;
  }

  ${props =>
    props.canceled &&
    css`
      td:not(:last-child) {
        color: ${colors.textSubtle};
      }
    `}
`;

// Cinco colunas ao lado das observações: espaçamento menor que o padrão
export const HistoryTable = styled(Table)`
  th {
    padding: 10px 12px;
  }

  td {
    padding: 0 12px;
  }

  th:first-child,
  td:first-child {
    padding-left: 20px;
  }

  th:last-child,
  td:last-child {
    padding-right: 20px;
  }
`;
