import React, { useCallback, useEffect, useState } from 'react';
import { Link, useHistory } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import {
  FiAlertTriangle,
  FiChevronLeft,
  FiChevronRight,
  FiSearch,
  FiSettings,
} from 'react-icons/fi';

import api from '../../services/api';
import { useAuth } from '../../hooks/Auth';
import { useToast } from '../../hooks/Toast';
import getApiErrorMessage from '../../utils/getApiErrorMessage';
import { formatPrice } from '../../utils/money';
import { formatPhone } from '../../utils/phone';

import AppLayout from '../../components/AppLayout';
import {
  Page,
  PageHeader,
  Card,
  CardHeader,
  UIButton,
  TextInput,
  Table,
  Muted,
} from '../../components/ui';
import { SkeletonBar, EmptyText, Counter } from '../ManageServices/styles';

import NoShowPolicyModal from './NoShowPolicyModal';
import { ClientsPage, NoShowPolicy, RECENT_APPOINTMENTS } from './types';
import {
  SearchField,
  ClientRow,
  AlertTag,
  Pagination,
  PolicyNote,
} from './styles';

const PER_PAGE = 20;

const shortDate = (value: string | null): string =>
  value ? format(parseISO(value), 'dd/MM/yyyy') : '–';

// Lista de clientes da barbearia com o resumo de cada um. Clicar abre a ficha
const Clients: React.FC = () => {
  const history = useHistory();
  const { can } = useAuth();
  const { addToast } = useToast();

  const [search, setSearch] = useState('');
  // Busca aplicada (espera a pessoa parar de digitar)
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [data, setData] = useState<ClientsPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [policy, setPolicy] = useState<NoShowPolicy | null>(null);
  const [policyOpen, setPolicyOpen] = useState(false);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setQuery(search.trim());
      setPage(1);
    }, 300);

    return () => clearTimeout(timeout);
  }, [search]);

  const loadClients = useCallback(() => {
    let active = true;

    setLoading(true);

    api
      .get<ClientsPage>('/clients/directory', {
        params: { search: query, page },
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
  }, [query, page, addToast]);

  useEffect(loadClients, [loadClients]);

  useEffect(() => {
    api
      .get<NoShowPolicy>('/settings/no-show')
      .then(response => setPolicy(response.data))
      .catch(() => {
        // Sem a política a lista funciona; só não mostra a regra
      });
  }, []);

  const total = data?.total ?? 0;
  const first = total === 0 ? 0 : (page - 1) * PER_PAGE + 1;
  const last = Math.min(page * PER_PAGE, total);
  const lastPage = Math.max(1, Math.ceil(total / PER_PAGE));

  // Enquanto carrega, a lista mantém a altura da página anterior
  const skeletonRows = data?.clients.length || 8;

  return (
    <AppLayout>
      <Page>
        <PageHeader>
          <div>
            <h1>Clientes</h1>
            <p>Histórico, observações e faltas de cada cliente.</p>
          </div>
          {can('settings') && (
            <div>
              <UIButton
                type="button"
                variant="secondary"
                onClick={() => setPolicyOpen(true)}
              >
                <FiSettings />
                Política de faltas
              </UIButton>
            </div>
          )}
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
                ? '; esses clientes só agendam pela barbearia.'
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
                placeholder="Buscar por nome, telefone ou e-mail"
                aria-label="Buscar cliente"
              />
            </SearchField>
            <Counter>
              {data ? `${total} ${total === 1 ? 'cliente' : 'clientes'}` : '–'}
            </Counter>
          </CardHeader>

          {!loading && data && data.clients.length === 0 ? (
            <EmptyText>
              {query
                ? `Nenhum cliente encontrado para "${query}".`
                : 'Nenhum cliente cadastrado ainda.'}
            </EmptyText>
          ) : (
            <Table>
              <thead>
                <tr>
                  <th>Cliente</th>
                  <th className="num">Atendimentos</th>
                  <th className="num">Faltas</th>
                  <th>Última visita</th>
                  <th>Próximo horário</th>
                  <th className="num">Total gasto</th>
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
                      </tr>
                    ))
                  : data.clients.map(client => (
                      <ClientRow
                        key={client.id}
                        onClick={() => history.push(`/clientes/${client.id}`)}
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
                      </ClientRow>
                    ))}
              </tbody>
            </Table>
          )}

          <Pagination>
            <span>{data ? `${first}–${last} de ${total}` : '–'}</span>
            <UIButton
              type="button"
              variant="secondary"
              size="sm"
              aria-label="Página anterior"
              disabled={loading || page <= 1}
              onClick={() => setPage(value => value - 1)}
            >
              <FiChevronLeft />
            </UIButton>
            <UIButton
              type="button"
              variant="secondary"
              size="sm"
              aria-label="Próxima página"
              disabled={loading || page >= lastPage}
              onClick={() => setPage(value => value + 1)}
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
