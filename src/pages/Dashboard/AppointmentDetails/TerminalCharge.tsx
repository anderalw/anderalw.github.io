import React, { useCallback, useEffect, useRef, useState } from 'react';
import styled, { keyframes } from 'styled-components';
import { FiCheckCircle, FiCreditCard, FiRefreshCw, FiX } from 'react-icons/fi';

import api from '../../../services/api';
import getApiErrorMessage from '../../../utils/getApiErrorMessage';
import { formatPrice } from '../../../utils/money';
import { PaymentMethod, PAYMENT_LABELS } from '../../../utils/payment';
import { colors } from '../../../styles/theme';
import { PanelActions, SecondaryButton, DangerButton } from './styles';

export interface TerminalDevice {
  id: string;
  name: string;
}

interface Charge {
  id: string;
  status: 'pending' | 'approved' | 'rejected' | 'canceled' | 'expired';
  method: 'credit' | 'debit' | 'pix' | null;
  amount_cents: number;
  device_name: string;
  message: string | null;
}

interface TerminalChargeProps {
  appointmentId: string;
  device: TerminalDevice;
  // null: o preço marcado
  amountCents: number | null;
  priceCents: number | null;
  onPaid(method: PaymentMethod, amountCents: number): void;
  onBack(): void;
}

// A cada quanto a tela pergunta se a maquininha já recebeu
const POLL_MS = 2000;

const pulse = keyframes`
  0% { box-shadow: 0 0 0 0 rgba(var(--color-primary-rgb), 0.45); }
  70% { box-shadow: 0 0 0 18px rgba(var(--color-primary-rgb), 0); }
  100% { box-shadow: 0 0 0 0 rgba(var(--color-primary-rgb), 0); }
`;

const Box = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  text-align: center;

  strong {
    font-size: 32px;
    font-weight: 700;
    font-variant-numeric: tabular-nums;
    color: ${colors.text};
  }

  p {
    font-size: 14px;
    color: ${colors.textMuted};
    max-width: 320px;
    line-height: 1.5;
  }

  small {
    font-size: 13px;
    color: ${colors.textSubtle};
  }
`;

const Icon = styled.span<{ tone: 'waiting' | 'ok' | 'fail' }>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 64px;
  height: 64px;
  margin-bottom: 8px;
  border-radius: 50%;
  background: ${props => {
    if (props.tone === 'ok') return colors.successSoft;
    if (props.tone === 'fail') return colors.dangerSoft;

    return colors.primarySoft;
  }};
  color: ${props => {
    if (props.tone === 'ok') return colors.success;
    if (props.tone === 'fail') return colors.danger;

    return colors.primary;
  }};
  animation: ${props => (props.tone === 'waiting' ? pulse : 'none')} 1.6s
    infinite;

  svg {
    width: 28px;
    height: 28px;
  }
`;

// Manda a cobrança para a maquininha e espera a resposta da operadora. Ao
// aprovar, o atendimento já foi marcado como pago no servidor
const TerminalCharge: React.FC<TerminalChargeProps> = ({
  appointmentId,
  device,
  amountCents,
  priceCents,
  onPaid,
  onBack,
}) => {
  const [charge, setCharge] = useState<Charge | null>(null);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  const [canceling, setCanceling] = useState(false);
  const paidRef = useRef(false);

  // Envia a cobrança (de novo a cada "Tentar de novo")
  useEffect(() => {
    let active = true;

    setCharge(null);
    setError('');

    api
      .post<Charge>('/card-charges', {
        appointment_id: appointmentId,
        device_id: device.id,
        amount_cents: amountCents,
      })
      .then(response => {
        if (active) setCharge(response.data);
      })
      .catch(err => {
        if (active) {
          setError(getApiErrorMessage(err, 'A maquininha não respondeu.'));
        }
      });

    return () => {
      active = false;
    };
  }, [appointmentId, device.id, amountCents, attempt]);

  // Enquanto aguarda, pergunta a situação
  useEffect(() => {
    if (!charge || charge.status !== 'pending') return undefined;

    const timer = window.setTimeout(() => {
      api
        .get<Charge>(`/card-charges/${charge.id}`)
        .then(response => setCharge(response.data))
        .catch(() => {
          // Falha de rede: tenta na próxima rodada
          setCharge(current => (current ? { ...current } : current));
        });
    }, POLL_MS);

    return () => window.clearTimeout(timer);
  }, [charge]);

  useEffect(() => {
    if (charge?.status === 'approved' && charge.method && !paidRef.current) {
      paidRef.current = true;
      onPaid(charge.method, charge.amount_cents);
    }
  }, [charge, onPaid]);

  const cancel = useCallback(async () => {
    if (!charge || charge.status !== 'pending') {
      onBack();
      return;
    }

    setCanceling(true);

    try {
      const response = await api.post<Charge>(
        `/card-charges/${charge.id}/cancel`,
      );

      setCharge(response.data);

      // Foi paga no último instante: o efeito acima conclui
      if (response.data.status !== 'approved') onBack();
    } catch (err) {
      setError(getApiErrorMessage(err, 'Não foi possível cancelar.'));
    } finally {
      setCanceling(false);
    }
  }, [charge, onBack]);

  const amount = amountCents ?? priceCents ?? 0;
  const failed =
    !!error ||
    (!!charge && ['rejected', 'canceled', 'expired'].includes(charge.status));
  const approved = charge?.status === 'approved';

  let tone: 'waiting' | 'ok' | 'fail' = 'waiting';
  if (approved) tone = 'ok';
  if (failed) tone = 'fail';

  let title = 'Enviando para a maquininha...';
  let text = device.name;

  if (charge?.status === 'pending') {
    title = 'Aguardando pagamento';
    text = `Peça para o cliente passar o cartão ou pagar com Pix na ${device.name.toLowerCase()}.`;
  } else if (approved && charge?.method) {
    title = 'Pagamento aprovado';
    text = PAYMENT_LABELS[charge.method];
  } else if (failed) {
    title =
      charge?.status === 'canceled' ? 'Cobrança cancelada' : 'Não foi pago';
    text = error || charge?.message || 'A maquininha recusou o pagamento.';
  }

  return (
    <>
      <Box aria-live="polite">
        <Icon tone={tone}>
          {tone === 'ok' && <FiCheckCircle />}
          {tone === 'fail' && <FiX />}
          {tone === 'waiting' && <FiCreditCard />}
        </Icon>
        <small>{title}</small>
        <strong>{formatPrice(amount)}</strong>
        <p>{text}</p>
      </Box>

      <PanelActions style={{ marginTop: 'auto' }}>
        {failed ? (
          <>
            <SecondaryButton type="button" onClick={onBack}>
              Outra forma de pagamento
            </SecondaryButton>
            <SecondaryButton
              type="button"
              onClick={() => setAttempt(value => value + 1)}
            >
              <FiRefreshCw style={{ marginRight: 6, verticalAlign: -2 }} />
              Tentar de novo
            </SecondaryButton>
          </>
        ) : (
          <DangerButton
            type="button"
            onClick={cancel}
            disabled={canceling || approved}
          >
            {canceling ? 'Cancelando...' : 'Cancelar cobrança'}
          </DangerButton>
        )}
      </PanelActions>
    </>
  );
};

export default TerminalCharge;
