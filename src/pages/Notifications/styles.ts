import styled, { css, keyframes } from 'styled-components';

import { colors, radius } from '../../styles/theme';

export const Tabs = styled.div`
  display: inline-flex;
  padding: 2px;
  border: 1px solid ${colors.borderStrong};
  border-radius: ${radius.md};
  background: ${colors.sunken};

  button {
    height: 28px;
    padding: 0 12px;
    border: 0;
    border-radius: 6px;
    background: transparent;
    color: ${colors.textMuted};
    font-size: 13px;
    font-weight: 500;

    &:hover {
      color: ${colors.text};
    }

    &[aria-pressed='true'] {
      background: ${colors.surfaceHover};
      color: ${colors.text};
    }
  }
`;

// Título de cada dia ("Hoje", "Ontem", "segunda, 28 de setembro")
export const DayTitle = styled.h3`
  padding: 14px 20px 6px;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: ${colors.textSubtle};

  &::first-letter {
    text-transform: uppercase;
  }
`;

export const Item = styled.button<{ unread: boolean; clickable: boolean }>`
  display: flex;
  align-items: flex-start;
  gap: 14px;
  width: 100%;
  padding: 12px 20px;
  border: 0;
  border-top: 1px solid ${colors.border};
  background: transparent;
  text-align: left;
  cursor: ${props => (props.clickable ? 'pointer' : 'default')};
  transition: background-color 0.1s;

  &:hover {
    background: ${props =>
      props.clickable ? colors.surfaceHover : 'transparent'};
  }

  &:focus-visible {
    outline: 2px solid ${colors.primary};
    outline-offset: -2px;
  }

  p {
    flex: 1;
    min-width: 0;
    color: ${props => (props.unread ? colors.text : colors.textMuted)};
    font-weight: ${props => (props.unread ? 500 : 400)};
    line-height: 20px;
  }

  time {
    flex-shrink: 0;
    color: ${colors.textSubtle};
    font-size: 12px;
    line-height: 20px;
    white-space: nowrap;
  }
`;

// Ícone do tipo (novo, remarcado, cancelado), na cor do tipo
export const Icon = styled.span<{ tone: 'new' | 'moved' | 'canceled' }>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  flex-shrink: 0;
  border-radius: 50%;

  ${props => {
    switch (props.tone) {
      case 'canceled':
        return css`
          color: ${colors.danger};
          background: ${colors.dangerSoft};
        `;
      case 'moved':
        return css`
          color: #4dabf7;
          background: rgba(77, 171, 247, 0.12);
        `;
      default:
        return css`
          color: ${colors.success};
          background: ${colors.successSoft};
        `;
    }
  }}

  svg {
    width: 16px;
    height: 16px;
  }
`;

// Bolinha de não lida (espaço reservado também nas lidas)
export const Dot = styled.span<{ visible: boolean }>`
  width: 8px;
  height: 8px;
  margin-top: 6px;
  flex-shrink: 0;
  border-radius: 50%;
  background: ${props => (props.visible ? colors.primary : 'transparent')};
`;

const pulse = keyframes`
  50% { opacity: 0.5; }
`;

export const Skeleton = styled.div`
  display: flex;
  gap: 14px;
  align-items: center;
  padding: 14px 20px;
  border-top: 1px solid ${colors.border};

  span {
    border-radius: 4px;
    background: ${colors.surfaceHover};
    animation: ${pulse} 1.4s ease-in-out infinite;
  }

  span:first-child {
    width: 32px;
    height: 32px;
    border-radius: 50%;
  }
`;

export const Empty = styled.p`
  padding: 48px 20px;
  text-align: center;
  color: ${colors.textMuted};
`;

export const Footnote = styled.p`
  padding: 12px 20px 16px;
  border-top: 1px solid ${colors.border};
  font-size: 12px;
  color: ${colors.textSubtle};
`;
