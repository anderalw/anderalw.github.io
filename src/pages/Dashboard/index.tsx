import React, {
  useState,
  useEffect,
  useLayoutEffect,
  useCallback,
  useMemo,
  useRef,
} from 'react';
import {
  addDays,
  format,
  isBefore,
  isToday,
  parseISO,
  startOfDay,
} from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';
import DayPicker from 'react-day-picker';
import 'react-day-picker/lib/style.css';
import {
  FiPower,
  FiUserPlus,
  FiScissors,
  FiChevronLeft,
  FiChevronRight,
} from 'react-icons/fi';
import { Link } from 'react-router-dom';
import {
  MIN_HOUR_HEIGHT,
  MAX_HOUR_HEIGHT,
  COMPACT_HOUR_HEIGHT,
  Container,
  Header,
  HeaderContent,
  AdminLink,
  Profile,
  Content,
  Sidebar,
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
  NowLine,
  EmptyState,
} from './styles';
import logoImg from '../../assets/logo.svg';
import { useAuth } from '../../hooks/Auth';
import { useToast } from '../../hooks/Toast';
import api from '../../services/api';
import getApiErrorMessage from '../../utils/getApiErrorMessage';
import AppointmentDetails from './AppointmentDetails';

interface AgendaProvider {
  id: string;
  name: string;
  avatar_url: string | null;
  // null = folga neste dia da semana
  schedule: { start_time: string; end_time: string } | null;
}

interface AgendaAppointment {
  id: string;
  date: string;
  // Fim do atendimento: início + duração do serviço
  end_date: string;
  provider_id: string;
  // null em agendamentos anteriores ao cadastro de serviços
  service: { id: string; name: string } | null;
  price_cents: number | null;
  created_at: string;
  client: { id: string; name: string; email: string; phone: string } | null;
}

interface Agenda {
  providers: AgendaProvider[];
  appointments: AgendaAppointment[];
}

// Uma cor por barbeiro, como os calendários do Google Agenda
const PROVIDER_COLORS = [
  '#ff9000',
  '#4dabf7',
  '#51cf66',
  '#cc5de8',
  '#ff6b6b',
  '#20c997',
  '#fcc419',
  '#748ffc',
];

// Intervalo mostrado quando ninguém trabalha no dia
const DEFAULT_START_HOUR = 8;
const DEFAULT_END_HOUR = 18;

// Serviços curtos (ex: 15 min) ainda precisam de um card clicável
const MIN_CARD_HEIGHT = 18;
// Abaixo desta altura o card mostra só horário e cliente, numa linha
const COMPACT_CARD_HEIGHT = 44;

const MONTHS = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
];

function toHour(time: string): number {
  return Number(time.split(':')[0]);
}

function avatarFallback(name: string): string {
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(
    name,
  )}&background=28262e&color=ff9000`;
}

const Dashboard: React.FC = () => {
  const { user, signOut } = useAuth();
  const { addToast } = useToast();
  const [selectedDate, setSelectedDate] = useState(() =>
    startOfDay(new Date()),
  );
  const [agenda, setAgenda] = useState<Agenda>({
    providers: [],
    appointments: [],
  });
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState(new Date());
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<
    string | null
  >(null);
  // Card que abriu os detalhes, para devolver o foco a ele ao fechar
  const openerRef = useRef<HTMLElement | null>(null);

  const openDetails = useCallback((appointmentId: string, opener: HTMLElement) => {
    openerRef.current = opener;
    setSelectedAppointmentId(appointmentId);
  }, []);

  const closeDetails = useCallback(() => {
    setSelectedAppointmentId(null);
    openerRef.current?.focus();
  }, []);

  // Atualiza a linha da hora atual a cada minuto
  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 60 * 1000);

    return () => clearInterval(interval);
  }, []);

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
  }, [selectedDate, addToast]);

  const appointments = useMemo(
    () =>
      agenda.appointments.map(appointment => ({
        ...appointment,
        parsedDate: parseISO(appointment.date),
        parsedEnd: parseISO(appointment.end_date),
      })),
    [agenda.appointments],
  );

  // Do início do expediente mais cedo ao fim do mais tarde, incluindo
  // agendamentos que por algum motivo estejam fora desse intervalo
  const [startHour, endHour] = useMemo(() => {
    const starts: number[] = [];
    const ends: number[] = [];

    agenda.providers.forEach(provider => {
      if (provider.schedule) {
        starts.push(toHour(provider.schedule.start_time));
        ends.push(toHour(provider.schedule.end_time));
      }
    });

    appointments.forEach(appointment => {
      const end = appointment.parsedEnd;

      starts.push(appointment.parsedDate.getHours());
      // Um atendimento que termina às 10:15 precisa da linha das 10h
      ends.push(Math.ceil(end.getHours() + end.getMinutes() / 60));
    });

    if (starts.length === 0) {
      return [DEFAULT_START_HOUR, DEFAULT_END_HOUR];
    }

    return [Math.min(...starts), Math.max(...ends)];
  }, [agenda.providers, appointments]);

  const hours = useMemo(
    () =>
      Array.from(
        { length: endHour - startHour },
        (_, index) => startHour + index,
      ),
    [startHour, endHour],
  );

  const gridHeaderRef = useRef<HTMLDivElement>(null);
  const [hourHeight, setHourHeight] = useState(64);

  // Divide o espaço livre abaixo do cabeçalho dos barbeiros pelas horas do
  // dia, para a agenda caber na tela sem barra de rolagem
  useLayoutEffect(() => {
    function fitToScreen(): void {
      const gridHeader = gridHeaderRef.current;

      if (!gridHeader || hours.length === 0) {
        return;
      }

      const bodyTop = gridHeader.getBoundingClientRect().bottom;
      // Espaço inferior do <main> (padding de 24px)
      const available = window.innerHeight - bodyTop - 24;
      const fitted = Math.floor(available / hours.length);

      setHourHeight(
        Math.min(MAX_HOUR_HEIGHT, Math.max(MIN_HOUR_HEIGHT, fitted)),
      );
    }

    fitToScreen();
    window.addEventListener('resize', fitToScreen);

    return () => window.removeEventListener('resize', fitToScreen);
  }, [hours.length, agenda.providers.length, loading]);

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

  // Agendamento aberto no painel de detalhes, com o barbeiro e a cor dele
  const selectedDetails = useMemo(() => {
    const appointment = appointments.find(
      item => item.id === selectedAppointmentId,
    );

    if (!appointment) {
      return null;
    }

    const providerIndex = agenda.providers.findIndex(
      provider => provider.id === appointment.provider_id,
    );

    if (providerIndex === -1) {
      return null;
    }

    return {
      appointment,
      provider: agenda.providers[providerIndex],
      color: PROVIDER_COLORS[providerIndex % PROVIDER_COLORS.length],
    };
  }, [appointments, agenda.providers, selectedAppointmentId]);

  const appointmentsCountText = useMemo(() => {
    const count = appointments.length;

    if (count === 0) return 'Nenhum agendamento';

    return count === 1 ? '1 agendamento' : `${count} agendamentos`;
  }, [appointments.length]);

  return (
    <Container>
      <Header>
        <HeaderContent>
          <img src={logoImg} alt="GoBarber" />

          <Profile>
            <img
              src={user.avatar_url || avatarFallback(user.name)}
              alt={user.name}
              onError={e => {
                e.currentTarget.src = avatarFallback(user.name);
              }}
            />

            <div>
              <span>Bem-vindo,</span>
              <Link to="/profile">
                <strong>{user.name}</strong>
              </Link>
            </div>
          </Profile>

          {user.is_admin && (
            <>
              <AdminLink to="/admin/services">
                <FiScissors />
                Serviços
              </AdminLink>
              <AdminLink to="/admin/create-provider">
                <FiUserPlus />
                Cadastrar barbeiro
              </AdminLink>
            </>
          )}

          <button type="button" onClick={signOut}>
            <FiPower />
          </button>
        </HeaderContent>
      </Header>

      <Content>
        <Sidebar>
          <DayPicker
            locale="pt-BR"
            weekdaysShort={['D', 'S', 'T', 'Q', 'Q', 'S', 'S']}
            months={MONTHS}
            month={selectedDate}
            selectedDays={selectedDate}
            onDayClick={day => setSelectedDate(startOfDay(day))}
          />
        </Sidebar>

        <AgendaArea>
          <Toolbar>
            <TodayButton
              type="button"
              onClick={() => setSelectedDate(startOfDay(new Date()))}
            >
              Hoje
            </TodayButton>
            <NavButton
              type="button"
              title="Dia anterior"
              onClick={() => setSelectedDate(addDays(selectedDate, -1))}
            >
              <FiChevronLeft />
            </NavButton>
            <NavButton
              type="button"
              title="Próximo dia"
              onClick={() => setSelectedDate(addDays(selectedDate, 1))}
            >
              <FiChevronRight />
            </NavButton>

            <h1>{selectedDateAsText}</h1>

            <span>{loading ? 'Carregando...' : appointmentsCountText}</span>
          </Toolbar>

          {!loading && agenda.providers.length === 0 ? (
            <EmptyState>Nenhum barbeiro cadastrado.</EmptyState>
          ) : (
            <Grid
              style={
                { '--hour-height': `${hourHeight}px` } as React.CSSProperties
              }
            >
              <GridHeader ref={gridHeaderRef} columns={agenda.providers.length}>
                <div />
                {agenda.providers.map((provider, index) => (
                  <ProviderHeader
                    key={provider.id}
                    color={PROVIDER_COLORS[index % PROVIDER_COLORS.length]}
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
                        {provider.schedule
                          ? `${provider.schedule.start_time} – ${provider.schedule.end_time}`
                          : 'Folga'}
                      </small>
                    </div>
                  </ProviderHeader>
                ))}
              </GridHeader>

              <GridBody columns={agenda.providers.length}>
                <TimeColumn>
                  {hours.map(hour => (
                    <span key={hour}>{`${String(hour).padStart(2, '0')}:00`}</span>
                  ))}
                </TimeColumn>

                {agenda.providers.map((provider, index) => {
                  const color = PROVIDER_COLORS[index % PROVIDER_COLORS.length];
                  const workStart = provider.schedule
                    ? toHour(provider.schedule.start_time)
                    : null;
                  const workEnd = provider.schedule
                    ? toHour(provider.schedule.end_time)
                    : null;

                  return (
                    <ProviderColumn key={provider.id}>
                      {hours.map(hour => (
                        <HourCell
                          key={hour}
                          off={
                            workStart === null ||
                            workEnd === null ||
                            hour < workStart ||
                            hour >= workEnd
                          }
                        />
                      ))}

                      {!provider.schedule && <DayOffLabel>Folga</DayOffLabel>}

                      {appointments
                        .filter(item => item.provider_id === provider.id)
                        .map(appointment => {
                          const { parsedDate, parsedEnd } = appointment;
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
                            appointment.service?.name ||
                            'Serviço não informado';
                          const timeRange = `${format(
                            parsedDate,
                            'HH:mm',
                          )} – ${format(parsedEnd, 'HH:mm')}`;

                          return (
                            <AppointmentCard
                              key={appointment.id}
                              type="button"
                              onClick={event =>
                                openDetails(appointment.id, event.currentTarget)
                              }
                              aria-haspopup="dialog"
                              color={color}
                              // Esmaece só depois de terminar
                              past={!isBefore(now, parsedEnd)}
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
      </Content>

      {selectedDetails && (
        <AppointmentDetails
          appointment={selectedDetails.appointment}
          provider={selectedDetails.provider}
          color={selectedDetails.color}
          now={now}
          onClose={closeDetails}
        />
      )}
    </Container>
  );
};

export default Dashboard;
