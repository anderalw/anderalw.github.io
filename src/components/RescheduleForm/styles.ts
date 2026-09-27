import styled, { css } from 'styled-components';
import { shade } from 'polished';

export const Form = styled.div`
  display: flex;
  flex-direction: column;
  gap: 14px;
`;

export const Field = styled.label`
  display: flex;
  flex-direction: column;

  span {
    font-size: 13px;
    color: #999591;
    margin-bottom: 6px;
  }

  select,
  input {
    height: 42px;
    padding: 0 12px;
    border-radius: 8px;
    border: 2px solid #232129;
    background: #232129;
    color: #f4ede8;
    color-scheme: dark;
    font: inherit;

    &:focus {
      outline: none;
      border-color: #ff9000;
    }
  }
`;

export const Times = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
`;

export const TimeButton = styled.button<{ selected: boolean }>`
  padding: 8px 14px;
  border: 0;
  border-radius: 8px;
  font: inherit;
  font-size: 14px;
  font-weight: 500;
  background: #3e3b47;
  color: #f4ede8;
  transition: background-color 0.2s;

  &:hover {
    background: ${shade(0.2, '#3e3b47')};
  }

  ${props =>
    props.selected &&
    css`
      &,
      &:hover {
        background: #ff9000;
        color: #232129;
      }
    `}
`;

export const Hint = styled.p`
  font-size: 14px;
  color: #999591;
`;

export const Actions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 4px;
`;

export const PrimaryButton = styled.button`
  height: 40px;
  padding: 0 16px;
  border: 0;
  border-radius: 8px;
  background: #ff9000;
  color: #312e38;
  font: inherit;
  font-weight: 500;

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  &:hover:not(:disabled) {
    background: ${shade(0.2, '#ff9000')};
  }
`;

export const SecondaryButton = styled.button`
  height: 40px;
  padding: 0 16px;
  border: 1px solid #666360;
  border-radius: 8px;
  background: transparent;
  color: #f4ede8;
  font: inherit;

  &:hover {
    background: #3e3b47;
  }
`;
