import styled, { css } from 'styled-components';

import { colors, radius } from '../../../styles/theme';

export const StepLabel = styled.p`
  margin-top: 2px;
  font-size: 13px;
  color: ${colors.textMuted};

  strong {
    color: ${colors.primary};
    font-weight: 500;
  }
`;

// Resumo do que já está definido: barbeiro e horário (e o cliente no passo 2)
export const Summary = styled.ul`
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 12px;

  li {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    font-size: 14px;
    line-height: 20px;
    color: ${colors.text};

    > svg {
      flex-shrink: 0;
      margin-top: 2px;
      color: ${colors.textMuted};
    }

    img {
      width: 20px;
      height: 20px;
      border-radius: 50%;
    }

    small {
      display: block;
      color: ${colors.textMuted};
      font-size: 12px;
    }
  }

  button {
    margin-left: auto;
    border: 0;
    background: transparent;
    color: ${colors.primary};
    font: inherit;
    font-size: 13px;
  }
`;

// Dicas, "horário livre" e conflito com sugestões
export const StatusArea = styled.div`
  flex: 1;
  min-height: 0;
  padding-top: 16px;
  border-top: 1px solid ${colors.border};
  font-size: 13px;
  line-height: 20px;
  color: ${colors.textMuted};
`;

export const SlotStatus = styled.div<{ ok: boolean }>`
  padding: 10px 12px;
  border-radius: ${radius.md};
  background: ${props => (props.ok ? colors.successSoft : colors.warningSoft)};
  color: ${props => (props.ok ? colors.success : colors.warning)};

  p {
    color: inherit;
  }
`;

// Grupo de sugestões: rótulo em cima e os botões embaixo
export const SuggestionRow = styled.div`
  margin-top: 12px;

  > span {
    display: block;
    margin-bottom: 6px;
    font-size: 12px;
  }
`;

export const SuggestionButtons = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
`;

export const Suggestion = styled.button<{ selected: boolean }>`
  height: 30px;
  padding: 0 10px;
  border: 1px solid ${colors.borderStrong};
  border-radius: ${radius.sm};
  background: ${colors.surface};
  color: ${colors.text};
  font-size: 13px;
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

export const SectionLabel = styled.p`
  margin-bottom: 10px;
  font-size: 13px;
  font-weight: 500;
  color: ${colors.textMuted};
`;

// Resultados da busca de clientes em duas colunas
export const SearchResults = styled.ul`
  list-style: none;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
  margin-top: 12px;
`;

export const ResultButton = styled.button`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  width: 100%;
  height: 52px;
  justify-content: center;
  padding: 0 12px;
  border: 1px solid ${colors.borderStrong};
  border-radius: ${radius.md};
  background: ${colors.sunken};
  color: ${colors.text};
  font: inherit;
  font-size: 14px;
  font-weight: 500;
  text-align: left;
  transition: border-color 0.15s;

  &:hover,
  &:focus-visible {
    border-color: ${colors.primary};
    outline: none;
  }

  span,
  small {
    max-width: 100%;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  small {
    color: ${colors.textMuted};
    font-size: 12px;
    font-weight: 400;
  }
`;

export const NotFound = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 10px;
  margin-top: 16px;
  font-size: 14px;
  color: ${colors.textMuted};
`;

export const LinkButton = styled.button`
  border: 0;
  background: transparent;
  color: ${colors.primary};
  font: inherit;
  font-size: 13px;
  text-align: left;

  &:hover {
    text-decoration: underline;
  }
`;

// Formulário de cadastro rápido: nome inteiro, telefone e e-mail lado a lado
export const RegisterGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px 16px;

  > :first-child {
    grid-column: 1 / -1;
  }
`;

// Serviços em duas colunas
export const ServiceList = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
`;

export const ServiceOption = styled.button<{ selected: boolean }>`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  width: 100%;
  min-height: 56px;
  padding: 8px 12px;
  border: 1px solid ${colors.borderStrong};
  border-radius: ${radius.md};
  background: ${colors.sunken};
  color: ${colors.text};
  font: inherit;
  font-size: 14px;
  text-align: left;
  transition: border-color 0.15s, background-color 0.15s;

  &:hover {
    border-color: ${colors.textSubtle};
  }

  small {
    display: block;
    margin-top: 1px;
    color: ${colors.textMuted};
    font-size: 12px;
  }

  > span:first-child {
    min-width: 0;
    font-weight: 500;
  }

  > span:last-child {
    white-space: nowrap;
    font-weight: 600;
    font-variant-numeric: tabular-nums;
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

// Cliente fixo: frequência e quantidade lado a lado
export const RepeatGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
  margin-bottom: 20px;
`;

// Prévia dos horários da série, em quatro colunas
export const OccurrenceGrid = styled.ul`
  list-style: none;
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 6px;
`;

export const Occurrence = styled.li<{ status: 'free' | 'taken' | 'loading' }>`
  display: flex;
  align-items: center;
  gap: 6px;
  height: 32px;
  padding: 0 8px;
  border: 1px solid ${colors.borderStrong};
  border-radius: ${radius.sm};
  background: ${colors.sunken};
  font-size: 12px;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
  color: ${colors.text};

  svg {
    flex-shrink: 0;
    width: 14px;
    height: 14px;
  }

  ${props =>
    props.status === 'free' &&
    css`
      svg {
        color: ${colors.success};
      }
    `}

  ${props =>
    props.status === 'taken' &&
    css`
      border-color: color-mix(in srgb, ${colors.danger} 40%, transparent);
      background: ${colors.dangerSoft};
      color: ${colors.textMuted};
      text-decoration: line-through;

      svg {
        color: ${colors.danger};
      }
    `}

  ${props =>
    props.status === 'loading' &&
    css`
      color: ${colors.textSubtle};
    `}
`;

// Resumo da prévia (quantos livres), com a altura reservada
export const RepeatNote = styled.p`
  min-height: 40px;
  margin-top: 14px;
  font-size: 13px;
  line-height: 20px;
  color: ${colors.textMuted};

  strong {
    color: ${colors.text};
  }
`;
