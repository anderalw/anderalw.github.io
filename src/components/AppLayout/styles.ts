import styled, { css } from 'styled-components';
import { Link, NavLink } from 'react-router-dom';

import {
  colors,
  radius,
  SIDEBAR_WIDTH,
  SIDEBAR_COLLAPSE,
} from '../../styles/theme';

const RAIL_WIDTH = 64;

export const Shell = styled.div`
  display: flex;
  min-height: 100vh;
  background: ${colors.background};
  color: ${colors.text};
  font-size: 14px;
`;

// Fixo na lateral; o conteúdo rola sozinho
export const Sidebar = styled.aside`
  position: sticky;
  top: 0;
  height: 100vh;
  width: ${SIDEBAR_WIDTH}px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  background: ${colors.surface};
  border-right: 1px solid ${colors.border};

  @media ${SIDEBAR_COLLAPSE} {
    width: ${RAIL_WIDTH}px;
  }
`;

export const Brand = styled(Link)`
  display: flex;
  align-items: center;
  gap: 10px;
  height: 64px;
  padding: 0 22px;
  flex-shrink: 0;
  text-decoration: none;

  span {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 30px;
    height: 30px;
    border-radius: ${radius.md};
    background: ${colors.primary};
    color: ${colors.onPrimary};

    svg {
      width: 16px;
      height: 16px;
    }
  }

  strong {
    font-size: 17px;
    font-weight: 700;
    letter-spacing: -0.02em;
    color: ${colors.text};
  }

  @media ${SIDEBAR_COLLAPSE} {
    justify-content: center;
    padding: 0;

    strong {
      display: none;
    }
  }
`;

export const Nav = styled.nav`
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 8px 12px;

  a {
    position: relative;
    display: flex;
    align-items: center;
    gap: 12px;
    height: 36px;
    padding: 0 10px;
    border-radius: ${radius.md};
    color: ${colors.textMuted};
    font-weight: 500;
    text-decoration: none;
    transition: background-color 0.15s, color 0.15s;

    svg {
      width: 18px;
      height: 18px;
      flex-shrink: 0;
    }

    &:hover {
      background: ${colors.surfaceHover};
      color: ${colors.text};
    }

    &.active {
      background: ${colors.primarySoft};
      color: ${colors.primary};
    }
  }

  @media ${SIDEBAR_COLLAPSE} {
    padding: 8px;

    a {
      justify-content: center;
      padding: 0;

      span {
        display: none;
      }
    }
  }
`;

// Contador de não lidas à direita do link; no menu recolhido, sobre o ícone
export const NavBadge = styled.span`
  margin-left: auto;
  min-width: 20px;
  height: 20px;
  padding: 0 6px;
  border-radius: 999px;
  background: ${colors.primary};
  color: ${colors.onPrimary};
  font-size: 11px;
  font-weight: 700;
  line-height: 20px;
  text-align: center;

  @media ${SIDEBAR_COLLAPSE} {
    && {
      display: block;
    }

    position: absolute;
    top: 2px;
    right: 6px;
    min-width: 16px;
    height: 16px;
    padding: 0 4px;
    font-size: 10px;
    line-height: 16px;
  }
`;

export const NavSection = styled.span`
  margin: 16px 10px 6px;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: ${colors.textSubtle};

  @media ${SIDEBAR_COLLAPSE} {
    height: 1px;
    margin: 10px 4px;
    overflow: hidden;
    color: transparent;
    background: ${colors.border};
  }
`;

// Área livre do meio do menu (ex: calendário da agenda)
export const Extra = styled.div`
  margin-top: 16px;
  padding: 16px 12px 0;
  border-top: 1px solid ${colors.border};
  overflow-y: auto;

  @media ${SIDEBAR_COLLAPSE} {
    display: none;
  }
`;

export const UserArea = styled.div`
  margin-top: auto;
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 12px;
  border-top: 1px solid ${colors.border};

  @media ${SIDEBAR_COLLAPSE} {
    flex-direction: column;
    padding: 12px 8px;
  }
`;

const userInfoBase = css`
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 6px 8px;
  border-radius: ${radius.md};
  text-decoration: none;
  transition: background-color 0.15s;

  img {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    object-fit: cover;
    flex-shrink: 0;
  }

  div {
    min-width: 0;
    display: flex;
    flex-direction: column;
  }

  strong {
    color: ${colors.text};
    font-weight: 500;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  small {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 12px;
    color: ${colors.textSubtle};

    svg {
      width: 12px;
      height: 12px;
    }
  }

  @media ${SIDEBAR_COLLAPSE} {
    flex: none;
    padding: 4px;

    div {
      display: none;
    }
  }
`;

export const UserInfo = styled(NavLink)`
  ${userInfoBase}

  &:hover {
    background: ${colors.surfaceHover};
  }

  &.active {
    background: ${colors.primarySoft};

    small {
      color: ${colors.primary};
    }
  }
`;

// Cliente não tem tela de perfil: só mostra quem está logado
export const ClientInfo = styled.div`
  ${userInfoBase}

  small {
    display: block;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
`;

export const SignOutButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  flex-shrink: 0;
  border: 0;
  border-radius: ${radius.md};
  background: transparent;
  color: ${colors.textSubtle};
  transition: background-color 0.15s, color 0.15s;

  &:hover {
    background: ${colors.dangerSoft};
    color: ${colors.danger};
  }

  svg {
    width: 16px;
    height: 16px;
  }
`;

export const Main = styled.main`
  flex: 1;
  min-width: 0;
`;
