import React, { useCallback, useEffect, useRef, useState } from 'react';
import { FormHandles } from '@unform/core';
import * as Yup from 'yup';
import { FiCheck, FiPlus, FiTrash2, FiX } from 'react-icons/fi';

import api from '../../services/api';
import { useToast } from '../../hooks/Toast';
import getValidationErrors from '../../utils/getValidationErros';
import getApiErrorMessage from '../../utils/getApiErrorMessage';
import { WeekSchedule } from '../../utils/scheduleSummary';
import describeDays, { listDays } from '../../utils/describeDays';

import FormField from '../../components/FormField';
import { UIButton } from '../../components/ui';
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

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  avatar_url: string | null;
  is_admin: boolean;
  active: boolean;
  schedules: WeekSchedule[];
}

interface ProviderFormData {
  name: string;
  email: string;
  password?: string;
}

interface ProviderModalProps {
  // null = novo barbeiro
  member: TeamMember | null;
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

// Modal para cadastrar ou editar um barbeiro: dados de acesso à esquerda e
// os horários da semana à direita, com tamanho fixo e sem rolagem
const ProviderModal: React.FC<ProviderModalProps> = ({
  member,
  onClose,
  onSaved,
}) => {
  const formRef = useRef<FormHandles>(null);
  const { addToast } = useToast();
  const isNew = !member;

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

  const handleSubmit = useCallback(
    async (data: ProviderFormData) => {
      try {
        formRef.current?.setErrors({});

        const schema = Yup.object().shape({
          name: Yup.string().trim().required('Nome obrigatório'),
          email: Yup.string()
            .trim()
            .required('E-mail obrigatório')
            .email('Digite um e-mail válido'),
          password: isNew
            ? Yup.string().required('Senha obrigatória')
            : Yup.string(),
        });

        await schema.validate(data, { abortEarly: false });

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

        let providerId: string;

        if (member) {
          await api.put(`/users/${member.id}`, {
            name: data.name,
            email: data.email,
          });
          providerId = member.id;
        } else {
          const response = await api.post('/users', {
            name: data.name,
            email: data.email,
            password: data.password,
          });
          providerId = response.data.id;
        }

        // Substitui todos os horários (sem dias marcados = sem atendimento)
        await api.post(`/schedules/${providerId}`, { schedules });

        addToast({
          type: 'success',
          title: isNew ? 'Barbeiro cadastrado!' : 'Alterações salvas',
          description: isNew
            ? `${data.name.trim()} já aparece na agenda.`
            : `Dados e horários de ${data.name.trim()} atualizados.`,
        });

        onSaved();
      } catch (err) {
        if (err instanceof Yup.ValidationError) {
          formRef.current?.setErrors(getValidationErrors(err));
          return;
        }

        addToast({
          type: 'error',
          title: 'Não foi possível salvar',
          description: getApiErrorMessage(
            err,
            'Confira os dados do barbeiro e tente novamente.',
          ),
        });
      } finally {
        setSaving(false);
      }
    },
    [isNew, member, schedules, addToast, onSaved],
  );

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
              {isNew ? 'Novo barbeiro' : `Editar ${member?.name}`}
            </h2>
            <ModalSubtitle>
              {isNew
                ? 'Ele entra com o e-mail e a senha provisória.'
                : 'A senha continua sendo a do barbeiro.'}
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

        <ModalForm
          ref={formRef}
          onSubmit={handleSubmit}
          initialData={{ name: member?.name, email: member?.email }}
        >
          <FormColumns>
            <FormAside>
              <SectionTitle>Dados de acesso</SectionTitle>
              <FormField name="name" label="Nome completo" autoFocus />
              <FormField name="email" type="email" label="E-mail" />
              {isNew && (
                <FormField
                  name="password"
                  type="password"
                  label="Senha provisória"
                  hint="Ele pode trocar depois, no perfil."
                  autoComplete="new-password"
                />
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
              {!saving && (isNew ? 'Cadastrar barbeiro' : 'Salvar alterações')}
            </UIButton>
          </Footer>
        </ModalForm>
      </WideDialog>
    </Overlay>
  );
};

export default ProviderModal;
