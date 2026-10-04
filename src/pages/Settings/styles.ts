import styled, { css } from 'styled-components';
import { NavLink } from 'react-router-dom';

import { colors, radius } from '../../styles/theme';

export const Layout = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) 360px;
  gap: 24px;
  align-items: start;

  @media (max-width: 1180px) {
    grid-template-columns: minmax(0, 1fr);
  }
`;

export const Field = styled.div`
  & + & {
    margin-top: 24px;
  }

  > label,
  > span {
    display: block;
    margin-bottom: 8px;
    font-size: 13px;
    font-weight: 500;
    color: ${colors.textMuted};
  }

  > small {
    display: block;
    margin-top: 6px;
    font-size: 12px;
    color: ${colors.textSubtle};
  }
`;

export const NameInput = styled.div`
  max-width: 360px;
`;

export const Swatches = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
`;

export const Swatch = styled.button<{ color: string; selected: boolean }>`
  width: 32px;
  height: 32px;
  border: 2px solid transparent;
  border-radius: 50%;
  background: ${props => props.color};
  box-shadow: 0 0 0 1px ${colors.borderStrong};
  transition: transform 0.1s;

  &:hover {
    transform: scale(1.08);
  }

  ${props =>
    props.selected &&
    css`
      border-color: ${colors.background};
      box-shadow: 0 0 0 2px ${colors.text};
    `}
`;

// Cor livre: o seletor nativo e o código hexadecimal
export const CustomColor = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-left: 8px;
  padding-left: 16px;
  border-left: 1px solid ${colors.border};

  input[type='color'] {
    width: 36px;
    height: 36px;
    padding: 0;
    border: 1px solid ${colors.borderStrong};
    border-radius: ${radius.md};
    background: transparent;
    cursor: pointer;
  }

  input[type='text'] {
    width: 110px;
    font-family: ui-monospace, 'Cascadia Mono', monospace;
    text-transform: lowercase;
  }
`;

export const LogoRow = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
`;

export const LogoBox = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 88px;
  height: 88px;
  flex-shrink: 0;
  border: 1px dashed ${colors.borderStrong};
  border-radius: ${radius.lg};
  background: ${colors.sunken};
  overflow: hidden;

  img {
    max-width: 76px;
    max-height: 76px;
    object-fit: contain;
  }
`;

export const LogoActions = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 8px;

  small {
    font-size: 12px;
    color: ${colors.textSubtle};
  }

  div {
    display: flex;
    gap: 8px;
  }
`;

export const SaveError = styled.small`
  display: block;
  min-height: 18px;
  margin-top: 16px;
  font-size: 12px;
  color: ${colors.danger};
`;

// Prévia: a mesma aparência do sistema, com a cor ainda não salva
export const Preview = styled.div`
  padding: 20px;

  > p {
    margin-bottom: 12px;
    font-size: 12px;
    color: ${colors.textSubtle};
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }
`;

export const PreviewSidebar = styled.div`
  padding: 14px;
  border: 1px solid ${colors.border};
  border-radius: ${radius.lg};
  background: ${colors.surface};

  header {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 14px;

    strong {
      font-size: 17px;
      font-weight: 700;
      letter-spacing: -0.02em;
      color: ${colors.text};
    }
  }

  nav {
    display: flex;
    flex-direction: column;
    gap: 4px;

    span {
      display: flex;
      align-items: center;
      gap: 10px;
      height: 36px;
      padding: 0 10px;
      border-radius: ${radius.md};
      font-size: 14px;
      color: ${colors.textMuted};

      svg {
        width: 16px;
        height: 16px;
      }
    }

    span.active {
      background: ${colors.primarySoft};
      color: ${colors.primary};
    }
  }
`;

export const PreviewIcon = styled.span`
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
`;

export const PreviewButtons = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 16px;
`;

export const Links = styled.ul`
  list-style: none;

  li + li {
    border-top: 1px solid ${colors.border};
  }

  a {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 14px 20px;
    color: ${colors.text};
    text-decoration: none;

    svg {
      flex-shrink: 0;
      width: 18px;
      height: 18px;
      color: ${colors.textMuted};
    }

    small {
      display: block;
      margin-top: 2px;
      font-size: 12px;
      color: ${colors.textMuted};
    }

    &:hover {
      background: ${colors.surfaceHover};
    }
  }
`;

// Rótulo do campo (acima do controle)
export const FieldLabel = styled.label``;

// Abas das configurações: as mesmas das outras áreas
export {
  PageTabs as SectionTabs,
  PageTab as SectionTab,
} from '../../components/ui';

// Abas de uma coluna só: os cartões um embaixo do outro
export const SectionColumn = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
`;

// Subabas (dentro de uma aba): botões menores, como um seletor
export const SubTabs = styled.nav`
  display: inline-flex;
  gap: 4px;
  margin-bottom: 20px;
  padding: 4px;
  border: 1px solid ${colors.border};
  border-radius: ${radius.md};
  background: ${colors.surface};
`;

export const SubTab = styled(NavLink)`
  display: inline-flex;
  align-items: center;
  height: 32px;
  padding: 0 14px;
  border-radius: 6px;
  color: ${colors.textMuted};
  font-size: 14px;
  font-weight: 500;
  text-decoration: none;

  &:hover {
    color: ${colors.text};
  }

  &.active {
    background: ${colors.surfaceHover};
    color: ${colors.text};
  }
`;
