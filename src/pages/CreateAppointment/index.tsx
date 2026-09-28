import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { format, startOfDay } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';
import DayPicker from 'react-day-picker';
import 'react-day-picker/lib/style.css';
import { FiCheck } from 'react-icons/fi';

import api from '../../services/api';
import { useToast } from '../../hooks/Toast';
import getApiErrorMessage from '../../utils/getApiErrorMessage';
import { formatPrice } from '../../utils/money';
import { formatDuration } from '../../utils/duration';
import avatarFallback from '../../utils/avatarFallback';

import AppLayout from '../../components/AppLayout';
import {
  Page,
  PageHeader,
  Card,
  CardHeader,
  CardBody,
  UIButton,
} from '../../components/ui';
import { Calendar } from '../../components/ui/Calendar';

import {
  Columns,
  Steps,
  StepNumber,
  OptionGrid,
  ServiceOption,
  ProviderOption,
  OptionSkeleton,
  DateTime,
  TimesArea,
  TimesBox,
  HourList,
  Hour,
  HelpText,
  Summary,
  SummaryList,
  Total,
  SummaryFooter,
} from './styles';

interface Provider {
  id: string;
  name: string;
  avatar_url: string;
}

interface Service {
  id: string;
  name: string;
  duration_minutes: number;
  price_cents: number;
}

// Horário livre para o serviço escolhido, no formato 'HH:mm'
interface AvailableTime {
  time: string;
}

const MONTHS = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
];

const CreateAppointment: React.FC = () => {
  const { addToast } = useToast();

  const [services, setServices] = useState<Service[]>([]);
  const [servicesLoaded, setServicesLoaded] = useState(false);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [providersLoaded, setProvidersLoaded] = useState(false);
  const [selectedService, setSelectedService] = useState('');
  const [selectedProvider, setSelectedProvider] = useState('');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState('');
  const [availableTimes, setAvailableTimes] = useState<AvailableTime[]>([]);
  const [loadingTimes, setLoadingTimes] = useState(false);
  const [saving, setSaving] = useState(false);
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

    api
      .get<Provider[]>('/providers')
      .then(response => {
        setProviders(response.data);
        if (response.data.length > 0) {
          setSelectedProvider(response.data[0].id);
        }
      })
      .finally(() => setProvidersLoaded(true));
  }, []);

  // Horários livres: dependem do serviço (duração), do barbeiro e do dia
  useEffect(() => {
    setSelectedTime('');

    if (!selectedService || !selectedProvider || !selectedDate) {
      setAvailableTimes([]);
      return undefined;
    }

    let active = true;

    setLoadingTimes(true);

    api
      .get<AvailableTime[]>(`/providers/${selectedProvider}/day-availability`, {
        params: {
          year: selectedDate.getFullYear(),
          month: selectedDate.getMonth() + 1,
          day: selectedDate.getDate(),
          service_id: selectedService,
        },
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

    const [hours, minutes] = selectedTime.split(':').map(Number);
    const date = new Date(selectedDate);
    date.setHours(hours, minutes, 0, 0);

    return date;
  }, [selectedDate, selectedTime]);

  const handleCreateAppointment = useCallback(async () => {
    if (!service || !provider || !appointmentDate) return;

    setSaving(true);

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
    } finally {
      setSaving(false);
    }
  }, [service, provider, appointmentDate, addToast]);

  const canConfirm = !!(service && provider && appointmentDate);

  let timesMessage = '';

  if (!selectedService || !selectedDate) {
    timesMessage = 'Escolha o serviço e o dia para ver os horários livres.';
  } else if (loadingTimes) {
    timesMessage = 'Carregando horários...';
  } else if (availableTimes.length === 0) {
    timesMessage =
      'Nenhum horário livre neste dia. Tente outra data ou outro profissional.';
  }

  return (
    <AppLayout>
      <Page>
        <PageHeader>
          <div>
            <h1>Agendar horário</h1>
            <p>Escolha o serviço, o profissional e o melhor horário.</p>
          </div>
        </PageHeader>

        <Columns>
          <Steps>
            <Card>
              <CardHeader>
                <StepNumber done={!!service}>
                  {service ? <FiCheck /> : 1}
                </StepNumber>
                <h2>Serviço</h2>
              </CardHeader>
              <CardBody>
                {servicesLoaded && services.length === 0 ? (
                  <HelpText>Nenhum serviço disponível no momento.</HelpText>
                ) : (
                  <OptionGrid min={260}>
                    {!servicesLoaded
                      ? [0, 1, 2, 3].map(item => <OptionSkeleton key={item} />)
                      : services.map(item => (
                          <ServiceOption
                            key={item.id}
                            type="button"
                            selected={item.id === selectedService}
                            aria-pressed={item.id === selectedService}
                            onClick={() => setSelectedService(item.id)}
                          >
                            <div>
                              <strong>{item.name}</strong>
                              <small>
                                {formatDuration(item.duration_minutes)}
                              </small>
                            </div>
                            <span>{formatPrice(item.price_cents)}</span>
                          </ServiceOption>
                        ))}
                  </OptionGrid>
                )}
              </CardBody>
            </Card>

            <Card>
              <CardHeader>
                <StepNumber done={!!provider}>
                  {provider ? <FiCheck /> : 2}
                </StepNumber>
                <h2>Profissional</h2>
              </CardHeader>
              <CardBody>
                <OptionGrid min={180}>
                  {!providersLoaded
                    ? [0, 1, 2].map(item => <OptionSkeleton key={item} />)
                    : providers.map(item => (
                        <ProviderOption
                          key={item.id}
                          type="button"
                          selected={item.id === selectedProvider}
                          aria-pressed={item.id === selectedProvider}
                          onClick={() => setSelectedProvider(item.id)}
                        >
                          <img
                            src={item.avatar_url || avatarFallback(item.name)}
                            alt=""
                            onError={e => {
                              e.currentTarget.src = avatarFallback(item.name);
                            }}
                          />
                          <strong>{item.name}</strong>
                        </ProviderOption>
                      ))}
                </OptionGrid>
              </CardBody>
            </Card>

            <Card>
              <CardHeader>
                <StepNumber done={!!appointmentDate}>
                  {appointmentDate ? <FiCheck /> : 3}
                </StepNumber>
                <h2>Data e horário</h2>
              </CardHeader>
              <CardBody>
                <DateTime>
                  <Calendar>
                    <DayPicker
                      locale="pt-BR"
                      weekdaysShort={['D', 'S', 'T', 'Q', 'Q', 'S', 'S']}
                      months={MONTHS}
                      fromMonth={new Date()}
                      disabledDays={{ before: new Date() }}
                      selectedDays={selectedDate || undefined}
                      onDayClick={(day, modifiers) => {
                        if (!modifiers.disabled) {
                          setSelectedDate(startOfDay(day));
                        }
                      }}
                    />
                  </Calendar>

                  <TimesArea>
                    <span>
                      {selectedDate
                        ? format(selectedDate, "EEEE, d 'de' MMMM", {
                            locale: ptBR,
                          })
                        : 'Horários livres'}
                    </span>
                    <TimesBox>
                      {timesMessage ? (
                        <HelpText>{timesMessage}</HelpText>
                      ) : (
                        <HourList>
                          {availableTimes.map(({ time }) => (
                            <Hour
                              key={time}
                              type="button"
                              selected={selectedTime === time}
                              aria-pressed={selectedTime === time}
                              onClick={() => setSelectedTime(time)}
                            >
                              {time}
                            </Hour>
                          ))}
                        </HourList>
                      )}
                    </TimesBox>
                  </TimesArea>
                </DateTime>
              </CardBody>
            </Card>
          </Steps>

          <Summary>
            <Card>
              <CardHeader>
                <h2>Resumo</h2>
              </CardHeader>
              <CardBody>
                <SummaryList>
                  <dt>Serviço</dt>
                  <dd className={service ? '' : 'empty'} title={service?.name}>
                    {service?.name || 'A escolher'}
                  </dd>
                  <dt>Duração</dt>
                  <dd className={service ? '' : 'empty'}>
                    {service ? formatDuration(service.duration_minutes) : '–'}
                  </dd>
                  <dt>Profissional</dt>
                  <dd className={provider ? '' : 'empty'}>
                    {provider?.name || 'A escolher'}
                  </dd>
                  <dt>Data</dt>
                  <dd className={selectedDate ? '' : 'empty'}>
                    {selectedDate
                      ? format(selectedDate, "EEE, d 'de' MMM", {
                          locale: ptBR,
                        })
                      : 'A escolher'}
                  </dd>
                  <dt>Horário</dt>
                  <dd className={selectedTime ? '' : 'empty'}>
                    {selectedTime || 'A escolher'}
                  </dd>
                </SummaryList>

                <Total>
                  <span>Total</span>
                  <strong>
                    {service ? formatPrice(service.price_cents) : 'R$ –'}
                  </strong>
                </Total>
              </CardBody>

              <SummaryFooter>
                <UIButton
                  type="button"
                  onClick={handleCreateAppointment}
                  disabled={!canConfirm || saving}
                >
                  <FiCheck />
                  {saving ? 'Agendando...' : 'Confirmar agendamento'}
                </UIButton>
                <small>Você pode remarcar ou cancelar até 2 horas antes.</small>
              </SummaryFooter>
            </Card>
          </Summary>
        </Columns>
      </Page>
    </AppLayout>
  );
};

export default CreateAppointment;
