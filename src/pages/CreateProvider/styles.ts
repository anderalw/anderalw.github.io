import styled, { keyframes } from 'styled-components';

import { colors } from '../../styles/theme';

// Formulário à esquerda; equipe numa coluna à direita
export const Columns = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) 320px;
  gap: 24px;
  align-items: start;
  max-width: 1080px;

  @media (max-width: 1180px) {
    grid-template-columns: minmax(0, 1fr);
  }
`;

export const SectionTitle = styled.h3`
  margin: 8px 0 12px;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: ${colors.textSubtle};

  & ~ & {
    margin-top: 20px;
  }
`;

export const ScheduleTable = styled.table`
  width: 100%;
  border-collapse: collapse;

  td {
    padding: 6px 0;
    border-top: 1px solid ${colors.border};
  }

  tr:first-child td {
    border-top: 0;
  }

  td:first-child {
    width: 40%;
  }

  input[type='time'] {
    width: 120px;
  }

  td.until {
    width: 48px;
    text-align: center;
    color: ${colors.textSubtle};
    font-size: 13px;
  }

  td.status {
    width: 80px;
    text-align: right;
  }
`;

export const DayToggle = styled.label`
  display: inline-flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  color: ${colors.text};
  font-weight: 500;

  input {
    width: 16px;
    height: 16px;
    accent-color: ${colors.primary};
    cursor: pointer;
  }
`;

export const TeamList = styled.ul`
  list-style: none;
  padding: 8px;

  li {
    display: flex;
    align-items: center;
    gap: 12px;
    height: 52px;
    padding: 0 12px;
    border-radius: 8px;
  }

  img {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    object-fit: cover;
    flex-shrink: 0;
  }

  div {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
  }

  strong {
    font-weight: 500;
    color: ${colors.text};
  }

  small,
  strong {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  small {
    font-size: 12px;
    color: ${colors.textMuted};
  }
`;

const pulse = keyframes`
  50% { opacity: 0.5; }
`;

// Linha "fantasma" com a mesma altura da real, enquanto a equipe carrega
export const TeamSkeleton = styled.li`
  &::before,
  &::after {
    content: '';
    display: block;
    border-radius: 999px;
    background: ${colors.surfaceHover};
    animation: ${pulse} 1.4s ease-in-out infinite;
  }

  &::before {
    width: 32px;
    height: 32px;
  }

  &::after {
    width: 140px;
    height: 12px;
  }
`;
