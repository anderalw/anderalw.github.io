import styled, { keyframes } from 'styled-components';

import { colors, radius } from '../../styles/theme';

export const List = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-width: 880px;
`;

export const Item = styled.section`
  background: ${colors.surface};
  border: 1px solid ${colors.border};
  border-radius: ${radius.lg};
`;

// Linha principal: data, detalhes, valor e ações
export const Row = styled.div`
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 16px 20px;
`;

export const DateBadge = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 60px;
  height: 64px;
  flex-shrink: 0;
  border-radius: ${radius.md};
  background: ${colors.primarySoft};
  color: ${colors.primary};
  text-transform: uppercase;

  small {
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.04em;
  }

  strong {
    font-size: 22px;
    font-weight: 700;
    line-height: 1.1;
    font-variant-numeric: tabular-nums;
  }
`;

export const Info = styled.div`
  flex: 1;
  min-width: 0;

  h2 {
    font-size: 15px;
    font-weight: 600;
    color: ${colors.text};
  }

  time {
    display: block;
    margin-top: 2px;
    color: ${colors.textMuted};
    font-variant-numeric: tabular-nums;

    &::first-letter {
      text-transform: uppercase;
    }
  }

  .provider {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-top: 8px;
    font-size: 13px;
    color: ${colors.textMuted};

    img {
      width: 20px;
      height: 20px;
      border-radius: 50%;
      object-fit: cover;
    }
  }
`;

export const Price = styled.span`
  font-size: 15px;
  font-weight: 600;
  color: ${colors.text};
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
`;

export const ItemActions = styled.div`
  display: flex;
  gap: 6px;
  flex-shrink: 0;
`;

// Mensagem no lugar das ações quando já não dá para mudar sozinho
export const Hint = styled.p`
  max-width: 220px;
  font-size: 12px;
  line-height: 16px;
  color: ${colors.textSubtle};
  text-align: right;
`;

export const Panel = styled.div`
  padding: 16px 20px 20px;
  border-top: 1px solid ${colors.border};

  > p {
    color: ${colors.text};
    margin-bottom: 12px;
  }
`;

export const PanelActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 8px;
`;

const pulse = keyframes`
  50% { opacity: 0.5; }
`;

// Card "fantasma" com a altura do real, enquanto a lista carrega
export const ItemSkeleton = styled.div`
  height: 98px;
  border: 1px solid ${colors.border};
  border-radius: ${radius.lg};
  background: ${colors.surface};
  animation: ${pulse} 1.4s ease-in-out infinite;
`;

export const Empty = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  max-width: 880px;
  padding: 56px 24px;
  border: 1px dashed ${colors.borderStrong};
  border-radius: ${radius.lg};
  color: ${colors.textMuted};
  text-align: center;

  svg {
    width: 32px;
    height: 32px;
    color: ${colors.textSubtle};
  }
`;

// Horários anteriores: lista mais discreta, abaixo dos próximos
export const HistoryTitle = styled.h2`
  margin: 32px 0 12px;
  font-size: 15px;
  font-weight: 600;
  color: ${colors.text};
`;

export const HistoryItem = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 12px 20px;
  border: 1px solid ${colors.border};
  border-radius: ${radius.lg};
  background: ${colors.surface};

  & + & {
    margin-top: 8px;
  }

  > div {
    flex: 1;
    min-width: 0;
  }

  strong {
    display: block;
    font-size: 14px;
    font-weight: 600;
    color: ${colors.text};
  }

  small {
    font-size: 13px;
    color: ${colors.textMuted};
  }
`;

export const HistoryStatus = styled.span<{ tone: 'ok' | 'missed' | 'neutral' }>`
  font-size: 12px;
  font-weight: 500;
  white-space: nowrap;
  color: ${props => {
    if (props.tone === 'ok') return colors.success;
    if (props.tone === 'missed') return colors.danger;

    return colors.textMuted;
  }};
`;
