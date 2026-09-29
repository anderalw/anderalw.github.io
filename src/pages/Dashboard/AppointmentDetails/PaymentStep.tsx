import React, { useState } from 'react';
import styled, { css } from 'styled-components';
import {
  FiCreditCard,
  FiDollarSign,
  FiSmartphone,
  FiCheck,
} from 'react-icons/fi';

import { colors, radius } from '../../../styles/theme';
import { formatPrice, parsePrice } from '../../../utils/money';
import {
  PaymentMethod,
  PAYMENT_METHODS,
  PAYMENT_LABELS,
  centsToInput,
} from '../../../utils/payment';
import { TextInput } from '../../../components/ui';
import { SectionTitle, PanelActions, SecondaryButton } from './styles';

interface PaymentStepProps {
  // Preço marcado (sugestão do valor recebido)
  priceCents: number | null;
  initialMethod: PaymentMethod | null;
  initialPaidCents: number | null;
  // Já concluído: só troca o pagamento
  editing: boolean;
  saving: boolean;
  onBack(): void;
  onConfirm(method: PaymentMethod | null, paidCents: number | null): void;
}

const ICONS = {
  pix: FiSmartphone,
  credit: FiCreditCard,
  debit: FiCreditCard,
  cash: FiDollarSign,
};

const Methods = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
`;

const Method = styled.button<{ selected: boolean }>`
  display: flex;
  align-items: center;
  gap: 10px;
  height: 52px;
  padding: 0 14px;
  border: 1px solid ${colors.borderStrong};
  border-radius: 10px;
  background: ${colors.sunken};
  color: ${colors.text};
  font: inherit;
  font-weight: 500;
  transition: border-color 0.15s, background-color 0.15s;

  svg {
    width: 18px;
    height: 18px;
    color: ${colors.textMuted};
  }

  &:hover {
    border-color: ${colors.textSubtle};
  }

  ${props =>
    props.selected &&
    css`
      &,
      &:hover {
        border-color: ${colors.success};
        background: ${colors.successSoft};
      }

      svg {
        color: ${colors.success};
      }
    `}
`;

const Amount = styled.label`
  display: block;
  margin-top: 18px;

  > span {
    display: block;
    margin-bottom: 6px;
    font-size: 13px;
    font-weight: 500;
    color: ${colors.textMuted};
  }

  input {
    max-width: 180px;
    font-variant-numeric: tabular-nums;
  }

  small {
    display: block;
    min-height: 18px;
    margin-top: 6px;
    font-size: 12px;
    color: ${colors.textMuted};
  }

  small.error {
    color: ${colors.danger};
  }
`;

const ConfirmButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  border: 0;
  background: ${colors.success};
  color: ${colors.onPrimary};

  svg {
    width: 16px;
    height: 16px;
  }

  &:hover:not(:disabled) {
    filter: brightness(1.08);
  }
`;

const SkipButton = styled.button`
  margin-right: auto;
  padding: 0 !important;
  border: 0;
  background: transparent;
  color: ${colors.textMuted};
  font-size: 13px !important;
  font-weight: 400 !important;
  text-decoration: underline;

  &:hover:not(:disabled) {
    color: ${colors.text};
  }
`;

const Hint = styled.p`
  margin: -6px 0 14px;
  font-size: 13px;
  color: ${colors.textMuted};
  border-radius: ${radius.md};
`;

// Como o cliente pagou e quanto (com desconto ou acréscimo)
const PaymentStep: React.FC<PaymentStepProps> = ({
  priceCents,
  initialMethod,
  initialPaidCents,
  editing,
  saving,
  onBack,
  onConfirm,
}) => {
  const [method, setMethod] = useState<PaymentMethod | null>(initialMethod);
  const [amount, setAmount] = useState(() => {
    const cents = initialPaidCents ?? priceCents;

    return cents !== null ? centsToInput(cents) : '';
  });

  const parsed = amount.trim() ? parsePrice(amount) : null;
  const invalid = amount.trim() !== '' && parsed === null;
  const difference =
    parsed !== null && priceCents !== null ? parsed - priceCents : 0;

  let amountNote = '';

  if (invalid) {
    amountNote = 'Valor inválido. Ex: 45,00';
  } else if (difference < 0) {
    amountNote = `Desconto de ${formatPrice(-difference)}`;
  } else if (difference > 0) {
    amountNote = `Acréscimo de ${formatPrice(difference)} (ex: gorjeta)`;
  } else if (priceCents !== null) {
    amountNote = 'Igual ao preço marcado';
  }

  const submit = (chosen: PaymentMethod | null): void => {
    if (invalid) return;

    // Igual ao preço: não precisa guardar o valor
    onConfirm(chosen, parsed === null || parsed === priceCents ? null : parsed);
  };

  return (
    <>
      <SectionTitle>{editing ? 'Alterar pagamento' : 'Pagamento'}</SectionTitle>
      <Hint>Como o cliente pagou?</Hint>

      <Methods role="radiogroup" aria-label="Forma de pagamento">
        {PAYMENT_METHODS.map(option => {
          const Icon = ICONS[option];

          return (
            <Method
              key={option}
              type="button"
              role="radio"
              aria-checked={method === option}
              selected={method === option}
              onClick={() => setMethod(option)}
            >
              <Icon />
              {PAYMENT_LABELS[option]}
            </Method>
          );
        })}
      </Methods>

      <Amount>
        <span>Valor recebido</span>
        <TextInput
          value={amount}
          inputMode="decimal"
          aria-invalid={invalid}
          onChange={event => setAmount(event.target.value)}
        />
        <small className={invalid ? 'error' : undefined}>{amountNote}</small>
      </Amount>

      <PanelActions style={{ marginTop: 'auto', alignItems: 'center' }}>
        {!editing && (
          <SkipButton
            type="button"
            disabled={saving || invalid}
            onClick={() => submit(null)}
            title="A forma de pagamento pode ser informada depois, na tela do Caixa"
          >
            Informar depois
          </SkipButton>
        )}
        <SecondaryButton type="button" onClick={onBack} disabled={saving}>
          Voltar
        </SecondaryButton>
        <ConfirmButton
          type="button"
          disabled={saving || invalid || !method}
          onClick={() => submit(method)}
        >
          <FiCheck />
          {saving && 'Salvando...'}
          {!saving && (editing ? 'Salvar pagamento' : 'Concluir atendimento')}
        </ConfirmButton>
      </PanelActions>
    </>
  );
};

export default PaymentStep;
