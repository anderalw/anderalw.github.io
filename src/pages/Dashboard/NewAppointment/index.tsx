import React, { useCallback, useEffect, useRef, useState } from 'react';
import { addMinutes, format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';
import { FiCalendar, FiScissors, FiUser, FiX } from 'react-icons/fi';

import api from '../../../services/api';
import { useToast } from '../../../hooks/Toast';
import getApiErrorMessage from '../../../utils/getApiErrorMessage';
import avatarFallback from '../../../utils/avatarFallback';
import { formatPrice } from '../../../utils/money';

import { Overlay, CloseButton } from '../AppointmentDetails/styles';
import {
  Form,
  Field,
  Times,
  TimeButton,
  Actions,
  PrimaryButton,
  SecondaryButton,
} from '../../../components/RescheduleForm/styles';
import {
  FixedDialog,
  Body,
  Footer,
  StatusArea,
  StepLabel,
  Summary,
  SearchResults,
  ResultButton,
  NotFound,
  LinkButton,
  ServiceList,
  ServiceOption,
  SlotStatus,
  SuggestionRow,
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
  if (/^[\d\s()+-]+$/.test(value)) return { name: '', phone: value, email: '' };

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
        .get<ClientOption[]>('/clients', { params: { search: term } })
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
        phone: newClient.phone.trim(),
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
      <FixedDialog
        color={color}
        role="dialog"
        aria-modal="true"
        aria-labelledby="new-appointment-title"
      >
        <header>
          <span />
          <CloseButton
            type="button"
            aria-label="Fechar"
            title="Fechar (Esc)"
            onClick={onClose}
          >
            <FiX />
          </CloseButton>
        </header>

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

        <Summary>
          <li>
            <FiUser />
            {step === 'service' && client ? (
              <>
                <span>
                  {client.name}
                  {client.phone && <small>{` · ${client.phone}`}</small>}
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
                chosenProvider.avatar_url || avatarFallback(chosenProvider.name)
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
              {`${dayText} · ${format(shownStart, 'HH:mm')}`}
              {shownEnd && <small>{` até ${format(shownEnd, 'HH:mm')}`}</small>}
            </span>
          </li>
        </Summary>

        <Body>
          {step === 'client' && (
            <Form>
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
                      >
                        {option.name}
                        <small>
                          {[option.phone, option.email]
                            .filter(Boolean)
                            .join(' · ') || 'Sem contato'}
                        </small>
                      </ResultButton>
                    </li>
                  ))}
                </SearchResults>
              )}
            </Form>
          )}

          {step === 'register' && (
            <Form
              as="form"
              id="new-client-form"
              onSubmit={(event: React.FormEvent) => {
                event.preventDefault();
                handleRegister();
              }}
            >
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
                    setNewClient({ ...newClient, phone: event.target.value })
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
                    setNewClient({ ...newClient, email: event.target.value })
                  }
                />
              </Field>
            </Form>
          )}

          {step === 'service' && (
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
          )}
        </Body>

        <Footer>
          <StatusArea aria-live="polite">
            {step === 'client' && (
              <>
                {search.trim().length < 2 &&
                  'Digite pelo menos 2 letras ou números.'}
                {searching && 'Buscando...'}
                {!searching && results.length > 0 && (
                  <LinkButton type="button" onClick={openRegister}>
                    Não é nenhum desses? Cadastrar novo cliente
                  </LinkButton>
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

                    {slot.before.length + slot.after.length > 0 ? (
                      <SuggestionRow>
                        <span>{`Com ${provider.name}:`}</span>
                        <Times>
                          {[...slot.before, ...slot.after].map(date => {
                            const selected =
                              chosenProvider.id === provider.id &&
                              chosenStart?.getTime() === date.getTime();

                            return (
                              <TimeButton
                                key={date.getTime()}
                                type="button"
                                selected={selected}
                                aria-pressed={selected}
                                onClick={() => chooseTime(date)}
                              >
                                {format(date, 'HH:mm')}
                              </TimeButton>
                            );
                          })}
                        </Times>
                      </SuggestionRow>
                    ) : (
                      <SuggestionRow>
                        <span>{`Sem outro horário livre com ${provider.name} neste dia.`}</span>
                      </SuggestionRow>
                    )}

                    {slot.others.length > 0 && (
                      <SuggestionRow>
                        <span>{`Às ${slotTime} com:`}</span>
                        <Times>
                          {slot.others.map(other => {
                            const selected = chosenProvider.id === other.id;

                            return (
                              <TimeButton
                                key={other.id}
                                type="button"
                                selected={selected}
                                aria-pressed={selected}
                                onClick={() => chooseOtherProvider(other)}
                              >
                                {other.name}
                              </TimeButton>
                            );
                          })}
                        </Times>
                      </SuggestionRow>
                    )}
                  </SlotStatus>
                )}
              </>
            )}
          </StatusArea>

          <Actions>
            {step === 'client' && (
              <SecondaryButton type="button" onClick={onClose}>
                Cancelar
              </SecondaryButton>
            )}

            {step === 'register' && (
              <>
                <SecondaryButton
                  type="button"
                  onClick={() => setStep('client')}
                >
                  Voltar
                </SecondaryButton>
                <PrimaryButton
                  type="submit"
                  form="new-client-form"
                  disabled={
                    registering ||
                    !newClient.name.trim() ||
                    !newClient.phone.trim()
                  }
                >
                  {registering ? 'Cadastrando...' : 'Cadastrar e continuar'}
                </PrimaryButton>
              </>
            )}

            {step === 'service' && (
              <>
                <SecondaryButton
                  type="button"
                  onClick={() => setStep('client')}
                >
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
          </Actions>
        </Footer>
      </FixedDialog>
    </Overlay>
  );
};

export default NewAppointment;
