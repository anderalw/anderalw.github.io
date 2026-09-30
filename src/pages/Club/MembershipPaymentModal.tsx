import React, { useCallback, useEffect, useMemo, useState } from 'react';
import styled, { css } from 'styled-components';
import { addDays, addMonths, format, parseISO } from 'date-fns';
import { FiCheck, FiX } from 'react-icons/fi';

import api from '../../services/api';
import getApiErrorMessage from '../../utils/getApiErrorMessage';
import { formatPrice, parsePrice } from '../../utils/money';
import {
  PaymentMethod,
  PAYMENT_METHODS,
  PAYMENT_LABELS,
  centsToInput,
} from '../../utils/payment';
import { UIButton, TextInput, Select } from '../../components/ui';
import { colors, radius } from '../../styles/theme';
import { Overlay, CloseButton } from '../Dashboard/AppointmentDetails/styles';
import { DialogHeader, Main, Footer } from '../Dashboard/modalLayout';
import {
  CompactDialog,
  ModalSubtitle,
  ModalForm,
  ModalField,
  FieldError,
} from '../ManageServices/styles';
import { MembershipDetails, MembershipView, Plan } from './types';

// subscribe: assinar na barbearia; confirm: pedido do site; renew: mensalidade
export type PaymentMode = 'subscribe' | 'confirm' | 'renew';

interface MembershipPaymentModalProps {
  mode: PaymentMode;
  clientName: string;
  // Assinar: o cliente; confirmar e renovar: a assinatura
  clientId?: string;
  membership?: MembershipView;
  onClose(): void;
  onSaved(details: MembershipDetails): void;
}

const TITLES: Record<PaymentMode, string> = {
  subscribe: 'Assinar plano',
  confirm: 'Confirmar assinatura',
  renew: 'Registrar mensalidade',
};

const Dialog = styled(CompactDialog)`
  height: min(500px, 100%);
`;

const Methods = styled.div`
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 8px;
  margin-bottom: 18px;
`;

const Method = styled.button<{ selected: boolean }>`
  height: 42px;
  border: 1px solid ${colors.borderStrong};
  border-radius: ${radius.md};
  background: ${colors.sunken};
  color: ${colors.text};
  font: inherit;
  font-size: 14px;
  font-weight: 500;

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
    `}
`;

const SectionLabel = styled.span`
  display: block;
  margin-bottom: 8px;
  font-size: 13px;
  font-weight: 500;
  color: ${colors.textMuted};
`;

// Mês que o pagamento cobre (espaço reservado)
const Period = styled.p`
  min-height: 40px;
  padding: 10px 12px;
  border-radius: ${radius.md};
  background: ${colors.surfaceHover};
  font-size: 13px;
  color: ${colors.textMuted};

  strong {
    color: ${colors.text};
  }
`;

// Assinar, confirmar o pedido do site ou registrar a mensalidade (vai para
// o caixa do dia)
const MembershipPaymentModal: React.FC<MembershipPaymentModalProps> = ({
  mode,
  clientName,
  clientId,
  membership,
  onClose,
  onSaved,
}) => {
  const [plans, setPlans] = useState<Plan[] | null>(null);
  const [planId, setPlanId] = useState(membership?.plan.id || '');
  const [method, setMethod] = useState<PaymentMethod | null>(null);
  const [amount, setAmount] = useState(
    membership ? centsToInput(membership.plan.price_cents) : '',
  );
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent): void {
      if (event.key === 'Escape' && !saving) onClose();
    }

    window.addEventListener('keydown', handleKeyDown);

    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, saving]);

  useEffect(() => {
    if (mode !== 'subscribe') return;

    api
      .get<Plan[]>('/memberships/plans')
      .then(response => {
        const active = response.data.filter(plan => plan.active);

        setPlans(active);

        if (active[0]) {
          setPlanId(active[0].id);
          setAmount(centsToInput(active[0].price_cents));
        }
      })
      .catch(() => setPlans([]));
  }, [mode]);

  // De quando a quando este pagamento cobre (igual à regra da API)
  const period = useMemo(() => {
    const today = new Date();
    const start =
      mode === 'renew' &&
      membership?.paid_until &&
      membership.state !== 'overdue'
        ? parseISO(membership.paid_until)
        : today;

    return {
      start: format(start, 'dd/MM/yyyy'),
      last: format(addDays(addMonths(start, 1), -1), 'dd/MM/yyyy'),
    };
  }, [mode, membership]);

  const parsed = amount.trim() ? parsePrice(amount) : null;

  const handleSubmit = useCallback(
    async (event: React.FormEvent) => {
      event.preventDefault();

      if (mode === 'subscribe' && !planId) {
        setError('Escolha o plano.');
        return;
      }

      if (!method) {
        setError('Escolha a forma de pagamento.');
        return;
      }

      if (amount.trim() && parsed === null) {
        setError('Valor inválido. Ex: 99,00');
        return;
      }

      setSaving(true);
      setError('');

      const payment = { payment_method: method, amount_cents: parsed };

      try {
        let response;

        if (mode === 'subscribe') {
          response = await api.post<MembershipDetails>('/memberships', {
            client_id: clientId,
            plan_id: planId,
            ...payment,
          });
        } else {
          response = await api.post<MembershipDetails>(
            `/memberships/${membership?.id}/${
              mode === 'confirm' ? 'confirm' : 'payments'
            }`,
            payment,
          );
        }

        onSaved(response.data);
      } catch (err) {
        setSaving(false);
        setError(
          getApiErrorMessage(err, 'Não foi possível salvar, tente novamente.'),
        );
      }
    },
    [mode, planId, method, amount, parsed, clientId, membership, onSaved],
  );

  const subtitle =
    mode === 'subscribe'
      ? clientName
      : `${clientName} · ${membership?.plan.name} · ${formatPrice(
          membership?.plan.price_cents || 0,
        )}/mês`;

  return (
    <Overlay
      onMouseDown={event => {
        if (event.target === event.currentTarget && !saving) onClose();
      }}
    >
      <Dialog
        color={colors.primary}
        role="dialog"
        aria-modal="true"
        aria-labelledby="membership-payment-title"
      >
        <DialogHeader>
          <div>
            <h2 id="membership-payment-title">{TITLES[mode]}</h2>
            <ModalSubtitle>{subtitle}</ModalSubtitle>
          </div>
          <CloseButton
            type="button"
            aria-label="Fechar"
            title="Fechar (Esc)"
            onClick={onClose}
          >
            <FiX />
          </CloseButton>
        </DialogHeader>

        <ModalForm onSubmit={handleSubmit} noValidate>
          <Main>
            {mode === 'subscribe' && (
              <ModalField hasError={false}>
                <span>Plano</span>
                <Select
                  value={planId}
                  disabled={!plans || plans.length === 0}
                  onChange={event => {
                    const plan = plans?.find(
                      item => item.id === event.target.value,
                    );

                    setPlanId(event.target.value);
                    if (plan) setAmount(centsToInput(plan.price_cents));
                  }}
                >
                  {!plans && <option value="">Carregando planos...</option>}
                  {plans && plans.length === 0 && (
                    <option value="">Nenhum plano ativo</option>
                  )}
                  {(plans || []).map(plan => (
                    <option key={plan.id} value={plan.id}>
                      {`${plan.name} · ${formatPrice(plan.price_cents)}/mês`}
                    </option>
                  ))}
                </Select>
                <FieldError />
              </ModalField>
            )}

            <SectionLabel>
              {mode === 'confirm'
                ? 'Primeira mensalidade: como o cliente pagou?'
                : 'Como o cliente pagou?'}
            </SectionLabel>
            <Methods role="radiogroup" aria-label="Forma de pagamento">
              {PAYMENT_METHODS.map(option => (
                <Method
                  key={option}
                  type="button"
                  role="radio"
                  aria-checked={method === option}
                  selected={method === option}
                  onClick={() => {
                    setMethod(option);
                    setError('');
                  }}
                >
                  {PAYMENT_LABELS[option]}
                </Method>
              ))}
            </Methods>

            <ModalField hasError={false}>
              <span>Valor recebido</span>
              <TextInput
                value={amount}
                inputMode="decimal"
                style={{ maxWidth: 180 }}
                onChange={event => {
                  setAmount(event.target.value);
                  setError('');
                }}
              />
              <FieldError />
            </ModalField>

            <Period>
              Cobre de <strong>{period.start}</strong> a{' '}
              <strong>{period.last}</strong>. Entra no caixa de hoje.
            </Period>

            <FieldError role="alert" style={{ display: 'block', marginTop: 8 }}>
              {error}
            </FieldError>
          </Main>

          <Footer>
            <UIButton
              type="button"
              variant="secondary"
              onClick={onClose}
              disabled={saving}
            >
              Cancelar
            </UIButton>
            <UIButton type="submit" disabled={saving}>
              <FiCheck />
              {saving ? 'Salvando...' : 'Registrar pagamento'}
            </UIButton>
          </Footer>
        </ModalForm>
      </Dialog>
    </Overlay>
  );
};

export default MembershipPaymentModal;
