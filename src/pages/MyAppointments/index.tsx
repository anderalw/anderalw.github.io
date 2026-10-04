import React, { useCallback, useEffect, useState } from 'react';
import { format, parseISO } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';
import { useHistory } from 'react-router-dom';
import { FiCalendar, FiPlus, FiRefreshCw, FiRepeat, FiX } from 'react-icons/fi';

import api from '../../services/api';
import { useToast } from '../../hooks/Toast';
import getApiErrorMessage from '../../utils/getApiErrorMessage';
import { formatPrice } from '../../utils/money';
import avatarFallback from '../../utils/avatarFallback';
import RescheduleForm from '../../components/RescheduleForm';
import ClubPanel from './ClubPanel';
import AppLayout from '../../components/AppLayout';
import { Page, PageHeader, UIButton } from '../../components/ui';

import {
  List,
  Item,
  Row,
  DateBadge,
  Info,
  Price,
  ItemActions,
  Hint,
  Panel,
  PanelActions,
  ItemSkeleton,
  Empty,
  HistoryTitle,
  HistoryItem,
  HistoryStatus,
} from './styles';

interface ClientAppointment {
  id: string;
  date: string;
  end_date: string;
  provider: { id: string; name: string; avatar_url: string | null };
  service: { id: string; name: string } | null;
  price_cents: number | null;
  // Clube: coberto pelo plano (preço 0) / preço normal quando houve benefício
  included: boolean;
  list_price_cents: number | null;
  // Ainda dá tempo de o cliente cancelar ou remarcar sozinho
  can_change: boolean;
}

// Horário que já passou
interface PastAppointment {
  id: string;
  date: string;
  provider: { id: string; name: string; avatar_url: string | null };
  service: { id: string; name: string } | null;
  price_cents: number | null;
  included: boolean;
  attendance: 'completed' | 'no_show' | null;
}

// Sem registro da barbearia, não mostra situação
const PAST_STATUS: Record<
  'completed' | 'no_show',
  { label: string; tone: 'ok' | 'missed' | 'neutral' }
> = {
  completed: { label: 'Atendido', tone: 'ok' },
  no_show: { label: 'Faltou', tone: 'missed' },
};

interface Provider {
  id: string;
  name: string;
}

// Um agendamento por vez fica em modo de remarcar ou de confirmar cancelamento
type ActiveAction = { id: string; type: 'reschedule' | 'cancel' } | null;

const MyAppointments: React.FC = () => {
  const { addToast } = useToast();
  const history = useHistory();

  const [appointments, setAppointments] = useState<ClientAppointment[]>([]);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [action, setAction] = useState<ActiveAction>(null);
  const [canceling, setCanceling] = useState(false);
  const [past, setPast] = useState<PastAppointment[]>([]);

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
    api
      .get<PastAppointment[]>('/appointments/mine/history')
      .then(response => setPast(response.data))
      .catch(() => {
        // Sem o histórico, os próximos horários continuam na tela
      });

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

  const newAppointmentButton = (
    <UIButton type="button" onClick={() => history.push('/agendar')}>
      <FiPlus />
      Novo agendamento
    </UIButton>
  );

  return (
    <AppLayout>
      <Page>
        <PageHeader>
          <div>
            <h1>Meus agendamentos</h1>
            <p>Seus próximos horários na barbearia e os anteriores.</p>
          </div>
          {appointments.length > 0 && <div>{newAppointmentButton}</div>}
        </PageHeader>

        <ClubPanel />

        {loading && (
          <List>
            <ItemSkeleton />
            <ItemSkeleton />
          </List>
        )}

        {!loading && appointments.length === 0 && (
          <Empty>
            <FiCalendar />
            Você não tem agendamentos marcados.
            {newAppointmentButton}
          </Empty>
        )}

        <List>
          {appointments.map(appointment => {
            const start = parseISO(appointment.date);
            const end = parseISO(appointment.end_date);
            const isActive = action?.id === appointment.id;

            return (
              <Item key={appointment.id}>
                <Row>
                  <DateBadge aria-hidden="true">
                    <small>{format(start, 'EEE', { locale: ptBR })}</small>
                    <strong>{format(start, 'dd')}</strong>
                    <small>{format(start, 'MMM', { locale: ptBR })}</small>
                  </DateBadge>

                  <Info>
                    <h2>{appointment.service?.name || 'Serviço'}</h2>
                    <time dateTime={appointment.date}>
                      {`${format(start, "EEEE, d 'de' MMMM", {
                        locale: ptBR,
                      })} · ${format(start, 'HH:mm')} – ${format(
                        end,
                        'HH:mm',
                      )}`}
                    </time>
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
                  </Info>

                  {appointment.included && <Price>Incluso no plano</Price>}
                  {!appointment.included &&
                    appointment.price_cents !== null && (
                      <Price>{formatPrice(appointment.price_cents)}</Price>
                    )}

                  {appointment.can_change ? (
                    <ItemActions>
                      <UIButton
                        type="button"
                        variant="secondary"
                        size="sm"
                        disabled={isActive}
                        onClick={() =>
                          setAction({ id: appointment.id, type: 'reschedule' })
                        }
                      >
                        <FiRepeat />
                        Remarcar
                      </UIButton>
                      <UIButton
                        type="button"
                        variant="danger"
                        size="sm"
                        disabled={isActive}
                        onClick={() =>
                          setAction({ id: appointment.id, type: 'cancel' })
                        }
                      >
                        <FiX />
                        Cancelar
                      </UIButton>
                    </ItemActions>
                  ) : (
                    <Hint>
                      Faltam menos de 2 horas: para cancelar ou remarcar, fale
                      com a barbearia.
                    </Hint>
                  )}
                </Row>

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
                    <PanelActions>
                      <UIButton
                        type="button"
                        variant="secondary"
                        onClick={() => setAction(null)}
                      >
                        Voltar
                      </UIButton>
                      <UIButton
                        type="button"
                        variant="danger"
                        disabled={canceling}
                        onClick={() => handleCancel(appointment)}
                      >
                        {canceling ? 'Cancelando...' : 'Sim, cancelar'}
                      </UIButton>
                    </PanelActions>
                  </Panel>
                )}
              </Item>
            );
          })}
        </List>

        {past.length > 0 && (
          <section aria-label="Horários anteriores" style={{ maxWidth: 880 }}>
            <HistoryTitle>Anteriores</HistoryTitle>
            {past.map(item => {
              const status = item.attendance
                ? PAST_STATUS[item.attendance]
                : null;
              const again = new URLSearchParams();

              if (item.service) again.set('servico', item.service.id);
              again.set('barbeiro', item.provider.id);

              return (
                <HistoryItem key={item.id}>
                  <div>
                    <strong>{item.service?.name || 'Serviço'}</strong>
                    <small>
                      {`${format(
                        parseISO(item.date),
                        "dd/MM/yyyy 'às' HH:mm",
                      )} · com ${item.provider.name}`}
                      {item.included && ' · Incluso no plano'}
                      {!item.included &&
                        item.price_cents !== null &&
                        ` · ${formatPrice(item.price_cents)}`}
                    </small>
                  </div>
                  {status && (
                    <HistoryStatus tone={status.tone}>
                      {status.label}
                    </HistoryStatus>
                  )}
                  <UIButton
                    type="button"
                    variant="secondary"
                    size="sm"
                    title="Mesmo serviço, com o mesmo barbeiro"
                    onClick={() => history.push(`/agendar?${again.toString()}`)}
                  >
                    <FiRefreshCw />
                    Agendar de novo
                  </UIButton>
                </HistoryItem>
              );
            })}
          </section>
        )}
      </Page>
    </AppLayout>
  );
};

export default MyAppointments;
