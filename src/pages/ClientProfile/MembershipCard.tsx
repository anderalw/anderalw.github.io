import React, { useCallback, useEffect, useState } from 'react';
import styled from 'styled-components';
import { format, parseISO } from 'date-fns';
import { FiAward, FiCheck, FiDollarSign, FiX } from 'react-icons/fi';

import api from '../../services/api';
import { useToast } from '../../hooks/Toast';
import getApiErrorMessage from '../../utils/getApiErrorMessage';
import { formatPrice } from '../../utils/money';
import { PAYMENT_LABELS } from '../../utils/payment';
import { colors, radius } from '../../styles/theme';
import { Card, CardHeader, CardBody, UIButton } from '../../components/ui';
import { SkeletonBar } from '../ManageServices/styles';
import MembershipPaymentModal, {
  PaymentMode,
} from '../Club/MembershipPaymentModal';
import { MembershipDetails, lastPaidDay, stateInfo } from '../Club/types';
import { StateBadge } from '../Club/styles';

interface MembershipCardProps {
  clientId: string;
  clientName: string;
}

// Altura reservada: o conteúdo carrega sem empurrar a página
const Body = styled(CardBody)`
  min-height: 196px;
`;

const Plan = styled.div`
  display: flex;
  align-items: baseline;
  gap: 8px;

  strong {
    font-size: 16px;
    color: ${colors.text};
  }

  span {
    margin-left: auto;
    font-size: 13px;
    font-variant-numeric: tabular-nums;
    color: ${colors.textMuted};
  }
`;

const Muted = styled.p`
  margin-top: 6px;
  font-size: 13px;
  line-height: 1.5;
  color: ${colors.textMuted};
`;

const Usage = styled.ul`
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 14px;

  li > div {
    display: flex;
    justify-content: space-between;
    font-size: 13px;
    color: ${colors.text};
  }

  small {
    color: ${colors.textMuted};
    font-variant-numeric: tabular-nums;
  }
`;

const Bar = styled.span<{ percent: number }>`
  display: block;
  height: 6px;
  margin-top: 4px;
  border-radius: 999px;
  background: ${colors.surfaceHover};
  overflow: hidden;

  &::after {
    content: '';
    display: block;
    width: ${props => props.percent}%;
    height: 100%;
    border-radius: inherit;
    background: ${colors.primary};
  }
`;

const Buttons = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 16px;
`;

const Empty = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 12px;
  padding: 14px;
  border: 1px dashed ${colors.borderStrong};
  border-radius: ${radius.md};
  font-size: 13px;
  color: ${colors.textMuted};
`;

// Plano do clube na ficha do cliente: assinar, receber, saldo do mês
const MembershipCard: React.FC<MembershipCardProps> = ({
  clientId,
  clientName,
}) => {
  const { addToast } = useToast();
  // undefined: carregando; null: não é assinante
  const [membership, setMembership] = useState<
    MembershipDetails | null | undefined
  >(undefined);
  const [paying, setPaying] = useState<PaymentMode | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    api
      .get<MembershipDetails | null>(`/memberships/client/${clientId}`)
      .then(response => setMembership(response.data || null))
      .catch(() => setMembership(null));
  }, [clientId]);

  useEffect(() => {
    load();
  }, [load]);

  const cancel = useCallback(async () => {
    if (!membership) return;

    const pending = membership.state === 'pending';

    if (
      // eslint-disable-next-line no-alert
      !window.confirm(
        pending
          ? 'Recusar o pedido de assinatura?'
          : 'Cancelar a assinatura? Os próximos agendamentos voltam ao preço normal.',
      )
    ) {
      return;
    }

    setBusy(true);

    try {
      await api.post(`/memberships/${membership.id}/cancel`);
      addToast({
        type: 'success',
        title: pending ? 'Pedido recusado' : 'Assinatura cancelada',
        description: clientName,
      });
      load();
    } catch (err) {
      addToast({
        type: 'error',
        title: 'Não foi possível',
        description: getApiErrorMessage(err, 'Tente novamente.'),
      });
    } finally {
      setBusy(false);
    }
  }, [membership, clientName, addToast, load]);

  const info = membership ? stateInfo(membership) : null;
  const lastPayment = membership?.payments[0];

  let content: React.ReactNode;

  if (membership === undefined) {
    content = (
      <>
        <SkeletonBar width={160} />
        <Muted>
          <SkeletonBar width={220} />
        </Muted>
      </>
    );
  } else if (membership === null) {
    content = (
      <Empty>
        Não é assinante do clube.
        <UIButton
          type="button"
          size="sm"
          onClick={() => setPaying('subscribe')}
        >
          <FiAward />
          Assinar plano
        </UIButton>
      </Empty>
    );
  } else if (membership.state === 'pending') {
    content = (
      <>
        <Plan>
          <strong>{membership.plan.name}</strong>
          <span>{`${formatPrice(membership.plan.price_cents)}/mês`}</span>
        </Plan>
        <Muted>
          {`Pediu pelo site${
            membership.requested_at
              ? ` em ${format(parseISO(membership.requested_at), 'dd/MM')}`
              : ''
          }. Confirme ao receber a primeira mensalidade.`}
        </Muted>
        <Buttons>
          <UIButton
            type="button"
            size="sm"
            disabled={busy}
            onClick={() => setPaying('confirm')}
          >
            <FiCheck />
            Confirmar
          </UIButton>
          <UIButton
            type="button"
            size="sm"
            variant="ghost"
            disabled={busy}
            onClick={cancel}
          >
            <FiX />
            Recusar
          </UIButton>
        </Buttons>
      </>
    );
  } else {
    content = (
      <>
        <Plan>
          <strong>{membership.plan.name}</strong>
          <span>{`${formatPrice(membership.plan.price_cents)}/mês`}</span>
        </Plan>
        <Muted>
          {membership.paid_until &&
            `Pago até ${lastPaidDay(membership.paid_until)}`}
          {lastPayment &&
            ` · última: ${formatPrice(
              lastPayment.amount_cents,
            )} no ${PAYMENT_LABELS[lastPayment.payment_method].toLowerCase()}`}
        </Muted>

        <Usage aria-label="Saldo do mês">
          {membership.usage.map(item => (
            <li key={item.service_id}>
              <div>
                {item.service_name}
                <small>
                  {item.quantity === null
                    ? `${item.used} ${
                        item.used === 1 ? 'uso' : 'usos'
                      } · ilimitado`
                    : `${item.used} de ${item.quantity}`}
                </small>
              </div>
              {item.quantity !== null && (
                <Bar
                  percent={Math.min(100, (item.used / item.quantity) * 100)}
                />
              )}
            </li>
          ))}
        </Usage>

        <Buttons>
          <UIButton
            type="button"
            size="sm"
            variant={membership.state === 'overdue' ? 'primary' : 'secondary'}
            disabled={busy}
            onClick={() => setPaying('renew')}
          >
            <FiDollarSign />
            Receber mensalidade
          </UIButton>
          <UIButton
            type="button"
            size="sm"
            variant="ghost"
            disabled={busy}
            onClick={cancel}
          >
            Cancelar assinatura
          </UIButton>
        </Buttons>
      </>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div>
          <h2>Clube</h2>
          <p>
            {membership?.cycle
              ? `Saldo de ${format(
                  parseISO(membership.cycle.start),
                  'dd/MM',
                )} a ${lastPaidDay(membership.cycle.end).slice(0, 5)}`
              : 'Plano de assinatura'}
          </p>
        </div>
        {info && <StateBadge tone={info.tone}>{info.label}</StateBadge>}
      </CardHeader>
      <Body>{content}</Body>

      {paying && (
        <MembershipPaymentModal
          mode={paying}
          clientName={clientName}
          clientId={clientId}
          membership={membership || undefined}
          onClose={() => setPaying(null)}
          onSaved={details => {
            setPaying(null);
            setMembership(details);
            addToast({
              type: 'success',
              title:
                paying === 'renew'
                  ? 'Mensalidade registrada'
                  : 'Assinatura ativa',
              description: `${details.plan.name} · pago até ${
                details.paid_until ? lastPaidDay(details.paid_until) : '–'
              }`,
            });
          }}
        />
      )}
    </Card>
  );
};

export default MembershipCard;
