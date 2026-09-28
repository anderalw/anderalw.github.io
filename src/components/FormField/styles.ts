import styled, { css } from 'styled-components';

import { inputStyles } from '../ui';
import { colors } from '../../styles/theme';

export const Container = styled.label<{ hasError: boolean }>`
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 6px;

  > span {
    font-size: 13px;
    font-weight: 500;
    color: ${colors.textMuted};
  }

  input {
    ${inputStyles}

    ${props =>
      props.hasError &&
      css`
        &,
        &:hover:not(:disabled) {
          border-color: ${colors.danger};
        }

        &:focus {
          box-shadow: 0 0 0 3px ${colors.dangerSoft};
        }
      `}
  }
`;

export const ErrorText = styled.small<{ hasError: boolean }>`
  min-height: 16px;
  font-size: 12px;
  line-height: 16px;
  color: ${props => (props.hasError ? colors.danger : colors.textSubtle)};
`;
