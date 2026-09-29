import React, { useEffect, useMemo, useRef, useState } from 'react';
import { addDays, format, isBefore, isSameDay } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';

import api from '../../services/api';
import { useToast } from '../../hooks/Toast';
import getApiErrorMessage from '../../utils/getApiErrorMessage';
import {
  Agenda,
  AgendaProvider,
  ParsedAppointment,
  ParsedBlock,
  parseAppointments,
  parseBlocks,
  providerColor,
  hourRange,
  toHour,
} from './agenda';
import useHourHeight from './useHourHeight';
import AgendaBlockCard from './AgendaBlockCard';
import {
  COMPACT_HOUR_HEIGHT,
  TIME_COLUMN_WIDTH,
  Grid,
  GridHeader,
  GridBody,
  TimeColumn,
  ProviderColumn,
  HourCell,
  DayOffLabel,
  AppointmentCard,
  NowLine,
  DayHeader,
} from './styles';

// Serviços curtos ainda precisam de um card clicável
const MIN_CARD_HEIGHT = 18;
const COMPACT_CARD_HEIGHT = 44;

// Agendamento aberto no painel de detalhes
export interface DetailsTarget {
  appointment: ParsedAppointment;
  provider: AgendaProvider;
  color: string;
  // Barbeiros ativos do dia, para remarcar
  providers: AgendaProvider[];
}

export interface NewSlot {
  provider: AgendaProvider;
  start: Date;
  color: string;
}

// Ponto da tela onde o horário foi clicado (para abrir o menu ali)
export interface ClickPoint {
  x: number;
  y: number;
}

// Pelo teclado não há posição do mouse: usa o centro do horário
export function clickPoint(event: React.MouseEvent<HTMLElement>): ClickPoint {
  if (event.clientX || event.clientY) {
    return { x: event.clientX, y: event.clientY };
  }

  const rect = event.currentTarget.getBoundingClientRect();

  return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
}

interface WeekDay {
  date: Date;
  providers: AgendaProvider[];
  appointments: ParsedAppointment[];
  blocks: ParsedBlock[];
}

// Bloqueio clicado: a agenda abre o menu para ver ou remover
export interface BlockTarget {
  block: ParsedBlock;
  providerName: string;
}

interface WeekViewProps {
  // Domingo da semana mostrada
  weekStart: Date;
  now: Date;
  // Muda depois de marcar, remarcar ou cancelar: recarrega a semana
  refreshKey: number;
  // 'all' ou o id de um barbeiro
  providerFilter: string;
  onCountChange(count: number | null): void;
  onOpenDetails(target: DetailsTarget, opener: HTMLElement): void;
  // Horário livre clicado: a agenda abre o menu com as opções
  onSlotClick(slot: NewSlot, point: ClickPoint): void;
  onBlockClick(target: BlockTarget, point: ClickPoint): void;
  onOpenDay(date: Date): void;
}

interface Placed {
  appointment: ParsedAppointment;
  lane: number;
  lanes: number;
}

// Atendimentos que se sobrepõem (de barbeiros diferentes) ficam lado a lado
function placeSideBySide(appointments: ParsedAppointment[]): Placed[] {
  const sorted = [...appointments].sort(
    (a, b) => a.parsedDate.getTime() - b.parsedDate.getTime(),
  );
  const placed: Placed[] = [];
  let cluster: Placed[] = [];
  let laneEnds: number[] = [];
  let clusterEnd = 0;

  const closeCluster = (): void => {
    cluster.forEach(item => {
      // eslint-disable-next-line no-param-reassign
      item.lanes = laneEnds.length;
    });
    placed.push(...cluster);
    cluster = [];
    laneEnds = [];
  };

  sorted.forEach(appointment => {
    const start = appointment.parsedDate.getTime();
    const end = appointment.parsedEnd.getTime();

    if (cluster.length > 0 && start >= clusterEnd) {
      closeCluster();
    }

    let lane = laneEnds.findIndex(laneEnd => laneEnd <= start);

    if (lane === -1) {
      lane = laneEnds.length;
      laneEnds.push(end);
    } else {
      laneEnds[lane] = end;
    }

    cluster.push({ appointment, lane, lanes: 1 });
    clusterEnd = cluster.length === 1 ? end : Math.max(clusterEnd, end);
  });

  closeCluster();

  return placed;
}

const WeekView: React.FC<WeekViewProps> = ({
  weekStart,
  now,
  refreshKey,
  providerFilter,
  onCountChange,
  onOpenDetails,
  onSlotClick,
  onBlockClick,
  onOpenDay,
}) => {
  const { addToast } = useToast();
  const [week, setWeek] = useState<WeekDay[] | null>(null);
  const [loading, setLoading] = useState(true);

  // Os sete dias numa requisição só (cada um igual à agenda do dia)
  useEffect(() => {
    let active = true;

    setLoading(true);

    api
      .get<Array<Agenda & { date: string }>>('/agenda/week', {
        params: {
          year: weekStart.getFullYear(),
          month: weekStart.getMonth() + 1,
          day: weekStart.getDate(),
        },
      })
      .then(response => {
        if (!active) return;

        setWeek(
          response.data.map((day, index) => ({
            date: addDays(weekStart, index),
            providers: day.providers,
            appointments: parseAppointments(day.appointments),
            blocks: parseBlocks(day.blocks),
          })),
        );
      })
      .catch(err => {
        if (!active) return;

        addToast({
          type: 'error',
          title: 'Erro ao carregar a semana',
          description: getApiErrorMessage(
            err,
            'Não foi possível carregar os agendamentos, tente novamente.',
          ),
        });
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [weekStart, refreshKey, addToast]);

  const single = providerFilter !== 'all';

  // Todos os barbeiros que aparecem na semana (para as cores)
  const weekProviders = useMemo(() => {
    const byId = new Map<string, AgendaProvider>();

    (week || []).forEach(day =>
      day.providers.forEach(provider => byId.set(provider.id, provider)),
    );

    return Array.from(byId.values());
  }, [week]);

  const days = useMemo(
    () =>
      (week || []).map(day => ({
        ...day,
        appointments: single
          ? day.appointments.filter(item => item.provider_id === providerFilter)
          : day.appointments,
        // Quem conta para o expediente mostrado
        working: day.providers.filter(
          provider =>
            provider.active &&
            provider.schedule &&
            (!single || provider.id === providerFilter),
        ),
      })),
    [week, single, providerFilter],
  );

  const count = useMemo(
    () => days.reduce((total, day) => total + day.appointments.length, 0),
    [days],
  );

  useEffect(() => {
    onCountChange(loading && !week ? null : count);
  }, [count, loading, week, onCountChange]);

  const [startHour, endHour] = useMemo(
    () =>
      hourRange(
        days.flatMap(day =>
          day.working.map(
            provider =>
              provider.schedule as NonNullable<AgendaProvider['schedule']>,
          ),
        ),
        days.flatMap(day => day.appointments),
      ),
    [days],
  );

  const hours = useMemo(
    () =>
      Array.from(
        { length: endHour - startHour },
        (_, index) => startHour + index,
      ),
    [startHour, endHour],
  );

  const headerRef = useRef<HTMLDivElement>(null);
  const hourHeight = useHourHeight(headerRef, hours.length, !!week);
  const compact = hourHeight < COMPACT_HOUR_HEIGHT;

  const dates = Array.from({ length: 7 }, (_, index) =>
    addDays(weekStart, index),
  );
  const todayIndex = dates.findIndex(date => isSameDay(date, now));
  const currentHour = now.getHours() + now.getMinutes() / 60;
  const showNowLine =
    todayIndex !== -1 && currentHour >= startHour && currentHour <= endHour;

  return (
    <Grid style={{ '--hour-height': `${hourHeight}px` } as React.CSSProperties}>
      <GridHeader ref={headerRef} columns={7}>
        <div />
        {dates.map(date => (
          <DayHeader
            key={date.toISOString()}
            type="button"
            today={isSameDay(date, now)}
            title={`Ver ${format(date, "EEEE, d 'de' MMMM", {
              locale: ptBR,
            })}`}
            onClick={() => onOpenDay(date)}
          >
            <small>{format(date, 'EEE', { locale: ptBR })}</small>
            <strong>{format(date, 'd')}</strong>
          </DayHeader>
        ))}
      </GridHeader>

      <GridBody columns={7}>
        <TimeColumn>
          {hours.map(hour => (
            <span key={hour}>{`${String(hour).padStart(2, '0')}:00`}</span>
          ))}
        </TimeColumn>

        {dates.map((date, dayIndex) => {
          const day = days[dayIndex];
          const provider = single
            ? day?.providers.find(item => item.id === providerFilter)
            : undefined;
          const color = provider
            ? providerColor(provider.id, weekProviders)
            : '';

          return (
            <ProviderColumn key={date.toISOString()}>
              {hours.map(hour => {
                const works = (day?.working || []).some(
                  item =>
                    item.schedule &&
                    hour >= toHour(item.schedule.start_time) &&
                    hour < toHour(item.schedule.end_time),
                );
                const hourEnd = new Date(date);
                hourEnd.setHours(hour + 1, 0, 0, 0);
                // Só dá para marcar clicando com um barbeiro escolhido
                const bookable = !!provider && works && isBefore(now, hourEnd);

                if (!bookable || !provider) {
                  return <HourCell key={hour} off={!!week && !works} />;
                }

                const label = `${String(hour).padStart(2, '0')}:00`;

                return (
                  <HourCell
                    key={hour}
                    as="button"
                    type="button"
                    off={false}
                    bookable
                    aria-label={`Agendar com ${provider.name} em ${format(
                      date,
                      'dd/MM',
                    )} às ${label}`}
                    title={`Agendar com ${provider.name} a partir de ${label}`}
                    onClick={(event: React.MouseEvent<HTMLElement>) => {
                      // A altura do clique escolhe os minutos, de 15 em 15
                      const offset = event.nativeEvent.offsetY || 0;
                      const quarter = Math.min(
                        3,
                        Math.max(0, Math.floor((offset / hourHeight) * 4)),
                      );
                      const start = new Date(date);
                      start.setHours(hour, quarter * 15, 0, 0);

                      onSlotClick(
                        { provider, start, color },
                        clickPoint(event),
                      );
                    }}
                  />
                );
              })}

              {single && week && day && day.working.length === 0 && (
                <DayOffLabel>Folga</DayOffLabel>
              )}

              {/* Bloqueios só com um barbeiro escolhido: com todos, a
                  coluna do dia mistura os barbeiros */}
              {provider &&
                day &&
                day.blocks
                  .filter(block => block.provider_id === provider.id)
                  .map(block => (
                    <AgendaBlockCard
                      key={block.id}
                      block={block}
                      day={date}
                      startHour={startHour}
                      endHour={endHour}
                      hourHeight={hourHeight}
                      color={color}
                      providerName={provider.name}
                      onClick={(target, point) =>
                        onBlockClick(
                          { block: target, providerName: provider.name },
                          point,
                        )
                      }
                    />
                  ))}

              {day &&
                placeSideBySide(day.appointments).map(
                  ({ appointment, lane, lanes }) => {
                    const owner = day.providers.find(
                      item => item.id === appointment.provider_id,
                    );

                    if (!owner) return null;

                    const cardColor = providerColor(owner.id, weekProviders);
                    const { parsedDate, parsedEnd } = appointment;
                    const top =
                      (parsedDate.getHours() +
                        parsedDate.getMinutes() / 60 -
                        startHour) *
                      hourHeight;
                    const durationHours =
                      (parsedEnd.getTime() - parsedDate.getTime()) /
                      (60 * 60 * 1000);
                    const height = Math.max(
                      durationHours * hourHeight - 4,
                      MIN_CARD_HEIGHT,
                    );
                    const clientName =
                      appointment.client?.name || 'Cliente removido';
                    const serviceName =
                      appointment.service?.name || 'Serviço não informado';
                    const timeRange = `${format(
                      parsedDate,
                      'HH:mm',
                    )} – ${format(parsedEnd, 'HH:mm')}`;

                    return (
                      <AppointmentCard
                        key={appointment.id}
                        type="button"
                        aria-haspopup="dialog"
                        color={cardColor}
                        past={!isBefore(now, parsedEnd)}
                        attendance={
                          appointment.attendance ||
                          (isBefore(now, parsedDate) ? null : 'pending')
                        }
                        confirmed={
                          !!appointment.confirmed_at &&
                          isBefore(now, parsedDate)
                        }
                        compact={
                          compact || lanes > 1 || height < COMPACT_CARD_HEIGHT
                        }
                        style={{
                          top: top + 2,
                          height,
                          left: `calc(${(lane / lanes) * 100}% + 2px)`,
                          width: `calc(${100 / lanes}% - 4px)`,
                          right: 'auto',
                        }}
                        title={`${timeRange} · ${clientName} · ${serviceName} · ${owner.name}`}
                        onClick={event =>
                          onOpenDetails(
                            {
                              appointment,
                              provider: owner,
                              color: cardColor,
                              providers: day.providers.filter(
                                item => item.active,
                              ),
                            },
                            event.currentTarget,
                          )
                        }
                      >
                        <time>{timeRange}</time>
                        <strong>{clientName}</strong>
                        <small>{single ? serviceName : owner.name}</small>
                      </AppointmentCard>
                    );
                  },
                )}
            </ProviderColumn>
          );
        })}

        {showNowLine && (
          <NowLine
            style={{
              top: (currentHour - startHour) * hourHeight,
              left: `calc(${TIME_COLUMN_WIDTH}px + (100% - ${TIME_COLUMN_WIDTH}px) * ${todayIndex} / 7)`,
              width: `calc((100% - ${TIME_COLUMN_WIDTH}px) / 7)`,
              right: 'auto',
            }}
          />
        )}
      </GridBody>
    </Grid>
  );
};

export default WeekView;
