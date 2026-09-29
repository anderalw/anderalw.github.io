import styled, { css, keyframes } from 'styled-components';

import { colors, radius, shadow } from '../../styles/theme';

// Fundo transparente: clicar fora fecha o painel
export const Backdrop = styled.div`
  position: fixed;
  inset: 0;
  z-index: 9;
`;

const slideIn = keyframes`
  from { opacity: 0; transform: translateX(-6px); }
  to { opacity: 1; transform: translateX(0); }
`;

// Altura fixa (definida pela posição): a lista rola por dentro, o painel
// não muda de tamanho enquanto carrega
export const Panel = styled.div`
  position: fixed;
  display: flex;
  flex-direction: column;
  width: 420px;
  max-width: calc(100vw - 96px);
  border: 1px solid ${colors.borderStrong};
  border-radius: ${radius.lg};
  background: ${colors.surface};
  box-shadow: ${shadow.popover};
  overflow: hidden;
  animation: ${slideIn} 0.15s ease-out;

  &:focus {
    outline: none;
  }
`;

export const PanelHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 14px 12px 10px 20px;

  h2 {
    font-size: 16px;
    font-weight: 600;
    color: ${colors.text};
  }
`;

export const HeaderActions = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
`;

export const LinkButton = styled.button`
  height: 28px;
  padding: 0 8px;
  border: 0;
  border-radius: 6px;
  background: transparent;
  color: ${colors.primary};
  font-size: 13px;
  font-weight: 500;

  &:hover:not(:disabled) {
    background: ${colors.primarySoft};
  }

  &:disabled {
    color: ${colors.textSubtle};
    cursor: default;
  }
`;

export const CloseButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: 0;
  border-radius: 6px;
  background: transparent;
  color: ${colors.textMuted};

  &:hover {
    background: ${colors.surfaceHover};
    color: ${colors.text};
  }
`;

export const Tabs = styled.div`
  display: inline-flex;
  align-self: flex-start;
  margin: 0 20px 10px;
  padding: 2px;
  border: 1px solid ${colors.borderStrong};
  border-radius: ${radius.md};
  background: ${colors.sunken};

  button {
    height: 26px;
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

export const List = styled.div`
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  border-top: 1px solid ${colors.border};
`;

// Título de cada dia ("Hoje", "Ontem", "segunda, 28 de setembro")
export const DayTitle = styled.h3`
  padding: 12px 20px 6px;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: ${colors.textSubtle};
`;

export const Item = styled.button<{ unread: boolean; clickable: boolean }>`
  display: flex;
  align-items: flex-start;
  gap: 12px;
  width: 100%;
  padding: 10px 16px 10px 20px;
  border: 0;
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

  > div {
    flex: 1;
    min-width: 0;
  }

  p {
    color: ${props => (props.unread ? colors.text : colors.textMuted)};
    font-size: 13px;
    font-weight: ${props => (props.unread ? 500 : 400)};
    line-height: 18px;
  }

  time {
    display: block;
    margin-top: 2px;
    color: ${colors.textSubtle};
    font-size: 12px;
  }
`;

// Ícone do tipo (novo, remarcado, cancelado), na cor do tipo
export const Icon = styled.span<{ tone: 'new' | 'moved' | 'canceled' }>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
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
          color: ${colors.info};
          background: ${colors.infoSoft};
        `;
      default:
        return css`
          color: ${colors.success};
          background: ${colors.successSoft};
        `;
    }
  }}

  svg {
    width: 15px;
    height: 15px;
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
  gap: 12px;
  align-items: center;
  padding: 12px 20px;

  span {
    border-radius: 4px;
    background: ${colors.surfaceHover};
    animation: ${pulse} 1.4s ease-in-out infinite;
  }

  span:first-child {
    width: 30px;
    height: 30px;
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
  font-size: 12px;
  color: ${colors.textSubtle};
`;
