import React, { useRef, useCallback, useEffect, useState } from 'react';
import { Redirect } from 'react-router-dom';
import { FormHandles } from '@unform/core';
import { Form } from '@unform/web';
import * as Yup from 'yup';
import { FiUserPlus } from 'react-icons/fi';

import api from '../../services/api';
import { useToast } from '../../hooks/Toast';
import { useAuth } from '../../hooks/Auth';
import getValidationErrors from '../../utils/getValidationErros';
import getApiErrorMessage from '../../utils/getApiErrorMessage';
import avatarFallback from '../../utils/avatarFallback';

import AppLayout from '../../components/AppLayout';
import FormField from '../../components/FormField';
import {
  Page,
  PageHeader,
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  FieldGrid,
  UIButton,
  TextInput,
  Badge,
} from '../../components/ui';

import {
  Columns,
  SectionTitle,
  ScheduleTable,
  DayToggle,
  TeamList,
  TeamSkeleton,
} from './styles';

const dayNames = [
  'Domingo',
  'Segunda-feira',
  'Terça-feira',
  'Quarta-feira',
  'Quinta-feira',
  'Sexta-feira',
  'Sábado',
];

interface CreateProviderFormData {
  name: string;
  email: string;
  password: string;
}

interface TeamMember {
  id: string;
  name: string;
  email: string;
  avatar_url: string | null;
}

// Segunda a sábado, inativos até o administrador marcar
const INITIAL_SCHEDULES = [1, 2, 3, 4, 5, 6].map(day_of_week => ({
  day_of_week,
  start_time: '09:00',
  end_time: '18:00',
  enabled: false,
}));

const CreateProvider: React.FC = () => {
  const formRef = useRef<FormHandles>(null);
  const { addToast } = useToast();
  const { user } = useAuth();

  const [schedules, setSchedules] = useState(INITIAL_SCHEDULES);
  const [saving, setSaving] = useState(false);
  // Os outros barbeiros (a API não inclui quem está logado)
  const [team, setTeam] = useState<TeamMember[] | null>(null);

  const loadTeam = useCallback(() => {
    api
      .get<TeamMember[]>('/providers')
      .then(response => setTeam(response.data))
      .catch(() => setTeam([]));
  }, []);

  useEffect(() => {
    if (user.is_admin) loadTeam();
  }, [user.is_admin, loadTeam]);

  // Atualiza um campo de um dia na tabela de horários
  const handleScheduleChange = (
    index: number,
    field: string,
    value: string | boolean,
  ): void => {
    const updatedSchedules = [...schedules];
    updatedSchedules[index] = { ...updatedSchedules[index], [field]: value };
    setSchedules(updatedSchedules);
  };

  const handleSubmit = useCallback(
    async (data: CreateProviderFormData) => {
      try {
        formRef.current?.setErrors({});

        const schema = Yup.object().shape({
          name: Yup.string().required('Nome obrigatório'),
          email: Yup.string()
            .required('E-mail obrigatório')
            .email('Digite um e-mail válido'),
          password: Yup.string().required('Senha obrigatória'),
        });

        await schema.validate(data, { abortEarly: false });

        // 1. Filtrar apenas os dias ativados pelo Administrador
        const activeSchedules = schedules
          .filter(schedule => schedule.enabled)
          .map(({ day_of_week, start_time, end_time }) => ({
            day_of_week,
            start_time,
            end_time,
          }));

        // 2. Validar os horários antes de criar o barbeiro, para não deixar
        // um barbeiro cadastrado sem horários se estes forem recusados
        const invalidSchedule = activeSchedules.find(
          ({ start_time, end_time }) =>
            !start_time.endsWith(':00') ||
            !end_time.endsWith(':00') ||
            start_time >= end_time,
        );

        if (invalidSchedule) {
          addToast({
            type: 'error',
            title: 'Horário inválido',
            description: `${
              dayNames[invalidSchedule.day_of_week]
            }: use horas cheias (ex: 09:00) e um início antes do fim.`,
          });
          return;
        }

        setSaving(true);

        // 3. Criar o usuário
        const response = await api.post('/users', {
          name: data.name,
          email: data.email,
          password: data.password,
        });

        const newProviderId = response.data.id;

        // 4. Enviar os horários se houver algum dia selecionado
        if (activeSchedules.length > 0) {
          await api.post(`/schedules/${newProviderId}`, {
            schedules: activeSchedules,
          });
        }

        addToast({
          type: 'success',
          title: 'Barbeiro cadastrado!',
          description: `${data.name} já aparece na agenda${
            activeSchedules.length > 0 ? ' com os horários definidos' : ''
          }.`,
        });

        // Pronto para cadastrar o próximo
        formRef.current?.reset();
        setSchedules(INITIAL_SCHEDULES);
        loadTeam();
      } catch (err) {
        if (err instanceof Yup.ValidationError) {
          formRef.current?.setErrors(getValidationErrors(err));
          return;
        }

        addToast({
          type: 'error',
          title: 'Erro no cadastro',
          description: getApiErrorMessage(
            err,
            'Ocorreu um erro ao cadastrar o barbeiro, confira os dados.',
          ),
        });
      } finally {
        setSaving(false);
      }
    },
    [addToast, schedules, loadTeam],
  );

  // Só administradores registam barbeiros (a API também valida)
  if (!user.is_admin) {
    return <Redirect to="/dashboard" />;
  }

  const members: (TeamMember & { you?: boolean })[] = [
    { ...user, you: true },
    ...(team || []),
  ];

  return (
    <AppLayout>
      <Page>
        <PageHeader>
          <div>
            <h1>Barbeiros</h1>
            <p>Cadastre profissionais e os dias e horários em que atendem.</p>
          </div>
        </PageHeader>

        <Columns>
          <Card>
            <Form ref={formRef} onSubmit={handleSubmit}>
              <CardHeader>
                <div>
                  <h2>Novo barbeiro</h2>
                  <p>Ele entra com o e-mail e a senha provisória abaixo.</p>
                </div>
              </CardHeader>

              <CardBody>
                <SectionTitle>Dados de acesso</SectionTitle>
                <FormField name="name" label="Nome completo" />
                <FieldGrid>
                  <FormField name="email" type="email" label="E-mail" />
                  <FormField
                    name="password"
                    type="password"
                    label="Senha provisória"
                    hint="Ele pode trocar depois, no perfil."
                    autoComplete="new-password"
                  />
                </FieldGrid>

                <SectionTitle>Horários de trabalho</SectionTitle>
                <ScheduleTable>
                  <tbody>
                    {schedules.map((schedule, index) => (
                      <tr key={schedule.day_of_week}>
                        <td>
                          <DayToggle>
                            <input
                              type="checkbox"
                              checked={schedule.enabled}
                              onChange={e =>
                                handleScheduleChange(
                                  index,
                                  'enabled',
                                  e.target.checked,
                                )
                              }
                            />
                            <span>{dayNames[schedule.day_of_week]}</span>
                          </DayToggle>
                        </td>
                        <td>
                          <TextInput
                            type="time"
                            step={3600}
                            aria-label={`Início, ${
                              dayNames[schedule.day_of_week]
                            }`}
                            disabled={!schedule.enabled}
                            value={schedule.start_time}
                            onChange={e =>
                              handleScheduleChange(
                                index,
                                'start_time',
                                e.target.value,
                              )
                            }
                          />
                        </td>
                        <td className="until">até</td>
                        <td>
                          <TextInput
                            type="time"
                            step={3600}
                            aria-label={`Fim, ${
                              dayNames[schedule.day_of_week]
                            }`}
                            disabled={!schedule.enabled}
                            value={schedule.end_time}
                            onChange={e =>
                              handleScheduleChange(
                                index,
                                'end_time',
                                e.target.value,
                              )
                            }
                          />
                        </td>
                        <td className="status">
                          {!schedule.enabled && <Badge>Folga</Badge>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </ScheduleTable>
              </CardBody>

              <CardFooter>
                <UIButton type="submit" disabled={saving}>
                  <FiUserPlus />
                  {saving ? 'Cadastrando...' : 'Cadastrar barbeiro'}
                </UIButton>
              </CardFooter>
            </Form>
          </Card>

          <Card>
            <CardHeader>
              <h2>Equipe</h2>
            </CardHeader>

            <TeamList>
              {team === null
                ? [0, 1, 2].map(item => <TeamSkeleton key={item} />)
                : members.map(member => (
                    <li key={member.id}>
                      <img
                        src={member.avatar_url || avatarFallback(member.name)}
                        alt=""
                        onError={e => {
                          e.currentTarget.src = avatarFallback(member.name);
                        }}
                      />
                      <div>
                        <strong>{member.name}</strong>
                        <small>{member.email}</small>
                      </div>
                      {member.you && <Badge tone="primary">Você</Badge>}
                    </li>
                  ))}
            </TeamList>
          </Card>
        </Columns>
      </Page>
    </AppLayout>
  );
};

export default CreateProvider;
