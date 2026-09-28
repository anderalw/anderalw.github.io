import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';
import ptBR from 'date-fns/locale/pt-BR';

import api from '../../services/api';
import { useToast } from '../../hooks/Toast';
import { useAuth } from '../../hooks/Auth';
import getApiErrorMessage from '../../utils/getApiErrorMessage';
import { formatPrice } from '../../utils/money';
import avatarFallback from '../../utils/avatarFallback';

import {
  Container,
  Content,
  Section,
  ProviderContainer,
  ProviderName,
  ServiceOption,
  HourList,
  Hour,
  HelpText,
  TimesBox,
  BookingSummary,
} from './styles';

interface Provider {
  id: string;
  name: string;
  avatar_url: string;
}

interface Service {
  id: string;
  name: string;
  price_cents: number;
}

// Horário livre para o serviço escolhido, no formato 'HH:mm'
interface AvailableTime {
  time: string;
}

const CreateAppointment: React.FC = () => {
  const { addToast } = useToast();
  // Cliente com sessão iniciada (a rota só abre para clientes)
  const { client, signOut } = useAuth();

  const [services, setServices] = useState<Service[]>([]);
  const [servicesLoaded, setServicesLoaded] = useState(false);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [selectedService, setSelectedService] = useState('');
  const [selectedProvider, setSelectedProvider] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [availableTimes, setAvailableTimes] = useState<AvailableTime[]>([]);
  const [loadingTimes, setLoadingTimes] = useState(false);
  // Muda a cada agendamento feito, para recarregar os horários livres
  const [refreshKey, setRefreshKey] = useState(0);

  // Serviços ativos e barbeiros, ao abrir a página
  useEffect(() => {
    api
      .get<Service[]>('/services')
      .then(response => {
        setServices(response.data);
      })
      .finally(() => setServicesLoaded(true));

    api.get<Provider[]>('/providers').then(response => {
      setProviders(response.data);
      if (response.data.length > 0) {
        setSelectedProvider(response.data[0].id);
      }
    });
  }, []);

  // Horários livres: dependem do serviço (duração), do barbeiro e do dia
  useEffect(() => {
    setSelectedTime('');

    if (!selectedService || !selectedProvider || !selectedDate) {
      setAvailableTimes([]);
      return undefined;
    }

    let active = true;
    // O input nativo devolve 'YYYY-MM-DD'
    const [year, month, day] = selectedDate.split('-');

    setLoadingTimes(true);

    api
      .get<AvailableTime[]>(`/providers/${selectedProvider}/day-availability`, {
        params: { year, month, day, service_id: selectedService },
      })
      .then(response => {
        if (active) setAvailableTimes(response.data);
      })
      .catch(() => {
        if (active) setAvailableTimes([]);
      })
      .finally(() => {
        if (active) setLoadingTimes(false);
      });

    return () => {
      active = false;
    };
  }, [selectedService, selectedProvider, selectedDate, refreshKey]);

  const service = useMemo(
    () => services.find(item => item.id === selectedService),
    [services, selectedService],
  );
  const provider = useMemo(
    () => providers.find(item => item.id === selectedProvider),
    [providers, selectedProvider],
  );

  const appointmentDate = useMemo(() => {
    if (!selectedDate || !selectedTime) return null;

    const [year, month, day] = selectedDate.split('-').map(Number);
    const [hours, minutes] = selectedTime.split(':').map(Number);

    return new Date(year, month - 1, day, hours, minutes);
  }, [selectedDate, selectedTime]);

  const handleCreateAppointment = useCallback(async () => {
    if (!service || !provider || !appointmentDate) return;

    try {
      // O backend identifica o cliente pelo token, não é preciso enviar o id
      await api.post('/appointments', {
        provider_id: provider.id,
        service_id: service.id,
        date: appointmentDate,
      });

      addToast({
        type: 'success',
        title: 'Agendamento concluído!',
        description: `${service.name} com ${provider.name} em ${format(
          appointmentDate,
          "dd/MM/yyyy 'às' HH:mm",
        )}.`,
      });

      // Limpa o horário e recarrega a lista para permitir um novo agendamento
      setSelectedTime('');
      setRefreshKey(key => key + 1);
    } catch (err) {
      addToast({
        type: 'error',
        title: 'Erro ao agendar',
        description: getApiErrorMessage(
          err,
          'Ocorreu um erro ao tentar criar o agendamento, tente novamente.',
        ),
      });
      // O horário pode ter sido ocupado por outra pessoa
      setRefreshKey(key => key + 1);
    }
  }, [service, provider, appointmentDate, addToast]);

  const canConfirm = !!(service && provider && appointmentDate);

  return (
    <Container>
      <Content>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '16px',
          }}
        >
          <span>
            Olá, <strong style={{ color: '#ff9000' }}>{client?.name}</strong>
          </span>
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            <Link
              to="/meus-agendamentos"
              style={{ color: '#ff9000', textDecoration: 'none' }}
            >
              Meus agendamentos
            </Link>
            <button
              type="button"
              onClick={signOut}
              style={{
                marginTop: 0,
                background: 'transparent',
                border: 0,
                color: '#999591',
                cursor: 'pointer',
              }}
            >
              Sair
            </button>
          </div>
        </div>

        <h1>Agendar Horário</h1>

        <Section>
          <strong>1. Escolha o serviço</strong>
          {!servicesLoaded && <HelpText>Carregando serviços...</HelpText>}
          {servicesLoaded && services.length === 0 && (
            <HelpText>Nenhum serviço disponível no momento.</HelpText>
          )}
          {services.length > 0 && (
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              {services.map(item => (
                <ServiceOption
                  key={item.id}
                  type="button"
                  selected={item.id === selectedService}
                  aria-pressed={item.id === selectedService}
                  onClick={() => setSelectedService(item.id)}
                >
                  <span>{item.name}</span>
                  <small>{formatPrice(item.price_cents)}</small>
                </ServiceOption>
              ))}
            </div>
          )}
        </Section>

        <Section>
          <strong>2. Escolha o profissional</strong>
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
            {providers.map(item => (
              <ProviderContainer
                key={item.id}
                selected={item.id === selectedProvider}
                onClick={() => setSelectedProvider(item.id)}
              >
                <img
                  src={item.avatar_url || avatarFallback(item.name)}
                  alt={item.name}
                  onError={e => {
                    e.currentTarget.src = avatarFallback(item.name);
                  }}
                />
                <ProviderName selected={item.id === selectedProvider}>
                  {item.name}
                </ProviderName>
              </ProviderContainer>
            ))}
          </div>
        </Section>

        <Section>
          <strong>3. Escolha a data</strong>
          <input
            type="date"
            value={selectedDate}
            min={format(new Date(), 'yyyy-MM-dd')}
            onChange={e => setSelectedDate(e.target.value)}
          />
        </Section>

        {/* Sempre visível, com altura fixa, para a página não crescer */}
        <Section>
          <strong>4. Escolha o horário</strong>
          <TimesBox>
            {(!selectedService || !selectedDate) && (
              <HelpText>
                Escolha o serviço e a data para ver os horários livres.
              </HelpText>
            )}
            {selectedService && selectedDate && loadingTimes && (
              <HelpText>Carregando horários...</HelpText>
            )}
            {selectedService &&
              selectedDate &&
              !loadingTimes &&
              availableTimes.length === 0 && (
                <HelpText>
                  Nenhum horário livre neste dia. Tente outra data ou outro
                  profissional.
                </HelpText>
              )}
            <HourList>
              {availableTimes.map(({ time }) => (
                <Hour
                  key={time}
                  available
                  selected={selectedTime === time}
                  onClick={() => setSelectedTime(time)}
                >
                  {time}
                </Hour>
              ))}
            </HourList>
          </TimesBox>
        </Section>

        <BookingSummary>
          {canConfirm && service && provider && appointmentDate
            ? `${service.name} (${formatPrice(service.price_cents)}) com ${
                provider.name
              }, ${format(appointmentDate, "EEEE, d 'de' MMMM 'às' HH:mm", {
                locale: ptBR,
              })}.`
            : ''}
        </BookingSummary>

        <button
          type="button"
          onClick={handleCreateAppointment}
          disabled={!canConfirm}
          style={{
            width: '100%',
            background: '#ff9000',
            borderRadius: '10px',
            border: 0,
            padding: '16px',
            color: '#312e38',
            fontWeight: 500,
            cursor: canConfirm ? 'pointer' : 'not-allowed',
            opacity: canConfirm ? 1 : 0.5,
          }}
        >
          Confirmar Agendamento
        </button>
      </Content>
    </Container>
  );
};

export default CreateAppointment;
