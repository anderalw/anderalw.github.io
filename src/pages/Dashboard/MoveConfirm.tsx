import React, { useCallback, useEffect, useRef, useState } from 'react';
import { format, isSameDay } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';
import { FiMove } from 'react-icons/fi';

import api from '../../services/api';
import { useToast } from '../../hooks/Toast';
import getApiErrorMessage from '../../utils/getApiErrorMessage';

import { UIButton } from '../../components/ui';
import { DropTarget } from './useAppointmentDrag';
import { MoveBar } from './styles';

interface MoveConfirmProps {
  move: DropTarget;
  onClose(): void;
  onMoved(message: { title: string; description: string }): void;
}

// Depois de soltar o card: confirma antes de remarcar (evita arrastes sem
// querer e avisa que o cliente fica sabendo)
const MoveConfirm: React.FC<MoveConfirmProps> = ({
  move,
  onClose,
  onMoved,
}) => {
  const { addToast } = useToast();
  const confirmRef = useRef<HTMLButtonElement>(null);
  const [saving, setSaving] = useState(false);

  const { appointment, from, to, start, end } = move;
  const clientName = appointment.client?.name || 'Cliente';
  const changedProvider = from.id !== to.id;
  const when = isSameDay(start, appointment.parsedDate)
    ? format(start, 'HH:mm')
    : format(start, "EEE, d 'de' MMM 'às' HH:mm", { locale: ptBR });

  useEffect(() => {
    confirmRef.current?.focus();

    function handleKeyDown(event: KeyboardEvent): void {
      if (event.key === 'Escape') onClose();
    }

    window.addEventListener('keydown', handleKeyDown);

    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const confirm = useCallback(async () => {
    setSaving(true);

    try {
      await api.patch(`/appointments/${appointment.id}/reschedule`, {
        provider_id: to.id,
        date: start.toISOString(),
      });

      onMoved({
        title: 'Agendamento remarcado',
        description: `${clientName}: ${format(start, 'HH:mm')} – ${format(
          end,
          'HH:mm',
        )} com ${to.name}.`,
      });
    } catch (err) {
      addToast({
        type: 'error',
        title: 'Não foi possível remarcar',
        description: getApiErrorMessage(err, 'Tente novamente.'),
      });
      onClose();
    }
  }, [appointment.id, to, start, end, clientName, onMoved, onClose, addToast]);

  return (
    <MoveBar role="dialog" aria-label="Confirmar remarcação">
      <FiMove />
      <p>
        {`Remarcar ${clientName} para `}
        <strong>{when}</strong>
        {changedProvider && (
          <>
            {' com '}
            <strong>{to.name}</strong>
          </>
        )}
        ?
        <small>
          {`Antes: ${format(appointment.parsedDate, 'HH:mm')} com ${
            from.name
          }. O cliente precisa confirmar o novo horário.`}
        </small>
      </p>
      <UIButton
        type="button"
        variant="secondary"
        size="sm"
        disabled={saving}
        onClick={onClose}
      >
        Cancelar
      </UIButton>
      <UIButton
        ref={confirmRef}
        type="button"
        size="sm"
        disabled={saving}
        onClick={confirm}
      >
        {saving ? 'Remarcando...' : 'Remarcar'}
      </UIButton>
    </MoveBar>
  );
};

export default MoveConfirm;
