import styled from 'styled-components';
import { Link } from 'react-router-dom';

export const Container = styled.div`
  display: flex;
  justify-content: center;
  padding: 40px 20px;
`;

export const Content = styled.div`
  max-width: 700px;
  width: 100%;

  h1 {
    margin-bottom: 24px;
    font-size: 36px;
  }
`;

export const TopBar = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;

  div {
    display: flex;
    gap: 16px;
    align-items: center;
  }

  button {
    background: transparent;
    border: 0;
    color: #999591;
    font: inherit;
  }
`;

export const NavLink = styled(Link)`
  color: #ff9000;
  text-decoration: none;

  &:hover {
    text-decoration: underline;
  }
`;

export const Item = styled.section`
  background: #3e3b47;
  border-radius: 10px;
  padding: 20px;

  & + & {
    margin-top: 16px;
  }

  header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 12px;
    flex-wrap: wrap;
  }

  h2 {
    font-size: 18px;
    font-weight: 500;
    color: #f4ede8;
  }

  time {
    display: block;
    margin-top: 4px;
    color: #ff9000;
    font-weight: 500;
  }

  .price {
    color: #f4ede8;
    font-weight: 500;
  }

  .provider {
    display: flex;
    align-items: center;
    margin-top: 12px;
    color: #f4ede8;

    img {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      margin-right: 10px;
    }
  }
`;

export const ItemActions = styled.div`
  display: flex;
  justify-content: flex-end;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 16px;

  button {
    height: 40px;
    padding: 0 16px;
    border-radius: 8px;
    font: inherit;
    font-weight: 500;
    background: transparent;
    transition: background-color 0.2s;

    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  }

  .secondary {
    border: 1px solid #666360;
    color: #f4ede8;

    &:hover:not(:disabled) {
      background: #28262e;
    }
  }

  .danger {
    border: 1px solid #c53030;
    color: #ff6b6b;

    &:hover:not(:disabled) {
      background: #c5303022;
    }
  }
`;

export const Panel = styled.div`
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #28262e;

  > p {
    color: #f4ede8;
    margin-bottom: 4px;
  }
`;

export const Hint = styled.p`
  margin-top: 12px;
  font-size: 14px;
  color: #999591;
`;

export const Empty = styled.div`
  padding: 32px;
  text-align: center;
  color: #999591;
  background: #28262e;
  border-radius: 10px;

  a {
    display: inline-block;
    margin-top: 12px;
  }
`;
