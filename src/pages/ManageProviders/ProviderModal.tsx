import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FiCheck, FiPlus, FiTrash2, FiX } from 'react-icons/fi';

import api from '../../services/api';
import { useToast } from '../../hooks/Toast';
import getApiErrorMessage from '../../utils/getApiErrorMessage';
import { WeekSchedule } from '../../utils/scheduleSummary';
import describeDays, { listDays } from '../../utils/describeDays';

import { UIButton, Label, Select } from '../../components/ui';
import TimeSelect from '../../components/TimeSelect';
import WeekdayPicker from '../../components/WeekdayPicker';
import { colors } from '../../styles/theme';
import { Overlay, CloseButton } from '../Dashboard/AppointmentDetails/styles';
import {
  WideDialog,
  DialogHeader,
  Main,
  Footer,
} from '../Dashboard/modalLayout';

import {
  ModalSubtitle,
  ModalForm,
  FormColumns,
  FormAside,
  SectionTitle,
  AddSchedule,
  AddRow,
  AddHint,
  GroupList,
  GroupItem,
  DaysOff,
} from './styles';
import { useVocabulary } from '../../hooks/Vocabulary';

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  avatar_url: string | null;
  is_admin: boolean;
  active: boolean;
  schedules: WeekSchedule[];
}

// Usuário da equipe que ainda não é barbeiro
export interface Candidate {
  id: string;
  name: string;
  email: string;
}

interface ProviderModalProps {
  // null = adicionar um barbeiro (escolhendo um dos usuários)
  member: TeamMember | null;
  candidates: Candidate[];
  onClose(): void;
  onSaved(): void;
}

const dayNames = [
  'Domingo',
  'Segunda-feira',
  'Terça-feira',
  'Quarta-feira',
  'Quinta-feira',
  'Sexta-feira',
  'Sábado',
];

// Segunda primeiro, domingo por último
const WEEK_ORDER = [1, 2, 3, 4, 5, 6, 0];

// Dias com o mesmo horário, mostrados numa linha só
interface ScheduleGroup {
  days: number[];
  start_time: string;
  end_time: string;
}

function toGroups(schedules: WeekSchedule[]): ScheduleGroup[] {
  const groups: ScheduleGroup[] = [];

  WEEK_ORDER.forEach(day => {
    const schedule = schedules.find(item => item.day_of_week === day);

    if (!schedule) return;

    const group = groups.find(
      item =>
        item.start_time === schedule.start_time &&
        item.end_time === schedule.end_time,
    );

    if (group) {
      group.days.push(day);
    } else {
      groups.push({
        days: [day],
        start_time: schedule.start_time,
        end_time: schedule.end_time,
      });
    }
  });

  return groups;
}

// Modal para adicionar um barbeiro ou mudar os horários dele: quem é à
// esquerda (um usuário da equipe) e os horários da semana à direita, com
// tamanho fixo e sem rolagem
const ProviderModal: React.FC<ProviderModalProps> = ({
  member,
  candidates,
  onClose,
  onSaved,
}) => {
  const terms = useVocabulary();
  const { addToast } = useToast();
  const isNew = !member;
  // Usuário escolhido para virar barbeiro
  const [userId, setUserId] = useState(candidates[0]?.id || '');

  // Um horário por dia de atendimento ('HH:mm')
  const [schedules, setSchedules] = useState<WeekSchedule[]>(() =>
    (member?.schedules || []).map(item => ({
      day_of_week: item.day_of_week,
      start_time: item.start_time.slice(0, 5),
      end_time: item.end_time.slice(0, 5),
    })),
  );
  // Formulário de adicionar: dias marcados e o horário deles
  const [newDays, setNewDays] = useState<number[]>([]);
  const [newStart, setNewStart] = useState('09:00');
  const [newEnd, setNewEnd] = useState('18:00');
  const [scheduleError, setScheduleError] = useState('');
  const [saving, setSaving] = useState(false);

  const groups = toGroups(schedules);
  const daysOff = WEEK_ORDER.filter(
    day => !schedules.some(item => item.day_of_week === day),
  );

  const toggleNewDay = (day: number): void => {
    setNewDays(current =>
      current.includes(day)
        ? current.filter(item => item !== day)
        : [...current, day],
    );
    setScheduleError('');
  };

  // Aplica o horário aos dias marcados. Um dia que já tinha horário passa a
  // usar o novo (assim um dia diferente dos outros é só adicionar de novo)
  const handleAddSchedule = (): void => {
    if (newDays.length === 0) {
      setScheduleError('Marque os dias da semana.');
      return;
    }

    if (newEnd <= newStart) {
      setScheduleError('O fim precisa ser depois do início.');
      return;
    }

    setSchedules(current => [
      ...current.filter(item => !newDays.includes(item.day_of_week)),
      ...newDays.map(day_of_week => ({
        day_of_week,
        start_time: newStart,
        end_time: newEnd,
      })),
    ]);
    setNewDays([]);
    setScheduleError('');
  };

  // Os dias do grupo viram folga
  const handleRemoveGroup = (group: ScheduleGroup): void => {
    setSchedules(current =>
      current.filter(item => !group.days.includes(item.day_of_week)),
    );
  };

  // Esc fecha o modal (a não ser no meio do salvamento)
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent): void {
      if (event.key === 'Escape' && !saving) onClose();
    }

    window.addEventListener('keydown', handleKeyDown);

    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, saving]);

  const handleSubmit = useCallback(async () => {
    if (isNew && !userId) {
      addToast({
        type: 'error',
        title: 'Escolha o usuário',
        description: `Cadastre a pessoa em Usuários antes de colocá-la na agenda.`,
      });
      return;
    }

    // Valida os horários antes de gravar qualquer coisa
    const invalid = schedules.find(
      ({ start_time, end_time }) =>
        !start_time.endsWith(':00') ||
        !end_time.endsWith(':00') ||
        start_time >= end_time,
    );

    if (invalid) {
      addToast({
        type: 'error',
        title: 'Horário inválido',
        description: `${
          dayNames[invalid.day_of_week]
        }: use horas cheias (ex: 09:00) e um início antes do fim.`,
      });
      return;
    }

    setSaving(true);

    try {
      const providerId = member ? member.id : userId;
      const name = member
        ? member.name
        : candidates.find(item => item.id === userId)?.name || '';

      if (!member) await api.post('/barbers', { user_id: userId });

      // Substitui todos os horários (sem dias marcados = sem atendimento)
      await api.post(`/schedules/${providerId}`, { schedules });

      addToast({
        type: 'success',
        title: isNew ? `${terms.Professional} adicionado!` : 'Horários salvos',
        description: isNew
          ? `${name} já aparece na agenda e no site.`
          : `Horários de ${name} atualizados.`,
      });

      onSaved();
    } catch (err) {
      addToast({
        type: 'error',
        title: 'Não foi possível salvar',
        description: getApiErrorMessage(err, 'Tente novamente.'),
      });
    } finally {
      setSaving(false);
    }
  }, [terms, isNew, userId, member, candidates, schedules, addToast, onSaved]);

  return (
    <Overlay
      onMouseDown={event => {
        if (event.target === event.currentTarget && !saving) onClose();
      }}
    >
      <WideDialog
        color={colors.primary}
        role="dialog"
        aria-modal="true"
        aria-labelledby="provider-modal-title"
      >
        <DialogHeader>
          <div>
            <h2 id="provider-modal-title">
              {isNew
                ? `Adicionar ${terms.professional}`
                : `Horários de ${member?.name}`}
            </h2>
            <ModalSubtitle>
              {isNew
                ? 'Escolha quem da equipe vai atender.'
                : 'Os dias e horários em que ele atende.'}
            </ModalSubtitle>
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

        <ModalForm onSubmit={handleSubmit}>
          <FormColumns>
            <FormAside>
              <SectionTitle>{terms.Professional}</SectionTitle>
              {isNew ? (
                <>
                  <Label>
                    Usuário
                    <Select
                      value={userId}
                      disabled={candidates.length === 0}
                      autoFocus
                      onChange={event => setUserId(event.target.value)}
                    >
                      {candidates.length === 0 && (
                        <option value="">Ninguém disponível</option>
                      )}
                      {candidates.map(item => (
                        <option key={item.id} value={item.id}>
                          {`${item.name} (${item.email})`}
                        </option>
                      ))}
                    </Select>
                  </Label>
                  <ModalSubtitle>
                    Não achou? Cadastre a pessoa em{' '}
                    <Link to="/admin/usuarios">Usuários</Link> e volte aqui.
                  </ModalSubtitle>
                </>
              ) : (
                <>
                  <strong>{member?.name}</strong>
                  <ModalSubtitle>{member?.email}</ModalSubtitle>
                  <ModalSubtitle>
                    Nome, e-mail, senha e perfil de acesso ficam em{' '}
                    <Link to="/admin/usuarios">Usuários</Link>.
                  </ModalSubtitle>
                </>
              )}
            </FormAside>

            <Main>
              <SectionTitle>Horários de atendimento</SectionTitle>
              <AddSchedule>
                <AddRow>
                  <span>Dias</span>
                  <WeekdayPicker selected={newDays} onToggle={toggleNewDay} />
                </AddRow>
                <AddRow>
                  <span>Horário</span>
                  <TimeSelect
                    stepMinutes={60}
                    aria-label="Início"
                    value={newStart}
                    onChange={value => {
                      setNewStart(value);
                      setScheduleError('');
                    }}
                  />
                  <small>até</small>
                  <TimeSelect
                    stepMinutes={60}
                    aria-label="Fim"
                    value={newEnd}
                    onChange={value => {
                      setNewEnd(value);
                      setScheduleError('');
                    }}
                  />
                  <UIButton
                    type="button"
                    variant="secondary"
                    onClick={handleAddSchedule}
                  >
                    <FiPlus />
                    Adicionar
                  </UIButton>
                </AddRow>
                {/* Espaço reservado: a dica vira o erro sem mexer no resto */}
                <AddHint error={!!scheduleError}>
                  {scheduleError ||
                    'Um dia que já tem horário passa a usar o novo.'}
                </AddHint>
              </AddSchedule>

              <GroupList>
                {groups.map(group => (
                  <GroupItem key={group.days.join(',')}>
                    <strong>{describeDays(group.days)}</strong>
                    <span>
                      {group.start_time} – {group.end_time}
                    </span>
                    <UIButton
                      type="button"
                      variant="ghost"
                      size="sm"
                      title={`Remover ${describeDays(group.days)}`}
                      aria-label={`Remover ${describeDays(group.days)}`}
                      onClick={() => handleRemoveGroup(group)}
                    >
                      <FiTrash2 />
                    </UIButton>
                  </GroupItem>
                ))}

                <DaysOff>
                  {groups.length === 0
                    ? 'Nenhum horário ainda: marque os dias, escolha o horário e clique em Adicionar.'
                    : daysOff.length > 0 && `Folga: ${listDays(daysOff)}`}
                </DaysOff>
              </GroupList>
            </Main>
          </FormColumns>

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
              {saving && 'Salvando...'}
              {!saving &&
                (isNew ? `Adicionar ${terms.professional}` : 'Salvar horários')}
            </UIButton>
          </Footer>
        </ModalForm>
      </WideDialog>
    </Overlay>
  );
};

export default ProviderModal;
