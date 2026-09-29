import React, { useEffect, useMemo, useState } from 'react';
import { Redirect } from 'react-router-dom';
import {
  endOfMonth,
  endOfWeek,
  format,
  parseISO,
  startOfMonth,
  startOfWeek,
  subMonths,
} from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';

import api from '../../services/api';
import { useAuth } from '../../hooks/Auth';
import { useToast } from '../../hooks/Toast';
import getApiErrorMessage from '../../utils/getApiErrorMessage';
import { formatPrice } from '../../utils/money';
import {
  PaymentMethod,
  PAYMENT_METHODS,
  PAYMENT_LABELS,
} from '../../utils/payment';

import AppLayout from '../../components/AppLayout';
import {
  Page,
  PageHeader,
  Card,
  CardHeader,
  Table,
  TextInput,
} from '../../components/ui';
import {
  PeriodBar,
  DateField,
  Presets,
  Cards,
  StatCard,
  Chart,
  Bar,
  ChartAxis,
  Tables,
  EmptyRow,
} from './styles';

interface Counts {
  completed: number;
  no_show: number;
  pending: number;
  upcoming: number;
  revenue_cents: number;
}

interface RevenueReport {
  totals: Counts & {
    canceled: number;
    expected_cents: number;
    lost_cents: number;
    average_ticket_cents: number;
  };
  providers: Array<Counts & { id: string; name: string }>;
  services: Array<{
    id: string | null;
    name: string;
    completed: number;
    revenue_cents: number;
  }>;
  days: Array<{ date: string; completed: number; revenue_cents: number }>;
  // Recebido em cada forma de pagamento (unknown = não informada)
  methods: Record<PaymentMethod | 'unknown', { count: number; cents: number }>;
}

type Preset = 'today' | 'week' | 'month' | 'last-month';

const toValue = (date: Date): string => format(date, 'yyyy-MM-dd');

function presetRange(preset: Preset): { start: string; end: string } {
  const today = new Date();

  switch (preset) {
    case 'today':
      return { start: toValue(today), end: toValue(today) };
    case 'week':
      return {
        start: toValue(startOfWeek(today)),
        end: toValue(endOfWeek(today)),
      };
    case 'last-month': {
      const last = subMonths(today, 1);

      return {
        start: toValue(startOfMonth(last)),
        end: toValue(endOfMonth(last)),
      };
    }
    default:
      return {
        start: toValue(startOfMonth(today)),
        end: toValue(endOfMonth(today)),
      };
  }
}

const PRESETS: Array<{ value: Preset; label: string }> = [
  { value: 'today', label: 'Hoje' },
  { value: 'week', label: 'Esta semana' },
  { value: 'month', label: 'Este mês' },
  { value: 'last-month', label: 'Mês passado' },
];

const plural = (count: number, one: string, many: string): string =>
  `${count} ${count === 1 ? one : many}`;

// Faturamento do período: o que foi atendido e quanto rendeu, faltas,
// atendimentos a confirmar e o previsto, no total, por dia, por barbeiro e
// por serviço. Só para administradores
const Revenue: React.FC = () => {
  const { user } = useAuth();
  const { addToast } = useToast();

  const [range, setRange] = useState(() => presetRange('month'));
  const [report, setReport] = useState<RevenueReport | null>(null);
  const [loading, setLoading] = useState(true);

  const activePreset = PRESETS.find(({ value }) => {
    const preset = presetRange(value);

    return preset.start === range.start && preset.end === range.end;
  })?.value;

  useEffect(() => {
    if (!user.is_admin || !range.start || !range.end) return undefined;

    let active = true;

    setLoading(true);

    api
      .get<RevenueReport>('/reports/revenue', { params: range })
      .then(response => {
        if (active) setReport(response.data);
      })
      .catch(err => {
        if (!active) return;

        addToast({
          type: 'error',
          title: 'Erro ao carregar o faturamento',
          description: getApiErrorMessage(err, 'Tente novamente.'),
        });
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [range, user.is_admin, addToast]);

  const maxDay = useMemo(
    () => Math.max(0, ...(report?.days || []).map(day => day.revenue_cents)),
    [report],
  );

  if (!user.is_admin) {
    return <Redirect to="/dashboard" />;
  }

  const totals = report?.totals;
  // Enquanto carrega, os números ficam com "–" (sem mudar o tamanho)
  const show = (value: string): string => (loading || !totals ? '–' : value);

  return (
    <AppLayout>
      <Page>
        <PageHeader>
          <div>
            <h1>Faturamento</h1>
            <p>
              Atendimentos concluídos, faltas e o previsto no período. O valor é
              o do serviço no momento da marcação.
            </p>
          </div>
        </PageHeader>

        <PeriodBar>
          <Presets role="group" aria-label="Período">
            {PRESETS.map(({ value, label }) => (
              <button
                key={value}
                type="button"
                aria-pressed={activePreset === value}
                onClick={() => setRange(presetRange(value))}
              >
                {label}
              </button>
            ))}
          </Presets>
          <DateField htmlFor="revenue-start">
            De
            <TextInput
              id="revenue-start"
              type="date"
              value={range.start}
              max={range.end}
              onChange={event =>
                setRange(current => ({ ...current, start: event.target.value }))
              }
            />
          </DateField>
          <DateField htmlFor="revenue-end">
            até
            <TextInput
              id="revenue-end"
              type="date"
              value={range.end}
              min={range.start}
              onChange={event =>
                setRange(current => ({ ...current, end: event.target.value }))
              }
            />
          </DateField>
        </PeriodBar>

        <Cards>
          <StatCard tone="primary">
            <span>Faturado</span>
            <strong>{show(formatPrice(totals?.revenue_cents || 0))}</strong>
            <small>
              {totals && !loading
                ? plural(totals.completed, 'atendimento', 'atendimentos')
                : ''}
            </small>
          </StatCard>
          <StatCard tone="neutral">
            <span>Ticket médio</span>
            <strong>
              {show(formatPrice(totals?.average_ticket_cents || 0))}
            </strong>
            <small>Faturado ÷ atendimentos</small>
          </StatCard>
          <StatCard tone="danger">
            <span>Faltas</span>
            <strong>{show(String(totals?.no_show || 0))}</strong>
            <small>
              {totals && !loading && totals.lost_cents > 0
                ? `${formatPrice(totals.lost_cents)} que deixaram de entrar`
                : ''}
            </small>
          </StatCard>
          <StatCard tone="warning">
            <span>A confirmar</span>
            <strong>{show(String(totals?.pending || 0))}</strong>
            <small>Já passaram: registre na agenda</small>
          </StatCard>
          <StatCard tone="success">
            <span>Previsto</span>
            <strong>{show(formatPrice(totals?.expected_cents || 0))}</strong>
            <small>
              {totals && !loading
                ? `Inclui ${plural(
                    totals.upcoming + totals.pending,
                    'horário',
                    'horários',
                  )} ainda sem registro`
                : ''}
            </small>
          </StatCard>
        </Cards>

        <Card>
          <CardHeader>
            <div>
              <h2>Faturado por dia</h2>
              <p>
                {`${format(parseISO(range.start), "d 'de' MMM", {
                  locale: ptBR,
                })} a ${format(parseISO(range.end), "d 'de' MMM 'de' yyyy", {
                  locale: ptBR,
                })}`}
              </p>
            </div>
          </CardHeader>
          <Chart aria-hidden={loading}>
            {(report?.days || []).map(day => (
              <Bar
                key={day.date}
                empty={day.revenue_cents === 0}
                height={maxDay > 0 ? (day.revenue_cents / maxDay) * 100 : 0}
                title={`${format(parseISO(day.date), 'dd/MM')}: ${formatPrice(
                  day.revenue_cents,
                )} (${plural(day.completed, 'atendimento', 'atendimentos')})`}
              />
            ))}
          </Chart>
          <ChartAxis>
            <span>{format(parseISO(range.start), 'dd/MM')}</span>
            <span>{format(parseISO(range.end), 'dd/MM')}</span>
          </ChartAxis>
        </Card>

        <Tables>
          <Card>
            <CardHeader>
              <h2>Por barbeiro</h2>
            </CardHeader>
            {!loading && report && report.providers.length === 0 ? (
              <EmptyRow>Nenhum agendamento no período.</EmptyRow>
            ) : (
              <Table>
                <thead>
                  <tr>
                    <th>Barbeiro</th>
                    <th className="num">Atendidos</th>
                    <th className="num">Faltas</th>
                    <th className="num">A confirmar</th>
                    <th className="num">Faturado</th>
                  </tr>
                </thead>
                <tbody>
                  {(report?.providers || []).map(provider => (
                    <tr key={provider.id}>
                      <td>{provider.name}</td>
                      <td className="num">{provider.completed}</td>
                      <td className="num">{provider.no_show}</td>
                      <td className="num">{provider.pending}</td>
                      <td className="num">
                        {formatPrice(provider.revenue_cents)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            )}
          </Card>

          <Card>
            <CardHeader>
              <h2>Por serviço</h2>
            </CardHeader>
            {!loading && report && report.services.length === 0 ? (
              <EmptyRow>Nenhum atendimento concluído no período.</EmptyRow>
            ) : (
              <Table>
                <thead>
                  <tr>
                    <th>Serviço</th>
                    <th className="num">Atendidos</th>
                    <th className="num">Faturado</th>
                  </tr>
                </thead>
                <tbody>
                  {(report?.services || []).map(service => (
                    <tr key={service.id || 'none'}>
                      <td>{service.name}</td>
                      <td className="num">{service.completed}</td>
                      <td className="num">
                        {formatPrice(service.revenue_cents)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            )}
          </Card>

          <Card>
            <CardHeader>
              <h2>Por forma de pagamento</h2>
            </CardHeader>
            <Table>
              <thead>
                <tr>
                  <th>Forma</th>
                  <th className="num">Atendidos</th>
                  <th className="num">Parte</th>
                  <th className="num">Recebido</th>
                </tr>
              </thead>
              <tbody>
                {([...PAYMENT_METHODS, 'unknown'] as const).map(method => {
                  const item = report?.methods[method];
                  const share =
                    item && totals && totals.revenue_cents > 0
                      ? Math.round((item.cents / totals.revenue_cents) * 100)
                      : 0;

                  return (
                    <tr key={method}>
                      <td>
                        {method === 'unknown'
                          ? 'Não informada'
                          : PAYMENT_LABELS[method]}
                      </td>
                      <td className="num">{item ? item.count : '–'}</td>
                      <td className="num">{item ? `${share}%` : '–'}</td>
                      <td className="num">
                        {item ? formatPrice(item.cents) : '–'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </Table>
          </Card>
        </Tables>
      </Page>
    </AppLayout>
  );
};

export default Revenue;
