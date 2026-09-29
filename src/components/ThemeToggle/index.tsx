import React from 'react';
import styled from 'styled-components';
import { FiMonitor, FiMoon, FiSun } from 'react-icons/fi';

import { ThemeChoice, useTheme } from '../../hooks/Theme';
import { colors, radius } from '../../styles/theme';

const Button = styled.button`
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
    background: ${colors.surfaceHover};
    color: ${colors.text};
  }

  svg {
    width: 16px;
    height: 16px;
  }
`;

// Ordem ao clicar: escuro → claro → automático → escuro
const NEXT: Record<ThemeChoice, ThemeChoice> = {
  dark: 'light',
  light: 'system',
  system: 'dark',
};

const LABELS: Record<ThemeChoice, string> = {
  dark: 'Modo escuro',
  light: 'Modo claro',
  system: 'Automático (segue o aparelho)',
};

const ICONS = {
  dark: FiMoon,
  light: FiSun,
  system: FiMonitor,
};

// Botão para trocar entre modo escuro, claro e automático
const ThemeToggle: React.FC<{ className?: string }> = ({ className }) => {
  const { choice, setChoice } = useTheme();
  const Icon = ICONS[choice];
  const next = NEXT[choice];

  return (
    <Button
      type="button"
      className={className}
      title={`${LABELS[choice]}. Clique para: ${LABELS[next].toLowerCase()}`}
      aria-label={`${LABELS[choice]}. Trocar para ${LABELS[
        next
      ].toLowerCase()}`}
      onClick={() => setChoice(next)}
    >
      <Icon />
    </Button>
  );
};

export default ThemeToggle;
