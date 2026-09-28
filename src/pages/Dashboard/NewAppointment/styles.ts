import styled, { css } from 'styled-components';

export const StepLabel = styled.p`
  margin: -4px 0 16px;
  font-size: 13px;
  color: #999591;

  strong {
    color: #ff9000;
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
  background: #232129;

  li {
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 15px;
    color: #f4ede8;

    > svg {
      flex-shrink: 0;
      color: #999591;
    }

    img {
      width: 22px;
      height: 22px;
      border-radius: 50%;
    }

    small {
      color: #999591;
      font-size: 13px;
    }
  }

  button {
    margin-left: auto;
    border: 0;
    background: transparent;
    color: #ff9000;
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
  background: #232129;
`;

export const ResultButton = styled.button`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  width: 100%;
  padding: 10px 12px;
  border: 0;
  background: transparent;
  color: #f4ede8;
  font: inherit;
  text-align: left;

  & + & {
    border-top: 1px solid #312e38;
  }

  &:hover,
  &:focus-visible {
    background: #3e3b47;
    outline: none;
  }

  small {
    color: #999591;
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
  color: #999591;
`;

export const LinkButton = styled.button`
  border: 0;
  background: transparent;
  color: #ff9000;
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
  border: 2px solid #232129;
  border-radius: 10px;
  background: #232129;
  color: #f4ede8;
  font: inherit;
  text-align: left;
  transition: border-color 0.2s;

  &:hover {
    border-color: #3e3b47;
  }

  small {
    display: block;
    margin-top: 1px;
    color: #999591;
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
        border-color: #ff9000;
      }
    `}
`;

export const SlotStatus = styled.div<{ ok: boolean }>`
  margin-top: 4px;
  padding: 10px 12px;
  border-radius: 8px;
  font-size: 14px;
  line-height: 20px;
  background: ${props => (props.ok ? '#51cf6618' : '#fcc41918')};
  color: ${props => (props.ok ? '#8ce99a' : '#ffe066')};

  p + div {
    margin-top: 10px;
  }
`;
