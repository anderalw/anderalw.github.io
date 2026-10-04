import React, { useEffect, useState } from 'react';
import styled, { css } from 'styled-components';
import {
  FiCreditCard,
  FiDollarSign,
  FiSmartphone,
  FiCheck,
  FiAward,
} from 'react-icons/fi';

import { colors, radius } from '../../../styles/theme';
import { formatPrice, parsePrice } from '../../../utils/money';
import {
  PaymentMethod,
  PAYMENT_METHODS,
  PAYMENT_LABELS,
  centsToInput,
} from '../../../utils/payment';
import api from '../../../services/api';
import { TextInput } from '../../../components/ui';
import { SectionTitle, PanelActions, SecondaryButton } from './styles';
import TerminalCharge, { TerminalDevice } from './TerminalCharge';

// Última maquininha escolhida neste navegador
const DEVICE_KEY = '@GoBarber:terminalDevice';

// Cobrar na maquininha: escolha do aparelho (se houver mais de um) e o botão
const TerminalRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 6px;
  padding-top: 14px;
  border-top: 1px dashed ${colors.borderStrong};

  select {
    flex: 1;
    min-width: 0;
    height: 40px;
    padding: 0 10px;
    border: 1px solid ${colors.borderStrong};
    border-radius: ${radius.md};
    background: ${colors.sunken};
    color: ${colors.text};
    font: inherit;
    font-size: 13px;
  }
`;

const TerminalButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  height: 40px;
  padding: 0 16px;
  border: 1px solid ${colors.primary};
  border-radius: ${radius.md};
  background: ${colors.primarySoft};
  color: ${colors.primary};
  font: inherit;
  font-weight: 600;
  white-space: nowrap;

  svg {
    width: 16px;
    height: 16px;
  }

  &:hover:not(:disabled) {
    background: ${colors.primary};
    color: ${colors.onPrimary};
  }

  &:disabled {
    opacity: 0.5;
  }
`;

interface PaymentStepProps {
  appointmentId: string;
  // Preço marcado (sugestão do valor recebido)
  priceCents: number | null;
  // Clube: incluso no plano do cliente e o preço normal do serviço
  included: boolean;
  listPriceCents: number | null;
  // Incluso num pacote de sessões (e não no plano do clube)
  inPackage?: boolean;
  // Sinal já recebido: priceCents já vem sem ele
  depositPaidCents?: number;
  initialMethod: PaymentMethod | null;
  initialPaidCents: number | null;
  // Já concluído: só troca o pagamento
  editing: boolean;
  saving: boolean;
  onBack(): void;
  onConfirm(method: PaymentMethod | null, paidCents: number | null): void;
  // A maquininha aprovou (o servidor já marcou como pago)
  onTerminalPaid(method: PaymentMethod, amountCents: number): void;
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

export const ConfirmButton = styled.button`
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

// Incluso no plano: nada a cobrar
const IncludedBox = styled.div`
  display: flex;
  gap: 12px;
  padding: 16px;
  border: 1px solid ${colors.primary};
  border-radius: ${radius.md};
  background: ${colors.primarySoft};

  > svg {
    flex-shrink: 0;
    width: 22px;
    height: 22px;
    color: ${colors.primary};
  }

  strong {
    display: block;
    font-size: 15px;
    color: ${colors.text};
  }

  p {
    margin-top: 4px;
    font-size: 13px;
    line-height: 1.5;
    color: ${colors.textMuted};
  }
`;

const LinkButton = styled.button`
  align-self: flex-start;
  margin-top: 14px;
  padding: 0;
  border: 0;
  background: transparent;
  color: ${colors.textMuted};
  font-size: 13px;
  text-decoration: underline;

  &:hover {
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
  appointmentId,
  onTerminalPaid,
  priceCents: markedPriceCents,
  included,
  listPriceCents,
  inPackage = false,
  depositPaidCents = 0,
  initialMethod,
  initialPaidCents,
  editing,
  saving,
  onBack,
  onConfirm,
}) => {
  // Incluso no plano: só troca para uma cobrança normal se o barbeiro pedir
  const [chargeNormally, setChargeNormally] = useState(false);
  const planView = included && !chargeNormally;
  // Cobrando normalmente um incluso: o preço normal do serviço
  const priceCents =
    included && listPriceCents !== null ? listPriceCents : markedPriceCents;
  const [method, setMethod] = useState<PaymentMethod | null>(
    initialMethod === 'membership' ? null : initialMethod,
  );
  // Maquininhas ativas cadastradas (vazio: sem cobrança integrada)
  const [devices, setDevices] = useState<TerminalDevice[]>([]);
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [charging, setCharging] = useState(false);

  useEffect(() => {
    let active = true;

    api
      .get<{ devices: TerminalDevice[] }>('/card-charges/settings')
      .then(response => {
        if (!active) return;

        setDevices(response.data.devices);

        let saved: string | null = null;
        try {
          saved = localStorage.getItem(DEVICE_KEY);
        } catch {
          // Sem storage: a primeira maquininha
        }

        const found = response.data.devices.find(item => item.id === saved);
        setDeviceId((found || response.data.devices[0])?.id || null);
      })
      .catch(() => {
        // Sem a configuração, só as formas manuais
      });

    return () => {
      active = false;
    };
  }, []);

  const device = devices.find(item => item.id === deviceId) || null;

  const chooseDevice = (id: string): void => {
    setDeviceId(id);

    try {
      localStorage.setItem(DEVICE_KEY, id);
    } catch {
      // Sem storage: vale até recarregar
    }
  };
  const [amount, setAmount] = useState(() => {
    const cents = initialPaidCents ?? priceCents;

    return cents !== null ? centsToInput(cents) : '';
  });

  // O valor do campo segue o preço normal ao trocar para "cobrar normalmente"
  useEffect(() => {
    if (chargeNormally && listPriceCents !== null) {
      setAmount(centsToInput(listPriceCents));
    }
  }, [chargeNormally, listPriceCents]);

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
  } else if (priceCents !== null && depositPaidCents > 0) {
    amountNote = `O que falta (sinal de ${formatPrice(
      depositPaidCents,
    )} já pago)`;
  } else if (priceCents !== null) {
    amountNote = 'Igual ao preço marcado';
  }

  const submit = (chosen: PaymentMethod | null): void => {
    if (invalid) return;

    // Igual ao preço: não precisa guardar o valor
    onConfirm(chosen, parsed === null || parsed === priceCents ? null : parsed);
  };

  if (planView) {
    return (
      <>
        <SectionTitle>
          {editing ? 'Alterar pagamento' : 'Pagamento'}
        </SectionTitle>
        <IncludedBox>
          <FiAward />
          <div>
            <strong>
              {inPackage ? 'Incluso no pacote' : 'Incluso no plano'}
            </strong>
            <p>
              {inPackage
                ? 'Sessão do pacote comprado pelo cliente: este atendimento não é cobrado'
                : 'O cliente tem plano de assinatura: este atendimento não é cobrado'}
              {listPriceCents !== null &&
                ` (no preço normal seria ${formatPrice(listPriceCents)})`}
              .
            </p>
          </div>
        </IncludedBox>
        <LinkButton type="button" onClick={() => setChargeNormally(true)}>
          {inPackage
            ? 'Cobrar normalmente (a sessão volta ao pacote)'
            : 'Cobrar normalmente (o uso volta ao saldo do plano)'}
        </LinkButton>

        <PanelActions style={{ marginTop: 'auto', alignItems: 'center' }}>
          <SecondaryButton type="button" onClick={onBack} disabled={saving}>
            Voltar
          </SecondaryButton>
          <ConfirmButton
            type="button"
            disabled={saving}
            onClick={() => onConfirm('membership', null)}
          >
            <FiCheck />
            {saving && 'Salvando...'}
            {!saving && (editing ? 'Salvar pagamento' : 'Concluir atendimento')}
          </ConfirmButton>
        </PanelActions>
      </>
    );
  }

  if (charging && device) {
    return (
      <TerminalCharge
        appointmentId={appointmentId}
        device={device}
        amountCents={parsed}
        priceCents={priceCents}
        onPaid={onTerminalPaid}
        onBack={() => setCharging(false)}
      />
    );
  }

  return (
    <>
      <SectionTitle>{editing ? 'Alterar pagamento' : 'Pagamento'}</SectionTitle>
      <Hint>
        {included
          ? `Cobrando normalmente: o atendimento sai do ${
              inPackage ? 'pacote' : 'plano'
            }. Como o cliente pagou?`
          : 'Como o cliente pagou?'}
      </Hint>

      <Methods role="radiogroup" aria-label="Forma de pagamento">
        {PAYMENT_METHODS.map(option => {
          const Icon = ICONS[option as keyof typeof ICONS];

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

      {!editing && devices.length > 0 && device && (
        <TerminalRow>
          {devices.length > 1 && (
            <select
              aria-label="Maquininha"
              value={device.id}
              onChange={event => chooseDevice(event.target.value)}
            >
              {devices.map(option => (
                <option key={option.id} value={option.id}>
                  {option.name}
                </option>
              ))}
            </select>
          )}
          <TerminalButton
            type="button"
            disabled={saving || invalid}
            onClick={() => setCharging(true)}
            title={`Envia ${
              parsed !== null ? formatPrice(parsed) : 'o valor'
            } para ${device.name}`}
          >
            <FiCreditCard />
            Cobrar na maquininha
          </TerminalButton>
        </TerminalRow>
      )}

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
