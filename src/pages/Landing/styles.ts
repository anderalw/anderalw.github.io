import styled, { css } from 'styled-components';
import { Link } from 'react-router-dom';

import { colors, radius } from '../../styles/theme';

export const Choices = styled.nav`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

// Cartão clicável com as duas entradas do sistema
export const Choice = styled(Link)<{ $primary?: boolean }>`
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 18px 20px;
  border: 1px solid ${colors.borderStrong};
  border-radius: ${radius.lg};
  background: ${colors.sunken};
  color: ${colors.text};
  text-decoration: none;
  transition: border-color 0.15s, background-color 0.15s;

  .icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 44px;
    height: 44px;
    flex-shrink: 0;
    border-radius: ${radius.md};
    background: ${colors.surfaceHover};
    color: ${colors.textMuted};

    svg {
      width: 20px;
      height: 20px;
    }
  }

  div {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  strong {
    font-size: 16px;
  }

  small {
    font-size: 13px;
    color: ${colors.textMuted};
  }

  .arrow {
    width: 18px;
    height: 18px;
    color: ${colors.textSubtle};
    transition: transform 0.15s, color 0.15s;
  }

  &:hover {
    border-color: ${colors.primary};

    .arrow {
      color: ${colors.primary};
      transform: translateX(3px);
    }
  }

  ${props =>
    props.$primary &&
    css`
      border-color: ${colors.primary};
      background: ${colors.primarySoft};

      .icon {
        background: ${colors.primary};
        color: ${colors.onPrimary};
      }

      .arrow {
        color: ${colors.primary};
      }
    `}
`;
