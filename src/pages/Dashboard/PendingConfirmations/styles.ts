import styled, { css, keyframes } from 'styled-components';

import { colors, radius, shadow } from '../../../styles/theme';

export type Tone = 'loading' | 'pending' | 'done' | 'empty';

// Botão da barra da agenda. Largura fixa: o texto muda sem empurrar o resto
export const Trigger = styled.button<{ tone: Tone }>`
  display: flex;
  align-items: center;
  gap: 8px;
  width: 240px;
  height: 32px;
  margin-left: 12px;
  padding: 0 12px;
  border: 1px solid ${colors.borderStrong};
  border-radius: ${radius.md};
  background: ${colors.surface};
  color: ${colors.textMuted};
  font-size: 13px;
  font-weight: 500;
  white-space: nowrap;
  transition: background-color 0.15s, border-color 0.15s;

  svg {
    flex-shrink: 0;
    width: 15px;
    height: 15px;
  }

  span {
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .short {
    display: none;
  }

  &:hover {
    background: ${colors.surfaceHover};
  }

  &[aria-expanded='true'] {
    border-color: ${colors.textMuted};
  }

  ${props =>
    props.tone === 'pending' &&
    css`
      border-color: rgba(255, 144, 0, 0.45);
      background: ${colors.primarySoft};
      color: ${colors.primary};

      &:hover {
        background: rgba(255, 144, 0, 0.2);
      }

      &[aria-expanded='true'] {
        border-color: ${colors.primary};
      }
    `}

  ${props =>
    props.tone === 'done' &&
    css`
      color: ${colors.success};
    `}

  /* Telas estreitas: só o ícone e o número */
  @media (max-width: 1180px) {
    width: 64px;
    justify-content: center;

    .full {
      display: none;
    }

    .short {
      display: inline;
    }
  }
`;

export const Backdrop = styled.div`
  position: fixed;
  inset: 0;
  z-index: 9;
`;

const dropIn = keyframes`
  from { opacity: 0; transform: translateY(-4px); }
  to { opacity: 1; transform: translateY(0); }
`;

// Altura fixa: a lista rola por dentro, o painel não muda de tamanho
export const Panel = styled.div`
  position: fixed;
  display: flex;
  flex-direction: column;
  width: 440px;
  max-width: calc(100vw - 32px);
  border: 1px solid ${colors.borderStrong};
  border-radius: ${radius.lg};
  background: ${colors.surface};
  box-shadow: ${shadow.popover};
  overflow: hidden;
  animation: ${dropIn} 0.15s ease-out;

  &:focus {
    outline: none;
  }
`;

export const PanelHeader = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  padding: 14px 12px 12px 20px;
  border-bottom: 1px solid ${colors.border};

  h2 {
    font-size: 16px;
    font-weight: 600;
    color: ${colors.text};
  }

  p {
    margin-top: 2px;
    font-size: 13px;
    color: ${colors.textMuted};

    &::first-letter {
      text-transform: uppercase;
    }
  }
`;

export const CloseButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  flex-shrink: 0;
  border: 0;
  border-radius: 6px;
  background: transparent;
  color: ${colors.textMuted};

  &:hover {
    background: ${colors.surfaceHover};
    color: ${colors.text};
  }
`;

// Barra de progresso: quantos de amanhã já confirmaram
export const Progress = styled.div<{ value: number }>`
  height: 4px;
  margin-top: 10px;
  border-radius: 2px;
  background: ${colors.borderStrong};
  overflow: hidden;

  &::after {
    content: '';
    display: block;
    width: ${props => Math.round(props.value * 100)}%;
    height: 100%;
    background: ${colors.success};
    transition: width 0.3s;
  }
`;

export const List = styled.ul`
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  list-style: none;
`;

export const Item = styled.li`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px 10px 8px;

  & + li {
    border-top: 1px solid ${colors.border};
  }
`;

// Parte clicável do item: abre os detalhes do agendamento
export const ItemMain = styled.button<{ color: string }>`
  flex: 1;
  min-width: 0;
  display: flex;
  gap: 12px;
  padding: 6px 8px 6px 12px;
  border: 0;
  border-left: 3px solid ${props => props.color};
  border-radius: 6px;
  background: transparent;
  text-align: left;

  &:hover {
    background: ${colors.surfaceHover};
  }

  time {
    width: 40px;
    flex-shrink: 0;
    font-size: 13px;
    font-weight: 600;
    color: ${colors.text};
    font-variant-numeric: tabular-nums;
  }

  > div {
    min-width: 0;
  }

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

export const ItemActions = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
`;

const iconAction = css`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: 1px solid ${colors.borderStrong};
  border-radius: ${radius.md};
  background: transparent;
  color: ${colors.textMuted};
  transition: background-color 0.15s, color 0.15s, border-color 0.15s;

  svg {
    width: 15px;
    height: 15px;
  }

  &:hover {
    background: ${colors.surfaceHover};
    color: ${colors.text};
  }
`;

export const IconLink = styled.a`
  ${iconAction}
`;

export const ConfirmButton = styled.button`
  ${iconAction}

  &:hover:not(:disabled) {
    border-color: ${colors.success};
    background: ${colors.successSoft};
    color: ${colors.success};
  }

  &:disabled {
    opacity: 0.5;
    cursor: default;
  }
`;

export const Empty = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  height: 100%;
  padding: 24px;
  text-align: center;
  color: ${colors.textMuted};

  svg {
    width: 32px;
    height: 32px;
    color: ${colors.success};
  }
`;

export const Footnote = styled.p`
  padding: 10px 20px 12px;
  border-top: 1px solid ${colors.border};
  font-size: 12px;
  line-height: 1.4;
  color: ${colors.textSubtle};
`;
