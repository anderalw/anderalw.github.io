import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { format } from 'date-fns';

import api from '../../services/api';
import { useToast } from '../../hooks/Toast';
import getApiErrorMessage from '../../utils/getApiErrorMessage';

import {
  Form,
  Field,
  Times,
  TimeButton,
  TimesBox,
  Hint,
  Actions,
  PrimaryButton,
  SecondaryButton,
} from './styles';
import { useVocabulary } from '../../hooks/Vocabulary';

interface RescheduleFormProps {
  appointmentId: string;
  currentProviderId: string;
  currentDate: Date;
  providers: Array<{ id: string; name: string }>;
  onCancel(): void;
  // Chamado depois de remarcar com sucesso, com o novo início
  onRescheduled(newDate: Date): void;
}

// Remarcar: escolhe barbeiro, dia e um dos horários livres para a duração
// deste agendamento (o horário atual dele não conta como ocupado)
const RescheduleForm: React.FC<RescheduleFormProps> = ({
  appointmentId,
  currentProviderId,
  currentDate,
  providers,
  onCancel,
  onRescheduled,
}) => {
  const terms = useVocabulary();
  const { addToast } = useToast();

  const [providerId, setProviderId] = useState(currentProviderId);
  const [day, setDay] = useState(() => format(currentDate, 'yyyy-MM-dd'));
  const [times, setTimes] = useState<string[]>([]);
  const [selectedTime, setSelectedTime] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setSelectedTime('');

    if (!day) {
      setTimes([]);
      return undefined;
    }

    let active = true;
    const [year, month, date] = day.split('-');

    setLoading(true);

    api
      .get<Array<{ time: string }>>(
        `/providers/${providerId}/day-availability`,
        {
          params: { year, month, day: date, appointment_id: appointmentId },
        },
      )
      .then(response => {
        if (active) setTimes(response.data.map(item => item.time));
      })
      .catch(() => {
        if (active) setTimes([]);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [providerId, day, appointmentId]);

  const newDate = useMemo(() => {
    if (!day || !selectedTime) return null;

    const [year, month, date] = day.split('-').map(Number);
    const [hours, minutes] = selectedTime.split(':').map(Number);

    return new Date(year, month - 1, date, hours, minutes);
  }, [day, selectedTime]);

  // O horário atual aparece na lista (não conta como ocupado), mas escolher
  // o mesmo barbeiro e horário não muda nada
  const unchanged =
    !!newDate &&
    providerId === currentProviderId &&
    newDate.getTime() === currentDate.getTime();

  const handleConfirm = useCallback(async () => {
    if (!newDate || unchanged) return;

    setSaving(true);

    try {
      await api.patch(`/appointments/${appointmentId}/reschedule`, {
        provider_id: providerId,
        date: newDate,
      });

      // Quem usa o formulário o fecha ao remarcar, então não mexe mais no estado
      onRescheduled(newDate);
    } catch (err) {
      setSaving(false);
      addToast({
        type: 'error',
        title: 'Não foi possível remarcar',
        description: getApiErrorMessage(
          err,
          'Ocorreu um erro ao remarcar, tente novamente.',
        ),
      });
    }
  }, [newDate, unchanged, appointmentId, providerId, onRescheduled, addToast]);

  return (
    <Form>
      <Field>
        <span>{terms.Professional}</span>
        <select
          value={providerId}
          onChange={event => setProviderId(event.target.value)}
        >
          {providers.map(provider => (
            <option key={provider.id} value={provider.id}>
              {provider.name}
            </option>
          ))}
        </select>
      </Field>

      <Field>
        <span>Data</span>
        <input
          type="date"
          value={day}
          min={format(new Date(), 'yyyy-MM-dd')}
          onChange={event => setDay(event.target.value)}
        />
      </Field>

      <div>
        <Hint style={{ marginBottom: 8 }}>Novo horário</Hint>
        <TimesBox>
          {loading && <Hint>Carregando horários...</Hint>}
          {!loading && times.length === 0 && (
            <Hint>
              {`Nenhum horário livre neste dia. Tente outra data ou outro ${terms.professional}.`}
            </Hint>
          )}
          {!loading && times.length > 0 && (
            <Times>
              {times.map(time => (
                <TimeButton
                  key={time}
                  type="button"
                  selected={time === selectedTime}
                  aria-pressed={time === selectedTime}
                  onClick={() => setSelectedTime(time)}
                >
                  {time}
                </TimeButton>
              ))}
            </Times>
          )}
        </TimesBox>
      </div>

      {/* Linha sempre presente, para o aviso não empurrar os botões */}
      <Hint>{unchanged ? 'Este é o horário atual do agendamento.' : ''}</Hint>

      <Actions>
        <SecondaryButton type="button" onClick={onCancel}>
          Voltar
        </SecondaryButton>
        <PrimaryButton
          type="button"
          onClick={handleConfirm}
          disabled={!newDate || unchanged || saving}
        >
          {saving ? 'Remarcando...' : 'Confirmar remarcação'}
        </PrimaryButton>
      </Actions>
    </Form>
  );
};

export default RescheduleForm;
