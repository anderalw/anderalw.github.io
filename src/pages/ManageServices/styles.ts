import styled, { css, keyframes } from 'styled-components';

import { colors, radius } from '../../styles/theme';

// Tabela à esquerda; formulário e intervalo numa coluna fixa à direita
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

export const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 16px;
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
  padding: 2px 8px;
  border-radius: ${radius.sm};
  background: ${colors.surfaceHover};
  color: ${colors.textMuted};
  font-size: 12px;
  font-weight: 500;
`;
