import { describe, expect, it } from 'vitest';

import scheduleSummary, { WeekSchedule } from './scheduleSummary';

const day = (
  day_of_week: number,
  start_time = '09:00',
  end_time = '18:00',
): WeekSchedule => ({
  day_of_week,
  start_time,
  end_time,
});

describe('scheduleSummary', () => {
  it('junta dias seguidos com o mesmo horário', () => {
    expect(
      scheduleSummary([
        day(1),
        day(2),
        day(3),
        day(4),
        day(5),
        day(6, '09:00', '13:00'),
      ]),
    ).toBe('Seg a Sex 09h–18h · Sáb 09h–13h');
  });

  it('usa "e" para dois dias e separa dias não seguidos', () => {
    expect(scheduleSummary([day(5), day(1), day(6)])).toBe(
      'Seg 09h–18h · Sex e Sáb 09h–18h',
    );
  });

  it('devolve vazio sem horários', () => {
    expect(scheduleSummary([])).toBe('');
  });
});
