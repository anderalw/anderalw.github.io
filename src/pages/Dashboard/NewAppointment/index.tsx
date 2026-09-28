import React, { useCallback, useEffect, useRef, useState } from 'react';
import { addMinutes, format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';
import { FiCalendar, FiScissors, FiUser, FiX } from 'react-icons/fi';

import api from '../../../services/api';
import { useToast } from '../../../hooks/Toast';
import getApiErrorMessage from '../../../utils/getApiErrorMessage';
import avatarFallback from '../../../utils/avatarFallback';
import { formatPrice } from '../../../utils/money';

import { Overlay, Dialog, CloseButton } from '../AppointmentDetails/styles';
import {
  Form,
  Field,
  Times,
  TimeButton,
  Hint,
  Actions,
  PrimaryButton,
  SecondaryButton,
} from '../../../components/RescheduleForm/styles';
import {
  StepLabel,
  Summary,
  SearchResults,
  ResultButton,
  NotFound,
  LinkButton,
  ServiceList,
  ServiceOption,
  SlotStatus,
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

type SlotCheck =
  | { status: 'checking' }
  | { status: 'fits'; end: Date }
  | { status: 'conflict'; reason: string; suggestions: Date[] };

interface NewAppointmentProps {
  // Barbeiro e início definidos pelo clique na agenda
  provider: { id: string; name: string; avatar_url: string | null };
  start: Date;
  color: string;
  onClose(): void;
  onCreated(message: { title: string; description: string }): void;
}

type Step = 'client' | 'register' | 'service';

// Quantos horários livres sugerir quando o serviço não cabe no clicado
const SUGGESTIONS = 4;

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
  // couber, sugere os horários livres mais próximos
  const chooseService = useCallback(
    async (option: Service) => {
      setService(option);
      setSlot({ status: 'checking' });
      setChosenStart(null);

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

        const free = await api.get<Array<{ time: string }>>(
          `/providers/${provider.id}/day-availability`,
          {
            params: {
              year: start.getFullYear(),
              month: start.getMonth() + 1,
              day: start.getDate(),
              service_id: option.id,
            },
          },
        );

        const suggestions = free.data
          .map(({ time }) => {
            const [hours, minutes] = time.split(':').map(Number);
            const date = new Date(start);
            date.setHours(hours, minutes, 0, 0);
            return date;
          })
          .sort(
            (a, b) =>
              Math.abs(a.getTime() - start.getTime()) -
              Math.abs(b.getTime() - start.getTime()),
          )
          .slice(0, SUGGESTIONS)
          .sort((a, b) => a.getTime() - b.getTime());

        setSlot({
          status: 'conflict',
          reason: check.data.reason,
          suggestions,
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
    [provider.id, start, addToast],
  );

  const handleConfirm = useCallback(async () => {
    if (!client || !service || !chosenStart) return;

    setSaving(true);

    try {
      await api.post('/appointments/by-provider', {
        provider_id: provider.id,
        service_id: service.id,
        date: chosenStart,
        client_id: client.id,
      });

      onCreated({
        title: 'Agendamento criado',
        description: `${client.name}: ${service.name} com ${
          provider.name
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
  }, [client, service, chosenStart, provider, onCreated, addToast]);

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

  return (
    <Overlay
      onMouseDown={event => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <Dialog
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
          {step === 'service' && client && (
            <li>
              <FiUser />
              <span>
                {client.name}
                {client.phone && <small>{` · ${client.phone}`}</small>}
              </span>
              <button type="button" onClick={() => setStep('client')}>
                Trocar
              </button>
            </li>
          )}
          <li>
            <FiScissors />
            <img
              src={provider.avatar_url || avatarFallback(provider.name)}
              alt=""
              onError={e => {
                e.currentTarget.src = avatarFallback(provider.name);
              }}
            />
            {provider.name}
          </li>
          <li>
            <FiCalendar />
            <span>
              {`${dayText} · ${format(shownStart, 'HH:mm')}`}
              {shownEnd && <small>{` até ${format(shownEnd, 'HH:mm')}`}</small>}
            </span>
          </li>
        </Summary>

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

            {search.trim().length < 2 && (
              <Hint>Digite pelo menos 2 letras ou números.</Hint>
            )}
            {searching && <Hint>Buscando...</Hint>}

            {results.length > 0 && (
              <div>
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
                <NotFound>
                  <LinkButton type="button" onClick={openRegister}>
                    Não é nenhum desses? Cadastrar novo cliente
                  </LinkButton>
                </NotFound>
              </div>
            )}

            {noResults && (
              <NotFound>
                {`Nenhum cliente encontrado para “${searchedTerm}”.`}
                <PrimaryButton type="button" onClick={openRegister}>
                  Cadastrar novo cliente
                </PrimaryButton>
              </NotFound>
            )}
          </Form>
        )}

        {step === 'register' && (
          <Form
            as="form"
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
            <Hint>
              Com o e-mail, o cliente pode depois criar a conta no site e ver
              seus agendamentos.
            </Hint>

            <Actions>
              <SecondaryButton type="button" onClick={() => setStep('client')}>
                Voltar
              </SecondaryButton>
              <PrimaryButton
                type="submit"
                disabled={
                  registering ||
                  !newClient.name.trim() ||
                  !newClient.phone.trim()
                }
              >
                {registering ? 'Cadastrando...' : 'Cadastrar e continuar'}
              </PrimaryButton>
            </Actions>
          </Form>
        )}

        {step === 'service' && (
          <Form>
            <Field as="div">
              <span>Serviço</span>
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
            </Field>

            {slot?.status === 'checking' && (
              <Hint>Verificando o horário...</Hint>
            )}

            {slot?.status === 'fits' && (
              <SlotStatus ok>
                {`Horário livre: ${format(start, 'HH:mm')} às ${format(
                  slot.end,
                  'HH:mm',
                )}.`}
              </SlotStatus>
            )}

            {slot?.status === 'conflict' && service && (
              <SlotStatus ok={false}>
                <p>
                  {`${service.name} não cabe às ${format(start, 'HH:mm')}: ${
                    slot.reason
                  }`}
                  {slot.suggestions.length > 0
                    ? ' Escolha um horário livre próximo:'
                    : ' Não há outro horário livre com este barbeiro neste dia.'}
                </p>
                {slot.suggestions.length > 0 && (
                  <Times>
                    {slot.suggestions.map(date => (
                      <TimeButton
                        key={date.getTime()}
                        type="button"
                        selected={chosenStart?.getTime() === date.getTime()}
                        aria-pressed={chosenStart?.getTime() === date.getTime()}
                        onClick={() => setChosenStart(date)}
                      >
                        {format(date, 'HH:mm')}
                      </TimeButton>
                    ))}
                  </Times>
                )}
              </SlotStatus>
            )}

            <Actions>
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
            </Actions>
          </Form>
        )}
      </Dialog>
    </Overlay>
  );
};

export default NewAppointment;
