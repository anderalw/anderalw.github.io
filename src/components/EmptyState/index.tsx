import React from 'react';
import styled from 'styled-components';
import {
  FiAward,
  FiCalendar,
  FiInbox,
  FiScissors,
  FiSearch,
  FiSlash,
  FiUsers,
} from 'react-icons/fi';

import { colors } from '../../styles/theme';

// Lista vazia: ícone, explicação curta e, quando faz sentido, o próximo passo
const Wrapper = styled.div<{ compact?: boolean }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: ${props => (props.compact ? '28px 20px' : '48px 20px')};
  text-align: center;

  > svg {
    width: 28px;
    height: 28px;
    margin-bottom: 6px;
    color: ${colors.textSubtle};
  }

  strong {
    font-size: 15px;
    font-weight: 600;
    color: ${colors.text};
  }

  p {
    max-width: 420px;
    font-size: 13px;
    line-height: 1.5;
    color: ${colors.textMuted};
  }

  > div {
    margin-top: 10px;
  }
`;

// Ícones de cada tipo de lista
const ICONS = {
  calendar: FiCalendar,
  inbox: FiInbox,
  search: FiSearch,
  users: FiUsers,
  scissors: FiScissors,
  award: FiAward,
  slash: FiSlash,
};

interface EmptyStateProps {
  icon: keyof typeof ICONS;
  title: string;
  description?: string;
  action?: React.ReactNode;
  // Dentro de cartões pequenos
  compact?: boolean;
}

const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
  compact,
}) => {
  const Icon = ICONS[icon];

  return (
    <Wrapper compact={compact}>
      <Icon aria-hidden="true" />
      <strong>{title}</strong>
      {description && <p>{description}</p>}
      {action && <div>{action}</div>}
    </Wrapper>
  );
};

export default EmptyState;
