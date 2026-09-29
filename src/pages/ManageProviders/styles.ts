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
  background: ${colors.overlay};
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

// Formulário de adicionar horário: dias, horário e o botão
export const AddSchedule = styled.div`
  padding: 14px 16px 10px;
  border: 1px solid ${colors.border};
  border-radius: ${radius.md};
  background: ${colors.sunken};
`;

export const AddRow = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;

  & + & {
    margin-top: 12px;
  }

  > span {
    width: 56px;
    flex-shrink: 0;
    font-size: 13px;
    font-weight: 500;
    color: ${colors.textMuted};
  }

  > small {
    color: ${colors.textSubtle};
    font-size: 13px;
  }

  /* Hora e minutos */
  > div[class]:not([role='group']) {
    width: 118px;
  }

  > button {
    margin-left: auto;
  }
`;

// Dica fixa que vira a mensagem de erro, sempre com a mesma altura
export const AddHint = styled.p<{ error: boolean }>`
  min-height: 18px;
  margin: 8px 0 0 66px;
  font-size: 12px;
  line-height: 18px;
  color: ${props => (props.error ? colors.danger : colors.textSubtle)};
`;

// Horários já adicionados, um grupo de dias por linha
export const GroupList = styled.div`
  margin-top: 14px;
`;

export const GroupItem = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  height: 40px;
  padding: 0 4px 0 12px;
  border-bottom: 1px solid ${colors.border};

  strong {
    flex: 1;
    min-width: 0;
    font-weight: 500;
    color: ${colors.text};
  }

  span {
    font-variant-numeric: tabular-nums;
    color: ${colors.textMuted};
  }
`;

export const DaysOff = styled.p`
  padding: 10px 12px 0;
  font-size: 13px;
  color: ${colors.textSubtle};
`;
