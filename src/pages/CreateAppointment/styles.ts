import styled, { css, keyframes } from 'styled-components';

import { colors, radius } from '../../styles/theme';

// Etapas à esquerda; resumo fixo à direita
export const Columns = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) 320px;
  gap: 24px;
  align-items: start;

  @media (max-width: 1180px) {
    grid-template-columns: minmax(0, 1fr);
  }
`;

export const Steps = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
  min-width: 0;
`;

export const StepNumber = styled.span<{ done: boolean }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  flex-shrink: 0;
  border-radius: 50%;
  font-size: 12px;
  font-weight: 700;
  transition: background-color 0.15s, color 0.15s;

  ${props =>
    props.done
      ? css`
          background: ${colors.primary};
          color: ${colors.onPrimary};
        `
      : css`
          background: ${colors.surfaceHover};
          color: ${colors.textMuted};
        `}

  svg {
    width: 14px;
    height: 14px;
  }
`;

export const OptionGrid = styled.div<{ min: number }>`
  display: grid;
  grid-template-columns: repeat(
    auto-fill,
    minmax(${props => props.min}px, 1fr)
  );
  gap: 10px;
`;

const optionBase = css<{ selected: boolean }>`
  display: flex;
  align-items: center;
  gap: 12px;
  min-height: 64px;
  padding: 12px 14px;
  border: 1px solid ${colors.borderStrong};
  border-radius: ${radius.md};
  background: ${colors.sunken};
  color: ${colors.text};
  text-align: left;
  transition: border-color 0.15s, background-color 0.15s, box-shadow 0.15s;

  &:hover {
    border-color: ${colors.textSubtle};
  }

  ${props =>
    props.selected &&
    css`
      &,
      &:hover {
        border-color: ${colors.primary};
        background: ${colors.primarySoft};
        box-shadow: 0 0 0 1px ${colors.primary};
      }
    `}
`;

export const ServiceOption = styled.button<{ selected: boolean }>`
  ${optionBase}
  justify-content: space-between;

  div {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-width: 0;
  }

  strong {
    font-weight: 500;
    overflow-wrap: anywhere;
  }

  small {
    margin-top: 2px;
    font-size: 12px;
    color: ${colors.textMuted};
  }

  > span {
    font-weight: 600;
    white-space: nowrap;
    font-variant-numeric: tabular-nums;
    color: ${props => (props.selected ? colors.primary : colors.text)};
  }
`;

export const ProviderOption = styled.button<{ selected: boolean }>`
  ${optionBase}

  img {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    object-fit: cover;
    flex-shrink: 0;
  }

  strong {
    font-weight: 500;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
`;

const pulse = keyframes`
  50% { opacity: 0.5; }
`;

// Opção "fantasma" enquanto carrega, com a mesma altura da real
export const OptionSkeleton = styled.div`
  height: 64px;
  border-radius: ${radius.md};
  background: ${colors.surfaceHover};
  animation: ${pulse} 1.4s ease-in-out infinite;
`;

// Calendário à esquerda, horários à direita
export const DateTime = styled.div`
  display: grid;
  grid-template-columns: 260px minmax(0, 1fr);
  gap: 28px;

  @media (max-width: 720px) {
    grid-template-columns: minmax(0, 1fr);
  }
`;

export const TimesArea = styled.div`
  display: flex;
  flex-direction: column;
  min-width: 0;

  > span {
    margin-bottom: 10px;
    font-size: 13px;
    font-weight: 500;
    color: ${colors.textMuted};
  }
`;

// Altura fixa (a do calendário): a página não muda de tamanho ao carregar
export const TimesBox = styled.div`
  height: 248px;
  overflow-y: auto;
  padding-right: 4px;
`;

export const HourList = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(76px, 1fr));
  gap: 8px;
`;

export const Hour = styled.button<{ selected: boolean }>`
  height: 36px;
  border: 1px solid ${colors.borderStrong};
  border-radius: ${radius.md};
  background: ${colors.sunken};
  color: ${colors.text};
  font-size: 14px;
  font-weight: 500;
  font-variant-numeric: tabular-nums;
  transition: border-color 0.15s, background-color 0.15s;

  &:hover {
    border-color: ${colors.primary};
  }

  ${props =>
    props.selected &&
    css`
      &,
      &:hover {
        border-color: ${colors.primary};
        background: ${colors.primary};
        color: ${colors.onPrimary};
      }
    `}
`;

export const HelpText = styled.p`
  color: ${colors.textMuted};
  font-size: 13px;
  line-height: 20px;
`;

export const Summary = styled.div`
  position: sticky;
  top: 28px;
`;

export const SummaryList = styled.dl`
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  gap: 12px 16px;

  dt {
    color: ${colors.textMuted};
  }

  dd {
    text-align: right;
    font-weight: 500;
    color: ${colors.text};
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;

    &:first-letter {
      text-transform: uppercase;
    }

    &.empty {
      color: ${colors.textSubtle};
      font-weight: 400;
    }
  }
`;

export const Total = styled.div`
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid ${colors.border};

  span {
    color: ${colors.textMuted};
  }

  strong {
    font-size: 22px;
    font-weight: 700;
    font-variant-numeric: tabular-nums;
    color: ${colors.text};
  }
`;

export const SummaryFooter = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 0 20px 20px;

  > button {
    width: 100%;
    height: 42px;
  }

  small {
    text-align: center;
    font-size: 12px;
    color: ${colors.textSubtle};
  }
`;
