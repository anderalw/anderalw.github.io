import styled, { css } from 'styled-components';
import { Link } from 'react-router-dom';

import { colors, radius } from '../../styles/theme';

const MAX_WIDTH = '1120px';

const container = css`
  width: 100%;
  max-width: ${MAX_WIDTH};
  margin: 0 auto;
  padding: 0 24px;
`;

export const Page = styled.div`
  min-height: 100vh;
  background: ${colors.background};
  scroll-behavior: smooth;
`;

// Topo fixo: marca, menu das seções e os botões de entrar e agendar
export const Header = styled.header`
  position: sticky;
  top: 0;
  z-index: 5;
  border-bottom: 1px solid ${colors.border};
  background: color-mix(in srgb, ${colors.background} 88%, transparent);
  backdrop-filter: blur(10px);

  > div {
    ${container}
    display: flex;
    align-items: center;
    gap: 24px;
    height: 68px;
  }
`;

export const Brand = styled.a`
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
  color: ${colors.text};
  text-decoration: none;

  strong {
    font-size: 18px;
    font-weight: 700;
    letter-spacing: -0.02em;
  }
`;

export const Nav = styled.nav`
  display: flex;
  gap: 4px;
  margin-left: auto;

  a {
    padding: 8px 12px;
    border-radius: ${radius.md};
    color: ${colors.textMuted};
    font-size: 14px;
    font-weight: 500;
    text-decoration: none;

    &:hover {
      color: ${colors.text};
      background: ${colors.surfaceHover};
    }
  }

  @media (max-width: 860px) {
    display: none;
  }
`;

export const HeaderActions = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-left: auto;

  ${Nav} + & {
    margin-left: 0;
  }
`;

const buttonBase = css`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  height: 40px;
  padding: 0 18px;
  border-radius: ${radius.md};
  font-size: 14px;
  font-weight: 600;
  text-decoration: none;
  white-space: nowrap;
  transition: background-color 0.15s, border-color 0.15s, color 0.15s;

  svg {
    width: 17px;
    height: 17px;
  }
`;

export const PrimaryLink = styled(Link)<{ $large?: boolean }>`
  ${buttonBase}
  background: ${colors.primary};
  color: ${colors.onPrimary};

  &:hover {
    background: ${colors.primaryHover};
  }

  ${props =>
    props.$large &&
    css`
      height: 50px;
      padding: 0 26px;
      font-size: 16px;
    `}
`;

export const GhostLink = styled(Link)`
  ${buttonBase}
  color: ${colors.text};

  &:hover {
    background: ${colors.surfaceHover};
  }

  @media (max-width: 520px) {
    display: none;
  }
`;

// Capa: foto com o nome, a frase e os botões (sempre escura por cima da
// foto, nos dois modos, para o texto ser legível)
// Sem foto (ramos sem foto padrão, até o negócio enviar a dele): fundo
// escuro com um brilho da cor principal
export const Hero = styled.section<{ image: string }>`
  position: relative;
  display: flex;
  align-items: flex-end;
  min-height: min(620px, 82vh);
  padding: 96px 0 72px;
  background: ${props =>
    props.image
      ? `#16151a url(${props.image}) center / cover no-repeat`
      : '#16151a radial-gradient(circle at 78% 28%, rgba(var(--color-primary-rgb), 0.45), transparent 58%)'};
  color: #ffffff;

  &::before {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(
        90deg,
        rgba(14, 13, 17, 0.92) 0%,
        rgba(14, 13, 17, 0.6) 55%,
        rgba(14, 13, 17, 0.25) 100%
      ),
      linear-gradient(0deg, rgba(14, 13, 17, 0.7) 0%, transparent 45%);
  }

  > div {
    ${container}
    position: relative;
  }

  h1 {
    max-width: 680px;
    font-size: clamp(36px, 6vw, 64px);
    font-weight: 800;
    line-height: 1.05;
    letter-spacing: -0.03em;
  }

  p {
    max-width: 560px;
    margin-top: 18px;
    font-size: clamp(17px, 2vw, 20px);
    line-height: 1.5;
    color: rgba(255, 255, 255, 0.82);
  }
`;

export const HeroActions = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 32px;
`;

// WhatsApp sobre a foto: contorno branco
export const OutlineAnchor = styled.a`
  ${buttonBase}
  height: 50px;
  padding: 0 24px;
  border: 1px solid rgba(255, 255, 255, 0.45);
  color: #ffffff;
  font-size: 16px;

  &:hover {
    background: rgba(255, 255, 255, 0.1);
    border-color: #ffffff;
  }
`;

// "Aberto hoje até 20:00" / "Fechado hoje"
export const TodayBadge = styled.span<{ open: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 20px;
  padding: 6px 12px;
  border-radius: 999px;
  background: rgba(14, 13, 17, 0.55);
  font-size: 13px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.9);

  &::before {
    content: '';
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: ${props => (props.open ? '#4cc38a' : '#f2555a')};
  }
`;

export const Section = styled.section<{ alt?: boolean }>`
  padding: 88px 0;
  background: ${props => (props.alt ? colors.surface : 'transparent')};
  border-top: ${props => (props.alt ? `1px solid ${colors.border}` : '0')};
  border-bottom: ${props => (props.alt ? `1px solid ${colors.border}` : '0')};
  scroll-margin-top: 68px;

  > div {
    ${container}
  }
`;

export const SectionTitle = styled.header`
  max-width: 640px;
  margin-bottom: 40px;

  span {
    display: block;
    margin-bottom: 10px;
    font-size: 13px;
    font-weight: 700;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: ${colors.primary};
  }

  h2 {
    font-size: clamp(28px, 4vw, 38px);
    font-weight: 800;
    letter-spacing: -0.02em;
    color: ${colors.text};
  }

  p {
    margin-top: 12px;
    font-size: 16px;
    line-height: 1.6;
    color: ${colors.textMuted};
  }
`;

export const ServiceGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 16px;
`;

export const ServiceCard = styled(Link)`
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 22px;
  border: 1px solid ${colors.border};
  border-radius: ${radius.lg};
  background: ${colors.surface};
  color: ${colors.text};
  text-decoration: none;
  transition: border-color 0.15s, transform 0.15s;

  strong {
    font-size: 17px;
    font-weight: 600;
  }

  small {
    font-size: 13px;
    color: ${colors.textMuted};
  }

  /* Preço sempre no rodapé: os cards da mesma linha ficam alinhados mesmo
     com nomes de uma ou duas linhas */
  footer {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    margin-top: auto;
    padding-top: 14px;

    b {
      font-size: 22px;
      font-weight: 700;
      font-variant-numeric: tabular-nums;
    }

    span {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      font-size: 13px;
      font-weight: 600;
      color: ${colors.primary};
    }
  }

  &:hover {
    border-color: ${colors.primary};
    transform: translateY(-2px);
  }
`;

export const PlanGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
`;

// Plano do clube: nome, preço, o que inclui e o botão de assinar
export const PlanCard = styled.article`
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 24px;
  border: 1px solid ${colors.border};
  border-radius: ${radius.lg};
  background: ${colors.background};
  color: ${colors.text};

  > strong {
    font-size: 18px;
    font-weight: 600;
  }

  > b {
    font-size: 30px;
    font-weight: 700;
    font-variant-numeric: tabular-nums;

    small {
      margin-left: 2px;
      font-size: 14px;
      font-weight: 500;
      color: ${colors.textMuted};
    }
  }

  > p {
    font-size: 14px;
    line-height: 1.6;
    color: ${colors.textMuted};
  }

  ul {
    flex: 1;
    list-style: none;
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin: 6px 0;

    li {
      display: flex;
      align-items: flex-start;
      gap: 8px;
      font-size: 14px;
    }

    svg {
      flex-shrink: 0;
      margin-top: 2px;
      width: 16px;
      height: 16px;
      color: ${colors.primary};
    }
  }

  > small {
    font-size: 12px;
    color: ${colors.textSubtle};
  }

  > a {
    margin-top: 6px;
  }
`;

export const About = styled.p`
  max-width: 760px;
  font-size: 18px;
  line-height: 1.7;
  color: ${colors.textMuted};
  white-space: pre-line;
`;

export const TeamGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 16px;
`;

export const Member = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14px;
  padding: 28px 16px;
  border: 1px solid ${colors.border};
  border-radius: ${radius.lg};
  background: ${colors.background};
  text-align: center;

  img,
  .initials {
    width: 96px;
    height: 96px;
    border-radius: 50%;
    object-fit: cover;
  }

  .initials {
    display: flex;
    align-items: center;
    justify-content: center;
    background: ${colors.primarySoft};
    color: ${colors.primary};
    font-size: 30px;
    font-weight: 700;
  }

  strong {
    font-size: 16px;
    color: ${colors.text};
  }

  small {
    margin-top: -8px;
    font-size: 13px;
    color: ${colors.textMuted};
  }
`;

export const InfoGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 24px;

  @media (max-width: 820px) {
    grid-template-columns: minmax(0, 1fr);
  }
`;

export const InfoCard = styled.div`
  padding: 28px;
  border: 1px solid ${colors.border};
  border-radius: ${radius.lg};
  background: ${colors.surface};

  h3 {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 20px;
    font-size: 18px;
    color: ${colors.text};

    svg {
      width: 20px;
      height: 20px;
      color: ${colors.primary};
    }
  }
`;

export const Hours = styled.ul`
  list-style: none;

  li {
    display: flex;
    justify-content: space-between;
    padding: 10px 0;
    font-size: 15px;
    color: ${colors.textMuted};
    font-variant-numeric: tabular-nums;

    & + li {
      border-top: 1px solid ${colors.border};
    }
  }

  li.today {
    color: ${colors.text};
    font-weight: 600;
  }

  li.closed span:last-child {
    color: ${colors.textSubtle};
  }
`;

export const Contacts = styled.ul`
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 18px;

  li {
    display: flex;
    gap: 14px;
    font-size: 15px;
    line-height: 1.5;
    color: ${colors.text};

    > svg {
      flex-shrink: 0;
      width: 20px;
      height: 20px;
      margin-top: 1px;
      color: ${colors.textMuted};
    }

    small {
      display: block;
      font-size: 13px;
      color: ${colors.textMuted};
    }

    a {
      color: ${colors.primary};
      font-weight: 500;
      text-decoration: none;

      &:hover {
        text-decoration: underline;
      }
    }
  }
`;

// Chamada final antes do rodapé
export const Closing = styled.section`
  padding: 72px 0;
  background: ${colors.primary};
  color: ${colors.onPrimary};

  > div {
    ${container}
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 24px;
  }

  h2 {
    font-size: clamp(26px, 3.5vw, 34px);
    font-weight: 800;
    letter-spacing: -0.02em;
  }

  p {
    margin-top: 6px;
    opacity: 0.85;
  }

  a {
    ${buttonBase}
    height: 50px;
    padding: 0 26px;
    background: ${colors.onPrimary};
    color: ${colors.primary};
    font-size: 16px;

    &:hover {
      opacity: 0.9;
    }
  }
`;

export const Footer = styled.footer`
  border-top: 1px solid ${colors.border};

  > div {
    ${container}
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding-top: 28px;
    padding-bottom: 28px;
    font-size: 13px;
    color: ${colors.textSubtle};
  }

  a {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    color: ${colors.textMuted};
    text-decoration: none;

    &:hover {
      color: ${colors.text};
    }

    svg {
      width: 14px;
      height: 14px;
    }
  }
`;

export const Skeleton = styled.div<{ height: number }>`
  height: ${props => props.height}px;
  border-radius: ${radius.lg};
  background: ${colors.surfaceHover};
`;
