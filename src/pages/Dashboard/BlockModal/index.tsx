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
import { FiAlertCircle, FiCheck, FiInfo, FiX } from 'react-icons/fi';

import api from '../../../services/api';
import getApiErrorMessage from '../../../utils/getApiErrorMessage';
import { UIButton, TextInput } from '../../../components/ui';
import { Overlay, CloseButton } from '../AppointmentDetails/styles';
import { DialogHeader, Main, Footer } from '../modalLayout';
import { AgendaProvider, describeDays } from '../agenda';
import {
  BlockDialog,
  Subtitle,
  Form,
  Field,
  TopRow,
  ModeSwitch,
  PeriodRow,
  WholeDay,
  DayChips,
  Summary,
} from './styles';
import TimeSelect from '../../../components/TimeSelect';
import ProviderPicker from './ProviderPicker';
import ReasonSelect, { BlockReason } from './ReasonSelect';
import { useVocabulary } from '../../../hooks/Vocabulary';

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

type Mode = 'once' | 'repeat';

const toDateValue = (date: Date): string => format(date, 'yyyy-MM-dd');
const toTimeValue = (date: Date): string => format(date, 'HH:mm');
const shortDate = (value: string): string =>
  value ? `${value.slice(8, 10)}/${value.slice(5, 7)}` : '';

// Junta os campos de data ('yyyy-MM-dd') e hora ('HH:mm')
function combine(date: string, time: string): Date | null {
  const parsed = parse(`${date} ${time}`, 'yyyy-MM-dd HH:mm', new Date());

  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

// Bloqueia horários na agenda de um barbeiro: uma vez só (consulta, folga,
// férias) ou repetindo nos dias da semana escolhidos (almoço)
const BlockModal: React.FC<BlockModalProps> = ({
  provider,
  start,
  color,
  providers,
  onClose,
  onCreated,
}) => {
  const terms = useVocabulary();
  const [mode, setMode] = useState<Mode>('once');
  // Um ou mais barbeiros; começa com o da coluna clicada
  const [providerIds, setProviderIds] = useState([provider.id]);
  // Horário (nos dois modos) e datas
  const [fromTime, setFromTime] = useState(toTimeValue(start));
  const [toTime, setToTime] = useState(toTimeValue(addHours(start, 1)));
  const [fromDate, setFromDate] = useState(toDateValue(start));
  const [toDate, setToDate] = useState(toDateValue(start));
  // Uma vez
  const [wholeDay, setWholeDay] = useState(false);
  // Repetir
  const [days, setDays] = useState([0, 1, 2, 3, 4, 5, 6]);
  const [noEnd, setNoEnd] = useState(true);
  // Motivo cadastrado (obrigatório), escolhido na lista com busca
  const [reasons, setReasons] = useState<BlockReason[]>([]);
  const [reasonsLoading, setReasonsLoading] = useState(true);
  const [reasonId, setReasonId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;

    api
      .get<BlockReason[]>('/block-reasons')
      .then(response => {
        if (active) setReasons(response.data);
      })
      .catch(() => {
        if (active) setReasons([]);
      })
      .finally(() => {
        if (active) setReasonsLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent): void {
      if (event.key === 'Escape' && !saving) onClose();
    }

    window.addEventListener('keydown', handleKeyDown);

    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, saving]);

  // Uma vez: período escolhido. Dia inteiro vai da meia-noite do primeiro
  // dia até a meia-noite depois do último
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

  // Problema que impede salvar, mostrado no resumo
  const problem = useMemo(() => {
    if (providerIds.length === 0) {
      return `Escolha pelo menos um ${terms.professional}.`;
    }

    if (mode === 'repeat') {
      if (days.length === 0) return 'Escolha pelo menos um dia da semana.';
      if (!fromTime || !toTime || toTime <= fromTime) {
        return 'Escolha um horário final depois do inicial.';
      }
      if (!fromDate) return 'Escolha a data inicial.';
      if (!noEnd && (!toDate || toDate < fromDate)) {
        return 'Escolha uma data final depois da inicial.';
      }

      return null;
    }

    if (!period || period.end <= period.start) {
      return 'Escolha um fim depois do início.';
    }

    return null;
  }, [
    terms,
    providerIds,
    mode,
    days,
    fromTime,
    toTime,
    fromDate,
    toDate,
    noEnd,
    period,
  ]);

  const summary = useMemo(() => {
    if (problem) return problem;

    if (mode === 'repeat') {
      const until = noEnd ? 'sem data de fim' : `até ${shortDate(toDate)}`;

      return `${describeDays(
        days,
      )}, das ${fromTime} às ${toTime}, a partir de ${shortDate(
        fromDate,
      )}, ${until}.`;
    }

    if (!period) return '';

    if (wholeDay) {
      const count = differenceInCalendarDays(period.end, period.start);

      return count === 1
        ? `O dia ${format(period.start, "d 'de' MMMM", {
            locale: ptBR,
          })} inteiro fica bloqueado.`
        : `${count} dias bloqueados, de ${format(
            period.start,
            'dd/MM',
          )} a ${format(addDays(period.end, -1), 'dd/MM')}.`;
    }

    if (isSameDay(period.start, period.end)) {
      return `Das ${format(period.start, 'HH:mm')} às ${format(
        period.end,
        'HH:mm',
      )} de ${format(period.start, "d 'de' MMMM", { locale: ptBR })}.`;
    }

    return `Das ${format(period.start, 'HH:mm')} (${format(
      period.start,
      'dd/MM',
    )}) às ${format(period.end, 'HH:mm')} (${format(period.end, 'dd/MM')}).`;
  }, [
    problem,
    mode,
    noEnd,
    toDate,
    days,
    fromTime,
    toTime,
    fromDate,
    period,
    wholeDay,
  ]);

  const handleSubmit = useCallback(
    async (event: React.FormEvent) => {
      event.preventDefault();

      if (problem) {
        setError(problem);
        return;
      }

      // O motivo é obrigatório
      if (!reasonId) {
        setError('Escolha o motivo do bloqueio.');
        return;
      }

      setError('');
      setSaving(true);

      try {
        if (mode === 'repeat') {
          await api.post('/blocks/recurring', {
            provider_ids: providerIds,
            days_of_week: days,
            start_time: fromTime,
            end_time: toTime,
            starts_on: fromDate,
            ends_on: noEnd ? null : toDate,
            reason_id: reasonId,
          });
        } else if (period) {
          await api.post('/blocks', {
            provider_ids: providerIds,
            start_date: period.start.toISOString(),
            end_date: period.end.toISOString(),
            reason_id: reasonId,
          });
        }

        const names = providers
          .filter(item => providerIds.includes(item.id))
          .map(item => item.name);
        const who =
          names.length > 2
            ? `${names.length} ${terms.professionals}`
            : names.join(' e ') || provider.name;

        onCreated({
          title: 'Horário bloqueado',
          description: `${who} · ${summary}`,
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
    [
      terms,
      problem,
      mode,
      providerIds,
      days,
      fromTime,
      toTime,
      fromDate,
      noEnd,
      toDate,
      reasonId,
      period,
      providers,
      provider.name,
      summary,
      onCreated,
    ],
  );

  // Alterar qualquer campo apaga o erro anterior
  const edit =
    (setter: (value: string) => void) =>
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setter(event.target.value);
      setError('');
    };

  // Campos de lista (horários): mesmo efeito do edit
  const pick = (setter: (value: string) => void) => (value: string) => {
    setter(value);
    setError('');
  };

  const toggleDay = (day: number): void => {
    setDays(current =>
      current.includes(day)
        ? current.filter(item => item !== day)
        : [...current, day].sort(),
    );
    setError('');
  };

  const repeat = mode === 'repeat';
  const missingReason = error === 'Escolha o motivo do bloqueio.';

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
              {`Ninguém consegue agendar com ${terms.theProfessional} no período bloqueado.`}
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
            <TopRow>
              <Field as="div">
                <span>{terms.Professionals}</span>
                <ProviderPicker
                  providers={providers}
                  selected={providerIds}
                  onChange={selected => {
                    setProviderIds(selected);
                    setError('');
                  }}
                />
              </Field>

              <ModeSwitch role="group" aria-label="Frequência">
                <button
                  type="button"
                  aria-pressed={!repeat}
                  onClick={() => {
                    setMode('once');
                    setError('');
                  }}
                >
                  Uma vez
                </button>
                <button
                  type="button"
                  aria-pressed={repeat}
                  onClick={() => {
                    setMode('repeat');
                    setError('');
                  }}
                >
                  Repetir
                </button>
              </ModeSwitch>
            </TopRow>

            {repeat ? (
              <>
                <PeriodRow>
                  <span>Horário</span>
                  <TimeSelect
                    aria-label="Hora de início"
                    value={fromTime}
                    onChange={pick(setFromTime)}
                  />
                  <TimeSelect
                    aria-label="Hora de fim"
                    value={toTime}
                    onChange={pick(setToTime)}
                  />
                </PeriodRow>

                <PeriodRow>
                  <span>Dias</span>
                  <DayChips selected={days} onToggle={toggleDay} />
                </PeriodRow>

                <PeriodRow>
                  <span>De</span>
                  <TextInput
                    type="date"
                    aria-label="Data inicial"
                    value={fromDate}
                    onChange={edit(setFromDate)}
                  />
                  <span />
                </PeriodRow>

                <PeriodRow>
                  <span>Até</span>
                  <TextInput
                    type="date"
                    aria-label="Data final"
                    value={toDate}
                    min={fromDate}
                    disabled={noEnd}
                    onChange={edit(setToDate)}
                  />
                  <WholeDay>
                    <input
                      type="checkbox"
                      checked={noEnd}
                      onChange={event => {
                        setNoEnd(event.target.checked);
                        // Ao escolher uma data final, começa pela inicial
                        if (!event.target.checked && toDate < fromDate) {
                          setToDate(fromDate);
                        }
                        setError('');
                      }}
                    />
                    Sem fim
                  </WholeDay>
                </PeriodRow>
              </>
            ) : (
              <>
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
                  <TimeSelect
                    aria-label="Hora de início"
                    value={fromTime}
                    disabled={wholeDay}
                    onChange={pick(setFromTime)}
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
                  <TimeSelect
                    aria-label="Hora de fim"
                    value={toTime}
                    disabled={wholeDay}
                    onChange={pick(setToTime)}
                  />
                </PeriodRow>

                <PeriodRow>
                  <span />
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
                  <span />
                </PeriodRow>

                {/* Mesma altura do modo Repetir (uma linha a mais) */}
                <PeriodRow aria-hidden="true">
                  <span />
                </PeriodRow>
              </>
            )}

            <Field as="div">
              <span>Motivo (só a equipe vê)</span>
              <ReasonSelect
                reasons={reasons}
                loading={reasonsLoading}
                value={reasonId}
                invalid={missingReason}
                onChange={chosen => {
                  setReasonId(chosen.id);
                  setError('');
                  // Folga e férias costumam ser o dia inteiro
                  if (
                    !repeat &&
                    ['folga', 'férias', 'ferias'].includes(
                      chosen.name.toLowerCase(),
                    )
                  ) {
                    setWholeDay(true);
                  }
                }}
              />
            </Field>

            <Summary error={!!error} role={error ? 'alert' : undefined}>
              {error ? <FiAlertCircle /> : <FiInfo />}
              {error || summary}
            </Summary>
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
