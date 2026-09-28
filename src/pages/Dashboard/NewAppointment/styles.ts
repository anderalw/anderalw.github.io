import styled, { css } from 'styled-components';

import { colors } from '../../../styles/theme';
import { Dialog } from '../AppointmentDetails/styles';

export const StepLabel = styled.p`
  margin: -4px 0 16px;
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
  gap: 8px;
  margin-bottom: 20px;
  padding: 12px 14px;
  border-radius: 10px;
  background: ${colors.sunken};

  li {
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 15px;
    color: ${colors.text};

    > svg {
      flex-shrink: 0;
      color: ${colors.textMuted};
    }

    img {
      width: 22px;
      height: 22px;
      border-radius: 50%;
    }

    small {
      color: ${colors.textMuted};
      font-size: 13px;
    }
  }

  button {
    margin-left: auto;
    border: 0;
    background: transparent;
    color: ${colors.primary};
    font: inherit;
    font-size: 14px;
  }
`;

export const SearchResults = styled.ul`
  list-style: none;
  margin-top: 8px;
  max-height: 240px;
  overflow-y: auto;
  border-radius: 8px;
  background: ${colors.sunken};
`;

export const ResultButton = styled.button`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  width: 100%;
  padding: 10px 12px;
  border: 0;
  background: transparent;
  color: ${colors.text};
  font: inherit;
  text-align: left;

  & + & {
    border-top: 1px solid ${colors.surface};
  }

  &:hover,
  &:focus-visible {
    background: ${colors.borderStrong};
    outline: none;
  }

  small {
    color: ${colors.textMuted};
    font-size: 13px;
  }
`;

export const NotFound = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 10px;
  margin-top: 12px;
  font-size: 14px;
  color: ${colors.textMuted};
`;

export const LinkButton = styled.button`
  border: 0;
  background: transparent;
  color: ${colors.primary};
  font: inherit;
  font-size: 14px;

  &:hover {
    text-decoration: underline;
  }
`;

export const ServiceList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

export const ServiceOption = styled.button<{ selected: boolean }>`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  width: 100%;
  padding: 8px 12px;
  border: 2px solid ${colors.sunken};
  border-radius: 10px;
  background: ${colors.sunken};
  color: ${colors.text};
  font: inherit;
  text-align: left;
  transition: border-color 0.2s;

  &:hover {
    border-color: ${colors.borderStrong};
  }

  small {
    display: block;
    margin-top: 1px;
    color: ${colors.textMuted};
    font-size: 13px;
  }

  > span:last-child {
    white-space: nowrap;
    font-weight: 500;
  }

  ${props =>
    props.selected &&
    css`
      &,
      &:hover {
        border-color: ${colors.primary};
      }
    `}
`;

// Altura fixa nos dois passos: o conteúdo rola por dentro e as mensagens têm
// espaço reservado, então o modal não muda de tamanho ao carregar nada
export const FixedDialog = styled(Dialog)`
  display: flex;
  flex-direction: column;
  height: min(640px, 100%);
  overflow: hidden;

  h2 {
    margin: 8px 0 4px;
  }
`;

export const Body = styled.div`
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  /* Espaço para a borda de foco dos campos não ser cortada */
  margin: 0 -6px;
  padding: 2px 6px;
`;

export const Footer = styled.div`
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid ${colors.borderStrong};
`;

// Dicas, "horário livre" e conflito com sugestões usam sempre este espaço
export const StatusArea = styled.div`
  height: 104px;
  overflow-y: auto;
  font-size: 14px;
  line-height: 20px;
  color: ${colors.textMuted};
`;

export const SlotStatus = styled.div<{ ok: boolean }>`
  padding: 8px 12px;
  border-radius: 8px;
  background: ${props => (props.ok ? '#51cf6618' : '#fcc41918')};
  color: ${props => (props.ok ? '#8ce99a' : '#ffe066')};

  p + div {
    margin-top: 8px;
  }
`;
