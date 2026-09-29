import styled, { css } from 'styled-components';

import { colors } from '../../styles/theme';

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
    color: ${colors.textMuted};
    margin-bottom: 6px;
  }

  select,
  input {
    height: 42px;
    padding: 0 12px;
    border-radius: 8px;
    border: 2px solid ${colors.sunken};
    background: ${colors.sunken};
    color: ${colors.text};
    color-scheme: dark;
    font: inherit;

    &:focus {
      outline: none;
      border-color: ${colors.primary};
    }
  }
`;

export const Times = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
`;

// Altura fixa (três linhas de horários): carregar ou trocar de dia não muda o
// tamanho do formulário; se houver mais horários, rola por dentro
export const TimesBox = styled.div`
  height: 128px;
  overflow-y: auto;
  padding-right: 4px;
`;

export const TimeButton = styled.button<{ selected: boolean }>`
  padding: 8px 14px;
  border: 0;
  border-radius: 8px;
  font: inherit;
  font-size: 14px;
  font-weight: 500;
  background: ${colors.borderStrong};
  color: ${colors.text};
  transition: background-color 0.2s;

  &:hover {
    background: ${colors.textSubtle};
  }

  ${props =>
    props.selected &&
    css`
      &,
      &:hover {
        background: ${colors.primary};
        color: ${colors.onPrimary};
      }
    `}
`;

export const Hint = styled.p`
  min-height: 20px;
  font-size: 14px;
  line-height: 20px;
  color: ${colors.textMuted};
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
  background: ${colors.primary};
  color: ${colors.onPrimary};
  font: inherit;
  font-weight: 500;

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  &:hover:not(:disabled) {
    background: ${colors.primaryHover};
  }
`;

export const SecondaryButton = styled.button`
  height: 40px;
  padding: 0 16px;
  border: 1px solid ${colors.borderStrong};
  border-radius: 8px;
  background: transparent;
  color: ${colors.text};
  font: inherit;

  &:hover {
    background: ${colors.borderStrong};
  }
`;
