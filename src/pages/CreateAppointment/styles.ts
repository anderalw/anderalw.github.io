import styled, { css } from 'styled-components';
import { shade } from 'polished';

export const Container = styled.div`
  display: flex;
  justify-content: center;
  padding: 40px 20px;
`;

export const Content = styled.div`
  max-width: 700px;
  width: 100%;
  
  h1 {
    margin-bottom: 36px;
    font-size: 36px;
  }
  
  button {
    margin-top: 48px;
  }
`;

export const Section = styled.div`
  margin-bottom: 32px;

  strong {
    color: #999591;
    font-size: 20px;
    line-height: 26px;
    border-bottom: 1px solid #3e3b47;
    display: block;
    padding-bottom: 16px;
    margin-bottom: 16px;
  }

  input[type="date"] {
    background: #232129;
    border-radius: 10px;
    padding: 16px;
    width: 100%;
    border: 2px solid #232129;
    color: #f4ede8;
    color-scheme: dark;
    font-size: 16px;
  }
`;

interface ProviderProps {
  selected: boolean;
}

export const ProviderContainer = styled.div<ProviderProps>`
  background: ${props => (props.selected ? '#ff9000' : '#3e3b47')};
  display: flex;
  align-items: center;
  padding: 12px 16px;
  border-radius: 10px;
  cursor: pointer;
  transition: background-color 0.2s;

  &:hover {
    background: ${props => (props.selected ? '#ff9000' : shade(0.2, '#3e3b47'))};
  }

  img {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: #28262e;
  }
`;

export const ProviderName = styled.span<ProviderProps>`
  margin-left: 12px;
  font-weight: 500;
  color: ${props => (props.selected ? '#232129' : '#f4ede8')};
`;

export const HourList = styled.div`
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
`;

interface HourProps {
  available: boolean;
  selected: boolean;
}

export const Hour = styled.div<HourProps>`
  padding: 12px 24px;
  border-radius: 10px;
  font-weight: 500;
  font-size: 16px;
  cursor: pointer;
  transition: background-color 0.2s;

  ${props =>
    !props.available &&
    css`
      background: #3e3b47;
      color: #666360;
      cursor: not-allowed;
    `}

  ${props =>
    props.available && !props.selected &&
    css`
      background: #3e3b47;
      color: #f4ede8;
      &:hover {
        background: ${shade(0.2, '#3e3b47')};
      }
    `}

  ${props =>
    props.selected &&
    css`
      background: #ff9000;
      color: #232129;
    `}
`;
// Serviço: o cliente vê nome e valor (a duração só define a agenda)
export const ServiceOption = styled.button<ProviderProps>`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  min-width: 160px;
  padding: 14px 18px;
  border: 0;
  border-radius: 10px;
  text-align: left;
  font: inherit;
  cursor: pointer;
  transition: background-color 0.2s;
  background: ${props => (props.selected ? '#ff9000' : '#3e3b47')};
  color: ${props => (props.selected ? '#232129' : '#f4ede8')};

  &:hover {
    background: ${props =>
      props.selected ? '#ff9000' : shade(0.2, '#3e3b47')};
  }

  span {
    font-weight: 500;
  }

  small {
    margin-top: 4px;
    font-size: 14px;
    color: ${props => (props.selected ? '#312e38' : '#ff9000')};
  }

  /* Content aplica margin-top: 48px a todo <button> da página */
  && {
    margin-top: 0;
  }
`;

export const HelpText = styled.p`
  color: #999591;
`;
