export interface WeekSchedule {
  // 0 = domingo
  day_of_week: number;
  start_time: string;
  end_time: string;
}

const SHORT_DAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

// "09:00" -> "09h", "09:30" -> "09h30"
function hour(time: string): string {
  const [h, m] = time.split(':');

  return m === '00' ? `${h}h` : `${h}h${m}`;
}

// Junta dias seguidos com o mesmo horário:
// "Seg a Sex 09h–18h · Sáb 09h–13h"
export default function scheduleSummary(schedules: WeekSchedule[]): string {
  const sorted = [...schedules].sort((a, b) => a.day_of_week - b.day_of_week);
  const groups: { first: number; last: number; hours: string }[] = [];

  sorted.forEach(({ day_of_week, start_time, end_time }) => {
    const hours = `${hour(start_time)}–${hour(end_time)}`;
    const previous = groups[groups.length - 1];

    if (
      previous &&
      previous.hours === hours &&
      previous.last === day_of_week - 1
    ) {
      previous.last = day_of_week;
    } else {
      groups.push({ first: day_of_week, last: day_of_week, hours });
    }
  });

  return groups
    .map(({ first, last, hours }) => {
      let days = SHORT_DAYS[first];

      if (last === first + 1) {
        days = `${SHORT_DAYS[first]} e ${SHORT_DAYS[last]}`;
      } else if (last > first + 1) {
        days = `${SHORT_DAYS[first]} a ${SHORT_DAYS[last]}`;
      }

      return `${days} ${hours}`;
    })
    .join(' · ');
}
