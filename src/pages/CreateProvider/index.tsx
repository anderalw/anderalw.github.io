import React, { useRef, useCallback, useState } from 'react';
import { Redirect, useHistory } from 'react-router-dom';
import { FormHandles } from '@unform/core';
import { Form } from '@unform/web';
import * as Yup from 'yup';
import { FiUser, FiMail, FiLock } from 'react-icons/fi';

import api from '../../services/api';
import { useToast } from '../../hooks/Toast';
import { useAuth } from '../../hooks/Auth';
import getValidationErrors from '../../utils/getValidationErros';
import getApiErrorMessage from '../../utils/getApiErrorMessage';

import Input from '../../components/Input';
import Button from '../../components/Button';

import { Container, Content, ScheduleContainer, ScheduleItem } from './styles';

const dayNames = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];

const CreateProvider: React.FC = () => {
  const formRef = useRef<FormHandles>(null);
  const { addToast } = useToast();
  const history = useHistory();
  const { user } = useAuth();

  // Estado para controlar os dias e horas (inicia Segunda a Sábado inativos)
  const [schedules, setSchedules] = useState([
    { day_of_week: 1, start_time: '09:00', end_time: '18:00', enabled: false },
    { day_of_week: 2, start_time: '09:00', end_time: '18:00', enabled: false },
    { day_of_week: 3, start_time: '09:00', end_time: '18:00', enabled: false },
    { day_of_week: 4, start_time: '09:00', end_time: '18:00', enabled: false },
    { day_of_week: 5, start_time: '09:00', end_time: '18:00', enabled: false },
    { day_of_week: 6, start_time: '09:00', end_time: '18:00', enabled: false },
  ]);

  // Função para atualizar um campo específico de um dia na grelha
  const handleScheduleChange = (index: number, field: string, value: string | boolean) => {
    const updatedSchedules = [...schedules];
    updatedSchedules[index] = { ...updatedSchedules[index], [field]: value };
    setSchedules(updatedSchedules);
  };

  const handleSubmit = useCallback(async (data: any) => {
    try {
      formRef.current?.setErrors({});

      const schema = Yup.object().shape({
        name: Yup.string().required('Nome obrigatório'),
        email: Yup.string().required('E-mail obrigatório').email('Digite um e-mail válido'),
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
      // um barbeiro registado sem horários se estes forem recusados
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
          description: `${dayNames[invalidSchedule.day_of_week]}: use horas cheias (ex: 09:00) e um início antes do fim.`,
        });
        return;
      }

      // 3. Criar o utilizador
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
        title: 'Barbeiro registado!',
        description: 'O novo profissional e os seus horários foram configurados.',
      });

      history.push('/dashboard');
    } catch (err) {
      if (err instanceof Yup.ValidationError) {
        formRef.current?.setErrors(getValidationErrors(err));
        return;
      }

      addToast({
        type: 'error',
        title: 'Erro no registo',
        description: getApiErrorMessage(err, 'Ocorreu um erro ao registar o barbeiro, valide os dados.'),
      });
    }
  }, [addToast, history, schedules]);

  // Só administradores registam barbeiros (a API também valida)
  if (!user.is_admin) {
    return <Redirect to="/dashboard" />;
  }

  return (
    <Container>
      <Content>
        <h1>Registar Novo Barbeiro</h1>

        <Form ref={formRef} onSubmit={handleSubmit}>
          <Input name="name" icon={FiUser} placeholder="Nome Completo" />
          <Input name="email" icon={FiMail} type="email" placeholder="E-mail" />
          <Input name="password" icon={FiLock} type="password" placeholder="Palavra-passe provisória" />

          <ScheduleContainer>
            <h2>Horários de Trabalho</h2>
            
            {schedules.map((schedule, index) => (
              <ScheduleItem key={schedule.day_of_week}>
                <div className="day-info">
                  <input
                    type="checkbox"
                    checked={schedule.enabled}
                    onChange={(e) => handleScheduleChange(index, 'enabled', e.target.checked)}
                  />
                  <span>{dayNames[schedule.day_of_week]}</span>
                </div>

                {schedule.enabled && (
                  <div className="time-inputs">
                    <input
                      type="time"
                      step={3600}
                      value={schedule.start_time}
                      onChange={(e) => handleScheduleChange(index, 'start_time', e.target.value)}
                    />
                    <span>até</span>
                    <input
                      type="time"
                      step={3600}
                      value={schedule.end_time}
                      onChange={(e) => handleScheduleChange(index, 'end_time', e.target.value)}
                    />
                  </div>
                )}
              </ScheduleItem>
            ))}
          </ScheduleContainer>

          <Button type="submit">Registar e Configurar Horários</Button>
        </Form>
      </Content>
    </Container>
  );
};

export default CreateProvider;