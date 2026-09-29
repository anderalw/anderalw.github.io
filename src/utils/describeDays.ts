const SHORT_NAMES = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];
const FULL_NAMES = [
  'domingo',
  'segunda',
  'terça',
  'quarta',
  'quinta',
  'sexta',
  'sábado',
];
const EVERY = [
  'Todo domingo',
  'Toda segunda',
  'Toda terça',
  'Toda quarta',
  'Toda quinta',
  'Toda sexta',
  'Todo sábado',
];

// Segunda primeiro, domingo por último (como se lê a semana de trabalho)
const WEEK_ORDER = [1, 2, 3, 4, 5, 6, 0];

const inWeekOrder = (days: number[]): number[] =>
  WEEK_ORDER.filter(day => days.includes(day));

// "seg, qua e sex"
export function listDays(days: number[]): string {
  const names = inWeekOrder(days).map(day => SHORT_NAMES[day]);

  if (names.length <= 1) return names.join('');

  return `${names.slice(0, -1).join(', ')} e ${names[names.length - 1]}`;
}

// "Todos os dias", "De terça a sexta", "Todo sábado", "seg, qua e sex"
export default function describeDays(days: number[]): string {
  const sorted = inWeekOrder(days);

  if (sorted.length === 7) return 'Todos os dias';
  if (sorted.length === 1) return EVERY[sorted[0]];

  // Dias seguidos (3 ou mais): "De segunda a sexta"
  const first = WEEK_ORDER.indexOf(sorted[0]);
  const contiguous = sorted.every(
    (day, index) => WEEK_ORDER.indexOf(day) === first + index,
  );

  if (contiguous && sorted.length >= 3) {
    return `De ${FULL_NAMES[sorted[0]]} a ${
      FULL_NAMES[sorted[sorted.length - 1]]
    }`;
  }

  return listDays(sorted);
}
