import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import { format, isBefore, startOfDay } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';
import { FiClock, FiPhone, FiPlus, FiTrash2, FiX } from 'react-icons/fi';
import { FaWhatsapp } from 'react-icons/fa';

import api from '../../../services/api';
import { useToast } from '../../../hooks/Toast';
import getApiErrorMessage from '../../../utils/getApiErrorMessage';
import {
  formatPhone,
  looksLikePhone,
  onlyDigits,
  phoneHref,
  whatsappHref,
} from '../../../utils/phone';
import { TextInput, Select, UIButton } from '../../../components/ui';
import {
  Backdrop,
  Panel,
  PanelHeader,
  CloseButton,
  List,
  Item,
  ItemActions,
  IconLink,
  Empty,
  Footnote,
} from '../PendingConfirmations/styles';
import {
  WaitTrigger,
  EntryText,
  Tag,
  AddForm,
  FormRow,
  Results,
  FormActions,
  AddButton,
  RemoveButton,
  FieldLabel,
} from './styles';

export type WaitlistPeriod = 'any' | 'morning' | 'afternoon' | 'evening';

export interface WaitlistItem {
  id: string;
  date: string;
  period: WaitlistPeriod;
  notes: string | null;
  created_by: 'provider' | 'client';
  created_at: string;
  notified_at: string | null;
  client: {
    id: string;
    name: string;
    phone: string;
    email: string | null;
  } | null;
  provider: { id: string; name: string } | null;
  service: { id: string; name: string } | null;
  // Já conseguiu horário no dia
  booked: boolean;
}

export const PERIOD_LABELS: Record<WaitlistPeriod, string> = {
  any: 'Qualquer horário',
  morning: 'Manhã (até 12h)',
  afternoon: 'Tarde (12h às 18h)',
  evening: 'Noite (depois das 18h)',
};

interface ClientOption {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
}

interface WaitlistPanelProps {
  day: Date;
  // Barbeiros ativos do dia, para a preferência
  providers: Array<{ id: string; name: string }>;
  // Muda quando a agenda é alterada (recarrega a lista)
  refreshKey: number;
}

const PANEL_HEIGHT = 500;
const GAP = 8;

// Lista de espera do dia mostrado na agenda: quem queria um horário e não
// conseguiu. Quando alguém cancela, a barbearia é avisada e quem combina com
// o horário recebe e-mail
const WaitlistPanel: React.FC<WaitlistPanelProps> = ({
  day,
  providers,
  refreshKey,
}) => {
  const { addToast } = useToast();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const [items, setItems] = useState<WaitlistItem[] | null>(null);
  const [open, setOpen] = useState(false);
  const [adding, setAdding] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [position, setPosition] = useState({ top: 0, left: 0, height: 0 });

  // Formulário
  const [search, setSearch] = useState('');
  const [results, setResults] = useState<ClientOption[]>([]);
  const [client, setClient] = useState<ClientOption | null>(null);
  const [period, setPeriod] = useState<WaitlistPeriod>('any');
  const [providerId, setProviderId] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const dateKey = format(day, 'yyyy-MM-dd');
  const past = isBefore(day, startOfDay(new Date()));

  const load = useCallback(() => {
    let active = true;

    api
      .get<WaitlistItem[]>('/waitlist', { params: { date: dateKey } })
      .then(response => {
        if (active) setItems(response.data);
      })
      .catch(() => {
        if (active) setItems([]);
      });

    return () => {
      active = false;
    };
  }, [dateKey]);

  useEffect(() => {
    setItems(null);

    return load();
  }, [load, refreshKey]);

  // Ao trocar de dia, fecha o painel
  useEffect(() => {
    setOpen(false);
    setAdding(false);
  }, [dateKey]);

  const waiting = (items || []).filter(item => !item.booked).length;

  useLayoutEffect(() => {
    if (!open || !triggerRef.current) return undefined;

    const trigger = triggerRef.current;

    const place = (): void => {
      const rect = trigger.getBoundingClientRect();
      const width = Math.min(440, window.innerWidth - 32);
      const top = rect.bottom + GAP;

      setPosition({
        top,
        left: Math.max(16, rect.right - width),
        height: Math.min(PANEL_HEIGHT, window.innerHeight - top - 16),
      });
    };

    place();
    window.addEventListener('resize', place);

    return () => window.removeEventListener('resize', place);
  }, [open]);

  const close = useCallback(() => {
    setOpen(false);
    setAdding(false);
    triggerRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!open) return undefined;

    panelRef.current?.focus();

    function handleKeyDown(event: KeyboardEvent): void {
      if (event.key === 'Escape') close();
    }

    window.addEventListener('keydown', handleKeyDown);

    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, close]);

  // Busca de clientes para o formulário
  useEffect(() => {
    const term = search.trim();

    if (!adding || term.length < 2) {
      setResults([]);
      return undefined;
    }

    let active = true;

    const timer = setTimeout(() => {
      api
        .get<ClientOption[]>('/clients', {
          params: { search: looksLikePhone(term) ? onlyDigits(term) : term },
        })
        .then(response => {
          if (active) setResults(response.data);
        })
        .catch(() => {
          if (active) setResults([]);
        });
    }, 300);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [search, adding]);

  const openForm = useCallback(() => {
    setSearch('');
    setResults([]);
    setClient(null);
    setPeriod('any');
    setProviderId('');
    setNotes('');
    setFormError('');
    setAdding(true);
  }, []);

  const handleAdd = useCallback(
    async (event: React.FormEvent) => {
      event.preventDefault();

      if (!client) {
        setFormError('Escolha o cliente.');
        return;
      }

      setSaving(true);

      try {
        await api.post('/waitlist', {
          client_id: client.id,
          date: dateKey,
          provider_id: providerId || null,
          period,
          notes: notes.trim() || null,
        });

        addToast({
          type: 'success',
          title: 'Cliente na lista de espera',
          description: `${client.name}, ${format(day, "dd 'de' MMMM", {
            locale: ptBR,
          })}.`,
        });

        setAdding(false);
        load();
      } catch (err) {
        setFormError(getApiErrorMessage(err, 'Não foi possível adicionar.'));
      } finally {
        setSaving(false);
      }
    },
    [client, dateKey, providerId, period, notes, day, addToast, load],
  );

  const remove = useCallback(
    async (item: WaitlistItem) => {
      setRemovingId(item.id);

      try {
        await api.delete(`/waitlist/${item.id}`);
        setItems(current =>
          current ? current.filter(other => other.id !== item.id) : current,
        );
      } catch (err) {
        addToast({
          type: 'error',
          title: 'Não foi possível tirar da lista',
          description: getApiErrorMessage(err, 'Tente novamente.'),
        });
      } finally {
        setRemovingId(null);
      }
    },
    [addToast],
  );

  const dayText = format(day, "EEEE, d 'de' MMMM", { locale: ptBR });

  return (
    <>
      <WaitTrigger
        ref={triggerRef}
        type="button"
        active={waiting > 0}
        aria-haspopup="dialog"
        aria-expanded={open}
        title={
          waiting > 0
            ? `${waiting} ${
                waiting === 1 ? 'cliente esperando' : 'clientes esperando'
              } um horário neste dia`
            : 'Lista de espera deste dia'
        }
        onClick={() => setOpen(value => !value)}
      >
        <FiClock />
        <span className="label">Espera</span>
        <b>{items ? waiting : '…'}</b>
      </WaitTrigger>

      {open && (
        <Backdrop
          onMouseDown={event => {
            if (event.target === event.currentTarget) close();
          }}
        >
          <Panel
            ref={panelRef}
            role="dialog"
            aria-label="Lista de espera"
            tabIndex={-1}
            style={position}
          >
            <PanelHeader>
              <div style={{ flex: 1 }}>
                <h2>
                  {adding ? 'Adicionar à lista de espera' : 'Lista de espera'}
                </h2>
                <p>{dayText}</p>
              </div>
              <CloseButton
                type="button"
                aria-label="Fechar"
                title="Fechar (Esc)"
                onClick={close}
              >
                <FiX />
              </CloseButton>
            </PanelHeader>

            {adding ? (
              <AddForm onSubmit={handleAdd} noValidate>
                <FieldLabel htmlFor="waitlist-search">
                  <span>Cliente</span>
                  <TextInput
                    id="waitlist-search"
                    value={search}
                    autoFocus
                    autoComplete="off"
                    placeholder="Nome, telefone ou e-mail"
                    onChange={event => {
                      setSearch(event.target.value);
                      setFormError('');
                    }}
                  />
                </FieldLabel>

                <Results aria-label="Clientes encontrados">
                  {results.length === 0 && (
                    <p>
                      {search.trim().length < 2
                        ? 'Digite pelo menos 2 letras para buscar.'
                        : 'Nenhum cliente encontrado.'}
                    </p>
                  )}
                  {results.map(option => (
                    <li key={option.id}>
                      <button
                        type="button"
                        aria-pressed={client?.id === option.id}
                        onClick={() => {
                          setClient(option);
                          setFormError('');
                        }}
                      >
                        {option.name}
                        <small>
                          {option.phone ? formatPhone(option.phone) : ''}
                        </small>
                      </button>
                    </li>
                  ))}
                </Results>

                <FormRow>
                  <FieldLabel htmlFor="waitlist-period">
                    <span>Período</span>
                    <Select
                      id="waitlist-period"
                      value={period}
                      onChange={event =>
                        setPeriod(event.target.value as WaitlistPeriod)
                      }
                    >
                      {(Object.keys(PERIOD_LABELS) as WaitlistPeriod[]).map(
                        value => (
                          <option key={value} value={value}>
                            {PERIOD_LABELS[value]}
                          </option>
                        ),
                      )}
                    </Select>
                  </FieldLabel>
                  <FieldLabel htmlFor="waitlist-provider">
                    <span>Barbeiro</span>
                    <Select
                      id="waitlist-provider"
                      value={providerId}
                      onChange={event => setProviderId(event.target.value)}
                    >
                      <option value="">Qualquer barbeiro</option>
                      {providers.map(provider => (
                        <option key={provider.id} value={provider.id}>
                          {provider.name}
                        </option>
                      ))}
                    </Select>
                  </FieldLabel>
                </FormRow>

                <FieldLabel htmlFor="waitlist-notes">
                  <span>Observação (opcional)</span>
                  <TextInput
                    id="waitlist-notes"
                    value={notes}
                    maxLength={200}
                    placeholder="Ex: só depois das 15h"
                    onChange={event => setNotes(event.target.value)}
                  />
                </FieldLabel>

                <FormActions>
                  <small role="alert">{formError}</small>
                  <UIButton
                    type="button"
                    variant="secondary"
                    size="sm"
                    disabled={saving}
                    onClick={() => setAdding(false)}
                  >
                    Voltar
                  </UIButton>
                  <UIButton type="submit" size="sm" disabled={saving}>
                    {saving ? 'Adicionando...' : 'Adicionar'}
                  </UIButton>
                </FormActions>
              </AddForm>
            ) : (
              <>
                <List>
                  {items && items.length === 0 && (
                    <Empty as="li">
                      <FiClock />
                      Ninguém esperando neste dia.
                    </Empty>
                  )}

                  {(items || []).map(item => {
                    const whatsapp = item.client
                      ? whatsappHref(item.client.phone)
                      : null;
                    const preferences = [
                      PERIOD_LABELS[item.period],
                      item.provider ? `com ${item.provider.name}` : null,
                      item.service?.name,
                    ]
                      .filter(Boolean)
                      .join(' · ');

                    return (
                      <Item key={item.id}>
                        <EntryText>
                          <strong>
                            {item.client?.name || 'Cliente removido'}
                            {item.booked && (
                              <Tag tone="success">Já agendou</Tag>
                            )}
                            {!item.booked && item.notified_at && (
                              <Tag tone="primary">
                                {`Avisado às ${format(
                                  new Date(item.notified_at),
                                  'HH:mm',
                                )}`}
                              </Tag>
                            )}
                          </strong>
                          <small>{preferences}</small>
                          <em>
                            {item.notes ||
                              (item.created_by === 'client'
                                ? 'Entrou pelo site'
                                : 'Adicionado pela barbearia')}
                          </em>
                        </EntryText>

                        <ItemActions>
                          {whatsapp && (
                            <IconLink
                              href={whatsapp}
                              target="_blank"
                              rel="noopener noreferrer"
                              title="Chamar no WhatsApp"
                              aria-label={`Chamar ${item.client?.name} no WhatsApp`}
                            >
                              <FaWhatsapp />
                            </IconLink>
                          )}
                          {item.client?.phone && (
                            <IconLink
                              href={phoneHref(item.client.phone)}
                              title={`Ligar: ${formatPhone(item.client.phone)}`}
                              aria-label={`Ligar para ${item.client.name}`}
                            >
                              <FiPhone />
                            </IconLink>
                          )}
                          <RemoveButton
                            type="button"
                            title="Tirar da lista"
                            aria-label={`Tirar ${item.client?.name} da lista`}
                            disabled={removingId === item.id}
                            onClick={() => remove(item)}
                          >
                            <FiTrash2 />
                          </RemoveButton>
                        </ItemActions>
                      </Item>
                    );
                  })}
                </List>

                {!past && (
                  <AddButton type="button" onClick={openForm}>
                    <FiPlus />
                    Adicionar cliente à lista
                  </AddButton>
                )}

                <Footnote>
                  Quando um horário deste dia é cancelado, você recebe uma
                  notificação e quem combina com o horário recebe e-mail. Para
                  marcar, clique num horário livre: quem está na lista aparece
                  primeiro.
                </Footnote>
              </>
            )}
          </Panel>
        </Backdrop>
      )}
    </>
  );
};

export default WaitlistPanel;
