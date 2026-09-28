import styled, { css, keyframes } from 'styled-components';
import { Form } from '@unform/web';

import { colors, radius, shadow } from '../../styles/theme';

export const Counter = styled.span`
  margin-left: auto;
  padding: 2px 8px;
  border-radius: ${radius.sm};
  background: ${colors.surfaceHover};
  color: ${colors.textMuted};
  font-size: 12px;
  font-weight: 500;
`;

export const MemberRow = styled.tr<{ inactive: boolean }>`
  td.schedule {
    max-width: 360px;
    color: ${colors.textMuted};
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    font-variant-numeric: tabular-nums;

    .empty {
      color: ${colors.textSubtle};
    }
  }

  td.actions {
    width: 1%;
    white-space: nowrap;
    text-align: right;

    button + button {
      margin-left: 4px;
    }

    /* Desativar e Reativar com a mesma largura: o Editar não sai do lugar */
    button:last-child {
      width: 104px;
      justify-content: flex-start;
    }
  }

  ${props =>
    props.inactive &&
    css`
      td:not(.actions) {
        opacity: 0.55;
      }
    `}
`;

export const MemberCell = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;

  img {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    object-fit: cover;
    flex-shrink: 0;
  }

  div {
    display: flex;
    flex-direction: column;
    min-width: 0;
  }

  strong {
    display: flex;
    align-items: center;
    gap: 8px;
    font-weight: 500;
  }

  small {
    font-size: 12px;
    color: ${colors.textMuted};
  }
`;

const pulse = keyframes`
  50% { opacity: 0.5; }
`;

// Linha "fantasma" enquanto a equipe carrega, com a altura da real
export const SkeletonBar = styled.span<{ width: number }>`
  display: block;
  height: 12px;
  width: ${props => props.width}px;
  max-width: 100%;
  border-radius: 4px;
  background: ${colors.surfaceHover};
  animation: ${pulse} 1.4s ease-in-out infinite;
`;

const fadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;

const overlay = css`
  position: fixed;
  inset: 0;
  z-index: 10;
  background: rgba(12, 11, 14, 0.6);
  animation: ${fadeIn} 0.15s ease-out;
`;

export const ModalSubtitle = styled.p`
  margin-top: 2px;
  font-size: 13px;
  color: ${colors.textMuted};
`;

// O formulário ocupa o modal: colunas em cima, botões no rodapé
export const ModalForm = styled(Form)`
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
`;

export const FormColumns = styled.div`
  flex: 1;
  min-height: 0;
  display: grid;
  grid-template-columns: 340px minmax(0, 1fr);
`;

export const FormAside = styled.div`
  padding: 20px 24px;
  border-right: 1px solid ${colors.border};
`;

export const SectionTitle = styled.h3`
  margin: 4px 0 12px;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: ${colors.textSubtle};

  & ~ & {
    margin-top: 20px;
  }
`;

export const ScheduleTable = styled.table`
  width: 100%;
  border-collapse: collapse;

  td {
    /* Mesma altura com ou sem os campos de horário */
    height: 50px;
    border-top: 1px solid ${colors.border};
  }

  tr:first-child td {
    border-top: 0;
  }

  input[type='time'] {
    width: 116px;
  }

  td.until {
    width: 40px;
    text-align: center;
    color: ${colors.textSubtle};
    font-size: 13px;
  }

  td.off {
    text-align: right;
  }
`;

export const DayToggle = styled.label`
  display: inline-flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  color: ${colors.text};
  font-weight: 500;

  input {
    width: 16px;
    height: 16px;
    accent-color: ${colors.primary};
    cursor: pointer;
  }
`;

export const ConfirmOverlay = styled.div`
  ${overlay}
  z-index: 20;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
`;

export const ConfirmBox = styled.div`
  width: 100%;
  max-width: 420px;
  padding: 24px;
  border: 1px solid ${colors.border};
  border-radius: ${radius.lg};
  background: ${colors.surface};
  box-shadow: ${shadow.popover};

  .icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    margin-bottom: 16px;
    border-radius: 50%;
    background: ${colors.dangerSoft};
    color: ${colors.danger};

    svg {
      width: 20px;
      height: 20px;
    }
  }

  h2 {
    font-size: 17px;
    font-weight: 600;
  }

  p {
    margin-top: 8px;
    color: ${colors.textMuted};
    line-height: 1.5;
  }

  .note {
    font-size: 13px;
    color: ${colors.textSubtle};
  }

  footer {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
    margin-top: 24px;
  }
`;
