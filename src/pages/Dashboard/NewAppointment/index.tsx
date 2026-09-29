import React, { useCallback, useEffect, useRef, useState } from 'react';
import { addMinutes, format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';
import { FiCalendar, FiScissors, FiUser, FiX } from 'react-icons/fi';

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
} from './styles';

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

type Step = 'client' | 'register' | 'service';

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
  const [newClient, setNewClient] = useState({
    name: '',
    phone: '',
    email: '',
  });
  const [registering, setRegistering] = useState(false);

  // Passo 2: serviço (barbeiro e horário vêm do clique)
  const [services, setServices] = useState<Service[]>([]);
  const [service, setService] = useState<Service | null>(null);
  const [slot, setSlot] = useState<SlotCheck | null>(null);
  const [chosenStart, setChosenStart] = useState<Date | null>(null);
  // Muda quando o horário clicado só está livre com outro barbeiro
  const [chosenProvider, setChosenProvider] = useState(provider);
  const [saving, setSaving] = useState(false);

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
  }, [newClient, selectClient, addToast]);

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
              {step === 'service' ? (
                <>
                  Passo <strong>2 de 2</strong> · Serviço
                </>
              ) : (
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
                {step === 'service' && client ? (
                  <>
                    <span>
                      {client.name}
                      {client.phone && (
                        <small>{formatPhone(client.phone)}</small>
                      )}
                    </span>
                    <button type="button" onClick={() => setStep('client')}>
                      Trocar
                    </button>
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
                  <Field>
                    <span>E-mail (opcional)</span>
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
                </RegisterGrid>
              </form>
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
              <PrimaryButton
                type="button"
                onClick={handleConfirm}
                disabled={!service || !chosenStart || saving}
              >
                {saving ? 'Agendando...' : 'Confirmar agendamento'}
              </PrimaryButton>
            </>
          )}
        </Footer>
      </WideDialog>
    </Overlay>
  );
};

export default NewAppointment;
