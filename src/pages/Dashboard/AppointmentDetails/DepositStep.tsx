import React, { useState } from 'react';
import styled from 'styled-components';
import { FiCheck } from 'react-icons/fi';

import { TextInput } from '../../../components/ui';
import { colors } from '../../../styles/theme';
import { formatPrice, parsePrice } from '../../../utils/money';
import {
  PaymentMethod,
  PAYMENT_METHODS,
  PAYMENT_LABELS,
  centsToInput,
} from '../../../utils/payment';
import { Methods, Method } from '../../Club/MembershipPaymentModal';
import { SectionTitle, PanelActions, SecondaryButton } from './styles';
import { ConfirmButton } from './PaymentStep';

interface DepositStepProps {
  // Sinal pedido (sugestão do valor)
  depositCents: number | null;
  priceCents: number | null;
  saving: boolean;
  onBack(): void;
  onConfirm(method: PaymentMethod, amountCents: number): void;
}

const Hint = styled.p`
  margin-bottom: 12px;
  font-size: 13px;
  color: ${colors.textMuted};
`;

const Amount = styled.label`
  display: flex;
  flex-direction: column;
  gap: 6px;
  max-width: 200px;

  span {
    font-size: 13px;
    font-weight: 500;
    color: ${colors.textMuted};
  }

  small {
    min-height: 16px;
    font-size: 12px;
    color: ${colors.danger};
  }
`;

// Sinal recebido antes do horário (entra no caixa de hoje)
const DepositStep: React.FC<DepositStepProps> = ({
  depositCents,
  priceCents,
  saving,
  onBack,
  onConfirm,
}) => {
  const [method, setMethod] = useState<PaymentMethod | null>(null);
  const [amount, setAmount] = useState(
    depositCents ? centsToInput(depositCents) : '',
  );

  const parsed = amount.trim() ? parsePrice(amount) : null;
  let error = '';

  if (amount.trim() && parsed === null) error = 'Valor inválido. Ex: 50,00';
  else if (parsed !== null && priceCents !== null && parsed > priceCents) {
    error = `Até ${formatPrice(priceCents)}.`;
  }

  return (
    <>
      <SectionTitle>Registrar sinal</SectionTitle>
      <Hint>
        Entra no caixa de hoje. No dia, o pagamento sugere só o que falta.
      </Hint>

      <Methods role="radiogroup" aria-label="Forma de pagamento do sinal">
        {PAYMENT_METHODS.map(option => (
          <Method
            key={option}
            type="button"
            role="radio"
            aria-checked={method === option}
            selected={method === option}
            onClick={() => setMethod(option)}
          >
            {PAYMENT_LABELS[option]}
          </Method>
        ))}
      </Methods>

      <Amount>
        <span>Valor do sinal</span>
        <TextInput
          value={amount}
          inputMode="decimal"
          aria-invalid={!!error}
          onChange={event => setAmount(event.target.value)}
        />
        <small>{error}</small>
      </Amount>

      <PanelActions style={{ marginTop: 'auto', alignItems: 'center' }}>
        <SecondaryButton type="button" onClick={onBack} disabled={saving}>
          Voltar
        </SecondaryButton>
        <ConfirmButton
          type="button"
          disabled={saving || !method || !parsed || !!error}
          onClick={() => method && parsed && onConfirm(method, parsed)}
        >
          <FiCheck />
          {saving ? 'Salvando...' : 'Registrar sinal'}
        </ConfirmButton>
      </PanelActions>
    </>
  );
};

export default DepositStep;
