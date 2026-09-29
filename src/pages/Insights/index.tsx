import React, { useEffect, useMemo, useState } from 'react';
import { Link, Redirect } from 'react-router-dom';
import {
  endOfMonth,
  format,
  parseISO,
  startOfMonth,
  subDays,
  subMonths,
} from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';
import { FiUser } from 'react-icons/fi';
import { FaWhatsapp } from 'react-icons/fa';

import api from '../../services/api';
import { colors } from '../../styles/theme';
import { useAuth } from '../../hooks/Auth';
import { useToast } from '../../hooks/Toast';
import getApiErrorMessage from '../../utils/getApiErrorMessage';
import { formatPrice } from '../../utils/money';
import { formatPhone, whatsappHref } from '../../utils/phone';

import AppLayout from '../../components/AppLayout';
import {
  Page,
  PageHeader,
  Card,
  CardHeader,
  Select,
} from '../../components/ui';
import { EmptyText } from '../ManageServices/styles';
import { PeriodBar, Presets } from '../Revenue/styles';
import {
  KpiGrid,
  Kpi,
  Delta,
  DeltaTone,
  Row,
  BarList,
  Track,
  Fill,
  Heatmap,
  Cell,
  Legend,
  LostHeader,
  LostTable,
  Actions,
} from './styles';

interface Occupancy {
  booked_minutes: number;
  available_minutes: number;
  rate: number | null;
}

interface PeriodNumbers {
  total: number;
  completed: number;
  no_show: number;
  canceled: number;
  revenue_cents: number;
  average_ticket_cents: number;
  no_show_rate: number | null;
  cancel_rate: number | null;
  active_clients: number;
  new_clients: number;
  occupancy: Occupancy;
}

interface InsightsData {
  current: PeriodNumbers;
  previous: PeriodNumbers;
  providers: Array<Occupancy & { id: string; name: string }>;
  services: Array<{
    id: string | null;
    name: string;
    count: number;
    revenue_cents: number;
  }>;
  heatmap: { hours: number[]; days: number[][] };
}

interface LostClient {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  last_visit: string;
  visits: number;
  total_cents: number;
  days_away: number;
}

type Preset = 'last30' | 'month' | 'last-month' | 'last90';

const PRESETS: { value: Preset; label: string }[] = [
  { value: 'last30', label: 'Últimos 30 dias' },
  { value: 'month', label: 'Este mês' },
  { value: 'last-month', label: 'Mês passado' },
  { value: 'last90', label: 'Últimos 90 dias' },
];

const toValue = (date: Date): string => format(date, 'yyyy-MM-dd');

function presetRange(preset: Preset): { start: string; end: string } {
  const today = new Date();

  switch (preset) {
    case 'month':
      return { start: toValue(startOfMonth(today)), end: toValue(today) };
    case 'last-month': {
      const last = subMonths(today, 1);

      return {
        start: toValue(startOfMonth(last)),
        end: toValue(endOfMonth(last)),
      };
    }
    case 'last90':
      return { start: toValue(subDays(today, 89)), end: toValue(today) };
    default:
      return { start: toValue(subDays(today, 29)), end: toValue(today) };
  }
}

// Segunda a domingo (os índices da API começam no domingo)
const WEEK = [
  { index: 1, label: 'Seg' },
  { index: 2, label: 'Ter' },
  { index: 3, label: 'Qua' },
  { index: 4, label: 'Qui' },
  { index: 5, label: 'Sex' },
  { index: 6, label: 'Sáb' },
  { index: 0, label: 'Dom' },
];

const percent = (value: number | null): string =>
  value === null ? '–' : `${(value * 100).toFixed(1).replace('.', ',')}%`;

// Variação em relação ao período anterior. higherIsBetter: se subir é bom
function change(
  current: number | null,
  previous: number | null,
  { points = false, higherIsBetter = true } = {},
): { text: string; tone: DeltaTone } {
  if (current === null || previous === null) {
    return { text: 'Sem dados do período anterior', tone: 'neutral' };
  }

  let diff: number;
  let text: string;

  if (points) {
    // Taxas: diferença em pontos percentuais
    diff = (current - previous) * 100;
    text = `${Math.abs(diff).toFixed(1).replace('.', ',')} p.p.`;
  } else {
    if (previous === 0) {
      return {
        text: current > 0 ? 'Novo no período' : 'Igual ao período anterior',
        tone: 'neutral',
      };
    }

    diff = ((current - previous) / previous) * 100;
    text = `${Math.abs(diff).toFixed(0)}%`;
  }

  if (Math.abs(diff) < 0.05) {
    return { text: 'Igual ao período anterior', tone: 'neutral' };
  }

  const up = diff > 0;

  return {
    text: `${up ? '▲' : '▼'} ${text} vs anterior`,
    tone: up === higherIsBetter ? 'good' : 'bad',
  };
}

// Painel de indicadores (admin): ocupação da agenda, faltas, serviços mais
// pedidos, horários mais cheios e clientes que sumiram
const Insights: React.FC = () => {
  const { user } = useAuth();
  const { addToast } = useToast();

  const [preset, setPreset] = useState<Preset>('last30');
  const [data, setData] = useState<InsightsData | null>(null);
  const [lostDays, setLostDays] = useState(45);
  const [lost, setLost] = useState<LostClient[] | null>(null);

  const range = useMemo(() => presetRange(preset), [preset]);

  useEffect(() => {
    if (!user.is_admin) return undefined;

    let active = true;

    setData(null);

    api
      .get<InsightsData>('/reports/insights', { params: range })
      .then(response => {
        if (active) setData(response.data);
      })
      .catch(err => {
        if (!active) return;

        addToast({
          type: 'error',
          title: 'Erro ao carregar os indicadores',
          description: getApiErrorMessage(err, 'Tente novamente.'),
        });
      });

    return () => {
      active = false;
    };
  }, [range, user.is_admin, addToast]);

  useEffect(() => {
    if (!user.is_admin) return undefined;

    let active = true;

    setLost(null);

    api
      .get<LostClient[]>('/reports/lost-clients', {
        params: { days: lostDays },
      })
      .then(response => {
        if (active) setLost(response.data);
      })
      .catch(() => {
        if (active) setLost([]);
      });

    return () => {
      active = false;
    };
  }, [lostDays, user.is_admin]);

  const heatMax = useMemo(
    () => (data ? Math.max(1, ...data.heatmap.days.flat()) : 1),
    [data],
  );

  if (!user.is_admin) {
    return <Redirect to="/dashboard" />;
  }

  const current = data?.current;
  const previous = data?.previous;
  const show = (value: string): string => (data ? value : '–');
  const maxService = data
    ? Math.max(1, ...data.services.map(item => item.count))
    : 1;

  const occupancyDelta = change(
    current?.occupancy.rate ?? null,
    previous?.occupancy.rate ?? null,
    { points: true },
  );
  const noShowDelta = change(
    current?.no_show_rate ?? null,
    previous?.no_show_rate ?? null,
    { points: true, higherIsBetter: false },
  );
  const cancelDelta = change(
    current?.cancel_rate ?? null,
    previous?.cancel_rate ?? null,
    { points: true, higherIsBetter: false },
  );
  const completedDelta = change(
    current?.completed ?? null,
    previous?.completed ?? null,
  );
  const revenueDelta = change(
    current?.revenue_cents ?? null,
    previous?.revenue_cents ?? null,
  );

  return (
    <AppLayout>
      <Page>
        <PageHeader>
          <div>
            <h1>Indicadores</h1>
            <p>
              {`${format(parseISO(range.start), "d 'de' MMM", {
                locale: ptBR,
              })} a ${format(parseISO(range.end), "d 'de' MMM 'de' yyyy", {
                locale: ptBR,
              })}, comparado com o período anterior do mesmo tamanho.`}
            </p>
          </div>
        </PageHeader>

        <PeriodBar>
          <Presets role="group" aria-label="Período">
            {PRESETS.map(option => (
              <button
                key={option.value}
                type="button"
                aria-pressed={preset === option.value}
                onClick={() => setPreset(option.value)}
              >
                {option.label}
              </button>
            ))}
          </Presets>
        </PeriodBar>

        <KpiGrid>
          <Kpi>
            <span>Ocupação da agenda</span>
            <strong>{show(percent(current?.occupancy.rate ?? null))}</strong>
            <Delta tone={data ? occupancyDelta.tone : 'neutral'}>
              {data ? occupancyDelta.text : ''}
            </Delta>
          </Kpi>
          <Kpi>
            <span>Atendimentos</span>
            <strong>{show(String(current?.completed ?? 0))}</strong>
            <Delta tone={data ? completedDelta.tone : 'neutral'}>
              {data ? completedDelta.text : ''}
            </Delta>
          </Kpi>
          <Kpi>
            <span>Faturado</span>
            <strong>{show(formatPrice(current?.revenue_cents ?? 0))}</strong>
            <Delta tone={data ? revenueDelta.tone : 'neutral'}>
              {data ? revenueDelta.text : ''}
            </Delta>
          </Kpi>
          <Kpi>
            <span>Taxa de faltas</span>
            <strong>{show(percent(current?.no_show_rate ?? null))}</strong>
            <Delta tone={data ? noShowDelta.tone : 'neutral'}>
              {data ? noShowDelta.text : ''}
            </Delta>
          </Kpi>
          <Kpi>
            <span>Cancelamentos</span>
            <strong>{show(percent(current?.cancel_rate ?? null))}</strong>
            <Delta tone={data ? cancelDelta.tone : 'neutral'}>
              {data ? cancelDelta.text : ''}
            </Delta>
          </Kpi>
          <Kpi>
            <span>Clientes atendidos</span>
            <strong>{show(String(current?.active_clients ?? 0))}</strong>
            <Delta
              tone={current && current.new_clients > 0 ? 'good' : 'neutral'}
            >
              {current
                ? `${current.new_clients} ${
                    current.new_clients === 1
                      ? 'veio pela 1ª vez'
                      : 'vieram pela 1ª vez'
                  } · ticket ${formatPrice(current.average_ticket_cents)}`
                : ''}
            </Delta>
          </Kpi>
        </KpiGrid>

        <Row>
          <Card>
            <CardHeader>
              <div>
                <h2>Ocupação por barbeiro</h2>
                <p>Horas marcadas ÷ horas de expediente (sem bloqueios).</p>
              </div>
            </CardHeader>
            <BarList>
              {(data?.providers || []).map(provider => (
                <li key={provider.id}>
                  <header>
                    <span>{provider.name}</span>
                    <span>
                      {`${percent(provider.rate)} · ${Math.round(
                        provider.booked_minutes / 60,
                      )}h de ${Math.round(provider.available_minutes / 60)}h`}
                    </span>
                  </header>
                  <Track>
                    <Fill value={provider.rate ?? 0} />
                  </Track>
                </li>
              ))}
              {data && data.providers.length === 0 && (
                <EmptyText as="li">Nenhum expediente no período.</EmptyText>
              )}
            </BarList>
          </Card>

          <Card>
            <CardHeader>
              <div>
                <h2>Serviços mais pedidos</h2>
                <p>Agendamentos no período (sem os cancelados).</p>
              </div>
            </CardHeader>
            <BarList>
              {(data?.services || []).map(service => (
                <li key={service.id || 'none'}>
                  <header>
                    <span>{service.name}</span>
                    <span>
                      {`${service.count} · ${formatPrice(
                        service.revenue_cents,
                      )}`}
                    </span>
                  </header>
                  <Track>
                    <Fill
                      value={service.count / maxService}
                      color={colors.info}
                    />
                  </Track>
                </li>
              ))}
              {data && data.services.length === 0 && (
                <EmptyText as="li">Nenhum agendamento no período.</EmptyText>
              )}
            </BarList>
          </Card>
        </Row>

        <Card style={{ marginBottom: 24 }}>
          <CardHeader>
            <div>
              <h2>Horários mais cheios</h2>
              <p>Agendamentos por dia da semana e hora de início.</p>
            </div>
          </CardHeader>
          {data && (
            <>
              <Heatmap columns={data.heatmap.hours.length}>
                <span />
                {data.heatmap.hours.map(hour => (
                  <span key={hour} className="hour">
                    {`${hour}h`}
                  </span>
                ))}
                {WEEK.map(day => (
                  <React.Fragment key={day.index}>
                    <span>{day.label}</span>
                    {data.heatmap.days[day.index].map((value, column) => (
                      <Cell
                        // eslint-disable-next-line react/no-array-index-key
                        key={column}
                        value={value / heatMax}
                        title={`${day.label} às ${data.heatmap.hours[column]}h: ${value} agendamentos`}
                      >
                        {value > 0 ? value : ''}
                      </Cell>
                    ))}
                  </React.Fragment>
                ))}
              </Heatmap>
              <Legend>
                Quanto mais forte a cor, mais cheio. Horários claros são boas
                oportunidades para promoções.
              </Legend>
            </>
          )}
          {!data && <div style={{ height: 300 }} />}
        </Card>

        <Card>
          <CardHeader>
            <div>
              <h2>Clientes que sumiram</h2>
              <p>
                Já vieram, não voltam há um tempo e não têm horário marcado.
                Vale um contato.
              </p>
            </div>
            <LostHeader>
              <Select
                aria-label="Sem vir há"
                value={lostDays}
                onChange={event => setLostDays(Number(event.target.value))}
              >
                {[30, 45, 60, 90].map(days => (
                  <option key={days} value={days}>
                    {`Sem vir há ${days} dias`}
                  </option>
                ))}
              </Select>
            </LostHeader>
          </CardHeader>

          {lost && lost.length === 0 ? (
            <EmptyText>
              {`Nenhum cliente sumido há mais de ${lostDays} dias.`}
            </EmptyText>
          ) : (
            <LostTable>
              <thead>
                <tr>
                  <th>Cliente</th>
                  <th className="num">Visitas</th>
                  <th>Última visita</th>
                  <th className="num">Total gasto</th>
                  <th aria-label="Contato" />
                </tr>
              </thead>
              <tbody>
                {(lost || []).map(client => {
                  const firstName = client.name.split(' ')[0];
                  const whatsapp = whatsappHref(
                    client.phone,
                    `Olá, ${firstName}! Faz um tempo que você não aparece por aqui. Que tal marcar um horário?`,
                  );

                  return (
                    <tr key={client.id}>
                      <td>
                        <Link to={`/clientes/${client.id}`}>{client.name}</Link>
                        <small>{formatPhone(client.phone)}</small>
                      </td>
                      <td className="num">{client.visits}</td>
                      <td>
                        {format(parseISO(client.last_visit), 'dd/MM/yyyy')}
                        <small>{`há ${client.days_away} dias`}</small>
                      </td>
                      <td className="num">{formatPrice(client.total_cents)}</td>
                      <td>
                        <Actions>
                          {whatsapp && (
                            <a
                              href={whatsapp}
                              target="_blank"
                              rel="noopener noreferrer"
                              title="Chamar no WhatsApp"
                              aria-label={`Chamar ${client.name} no WhatsApp`}
                            >
                              <FaWhatsapp />
                            </a>
                          )}
                          <Link
                            to={`/clientes/${client.id}`}
                            title="Ver ficha"
                            aria-label={`Ficha de ${client.name}`}
                          >
                            <FiUser />
                          </Link>
                        </Actions>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </LostTable>
          )}
        </Card>
      </Page>
    </AppLayout>
  );
};

export default Insights;
