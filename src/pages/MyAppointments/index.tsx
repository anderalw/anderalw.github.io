import React, { useCallback, useEffect, useState } from 'react';
import { format, parseISO } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';

import api from '../../services/api';
import { useAuth } from '../../hooks/Auth';
import { useToast } from '../../hooks/Toast';
import getApiErrorMessage from '../../utils/getApiErrorMessage';
import { formatPrice } from '../../utils/money';
import RescheduleForm from '../../components/RescheduleForm';

import {
  Container,
  Content,
  TopBar,
  NavLink,
  Item,
  ItemActions,
  Panel,
  Hint,
  Empty,
} from './styles';

interface ClientAppointment {
  id: string;
  date: string;
  end_date: string;
  provider: { id: string; name: string; avatar_url: string | null };
  service: { id: string; name: string } | null;
  price_cents: number | null;
  // Ainda dá tempo de o cliente cancelar ou remarcar sozinho
  can_change: boolean;
}

interface Provider {
  id: string;
  name: string;
}

// Um agendamento por vez fica em modo de remarcar ou de confirmar cancelamento
type ActiveAction = { id: string; type: 'reschedule' | 'cancel' } | null;

function avatarFallback(name: string): string {
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(
    name,
  )}&background=28262e&color=ff9000`;
}

function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

const MyAppointments: React.FC = () => {
  const { client, signOut } = useAuth();
  const { addToast } = useToast();

  const [appointments, setAppointments] = useState<ClientAppointment[]>([]);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [action, setAction] = useState<ActiveAction>(null);
  const [canceling, setCanceling] = useState(false);

  const loadAppointments = useCallback(async () => {
    try {
      const response = await api.get<ClientAppointment[]>('/appointments/mine');
      setAppointments(response.data);
    } catch (err) {
      addToast({
        type: 'error',
        title: 'Erro ao carregar',
        description: getApiErrorMessage(
          err,
          'Não foi possível carregar seus agendamentos, tente novamente.',
        ),
      });
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    loadAppointments();

    api.get<Provider[]>('/providers').then(response => {
      setProviders(response.data);
    });
  }, [loadAppointments]);

  const handleCancel = useCallback(
    async (appointment: ClientAppointment) => {
      setCanceling(true);

      try {
        await api.patch(`/appointments/${appointment.id}/cancel`);

        addToast({
          type: 'success',
          title: 'Agendamento cancelado',
          description: `${
            appointment.service?.name || 'Agendamento'
          } em ${format(parseISO(appointment.date), "dd/MM 'às' HH:mm")}.`,
        });

        setAction(null);
        await loadAppointments();
      } catch (err) {
        addToast({
          type: 'error',
          title: 'Não foi possível cancelar',
          description: getApiErrorMessage(
            err,
            'Ocorreu um erro ao cancelar, tente novamente.',
          ),
        });
      } finally {
        setCanceling(false);
      }
    },
    [addToast, loadAppointments],
  );

  const handleRescheduled = useCallback(
    async (newDate: Date) => {
      addToast({
        type: 'success',
        title: 'Agendamento remarcado',
        description: `Novo horário: ${format(
          newDate,
          "dd/MM/yyyy 'às' HH:mm",
        )}.`,
      });

      setAction(null);
      await loadAppointments();
    },
    [addToast, loadAppointments],
  );

  return (
    <Container>
      <Content>
        <TopBar>
          <span>
            Olá, <strong style={{ color: '#ff9000' }}>{client?.name}</strong>
          </span>
          <div>
            <NavLink to="/agendar">Agendar horário</NavLink>
            <button type="button" onClick={signOut}>
              Sair
            </button>
          </div>
        </TopBar>

        <h1>Meus agendamentos</h1>

        {!loading && appointments.length === 0 && (
          <Empty>
            Você não tem agendamentos marcados.
            <br />
            <NavLink to="/agendar">Agendar um horário</NavLink>
          </Empty>
        )}

        {appointments.map(appointment => {
          const start = parseISO(appointment.date);
          const end = parseISO(appointment.end_date);
          const isActive = action?.id === appointment.id;

          return (
            <Item key={appointment.id}>
              <header>
                <div>
                  <h2>{appointment.service?.name || 'Serviço'}</h2>
                  <time dateTime={appointment.date}>
                    {`${capitalize(
                      format(start, "EEEE, d 'de' MMMM", { locale: ptBR }),
                    )} · ${format(start, 'HH:mm')} – ${format(end, 'HH:mm')}`}
                  </time>
                </div>
                {appointment.price_cents !== null && (
                  <span className="price">
                    {formatPrice(appointment.price_cents)}
                  </span>
                )}
              </header>

              <div className="provider">
                <img
                  src={
                    appointment.provider.avatar_url ||
                    avatarFallback(appointment.provider.name)
                  }
                  alt=""
                  onError={e => {
                    e.currentTarget.src = avatarFallback(
                      appointment.provider.name,
                    );
                  }}
                />
                {`com ${appointment.provider.name}`}
              </div>

              {!appointment.can_change && (
                <Hint>
                  Faltam menos de 2 horas: para cancelar ou remarcar, entre em
                  contato com a barbearia.
                </Hint>
              )}

              {appointment.can_change && !isActive && (
                <ItemActions>
                  <button
                    type="button"
                    className="secondary"
                    onClick={() =>
                      setAction({ id: appointment.id, type: 'reschedule' })
                    }
                  >
                    Remarcar
                  </button>
                  <button
                    type="button"
                    className="danger"
                    onClick={() =>
                      setAction({ id: appointment.id, type: 'cancel' })
                    }
                  >
                    Cancelar
                  </button>
                </ItemActions>
              )}

              {isActive && action?.type === 'reschedule' && (
                <Panel>
                  <RescheduleForm
                    appointmentId={appointment.id}
                    currentProviderId={appointment.provider.id}
                    currentDate={start}
                    providers={providers}
                    onCancel={() => setAction(null)}
                    onRescheduled={handleRescheduled}
                  />
                </Panel>
              )}

              {isActive && action?.type === 'cancel' && (
                <Panel>
                  <p>Tem certeza que deseja cancelar este agendamento?</p>
                  <ItemActions>
                    <button
                      type="button"
                      className="secondary"
                      onClick={() => setAction(null)}
                    >
                      Voltar
                    </button>
                    <button
                      type="button"
                      className="danger"
                      disabled={canceling}
                      onClick={() => handleCancel(appointment)}
                    >
                      {canceling ? 'Cancelando...' : 'Sim, cancelar'}
                    </button>
                  </ItemActions>
                </Panel>
              )}
            </Item>
          );
        })}
      </Content>
    </Container>
  );
};

export default MyAppointments;
