// Depois do login, volta para a página que pediu login (ex.: pedir um
// plano do clube pelo site); sem isso, o agendamento
export default function clientHomeAfterLogin(state: unknown): string {
  const from = (state as { from?: { pathname: string; search?: string } })
    ?.from;

  if (from && from.pathname.startsWith('/meus-agendamentos')) {
    return `${from.pathname}${from.search || ''}`;
  }

  return '/agendar';
}
