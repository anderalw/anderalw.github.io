import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { format, startOfDay } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';
import DayPicker from 'react-day-picker';
import 'react-day-picker/lib/style.css';
import { FiCheck, FiClock, FiUsers } from 'react-icons/fi';

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
  Select,
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
  TotalNote,
  SummaryFooter,
  WaitlistBox,
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

type WaitlistPeriod = 'any' | 'morning' | 'afternoon' | 'evening';

// Pedido na lista de espera de um dia lotado
interface WaitlistRequest {
  id: string;
  date: string;
  period: WaitlistPeriod;
}

const PERIODS: { value: WaitlistPeriod; label: string }[] = [
  { value: 'any', label: 'Qualquer horário' },
  { value: 'morning', label: 'De manhã (até 12h)' },
  { value: 'afternoon', label: 'À tarde (12h às 18h)' },
  { value: 'evening', label: 'À noite (depois das 18h)' },
];

// Valor de selectedProvider para "Qualquer barbeiro"
const ANY_PROVIDER = 'any';

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

// Prévia do clube para o serviço e o horário escolhidos
interface Benefit {
  membership_id: string | null;
  price_cents: number;
  plan_name: string | null;
  reason: string | null;
}

const CreateAppointment: React.FC = () => {
  const { addToast } = useToast();
  const location = useLocation();

  const [services, setServices] = useState<Service[]>([]);
  const [servicesLoaded, setServicesLoaded] = useState(false);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [providersLoaded, setProvidersLoaded] = useState(false);
  const [selectedService, setSelectedService] = useState('');
  // Começa em "Qualquer barbeiro": mostra todos os horários da barbearia
  const [selectedProvider, setSelectedProvider] = useState(ANY_PROVIDER);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState('');
  const [availableTimes, setAvailableTimes] = useState<AvailableTime[]>([]);
  const [loadingTimes, setLoadingTimes] = useState(false);
  const [saving, setSaving] = useState(false);
  // Muda a cada agendamento feito, para recarregar os horários livres
  const [refreshKey, setRefreshKey] = useState(0);
  // Lista de espera: pedidos do cliente e o período escolhido
  const [waitlist, setWaitlist] = useState<WaitlistRequest[]>([]);
  const [waitPeriod, setWaitPeriod] = useState<WaitlistPeriod>('any');
  const [joining, setJoining] = useState(false);
  // Clube: o cliente tem plano (reserva a linha do benefício) e a prévia
  // do preço para o serviço e o horário escolhidos
  const [hasPlan, setHasPlan] = useState(false);
  const [benefit, setBenefit] = useState<Benefit | null>(null);

  const loadWaitlist = useCallback(() => {
    api
      .get<WaitlistRequest[]>('/waitlist/me')
      .then(response => setWaitlist(response.data))
      .catch(() => {
        // Sem a lista, o agendamento funciona normalmente
      });
  }, []);

  useEffect(loadWaitlist, [loadWaitlist]);

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
      })
      .finally(() => setProvidersLoaded(true));
  }, []);

  // Vindo do site (card do serviço) ou de "Agendar de novo": já escolhe o
  // serviço e o barbeiro do endereço (?servico=&barbeiro=), se existirem
  useEffect(() => {
    if (!servicesLoaded || !providersLoaded) return;

    const params = new URLSearchParams(location.search);
    const serviceId = params.get('servico');
    const providerId = params.get('barbeiro');

    if (serviceId && services.some(item => item.id === serviceId)) {
      setSelectedService(serviceId);
    }

    if (providerId && providers.some(item => item.id === providerId)) {
      setSelectedProvider(providerId);
    }
    // Só ao abrir a página
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [servicesLoaded, providersLoaded]);

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
  const isAnyProvider = selectedProvider === ANY_PROVIDER;
  const provider = useMemo(
    () => providers.find(item => item.id === selectedProvider),
    [providers, selectedProvider],
  );
  const providerChosen = isAnyProvider || !!provider;

  const appointmentDate = useMemo(() => {
    if (!selectedDate || !selectedTime) return null;

    const [hours, minutes] = selectedTime.split(':').map(Number);
    const date = new Date(selectedDate);
    date.setHours(hours, minutes, 0, 0);

    return date;
  }, [selectedDate, selectedTime]);

  useEffect(() => {
    api
      .get<{ state: string } | null>('/memberships/me')
      .then(response =>
        setHasPlan(!!response.data && response.data.state !== 'pending'),
      )
      .catch(() => setHasPlan(false));
  }, []);

  // Sem horário ainda: a prévia usa o dia escolhido (ou hoje)
  // (valor fixo por abertura da tela: "agora" mudaria a cada render)
  const [openedAt] = useState(() => Date.now());
  const benefitTime =
    appointmentDate?.getTime() ?? selectedDate?.getTime() ?? openedAt;

  useEffect(() => {
    setBenefit(null);

    if (!hasPlan || !selectedService) return undefined;

    let active = true;

    api
      .get<Benefit>('/memberships/me/benefit', {
        params: {
          service_id: selectedService,
          date: new Date(benefitTime).toISOString(),
        },
      })
      .then(response => {
        if (active) setBenefit(response.data);
      })
      .catch(() => {
        // Sem a prévia: vale o preço do serviço
      });

    return () => {
      active = false;
    };
  }, [hasPlan, selectedService, benefitTime]);

  const handleCreateAppointment = useCallback(async () => {
    if (!service || !providerChosen || !appointmentDate) return;

    setSaving(true);

    try {
      // O backend identifica o cliente pelo token, não é preciso enviar o id.
      // Sem preferência, ele escolhe um barbeiro livre no horário
      const response = isAnyProvider
        ? await api.post<{ provider_id: string }>('/appointments/any', {
            service_id: service.id,
            date: appointmentDate,
          })
        : await api.post<{ provider_id: string }>('/appointments', {
            provider_id: provider?.id,
            service_id: service.id,
            date: appointmentDate,
          });

      const assigned = providers.find(
        item => item.id === response.data.provider_id,
      );

      addToast({
        type: 'success',
        title: 'Agendamento concluído!',
        description: `${service.name} com ${
          assigned?.name || 'um dos nossos barbeiros'
        } em ${format(appointmentDate, "dd/MM/yyyy 'às' HH:mm")}.`,
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
  }, [
    service,
    provider,
    providers,
    providerChosen,
    isAnyProvider,
    appointmentDate,
    addToast,
  ]);

  const canConfirm = !!(service && providerChosen && appointmentDate);

  let totalText = service ? formatPrice(service.price_cents) : 'R$ –';
  let totalNote = '';

  if (service && benefit) {
    if (benefit.membership_id) {
      totalText = 'Incluso no plano';
      totalNote = `${benefit.plan_name} · ${formatPrice(
        service.price_cents,
      )} no preço normal`;
    } else {
      totalText = formatPrice(benefit.price_cents);
      totalNote = benefit.reason
        ? `${benefit.plan_name}: ${benefit.reason}`
        : '';
    }
  }

  const dateKey = selectedDate ? format(selectedDate, 'yyyy-MM-dd') : '';
  const waitingRequest = waitlist.find(item => item.date === dateKey);
  const dayIsFull =
    !!selectedService &&
    !!selectedDate &&
    !loadingTimes &&
    availableTimes.length === 0;

  const joinWaitlist = useCallback(async () => {
    if (!selectedDate) return;

    setJoining(true);

    try {
      await api.post('/waitlist/me', {
        date: format(selectedDate, 'yyyy-MM-dd'),
        provider_id: isAnyProvider ? null : selectedProvider,
        service_id: selectedService || null,
        period: waitPeriod,
      });

      addToast({
        type: 'success',
        title: 'Você está na lista de espera',
        description: 'Se abrir um horário neste dia, avisamos por e-mail.',
      });
      loadWaitlist();
    } catch (err) {
      addToast({
        type: 'error',
        title: 'Não foi possível entrar na lista',
        description: getApiErrorMessage(err, 'Tente novamente.'),
      });
    } finally {
      setJoining(false);
    }
  }, [
    selectedDate,
    isAnyProvider,
    selectedProvider,
    selectedService,
    waitPeriod,
    addToast,
    loadWaitlist,
  ]);

  const leaveWaitlist = useCallback(async () => {
    if (!waitingRequest) return;

    setJoining(true);

    try {
      await api.delete(`/waitlist/${waitingRequest.id}`);
      loadWaitlist();
    } catch (err) {
      addToast({
        type: 'error',
        title: 'Não foi possível sair da lista',
        description: getApiErrorMessage(err, 'Tente novamente.'),
      });
    } finally {
      setJoining(false);
    }
  }, [waitingRequest, addToast, loadWaitlist]);

  let timesMessage = '';

  if (!selectedService || !selectedDate) {
    timesMessage = 'Escolha o serviço e o dia para ver os horários livres.';
  } else if (loadingTimes) {
    timesMessage = 'Carregando horários...';
  } else if (availableTimes.length === 0) {
    timesMessage = isAnyProvider
      ? 'Nenhum barbeiro tem horário livre neste dia. Tente outra data.'
      : 'Nenhum horário livre neste dia. Tente outra data ou outro profissional.';
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
                <StepNumber done={providerChosen}>
                  {providerChosen ? <FiCheck /> : 2}
                </StepNumber>
                <h2>Profissional</h2>
              </CardHeader>
              <CardBody>
                <OptionGrid min={180}>
                  {!providersLoaded
                    ? [0, 1, 2].map(item => <OptionSkeleton key={item} />)
                    : [
                        <ProviderOption
                          key={ANY_PROVIDER}
                          type="button"
                          selected={isAnyProvider}
                          aria-pressed={isAnyProvider}
                          onClick={() => setSelectedProvider(ANY_PROVIDER)}
                        >
                          <span className="any-icon">
                            <FiUsers />
                          </span>
                          <div>
                            <strong>Qualquer barbeiro</strong>
                            <small>Mais horários disponíveis</small>
                          </div>
                        </ProviderOption>,
                        ...providers.map(item => (
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
                        )),
                      ]}
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
                        <>
                          <HelpText>{timesMessage}</HelpText>

                          {dayIsFull && waitingRequest && (
                            <WaitlistBox>
                              <strong>
                                <FiClock /> Você está na lista de espera
                              </strong>
                              <p>
                                Se alguém cancelar um horário neste dia,
                                avisamos você por e-mail. Quem agendar primeiro
                                fica com o horário.
                              </p>
                              <UIButton
                                type="button"
                                variant="ghost"
                                size="sm"
                                style={{ marginTop: 10 }}
                                disabled={joining}
                                onClick={leaveWaitlist}
                              >
                                Sair da lista
                              </UIButton>
                            </WaitlistBox>
                          )}

                          {dayIsFull && !waitingRequest && (
                            <WaitlistBox>
                              <strong>Quer esperar uma vaga?</strong>
                              <p>
                                Entre na lista de espera: se alguém cancelar,
                                avisamos você por e-mail.
                              </p>
                              <Select
                                aria-label="Período"
                                value={waitPeriod}
                                onChange={event =>
                                  setWaitPeriod(
                                    event.target.value as WaitlistPeriod,
                                  )
                                }
                              >
                                {PERIODS.map(option => (
                                  <option
                                    key={option.value}
                                    value={option.value}
                                  >
                                    {option.label}
                                  </option>
                                ))}
                              </Select>
                              <UIButton
                                type="button"
                                size="sm"
                                disabled={joining}
                                onClick={joinWaitlist}
                              >
                                <FiClock />
                                {joining
                                  ? 'Entrando...'
                                  : 'Entrar na lista de espera'}
                              </UIButton>
                            </WaitlistBox>
                          )}
                        </>
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
                  <dd className={providerChosen ? '' : 'empty'}>
                    {isAnyProvider
                      ? 'Qualquer barbeiro'
                      : provider?.name || 'A escolher'}
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
                  <strong>{totalText}</strong>
                </Total>
                {hasPlan && <TotalNote>{totalNote}</TotalNote>}
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
