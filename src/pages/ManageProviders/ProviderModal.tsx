import React, { useCallback, useEffect, useRef, useState } from 'react';
import { FormHandles } from '@unform/core';
import * as Yup from 'yup';
import { FiCheck, FiX } from 'react-icons/fi';

import api from '../../services/api';
import { useToast } from '../../hooks/Toast';
import getValidationErrors from '../../utils/getValidationErros';
import getApiErrorMessage from '../../utils/getApiErrorMessage';
import { WeekSchedule } from '../../utils/scheduleSummary';

import FormField from '../../components/FormField';
import { UIButton, TextInput, Badge } from '../../components/ui';
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
  ScheduleTable,
  DayToggle,
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

interface DayRow {
  day_of_week: number;
  start_time: string;
  end_time: string;
  enabled: boolean;
}

function toRows(schedules: WeekSchedule[]): DayRow[] {
  return WEEK_ORDER.map(day_of_week => {
    const schedule = schedules.find(item => item.day_of_week === day_of_week);

    return {
      day_of_week,
      start_time: schedule?.start_time.slice(0, 5) || '09:00',
      end_time: schedule?.end_time.slice(0, 5) || '18:00',
      enabled: !!schedule,
    };
  });
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

  const [rows, setRows] = useState<DayRow[]>(() =>
    toRows(member?.schedules || []),
  );
  const [saving, setSaving] = useState(false);

  // Esc fecha o modal (a não ser no meio do salvamento)
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent): void {
      if (event.key === 'Escape' && !saving) onClose();
    }

    window.addEventListener('keydown', handleKeyDown);

    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, saving]);

  const updateRow = (
    index: number,
    field: keyof DayRow,
    value: string | boolean,
  ): void => {
    setRows(current =>
      current.map((row, i) => (i === index ? { ...row, [field]: value } : row)),
    );
  };

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

        const schedules = rows
          .filter(row => row.enabled)
          .map(({ day_of_week, start_time, end_time }) => ({
            day_of_week,
            start_time,
            end_time,
          }));

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
    [isNew, member, rows, addToast, onSaved],
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
              <ScheduleTable>
                <tbody>
                  {rows.map((row, index) => (
                    <tr key={row.day_of_week}>
                      <td>
                        <DayToggle>
                          <input
                            type="checkbox"
                            checked={row.enabled}
                            onChange={e =>
                              updateRow(index, 'enabled', e.target.checked)
                            }
                          />
                          <span>{dayNames[row.day_of_week]}</span>
                        </DayToggle>
                      </td>
                      {row.enabled ? (
                        <>
                          <td>
                            <TextInput
                              type="time"
                              step={3600}
                              aria-label={`Início, ${
                                dayNames[row.day_of_week]
                              }`}
                              value={row.start_time}
                              onChange={e =>
                                updateRow(index, 'start_time', e.target.value)
                              }
                            />
                          </td>
                          <td className="until">até</td>
                          <td>
                            <TextInput
                              type="time"
                              step={3600}
                              aria-label={`Fim, ${dayNames[row.day_of_week]}`}
                              value={row.end_time}
                              onChange={e =>
                                updateRow(index, 'end_time', e.target.value)
                              }
                            />
                          </td>
                        </>
                      ) : (
                        <td colSpan={3} className="off">
                          <Badge>Folga</Badge>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </ScheduleTable>
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
