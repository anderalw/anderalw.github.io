import styled, { css } from 'styled-components';
import { shade } from 'polished';
import { Link } from 'react-router-dom';

export const Container = styled.div`
  min-height: 100vh;
  display: flex;
  justify-content: center;
  padding: 40px 16px;
`;

export const Content = styled.div`
  width: 100%;
  max-width: 720px;

  h1 {
    font-size: 28px;
    font-weight: 500;
    color: #f4ede8;
    margin-bottom: 24px;
  }
`;

export const BackLink = styled(Link)`
  display: inline-flex;
  align-items: center;
  margin-bottom: 16px;
  color: #999591;
  text-decoration: none;
  transition: color 0.2s;

  &:hover {
    color: #f4ede8;
  }

  svg {
    margin-right: 8px;
  }
`;

export const Card = styled.section`
  background: #28262e;
  border-radius: 10px;
  padding: 24px;

  & + & {
    margin-top: 24px;
  }

  h2 {
    font-size: 18px;
    font-weight: 500;
    color: #f4ede8;
  }

  > p {
    margin-top: 4px;
    color: #999591;
    font-size: 14px;
  }
`;

export const Row = styled.div`
  display: flex;
  align-items: flex-end;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 16px;
`;

export const Field = styled.label<{ grow?: boolean }>`
  display: flex;
  flex-direction: column;
  flex: ${props => (props.grow ? '1 1 220px' : '0 0 auto')};

  span {
    font-size: 13px;
    color: #999591;
    margin-bottom: 6px;
  }

  input,
  select {
    height: 44px;
    padding: 0 12px;
    border-radius: 8px;
    border: 2px solid #232129;
    background: #232129;
    color: #f4ede8;
    font: inherit;
    width: 100%;

    &:focus {
      outline: none;
      border-color: #ff9000;
    }
  }

  input[type='number'] {
    width: 110px;
  }
`;

export const PrimaryButton = styled.button`
  height: 44px;
  padding: 0 20px;
  border: 0;
  border-radius: 8px;
  background: #ff9000;
  color: #312e38;
  font-weight: 500;
  transition: background-color 0.2s;

  &:hover:not(:disabled) {
    background: ${shade(0.2, '#ff9000')};
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

export const SecondaryButton = styled.button`
  height: 44px;
  padding: 0 16px;
  border: 1px solid #666360;
  border-radius: 8px;
  background: transparent;
  color: #f4ede8;
  transition: background-color 0.2s;

  &:hover {
    background: #3e3b47;
  }
`;

export const ServiceList = styled.ul`
  list-style: none;
  margin-top: 16px;
`;

export const ServiceItem = styled.li<{ inactive: boolean }>`
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px 16px;
  padding: 14px 0;
  border-top: 1px solid #3e3b47;

  ${props =>
    props.inactive &&
    css`
      .info {
        opacity: 0.5;
      }
    `}

  .info {
    flex: 1 1 220px;
    min-width: 0;

    strong {
      display: block;
      color: #f4ede8;
    }

    small {
      color: #999591;
      font-size: 14px;
    }
  }

  .price {
    color: #ff9000;
    font-weight: 500;
    min-width: 90px;
    text-align: right;
  }

  .actions {
    display: flex;
    gap: 8px;
  }

  .actions button {
    height: 34px;
    padding: 0 12px;
    font-size: 14px;
  }
`;

export const StatusTag = styled.span<{ active: boolean }>`
  display: inline-block;
  margin-left: 8px;
  padding: 1px 8px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 500;
  vertical-align: middle;
  color: ${props => (props.active ? '#51cf66' : '#999591')};
  background: ${props => (props.active ? '#51cf6622' : '#99959122')};
`;

export const EmptyText = styled.p`
  margin-top: 16px;
  color: #999591;
`;
