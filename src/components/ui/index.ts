import styled, { css } from 'styled-components';
import { NavLink } from 'react-router-dom';

import { colors, radius } from '../../styles/theme';

// Peças visuais das telas do painel do barbeiro (dentro do AppLayout)

// Duas larguras, sempre centralizadas: a padrão (tabelas, painéis) e a
// estreita (formulários e listas de leitura)
export const Page = styled.div<{ narrow?: boolean }>`
  width: 100%;
  max-width: ${props => (props.narrow ? '1064px' : '1344px')};
  margin: 0 auto;
  padding: 28px 32px 40px;
`;

export const PageHeader = styled.header`
  display: flex;
  align-items: flex-end;
  gap: 16px;
  margin-bottom: 24px;

  h1 {
    font-size: 22px;
    font-weight: 600;
    letter-spacing: -0.01em;
    color: ${colors.text};
  }

  p {
    margin-top: 4px;
    color: ${colors.textMuted};
  }

  /* Botões do cabeçalho ficam à direita */
  > :last-child:not(:first-child) {
    margin-left: auto;
    display: flex;
    gap: 8px;
  }
`;

// accent: o cartão pede atenção (faixa colorida à esquerda)
export const Card = styled.section<{ accent?: 'warning' | 'primary' }>`
  background: ${colors.surface};
  border: 1px solid ${colors.border};
  border-radius: ${radius.lg};

  ${props =>
    props.accent &&
    css`
      border-color: color-mix(
        in srgb,
        ${props.accent === 'warning' ? colors.warning : colors.primary} 45%,
        ${colors.border}
      );
      box-shadow: inset 3px 0 0
        ${props.accent === 'warning' ? colors.warning : colors.primary};
    `}
`;

export const CardHeader = styled.header`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 20px;
  border-bottom: 1px solid ${colors.border};

  h2 {
    font-size: 15px;
    font-weight: 600;
    color: ${colors.text};
  }

  p {
    margin-top: 2px;
    font-size: 13px;
    color: ${colors.textMuted};
  }
`;

export const CardBody = styled.div`
  padding: 20px;
`;

export const CardFooter = styled.footer`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
  padding: 14px 20px;
  border-top: 1px solid ${colors.border};
`;

export const FieldGrid = styled.div<{ columns?: number }>`
  display: grid;
  grid-template-columns: repeat(${props => props.columns || 2}, minmax(0, 1fr));
  gap: 4px 16px;
`;

export const Label = styled.label`
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 13px;
  font-weight: 500;
  color: ${colors.textMuted};
`;

export const inputStyles = css`
  height: 38px;
  width: 100%;
  padding: 0 12px;
  border: 1px solid ${colors.borderStrong};
  border-radius: ${radius.md};
  background: ${colors.sunken};
  color: ${colors.text};
  font-size: 14px;
  font-weight: 400;
  transition: border-color 0.15s, box-shadow 0.15s;

  &::placeholder {
    color: ${colors.textSubtle};
  }

  &:hover:not(:disabled) {
    border-color: ${colors.textSubtle};
  }

  &:focus {
    outline: none;
    border-color: ${colors.primary};
    box-shadow: 0 0 0 3px ${colors.primarySoft};
  }

  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
`;

export const TextInput = styled.input`
  ${inputStyles}
`;

export const Select = styled.select`
  ${inputStyles}
  padding-right: 8px;
  cursor: pointer;
`;

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';

interface ButtonProps {
  variant?: ButtonVariant;
  size?: 'sm' | 'md';
}

const buttonVariants = {
  primary: css`
    background: ${colors.primary};
    color: ${colors.onPrimary};

    &:hover:not(:disabled) {
      background: ${colors.primaryHover};
    }
  `,
  secondary: css`
    background: ${colors.surfaceHover};
    border-color: ${colors.borderStrong};
    color: ${colors.text};

    &:hover:not(:disabled) {
      background: ${colors.borderStrong};
    }
  `,
  ghost: css`
    background: transparent;
    color: ${colors.textMuted};

    &:hover:not(:disabled) {
      background: ${colors.surfaceHover};
      color: ${colors.text};
    }
  `,
  danger: css`
    background: transparent;
    border-color: ${colors.borderStrong};
    color: ${colors.danger};

    &:hover:not(:disabled) {
      background: ${colors.dangerSoft};
      border-color: ${colors.danger};
    }
  `,
};

export const UIButton = styled.button<ButtonProps>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  flex-shrink: 0;
  height: ${props => (props.size === 'sm' ? '30px' : '38px')};
  padding: 0 ${props => (props.size === 'sm' ? '10px' : '16px')};
  border: 1px solid transparent;
  border-radius: ${radius.md};
  font-size: ${props => (props.size === 'sm' ? '13px' : '14px')};
  font-weight: 500;
  white-space: nowrap;
  /* Também usado como link (as="a") */
  text-decoration: none;
  transition: background-color 0.15s, border-color 0.15s, color 0.15s;

  ${props => buttonVariants[props.variant || 'primary']}

  &:disabled {
    opacity: 0.5;
  }

  svg {
    width: 16px;
    height: 16px;
    flex-shrink: 0;
  }
`;

export const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;

  th {
    padding: 10px 20px;
    text-align: left;
    font-size: 12px;
    font-weight: 500;
    color: ${colors.textSubtle};
    text-transform: uppercase;
    letter-spacing: 0.04em;
    border-bottom: 1px solid ${colors.border};
    white-space: nowrap;
  }

  td {
    height: 52px;
    padding: 0 20px;
    color: ${colors.text};
    border-bottom: 1px solid ${colors.border};
  }

  tbody tr:last-child td {
    border-bottom: 0;
  }

  tbody tr {
    transition: background-color 0.1s;
  }

  tbody tr:hover {
    background: ${colors.surfaceHover};
  }

  .num {
    text-align: right;
    font-variant-numeric: tabular-nums;
  }
`;

export const Badge = styled.span<{ tone?: 'success' | 'neutral' | 'primary' }>`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 2px 8px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 500;
  white-space: nowrap;

  ${props => {
    switch (props.tone) {
      case 'success':
        return css`
          color: ${colors.success};
          background: ${colors.successSoft};
        `;
      case 'primary':
        return css`
          color: ${colors.primary};
          background: ${colors.primarySoft};
        `;
      default:
        return css`
          color: ${colors.textMuted};
          background: ${colors.surfaceHover};
        `;
    }
  }}

  &::before {
    content: '';
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: currentColor;
  }
`;

export const Muted = styled.span`
  color: ${colors.textMuted};
`;

// Abas de uma área (cada uma com endereço próprio), logo abaixo do título
export const PageTabs = styled.nav`
  display: flex;
  gap: 4px;
  margin-bottom: 24px;
  border-bottom: 1px solid ${colors.border};
  overflow-x: auto;
`;

export const PageTab = styled(NavLink)`
  flex-shrink: 0;
  margin-bottom: -1px;
  padding: 10px 14px;
  border-bottom: 2px solid transparent;
  color: ${colors.textMuted};
  font-size: 14px;
  font-weight: 500;
  text-decoration: none;
  transition: color 0.15s, border-color 0.15s;

  &:hover {
    color: ${colors.text};
  }

  &.active {
    border-bottom-color: ${colors.primary};
    color: ${colors.text};
  }
`;

// Ação de linha de tabela: só o ícone (o nome vai no title e no aria-label)
export const IconAction = styled.button<{ tone?: 'danger' }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: 0;
  border-radius: ${radius.md};
  background: transparent;
  color: ${colors.textMuted};
  transition: background-color 0.15s, color 0.15s;

  svg {
    width: 16px;
    height: 16px;
  }

  &:hover:not(:disabled) {
    background: ${colors.surfaceHover};
    color: ${props => (props.tone === 'danger' ? colors.danger : colors.text)};
  }

  &:disabled {
    opacity: 0.35;
    cursor: default;
  }

  & + & {
    margin-left: 2px;
  }
`;

// Grupo de ações no fim da linha
export const RowActionGroup = styled.div`
  display: flex;
  justify-content: flex-end;
  white-space: nowrap;
`;
