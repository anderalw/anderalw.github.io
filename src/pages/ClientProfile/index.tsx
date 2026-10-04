import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useHistory, useParams } from 'react-router-dom';
import { differenceInMonths, format, isBefore, parseISO } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';
import {
  FiAlertTriangle,
  FiArrowLeft,
  FiCreditCard,
  FiEdit2,
  FiGift,
  FiMail,
  FiMapPin,
  FiPhone,
  FiSave,
} from 'react-icons/fi';
import { FaWhatsapp } from 'react-icons/fa';

import api from '../../services/api';
import { useToast } from '../../hooks/Toast';
import getApiErrorMessage from '../../utils/getApiErrorMessage';
import { formatPrice } from '../../utils/money';
import { formatPhone, phoneHref, whatsappHref } from '../../utils/phone';
import avatarFallback from '../../utils/avatarFallback';
import { formatCep, formatCpf } from '../../utils/profileFields';

import AppLayout from '../../components/AppLayout';
import EmptyState from '../../components/EmptyState';
import MembershipCard from './MembershipCard';
import {
  Page,
  Card,
  CardHeader,
  CardBody,
  UIButton,
  Badge,
} from '../../components/ui';
import { SkeletonBar, EmptyText } from '../ManageServices/styles';
import { Cards, StatCard } from '../Revenue/styles';
import { AlertTag } from '../Clients/styles';
import {
  ClientDetails,
  ClientHistoryItem,
  RECENT_APPOINTMENTS,
} from '../Clients/types';

import EditClientModal from './EditClientModal';
import {
  BackLink,
  Header,
  Contacts,
  Layout,
  SideColumn,
  NotesArea,
  NotesFooter,
  Filters,
  StatusTag,
  HistoryTone,
  HistoryRow,
  HistoryTable,
} from './styles';
import { useVocabulary, useSegmentExamples } from '../../hooks/Vocabulary';

type Filter = 'all' | 'completed' | 'no_show' | 'canceled';

// "12/03 · 36 anos" (e um aviso se o aniversário é neste mês)
function birthdayInfo(value: string): { text: string; thisMonth: boolean } {
  const [year, month, day] = value.slice(0, 10).split('-').map(Number);
  const today = new Date();
  let age = today.getFullYear() - year;

  if (
    today.getMonth() + 1 < month ||
    (today.getMonth() + 1 === month && today.getDate() < day)
  ) {
    age -= 1;
  }

  return {
    text: `${String(day).padStart(2, '0')}/${String(month).padStart(
      2,
      '0',
    )} · ${age} anos`,
    thisMonth: today.getMonth() + 1 === month,
  };
}

// "Av. Paulista, 1000 - Bela Vista, São Paulo/SP"
function addressText(address: NonNullable<ClientDetails['address']>): string {
  const street = [address.street, address.number].filter(Boolean).join(', ');
  const place = [
    address.district,
    [address.city, address.state].filter(Boolean).join('/'),
  ]
    .filter(Boolean)
    .join(', ');

  return [street, place].filter(Boolean).join(' - ') || formatCep(address.cep);
}

const FILTERS: { value: Filter; label: string }[] = [
  { value: 'all', label: 'Todos' },
  { value: 'completed', label: 'Atendidos' },
  { value: 'no_show', label: 'Faltas' },
  { value: 'canceled', label: 'Cancelados' },
];

const MAX_NOTES = 2000;

// Situação de cada agendamento do histórico
function historyStatus(
  item: ClientHistoryItem,
  now: Date,
): { label: string; tone: HistoryTone } {
  if (item.canceled_at) {
    return {
      label:
        item.canceled_by === 'client'
          ? 'Cancelado (cliente)'
          : 'Cancelado (equipe)',
      tone: 'muted',
    };
  }

  if (item.attendance === 'completed')
    return { label: 'Atendido', tone: 'success' };
  if (item.attendance === 'no_show') return { label: 'Faltou', tone: 'danger' };

  if (isBefore(parseISO(item.date), now)) {
    return { label: 'A registrar', tone: 'warning' };
  }

  return item.confirmed_at
    ? { label: 'Confirmado', tone: 'success' }
    : { label: 'Agendado', tone: 'primary' };
}

// "há 3 anos", "há 5 meses", "este mês"
function clientSince(createdAt: string): string {
  const months = differenceInMonths(new Date(), parseISO(createdAt));

  if (months >= 12) {
    const years = Math.floor(months / 12);

    return `há ${years} ${years === 1 ? 'ano' : 'anos'}`;
  }

  if (months >= 1) return `há ${months} ${months === 1 ? 'mês' : 'meses'}`;

  return 'este mês';
}

// Ficha do cliente: contatos, resumo, observações e todo o histórico
const ClientProfile: React.FC = () => {
  const examples = useSegmentExamples();
  const terms = useVocabulary();
  const { id } = useParams<{ id: string }>();
  const history = useHistory();
  const { addToast } = useToast();

  const [client, setClient] = useState<ClientDetails | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [notes, setNotes] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);
  const [editing, setEditing] = useState(false);
  const [filter, setFilter] = useState<Filter>('all');

  useEffect(() => {
    let active = true;

    setClient(null);
    setNotFound(false);

    api
      .get<ClientDetails>(`/clients/${id}`)
      .then(response => {
        if (!active) return;

        setClient(response.data);
        setNotes(response.data.notes || '');
      })
      .catch(err => {
        if (!active) return;

        if (err?.response?.status === 404 || err?.response?.status === 400) {
          setNotFound(true);
          return;
        }

        addToast({
          type: 'error',
          title: 'Erro ao carregar o cliente',
          description: getApiErrorMessage(err, 'Tente novamente.'),
        });
      });

    return () => {
      active = false;
    };
  }, [id, addToast]);

  const saveNotes = useCallback(async () => {
    if (!client) return;

    setSavingNotes(true);

    try {
      const response = await api.put<ClientDetails>(`/clients/${client.id}`, {
        name: client.name,
        phone: client.phone,
        email: client.email,
        notes: notes.trim() || null,
      });

      setClient(response.data);
      setNotes(response.data.notes || '');
      addToast({
        type: 'success',
        title: 'Observações salvas',
        description: 'Elas aparecem ao abrir os agendamentos do cliente.',
      });
    } catch (err) {
      addToast({
        type: 'error',
        title: 'Não foi possível salvar',
        description: getApiErrorMessage(err, 'Tente novamente.'),
      });
    } finally {
      setSavingNotes(false);
    }
  }, [client, notes, addToast]);

  const now = useMemo(() => new Date(), []);

  const shown = useMemo(() => {
    if (!client) return [];

    return client.appointments.filter(item => {
      if (filter === 'completed') return item.attendance === 'completed';
      if (filter === 'no_show') return item.attendance === 'no_show';
      if (filter === 'canceled') return !!item.canceled_at;

      return true;
    });
  }, [client, filter]);

  if (notFound) {
    return (
      <AppLayout>
        <Page>
          <BackLink>
            <Link to="/clientes">
              <FiArrowLeft />
              {terms.Clients}
            </Link>
          </BackLink>
          <EmptyText>Cliente não encontrado.</EmptyText>
        </Page>
      </AppLayout>
    );
  }

  const summary = client?.summary;
  const ticket =
    summary && summary.completed > 0
      ? Math.round(summary.total_cents / summary.completed)
      : null;
  const notesChanged = !!client && notes.trim() !== (client.notes || '');
  const whatsapp = client ? whatsappHref(client.phone) : null;

  let nextText = '';

  if (summary?.next_appointment) {
    nextText = `Próximo: ${format(
      parseISO(summary.next_appointment),
      "dd/MM 'às' HH:mm",
    )}`;
  } else if (summary) {
    nextText = 'Nenhum horário marcado';
  }

  return (
    <AppLayout>
      <Page>
        <BackLink>
          <Link to="/clientes">
            <FiArrowLeft />
            {terms.Clients}
          </Link>
        </BackLink>

        <Header>
          <img
            src={avatarFallback(client?.name || ' ')}
            alt=""
            style={{ visibility: client ? 'visible' : 'hidden' }}
          />
          <div>
            {client ? (
              <>
                <h1>
                  {client.name}
                  {client.no_show_alert && (
                    <AlertTag
                      title={`Faltou ${client.summary.recent_no_shows} dos últimos ${RECENT_APPOINTMENTS} agendamentos`}
                    >
                      <FiAlertTriangle />
                      {`Faltou ${client.summary.recent_no_shows} dos últimos ${RECENT_APPOINTMENTS}`}
                    </AlertTag>
                  )}
                </h1>
                <Contacts>
                  <a href={phoneHref(client.phone)} title="Ligar">
                    <FiPhone />
                    {formatPhone(client.phone)}
                  </a>
                  {whatsapp && (
                    <a
                      href={whatsapp}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="Conversar no WhatsApp"
                    >
                      <FaWhatsapp />
                      WhatsApp
                    </a>
                  )}
                  {client.email && (
                    <a href={`mailto:${client.email}`}>
                      <FiMail />
                      {client.email}
                    </a>
                  )}
                  <Badge tone={client.has_account ? 'success' : 'neutral'}>
                    {client.has_account
                      ? 'Conta no site'
                      : `Cadastrado ${terms.byPlace}`}
                  </Badge>
                  <span>{`Cliente ${clientSince(client.created_at)}`}</span>
                </Contacts>
                {(client.birth_date || client.cpf || client.address) && (
                  <Contacts>
                    {client.birth_date && (
                      <span
                        title="Aniversário"
                        style={
                          birthdayInfo(client.birth_date).thisMonth
                            ? { color: 'var(--color-primary)' }
                            : undefined
                        }
                      >
                        <FiGift />
                        {birthdayInfo(client.birth_date).text}
                        {birthdayInfo(client.birth_date).thisMonth &&
                          ' · faz aniversário este mês'}
                      </span>
                    )}
                    {client.cpf && (
                      <span title="CPF">
                        <FiCreditCard />
                        {formatCpf(client.cpf)}
                      </span>
                    )}
                    {client.address && (
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                          addressText(client.address),
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="Ver no mapa"
                      >
                        <FiMapPin />
                        {addressText(client.address)}
                      </a>
                    )}
                  </Contacts>
                )}
              </>
            ) : (
              <>
                <SkeletonBar width={220} />
                <div style={{ height: 14 }} />
                <SkeletonBar width={360} />
              </>
            )}
          </div>
          <div>
            <UIButton
              type="button"
              variant="secondary"
              disabled={!client}
              onClick={() => setEditing(true)}
            >
              <FiEdit2 />
              Editar dados
            </UIButton>
          </div>
        </Header>

        <Cards>
          <StatCard tone="success">
            <span>Atendimentos</span>
            <strong>{summary ? summary.completed : '–'}</strong>
            <small>
              {summary && summary.canceled > 0
                ? `${summary.canceled} ${
                    summary.canceled === 1 ? 'cancelado' : 'cancelados'
                  }`
                : ''}
            </small>
          </StatCard>
          <StatCard tone={client?.no_show_alert ? 'warning' : 'neutral'}>
            <span>Faltas</span>
            <strong>{summary ? summary.no_shows : '–'}</strong>
            <small>
              {summary
                ? `${summary.recent_no_shows} nos últimos ${RECENT_APPOINTMENTS}`
                : ''}
            </small>
          </StatCard>
          <StatCard tone="primary">
            <span>Total gasto</span>
            <strong>{summary ? formatPrice(summary.total_cents) : '–'}</strong>
            <small>
              {ticket !== null ? `Ticket médio ${formatPrice(ticket)}` : ''}
            </small>
          </StatCard>
          <StatCard tone="neutral">
            <span>Última visita</span>
            <strong>
              {summary?.last_visit
                ? format(parseISO(summary.last_visit), 'dd/MM/yy')
                : '–'}
            </strong>
            <small>{nextText}</small>
          </StatCard>
        </Cards>

        <Layout>
          <SideColumn>
            <Card>
              <CardHeader>
                <div>
                  <h2>Observações</h2>
                  <p>{examples.notesHint}</p>
                </div>
              </CardHeader>
              <CardBody>
                <NotesArea
                  value={notes}
                  maxLength={MAX_NOTES}
                  disabled={!client}
                  placeholder={examples.notesPlaceholder}
                  aria-label="Observações sobre o cliente"
                  onChange={event => setNotes(event.target.value)}
                />
                <NotesFooter>
                  <small>Aparecem ao abrir os agendamentos na agenda.</small>
                  <UIButton
                    type="button"
                    size="sm"
                    disabled={!notesChanged || savingNotes}
                    onClick={saveNotes}
                  >
                    <FiSave />
                    {savingNotes ? 'Salvando...' : 'Salvar'}
                  </UIButton>
                </NotesFooter>
              </CardBody>
            </Card>

            <MembershipCard clientId={id} clientName={client?.name || ''} />
          </SideColumn>

          <Card>
            <CardHeader>
              <div>
                <h2>Histórico</h2>
                <p>Clique num agendamento para vê-lo na agenda.</p>
              </div>
              <Filters role="group" aria-label="Filtrar histórico">
                {FILTERS.map(option => (
                  <button
                    key={option.value}
                    type="button"
                    aria-pressed={filter === option.value}
                    onClick={() => setFilter(option.value)}
                  >
                    {option.label}
                  </button>
                ))}
              </Filters>
            </CardHeader>

            {client && shown.length === 0 ? (
              <EmptyState
                compact
                icon="calendar"
                title={
                  filter === 'all'
                    ? 'Nenhum agendamento ainda'
                    : 'Nenhum agendamento nesta situação'
                }
              />
            ) : (
              <HistoryTable>
                <thead>
                  <tr>
                    <th>Data</th>
                    <th>Serviço</th>
                    <th>{terms.Professional}</th>
                    <th className="num">Valor</th>
                    <th>Situação</th>
                  </tr>
                </thead>
                <tbody>
                  {!client
                    ? [1, 2, 3, 4, 5].map(key => (
                        <tr key={key}>
                          <td>
                            <SkeletonBar width={120} />
                          </td>
                          <td>
                            <SkeletonBar width={140} />
                          </td>
                          <td>
                            <SkeletonBar width={70} />
                          </td>
                          <td>
                            <SkeletonBar width={60} />
                          </td>
                          <td>
                            <SkeletonBar width={80} />
                          </td>
                        </tr>
                      ))
                    : shown.map(item => {
                        const status = historyStatus(item, now);
                        const date = parseISO(item.date);

                        return (
                          <HistoryRow
                            key={item.id}
                            canceled={!!item.canceled_at}
                            title="Ver o dia na agenda"
                            onClick={() =>
                              history.push(
                                `/dashboard?data=${format(date, 'yyyy-MM-dd')}`,
                              )
                            }
                          >
                            <td>
                              {format(date, 'EEE, dd/MM/yy HH:mm', {
                                locale: ptBR,
                              })}
                            </td>
                            <td>{item.service?.name || 'Não informado'}</td>
                            <td>{item.provider?.name || '–'}</td>
                            <td className="num">
                              {item.included && 'Plano'}
                              {!item.included &&
                                (item.price_cents !== null
                                  ? formatPrice(item.price_cents)
                                  : '–')}
                            </td>
                            <td>
                              <StatusTag tone={status.tone}>
                                {status.label}
                              </StatusTag>
                            </td>
                          </HistoryRow>
                        );
                      })}
                </tbody>
              </HistoryTable>
            )}
          </Card>
        </Layout>
      </Page>

      {editing && client && (
        <EditClientModal
          client={client}
          onClose={() => setEditing(false)}
          onSaved={saved => {
            setClient(saved);
            setNotes(saved.notes || '');
            setEditing(false);
          }}
        />
      )}
    </AppLayout>
  );
};

export default ClientProfile;
