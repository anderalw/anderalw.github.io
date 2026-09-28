import styled, { css, keyframes } from 'styled-components';

import { colors, radius } from '../../styles/theme';
import { WideDialog } from '../Dashboard/modalLayout';

// Tabela à esquerda; intervalo numa coluna fixa à direita
export const Columns = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) 340px;
  gap: 24px;
  align-items: start;

  @media (max-width: 1180px) {
    grid-template-columns: minmax(0, 1fr);
  }
`;

export const SideColumn = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
  position: sticky;
  top: 28px;
`;

export const ServiceRow = styled.tr<{ inactive: boolean; editing: boolean }>`
  ${props =>
    props.inactive &&
    css`
      td.name strong,
      td.num {
        color: ${colors.textSubtle};
      }
    `}

  ${props =>
    props.editing &&
    css`
      && {
        background: ${colors.primarySoft};
      }
    `}

  td.name strong {
    font-weight: 500;
  }

  td.actions {
    width: 1%;
    white-space: nowrap;
    text-align: right;

    button + button {
      margin-left: 4px;
    }
  }
`;

const pulse = keyframes`
  50% { opacity: 0.5; }
`;

// Linha "fantasma" enquanto a lista carrega, com a mesma altura da real
export const SkeletonBar = styled.span<{ width: number }>`
  display: block;
  height: 12px;
  width: ${props => props.width}px;
  max-width: 100%;
  border-radius: 4px;
  background: ${colors.surfaceHover};
  animation: ${pulse} 1.4s ease-in-out infinite;
`;

export const EmptyText = styled.p`
  padding: 40px 20px;
  text-align: center;
  color: ${colors.textMuted};
`;

export const Hint = styled.p`
  font-size: 13px;
  color: ${colors.textMuted};
`;

export const InlineRow = styled.div`
  display: flex;
  gap: 8px;
  align-items: flex-end;

  > label {
    flex: 1;
  }
`;

export const Counter = styled.span`
  margin-left: auto;
  padding: 2px 8px;
  border-radius: ${radius.sm};
  background: ${colors.surfaceHover};
  color: ${colors.textMuted};
  font-size: 12px;
  font-weight: 500;
`;

// Modal compacto (o formulário tem só três campos), com tamanho fixo
export const CompactDialog = styled(WideDialog)`
  max-width: 560px;
  height: min(420px, 100%);
`;

export const ModalSubtitle = styled.p`
  margin-top: 2px;
  font-size: 13px;
  color: ${colors.textMuted};
`;

// O formulário ocupa o modal: campos em cima, botões no rodapé
export const ModalForm = styled.form`
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;

  > :first-child {
    flex: 1;
  }
`;

export const FieldRow = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
`;

export const ModalField = styled.label<{ hasError: boolean }>`
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 6px;

  > span {
    font-size: 13px;
    font-weight: 500;
    color: ${colors.textMuted};
  }

  ${props =>
    props.hasError &&
    css`
      input,
      input:hover:not(:disabled) {
        border-color: ${colors.danger};
      }
    `}
`;

// Espaço sempre reservado: o erro aparece sem empurrar os outros campos
export const FieldError = styled.small`
  min-height: 16px;
  font-size: 12px;
  line-height: 16px;
  color: ${colors.danger};
`;
