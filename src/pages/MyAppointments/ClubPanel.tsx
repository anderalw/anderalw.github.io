import React, { useCallback, useEffect, useState } from 'react';
import styled from 'styled-components';
import { useLocation } from 'react-router-dom';
import { FiAward, FiCheck } from 'react-icons/fi';

import api from '../../services/api';
import { useToast } from '../../hooks/Toast';
import getApiErrorMessage from '../../utils/getApiErrorMessage';
import { formatPrice } from '../../utils/money';
import { colors, radius } from '../../styles/theme';
import { UIButton } from '../../components/ui';
import {
  MembershipDetails,
  Plan,
  describeItems,
  lastPaidDay,
  stateInfo,
} from '../Club/types';
import { StateBadge } from '../Club/styles';

const Box = styled.section`
  max-width: 880px;
  margin-bottom: 24px;
  padding: 18px 20px;
  border: 1px solid ${colors.border};
  border-radius: ${radius.lg};
  background: ${colors.surface};

  > header {
    display: flex;
    align-items: center;
    gap: 10px;

    > svg {
      width: 20px;
      height: 20px;
      color: ${colors.primary};
    }

    h2 {
      font-size: 16px;
      font-weight: 600;
      color: ${colors.text};
    }

    > :last-child:not(:first-child) {
      margin-left: auto;
    }
  }

  > p {
    margin-top: 8px;
    font-size: 14px;
    line-height: 1.5;
    color: ${colors.textMuted};
  }
`;

const Plans = styled.ul`
  list-style: none;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 12px;
  margin-top: 14px;

  li {
    display: flex;
    flex-direction: column;
    gap: 6px;
    padding: 14px;
    border: 1px solid ${colors.border};
    border-radius: ${radius.md};
    background: ${colors.sunken};
  }

  li.selected {
    border-color: ${colors.primary};
  }

  strong {
    color: ${colors.text};
  }

  b {
    font-variant-numeric: tabular-nums;
    color: ${colors.text};
  }

  small {
    flex: 1;
    font-size: 13px;
    line-height: 1.5;
    color: ${colors.textMuted};
  }

  footer {
    display: flex;
    gap: 6px;
    margin-top: 6px;
  }
`;

const Usage = styled.ul`
  list-style: none;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 12px;

  li {
    padding: 6px 10px;
    border-radius: 999px;
    background: ${colors.surfaceHover};
    font-size: 13px;
    color: ${colors.text};
  }
`;

// "Meu plano" na área do cliente: pedir um plano do clube, acompanhar o
// pedido, o saldo do mês e até quando está pago
const ClubPanel: React.FC = () => {
  const { addToast } = useToast();
  const location = useLocation();
  // undefined: carregando
  const [membership, setMembership] = useState<
    MembershipDetails | null | undefined
  >(undefined);
  const [plans, setPlans] = useState<Plan[]>([]);
  // Plano que o cliente quer pedir (vem do site com ?assinar=)
  const [wanted, setWanted] = useState<string | null>(() =>
    new URLSearchParams(location.search).get('assinar'),
  );
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    Promise.all([
      api.get<MembershipDetails | null>('/memberships/me'),
      api.get<Plan[]>('/memberships/plans/public'),
    ])
      .then(([mine, available]) => {
        setMembership(mine.data || null);
        setPlans(available.data);
      })
      .catch(() => setMembership(null));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const request = useCallback(
    async (plan: Plan) => {
      setBusy(true);

      try {
        const response = await api.post<MembershipDetails>('/memberships/me', {
          plan_id: plan.id,
        });

        setMembership(response.data);
        setWanted(null);
        addToast({
          type: 'success',
          title: 'Pedido enviado',
          description: `A barbearia confirma o ${plan.name} quando receber a primeira mensalidade.`,
        });
      } catch (err) {
        addToast({
          type: 'error',
          title: 'Não foi possível pedir o plano',
          description: getApiErrorMessage(err, 'Tente novamente.'),
        });
      } finally {
        setBusy(false);
      }
    },
    [addToast],
  );

  const withdraw = useCallback(async () => {
    setBusy(true);

    try {
      await api.post('/memberships/me/withdraw');
      setMembership(null);
      addToast({ type: 'success', title: 'Pedido cancelado' });
    } catch (err) {
      addToast({
        type: 'error',
        title: 'Não foi possível',
        description: getApiErrorMessage(err, 'Tente novamente.'),
      });
    } finally {
      setBusy(false);
    }
  }, [addToast]);

  // Sem assinatura e sem planos à venda: nada a mostrar
  if (membership === undefined || (!membership && plans.length === 0)) {
    return null;
  }

  if (membership && membership.state === 'pending') {
    return (
      <Box aria-label="Clube">
        <header>
          <FiAward />
          <h2>{`Pedido do plano ${membership.plan.name}`}</h2>
          <StateBadge tone="primary">Aguardando a barbearia</StateBadge>
        </header>
        <p>
          {`A barbearia ativa o plano quando receber a primeira mensalidade (${formatPrice(
            membership.plan.price_cents,
          )}). Combine o pagamento no balcão ou pelo WhatsApp.`}
        </p>
        <UIButton
          type="button"
          size="sm"
          variant="ghost"
          disabled={busy}
          onClick={withdraw}
          style={{ marginTop: 10 }}
        >
          Desistir do pedido
        </UIButton>
      </Box>
    );
  }

  if (membership) {
    const info = stateInfo(membership);

    return (
      <Box aria-label="Meu plano">
        <header>
          <FiAward />
          <h2>{`Meu plano: ${membership.plan.name}`}</h2>
          <StateBadge tone={info.tone}>{info.label}</StateBadge>
        </header>
        <p>
          {membership.state === 'overdue'
            ? 'Mensalidade em atraso: por enquanto os serviços são cobrados normalmente. Os benefícios voltam assim que a barbearia registrar o pagamento.'
            : `Pago até ${
                membership.paid_until ? lastPaidDay(membership.paid_until) : '–'
              }. Os serviços do plano aparecem como "Incluso no plano" ao agendar.`}
        </p>
        <Usage aria-label="Saldo do mês">
          {membership.usage.map(item => (
            <li key={item.service_id}>
              {item.quantity === null
                ? `${item.service_name}: ilimitado`
                : `${item.service_name}: ${Math.max(
                    0,
                    item.quantity - item.used,
                  )} de ${item.quantity} restantes no mês`}
            </li>
          ))}
        </Usage>
      </Box>
    );
  }

  return (
    <Box aria-label="Clube">
      <header>
        <FiAward />
        <h2>Clube da barbearia</h2>
      </header>
      <p>Pague por mês e use os serviços do plano sem pagar a cada visita.</p>
      <Plans>
        {plans.map(plan => (
          <li
            key={plan.id}
            className={wanted === plan.id ? 'selected' : undefined}
          >
            <strong>{plan.name}</strong>
            <b>{`${formatPrice(plan.price_cents)}/mês`}</b>
            <small>{plan.description || describeItems(plan.items)}</small>
            <footer>
              {wanted === plan.id ? (
                <>
                  <UIButton
                    type="button"
                    size="sm"
                    disabled={busy}
                    onClick={() => request(plan)}
                  >
                    <FiCheck />
                    Confirmar pedido
                  </UIButton>
                  <UIButton
                    type="button"
                    size="sm"
                    variant="ghost"
                    disabled={busy}
                    onClick={() => setWanted(null)}
                  >
                    Voltar
                  </UIButton>
                </>
              ) : (
                <UIButton
                  type="button"
                  size="sm"
                  variant="secondary"
                  onClick={() => setWanted(plan.id)}
                >
                  Quero assinar
                </UIButton>
              )}
            </footer>
          </li>
        ))}
      </Plans>
    </Box>
  );
};

export default ClubPanel;
