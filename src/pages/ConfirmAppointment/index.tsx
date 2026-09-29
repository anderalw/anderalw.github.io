import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';
import { FiAlertCircle, FiCheckCircle, FiLoader } from 'react-icons/fi';

import api from '../../services/api';
import getApiErrorMessage from '../../utils/getApiErrorMessage';
import AuthLayout from '../../components/AuthLayout';
import { Result, Details } from './styles';

interface ConfirmationResponse {
  confirmed_now: boolean;
  appointment: {
    date: string;
    end_date: string;
    client_name: string;
    provider_name: string;
    service_name: string;
  };
}

type State =
  | { status: 'loading' }
  | { status: 'done'; data: ConfirmationResponse }
  | { status: 'error'; message: string };

// Página aberta pelo botão "Confirmar presença" do e-mail da véspera. A
// confirmação é feita ao abrir (sem login): o link é único do agendamento
const ConfirmAppointment: React.FC = () => {
  const location = useLocation();
  const [state, setState] = useState<State>({ status: 'loading' });

  useEffect(() => {
    const token = new URLSearchParams(location.search).get('token') || '';

    if (!/^[0-9a-f]{48}$/.test(token)) {
      setState({
        status: 'error',
        message:
          'Link de confirmação inválido. Abra o botão do e-mail novamente.',
      });
      return undefined;
    }

    let active = true;

    api
      .post<ConfirmationResponse>(`/confirmations/${token}`)
      .then(response => {
        if (active) setState({ status: 'done', data: response.data });
      })
      .catch(err => {
        if (!active) return;

        setState({
          status: 'error',
          message: getApiErrorMessage(
            err,
            'Não foi possível confirmar agora. Tente de novo em instantes.',
          ),
        });
      });

    return () => {
      active = false;
    };
  }, [location.search]);

  const footer = (
    <p>
      Precisa mudar o horário?{' '}
      <Link to="/meus-agendamentos">Acesse Meus agendamentos</Link>
    </p>
  );

  if (state.status === 'loading') {
    return (
      <AuthLayout title="Confirmando..." footer={footer}>
        <Result tone="neutral">
          <FiLoader />
          <p>Só um instante.</p>
        </Result>
      </AuthLayout>
    );
  }

  if (state.status === 'error') {
    return (
      <AuthLayout title="Não foi possível confirmar" footer={footer}>
        <Result tone="danger">
          <FiAlertCircle />
          <p>{state.message}</p>
        </Result>
      </AuthLayout>
    );
  }

  const { appointment, confirmed_now: confirmedNow } = state.data;
  const date = parseISO(appointment.date);
  const firstName = appointment.client_name.split(' ')[0];

  return (
    <AuthLayout
      title={confirmedNow ? 'Presença confirmada!' : 'Já estava confirmado'}
      subtitle={`Obrigado${firstName ? `, ${firstName}` : ''}! Te esperamos.`}
      footer={footer}
    >
      <Result tone="success">
        <FiCheckCircle />
        <Details>
          <strong>{appointment.service_name}</strong>
          <span>com {appointment.provider_name}</span>
          <span>
            {format(date, "EEEE, d 'de' MMMM 'às' HH:mm", { locale: ptBR })}
          </span>
        </Details>
      </Result>
    </AuthLayout>
  );
};

export default ConfirmAppointment;
