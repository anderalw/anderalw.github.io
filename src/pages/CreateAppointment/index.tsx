import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useHistory } from 'react-router-dom';
import { format } from 'date-fns';

import api from '../../services/api';
import { useToast } from '../../hooks/Toast';

import {
  Container,
  Content,
  Section,
  ProviderContainer,
  ProviderName,
  HourList,
  Hour,
} from './styles';

interface Provider {
  id: string;
  name: string;
  avatar_url: string;
}

interface AvailabilityItem {
  hour: number;
  available: boolean;
}

const CreateAppointment: React.FC = () => {
  const history = useHistory();
  const { addToast } = useToast();

  const [providers, setProviders] = useState<Provider[]>([]);
  const [selectedProvider, setSelectedProvider] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedHour, setSelectedHour] = useState<number>(0);
  const [availability, setAvailability] = useState<AvailabilityItem[]>([]);

  // 1. Recuperar o cliente que fez login
  const client = useMemo(() => {
    const clientData = localStorage.getItem('@GoBarber:client');
    return clientData ? JSON.parse(clientData) : null;
  }, []);

  // 2. Carregar a lista de Barbeiros ao abrir a página
  useEffect(() => {
    api.get<Provider[]>('/providers').then(response => {
      setProviders(response.data);
      if (response.data.length > 0) {
        setSelectedProvider(response.data[0].id);
      }
    });
  }, []);

  // 3. Buscar os horários disponíveis quando a data ou barbeiro mudam
  useEffect(() => {
    if (!selectedProvider || !selectedDate) {
      setAvailability([]);
      return;
    }

    // O input nativo devolve 'YYYY-MM-DD', precisamos de separar
    const [year, month, day] = selectedDate.split('-');

    api.get(`/providers/${selectedProvider}/day-availability`, {
      params: {
        year,
        month,
        day,
      },
    }).then(response => {
      setAvailability(response.data);
      setSelectedHour(0); // Limpa a hora selecionada ao mudar de dia
    });
  }, [selectedDate, selectedProvider]);

  // 4. Ação do botão final para criar o agendamento
  const handleCreateAppointment = useCallback(async () => {
    try {
      if (!selectedDate) {
        addToast({ type: 'error', title: 'Erro', description: 'Por favor, escolha uma data.' });
        return;
      }
      if (selectedHour === 0) {
        addToast({ type: 'error', title: 'Erro', description: 'Por favor, escolha um horário.' });
        return;
      }

      // Monta a data final para enviar ao backend
      const [year, month, day] = selectedDate.split('-');
      const date = new Date(Number(year), Number(month) - 1, Number(day), selectedHour, 0, 0);

      if (!client || !client.id) {
        throw new Error('Cliente não autenticado');
      }

      await api.post('/appointments', {
        provider_id: selectedProvider,
        client_id: client.id,
        date,
      });

      addToast({
        type: 'success',
        title: 'Agendamento concluído!',
        description: `Horário reservado com sucesso para dia ${format(date, 'dd/MM/yyyy às HH:mm')}.`,
      });

      history.push('/');
    } catch (err) {
      addToast({
        type: 'error',
        title: 'Erro ao agendar',
        description: 'Ocorreu um erro ao tentar criar o agendamento, tente novamente.',
      });
    }
  }, [selectedDate, selectedHour, selectedProvider, client, history, addToast]);

  return (
    <Container>
      <Content>
        <h1>Agendar Horário</h1>

        <Section>
          <strong>1. Escolha o profissional</strong>
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
            {providers.map(provider => (
              <ProviderContainer
                key={provider.id}
                selected={provider.id === selectedProvider}
                onClick={() => setSelectedProvider(provider.id)}
              >
                <img 
                  src={provider.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(provider.name)}&background=28262e&color=ff9000`} 
                  alt={provider.name} 
                  onError={(e) => {
                    e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(provider.name)}&background=28262e&color=ff9000`;
                  }}
                />
                <ProviderName selected={provider.id === selectedProvider}>
                  {provider.name}
                </ProviderName>
              </ProviderContainer>
            ))}
          </div>
        </Section>

        <Section>
          <strong>2. Escolha a data</strong>
          <input 
            type="date" 
            value={selectedDate}
            onChange={e => setSelectedDate(e.target.value)}
          />
        </Section>

        {/* Esta secção só aparece depois de o cliente escolher uma data no calendário */}
        {selectedDate && (
          <Section>
            <strong>3. Escolha o horário</strong>
            <HourList>
              {availability.map(({ hour, available }) => (
                <Hour
                  key={hour}
                  available={available}
                  selected={selectedHour === hour}
                  onClick={() => available && setSelectedHour(hour)}
                >
                  {String(hour).padStart(2, '0')}:00
                </Hour>
              ))}
            </HourList>
          </Section>
        )}

        <button 
          type="button" 
          onClick={handleCreateAppointment}
          disabled={selectedHour === 0}
          style={{
            width: '100%',
            background: '#ff9000',
            borderRadius: '10px',
            border: 0,
            padding: '16px',
            color: '#312e38',
            fontWeight: 500,
            cursor: selectedHour === 0 ? 'not-allowed' : 'pointer',
            opacity: selectedHour === 0 ? 0.5 : 1
          }}
        >
          Confirmar Agendamento
        </button>
      </Content>
    </Container>
  );
};

export default CreateAppointment;