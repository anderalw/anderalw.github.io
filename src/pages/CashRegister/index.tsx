import React, { useCallback, useEffect, useState } from 'react';
import { format, parseISO } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';
import { FiAlertTriangle, FiLock, FiRefreshCw } from 'react-icons/fi';

import api from '../../services/api';
import { useToast } from '../../hooks/Toast';
import getApiErrorMessage from '../../utils/getApiErrorMessage';
import { formatPrice, parsePrice } from '../../utils/money';
import {
  PaymentMethod,
  PAYMENT_METHODS,
  PAYMENT_LABELS,
  centsToInput,
} from '../../utils/payment';

import AppLayout from '../../components/AppLayout';
import {
  Page,
  PageHeader,
  Card,
  CardHeader,
  CardBody,
  UIButton,
  TextInput,
  Badge,
} from '../../components/ui';
import { SkeletonBar, EmptyText } from '../ManageServices/styles';
import { StatCard } from '../Revenue/styles';
import PendingCard, { PendingItem } from './PendingCard';
import {
  DateBar,
  Layout,
  PendingNote,
  ItemsTable,
  MethodSelect,
  Lines,
  Difference,
  CloseForm,
  ClosedInfo,
  Notes,
  FieldLabel,
  FormError,
  CashCards,
  LeftColumn,
  PendingDays,
} from './styles';

type TotalKey = PaymentMethod | 'unknown';

interface CashItem {
  id: string;
  date: string;
  client_name: string;
  provider_name: string;
  service_name: string;
  price_cents: number | null;
  paid_cents: number | null;
  received_cents: number;
  payment_method: PaymentMethod | null;
}

// Mensalidade do clube recebida no dia
interface MembershipItem {
  id: string;
  paid_at: string;
  client_name: string;
  plan_name: string;
  amount_cents: number;
  payment_method: PaymentMethod;
}

interface Closing {
  opening_cents: number;
  counted_cents: number;
  expected_cash_cents: number;
  difference_cents: number;
  received_cents: number;
  notes: string | null;
  closed_at: string;
  closed_by: { id: string; name: string } | null;
  // Mudou algo depois do fechamento
  outdated: boolean;
}

interface CashDay {
  date: string;
  received_cents: number;
  totals: Record<TotalKey, { count: number; cents: number }>;
  items: CashItem[];
  memberships: MembershipItem[];
  pending: number;
  // Já passaram e ninguém registrou (neste dia)
  pending_items: PendingItem[];
  // Dias anteriores com pendências, do mais recente
  pending_days: { date: string; count: number }[];
  no_show: number;
  closing: Closing | null;
}

const today = (): string => format(new Date(), 'yyyy-MM-dd');

function differenceTone(cents: number): 'ok' | 'short' | 'over' {
  if (cents < 0) return 'short';
  if (cents > 0) return 'over';

  return 'ok';
}

function differenceText(cents: number): string {
  if (cents === 0) return 'Sem diferença';

  return `${cents < 0 ? 'Faltando' : 'Sobrando'} ${formatPrice(
    Math.abs(cents),
  )}`;
}

// Caixa do dia: quanto entrou em cada forma de pagamento, os atendimentos
// (com a forma de pagamento editável) e o fechamento com a conferência do
// dinheiro na gaveta
const CashRegister: React.FC = () => {
  const { addToast } = useToast();

  const [date, setDate] = useState(today);
  const [data, setData] = useState<CashDay | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);

  // Fechamento
  const [editingClose, setEditingClose] = useState(false);
  const [opening, setOpening] = useState('');
  const [counted, setCounted] = useState('');
  const [notes, setNotes] = useState('');
  const [closing, setClosing] = useState(false);
  const [closeError, setCloseError] = useState('');

  const load = useCallback(() => {
    let active = true;

    api
      .get<CashDay>('/cash', { params: { date } })
      .then(response => {
        if (active) setData(response.data);
      })
      .catch(err => {
        if (!active) return;

        addToast({
          type: 'error',
          title: 'Erro ao carregar o caixa',
          description: getApiErrorMessage(err, 'Tente novamente.'),
        });
      });

    return () => {
      active = false;
    };
  }, [date, addToast]);

  useEffect(() => {
    setData(null);
    setEditingClose(false);

    return load();
  }, [load]);

  const changeMethod = useCallback(
    async (item: CashItem, method: PaymentMethod | null) => {
      setSavingId(item.id);

      try {
        await api.patch(`/cash/payments/${item.id}`, {
          payment_method: method,
          paid_cents: item.paid_cents,
        });
        load();
      } catch (err) {
        addToast({
          type: 'error',
          title: 'Não foi possível salvar',
          description: getApiErrorMessage(err, 'Tente novamente.'),
        });
      } finally {
        setSavingId(null);
      }
    },
    [load, addToast],
  );

  const startClose = useCallback(() => {
    const previous = data?.closing;

    setOpening(previous ? centsToInput(previous.opening_cents) : '0,00');
    setCounted(previous ? centsToInput(previous.counted_cents) : '');
    setNotes(previous?.notes || '');
    setCloseError('');
    setEditingClose(true);
  }, [data]);

  const openingCents = parsePrice(opening || '0');
  const countedCents = counted.trim() ? parsePrice(counted) : null;
  const cashReceived = data?.totals.cash.cents ?? 0;
  const expectedCash = (openingCents ?? 0) + cashReceived;

  const handleClose = useCallback(
    async (event: React.FormEvent) => {
      event.preventDefault();

      if (openingCents === null) {
        setCloseError('Fundo de troco inválido. Ex: 100,00');
        return;
      }

      if (countedCents === null) {
        setCloseError('Informe o dinheiro contado na gaveta. Ex: 245,00');
        return;
      }

      setClosing(true);

      try {
        const response = await api.post<CashDay>('/cash/close', {
          date,
          opening_cents: openingCents,
          counted_cents: countedCents,
          notes: notes.trim() || null,
        });

        setData(response.data);
        setEditingClose(false);
        addToast({
          type: 'success',
          title: 'Caixa fechado',
          description: differenceText(
            response.data.closing?.difference_cents ?? 0,
          ),
        });
      } catch (err) {
        setCloseError(getApiErrorMessage(err, 'Não foi possível fechar.'));
      } finally {
        setClosing(false);
      }
    },
    [date, openingCents, countedCents, notes, addToast],
  );

  const totals = data?.totals;
  const future = date > today();
  const dayText = format(parseISO(date), "EEEE, d 'de' MMMM", {
    locale: ptBR,
  });

  const stat = (key: TotalKey): string =>
    totals ? formatPrice(totals[key].cents) : '–';
  const count = (key: TotalKey): string => {
    if (!totals) return '';

    const value = totals[key].count;

    // Com mensalidades do clube, a contagem inclui os dois tipos
    const word = key === 'unknown' ? 'atendimento' : 'pagamento';

    return `${value} ${word}${value === 1 ? '' : 's'}`;
  };

  return (
    <AppLayout>
      <Page>
        <PageHeader>
          <div>
            <h1>Caixa</h1>
            <p style={{ textTransform: 'none' }}>
              {dayText.charAt(0).toUpperCase() + dayText.slice(1)}
            </p>
          </div>
          <DateBar>
            <TextInput
              type="date"
              aria-label="Dia"
              value={date}
              onChange={event =>
                event.target.value && setDate(event.target.value)
              }
            />
            <UIButton
              type="button"
              variant="secondary"
              disabled={date === today()}
              onClick={() => setDate(today())}
            >
              Hoje
            </UIButton>
          </DateBar>
        </PageHeader>

        <CashCards>
          <StatCard tone="primary">
            <span>Total recebido</span>
            <strong>{data ? formatPrice(data.received_cents) : '–'}</strong>
            <small>
              {data
                ? [
                    `${data.items.length} atendimentos`,
                    data.memberships.length > 0 &&
                      `${data.memberships.length} ${
                        data.memberships.length === 1
                          ? 'mensalidade'
                          : 'mensalidades'
                      }`,
                  ]
                    .filter(Boolean)
                    .join(' · ')
                : ''}
            </small>
          </StatCard>
          {PAYMENT_METHODS.map(method => (
            <StatCard key={method} tone="neutral">
              <span>{PAYMENT_LABELS[method]}</span>
              <strong>{stat(method)}</strong>
              <small>{count(method)}</small>
            </StatCard>
          ))}
          <StatCard
            tone={totals && totals.unknown.count > 0 ? 'warning' : 'neutral'}
          >
            <span>Sem forma de pagamento</span>
            <strong>{stat('unknown')}</strong>
            <small>{count('unknown')}</small>
          </StatCard>
        </CashCards>

        {data && data.pending_days.length > 0 && (
          <PendingNote>
            <FiAlertTriangle />
            <span>Também há atendimentos sem registro em</span>
            <PendingDays>
              {data.pending_days.slice(0, 8).map(day => (
                <button
                  key={day.date}
                  type="button"
                  title="Abrir o caixa deste dia"
                  onClick={() => setDate(day.date)}
                >
                  {`${format(parseISO(day.date), 'dd/MM')} (${day.count})`}
                </button>
              ))}
              {data.pending_days.length > 8 && (
                <span>{`+${data.pending_days.length - 8} dias`}</span>
              )}
            </PendingDays>
          </PendingNote>
        )}

        {data && data.pending_items.length > 0 && (
          <PendingCard items={data.pending_items} onRegistered={load} />
        )}

        <Layout>
          <LeftColumn>
            <Card>
              <CardHeader>
                <div>
                  <h2>Atendimentos</h2>
                  <p>Complete a forma de pagamento dos que ficaram sem.</p>
                </div>
              </CardHeader>

              {data && data.items.length === 0 ? (
                <EmptyText>Nenhum atendimento concluído neste dia.</EmptyText>
              ) : (
                <ItemsTable>
                  <thead>
                    <tr>
                      <th>Horário</th>
                      <th>Cliente</th>
                      <th>Barbeiro</th>
                      <th className="num">Valor</th>
                      <th>Pagamento</th>
                    </tr>
                  </thead>
                  <tbody>
                    {!data
                      ? [1, 2, 3, 4].map(key => (
                          <tr key={key}>
                            <td>
                              <SkeletonBar width={40} />
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
                              <SkeletonBar width={100} />
                            </td>
                          </tr>
                        ))
                      : data.items.map(item => (
                          <tr key={item.id}>
                            <td>{format(parseISO(item.date), 'HH:mm')}</td>
                            <td>
                              {item.client_name}
                              <small>{item.service_name}</small>
                            </td>
                            <td>{item.provider_name}</td>
                            <td className="num">
                              {formatPrice(item.received_cents)}
                              {item.price_cents !== null &&
                                item.received_cents !== item.price_cents && (
                                  <small>
                                    {`preço ${formatPrice(item.price_cents)}`}
                                  </small>
                                )}
                            </td>
                            <td>
                              {item.payment_method === 'membership' ? (
                                <Badge tone="primary">Incluso no plano</Badge>
                              ) : (
                                <MethodSelect
                                  aria-label={`Pagamento de ${item.client_name}`}
                                  missing={!item.payment_method}
                                  value={item.payment_method || ''}
                                  disabled={savingId === item.id}
                                  onChange={event =>
                                    changeMethod(
                                      item,
                                      (event.target.value ||
                                        null) as PaymentMethod | null,
                                    )
                                  }
                                >
                                  <option value="">Não informado</option>
                                  {PAYMENT_METHODS.map(method => (
                                    <option key={method} value={method}>
                                      {PAYMENT_LABELS[method]}
                                    </option>
                                  ))}
                                </MethodSelect>
                              )}
                            </td>
                          </tr>
                        ))}
                  </tbody>
                </ItemsTable>
              )}
            </Card>

            {data && data.memberships.length > 0 && (
              <Card>
                <CardHeader>
                  <div>
                    <h2>Mensalidades do clube</h2>
                    <p>Entram nos totais de cada forma de pagamento.</p>
                  </div>
                </CardHeader>
                <ItemsTable>
                  <thead>
                    <tr>
                      <th>Horário</th>
                      <th>Cliente</th>
                      <th>Plano</th>
                      <th className="num">Valor</th>
                      <th>Pagamento</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.memberships.map(item => (
                      <tr key={item.id}>
                        <td>{format(parseISO(item.paid_at), 'HH:mm')}</td>
                        <td>{item.client_name}</td>
                        <td>{item.plan_name}</td>
                        <td className="num">
                          {formatPrice(item.amount_cents)}
                        </td>
                        <td>{PAYMENT_LABELS[item.payment_method]}</td>
                      </tr>
                    ))}
                  </tbody>
                </ItemsTable>
              </Card>
            )}
          </LeftColumn>

          <Card>
            <CardHeader>
              <div>
                <h2>Fechamento</h2>
                <p>Confira o dinheiro da gaveta.</p>
              </div>
            </CardHeader>
            <CardBody>
              {data && data.closing && !editingClose && (
                <>
                  <ClosedInfo warning={data.closing.outdated}>
                    {data.closing.outdated
                      ? 'Houve mudanças depois do fechamento. Refaça para conferir de novo.'
                      : `Fechado${
                          data.closing.closed_by
                            ? ` por ${data.closing.closed_by.name}`
                            : ''
                        } às ${format(
                          parseISO(data.closing.closed_at),
                          "HH:mm 'de' dd/MM",
                        )}.`}
                  </ClosedInfo>
                  <Lines>
                    <dt>Fundo de troco</dt>
                    <dd>{formatPrice(data.closing.opening_cents)}</dd>
                    <dt>Recebido em dinheiro</dt>
                    <dd>
                      {formatPrice(
                        data.closing.expected_cash_cents -
                          data.closing.opening_cents,
                      )}
                    </dd>
                    <dt className="total">Esperado na gaveta</dt>
                    <dd className="total">
                      {formatPrice(data.closing.expected_cash_cents)}
                    </dd>
                    <dt>Contado</dt>
                    <dd>{formatPrice(data.closing.counted_cents)}</dd>
                    <dt>Diferença</dt>
                    <Difference
                      tone={differenceTone(data.closing.difference_cents)}
                    >
                      {differenceText(data.closing.difference_cents)}
                    </Difference>
                  </Lines>
                  {data.closing.notes && <Notes>{data.closing.notes}</Notes>}
                  <UIButton
                    type="button"
                    variant="secondary"
                    style={{ marginTop: 18, width: '100%' }}
                    onClick={startClose}
                  >
                    <FiRefreshCw />
                    Refazer fechamento
                  </UIButton>
                </>
              )}

              {data && !data.closing && !editingClose && (
                <>
                  <Lines>
                    <dt>Recebido em dinheiro</dt>
                    <dd>{formatPrice(cashReceived)}</dd>
                    <dt>Recebido no total</dt>
                    <dd>{formatPrice(data.received_cents)}</dd>
                  </Lines>
                  <UIButton
                    type="button"
                    style={{ marginTop: 18, width: '100%' }}
                    disabled={future}
                    title={
                      future ? 'Só dá para fechar hoje ou dias anteriores' : ''
                    }
                    onClick={startClose}
                  >
                    <FiLock />
                    Fechar caixa
                  </UIButton>
                </>
              )}

              {editingClose && (
                <CloseForm onSubmit={handleClose} noValidate>
                  <FieldLabel htmlFor="cash-opening">
                    <span>Fundo de troco (no começo do dia)</span>
                    <TextInput
                      id="cash-opening"
                      value={opening}
                      inputMode="decimal"
                      autoFocus
                      onChange={event => {
                        setOpening(event.target.value);
                        setCloseError('');
                      }}
                    />
                  </FieldLabel>
                  <FieldLabel htmlFor="cash-counted">
                    <span>Dinheiro contado na gaveta</span>
                    <TextInput
                      id="cash-counted"
                      value={counted}
                      inputMode="decimal"
                      placeholder="Ex: 245,00"
                      onChange={event => {
                        setCounted(event.target.value);
                        setCloseError('');
                      }}
                    />
                  </FieldLabel>

                  <Lines>
                    <dt>Esperado na gaveta</dt>
                    <dd>{formatPrice(expectedCash)}</dd>
                    <dt>Diferença</dt>
                    {countedCents !== null ? (
                      <Difference
                        tone={differenceTone(countedCents - expectedCash)}
                      >
                        {differenceText(countedCents - expectedCash)}
                      </Difference>
                    ) : (
                      <dd>–</dd>
                    )}
                  </Lines>

                  <FieldLabel htmlFor="cash-notes">
                    <span>Observação (opcional)</span>
                    <TextInput
                      id="cash-notes"
                      value={notes}
                      maxLength={300}
                      placeholder="Ex: sangria de R$ 100,00 para o fornecedor"
                      onChange={event => setNotes(event.target.value)}
                    />
                  </FieldLabel>

                  <FormError role="alert">{closeError}</FormError>

                  <div style={{ display: 'flex', gap: 8 }}>
                    <UIButton
                      type="button"
                      variant="secondary"
                      disabled={closing}
                      onClick={() => setEditingClose(false)}
                    >
                      Cancelar
                    </UIButton>
                    <UIButton
                      type="submit"
                      disabled={closing}
                      style={{ flex: 1 }}
                    >
                      <FiLock />
                      {closing ? 'Fechando...' : 'Confirmar fechamento'}
                    </UIButton>
                  </div>
                </CloseForm>
              )}

              {!data && (
                <>
                  <SkeletonBar width={220} />
                  <div style={{ height: 12 }} />
                  <SkeletonBar width={180} />
                </>
              )}
            </CardBody>
          </Card>
        </Layout>
      </Page>
    </AppLayout>
  );
};

export default CashRegister;
