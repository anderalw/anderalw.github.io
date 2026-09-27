import React, { useState, useEffect, useMemo } from 'react';
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
  FiChevronLeft,
  FiChevronRight,
} from 'react-icons/fi';
import { Link } from 'react-router-dom';
import {
  HOUR_HEIGHT,
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
  provider_id: string;
  client: { id: string; name: string; phone: string } | null;
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
      starts.push(appointment.parsedDate.getHours());
      ends.push(appointment.parsedDate.getHours() + 1);
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

    return (currentHour - startHour) * HOUR_HEIGHT;
  }, [selectedDate, now, startHour, endHour]);

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
            <AdminLink to="/admin/create-provider">
              <FiUserPlus />
              Cadastrar barbeiro
            </AdminLink>
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
            <Grid>
              <GridHeader columns={agenda.providers.length}>
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
                          const { parsedDate } = appointment;
                          const top =
                            (parsedDate.getHours() +
                              parsedDate.getMinutes() / 60 -
                              startHour) *
                            HOUR_HEIGHT;
                          const clientName =
                            appointment.client?.name || 'Cliente removido';
                          const timeRange = `${format(
                            parsedDate,
                            'HH:mm',
                          )} – ${format(
                            new Date(parsedDate.getTime() + 60 * 60 * 1000),
                            'HH:mm',
                          )}`;

                          return (
                            <AppointmentCard
                              key={appointment.id}
                              color={color}
                              past={isBefore(parsedDate, now)}
                              style={{ top: top + 2, height: HOUR_HEIGHT - 4 }}
                              title={`${timeRange} · ${clientName} · ${provider.name}`}
                            >
                              <time>{timeRange}</time>
                              <strong>{clientName}</strong>
                              {appointment.client?.phone && (
                                <small>{appointment.client.phone}</small>
                              )}
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
    </Container>
  );
};

export default Dashboard;
