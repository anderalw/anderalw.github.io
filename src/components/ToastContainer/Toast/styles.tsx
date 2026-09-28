import styled, { css } from 'styled-components';
import { animated } from 'react-spring';

import { colors, radius, shadow } from '../../../styles/theme';

interface ContainerProps {
  type?: 'success' | 'error' | 'info';
  // Prefixo $: prop só de estilo, o styled-components não a repassa ao DOM
  $hasDescription: boolean;
}

// Cor de destaque de cada tipo (faixa à esquerda e ícone)
const toastColors = {
  info: '#4dabf7',
  success: colors.success,
  error: colors.danger,
};

export const Container = styled(animated.div)<ContainerProps>`
  width: 360px;

  position: relative;
  padding: 14px 36px 14px 16px;
  border: 1px solid ${colors.borderStrong};
  border-left: 3px solid ${props => toastColors[props.type || 'info']};
  border-radius: ${radius.md};
  background: ${colors.surface};
  color: ${colors.text};
  font-size: 14px;
  box-shadow: ${shadow.popover};

  display: flex;

  & + div {
    margin-top: 8px;
  }

  > svg {
    margin: 2px 12px 0 0;
    flex-shrink: 0;
    color: ${props => toastColors[props.type || 'info']};
  }

  div {
    flex: 1;

    p {
      margin-top: 4px;
      font-size: 13px;
      line-height: 20px;
      color: ${colors.textMuted};
    }
  }

  button {
    position: absolute;
    right: 12px;
    top: 14px;
    border: 0;
    background: transparent;
    color: ${colors.textSubtle};

    &:hover {
      color: ${colors.text};
    }
  }

  ${props =>
    !props.$hasDescription &&
    css`
      align-items: center;

      > svg {
        margin-top: 0;
      }
    `}
`;
