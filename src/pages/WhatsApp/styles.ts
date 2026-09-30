import styled, { css } from 'styled-components';

import { colors, radius } from '../../styles/theme';

// Verde do WhatsApp, só no botão de enviar
const WHATSAPP_GREEN = '#25d366';

export const Tabs = styled.div`
  display: inline-flex;
  gap: 4px;
  margin-bottom: 20px;
  padding: 4px;
  border: 1px solid ${colors.border};
  border-radius: ${radius.md};
  background: ${colors.surface};
`;

export const Tab = styled.button<{ selected: boolean }>`
  height: 32px;
  padding: 0 14px;
  border: 0;
  border-radius: 6px;
  background: transparent;
  color: ${colors.textMuted};
  font: inherit;
  font-size: 14px;
  font-weight: 500;

  ${props =>
    props.selected &&
    css`
      background: ${colors.surfaceHover};
      color: ${colors.text};
    `}
`;

export const ModeNote = styled.p<{ warning?: boolean }>`
  margin-bottom: 20px;
  padding: 12px 14px;
  border: 1px solid ${props => (props.warning ? colors.warning : colors.border)};
  border-radius: ${radius.md};
  background: ${props => (props.warning ? colors.warningSoft : colors.surface)};
  font-size: 13px;
  line-height: 1.5;
  color: ${colors.textMuted};

  a {
    color: ${colors.primary};
  }
`;

export const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
  gap: 16px;
`;

export const MessageCard = styled.article`
  display: flex;
  flex-direction: column;
  border: 1px solid ${colors.border};
  border-radius: ${radius.lg};
  background: ${colors.surface};

  > header {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    padding: 14px 16px 10px;

    strong {
      display: block;
      font-size: 15px;
      color: ${colors.text};
    }

    /* Uma linha só: os cartões ficam alinhados */
    > div {
      min-width: 0;
    }

    small {
      display: block;
      overflow: hidden;
      font-size: 12px;
      white-space: nowrap;
      text-overflow: ellipsis;
      color: ${colors.textMuted};
    }

    > :last-child {
      flex-shrink: 0;
      margin-left: auto;
    }
  }

  footer {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 12px 16px 14px;
  }
`;

// Texto da mensagem: altura fixa com rolagem (os cartões ficam do mesmo
// tamanho)
export const Bubble = styled.p`
  height: 132px;
  margin: 0 16px;
  padding: 10px 12px;
  overflow-y: auto;
  border-radius: ${radius.md};
  background: ${colors.sunken};
  font-size: 13px;
  line-height: 1.5;
  white-space: pre-wrap;
  color: ${colors.text};
`;

export const KindChip = styled.span`
  padding: 2px 8px;
  border-radius: 999px;
  background: ${colors.primarySoft};
  color: ${colors.primary};
  font-size: 12px;
  font-weight: 500;
  white-space: nowrap;
`;

export const SendButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  height: 36px;
  padding: 0 14px;
  border: 0;
  border-radius: ${radius.md};
  background: ${WHATSAPP_GREEN};
  color: #0b1f12;
  font: inherit;
  font-size: 14px;
  font-weight: 600;

  svg {
    width: 17px;
    height: 17px;
  }

  &:hover:not(:disabled) {
    filter: brightness(1.05);
  }

  &:disabled {
    opacity: 0.5;
  }
`;

export const Empty = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 48px 16px;
  border: 1px dashed ${colors.borderStrong};
  border-radius: ${radius.lg};
  font-size: 14px;
  text-align: center;
  color: ${colors.textMuted};

  svg {
    width: 28px;
    height: 28px;
    color: ${colors.textSubtle};
  }
`;

export const StatusText = styled.span<{
  tone: 'success' | 'danger' | 'neutral';
}>`
  font-size: 13px;
  font-weight: 500;
  color: ${props => {
    if (props.tone === 'success') return colors.success;
    if (props.tone === 'danger') return colors.danger;

    return colors.textMuted;
  }};
`;
