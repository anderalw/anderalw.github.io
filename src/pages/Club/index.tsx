import React, { useCallback, useEffect, useState } from 'react';
import { FiCheck, FiDollarSign, FiEdit2, FiPlus, FiX } from 'react-icons/fi';

import api from '../../services/api';
import { useAuth } from '../../hooks/Auth';
import { useToast } from '../../hooks/Toast';
import getApiErrorMessage from '../../utils/getApiErrorMessage';
import { formatPrice } from '../../utils/money';

import AppLayout from '../../components/AppLayout';
import {
  Page,
  PageHeader,
  Card,
  CardHeader,
  UIButton,
  Table,
  Badge,
} from '../../components/ui';
import { SkeletonBar, EmptyText } from '../ManageServices/styles';
import { WEEKDAYS } from '../../components/WeekdayPicker';

import PlanModal from './PlanModal';
import MembershipPaymentModal, { PaymentMode } from './MembershipPaymentModal';
import {
  ClubOverview,
  MembershipView,
  Plan,
  PlanNumbers,
  describeItems,
  lastPaidDay,
  stateInfo,
} from './types';
import {
  KpiGrid,
  Kpi,
  Layout,
  Filters,
  FilterChip,
  StateBadge,
  Actions,
  PlanList,
  Numbers,
  Hint,
  ClientLink,
} from './styles';

type Filter = 'all' | 'pending' | 'overdue' | 'due';

const FILTERS: Array<{ key: Filter; label: string }> = [
  { key: 'all', label: 'Todos' },
  { key: 'pending', label: 'Pedidos do site' },
  { key: 'overdue', label: 'Em atraso' },
  { key: 'due', label: 'Vencendo' },
];

// Regras do plano em uma linha
function describeRules(plan: Plan): string {
  const rules: string[] = [];

  if (plan.min_interval_days) {
    rules.push(`intervalo de ${plan.min_interval_days} dias`);
  }

  if (plan.weekdays) {
    rules.push(
      `só ${plan.weekdays
        .map(day => WEEKDAYS[day].name.toLowerCase())
        .join(', ')}`,
    );
  }

  if (plan.discount_percent > 0) {
    rules.push(`${plan.discount_percent}% nos outros serviços`);
  }

  return rules.join(' · ');
}

// Clube de assinatura: assinantes, pedidos do site, mensalidades e planos
const Club: React.FC = () => {
  const { can } = useAuth();
  const { addToast } = useToast();

  const [overview, setOverview] = useState<ClubOverview | null>(null);
  const [plans, setPlans] = useState<Plan[] | null>(null);
  const [filter, setFilter] = useState<Filter>('all');
  // undefined: fechado; null: novo plano
  const [editingPlan, setEditingPlan] = useState<Plan | null | undefined>(
    undefined,
  );
  const [paying, setPaying] = useState<{
    mode: PaymentMode;
    membership: MembershipView;
  } | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(() => {
    Promise.all([
      api.get<ClubOverview>('/memberships'),
      api.get<Plan[]>('/memberships/plans'),
    ])
      .then(([overviewResponse, plansResponse]) => {
        setOverview(overviewResponse.data);
        setPlans(plansResponse.data);
      })
      .catch(err =>
        addToast({
          type: 'error',
          title: 'Não foi possível carregar o clube',
          description: getApiErrorMessage(err, 'Tente novamente.'),
        }),
      );
  }, [addToast]);

  useEffect(() => {
    load();
  }, [load]);

  const reject = useCallback(
    async (membership: MembershipView) => {
      const pending = membership.state === 'pending';

      if (
        // eslint-disable-next-line no-alert
        !window.confirm(
          pending
            ? `Recusar o pedido de ${membership.client.name}?`
            : `Cancelar a assinatura de ${membership.client.name}? Os próximos agendamentos voltam ao preço normal.`,
        )
      ) {
        return;
      }

      setBusy(membership.id);

      try {
        await api.post(`/memberships/${membership.id}/cancel`);
        addToast({
          type: 'success',
          title: pending ? 'Pedido recusado' : 'Assinatura cancelada',
          description: membership.client.name,
        });
        load();
      } catch (err) {
        addToast({
          type: 'error',
          title: 'Não foi possível',
          description: getApiErrorMessage(err, 'Tente novamente.'),
        });
      } finally {
        setBusy(null);
      }
    },
    [addToast, load],
  );

  const memberships = (overview?.memberships || []).filter(item => {
    if (filter === 'pending') return item.state === 'pending';
    if (filter === 'overdue') return item.state === 'overdue';
    if (filter === 'due') return stateInfo(item).tone === 'warning';

    return true;
  });

  const summary = overview?.summary;
  const numbersOf = (id: string): PlanNumbers | undefined =>
    overview?.plans.find(item => item.id === id);

  return (
    <AppLayout>
      <Page>
        <PageHeader>
          <div>
            <h1>Clube de assinatura</h1>
            <p>
              Assinantes, mensalidades e os planos. Para assinar um cliente na
              barbearia, abra a ficha dele.
            </p>
          </div>
          {can('catalog') && (
            <div>
              <UIButton type="button" onClick={() => setEditingPlan(null)}>
                <FiPlus />
                Novo plano
              </UIButton>
            </div>
          )}
        </PageHeader>

        <KpiGrid>
          <Kpi>
            <span>Assinantes em dia</span>
            <strong>{summary ? summary.active : '–'}</strong>
            <small />
          </Kpi>
          <Kpi>
            <span>Receita mensal</span>
            <strong>
              {summary ? formatPrice(summary.monthly_cents) : '–'}
            </strong>
            <small>mensalidades em dia</small>
          </Kpi>
          <Kpi tone={summary && summary.overdue > 0 ? 'warning' : undefined}>
            <span>Em atraso</span>
            <strong>{summary ? summary.overdue : '–'}</strong>
            <small>benefícios suspensos</small>
          </Kpi>
          <Kpi tone={summary && summary.pending > 0 ? 'primary' : undefined}>
            <span>Pedidos do site</span>
            <strong>{summary ? summary.pending : '–'}</strong>
            <small>aguardando confirmar</small>
          </Kpi>
          <Kpi>
            <span>Cancelamentos</span>
            <strong>{summary ? summary.canceled_last_30_days : '–'}</strong>
            <small>últimos 30 dias</small>
          </Kpi>
        </KpiGrid>

        <Layout>
          <Card>
            <CardHeader>
              <div>
                <h2>Assinantes</h2>
                <p>Os que vencem logo ou atrasaram aparecem primeiro.</p>
              </div>
            </CardHeader>
            <Filters role="group" aria-label="Filtrar assinantes">
              {FILTERS.map(item => (
                <FilterChip
                  key={item.key}
                  type="button"
                  selected={filter === item.key}
                  aria-pressed={filter === item.key}
                  onClick={() => setFilter(item.key)}
                >
                  {item.label}
                </FilterChip>
              ))}
            </Filters>

            {overview && memberships.length === 0 ? (
              <EmptyText>
                {filter === 'all'
                  ? 'Nenhum assinante ainda. Assine um cliente pela ficha dele ou divulgue os planos no site.'
                  : 'Ninguém nesta situação.'}
              </EmptyText>
            ) : (
              <Table>
                <thead>
                  <tr>
                    <th>Cliente</th>
                    <th>Plano</th>
                    <th>Situação</th>
                    <th>Pago até</th>
                    <th aria-label="Ações" />
                  </tr>
                </thead>
                <tbody>
                  {!overview
                    ? [160, 120, 180].map(width => (
                        <tr key={width}>
                          <td>
                            <SkeletonBar width={width} />
                          </td>
                          <td>
                            <SkeletonBar width={100} />
                          </td>
                          <td>
                            <SkeletonBar width={70} />
                          </td>
                          <td>
                            <SkeletonBar width={80} />
                          </td>
                          <td aria-hidden="true" />
                        </tr>
                      ))
                    : memberships.map(membership => {
                        const info = stateInfo(membership);
                        const pending = membership.state === 'pending';

                        return (
                          <tr key={membership.id}>
                            <td>
                              <ClientLink
                                to={`/clientes/${membership.client.id}`}
                              >
                                {membership.client.name}
                              </ClientLink>
                            </td>
                            <td style={{ whiteSpace: 'nowrap' }}>
                              {membership.plan.name}
                            </td>
                            <td>
                              <StateBadge tone={info.tone}>
                                {info.label}
                              </StateBadge>
                            </td>
                            <td>
                              {membership.paid_until
                                ? lastPaidDay(membership.paid_until)
                                : '–'}
                            </td>
                            <td>
                              <Actions>
                                <UIButton
                                  type="button"
                                  size="sm"
                                  variant={pending ? 'primary' : 'ghost'}
                                  disabled={busy === membership.id}
                                  onClick={() =>
                                    setPaying({
                                      mode: pending ? 'confirm' : 'renew',
                                      membership,
                                    })
                                  }
                                >
                                  {pending ? <FiCheck /> : <FiDollarSign />}
                                  {pending ? 'Confirmar' : 'Receber'}
                                </UIButton>
                                {pending && (
                                  <UIButton
                                    type="button"
                                    size="sm"
                                    variant="ghost"
                                    disabled={busy === membership.id}
                                    onClick={() => reject(membership)}
                                  >
                                    <FiX />
                                    Recusar
                                  </UIButton>
                                )}
                              </Actions>
                            </td>
                          </tr>
                        );
                      })}
                </tbody>
              </Table>
            )}
          </Card>

          <Card>
            <CardHeader>
              <div>
                <h2>Planos</h2>
                <p>Rendimento nos últimos 30 dias.</p>
              </div>
            </CardHeader>

            {plans && plans.length === 0 ? (
              <EmptyText>
                {can('catalog')
                  ? 'Nenhum plano. Crie o primeiro em "Novo plano".'
                  : 'Nenhum plano criado pelo administrador.'}
              </EmptyText>
            ) : (
              <PlanList>
                {!plans && (
                  <li>
                    <SkeletonBar width={180} />
                  </li>
                )}
                {(plans || []).map(plan => {
                  const numbers = numbersOf(plan.id);
                  const rules = describeRules(plan);
                  const balance = numbers
                    ? numbers.received_cents - numbers.used_value_cents
                    : 0;

                  return (
                    <li key={plan.id}>
                      <header>
                        <strong>{plan.name}</strong>
                        {!plan.active && <Badge>Fora de venda</Badge>}
                        <span className="price">
                          {`${formatPrice(plan.price_cents)}/mês`}
                        </span>
                      </header>
                      <p>
                        {describeItems(plan.items)}
                        {rules && (
                          <>
                            <br />
                            {rules}
                          </>
                        )}
                      </p>
                      {numbers && (
                        <Numbers>
                          <div>
                            <dt>Assinantes</dt>
                            <dd>{numbers.subscribers}</dd>
                          </div>
                          <div>
                            <dt>Recebido</dt>
                            <dd>{formatPrice(numbers.received_cents)}</dd>
                          </div>
                          <div
                            title={`${
                              numbers.uses
                            } usos que custariam ${formatPrice(
                              numbers.used_value_cents,
                            )} no preço normal`}
                          >
                            <dt>{`Usos (${numbers.uses})`}</dt>
                            <dd
                              className={
                                numbers.uses > 0 && balance < 0
                                  ? 'bad'
                                  : undefined
                              }
                            >
                              {formatPrice(numbers.used_value_cents)}
                            </dd>
                          </div>
                        </Numbers>
                      )}
                      {can('catalog') && (
                        <footer>
                          <UIButton
                            type="button"
                            size="sm"
                            variant="ghost"
                            onClick={() => setEditingPlan(plan)}
                          >
                            <FiEdit2 />
                            Editar
                          </UIButton>
                        </footer>
                      )}
                    </li>
                  );
                })}
              </PlanList>
            )}
            <Hint>
              &quot;Usos&quot; é quanto os atendimentos inclusos custariam no
              preço normal. Se passar muito do recebido, vale rever o preço ou
              as regras do plano.
            </Hint>
          </Card>
        </Layout>
      </Page>

      {editingPlan !== undefined && (
        <PlanModal
          plan={editingPlan}
          onClose={() => setEditingPlan(undefined)}
          onSaved={saved => {
            const created = editingPlan === null;

            setEditingPlan(undefined);
            addToast({
              type: 'success',
              title: created ? 'Plano criado' : 'Plano salvo',
              description: saved.name,
            });
            load();
          }}
        />
      )}

      {paying && (
        <MembershipPaymentModal
          mode={paying.mode}
          clientName={paying.membership.client.name}
          membership={paying.membership}
          onClose={() => setPaying(null)}
          onSaved={details => {
            setPaying(null);
            addToast({
              type: 'success',
              title:
                paying.mode === 'confirm'
                  ? 'Assinatura confirmada'
                  : 'Mensalidade registrada',
              description: `${details.client.name} · pago até ${
                details.paid_until ? lastPaidDay(details.paid_until) : '–'
              }`,
            });
            load();
          }}
        />
      )}
    </AppLayout>
  );
};

export default Club;
