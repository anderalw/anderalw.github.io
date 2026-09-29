import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from 'react';
import {
  addDays,
  endOfWeek,
  format,
  isBefore,
  isSameMonth,
  isSameYear,
  isToday,
  parseISO,
  startOfDay,
  startOfWeek,
} from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';
import { useLocation } from 'react-router-dom';
import DayPicker from 'react-day-picker';
import 'react-day-picker/lib/style.css';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import {
  COMPACT_HOUR_HEIGHT,
  AgendaArea,
  Toolbar,
  TodayButton,
  NavButton,
  Grid,
  GridHeader,
  ProviderHeader,
  YouBadge,
  GridBody,
  TimeColumn,
  ProviderColumn,
  HourCell,
  DayOffLabel,
  AppointmentCard,
  BufferStrip,
  NowLine,
  EmptyState,
  ViewSwitch,
  ProviderFilter,
} from './styles';
import { useAuth } from '../../hooks/Auth';
import { useToast } from '../../hooks/Toast';
import api from '../../services/api';
import getApiErrorMessage from '../../utils/getApiErrorMessage';
import avatarFallback from '../../utils/avatarFallback';
import AppLayout from '../../components/AppLayout';
import { Calendar } from '../../components/ui/Calendar';
import AppointmentDetails from './AppointmentDetails';
import NewAppointment from './NewAppointment';
import WeekView, {
  BlockTarget,
  ClickPoint,
  DetailsTarget,
  NewSlot,
  clickPoint,
} from './WeekView';
import SlotMenu from './SlotMenu';
import BlockMenu from './BlockMenu';
import BlockModal from './BlockModal';
import AgendaBlockCard from './AgendaBlockCard';
import useHourHeight from './useHourHeight';
import {
  Agenda,
  MONTHS,
  parseAppointments,
  parseBlocks,
  providerColor,
  hourRange,
  toHour,
} from './agenda';

type ViewMode = 'day' | 'week';

const VIEW_STORAGE_KEY = '@GoBarber:agendaView';

// Última visão escolhida neste navegador (pode não haver storage)
function savedView(): ViewMode {
  try {
    return localStorage.getItem(VIEW_STORAGE_KEY) === 'week' ? 'week' : 'day';
  } catch {
    return 'day';
  }
}

// Dia pedido no endereço (?data=yyyy-MM-dd), ex: ao abrir uma notificação
function dateFromQuery(search = window.location.search): Date | null {
  const value = new URLSearchParams(search).get('data');

  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;

  const date = parseISO(value);

  return Number.isNaN(date.getTime()) ? null : startOfDay(date);
}

// Serviços curtos (ex: 15 min) ainda precisam de um card clicável
const MIN_CARD_HEIGHT = 18;
// Abaixo desta altura o card mostra só horário e cliente, numa linha
const COMPACT_CARD_HEIGHT = 44;

// "27 set – 3 out de 2026", "6 – 12 de outubro de 2026"
function weekTitle(start: Date): string {
  const end = endOfWeek(start);

  if (isSameMonth(start, end)) {
    return `${format(start, 'd')} – ${format(end, "d 'de' MMMM 'de' yyyy", {
      locale: ptBR,
    })}`;
  }

  const startPattern = isSameYear(start, end)
    ? "d 'de' MMM"
    : "d 'de' MMM 'de' yyyy";

  return `${format(start, startPattern, { locale: ptBR })} – ${format(
    end,
    "d 'de' MMM 'de' yyyy",
    { locale: ptBR },
  )}`;
}

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();
  const { addToast } = useToast();
  const [selectedDate, setSelectedDate] = useState(
    () => dateFromQuery() || startOfDay(new Date()),
  );
  const [agenda, setAgenda] = useState<Agenda>({
    providers: [],
    appointments: [],
    blocks: [],
  });
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState(new Date());
  // Vindo de uma notificação (?data=), abre o dia
  const [view, setView] = useState<ViewMode>(() =>
    dateFromQuery() ? 'day' : savedView(),
  );
  // Notificação aberta com a agenda já na tela: muda o dia sem recarregar
  useEffect(() => {
    const date = dateFromQuery(location.search);

    if (date) {
      setSelectedDate(date);
      setView('day');
    }
  }, [location.search, location.key]);

  // Visão semanal: 'all' ou o id de um barbeiro
  const [providerFilter, setProviderFilter] = useState('all');
  const [weekCount, setWeekCount] = useState<number | null>(null);
  // Agendamento aberto no painel de detalhes
  const [details, setDetails] = useState<DetailsTarget | null>(null);
  // Card que abriu os detalhes, para devolver o foco a ele ao fechar
  const openerRef = useRef<HTMLElement | null>(null);
  // Hora livre clicada: abre o formulário de novo agendamento
  const [newSlot, setNewSlot] = useState<NewSlot | null>(null);
  // Menu aberto ao clicar num horário livre, antes de escolher a opção
  const [slotMenu, setSlotMenu] = useState<(NewSlot & ClickPoint) | null>(null);

  // Horário escolhido para bloquear (abre o formulário de bloqueio)
  const [blockSlot, setBlockSlot] = useState<NewSlot | null>(null);
  // Bloqueio clicado na agenda: menu para ver o motivo ou remover
  const [blockMenu, setBlockMenu] = useState<(BlockTarget & ClickPoint) | null>(
    null,
  );
  const [removingBlock, setRemovingBlock] = useState(false);

  const openSlotMenu = useCallback((slot: NewSlot, point: ClickPoint) => {
    setSlotMenu({ ...slot, ...point });
  }, []);

  const openBlockMenu = useCallback(
    (target: BlockTarget, point: ClickPoint) => {
      setBlockMenu({ ...target, ...point });
    },
    [],
  );

  const changeView = useCallback((next: ViewMode) => {
    setView(next);

    try {
      localStorage.setItem(VIEW_STORAGE_KEY, next);
    } catch {
      // Sem storage a escolha só vale até recarregar a página
    }
  }, []);

  const weekStart = useMemo(() => startOfWeek(selectedDate), [selectedDate]);

  const openDetails = useCallback(
    (target: DetailsTarget, opener: HTMLElement) => {
      openerRef.current = opener;
      setDetails(target);
    },
    [],
  );

  const closeDetails = useCallback(() => {
    setDetails(null);
    openerRef.current?.focus();
  }, []);

  // Muda para recarregar a agenda depois de cancelar ou remarcar
  const [refreshKey, setRefreshKey] = useState(0);

  const handleAppointmentChanged = useCallback(
    (message: { title: string; description: string }) => {
      setDetails(null);
      setNewSlot(null);
      setBlockSlot(null);
      setBlockMenu(null);
      setRefreshKey(key => key + 1);
      addToast({ type: 'success', ...message });
    },
    [addToast],
  );

  const removeBlock = useCallback(async () => {
    if (!blockMenu) return;

    setRemovingBlock(true);

    try {
      await api.delete(`/blocks/${blockMenu.block.id}`);

      handleAppointmentChanged({
        title: 'Bloqueio removido',
        description: `${blockMenu.providerName} volta a receber agendamentos nesse horário.`,
      });
    } catch (err) {
      addToast({
        type: 'error',
        title: 'Não foi possível remover o bloqueio',
        description: getApiErrorMessage(err, 'Tente novamente.'),
      });
    } finally {
      setRemovingBlock(false);
    }
  }, [blockMenu, handleAppointmentChanged, addToast]);

  // Atualiza a linha da hora atual a cada minuto
  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  // Atalhos de teclado, como no Google Agenda: T volta para hoje, as setas
  // andam um dia (ou uma semana) e D/S trocam a visão. Ficam desligados com
  // um painel aberto ou digitando
  const panelOpen =
    !!details || !!newSlot || !!slotMenu || !!blockSlot || !!blockMenu;
  const step = view === 'week' ? 7 : 1;

  useEffect(() => {
    if (panelOpen) return undefined;

    function handleKeyDown(event: KeyboardEvent): void {
      const target = event.target as HTMLElement;

      if (
        event.ctrlKey ||
        event.metaKey ||
        event.altKey ||
        target.closest(
          'input, textarea, select, [contenteditable="true"], .DayPicker',
        )
      ) {
        return;
      }

      if (event.key === 't' || event.key === 'T') {
        setSelectedDate(startOfDay(new Date()));
      } else if (event.key === 'ArrowLeft') {
        setSelectedDate(date => addDays(date, -step));
      } else if (event.key === 'ArrowRight') {
        setSelectedDate(date => addDays(date, step));
      } else if (event.key === 'd' || event.key === 'D') {
        changeView('day');
      } else if (event.key === 's' || event.key === 'S') {
        changeView('week');
      } else {
        return;
      }

      event.preventDefault();
    }

    window.addEventListener('keydown', handleKeyDown);

    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [panelOpen, step, changeView]);

  useEffect(() => {
    let active = true;

    setLoading(true);

    api
      .get<Agenda>('/agenda/day', {
        params: {
          year: selectedDate.getFullYear(),
          month: selectedDate.getMonth() + 1,
          day: selectedDate.getDate(),
        },
      })
      .then(response => {
        // Ignora respostas de um dia que já não está selecionado
        if (active) {
          setAgenda(response.data);
        }
      })
      .catch(err => {
        if (active) {
          addToast({
            type: 'error',
            title: 'Erro ao carregar a agenda',
            description: getApiErrorMessage(
              err,
              'Não foi possível carregar os agendamentos, tente novamente.',
            ),
          });
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [selectedDate, addToast, refreshKey]);

  const appointments = useMemo(
    () => parseAppointments(agenda.appointments),
    [agenda.appointments],
  );

  const blocks = useMemo(() => parseBlocks(agenda.blocks), [agenda.blocks]);

  // Do início do expediente mais cedo ao fim do mais tarde, incluindo
  // agendamentos que por algum motivo estejam fora desse intervalo
  const [startHour, endHour] = useMemo(
    () =>
      hourRange(
        agenda.providers.flatMap(provider =>
          provider.schedule ? [provider.schedule] : [],
        ),
        appointments,
      ),
    [agenda.providers, appointments],
  );

  const hours = useMemo(
    () =>
      Array.from(
        { length: endHour - startHour },
        (_, index) => startHour + index,
      ),
    [startHour, endHour],
  );

  const gridHeaderRef = useRef<HTMLDivElement>(null);
  const hourHeight = useHourHeight(
    gridHeaderRef,
    hours.length,
    `${agenda.providers.length}-${loading}-${view}`,
  );

  const compact = hourHeight < COMPACT_HOUR_HEIGHT;

  const selectedDateAsText = useMemo(
    () => format(selectedDate, "cccc, d 'de' MMMM 'de' yyyy", { locale: ptBR }),
    [selectedDate],
  );

  const nowLineTop = useMemo(() => {
    if (!isToday(selectedDate)) {
      return null;
    }

    const currentHour = now.getHours() + now.getMinutes() / 60;

    if (currentHour < startHour || currentHour > endHour) {
      return null;
    }

    return (currentHour - startHour) * hourHeight;
  }, [selectedDate, now, startHour, endHour, hourHeight]);

  const activeProviders = useMemo(
    () => agenda.providers.filter(provider => provider.active),
    [agenda.providers],
  );

  const countText = useMemo(() => {
    const count = view === 'week' ? weekCount : appointments.length;
    const suffix = view === 'week' ? ' na semana' : '';

    if (count === null || (view === 'day' && loading)) return 'Carregando...';
    if (count === 0) return `Nenhum agendamento${suffix}`;

    return count === 1
      ? `1 agendamento${suffix}`
      : `${count} agendamentos${suffix}`;
  }, [view, weekCount, appointments.length, loading]);

  const openDay = useCallback(
    (date: Date) => {
      setSelectedDate(startOfDay(date));
      changeView('day');
    },
    [changeView],
  );

  return (
    <AppLayout
      sidebarExtra={
        <Calendar>
          <DayPicker
            locale="pt-BR"
            weekdaysShort={['D', 'S', 'T', 'Q', 'Q', 'S', 'S']}
            months={MONTHS}
            month={selectedDate}
            selectedDays={
              view === 'week'
                ? { from: weekStart, to: endOfWeek(weekStart) }
                : selectedDate
            }
            onDayClick={day => setSelectedDate(startOfDay(day))}
          />
        </Calendar>
      }
    >
      <AgendaArea>
        <Toolbar>
          <TodayButton
            type="button"
            title="Hoje (T)"
            onClick={() => setSelectedDate(startOfDay(new Date()))}
          >
            Hoje
          </TodayButton>
          <NavButton
            type="button"
            title={view === 'week' ? 'Semana anterior (←)' : 'Dia anterior (←)'}
            onClick={() => setSelectedDate(addDays(selectedDate, -step))}
          >
            <FiChevronLeft />
          </NavButton>
          <NavButton
            type="button"
            title={view === 'week' ? 'Próxima semana (→)' : 'Próximo dia (→)'}
            onClick={() => setSelectedDate(addDays(selectedDate, step))}
          >
            <FiChevronRight />
          </NavButton>
          <h1>{view === 'week' ? weekTitle(weekStart) : selectedDateAsText}</h1>
          <span>{countText}</span>

          {view === 'week' && (
            <ProviderFilter
              aria-label="Barbeiro"
              value={providerFilter}
              onChange={event => setProviderFilter(event.target.value)}
            >
              <option value="all">Todos os barbeiros</option>
              {activeProviders.map(provider => (
                <option key={provider.id} value={provider.id}>
                  {provider.name}
                </option>
              ))}
            </ProviderFilter>
          )}

          <ViewSwitch role="group" aria-label="Visão da agenda">
            <button
              type="button"
              aria-pressed={view === 'day'}
              title="Dia (D)"
              onClick={() => changeView('day')}
            >
              Dia
            </button>
            <button
              type="button"
              aria-pressed={view === 'week'}
              title="Semana (S)"
              onClick={() => changeView('week')}
            >
              Semana
            </button>
          </ViewSwitch>
        </Toolbar>

        {view === 'week' && (
          <WeekView
            weekStart={weekStart}
            now={now}
            refreshKey={refreshKey}
            providerFilter={providerFilter}
            onCountChange={setWeekCount}
            onOpenDetails={openDetails}
            onSlotClick={openSlotMenu}
            onBlockClick={openBlockMenu}
            onOpenDay={openDay}
          />
        )}

        {view === 'day' && !loading && agenda.providers.length === 0 && (
          <EmptyState>Nenhum barbeiro cadastrado.</EmptyState>
        )}

        {view === 'day' && (loading || agenda.providers.length > 0) && (
          <Grid
            style={
              { '--hour-height': `${hourHeight}px` } as React.CSSProperties
            }
          >
            <GridHeader ref={gridHeaderRef} columns={agenda.providers.length}>
              <div />
              {agenda.providers.map(provider => (
                <ProviderHeader
                  key={provider.id}
                  color={providerColor(provider.id, agenda.providers)}
                >
                  <img
                    src={provider.avatar_url || avatarFallback(provider.name)}
                    alt={provider.name}
                    onError={e => {
                      e.currentTarget.src = avatarFallback(provider.name);
                    }}
                  />
                  <div>
                    <strong title={provider.name}>
                      {provider.name}
                      {provider.id === user.id && <YouBadge>Você</YouBadge>}
                    </strong>
                    <small>
                      {!provider.active && 'Desativado'}
                      {provider.active &&
                        (provider.schedule
                          ? `${provider.schedule.start_time} – ${provider.schedule.end_time}`
                          : 'Folga')}
                    </small>
                  </div>
                </ProviderHeader>
              ))}
            </GridHeader>

            <GridBody columns={agenda.providers.length}>
              <TimeColumn>
                {hours.map(hour => (
                  <span key={hour}>{`${String(hour).padStart(
                    2,
                    '0',
                  )}:00`}</span>
                ))}
              </TimeColumn>

              {agenda.providers.map(provider => {
                const color = providerColor(provider.id, agenda.providers);
                const workStart = provider.schedule
                  ? toHour(provider.schedule.start_time)
                  : null;
                const workEnd = provider.schedule
                  ? toHour(provider.schedule.end_time)
                  : null;

                return (
                  <ProviderColumn key={provider.id}>
                    {hours.map(hour => {
                      const off =
                        workStart === null ||
                        workEnd === null ||
                        hour < workStart ||
                        hour >= workEnd;
                      const hourEnd = new Date(selectedDate);
                      hourEnd.setHours(hour + 1, 0, 0, 0);
                      // Dentro do expediente e ainda não passou
                      // Barbeiro desativado não recebe novos agendamentos
                      const bookable =
                        !off && provider.active && isBefore(now, hourEnd);

                      if (!bookable) {
                        return <HourCell key={hour} off={off} />;
                      }

                      const label = `${String(hour).padStart(2, '0')}:00`;

                      return (
                        <HourCell
                          key={hour}
                          as="button"
                          type="button"
                          off={false}
                          bookable
                          aria-label={`Agendar com ${provider.name} às ${label}`}
                          title={`Agendar com ${provider.name} a partir de ${label}`}
                          onClick={(event: React.MouseEvent<HTMLElement>) => {
                            // A altura do clique na hora escolhe os minutos,
                            // de 15 em 15 (pelo teclado, a hora cheia)
                            const offset = event.nativeEvent.offsetY || 0;
                            const quarter = Math.min(
                              3,
                              Math.max(
                                0,
                                Math.floor((offset / hourHeight) * 4),
                              ),
                            );
                            const start = new Date(selectedDate);
                            start.setHours(hour, quarter * 15, 0, 0);

                            openSlotMenu(
                              { provider, start, color },
                              clickPoint(event),
                            );
                          }}
                        />
                      );
                    })}

                    {!provider.schedule && <DayOffLabel>Folga</DayOffLabel>}

                    {blocks
                      .filter(block => block.provider_id === provider.id)
                      .map(block => (
                        <AgendaBlockCard
                          key={block.id}
                          block={block}
                          day={selectedDate}
                          startHour={startHour}
                          endHour={endHour}
                          hourHeight={hourHeight}
                          color={color}
                          providerName={provider.name}
                          onClick={(target, point) =>
                            openBlockMenu(
                              { block: target, providerName: provider.name },
                              point,
                            )
                          }
                        />
                      ))}

                    {appointments
                      .filter(item => item.provider_id === provider.id)
                      .map(appointment => {
                        const { parsedDate, parsedEnd, parsedBlockedUntil } =
                          appointment;
                        const top =
                          (parsedDate.getHours() +
                            parsedDate.getMinutes() / 60 -
                            startHour) *
                          hourHeight;
                        // Altura proporcional à duração do serviço
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

                        // Intervalo depois do atendimento: do fim do card
                        // até blocked_until (sem intervalo, não aparece)
                        const cardBottom = top + 2 + height;
                        const bufferEnd =
                          (parsedBlockedUntil.getHours() +
                            parsedBlockedUntil.getMinutes() / 60 -
                            startHour) *
                          hourHeight;
                        const bufferTop = cardBottom + 1;
                        const bufferHeight = bufferEnd - 1 - bufferTop;
                        const bufferRange = `${format(
                          parsedEnd,
                          'HH:mm',
                        )} – ${format(parsedBlockedUntil, 'HH:mm')}`;

                        return (
                          <React.Fragment key={appointment.id}>
                            {bufferHeight > 2 && (
                              <BufferStrip
                                color={color}
                                past={!isBefore(now, parsedBlockedUntil)}
                                style={{
                                  top: bufferTop,
                                  height: bufferHeight,
                                }}
                                title={`Intervalo ${bufferRange}`}
                              >
                                {bufferHeight >= 12 && <span>intervalo</span>}
                              </BufferStrip>
                            )}
                            <AppointmentCard
                              type="button"
                              onClick={event =>
                                openDetails(
                                  {
                                    appointment,
                                    provider,
                                    color,
                                    providers: activeProviders,
                                  },
                                  event.currentTarget,
                                )
                              }
                              aria-haspopup="dialog"
                              color={color}
                              // Esmaece só depois de terminar
                              past={!isBefore(now, parsedEnd)}
                              attendance={
                                appointment.attendance ||
                                (isBefore(now, parsedDate) ? null : 'pending')
                              }
                              confirmed={
                                !!appointment.confirmed_at &&
                                isBefore(now, parsedDate)
                              }
                              // Cards baixos (horas baixas ou serviços curtos)
                              // mostram só horário e cliente numa linha
                              compact={compact || height < COMPACT_CARD_HEIGHT}
                              style={{ top: top + 2, height }}
                              title={`${timeRange} · ${clientName} · ${serviceName} · ${provider.name}`}
                            >
                              <time>{timeRange}</time>
                              <strong>{clientName}</strong>
                              <small>{serviceName}</small>
                            </AppointmentCard>
                          </React.Fragment>
                        );
                      })}
                  </ProviderColumn>
                );
              })}

              {nowLineTop !== null && <NowLine style={{ top: nowLineTop }} />}
            </GridBody>
          </Grid>
        )}
      </AgendaArea>

      {details && (
        <AppointmentDetails
          appointment={details.appointment}
          provider={details.provider}
          color={details.color}
          now={now}
          onClose={closeDetails}
          providers={details.providers}
          onChanged={handleAppointmentChanged}
        />
      )}

      {slotMenu && (
        <SlotMenu
          x={slotMenu.x}
          y={slotMenu.y}
          providerName={slotMenu.provider.name}
          start={slotMenu.start}
          onClose={() => setSlotMenu(null)}
          onNewAppointment={() => {
            const { provider, start, color } = slotMenu;

            setSlotMenu(null);
            setNewSlot({ provider, start, color });
          }}
          onBlock={() => {
            const { provider, start, color } = slotMenu;

            setSlotMenu(null);
            setBlockSlot({ provider, start, color });
          }}
        />
      )}

      {blockMenu && (
        <BlockMenu
          x={blockMenu.x}
          y={blockMenu.y}
          block={blockMenu.block}
          providerName={blockMenu.providerName}
          removing={removingBlock}
          onRemove={removeBlock}
          onClose={() => setBlockMenu(null)}
        />
      )}

      {blockSlot && (
        <BlockModal
          provider={blockSlot.provider}
          start={blockSlot.start}
          color={blockSlot.color}
          providers={
            // Na visão semanal os barbeiros do dia não estão carregados
            activeProviders.length > 0 ? activeProviders : [blockSlot.provider]
          }
          onClose={() => setBlockSlot(null)}
          onCreated={handleAppointmentChanged}
        />
      )}

      {newSlot && (
        <NewAppointment
          provider={newSlot.provider}
          start={newSlot.start}
          color={newSlot.color}
          onClose={() => setNewSlot(null)}
          onCreated={handleAppointmentChanged}
        />
      )}
    </AppLayout>
  );
};

export default Dashboard;
