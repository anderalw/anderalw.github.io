import styled from 'styled-components';

import { colors } from '../../styles/theme';

// Visual do react-day-picker no tema do painel (agenda e agendamento)
export const Calendar = styled.div`
  .DayPicker {
    width: 100%;
    font-size: 13px;
  }

  .DayPicker-wrapper {
    padding: 0;
    outline: none;
  }

  .DayPicker-Months {
    justify-content: stretch;
  }

  .DayPicker-Month {
    width: 100%;
    margin: 0;
    border-collapse: separate;
    border-spacing: 2px;
  }

  .DayPicker-Caption {
    margin-bottom: 8px;
    padding: 0 4px;

    > div {
      font-size: 14px;
      font-weight: 600;
      color: ${colors.text};
    }
  }

  .DayPicker-NavBar {
    position: absolute;
    top: 0;
    right: 0;
  }

  .DayPicker-NavButton {
    position: static;
    display: inline-block;
    margin: 0 0 0 4px;
    width: 18px;
    height: 18px;
    opacity: 0.6;
    filter: invert(1);

    &:hover {
      opacity: 1;
    }
  }

  .DayPicker-Weekday {
    padding: 4px 0;
    font-size: 11px;
    color: ${colors.textSubtle};
  }

  .DayPicker-Day {
    width: 30px;
    height: 30px;
    padding: 0;
    border-radius: 50%;
    color: ${colors.textMuted};
    outline: none;
    font-variant-numeric: tabular-nums;
  }

  .DayPicker:not(.DayPicker--interactionDisabled)
    .DayPicker-Day:not(.DayPicker-Day--selected):not(
      .DayPicker-Day--outside
    ):hover {
    background: ${colors.surfaceHover};
    color: ${colors.text};
  }

  .DayPicker-Day--today {
    color: ${colors.primary};
    font-weight: 700;
  }

  .DayPicker-Day--selected:not(.DayPicker-Day--outside) {
    background: ${colors.primary} !important;
    color: ${colors.onPrimary} !important;
    font-weight: 600;
  }

  /* Dias fora do intervalo permitido (ex: datas passadas) */
  .DayPicker-Day--disabled:not(.DayPicker-Day--outside) {
    color: ${colors.textSubtle};
    opacity: 0.45;
    cursor: default;
  }
`;
