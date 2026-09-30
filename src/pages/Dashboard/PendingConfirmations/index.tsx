import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  addDays,
  differenceInHours,
  format,
  isBefore,
  startOfDay,
  subHours,
} from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';
import {
  FiAlertCircle,
  FiCheck,
  FiCheckCircle,
  FiPhone,
  FiX,
} from 'react-icons/fi';
import { FaWhatsapp } from 'react-icons/fa';

import api from '../../../services/api';
import { colors } from '../../../styles/theme';
import { useToast } from '../../../hooks/Toast';
import getApiErrorMessage from '../../../utils/getApiErrorMessage';
import { formatPhone, phoneHref, whatsappHref } from '../../../utils/phone';
import { DetailsTarget } from '../WeekView';
import {
  Agenda,
  ParsedAppointment,
  parseAppointments,
  providerColor,
} from '../agenda';
import {
  Tone,
  Trigger,
  Backdrop,
  Panel,
  PanelHeader,
  CloseButton,
  Progress,
  List,
  Item,
  ItemMain,
  ItemActions,
  IconLink,
  ConfirmButton,
  Empty,
  Footnote,
} from './styles';

interface PendingConfirmationsProps {
  now: Date;
  // Muda quando a agenda é alterada (recarrega a contagem)
  refreshKey: number;
  // Abre os detalhes do agendamento, mostrando o dia de amanhã
  onOpen(target: DetailsTarget, day: Date, opener: HTMLElement): void;
  // Depois de confirmar pela lista: recarregar a agenda e avisar
  onChanged(message: { title: string; description: string }): void;
}

// A contagem também se atualiza sozinha: clientes confirmam pelo link
const REFRESH_MS = 2 * 60 * 1000;
const PANEL_HEIGHT = 480;
const GAP = 8;
// Mesmas regras do envio no servidor
const REQUEST_HOURS_BEFORE = 24;
const MIN_NOTICE_HOURS = 12;

// Situação do pedido de confirmação (e-mail e/ou WhatsApp)
function requestStatus(appointment: ParsedAppointment, now: Date): string {
  if (appointment.confirmation_requested_at) {
    return `Pedido enviado às ${format(
      new Date(appointment.confirmation_requested_at),
      'HH:mm',
    )}, sem resposta`;
  }

  if (!appointment.client?.email && !appointment.client?.phone) {
    return 'Sem e-mail nem telefone';
  }

  const notice = differenceInHours(
    appointment.parsedDate,
    new Date(appointment.created_at),
  );

  if (notice < MIN_NOTICE_HOURS) {
    return 'Marcado em cima da hora: sem pedido de confirmação';
  }

  const sendAt = subHours(appointment.parsedDate, REQUEST_HOURS_BEFORE);

  if (isBefore(sendAt, now)) return 'O pedido de confirmação sai em instantes';

  return `O pedido de confirmação sai hoje às ${format(sendAt, 'HH:mm')}`;
}

// Conversa do WhatsApp com a mensagem pronta (telefones com DDD)
function whatsappFor(appointment: ParsedAppointment): string | null {
  const firstName = (appointment.client?.name || '').split(' ')[0];
  const service = appointment.service ? ` (${appointment.service.name})` : '';

  return whatsappHref(
    appointment.client?.phone || '',
    `Olá, ${firstName}! Passando para confirmar seu horário amanhã às ${format(
      appointment.parsedDate,
      'HH:mm',
    )}${service}. Podemos confirmar?`,
  );
}

// Contador na barra da agenda: agendamentos de amanhã que o cliente ainda
// não confirmou. Abre uma lista para ligar, chamar no WhatsApp ou registrar
// a confirmação recebida por telefone
const PendingConfirmations: React.FC<PendingConfirmationsProps> = ({
  now,
  refreshKey,
  onOpen,
  onChanged,
}) => {
  const { addToast } = useToast();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const [agenda, setAgenda] = useState<Agenda | null>(null);
  const [open, setOpen] = useState(false);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [position, setPosition] = useState({ top: 0, left: 0, height: 0 });

  // Muda à meia-noite: o "amanhã" passa a ser outro dia
  const todayKey = format(now, 'yyyy-MM-dd');
  const tomorrow = useMemo(
    () => addDays(startOfDay(new Date(`${todayKey}T00:00:00`)), 1),
    [todayKey],
  );

  const [tick, setTick] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => setTick(value => value + 1), REFRESH_MS);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    let active = true;

    api
      .get<Agenda>('/agenda/day', {
        params: {
          year: tomorrow.getFullYear(),
          month: tomorrow.getMonth() + 1,
          day: tomorrow.getDate(),
        },
      })
      .then(response => {
        if (active) setAgenda(response.data);
      })
      .catch(() => {
        // Sem a contagem a agenda continua funcionando; tenta de novo depois
      });

    return () => {
      active = false;
    };
  }, [tomorrow, refreshKey, tick, open]);

  const appointments = useMemo(
    () => (agenda ? parseAppointments(agenda.appointments) : []),
    [agenda],
  );
  const pending = useMemo(
    () => appointments.filter(appointment => !appointment.confirmed_at),
    [appointments],
  );

  const total = appointments.length;
  const confirmedCount = total - pending.length;

  let tone: Tone = 'loading';
  let label = 'Confirmações de amanhã';
  let shortLabel = '…';

  if (agenda && total === 0) {
    tone = 'empty';
    label = 'Amanhã: sem agendamentos';
    shortLabel = '0';
  } else if (agenda && pending.length === 0) {
    tone = 'done';
    label = 'Amanhã: todos confirmados';
    shortLabel = String(total);
  } else if (agenda) {
    tone = 'pending';
    label = `Amanhã: ${pending.length} sem confirmação`;
    shortLabel = String(pending.length);
  }

  // Abaixo do botão, alinhado à direita dele
  useLayoutEffect(() => {
    if (!open || !triggerRef.current) return undefined;

    const trigger = triggerRef.current;

    const place = (): void => {
      const rect = trigger.getBoundingClientRect();
      const width = Math.min(440, window.innerWidth - 32);
      const top = rect.bottom + GAP;

      setPosition({
        top,
        left: Math.max(16, rect.right - width),
        height: Math.min(PANEL_HEIGHT, window.innerHeight - top - 16),
      });
    };

    place();
    window.addEventListener('resize', place);

    return () => window.removeEventListener('resize', place);
  }, [open]);

  const close = useCallback(() => {
    setOpen(false);
    triggerRef.current?.focus();
  }, []);

  // Esc fecha
  useEffect(() => {
    if (!open) return undefined;

    panelRef.current?.focus();

    function handleKeyDown(event: KeyboardEvent): void {
      if (event.key === 'Escape') close();
    }

    window.addEventListener('keydown', handleKeyDown);

    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, close]);

  const openDetails = useCallback(
    (appointment: ParsedAppointment) => {
      if (!agenda || !triggerRef.current) return;

      const provider = agenda.providers.find(
        item => item.id === appointment.provider_id,
      );

      if (!provider) return;

      setOpen(false);
      onOpen(
        {
          appointment,
          provider,
          color: providerColor(provider.id, agenda.providers),
          providers: agenda.providers.filter(item => item.active),
        },
        tomorrow,
        triggerRef.current,
      );
    },
    [agenda, onOpen, tomorrow],
  );

  const confirm = useCallback(
    async (appointment: ParsedAppointment) => {
      setConfirmingId(appointment.id);

      try {
        await api.patch(`/appointments/${appointment.id}/confirmation`, {
          confirmed: true,
        });

        // Some da lista na hora; a agenda recarrega em seguida
        setAgenda(
          current =>
            current && {
              ...current,
              appointments: current.appointments.map(item =>
                item.id === appointment.id
                  ? { ...item, confirmed_at: new Date().toISOString() }
                  : item,
              ),
            },
        );

        onChanged({
          title: 'Presença confirmada',
          description: `${
            appointment.client?.name || 'Cliente'
          } amanhã às ${format(appointment.parsedDate, 'HH:mm')}.`,
        });
      } catch (err) {
        addToast({
          type: 'error',
          title: 'Não foi possível confirmar',
          description: getApiErrorMessage(err, 'Tente novamente.'),
        });
      } finally {
        setConfirmingId(null);
      }
    },
    [onChanged, addToast],
  );

  const tomorrowText = format(tomorrow, "EEEE, d 'de' MMMM", { locale: ptBR });

  return (
    <>
      <Trigger
        ref={triggerRef}
        type="button"
        tone={tone}
        aria-haspopup="dialog"
        aria-expanded={open}
        title={
          tone === 'pending'
            ? `${pending.length} de ${total} agendamentos de amanhã sem confirmação`
            : label
        }
        onClick={() => setOpen(value => !value)}
      >
        {tone === 'pending' ? <FiAlertCircle /> : <FiCheckCircle />}
        <span className="full">{label}</span>
        <span className="short">{shortLabel}</span>
      </Trigger>

      {open && (
        <Backdrop
          onMouseDown={event => {
            if (event.target === event.currentTarget) close();
          }}
        >
          <Panel
            ref={panelRef}
            role="dialog"
            aria-label="Confirmações de amanhã"
            tabIndex={-1}
            style={position}
          >
            <PanelHeader>
              <div style={{ flex: 1 }}>
                <h2>Confirmações de amanhã</h2>
                <p>
                  {tomorrowText}
                  {total > 0 && ` · ${confirmedCount} de ${total} confirmados`}
                </p>
                <Progress value={total > 0 ? confirmedCount / total : 0} />
              </div>
              <CloseButton
                type="button"
                aria-label="Fechar"
                title="Fechar (Esc)"
                onClick={close}
              >
                <FiX />
              </CloseButton>
            </PanelHeader>

            <List>
              {pending.length === 0 && (
                <Empty as="li">
                  <FiCheckCircle />
                  {total === 0
                    ? 'Nenhum agendamento para amanhã.'
                    : 'Todos os clientes de amanhã confirmaram.'}
                </Empty>
              )}

              {agenda &&
                pending.map(appointment => {
                  const provider = agenda.providers.find(
                    item => item.id === appointment.provider_id,
                  );
                  const phone = appointment.client?.phone || '';
                  const whatsapp = whatsappFor(appointment);

                  return (
                    <Item key={appointment.id}>
                      <ItemMain
                        type="button"
                        color={providerColor(
                          appointment.provider_id,
                          agenda.providers,
                        )}
                        title="Ver o agendamento"
                        onClick={() => openDetails(appointment)}
                      >
                        <time>{format(appointment.parsedDate, 'HH:mm')}</time>
                        <div>
                          <strong>
                            {appointment.client?.name || 'Cliente removido'}
                            {appointment.client?.no_show_alert && (
                              <span
                                style={{ color: colors.warning }}
                                title="Cliente com faltas recentes"
                              >
                                {' ⚠ faltas recentes'}
                              </span>
                            )}
                          </strong>
                          <small>
                            {[appointment.service?.name, provider?.name]
                              .filter(Boolean)
                              .join(' · ')}
                          </small>
                          <em>{requestStatus(appointment, now)}</em>
                        </div>
                      </ItemMain>

                      <ItemActions>
                        {whatsapp && (
                          <IconLink
                            href={whatsapp}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="Chamar no WhatsApp"
                            aria-label={`Chamar ${appointment.client?.name} no WhatsApp`}
                          >
                            <FaWhatsapp />
                          </IconLink>
                        )}
                        {phone && (
                          <IconLink
                            href={phoneHref(phone)}
                            title={`Ligar: ${formatPhone(phone)}`}
                            aria-label={`Ligar para ${appointment.client?.name}`}
                          >
                            <FiPhone />
                          </IconLink>
                        )}
                        <ConfirmButton
                          type="button"
                          title="O cliente confirmou (registrar)"
                          aria-label={`Registrar a confirmação de ${appointment.client?.name}`}
                          disabled={confirmingId === appointment.id}
                          onClick={() => confirm(appointment)}
                        >
                          <FiCheck />
                        </ConfirmButton>
                      </ItemActions>
                    </Item>
                  );
                })}
            </List>

            <Footnote>
              O pedido de confirmação sai 24 horas antes, por e-mail e pelo
              WhatsApp (se ligado nas Configurações). Quem confirmou por
              telefone pode ser marcado no ✓.
            </Footnote>
          </Panel>
        </Backdrop>
      )}
    </>
  );
};

export default PendingConfirmations;
