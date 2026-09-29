import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  addDays,
  addHours,
  differenceInCalendarDays,
  format,
  isSameDay,
  parse,
  startOfDay,
} from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';
import { FiCheck, FiInfo, FiX } from 'react-icons/fi';

import api from '../../../services/api';
import getApiErrorMessage from '../../../utils/getApiErrorMessage';
import { UIButton, TextInput, Select } from '../../../components/ui';
import { Overlay, CloseButton } from '../AppointmentDetails/styles';
import { DialogHeader, Main, Footer } from '../modalLayout';
import { AgendaProvider } from '../agenda';
import {
  BlockDialog,
  Subtitle,
  Form,
  Field,
  PeriodRow,
  WholeDay,
  Reasons,
  ReasonChip,
  FormError,
  Summary,
} from './styles';

interface BlockModalProps {
  // Barbeiro e horário clicados na agenda
  provider: AgendaProvider;
  start: Date;
  color: string;
  // Barbeiros que podem ser escolhidos
  providers: AgendaProvider[];
  onClose(): void;
  onCreated(message: { title: string; description: string }): void;
}

const QUICK_REASONS = ['Almoço', 'Consulta', 'Folga', 'Férias'];

const toDateValue = (date: Date): string => format(date, 'yyyy-MM-dd');
const toTimeValue = (date: Date): string => format(date, 'HH:mm');

// Junta os campos de data ('yyyy-MM-dd') e hora ('HH:mm')
function combine(date: string, time: string): Date | null {
  const parsed = parse(`${date} ${time}`, 'yyyy-MM-dd HH:mm', new Date());

  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

// Bloqueia um período na agenda de um barbeiro: um trecho do dia (almoço,
// consulta) ou dias inteiros (folga, férias)
const BlockModal: React.FC<BlockModalProps> = ({
  provider,
  start,
  color,
  providers,
  onClose,
  onCreated,
}) => {
  const [providerId, setProviderId] = useState(provider.id);
  const [wholeDay, setWholeDay] = useState(false);
  const [fromDate, setFromDate] = useState(toDateValue(start));
  const [fromTime, setFromTime] = useState(toTimeValue(start));
  const [toDate, setToDate] = useState(toDateValue(start));
  const [toTime, setToTime] = useState(toTimeValue(addHours(start, 1)));
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent): void {
      if (event.key === 'Escape' && !saving) onClose();
    }

    window.addEventListener('keydown', handleKeyDown);

    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, saving]);

  // Período escolhido. Dia inteiro vai da meia-noite do primeiro dia até a
  // meia-noite depois do último
  const period = useMemo(() => {
    if (wholeDay) {
      const first = combine(fromDate, '00:00');
      const last = combine(toDate, '00:00');

      return first && last
        ? { start: first, end: addDays(startOfDay(last), 1) }
        : null;
    }

    const from = combine(fromDate, fromTime);
    const to = combine(toDate, toTime);

    return from && to ? { start: from, end: to } : null;
  }, [wholeDay, fromDate, fromTime, toDate, toTime]);

  const summary = useMemo(() => {
    if (!period || period.end <= period.start) return null;

    if (wholeDay) {
      const days = differenceInCalendarDays(period.end, period.start);

      return days === 1
        ? `O dia ${format(period.start, "d 'de' MMMM", {
            locale: ptBR,
          })} inteiro fica bloqueado.`
        : `${days} dias bloqueados, de ${format(
            period.start,
            'dd/MM',
          )} a ${format(addDays(period.end, -1), 'dd/MM')}.`;
    }

    if (isSameDay(period.start, period.end)) {
      return `Ninguém consegue agendar das ${format(
        period.start,
        'HH:mm',
      )} às ${format(period.end, 'HH:mm')} de ${format(
        period.start,
        "d 'de' MMMM",
        { locale: ptBR },
      )}.`;
    }

    return `Ninguém consegue agendar das ${format(
      period.start,
      'HH:mm',
    )} (${format(period.start, 'dd/MM')}) às ${format(
      period.end,
      'HH:mm',
    )} (${format(period.end, 'dd/MM')}).`;
  }, [period, wholeDay]);

  const handleSubmit = useCallback(
    async (event: React.FormEvent) => {
      event.preventDefault();

      if (!period) {
        setError('Preencha as datas e os horários.');
        return;
      }

      if (period.end <= period.start) {
        setError('O fim do bloqueio precisa ser depois do início.');
        return;
      }

      setError('');
      setSaving(true);

      try {
        await api.post('/blocks', {
          provider_id: providerId,
          start_date: period.start.toISOString(),
          end_date: period.end.toISOString(),
          reason: reason.trim() || null,
        });

        const name =
          providers.find(item => item.id === providerId)?.name || provider.name;

        onCreated({
          title: 'Horário bloqueado',
          description: `${name} · ${summary || ''}`.trim(),
        });
      } catch (err) {
        setSaving(false);
        setError(
          getApiErrorMessage(
            err,
            'Não foi possível bloquear o horário, tente novamente.',
          ),
        );
      }
    },
    [period, providerId, reason, providers, provider.name, summary, onCreated],
  );

  // Alterar o período apaga o erro anterior
  const edit =
    (setter: (value: string) => void) =>
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setter(event.target.value);
      setError('');
    };

  return (
    <Overlay
      onMouseDown={event => {
        if (event.target === event.currentTarget && !saving) onClose();
      }}
    >
      <BlockDialog
        color={color}
        role="dialog"
        aria-modal="true"
        aria-labelledby="block-modal-title"
      >
        <DialogHeader>
          <div>
            <h2 id="block-modal-title">Bloquear horário</h2>
            <Subtitle>
              Ninguém consegue agendar com o barbeiro no período bloqueado.
            </Subtitle>
          </div>
          <CloseButton
            type="button"
            aria-label="Fechar"
            title="Fechar (Esc)"
            onClick={onClose}
          >
            <FiX />
          </CloseButton>
        </DialogHeader>

        <Form onSubmit={handleSubmit} noValidate>
          <Main>
            <Field>
              <span>Barbeiro</span>
              <Select
                value={providerId}
                onChange={event => {
                  setProviderId(event.target.value);
                  setError('');
                }}
              >
                {providers.map(item => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </Select>
            </Field>

            <PeriodRow>
              <span>De</span>
              <TextInput
                type="date"
                aria-label="Data de início"
                value={fromDate}
                onChange={edit(value => {
                  setFromDate(value);
                  // Mantém o fim junto quando ele ficaria antes do início
                  if (value > toDate) setToDate(value);
                })}
              />
              <TextInput
                type="time"
                step={900}
                aria-label="Hora de início"
                value={fromTime}
                disabled={wholeDay}
                onChange={edit(setFromTime)}
              />
            </PeriodRow>

            <PeriodRow>
              <span>Até</span>
              <TextInput
                type="date"
                aria-label="Data de fim"
                value={toDate}
                min={fromDate}
                onChange={edit(setToDate)}
              />
              <TextInput
                type="time"
                step={900}
                aria-label="Hora de fim"
                value={toTime}
                disabled={wholeDay}
                onChange={edit(setToTime)}
              />
            </PeriodRow>

            <WholeDay>
              <input
                type="checkbox"
                checked={wholeDay}
                onChange={event => {
                  setWholeDay(event.target.checked);
                  setError('');
                }}
              />
              Dia inteiro
            </WholeDay>

            <Field>
              <span>Motivo (opcional, só a equipe vê)</span>
              <TextInput
                value={reason}
                maxLength={60}
                placeholder="Ex: Almoço"
                onChange={event => setReason(event.target.value)}
              />
              <Reasons>
                {QUICK_REASONS.map(option => (
                  <ReasonChip
                    key={option}
                    type="button"
                    selected={reason === option}
                    aria-pressed={reason === option}
                    onClick={() => {
                      setReason(option);
                      // Folga e férias costumam ser o dia inteiro
                      if (option === 'Folga' || option === 'Férias') {
                        setWholeDay(true);
                        setError('');
                      }
                    }}
                  >
                    {option}
                  </ReasonChip>
                ))}
              </Reasons>
            </Field>

            <Summary>
              <FiInfo />
              {summary || 'Escolha um fim depois do início.'}
            </Summary>

            <FormError role="alert">{error}</FormError>
          </Main>

          <Footer>
            <UIButton
              type="button"
              variant="secondary"
              onClick={onClose}
              disabled={saving}
            >
              Cancelar
            </UIButton>
            <UIButton type="submit" disabled={saving}>
              <FiCheck />
              {saving ? 'Bloqueando...' : 'Bloquear'}
            </UIButton>
          </Footer>
        </Form>
      </BlockDialog>
    </Overlay>
  );
};

export default BlockModal;
