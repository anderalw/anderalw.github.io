import styled, { css, keyframes } from 'styled-components';

const fadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;

const popIn = keyframes`
  from { opacity: 0; transform: translateY(12px) scale(0.98); }
  to { opacity: 1; transform: translateY(0) scale(1); }
`;

export const Overlay = styled.div`
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  background: rgba(18, 17, 22, 0.7);
  animation: ${fadeIn} 0.15s ease-out;
`;

export const Dialog = styled.div<{ color: string }>`
  width: 100%;
  max-width: 440px;
  max-height: 100%;
  overflow: auto;
  background: #28262e;
  border-radius: 12px;
  border-top: 6px solid ${props => props.color};
  box-shadow: 0 16px 48px rgba(0, 0, 0, 0.45);
  padding: 20px 24px 24px;
  animation: ${popIn} 0.18s ease-out;

  header {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  h2 {
    margin: 16px 0 20px;
    font-size: 24px;
    font-weight: 500;
    color: #f4ede8;
    word-break: break-word;
  }

  footer {
    margin-top: 20px;
    padding-top: 16px;
    border-top: 1px solid #3e3b47;
    font-size: 13px;
    color: #999591;
  }
`;

export type AppointmentStatus = 'past' | 'ongoing' | 'upcoming';

const statusColors: Record<AppointmentStatus, string> = {
  past: '#666360',
  ongoing: '#51cf66',
  upcoming: '#ff9000',
};

export const StatusBadge = styled.span<{ status: AppointmentStatus }>`
  display: inline-flex;
  align-items: center;
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 500;

  ${props => css`
    color: ${statusColors[props.status]};
    background: ${`${statusColors[props.status]}22`};
  `}

  &::before {
    content: '';
    width: 8px;
    height: 8px;
    border-radius: 50%;
    margin-right: 6px;
    background: currentColor;
  }
`;

export const CloseButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border: 0;
  border-radius: 50%;
  background: transparent;
  color: #999591;
  transition: background-color 0.2s, color 0.2s;

  &:hover,
  &:focus-visible {
    background: #3e3b47;
    color: #f4ede8;
  }

  svg {
    width: 20px;
    height: 20px;
  }
`;

export const DetailList = styled.ul`
  list-style: none;

  li {
    display: flex;
    align-items: center;
    color: #f4ede8;
    min-height: 32px;

    & + li {
      margin-top: 10px;
    }

    > svg {
      flex-shrink: 0;
      width: 18px;
      height: 18px;
      margin-right: 14px;
      color: #999591;
    }
  }

  img {
    width: 28px;
    height: 28px;
    border-radius: 50%;
    margin-right: 8px;
  }

  a {
    color: #ff9000;
    text-decoration: none;
    word-break: break-all;

    &:hover {
      text-decoration: underline;
    }
  }

  small {
    margin-left: 6px;
    color: #999591;
  }
`;
