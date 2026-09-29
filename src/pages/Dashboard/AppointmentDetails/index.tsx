import React, { useCallback, useEffect, useRef, useState } from 'react';
import { differenceInMinutes, format, isBefore, parseISO } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';
import {
  FiCalendar,
  FiClock,
  FiDollarSign,
  FiMail,
  FiPhone,
  FiScissors,
  FiRepeat,
  FiTag,
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
  Notice,
  CreatedAt,
  StatusBadge,
  AppointmentStatus,
  CloseButton,
  DetailList,
  PanelActions,
  SecondaryButton,
  DangerButton,
  ConfirmText,
  SectionTitle,
} from './styles';

export interface AppointmentDetailsData {
  id: string;
  parsedDate: Date;
  parsedEnd: Date;
  service: { id: string; name: string } | null;
  price_cents: number | null;
  created_at: string;
  client: {
    id: string;
    name: string;
    email: string | null;
    phone: string;
  } | null;
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
  past: 'Concluído',
  ongoing: 'Em andamento',
  upcoming: 'Agendado',
};

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

  let status: AppointmentStatus = 'upcoming';

  if (!isBefore(now, end)) {
    status = 'past';
  } else if (!isBefore(now, start)) {
    status = 'ongoing';
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
            <StatusBadge status={status}>{STATUS_LABELS[status]}</StatusBadge>
            <h2 id="appointment-details-title">{clientName}</h2>
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

              {client?.email && (
                <li>
                  <FiMail />
                  <a href={`mailto:${client.email}`}>{client.email}</a>
                </li>
              )}
            </DetailList>

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
                {status === 'upcoming' ? (
                  <>
                    <SectionTitle>O que você quer fazer?</SectionTitle>
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
                  <Notice>
                    {status === 'past'
                      ? 'Este atendimento já foi concluído e não pode mais ser alterado.'
                      : 'Este atendimento está em andamento e não pode mais ser alterado.'}
                  </Notice>
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
