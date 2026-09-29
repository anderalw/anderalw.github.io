import styled, { css, keyframes } from 'styled-components';

import { colors, radius } from '../../styles/theme';

const spin = keyframes`
  to { transform: rotate(360deg); }
`;

const tones = {
  neutral: colors.textMuted,
  success: colors.success,
  danger: colors.danger,
};

export const Result = styled.div<{ tone: keyof typeof tones }>`
  display: flex;
  align-items: flex-start;
  gap: 14px;
  padding: 18px;
  border: 1px solid ${colors.border};
  border-left: 4px solid ${props => tones[props.tone]};
  border-radius: ${radius.md};
  background: ${colors.sunken};

  > svg {
    flex-shrink: 0;
    width: 24px;
    height: 24px;
    color: ${props => tones[props.tone]};

    ${props =>
      props.tone === 'neutral' &&
      css`
        animation: ${spin} 1s linear infinite;
      `}
  }

  p {
    color: ${colors.text};
    line-height: 1.5;
  }
`;

export const Details = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;

  strong {
    font-size: 16px;
    color: ${colors.text};
  }

  span {
    color: ${colors.textMuted};

    &:last-child::first-letter {
      text-transform: uppercase;
    }
  }
`;
