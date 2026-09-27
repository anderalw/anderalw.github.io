import React, { useEffect, useRef } from 'react';
import { differenceInMinutes, format, isBefore, parseISO } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';
import {
  FiCalendar,
  FiClock,
  FiDollarSign,
  FiMail,
  FiPhone,
  FiScissors,
  FiTag,
  FiX,
} from 'react-icons/fi';

import { formatPrice } from '../../../utils/money';

import {
  Overlay,
  Dialog,
  StatusBadge,
  AppointmentStatus,
  CloseButton,
  DetailList,
} from './styles';

export interface AppointmentDetailsData {
  id: string;
  parsedDate: Date;
  parsedEnd: Date;
  service: { id: string; name: string } | null;
  price_cents: number | null;
  created_at: string;
  client: { id: string; name: string; email: string; phone: string } | null;
}

interface AppointmentDetailsProps {
  appointment: AppointmentDetailsData;
  provider: { name: string; avatar_url: string | null };
  color: string;
  now: Date;
  onClose(): void;
}

const STATUS_LABELS: Record<AppointmentStatus, string> = {
  past: 'Concluído',
  ongoing: 'Em andamento',
  upcoming: 'Agendado',
};

function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function avatarFallback(name: string): string {
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(
    name,
  )}&background=28262e&color=ff9000`;
}

const AppointmentDetails: React.FC<AppointmentDetailsProps> = ({
  appointment,
  provider,
  color,
  now,
  onClose,
}) => {
  const closeButtonRef = useRef<HTMLButtonElement>(null);

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
  // tel: aceita só dígitos e o "+" do código do país
  const phoneHref = client?.phone
    ? `tel:${client.phone.replace(/[^\d+]/g, '')}`
    : null;

  return (
    <Overlay
      // Fecha ao clicar fora do painel (no fundo escurecido)
      onMouseDown={event => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <Dialog
        color={color}
        role="dialog"
        aria-modal="true"
        aria-labelledby="appointment-details-title"
      >
        <header>
          <StatusBadge status={status}>{STATUS_LABELS[status]}</StatusBadge>

          <CloseButton
            ref={closeButtonRef}
            type="button"
            aria-label="Fechar detalhes"
            title="Fechar (Esc)"
            onClick={onClose}
          >
            <FiX />
          </CloseButton>
        </header>

        <h2 id="appointment-details-title">{clientName}</h2>

        <DetailList>
          <li>
            <FiCalendar />
            {capitalize(
              format(start, "cccc, d 'de' MMMM 'de' yyyy", { locale: ptBR }),
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

          {client?.phone && phoneHref && (
            <li>
              <FiPhone />
              <a href={phoneHref}>{client.phone}</a>
            </li>
          )}

          {client?.email && (
            <li>
              <FiMail />
              <a href={`mailto:${client.email}`}>{client.email}</a>
            </li>
          )}
        </DetailList>

        <footer>
          {`Agendado em ${format(
            parseISO(appointment.created_at),
            "dd/MM/yyyy 'às' HH:mm",
          )}`}
        </footer>
      </Dialog>
    </Overlay>
  );
};

export default AppointmentDetails;
