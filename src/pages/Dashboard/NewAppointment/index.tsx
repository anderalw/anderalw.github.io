import React, { useCallback, useEffect, useRef, useState } from 'react';
import { addMinutes, format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';
import {
  FiCalendar,
  FiCheck,
  FiDollarSign,
  FiRepeat,
  FiScissors,
  FiSlash,
  FiUser,
  FiX,
} from 'react-icons/fi';

import api from '../../../services/api';
import { useToast } from '../../../hooks/Toast';
import getApiErrorMessage from '../../../utils/getApiErrorMessage';
import avatarFallback from '../../../utils/avatarFallback';
import { formatPrice } from '../../../utils/money';
import {
  formatPhone,
  looksLikePhone,
  maskPhone,
  onlyDigits,
} from '../../../utils/phone';

import { Overlay, CloseButton } from '../AppointmentDetails/styles';
import { WaitlistItem, PERIOD_LABELS } from '../WaitlistPanel';
import {
  Field,
  PrimaryButton,
  SecondaryButton,
} from '../../../components/RescheduleForm/styles';
import {
  WideDialog,
  DialogHeader,
  Columns,
  Aside,
  Main,
  Footer,
} from '../modalLayout';
import {
  StepLabel,
  Summary,
  StatusArea,
  SlotStatus,
  SuggestionRow,
  SuggestionButtons,
  Suggestion,
  SectionLabel,
  SearchResults,
  ResultButton,
  NotFound,
  LinkButton,
  RegisterGrid,
  ServiceList,
  ServiceOption,
  RepeatGrid,
  OccurrenceGrid,
  Occurrence,
  RepeatNote,
} from './styles';
import ProfileExtraFields from '../../../components/ProfileExtraFields';
import {
  ExtraValues,
  extraPayload,
  useProfileFields,
} from '../../../utils/profileFields';
import { useFeatures } from '../../../hooks/Vocabulary';

interface ClientOption {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
}

interface Service {
  id: string;
  name: string;
  duration_minutes: number;
  price_cents: number;
}

interface ProviderOption {
  id: string;
  name: string;
  avatar_url: string | null;
}

type SlotCheck =
  | { status: 'checking' }
  | { status: 'fits'; end: Date }
  | {
      status: 'conflict';
      reason: string;
      // Horários livres mais próximos com o mesmo barbeiro
      before: Date[];
      after: Date[];
      // Outros barbeiros livres exatamente no horário clicado
      others: ProviderOption[];
    };

interface NewAppointmentProps {
  // Barbeiro e início definidos pelo clique na agenda
  provider: ProviderOption;
  start: Date;
  color: string;
  onClose(): void;
  onCreated(message: { title: string; description: string }): void;
}

type Step = 'client' | 'register' | 'service' | 'repeat';

// Prévia do clube para o cliente e o serviço escolhidos
interface Benefit {
  membership_id: string | null;
  price_cents: number;
  list_price_cents: number | null;
  plan_name: string | null;
  reason: string | null;
}

// Cliente fixo: horários da série e se cada um está livre
interface SeriesOccurrence {
  date: Date;
  available: boolean;
  reason: string | null;
}

type SeriesPreview =
  | { status: 'loading' }
  | { status: 'done'; occurrences: SeriesOccurrence[] }
  | { status: 'error'; message: string };

const INTERVALS = [1, 2, 3, 4];
const COUNTS = [2, 3, 4, 5, 6, 8, 10, 12, 16, 20, 26];

function intervalText(weeks: number): string {
  return weeks === 1 ? 'Toda semana' : `A cada ${weeks} semanas`;
}

function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

// Aproveita o que foi digitado na busca para começar o cadastro
function prefillFromSearch(term: string): {
  name: string;
  phone: string;
  email: string;
} {
  const value = term.trim();

  if (value.includes('@')) return { name: '', phone: '', email: value };
  if (looksLikePhone(value)) {
    return { name: '', phone: maskPhone(value), email: '' };
  }

  return { name: value, phone: '', email: '' };
}

const NewAppointment: React.FC<NewAppointmentProps> = ({
  provider,
  start,
  color,
  onClose,
  onCreated,
}) => {
  const features = useFeatures();
  const { addToast } = useToast();
  const searchInputRef = useRef<HTMLInputElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<Step>('client');

  // Passo 1: cliente
  const [search, setSearch] = useState('');
  const [results, setResults] = useState<ClientOption[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchedTerm, setSearchedTerm] = useState('');
  const [client, setClient] = useState<ClientOption | null>(null);
  // Regras do cadastro pela barbearia: aqui só os obrigatórios (o resto
  // se completa na ficha do cliente)
  const counterRules = useProfileFields('client_counter');
  const requiredRules = counterRules
    ? Object.fromEntries(
        Object.entries(counterRules).filter(([, rule]) => rule?.required),
      )
    : undefined;
  const [newExtras, setNewExtras] = useState<ExtraValues>({});
  const [newClient, setNewClient] = useState({
    name: '',
    phone: '',
    email: '',
  });
  const [registering, setRegistering] = useState(false);
  // Quem está na lista de espera do dia (aparece antes da busca)
  const [waiting, setWaiting] = useState<WaitlistItem[]>([]);

  // Passo 2: serviço (barbeiro e horário vêm do clique)
  const [services, setServices] = useState<Service[]>([]);
  const [service, setService] = useState<Service | null>(null);
  const [slot, setSlot] = useState<SlotCheck | null>(null);
  const [chosenStart, setChosenStart] = useState<Date | null>(null);
  // Muda quando o horário clicado só está livre com outro barbeiro
  const [chosenProvider, setChosenProvider] = useState(provider);
  const [saving, setSaving] = useState(false);

  // Passo 3 (opcional): cliente fixo
  const [intervalWeeks, setIntervalWeeks] = useState(2);
  const [count, setCount] = useState(6);
  const [preview, setPreview] = useState<SeriesPreview | null>(null);
  // Clube: incluso no plano do cliente, com desconto ou preço normal
  const [benefit, setBenefit] = useState<Benefit | null>(null);

  // Esc fecha o painel
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent): void {
      if (event.key === 'Escape') {
        onClose();
      }
    }

    window.addEventListener('keydown', handleKeyDown);

    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Foco no primeiro campo de cada passo
  useEffect(() => {
    if (step === 'client') searchInputRef.current?.focus();
    if (step === 'register') nameInputRef.current?.focus();
  }, [step]);

  useEffect(() => {
    api.get<Service[]>('/services').then(response => {
      setServices(response.data);
    });
  }, []);

  useEffect(() => {
    api
      .get<WaitlistItem[]>('/waitlist', {
        params: { date: format(start, 'yyyy-MM-dd') },
      })
      .then(response => {
        setWaiting(
          response.data.filter(item => !item.booked && item.client !== null),
        );
      })
      .catch(() => {
        // Sem a lista, a busca funciona normalmente
      });
  }, [start]);

  // Busca enquanto digita (a partir de 2 letras, com uma pausa)
  useEffect(() => {
    const term = search.trim();

    if (term.length < 2) {
      setResults([]);
      setSearchedTerm('');
      return undefined;
    }

    let active = true;

    const timer = setTimeout(() => {
      setSearching(true);

      api
        .get<ClientOption[]>('/clients', {
          // Os telefones são gravados só com números
          params: { search: looksLikePhone(term) ? onlyDigits(term) : term },
        })
        .then(response => {
          if (!active) return;

          setResults(response.data);
          setSearchedTerm(term);
        })
        .catch(() => {
          if (active) setResults([]);
        })
        .finally(() => {
          if (active) setSearching(false);
        });
    }, 300);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [search]);

  const selectClient = useCallback((option: ClientOption) => {
    setClient(option);
    setStep('service');
  }, []);

  const openRegister = useCallback(() => {
    setNewClient(prefillFromSearch(search));
    setStep('register');
  }, [search]);

  const handleRegister = useCallback(async () => {
    setRegistering(true);

    try {
      const response = await api.post<ClientOption>('/clients/by-provider', {
        name: newClient.name.trim(),
        phone: onlyDigits(newClient.phone),
        email: newClient.email.trim() || null,
        ...extraPayload(requiredRules, newExtras),
      });

      setRegistering(false);
      selectClient(response.data);
    } catch (err) {
      setRegistering(false);
      addToast({
        type: 'error',
        title: 'Não foi possível cadastrar',
        description: getApiErrorMessage(
          err,
          'Confira os dados do cliente e tente novamente.',
        ),
      });
    }
  }, [newClient, newExtras, requiredRules, selectClient, addToast]);

  // Ao escolher o serviço, confere se ele cabe no horário clicado; se não
  // couber, sugere os horários livres mais próximos (antes e depois) e os
  // outros barbeiros livres no mesmo horário
  const chooseService = useCallback(
    async (option: Service) => {
      setService(option);
      setSlot({ status: 'checking' });
      setChosenStart(null);
      setChosenProvider(provider);

      try {
        const check = await api.get<
          | { available: true; end: string }
          | { available: false; reason: string }
        >(`/providers/${provider.id}/slot`, {
          params: { service_id: option.id, date: start.toISOString() },
        });

        if (check.data.available) {
          setChosenStart(start);
          setSlot({ status: 'fits', end: new Date(check.data.end) });
          return;
        }

        const suggestions = await api.get<{
          before: string[];
          after: string[];
          others: ProviderOption[];
        }>(`/providers/${provider.id}/suggestions`, {
          params: { service_id: option.id, date: start.toISOString() },
        });

        setSlot({
          status: 'conflict',
          reason: check.data.reason,
          before: suggestions.data.before.map(date => new Date(date)),
          after: suggestions.data.after.map(date => new Date(date)),
          others: suggestions.data.others,
        });
      } catch (err) {
        setSlot(null);
        addToast({
          type: 'error',
          title: 'Não foi possível verificar o horário',
          description: getApiErrorMessage(err, 'Tente novamente.'),
        });
      }
    },
    [provider, start, addToast],
  );

  const chooseTime = useCallback(
    (date: Date) => {
      setChosenProvider(provider);
      setChosenStart(date);
    },
    [provider],
  );

  const chooseOtherProvider = useCallback(
    (other: ProviderOption) => {
      setChosenProvider(other);
      setChosenStart(start);
    },
    [start],
  );

  const handleConfirm = useCallback(async () => {
    if (!client || !service || !chosenStart) return;

    setSaving(true);

    try {
      await api.post('/appointments/by-provider', {
        provider_id: chosenProvider.id,
        service_id: service.id,
        date: chosenStart,
        client_id: client.id,
      });

      onCreated({
        title: 'Agendamento criado',
        description: `${client.name}: ${service.name} com ${
          chosenProvider.name
        } às ${format(chosenStart, 'HH:mm')}.`,
      });
    } catch (err) {
      setSaving(false);
      addToast({
        type: 'error',
        title: 'Não foi possível agendar',
        description: getApiErrorMessage(
          err,
          'Ocorreu um erro ao criar o agendamento, tente novamente.',
        ),
      });
    }
  }, [client, service, chosenStart, chosenProvider, onCreated, addToast]);

  // Prévia da série: quais horários estão livres (os ocupados são pulados)
  useEffect(() => {
    if (step !== 'repeat' || !client || !service || !chosenStart) {
      return undefined;
    }

    let active = true;

    setPreview({ status: 'loading' });

    api
      .post<{
        occurrences: Array<{
          date: string;
          available: boolean;
          reason: string | null;
        }>;
      }>('/appointments/series', {
        provider_id: chosenProvider.id,
        service_id: service.id,
        client_id: client.id,
        date: chosenStart,
        interval_weeks: intervalWeeks,
        count,
        dry_run: true,
      })
      .then(response => {
        if (!active) return;

        setPreview({
          status: 'done',
          occurrences: response.data.occurrences.map(item => ({
            ...item,
            date: new Date(item.date),
          })),
        });
      })
      .catch(err => {
        if (!active) return;

        setPreview({
          status: 'error',
          message: getApiErrorMessage(
            err,
            'Não foi possível conferir os horários.',
          ),
        });
      });

    return () => {
      active = false;
    };
  }, [
    step,
    client,
    service,
    chosenStart,
    chosenProvider,
    intervalWeeks,
    count,
  ]);

  const freeCount =
    preview?.status === 'done'
      ? preview.occurrences.filter(item => item.available).length
      : 0;

  const handleConfirmSeries = useCallback(async () => {
    if (!client || !service || !chosenStart) return;

    setSaving(true);

    try {
      const response = await api.post<{
        created: number;
        occurrences: Array<{ available: boolean }>;
      }>('/appointments/series', {
        provider_id: chosenProvider.id,
        service_id: service.id,
        client_id: client.id,
        date: chosenStart,
        interval_weeks: intervalWeeks,
        count,
      });

      const skipped = response.data.occurrences.length - response.data.created;

      onCreated({
        title: `Cliente fixo: ${response.data.created} horários marcados`,
        description: `${client.name}: ${service.name} com ${
          chosenProvider.name
        }, ${intervalText(intervalWeeks).toLowerCase()} às ${format(
          chosenStart,
          'HH:mm',
        )}.${skipped > 0 ? ` ${skipped} ocupado(s) ficaram de fora.` : ''}`,
      });
    } catch (err) {
      setSaving(false);
      addToast({
        type: 'error',
        title: 'Não foi possível agendar',
        description: getApiErrorMessage(
          err,
          'Ocorreu um erro ao marcar os horários, tente novamente.',
        ),
      });
    }
  }, [
    client,
    service,
    chosenStart,
    chosenProvider,
    intervalWeeks,
    count,
    onCreated,
    addToast,
  ]);

  const benefitTime = (chosenStart || start).getTime();

  useEffect(() => {
    setBenefit(null);

    if (!client || !service) return undefined;

    let active = true;

    api
      .get<Benefit>('/memberships/benefit', {
        params: {
          client_id: client.id,
          service_id: service.id,
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
  }, [client, service, benefitTime]);

  let priceText = 'Valor a definir';
  let priceNote = '';

  if (service) {
    priceText = formatPrice(
      benefit ? benefit.price_cents : service.price_cents,
    );

    if (benefit?.membership_id) {
      priceText = 'Incluso no plano';
      priceNote = `${benefit.plan_name} · ${formatPrice(
        service.price_cents,
      )} no preço normal`;
    } else if (benefit?.reason) {
      priceNote = `${benefit.plan_name}: ${benefit.reason}`;
    }
  }

  const dayText = capitalize(
    format(start, "EEEE, d 'de' MMMM", { locale: ptBR }),
  );
  const shownStart = chosenStart || start;
  const shownEnd =
    service && chosenStart
      ? addMinutes(chosenStart, service.duration_minutes)
      : null;

  const noResults =
    !searching &&
    searchedTerm !== '' &&
    searchedTerm === search.trim() &&
    results.length === 0;

  const slotTime = format(start, 'HH:mm');

  return (
    <Overlay
      onMouseDown={event => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <WideDialog
        color={color}
        role="dialog"
        aria-modal="true"
        aria-labelledby="new-appointment-title"
      >
        <DialogHeader>
          <div>
            <h2 id="new-appointment-title">Novo agendamento</h2>
            <StepLabel>
              {step === 'repeat' && (
                <>
                  <strong>Cliente fixo</strong> · o mesmo horário se repete
                </>
              )}
              {step === 'service' && (
                <>
                  Passo <strong>2 de 2</strong> · Serviço
                </>
              )}
              {(step === 'client' || step === 'register') && (
                <>
                  Passo <strong>1 de 2</strong> · Cliente
                </>
              )}
            </StepLabel>
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

        <Columns>
          <Aside>
            <Summary>
              <li>
                <FiUser />
                {(step === 'service' || step === 'repeat') && client ? (
                  <>
                    <span>
                      {client.name}
                      {client.phone && (
                        <small>{formatPhone(client.phone)}</small>
                      )}
                    </span>
                    {step === 'service' && (
                      <button type="button" onClick={() => setStep('client')}>
                        Trocar
                      </button>
                    )}
                  </>
                ) : (
                  <small>Cliente a definir</small>
                )}
              </li>
              <li>
                <FiScissors />
                <img
                  src={
                    chosenProvider.avatar_url ||
                    avatarFallback(chosenProvider.name)
                  }
                  alt=""
                  onError={e => {
                    e.currentTarget.src = avatarFallback(chosenProvider.name);
                  }}
                />
                {chosenProvider.name}
              </li>
              <li>
                <FiCalendar />
                <span>
                  {dayText}
                  <small>
                    {format(shownStart, 'HH:mm')}
                    {shownEnd && ` até ${format(shownEnd, 'HH:mm')}`}
                  </small>
                </span>
              </li>
              <li>
                <FiDollarSign />
                <span>
                  {priceText}
                  <small>{priceNote}</small>
                </span>
              </li>
              {step === 'repeat' && (
                <li>
                  <FiRepeat />
                  <span>
                    {intervalText(intervalWeeks)}
                    <small>{`${count} vezes${
                      service ? ` · ${service.name}` : ''
                    }`}</small>
                  </span>
                </li>
              )}
            </Summary>

            <StatusArea aria-live="polite">
              {step === 'client' && (
                <>
                  {search.trim().length < 2 &&
                    'Busque o cliente pelo nome, telefone ou e-mail. Se ele ainda não tiver cadastro, você cadastra aqui mesmo.'}
                  {searching && 'Buscando...'}
                  {!searching && results.length > 0 && (
                    <LinkButton type="button" onClick={openRegister}>
                      Não é nenhum desses? Cadastrar novo cliente
                    </LinkButton>
                  )}
                </>
              )}

              {step === 'register' &&
                'Com o e-mail, o cliente pode depois criar a conta no site e ver seus agendamentos.'}

              {step === 'repeat' &&
                'Cada horário vira um agendamento comum: dá para remarcar ou cancelar um por um. O cliente recebe um e-mail só, com todas as datas.'}

              {step === 'service' && (
                <>
                  {!slot && 'Escolha o serviço para conferir o horário.'}
                  {slot?.status === 'checking' && 'Verificando o horário...'}
                  {slot?.status === 'fits' && (
                    <SlotStatus ok>
                      {`Horário livre: ${slotTime} às ${format(
                        slot.end,
                        'HH:mm',
                      )}.`}
                    </SlotStatus>
                  )}
                  {slot?.status === 'conflict' && (
                    <SlotStatus ok={false}>
                      <p>{`Não cabe às ${slotTime}: ${slot.reason}`}</p>

                      <SuggestionRow>
                        {slot.before.length + slot.after.length > 0 ? (
                          <>
                            <span>{`Horários livres com ${provider.name}:`}</span>
                            <SuggestionButtons>
                              {[...slot.before, ...slot.after].map(date => {
                                const selected =
                                  chosenProvider.id === provider.id &&
                                  chosenStart?.getTime() === date.getTime();

                                return (
                                  <Suggestion
                                    key={date.getTime()}
                                    type="button"
                                    selected={selected}
                                    aria-pressed={selected}
                                    onClick={() => chooseTime(date)}
                                  >
                                    {format(date, 'HH:mm')}
                                  </Suggestion>
                                );
                              })}
                            </SuggestionButtons>
                          </>
                        ) : (
                          <span>{`Sem outro horário livre com ${provider.name} neste dia.`}</span>
                        )}
                      </SuggestionRow>

                      {slot.others.length > 0 && (
                        <SuggestionRow>
                          <span>{`Livres às ${slotTime}:`}</span>
                          <SuggestionButtons>
                            {slot.others.map(other => {
                              const selected = chosenProvider.id === other.id;

                              return (
                                <Suggestion
                                  key={other.id}
                                  type="button"
                                  selected={selected}
                                  aria-pressed={selected}
                                  onClick={() => chooseOtherProvider(other)}
                                >
                                  {other.name}
                                </Suggestion>
                              );
                            })}
                          </SuggestionButtons>
                        </SuggestionRow>
                      )}
                    </SlotStatus>
                  )}
                </>
              )}
            </StatusArea>
          </Aside>

          <Main>
            {step === 'client' && (
              <>
                <Field>
                  <span>Buscar cliente</span>
                  <input
                    ref={searchInputRef}
                    value={search}
                    onChange={event => setSearch(event.target.value)}
                    onKeyDown={event => {
                      // Enter com um único resultado já escolhe o cliente
                      if (event.key === 'Enter' && results.length === 1) {
                        selectClient(results[0]);
                      }
                    }}
                    placeholder="Nome, telefone ou e-mail"
                    autoComplete="off"
                  />
                </Field>

                {search.trim().length < 2 && waiting.length > 0 && (
                  <>
                    <SectionLabel style={{ marginTop: 16 }}>
                      Na lista de espera deste dia
                    </SectionLabel>
                    <SearchResults>
                      {waiting.map(item => (
                        <li key={item.id}>
                          <ResultButton
                            type="button"
                            onClick={() =>
                              item.client &&
                              selectClient({
                                id: item.client.id,
                                name: item.client.name,
                                phone: item.client.phone,
                                email: item.client.email,
                              })
                            }
                            title={item.client?.name}
                          >
                            <span>{item.client?.name}</span>
                            <small>
                              {[
                                PERIOD_LABELS[item.period],
                                item.provider && `com ${item.provider.name}`,
                              ]
                                .filter(Boolean)
                                .join(' · ')}
                            </small>
                          </ResultButton>
                        </li>
                      ))}
                    </SearchResults>
                  </>
                )}

                {results.length > 0 && (
                  <SearchResults>
                    {results.map(option => (
                      <li key={option.id}>
                        <ResultButton
                          type="button"
                          onClick={() => selectClient(option)}
                          title={option.name}
                        >
                          <span>{option.name}</span>
                          <small>
                            {[
                              option.phone && formatPhone(option.phone),
                              option.email,
                            ]
                              .filter(Boolean)
                              .join(' · ') || 'Sem contato'}
                          </small>
                        </ResultButton>
                      </li>
                    ))}
                  </SearchResults>
                )}

                {noResults && (
                  <NotFound>
                    {`Nenhum cliente encontrado para “${searchedTerm}”.`}
                    <PrimaryButton type="button" onClick={openRegister}>
                      Cadastrar novo cliente
                    </PrimaryButton>
                  </NotFound>
                )}
              </>
            )}

            {step === 'register' && (
              <form
                id="new-client-form"
                onSubmit={event => {
                  event.preventDefault();
                  handleRegister();
                }}
              >
                <SectionLabel>Novo cliente</SectionLabel>
                <RegisterGrid>
                  <Field>
                    <span>Nome</span>
                    <input
                      value={newClient.name}
                      maxLength={100}
                      required
                      ref={nameInputRef}
                      onChange={event =>
                        setNewClient({ ...newClient, name: event.target.value })
                      }
                    />
                  </Field>
                  <Field>
                    <span>Telefone</span>
                    <input
                      type="tel"
                      value={newClient.phone}
                      maxLength={30}
                      required
                      onChange={event =>
                        setNewClient({
                          ...newClient,
                          phone: maskPhone(event.target.value),
                        })
                      }
                    />
                  </Field>
                  {counterRules?.email?.show !== false && (
                    <Field>
                      <span>
                        {counterRules?.email?.required
                          ? 'E-mail'
                          : 'E-mail (opcional)'}
                      </span>
                      <input
                        type="email"
                        value={newClient.email}
                        maxLength={100}
                        onChange={event =>
                          setNewClient({
                            ...newClient,
                            email: event.target.value,
                          })
                        }
                      />
                    </Field>
                  )}
                </RegisterGrid>
                <div style={{ marginTop: 12 }}>
                  <ProfileExtraFields
                    rules={requiredRules}
                    values={newExtras}
                    onChange={setNewExtras}
                  />
                </div>
              </form>
            )}

            {step === 'repeat' && (
              <>
                <RepeatGrid>
                  <Field>
                    <span>Repetir</span>
                    <select
                      value={intervalWeeks}
                      onChange={event =>
                        setIntervalWeeks(Number(event.target.value))
                      }
                    >
                      {INTERVALS.map(weeks => (
                        <option key={weeks} value={weeks}>
                          {intervalText(weeks)}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field>
                    <span>Quantas vezes</span>
                    <select
                      value={count}
                      onChange={event => setCount(Number(event.target.value))}
                    >
                      {COUNTS.map(value => (
                        <option key={value} value={value}>
                          {`${value} horários`}
                        </option>
                      ))}
                    </select>
                  </Field>
                </RepeatGrid>

                <SectionLabel>Horários</SectionLabel>
                <OccurrenceGrid aria-live="polite">
                  {preview?.status === 'done'
                    ? preview.occurrences.map(item => (
                        <Occurrence
                          key={item.date.getTime()}
                          status={item.available ? 'free' : 'taken'}
                          title={
                            item.available
                              ? 'Livre'
                              : `Não será marcado: ${item.reason}`
                          }
                        >
                          {item.available ? <FiCheck /> : <FiSlash />}
                          {format(item.date, 'EEE dd/MM', { locale: ptBR })}
                        </Occurrence>
                      ))
                    : Array.from({ length: count }, (_, index) => (
                        <Occurrence key={index} status="loading">
                          ...
                        </Occurrence>
                      ))}
                </OccurrenceGrid>

                <RepeatNote>
                  {preview?.status === 'loading' && 'Conferindo a agenda...'}
                  {preview?.status === 'error' && preview.message}
                  {preview?.status === 'done' && (
                    <>
                      <strong>{`${freeCount} de ${count} livres.`}</strong>
                      {freeCount < count &&
                        ' Os ocupados (riscados) ficam de fora; passe o mouse para ver o motivo.'}
                      {freeCount > 0 &&
                        ` O último é ${format(
                          preview.occurrences
                            .filter(item => item.available)
                            .slice(-1)[0].date,
                          "dd 'de' MMMM",
                          { locale: ptBR },
                        )}.`}
                    </>
                  )}
                </RepeatNote>
              </>
            )}

            {step === 'service' && (
              <>
                <SectionLabel>Serviço</SectionLabel>
                <ServiceList role="radiogroup" aria-label="Serviço">
                  {services.map(option => (
                    <ServiceOption
                      key={option.id}
                      type="button"
                      role="radio"
                      aria-checked={service?.id === option.id}
                      selected={service?.id === option.id}
                      onClick={() => chooseService(option)}
                    >
                      <span>
                        {option.name}
                        <small>{`${option.duration_minutes} min`}</small>
                      </span>
                      <span>{formatPrice(option.price_cents)}</span>
                    </ServiceOption>
                  ))}
                </ServiceList>
              </>
            )}
          </Main>
        </Columns>

        <Footer>
          {step === 'client' && (
            <SecondaryButton type="button" onClick={onClose}>
              Cancelar
            </SecondaryButton>
          )}

          {step === 'register' && (
            <>
              <SecondaryButton type="button" onClick={() => setStep('client')}>
                Voltar
              </SecondaryButton>
              <PrimaryButton
                type="submit"
                form="new-client-form"
                disabled={
                  registering ||
                  !newClient.name.trim() ||
                  onlyDigits(newClient.phone).length < 10
                }
              >
                {registering ? 'Cadastrando...' : 'Cadastrar e continuar'}
              </PrimaryButton>
            </>
          )}

          {step === 'service' && (
            <>
              <SecondaryButton type="button" onClick={() => setStep('client')}>
                Voltar
              </SecondaryButton>
              {features.series && (
                <SecondaryButton
                  type="button"
                  onClick={() => setStep('repeat')}
                  disabled={!service || !chosenStart || saving}
                  title="Marcar o mesmo horário a cada semana ou a cada algumas semanas"
                >
                  <FiRepeat /> Repetir (cliente fixo)
                </SecondaryButton>
              )}
              <PrimaryButton
                type="button"
                onClick={handleConfirm}
                disabled={!service || !chosenStart || saving}
              >
                {saving ? 'Agendando...' : 'Confirmar agendamento'}
              </PrimaryButton>
            </>
          )}

          {step === 'repeat' && (
            <>
              <SecondaryButton
                type="button"
                onClick={() => setStep('service')}
                disabled={saving}
              >
                Voltar
              </SecondaryButton>
              <PrimaryButton
                type="button"
                onClick={handleConfirmSeries}
                disabled={
                  saving || preview?.status !== 'done' || freeCount === 0
                }
              >
                {saving
                  ? 'Agendando...'
                  : `Agendar ${
                      preview?.status === 'done' ? freeCount : count
                    } horários`}
              </PrimaryButton>
            </>
          )}
        </Footer>
      </WideDialog>
    </Overlay>
  );
};

export default NewAppointment;
