import styled, { css } from 'styled-components';
import { shade } from 'polished';
import { Link } from 'react-router-dom';

// Altura de 1 hora na grade da agenda (px)
export const HOUR_HEIGHT = 64;
// Largura da coluna com as horas (px)
const TIME_COLUMN_WIDTH = 64;

export const Container = styled.div`
  min-height: 100vh;
  display: flex;
  flex-direction: column;
`;

export const Header = styled.header`
  padding: 24px 24px;
  background: #28262e;
`;

export const HeaderContent = styled.div`
  max-width: 1440px;
  margin: 0 auto;
  display: flex;
  align-items: center;

  > img {
    height: 64px;
  }

  button {
    margin-left: auto;
    background: transparent;
    border: 0;

    svg {
      color: #999591;
      width: 20px;
      height: 20px;
    }
  }

  /* Com o botão de admin, é ele que empurra os dois para a direita */
  > a + button {
    margin-left: 24px;
  }
`;

export const AdminLink = styled(Link)`
  margin-left: auto;
  display: flex;
  align-items: center;
  padding: 10px 16px;
  border-radius: 10px;
  background: #ff9000;
  color: #312e38;
  font-weight: 500;
  text-decoration: none;
  transition: background-color 0.2s;

  &:hover {
    background: ${shade(0.2, '#ff9000')};
  }

  svg {
    margin-right: 8px;
  }
`;

export const Profile = styled.div`
  display: flex;
  align-items: center;
  margin-left: 80px;

  img {
    width: 56px;
    height: 56px;
    border-radius: 50%;
  }

  div {
    display: flex;
    margin-left: 16px;
    flex-direction: column;
    line-height: 24px;

    span {
      color: #f4ede8;
    }
    a {
      text-decoration: none;
      color: #ff9000;

      &:hover {
        opacity: 0.8;
      }
    }
  }
`;

export const Content = styled.main`
  flex: 1;
  width: 100%;
  max-width: 1440px;
  margin: 0 auto;
  padding: 24px;
  display: flex;
  align-items: flex-start;
  min-height: 0;
`;

export const Sidebar = styled.aside`
  width: 300px;
  flex-shrink: 0;
  margin-right: 24px;

  /* Em telas estreitas, a agenda fica com a largura toda */
  @media (max-width: 1100px) {
    display: none;
  }

  .DayPicker {
    background: #28262e;
    border-radius: 10px;
    width: 100%;
  }

  .DayPicker-wrapper {
    padding-bottom: 0;
    outline: none;
  }

  .DayPicker-Month {
    width: 100%;
    border-collapse: separate;
    border-spacing: 4px;
    margin: 12px;
  }

  .DayPicker-Caption {
    color: #f4ede8;
  }

  .DayPicker-Day {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    color: #f4ede8;
    outline: none;
  }

  .DayPicker:not(.DayPicker--interactionDisabled)
    .DayPicker-Day:not(.DayPicker-Day--selected):not(.DayPicker-Day--outside):hover {
    background: #3e3b47;
  }

  .DayPicker-Day--today {
    color: #ff9000;
    font-weight: 700;
  }

  .DayPicker-Day--selected:not(.DayPicker-Day--outside) {
    background: #ff9000 !important;
    color: #232129 !important;
  }
`;

export const AgendaArea = styled.section`
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
`;

export const Toolbar = styled.div`
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  margin-bottom: 16px;

  h1 {
    font-size: 24px;
    font-weight: 500;
    margin-left: 16px;
    color: #f4ede8;

    &::first-letter {
      text-transform: uppercase;
    }
  }

  > span {
    margin-left: auto;
    color: #999591;
  }
`;

export const TodayButton = styled.button`
  background: transparent;
  border: 1px solid #666360;
  color: #f4ede8;
  border-radius: 8px;
  padding: 8px 16px;
  margin-right: 8px;
  font-weight: 500;
  transition: background-color 0.2s;

  &:hover {
    background: #3e3b47;
  }
`;

export const NavButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border: 0;
  border-radius: 50%;
  background: transparent;
  color: #f4ede8;
  transition: background-color 0.2s;

  &:hover {
    background: #3e3b47;
  }

  svg {
    width: 20px;
    height: 20px;
  }
`;

/* Contêiner com scroll: o cabeçalho dos barbeiros e a coluna das horas
   ficam fixos (sticky) enquanto a grade rola */
export const Grid = styled.div`
  position: relative;
  overflow: auto;
  max-height: calc(100vh - 240px);
  background: #28262e;
  border-radius: 10px;
`;

interface ColumnsProps {
  columns: number;
}

const gridColumns = css<ColumnsProps>`
  display: grid;
  grid-template-columns: ${TIME_COLUMN_WIDTH}px repeat(
      ${props => Math.max(props.columns, 1)},
      minmax(180px, 1fr)
    );
`;

export const GridHeader = styled.div<ColumnsProps>`
  ${gridColumns}
  position: sticky;
  top: 0;
  z-index: 3;
  background: #28262e;
  border-bottom: 1px solid #3e3b47;

  > div:first-child {
    position: sticky;
    left: 0;
    background: #28262e;
  }
`;

export const ProviderHeader = styled.div<{ color: string }>`
  display: flex;
  align-items: center;
  padding: 12px;
  border-left: 1px solid #3e3b47;
  border-top: 3px solid ${props => props.color};
  min-width: 0;

  img {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    flex-shrink: 0;
  }

  div {
    margin-left: 12px;
    display: flex;
    flex-direction: column;
    min-width: 0;
  }

  strong {
    color: #f4ede8;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  small {
    color: #999591;
    font-size: 12px;
    margin-top: 2px;
  }
`;

export const YouBadge = styled.span`
  display: inline-block;
  margin-left: 6px;
  padding: 0 6px;
  border-radius: 4px;
  background: #ff9000;
  color: #232129;
  font-size: 11px;
  font-weight: 500;
  vertical-align: middle;
`;

export const GridBody = styled.div<ColumnsProps>`
  ${gridColumns}
  position: relative;
`;

export const TimeColumn = styled.div`
  position: sticky;
  left: 0;
  z-index: 2;
  background: #28262e;

  span {
    display: block;
    height: ${HOUR_HEIGHT}px;
    padding-right: 8px;
    text-align: right;
    font-size: 12px;
    color: #999591;
    /* O rótulo fica alinhado com a linha que abre a hora */
    transform: translateY(-7px);
  }

  span:first-child {
    transform: none;
  }
`;

export const ProviderColumn = styled.div`
  position: relative;
  border-left: 1px solid #3e3b47;
`;

export const HourCell = styled.div<{ off: boolean }>`
  height: ${HOUR_HEIGHT}px;
  border-bottom: 1px solid #3e3b47;

  /* Fora do expediente: hachurado, como os horários bloqueados do Google Agenda */
  ${props =>
    props.off &&
    css`
      background: repeating-linear-gradient(
        -45deg,
        #232129,
        #232129 6px,
        #28262e 6px,
        #28262e 12px
      );
    `}
`;

export const DayOffLabel = styled.span`
  position: absolute;
  top: 12px;
  left: 0;
  right: 0;
  text-align: center;
  color: #666360;
  font-size: 13px;
`;

interface AppointmentCardProps {
  color: string;
  past: boolean;
}

export const AppointmentCard = styled.div<AppointmentCardProps>`
  position: absolute;
  left: 4px;
  right: 4px;
  z-index: 1;
  padding: 6px 8px;
  border-radius: 6px;
  border-left: 4px solid ${props => props.color};
  background: ${props => shade(0.55, props.color)};
  overflow: hidden;
  opacity: ${props => (props.past ? 0.55 : 1)};
  transition: transform 0.1s;

  &:hover {
    transform: scale(1.02);
  }

  time {
    display: block;
    font-size: 12px;
    color: #f4ede8;
    opacity: 0.85;
  }

  strong {
    display: block;
    color: #fff;
    font-size: 14px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  small {
    display: block;
    font-size: 12px;
    color: #f4ede8;
    opacity: 0.75;
  }
`;

export const NowLine = styled.div`
  position: absolute;
  left: ${TIME_COLUMN_WIDTH}px;
  right: 0;
  z-index: 2;
  height: 2px;
  background: #ff4d4f;
  pointer-events: none;

  &::before {
    content: '';
    position: absolute;
    left: -6px;
    top: -5px;
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background: #ff4d4f;
  }
`;

export const EmptyState = styled.p`
  padding: 48px;
  text-align: center;
  color: #999591;
`;
