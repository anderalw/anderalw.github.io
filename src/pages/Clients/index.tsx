import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useHistory, useLocation } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';
import {
  FiAlertTriangle,
  FiArrowDown,
  FiArrowUp,
  FiChevronLeft,
  FiChevronRight,
  FiDownload,
  FiSearch,
  FiSettings,
} from 'react-icons/fi';
import { FaWhatsapp } from 'react-icons/fa';

import api from '../../services/api';
import { useAuth } from '../../hooks/Auth';
import { useBranding } from '../../hooks/Branding';
import { useToast } from '../../hooks/Toast';
import getApiErrorMessage from '../../utils/getApiErrorMessage';
import { formatPrice } from '../../utils/money';
import { formatPhone, whatsappHref } from '../../utils/phone';

import AppLayout from '../../components/AppLayout';
import EmptyState from '../../components/EmptyState';
import {
  Page,
  PageHeader,
  Card,
  CardHeader,
  UIButton,
  TextInput,
  Select,
  Table,
  Muted,
} from '../../components/ui';
import { SkeletonBar, Counter } from '../ManageServices/styles';

import NoShowPolicyModal from './NoShowPolicyModal';
import {
  ClientsPage,
  ClientProfile,
  ClientFilter,
  ClientSort,
  NoShowPolicy,
  RECENT_APPOINTMENTS,
  FILTERS,
  INACTIVE_OPTIONS,
} from './types';
import {
  SearchField,
  ClientRow,
  AlertTag,
  Pagination,
  PolicyNote,
  FilterBar,
  FilterChip,
  SortButton,
  WhatsAppLink,
  TableScroll,
} from './styles';
import { useVocabulary } from '../../hooks/Vocabulary';

const PER_PAGE = 20;

type Direction = 'asc' | 'desc';

// Ao clicar numa coluna, a primeira ordem: números do maior para o menor
const FIRST_DIRECTION: Record<ClientSort, Direction> = {
  name: 'asc',
  visits: 'desc',
  no_shows: 'desc',
  last_visit: 'desc',
  next_appointment: 'asc',
  total: 'desc',
  birthday: 'asc',
};

const shortDate = (value: string | null): string =>
  value ? format(parseISO(value), 'dd/MM/yyyy') : '–';

const MONTHS = Array.from({ length: 12 }, (_, index) =>
  format(new Date(2026, index, 1), 'MMMM', { locale: ptBR }),
);

// Busca, recorte, ordem e página ficam no endereço: voltar da ficha do
// cliente mantém a lista como estava
interface ListState {
  search: string;
  filter: ClientFilter;
  sort: ClientSort | null;
  direction: Direction;
  inactiveDays: number;
  month: number;
  page: number;
}

function readState(query: string): ListState {
  const params = new URLSearchParams(query);
  const filter = params.get('filtro') as ClientFilter | null;
  const sort = params.get('ordem') as ClientSort | null;

  return {
    search: params.get('busca') || '',
    filter: FILTERS.some(item => item.key === filter)
      ? (filter as ClientFilter)
      : 'all',
    sort: sort && sort in FIRST_DIRECTION ? sort : null,
    direction: params.get('sentido') === 'desc' ? 'desc' : 'asc',
    inactiveDays: Number(params.get('dias')) || 60,
    month: Number(params.get('mes')) || new Date().getMonth() + 1,
    page: Math.max(1, Number(params.get('pagina')) || 1),
  };
}

function writeState(state: ListState): string {
  const params = new URLSearchParams();

  if (state.search) params.set('busca', state.search);
  if (state.filter !== 'all') params.set('filtro', state.filter);
  if (state.sort) {
    params.set('ordem', state.sort);
    params.set('sentido', state.direction);
  }
  if (state.filter === 'inactive')
    params.set('dias', String(state.inactiveDays));
  if (state.filter === 'birthdays') params.set('mes', String(state.month));
  if (state.page > 1) params.set('pagina', String(state.page));

  const text = params.toString();

  return text ? `?${text}` : '';
}

// Parâmetros da API para o estado da lista
function apiParams(state: ListState): Record<string, string | number> {
  const params: Record<string, string | number> = { search: state.search };

  if (state.filter !== 'all') params.filter = state.filter;
  if (state.sort) {
    params.sort = state.sort;
    params.direction = state.direction;
  }
  if (state.filter === 'inactive') params.inactive_days = state.inactiveDays;
  if (state.filter === 'birthdays') params.month = state.month;

  return params;
}

function firstName(name: string): string {
  return name.trim().split(/\s+/)[0];
}

// "02/09" a partir de "1990-09-02"
function birthdayText(value?: string | null): string | null {
  if (!value) return null;

  const [, month, day] = value.split('-');

  return `${day}/${month}`;
}

// Lista de clientes da barbearia com o resumo de cada um. Clicar abre a ficha
const Clients: React.FC = () => {
  const terms = useVocabulary();
  const history = useHistory();
  const location = useLocation();
  const { can } = useAuth();
  const { branding } = useBranding();
  const { addToast } = useToast();

  const state = useMemo(() => readState(location.search), [location.search]);

  // O que está digitado na busca (aplica quando a pessoa para de digitar)
  const [search, setSearch] = useState(state.search);
  const [data, setData] = useState<ClientsPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [policy, setPolicy] = useState<NoShowPolicy | null>(null);
  const [policyOpen, setPolicyOpen] = useState(false);

  const update = useCallback(
    (changes: Partial<ListState>) => {
      history.replace({
        pathname: location.pathname,
        // Mudou o recorte ou a ordem: volta para a primeira página
        search: writeState({ ...state, page: 1, ...changes }),
      });
    },
    [history, location.pathname, state],
  );

  useEffect(() => {
    const value = search.trim();

    if (value === state.search) return undefined;

    const timeout = setTimeout(() => update({ search: value }), 300);

    return () => clearTimeout(timeout);
  }, [search, state.search, update]);

  const loadClients = useCallback(() => {
    let active = true;

    setLoading(true);

    api
      .get<ClientsPage>('/clients/directory', {
        params: { ...apiParams(state), page: state.page },
      })
      .then(response => {
        if (active) setData(response.data);
      })
      .catch(err => {
        if (!active) return;

        addToast({
          type: 'error',
          title: 'Erro ao carregar os clientes',
          description: getApiErrorMessage(err, 'Tente novamente.'),
        });
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [state, addToast]);

  useEffect(loadClients, [loadClients]);

  useEffect(() => {
    api
      .get<NoShowPolicy>('/settings/no-show')
      .then(response => setPolicy(response.data))
      .catch(() => {
        // Sem a política a lista funciona; só não mostra a regra
      });
  }, []);

  // A planilha vem com o mesmo recorte e ordem da tela
  const handleExport = useCallback(async () => {
    setExporting(true);

    try {
      const response = await api.get<Blob>('/clients/directory/export', {
        params: apiParams(state),
        responseType: 'blob',
      });
      const url = URL.createObjectURL(response.data);
      const link = document.createElement('a');

      link.href = url;
      link.download = `clientes-${format(new Date(), 'yyyy-MM-dd')}.csv`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      addToast({
        type: 'error',
        title: 'Não foi possível exportar',
        description: getApiErrorMessage(err, 'Tente novamente.'),
      });
    } finally {
      setExporting(false);
    }
  }, [state, addToast]);

  // Mensagem pronta conforme o recorte (aniversário, saudade)
  const whatsappText = useCallback(
    (client: ClientProfile): string | undefined => {
      const name = firstName(client.name);

      if (state.filter === 'birthdays') {
        return `Feliz aniversário, ${name}! 🎉 Um abraço de toda a equipe da ${branding.name}.`;
      }

      if (state.filter === 'inactive') {
        return `Oi, ${name}! Tudo bem? Faz um tempo que você não aparece na ${branding.name}. Que tal marcar um horário? ${window.location.origin}/agendar`;
      }

      return undefined;
    },
    [state.filter, branding.name],
  );

  const sortBy = useCallback(
    (key: ClientSort) => {
      const current =
        state.sort || (state.filter === 'birthdays' ? 'birthday' : 'name');

      if (current === key) {
        update({
          sort: key,
          direction:
            (state.sort ? state.direction : 'asc') === 'asc' ? 'desc' : 'asc',
        });
      } else {
        update({ sort: key, direction: FIRST_DIRECTION[key] });
      }
    },
    [state, update],
  );

  const sortHeader = (key: ClientSort, label: string): React.ReactNode => {
    const current =
      state.sort || (state.filter === 'birthdays' ? 'birthday' : 'name');
    const active = current === key;
    const direction = state.sort ? state.direction : 'asc';

    return (
      <SortButton
        type="button"
        active={active}
        onClick={() => sortBy(key)}
        aria-label={`Ordenar por ${label.toLowerCase()}`}
      >
        {label}
        {active && direction === 'desc' ? <FiArrowDown /> : <FiArrowUp />}
      </SortButton>
    );
  };

  const total = data?.total ?? 0;
  const { page } = state;
  const first = total === 0 ? 0 : (page - 1) * PER_PAGE + 1;
  const last = Math.min(page * PER_PAGE, total);
  const lastPage = Math.max(1, Math.ceil(total / PER_PAGE));

  // Enquanto carrega, a lista mantém a altura da página anterior
  const skeletonRows = data?.clients.length || 8;

  const emptyText = (): string => {
    if (state.search) {
      return `Nenhum ${terms.client} encontrado para "${state.search}"`;
    }

    if (state.filter !== 'all') return `Nenhum ${terms.client} neste recorte`;

    return `Nenhum ${terms.client} cadastrado ainda`;
  };

  return (
    <AppLayout>
      <Page>
        <PageHeader>
          <div>
            <h1>{terms.Clients}</h1>
            <p>{`Histórico, observações e faltas de cada ${terms.client}.`}</p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <UIButton
              type="button"
              variant="secondary"
              disabled={exporting || total === 0}
              title="Baixa a lista (com o recorte e a ordem atuais) para abrir no Excel"
              onClick={handleExport}
            >
              <FiDownload />
              {exporting ? 'Exportando...' : 'Exportar'}
            </UIButton>
            {can('settings') && (
              <UIButton
                type="button"
                variant="secondary"
                onClick={() => setPolicyOpen(true)}
              >
                <FiSettings />
                Política de faltas
              </UIButton>
            )}
          </div>
        </PageHeader>

        <PolicyNote>
          <FiAlertTriangle />
          {!policy && 'Carregando a política de faltas...'}
          {policy &&
            policy.alert_threshold === 0 &&
            'O alerta de faltas está desligado.'}
          {policy &&
            policy.alert_threshold > 0 &&
            `Alerta para quem faltou ${policy.alert_threshold} ${
              policy.alert_threshold === 1 ? 'vez' : 'vezes'
            } ou mais nos últimos ${RECENT_APPOINTMENTS} agendamentos${
              policy.block_online
                ? `; esses ${terms.clients} só agendam ${terms.byPlace}.`
                : '.'
            }`}
        </PolicyNote>

        <Card>
          <CardHeader>
            <SearchField>
              <FiSearch />
              <TextInput
                type="search"
                value={search}
                onChange={event => setSearch(event.target.value)}
                placeholder="Buscar por nome, telefone, e-mail ou CPF"
                aria-label={`Buscar ${terms.client}`}
              />
            </SearchField>
            <Counter>
              {data
                ? `${total} ${total === 1 ? terms.client : terms.clients}`
                : '–'}
            </Counter>
          </CardHeader>

          <FilterBar role="group" aria-label="Recortes da lista">
            {FILTERS.map(item => (
              <FilterChip
                key={item.key}
                type="button"
                active={state.filter === item.key}
                title={item.hint}
                onClick={() => update({ filter: item.key, sort: null })}
              >
                {item.label}
              </FilterChip>
            ))}

            {state.filter === 'inactive' && (
              <Select
                aria-label="Sem vir há"
                value={state.inactiveDays}
                onChange={event =>
                  update({ inactiveDays: Number(event.target.value) })
                }
              >
                {INACTIVE_OPTIONS.map(days => (
                  <option key={days} value={days}>
                    {`há mais de ${days} dias`}
                  </option>
                ))}
              </Select>
            )}

            {state.filter === 'birthdays' && (
              <Select
                aria-label="Mês"
                value={state.month}
                onChange={event =>
                  update({ month: Number(event.target.value) })
                }
              >
                {MONTHS.map((name, index) => (
                  <option key={name} value={index + 1}>
                    {name.charAt(0).toUpperCase() + name.slice(1)}
                  </option>
                ))}
              </Select>
            )}
          </FilterBar>

          {!loading && data && data.clients.length === 0 ? (
            <EmptyState
              icon={state.search || state.filter !== 'all' ? 'search' : 'users'}
              title={emptyText()}
              description={
                state.search || state.filter !== 'all'
                  ? 'Tente outra busca ou outro recorte.'
                  : `Os ${terms.clients} aparecem aqui quando se cadastram no site ou são marcados pela agenda.`
              }
              action={
                (state.search || state.filter !== 'all') && (
                  <UIButton
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      setSearch('');
                      update({ search: '', filter: 'all', sort: null });
                    }}
                  >
                    Limpar busca e recortes
                  </UIButton>
                )
              }
            />
          ) : (
            <TableScroll>
              <Table>
                <thead>
                  <tr>
                    <th>
                      {state.filter === 'birthdays'
                        ? sortHeader(
                            'birthday',
                            `${terms.Client} (aniversário)`,
                          )
                        : sortHeader('name', terms.Client)}
                    </th>
                    <th className="num">
                      {sortHeader('visits', 'Atendimentos')}
                    </th>
                    <th className="num">{sortHeader('no_shows', 'Faltas')}</th>
                    <th>{sortHeader('last_visit', 'Última visita')}</th>
                    <th>{sortHeader('next_appointment', 'Próximo horário')}</th>
                    <th className="num">
                      {sortHeader('total', 'Total gasto')}
                    </th>
                    <th aria-label="WhatsApp" className="whatsapp" />
                  </tr>
                </thead>
                <tbody>
                  {loading || !data
                    ? Array.from({ length: skeletonRows }, (_, index) => (
                        <tr key={index}>
                          <td>
                            <SkeletonBar width={140 + ((index * 37) % 80)} />
                          </td>
                          <td>
                            <SkeletonBar width={30} />
                          </td>
                          <td>
                            <SkeletonBar width={20} />
                          </td>
                          <td>
                            <SkeletonBar width={80} />
                          </td>
                          <td>
                            <SkeletonBar width={80} />
                          </td>
                          <td>
                            <SkeletonBar width={70} />
                          </td>
                          <td className="whatsapp" aria-hidden="true" />
                        </tr>
                      ))
                    : data.clients.map(client => {
                        const whatsapp = whatsappHref(
                          client.phone,
                          whatsappText(client),
                        );
                        const birthday = birthdayText(client.birth_date);

                        return (
                          <ClientRow
                            key={client.id}
                            onClick={() =>
                              history.push(`/clientes/${client.id}`)
                            }
                          >
                            <td className="name">
                              <Link
                                to={`/clientes/${client.id}`}
                                onClick={event => event.stopPropagation()}
                              >
                                {client.name}
                                {client.no_show_alert && (
                                  <AlertTag
                                    title={`Faltou ${client.summary.recent_no_shows} dos últimos ${RECENT_APPOINTMENTS} agendamentos`}
                                  >
                                    <FiAlertTriangle />
                                    {client.summary.recent_no_shows} faltas
                                  </AlertTag>
                                )}
                              </Link>
                              <small>
                                {formatPhone(client.phone)}
                                {client.email && ` · ${client.email}`}
                                {state.filter === 'birthdays' &&
                                  birthday &&
                                  ` · 🎂 ${birthday}`}
                              </small>
                            </td>
                            <td className="num">{client.summary.completed}</td>
                            <td className="num">
                              {client.summary.no_shows || <Muted>0</Muted>}
                            </td>
                            <td>{shortDate(client.summary.last_visit)}</td>
                            <td>
                              {client.summary.next_appointment
                                ? format(
                                    parseISO(client.summary.next_appointment),
                                    "dd/MM 'às' HH:mm",
                                  )
                                : '–'}
                            </td>
                            <td className="num">
                              {formatPrice(client.summary.total_cents)}
                            </td>
                            <td className="whatsapp">
                              {whatsapp && (
                                <WhatsAppLink
                                  href={whatsapp}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  title={`Chamar ${firstName(
                                    client.name,
                                  )} no WhatsApp`}
                                  aria-label={`Chamar ${client.name} no WhatsApp`}
                                  onClick={event => event.stopPropagation()}
                                >
                                  <FaWhatsapp />
                                </WhatsAppLink>
                              )}
                            </td>
                          </ClientRow>
                        );
                      })}
                </tbody>
              </Table>
            </TableScroll>
          )}

          <Pagination>
            <span>{data ? `${first}–${last} de ${total}` : '–'}</span>
            <UIButton
              type="button"
              variant="secondary"
              size="sm"
              aria-label="Página anterior"
              disabled={loading || page <= 1}
              onClick={() => update({ ...state, page: page - 1 })}
            >
              <FiChevronLeft />
            </UIButton>
            <UIButton
              type="button"
              variant="secondary"
              size="sm"
              aria-label="Próxima página"
              disabled={loading || page >= lastPage}
              onClick={() => update({ ...state, page: page + 1 })}
            >
              <FiChevronRight />
            </UIButton>
          </Pagination>
        </Card>
      </Page>

      {policyOpen && policy && (
        <NoShowPolicyModal
          policy={policy}
          onClose={() => setPolicyOpen(false)}
          onSaved={saved => {
            setPolicy(saved);
            setPolicyOpen(false);
            // O alerta de cada cliente muda com a regra
            loadClients();
          }}
        />
      )}
    </AppLayout>
  );
};

export default Clients;
