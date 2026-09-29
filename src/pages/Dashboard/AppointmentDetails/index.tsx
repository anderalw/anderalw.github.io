import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { differenceInMinutes, format, isBefore, parseISO } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';
import {
  FiAlertTriangle,
  FiCalendar,
  FiCheckCircle,
  FiClock,
  FiDollarSign,
  FiFileText,
  FiMail,
  FiPhone,
  FiScissors,
  FiRepeat,
  FiTag,
  FiUserX,
  FiX,
  FiXCircle,
} from 'react-icons/fi';

import api from '../../../services/api';
import { useToast } from '../../../hooks/Toast';
import getApiErrorMessage from '../../../utils/getApiErrorMessage';
import { formatPrice } from '../../../utils/money';
import RescheduleForm from '../../../components/RescheduleForm';
import avatarFallback from '../../../utils/avatarFallback';
import { formatPhone, phoneHref as toPhoneHref } from '../../../utils/phone';
import { AgendaClient } from '../agenda';
import { AlertTag } from '../../Clients/styles';

import {
  WideDialog,
  DialogHeader,
  Columns,
  Aside,
  MainStack,
} from '../modalLayout';
import {
  Overlay,
  RescheduleArea,
  ActionCard,
  AttendanceCard,
  UndoButton,
  CreatedAt,
  ConfirmationNote,
  StatusBadge,
  AppointmentStatus,
  CloseButton,
  DetailList,
  PanelActions,
  SecondaryButton,
  DangerButton,
  ConfirmText,
  SectionTitle,
  HeaderBadges,
  ClientMeta,
  NotesText,
} from './styles';

export interface AppointmentDetailsData {
  id: string;
  parsedDate: Date;
  parsedEnd: Date;
  service: { id: string; name: string } | null;
  price_cents: number | null;
  // Registrado depois do horário; null = a confirmar
  attendance: 'completed' | 'no_show' | null;
  confirmed_at: string | null;
  // Barbeiro que registrou a confirmação; null = o cliente, pelo link
  confirmed_by: { id: string; name: string } | null;
  confirmation_requested_at: string | null;
  created_at: string;
  client: AgendaClient | null;
}

interface AppointmentDetailsProps {
  appointment: AppointmentDetailsData;
  provider: { id: string; name: string; avatar_url: string | null };
  // Barbeiros para onde o agendamento pode ser remarcado
  providers: Array<{ id: string; name: string }>;
  color: string;
  now: Date;
  onClose(): void;
  // Depois de cancelar ou remarcar: recarregar a agenda e avisar
  onChanged(message: { title: string; description: string }): void;
}

type Mode = 'view' | 'reschedule' | 'confirm-cancel';

const STATUS_LABELS: Record<AppointmentStatus, string> = {
  upcoming: 'Agendado',
  confirmed: 'Confirmado',
  ongoing: 'Em andamento',
  pending: 'A confirmar',
  completed: 'Atendido',
  no_show: 'Cliente faltou',
};

// "12 atendimentos · 1 falta · última visita em 12/09"
function clientHistoryText(client: AgendaClient): string {
  if (client.completed === 0 && client.no_shows === 0) {
    return 'Primeira visita';
  }

  const parts = [
    `${client.completed} ${
      client.completed === 1 ? 'atendimento' : 'atendimentos'
    }`,
  ];

  if (client.no_shows > 0) {
    parts.push(
      `${client.no_shows} ${client.no_shows === 1 ? 'falta' : 'faltas'}`,
    );
  }

  if (client.last_visit) {
    parts.push(
      `última visita em ${format(parseISO(client.last_visit), 'dd/MM')}`,
    );
  }

  return parts.join(' · ');
}

function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

const AppointmentDetails: React.FC<AppointmentDetailsProps> = ({
  appointment,
  provider,
  providers,
  color,
  now,
  onClose,
  onChanged,
}) => {
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const { addToast } = useToast();
  const [mode, setMode] = useState<Mode>('view');
  const [canceling, setCanceling] = useState(false);
  const [savingAttendance, setSavingAttendance] = useState(false);
  const [savingConfirmation, setSavingConfirmation] = useState(false);

  // Foco no botão de fechar ao abrir, e Esc fecha o painel
  useEffect(() => {
    closeButtonRef.current?.focus();

    function handleKeyDown(event: KeyboardEvent): void {
      if (event.key === 'Escape') {
        onClose();
      }
    }

    window.addEventListener('keydown', handleKeyDown);

    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const start = appointment.parsedDate;
  const end = appointment.parsedEnd;
  const durationMinutes = differenceInMinutes(end, start);

  // Já começou: dá para registrar se foi atendido (e não dá mais para
  // remarcar nem cancelar)
  const started = !isBefore(now, start);
  let status: AppointmentStatus = 'upcoming';

  if (appointment.attendance) {
    status = appointment.attendance;
  } else if (!isBefore(now, end)) {
    status = 'pending';
  } else if (started) {
    status = 'ongoing';
  } else if (appointment.confirmed_at) {
    status = 'confirmed';
  }

  // Situação da confirmação por e-mail (só antes do horário)
  let confirmationText: string | null = null;

  if (!started && appointment.confirmed_at) {
    const confirmedWhen = format(
      parseISO(appointment.confirmed_at),
      "dd/MM 'às' HH:mm",
    );

    confirmationText = appointment.confirmed_by
      ? `Confirmação registrada por ${appointment.confirmed_by.name} em ${confirmedWhen}`
      : `Confirmado pelo cliente (link do e-mail) em ${confirmedWhen}`;
  } else if (!started && appointment.confirmation_requested_at) {
    confirmationText = `Confirmação pedida por e-mail em ${format(
      parseISO(appointment.confirmation_requested_at),
      "dd/MM 'às' HH:mm",
    )}; aguardando o cliente`;
  }

  const { client } = appointment;
  const clientName = client?.name || 'Cliente removido';
  const phone = client?.phone || null;
  const phoneHref = phone ? toPhoneHref(phone) : null;

  const when = format(start, "dd/MM/yyyy 'às' HH:mm");

  const handleCancel = useCallback(async () => {
    setCanceling(true);

    try {
      await api.patch(`/appointments/${appointment.id}/cancel`);

      onChanged({
        title: 'Agendamento cancelado',
        description: `${clientName} em ${when}. O horário ficou livre.`,
      });
    } catch (err) {
      addToast({
        type: 'error',
        title: 'Não foi possível cancelar',
        description: getApiErrorMessage(
          err,
          'Ocorreu um erro ao cancelar, tente novamente.',
        ),
      });
      setCanceling(false);
    }
  }, [appointment.id, clientName, when, onChanged, addToast]);

  // Cliente que confirmou por telefone ou WhatsApp: a barbearia registra
  // (e pode desfazer o próprio registro)
  const handleConfirmation = useCallback(
    async (confirmed: boolean) => {
      setSavingConfirmation(true);

      try {
        await api.patch(`/appointments/${appointment.id}/confirmation`, {
          confirmed,
        });

        onChanged({
          title: confirmed ? 'Presença confirmada' : 'Confirmação desfeita',
          description: `${clientName} em ${when}.`,
        });
      } catch (err) {
        addToast({
          type: 'error',
          title: 'Não foi possível registrar',
          description: getApiErrorMessage(err, 'Tente novamente.'),
        });
        setSavingConfirmation(false);
      }
    },
    [appointment.id, clientName, when, onChanged, addToast],
  );

  const handleAttendance = useCallback(
    async (attendance: 'completed' | 'no_show' | null) => {
      setSavingAttendance(true);

      try {
        await api.patch(`/appointments/${appointment.id}/attendance`, {
          attendance,
        });

        const titles = {
          completed: 'Atendimento concluído',
          no_show: 'Falta registrada',
          none: 'Registro desfeito',
        };

        onChanged({
          title: titles[attendance || 'none'],
          description: `${clientName} em ${when}.`,
        });
      } catch (err) {
        addToast({
          type: 'error',
          title: 'Não foi possível registrar',
          description: getApiErrorMessage(err, 'Tente novamente.'),
        });
        setSavingAttendance(false);
      }
    },
    [appointment.id, clientName, when, onChanged, addToast],
  );

  return (
    <Overlay
      // Fecha ao clicar fora do painel (no fundo escurecido)
      onMouseDown={event => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <WideDialog
        color={color}
        role="dialog"
        aria-modal="true"
        aria-labelledby="appointment-details-title"
      >
        <DialogHeader>
          <div>
            <HeaderBadges>
              <StatusBadge status={status}>{STATUS_LABELS[status]}</StatusBadge>
              {client?.no_show_alert && (
                <AlertTag title="Cliente com faltas recentes (política de faltas)">
                  <FiAlertTriangle />
                  Faltas recentes
                </AlertTag>
              )}
            </HeaderBadges>
            <h2 id="appointment-details-title">{clientName}</h2>
            {client && (
              <ClientMeta>
                {clientHistoryText(client)} ·{' '}
                <Link to={`/clientes/${client.id}`}>Ver ficha</Link>
              </ClientMeta>
            )}
          </div>

          <CloseButton
            ref={closeButtonRef}
            type="button"
            aria-label="Fechar detalhes"
            title="Fechar (Esc)"
            onClick={onClose}
          >
            <FiX />
          </CloseButton>
        </DialogHeader>

        <Columns>
          <Aside>
            <DetailList>
              <li>
                <FiCalendar />
                {capitalize(
                  format(start, "cccc, d 'de' MMMM 'de' yyyy", {
                    locale: ptBR,
                  }),
                )}
              </li>

              <li>
                <FiClock />
                {`${format(start, 'HH:mm')} – ${format(end, 'HH:mm')}`}
                <small>{`(${durationMinutes} min)`}</small>
              </li>

              <li>
                <FiTag />
                {appointment.service?.name || 'Serviço não informado'}
              </li>

              {appointment.price_cents !== null && (
                <li>
                  <FiDollarSign />
                  {formatPrice(appointment.price_cents)}
                </li>
              )}

              <li>
                <FiScissors />
                <img
                  src={provider.avatar_url || avatarFallback(provider.name)}
                  alt=""
                  onError={e => {
                    e.currentTarget.src = avatarFallback(provider.name);
                  }}
                />
                {provider.name}
              </li>

              {phone && phoneHref && (
                <li>
                  <FiPhone />
                  <a href={phoneHref}>{formatPhone(phone)}</a>
                </li>
              )}

              {client?.notes && (
                <li>
                  <FiFileText />
                  <NotesText title={client.notes}>{client.notes}</NotesText>
                </li>
              )}

              {client?.email && (
                <li>
                  <FiMail />
                  <a href={`mailto:${client.email}`}>{client.email}</a>
                </li>
              )}
            </DetailList>

            {confirmationText && (
              <ConfirmationNote confirmed={!!appointment.confirmed_at}>
                {confirmationText}
              </ConfirmationNote>
            )}

            <CreatedAt>
              {`Agendado em ${format(
                parseISO(appointment.created_at),
                "dd/MM/yyyy 'às' HH:mm",
              )}`}
            </CreatedAt>
          </Aside>

          <MainStack>
            {mode === 'view' && (
              <>
                {/* Só dá para alterar o que ainda não começou */}
                {!started ? (
                  <>
                    <SectionTitle>O que você quer fazer?</SectionTitle>
                    <AttendanceCard
                      type="button"
                      tone="success"
                      selected={!!appointment.confirmed_at}
                      aria-pressed={!!appointment.confirmed_at}
                      style={{ marginBottom: 10 }}
                      // A confirmação do cliente pelo link não se desfaz
                      disabled={
                        savingConfirmation ||
                        (!!appointment.confirmed_at &&
                          !appointment.confirmed_by)
                      }
                      title={
                        appointment.confirmed_by
                          ? 'Clique para desfazer'
                          : undefined
                      }
                      onClick={() =>
                        handleConfirmation(!appointment.confirmed_at)
                      }
                    >
                      <FiCheckCircle />
                      <span>
                        <strong>
                          {appointment.confirmed_at
                            ? 'Presença confirmada'
                            : 'Confirmar presença'}
                        </strong>
                        <small>
                          {!appointment.confirmed_at &&
                            'O cliente confirmou por telefone ou WhatsApp.'}
                          {appointment.confirmed_at &&
                            (appointment.confirmed_by
                              ? 'Registrado pela barbearia. Clique para desfazer.'
                              : 'O cliente confirmou pelo link do e-mail.')}
                        </small>
                      </span>
                    </AttendanceCard>
                    <ActionCard
                      type="button"
                      onClick={() => setMode('reschedule')}
                    >
                      <FiRepeat />
                      <span>
                        <strong>Remarcar</strong>
                        <small>Trocar o dia, o horário ou o barbeiro.</small>
                      </span>
                    </ActionCard>
                    <ActionCard
                      type="button"
                      danger
                      onClick={() => setMode('confirm-cancel')}
                    >
                      <FiXCircle />
                      <span>
                        <strong>Cancelar agendamento</strong>
                        <small>
                          O horário fica livre na agenda e o agendamento
                          continua no histórico.
                        </small>
                      </span>
                    </ActionCard>
                  </>
                ) : (
                  <>
                    <SectionTitle>Como foi o atendimento?</SectionTitle>
                    <AttendanceCard
                      type="button"
                      tone="success"
                      selected={appointment.attendance === 'completed'}
                      aria-pressed={appointment.attendance === 'completed'}
                      disabled={
                        savingAttendance ||
                        appointment.attendance === 'completed'
                      }
                      onClick={() => handleAttendance('completed')}
                    >
                      <FiCheckCircle />
                      <span>
                        <strong>Atendido</strong>
                        <small>
                          {appointment.price_cents !== null
                            ? `Entra no faturamento (${formatPrice(
                                appointment.price_cents,
                              )}).`
                            : 'Entra no faturamento.'}
                        </small>
                      </span>
                    </AttendanceCard>
                    <AttendanceCard
                      type="button"
                      tone="danger"
                      selected={appointment.attendance === 'no_show'}
                      aria-pressed={appointment.attendance === 'no_show'}
                      disabled={
                        savingAttendance || appointment.attendance === 'no_show'
                      }
                      onClick={() => handleAttendance('no_show')}
                    >
                      <FiUserX />
                      <span>
                        <strong>Cliente faltou</strong>
                        <small>
                          Fica registrado como falta, sem faturamento.
                        </small>
                      </span>
                    </AttendanceCard>

                    {/* Espaço reservado: o link aparece sem mexer no resto */}
                    <UndoButton
                      type="button"
                      style={{
                        visibility: appointment.attendance
                          ? 'visible'
                          : 'hidden',
                      }}
                      disabled={savingAttendance}
                      onClick={() => handleAttendance(null)}
                    >
                      Desfazer registro
                    </UndoButton>
                  </>
                )}

                <PanelActions style={{ marginTop: 'auto' }}>
                  <SecondaryButton type="button" onClick={onClose}>
                    Fechar
                  </SecondaryButton>
                </PanelActions>
              </>
            )}

            {mode === 'reschedule' && (
              <>
                <SectionTitle>Remarcar agendamento</SectionTitle>
                <RescheduleArea>
                  <RescheduleForm
                    appointmentId={appointment.id}
                    currentProviderId={provider.id}
                    currentDate={start}
                    providers={providers}
                    onCancel={() => setMode('view')}
                    onRescheduled={newDate =>
                      onChanged({
                        title: 'Agendamento remarcado',
                        description: `${clientName}: de ${when} para ${format(
                          newDate,
                          "dd/MM/yyyy 'às' HH:mm",
                        )}.`,
                      })
                    }
                  />
                </RescheduleArea>
              </>
            )}

            {mode === 'confirm-cancel' && (
              <>
                <SectionTitle>Cancelar agendamento</SectionTitle>
                <ConfirmText>
                  {`Cancelar o agendamento de ${clientName} em ${when}?`}
                  <small>
                    O horário ficará livre na agenda e o agendamento continua no
                    histórico como cancelado.
                  </small>
                </ConfirmText>
                <PanelActions style={{ marginTop: 'auto' }}>
                  <SecondaryButton
                    type="button"
                    onClick={() => setMode('view')}
                  >
                    Voltar
                  </SecondaryButton>
                  <DangerButton
                    type="button"
                    onClick={handleCancel}
                    disabled={canceling}
                  >
                    {canceling ? 'Cancelando...' : 'Sim, cancelar'}
                  </DangerButton>
                </PanelActions>
              </>
            )}
          </MainStack>
        </Columns>
      </WideDialog>
    </Overlay>
  );
};

export default AppointmentDetails;
