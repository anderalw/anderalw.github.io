import styled, { keyframes } from 'styled-components';
import { Link } from 'react-router-dom';

import { colors, radius } from '../../styles/theme';

export const Container = styled.div`
  display: flex;
  min-height: 100vh;
  background: ${colors.background};
  color: ${colors.text};
  font-size: 14px;
`;

interface WideProps {
  wide: boolean;
}

export const Panel = styled.div<WideProps>`
  display: flex;
  flex-direction: column;
  width: ${props => (props.wide ? '640px' : '520px')};
  max-width: 100%;
  flex-shrink: 0;
  padding: 32px 48px;
  background: ${colors.surface};
  border-right: 1px solid ${colors.border};

  > small {
    color: ${colors.textSubtle};
    font-size: 12px;
  }

  @media (max-width: 900px) {
    width: 100%;
    border-right: 0;
    padding: 24px;
  }
`;

export const Brand = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: 10px;
  align-self: flex-start;
  text-decoration: none;

  span {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    border-radius: ${radius.md};
    background: ${colors.primary};
    color: ${colors.onPrimary};

    svg {
      width: 18px;
      height: 18px;
    }
  }

  strong {
    font-size: 18px;
    font-weight: 700;
    letter-spacing: -0.02em;
    color: ${colors.text};
  }
`;

const appear = keyframes`
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: none;
  }
`;

// Conteúdo centralizado na altura do painel
export const Body = styled.main<WideProps>`
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  width: 100%;
  max-width: ${props => (props.wide ? '460px' : '360px')};
  margin: 40px auto;
  animation: ${appear} 0.3s ease-out;

  form {
    display: flex;
    flex-direction: column;
  }

  form > button[type='submit'] {
    width: 100%;
    height: 42px;
    margin-top: 8px;
  }
`;

export const Heading = styled.div<WideProps>`
  margin-bottom: 28px;

  h1 {
    font-size: ${props => (props.wide ? '36px' : '26px')};
    line-height: 1.2;
    font-weight: 700;
    letter-spacing: -0.02em;
  }

  p {
    margin-top: 8px;
    color: ${colors.textMuted};
    font-size: ${props => (props.wide ? '16px' : '14px')};
    line-height: 1.5;
  }
`;

export const Footer = styled.div`
  margin-top: 24px;
  padding-top: 20px;
  border-top: 1px solid ${colors.border};
  color: ${colors.textMuted};
  text-align: center;

  a {
    color: ${colors.primary};
    font-weight: 500;
    text-decoration: none;

    &:hover {
      text-decoration: underline;
    }
  }

  p + p {
    margin-top: 8px;
  }
`;

// Link discreto dentro do formulário (ex: "Esqueci minha senha")
export const InlineLink = styled(Link)`
  align-self: flex-end;
  margin: -4px 0 8px;
  font-size: 13px;
  color: ${colors.textMuted};
  text-decoration: none;

  &:hover {
    color: ${colors.text};
  }
`;

export const Photo = styled.div<{ image: string }>`
  position: relative;
  flex: 1;
  display: flex;
  align-items: flex-end;
  padding: 48px;
  background: ${props =>
    props.image
      ? `url(${props.image}) no-repeat center / cover`
      : '#16151a radial-gradient(circle at 70% 30%, rgba(var(--color-primary-rgb), 0.45), transparent 60%)'};

  /* Escurece a foto embaixo para a frase ficar legível */
  &::before {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(
      to top,
      rgba(22, 21, 25, 0.9) 0%,
      rgba(22, 21, 25, 0.2) 45%,
      rgba(22, 21, 25, 0) 100%
    );
  }

  blockquote {
    position: relative;
    max-width: 440px;
    font-size: 24px;
    font-weight: 600;
    line-height: 1.3;
    letter-spacing: -0.01em;
    color: #fff;
  }

  cite {
    display: block;
    margin-top: 8px;
    font-size: 14px;
    font-style: normal;
    font-weight: 400;
    color: rgba(255, 255, 255, 0.7);
  }

  @media (max-width: 900px) {
    display: none;
  }
`;

// Marca à esquerda e o botão de modo claro/escuro à direita
export const TopBar = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
`;
