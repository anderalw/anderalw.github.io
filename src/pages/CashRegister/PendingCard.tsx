import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { format, parseISO } from 'date-fns';
import { FiUserX } from 'react-icons/fi';

import api from '../../services/api';
import { useToast } from '../../hooks/Toast';
import getApiErrorMessage from '../../utils/getApiErrorMessage';
import { formatPrice } from '../../utils/money';
import {
  PaymentMethod,
  PAYMENT_METHODS,
  PAYMENT_LABELS,
} from '../../utils/payment';

import { Card, CardHeader } from '../../components/ui';
import {
  ItemsTable,
  TableScroll,
  BulkBar,
  QuickActions,
  QuickButton,
} from './styles';
import { useVocabulary } from '../../hooks/Vocabulary';

export interface PendingItem {
  id: string;
  date: string;
  client_name: string;
  provider_id: string;
  provider_name: string;
  service_name: string;
  price_cents: number | null;
  // Coberto pelo plano do clube
  included: boolean;
}

interface AttendanceItem {
  id: string;
  attendance: 'completed' | 'no_show';
  payment_method?: PaymentMethod | null;
}

interface PendingCardProps {
  items: PendingItem[];
  // Registrou: recarrega o caixa
  onRegistered(): void;
}

function priceText(item: PendingItem): string {
  if (item.included) return 'Plano';

  return item.price_cents !== null ? formatPrice(item.price_cents) : '–';
}

// Fechar o dia: os atendimentos que já passaram e ninguém registrou. Um
// clique marca como atendido (já com a forma de pagamento) ou falta; dá para
// selecionar vários e registrar de uma vez
const PendingCard: React.FC<PendingCardProps> = ({ items, onRegistered }) => {
  const terms = useVocabulary();
  const { addToast } = useToast();

  const [selected, setSelected] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  // Outro dia ou lista recarregada: tira da seleção o que não está mais nela
  useEffect(() => {
    setSelected(current =>
      current.filter(id => items.some(item => item.id === id)),
    );
  }, [items]);

  const allSelected = items.length > 0 && selected.length === items.length;

  const toggle = useCallback((id: string) => {
    setSelected(current =>
      current.includes(id)
        ? current.filter(item => item !== id)
        : [...current, id],
    );
  }, []);

  const register = useCallback(
    async (payload: AttendanceItem[]) => {
      setSaving(true);

      try {
        await api.post('/cash/attendances', { items: payload });

        const missed = payload.filter(
          item => item.attendance === 'no_show',
        ).length;
        const done = payload.length - missed;
        let title = `${payload.length} atendimentos registrados`;

        if (payload.length === 1) {
          title = missed ? 'Falta registrada' : 'Atendimento registrado';
        }

        addToast({
          type: 'success',
          title,
          description: [
            done > 0 && `${done} ${done === 1 ? 'atendido' : 'atendidos'}`,
            missed > 0 && `${missed} ${missed === 1 ? 'falta' : 'faltas'}`,
          ]
            .filter(Boolean)
            .join(' · '),
        });
        setSelected(current =>
          current.filter(id => !payload.some(item => item.id === id)),
        );
        onRegistered();
      } catch (err) {
        addToast({
          type: 'error',
          title: 'Não foi possível registrar',
          description: getApiErrorMessage(err, 'Tente novamente.'),
        });
      } finally {
        setSaving(false);
      }
    },
    [addToast, onRegistered],
  );

  // Em lote, quem tem plano fica como "incluso no plano" (não sai do clube)
  const registerSelected = useCallback(
    (method: PaymentMethod | 'no_show') => {
      register(
        items
          .filter(item => selected.includes(item.id))
          .map(item =>
            method === 'no_show'
              ? { id: item.id, attendance: 'no_show' }
              : {
                  id: item.id,
                  attendance: 'completed',
                  payment_method: item.included ? 'membership' : method,
                },
          ),
      );
    },
    [items, selected, register],
  );

  const selectedIncluded = useMemo(
    () =>
      items.filter(item => item.included && selected.includes(item.id)).length,
    [items, selected],
  );

  return (
    <Card accent="warning" style={{ marginBottom: 24 }}>
      <CardHeader>
        <div>
          <h2>{`A registrar (${items.length})`}</h2>
          <p>
            Já passaram e ninguém registrou. Clique na forma de pagamento para
            marcar como atendido, ou em Faltou.
          </p>
        </div>
      </CardHeader>

      <BulkBar active={selected.length > 0}>
        <label htmlFor="pending-all">
          <input
            id="pending-all"
            type="checkbox"
            checked={allSelected}
            disabled={saving}
            aria-label="Selecionar todos"
            onChange={() =>
              setSelected(allSelected ? [] : items.map(item => item.id))
            }
          />
          <span>
            {selected.length > 0
              ? `${selected.length} ${
                  selected.length === 1 ? 'selecionado' : 'selecionados'
                }${
                  selectedIncluded > 0
                    ? ` (${selectedIncluded} com plano de assinatura)`
                    : ''
                }`
              : 'Selecione para registrar vários de uma vez'}
          </span>
        </label>
        <QuickActions>
          <small>Atendidos com</small>
          {PAYMENT_METHODS.map(method => (
            <QuickButton
              key={method}
              type="button"
              disabled={saving || selected.length === 0}
              onClick={() => registerSelected(method)}
            >
              {PAYMENT_LABELS[method]}
            </QuickButton>
          ))}
          <QuickButton
            type="button"
            tone="danger"
            disabled={saving || selected.length === 0}
            onClick={() => registerSelected('no_show')}
          >
            <FiUserX />
            Faltaram
          </QuickButton>
        </QuickActions>
      </BulkBar>

      <TableScroll>
        <ItemsTable>
          <thead>
            <tr>
              <th aria-label="Selecionar" style={{ width: 20 }} />
              <th>Horário</th>
              <th>{terms.Client}</th>
              <th>{terms.Professional}</th>
              <th className="num">Valor</th>
              <th>Registrar</th>
            </tr>
          </thead>
          <tbody>
            {items.map(item => (
              <tr key={item.id}>
                <td>
                  <input
                    type="checkbox"
                    checked={selected.includes(item.id)}
                    disabled={saving}
                    aria-label={`Selecionar ${item.client_name}`}
                    onChange={() => toggle(item.id)}
                  />
                </td>
                <td>{format(parseISO(item.date), 'HH:mm')}</td>
                <td>
                  {item.client_name}
                  <small>{item.service_name}</small>
                </td>
                <td>{item.provider_name}</td>
                <td className="num">{priceText(item)}</td>
                <td>
                  <QuickActions>
                    {item.included && (
                      <QuickButton
                        type="button"
                        tone="primary"
                        disabled={saving}
                        onClick={() =>
                          register([
                            {
                              id: item.id,
                              attendance: 'completed',
                              payment_method: 'membership',
                            },
                          ])
                        }
                      >
                        No plano
                      </QuickButton>
                    )}
                    {PAYMENT_METHODS.map(method => (
                      <QuickButton
                        key={method}
                        type="button"
                        disabled={saving}
                        title={
                          item.included
                            ? 'Cobrar à parte tira este atendimento do plano'
                            : undefined
                        }
                        onClick={() =>
                          register([
                            {
                              id: item.id,
                              attendance: 'completed',
                              payment_method: method,
                            },
                          ])
                        }
                      >
                        {PAYMENT_LABELS[method]}
                      </QuickButton>
                    ))}
                    <QuickButton
                      type="button"
                      tone="danger"
                      disabled={saving}
                      onClick={() =>
                        register([{ id: item.id, attendance: 'no_show' }])
                      }
                    >
                      Faltou
                    </QuickButton>
                  </QuickActions>
                </td>
              </tr>
            ))}
          </tbody>
        </ItemsTable>
      </TableScroll>
    </Card>
  );
};

export default PendingCard;
