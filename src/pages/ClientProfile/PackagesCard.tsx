import React, { useCallback, useEffect, useState } from 'react';
import styled from 'styled-components';
import { format, parseISO } from 'date-fns';
import { FiCheck, FiPackage, FiX } from 'react-icons/fi';

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
import { colors, radius } from '../../styles/theme';
import {
  Card,
  CardHeader,
  CardBody,
  UIButton,
  TextInput,
  Select,
} from '../../components/ui';
import { SkeletonBar } from '../ManageServices/styles';
import {
  CompactDialog,
  ModalSubtitle,
  ModalForm,
  FieldRow,
  ModalField,
  FieldError,
} from '../ManageServices/styles';
import { Overlay, CloseButton } from '../Dashboard/AppointmentDetails/styles';
import { DialogHeader, Main, Footer } from '../Dashboard/modalLayout';
import { Methods, Method, SectionLabel } from '../Club/MembershipPaymentModal';

export interface SessionPackage {
  id: string;
  service_id: string;
  service_name: string;
  sessions: number;
  used: number;
  remaining: number;
  price_cents: number;
  payment_method: PaymentMethod;
  paid_at: string;
  canceled_at: string | null;
  state: 'active' | 'used_up' | 'canceled';
}

interface ServiceOption {
  id: string;
  name: string;
  price_cents: number;
}

interface PackagesCardProps {
  clientId: string;
  clientName: string;
}

// Altura reservada: o conteúdo carrega sem empurrar a página
const Body = styled(CardBody)`
  min-height: 150px;
`;

const List = styled.ul`
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 14px;

  li > div {
    display: flex;
    align-items: baseline;
    gap: 8px;
    font-size: 14px;
    color: ${colors.text};
  }

  li > div small {
    margin-left: auto;
    font-size: 13px;
    color: ${colors.textMuted};
    font-variant-numeric: tabular-nums;
  }

  li > p {
    margin-top: 4px;
    font-size: 12px;
    color: ${colors.textMuted};
  }

  li > p button {
    border: 0;
    background: none;
    padding: 0;
    font: inherit;
    color: ${colors.danger};
    cursor: pointer;
  }
`;

const Bar = styled.span<{ percent: number }>`
  display: block;
  height: 6px;
  margin-top: 6px;
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

const Empty = styled.p`
  font-size: 13px;
  color: ${colors.textMuted};
`;

const Actions = styled.div`
  margin-top: 16px;
`;

const Dialog = styled(CompactDialog)`
  height: min(500px, 100%);
`;

const Note = styled.p`
  min-height: 40px;
  padding: 10px 12px;
  border-radius: ${radius.md};
  background: ${colors.surfaceHover};
  font-size: 13px;
  color: ${colors.textMuted};
`;

interface SellModalProps {
  clientId: string;
  clientName: string;
  onClose(): void;
  onSaved(item: SessionPackage): void;
}

// Venda de um pacote (o valor entra no caixa de hoje)
const SellPackageModal: React.FC<SellModalProps> = ({
  clientId,
  clientName,
  onClose,
  onSaved,
}) => {
  const [services, setServices] = useState<ServiceOption[] | null>(null);
  const [serviceId, setServiceId] = useState('');
  const [sessions, setSessions] = useState('10');
  const [price, setPrice] = useState('');
  const [method, setMethod] = useState<PaymentMethod | null>(null);
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
    api
      .get<ServiceOption[]>('/services')
      .then(response => {
        setServices(response.data);

        if (response.data[0]) {
          setServiceId(response.data[0].id);
          setPrice(centsToInput(response.data[0].price_cents * 10));
        }
      })
      .catch(() => setServices([]));
  }, []);

  const service = services?.find(item => item.id === serviceId);
  const count = Number(sessions);
  const priceCents = price.trim() ? parsePrice(price) : null;
  const full = service && count > 0 ? service.price_cents * count : null;

  // Sugere o valor cheio ao trocar o serviço ou as sessões
  const suggest = (
    option: ServiceOption | undefined,
    quantity: number,
  ): void => {
    if (option && quantity > 0) {
      setPrice(centsToInput(option.price_cents * quantity));
    }
  };

  const submit = async (event: React.FormEvent): Promise<void> => {
    event.preventDefault();

    if (!serviceId) {
      setError('Escolha o serviço.');
      return;
    }

    if (!Number.isInteger(count) || count < 1 || count > 100) {
      setError('Informe de 1 a 100 sessões.');
      return;
    }

    if (priceCents === null) {
      setError('Valor inválido. Ex: 900,00');
      return;
    }

    if (!method) {
      setError('Escolha a forma de pagamento.');
      return;
    }

    setSaving(true);
    setError('');

    try {
      const response = await api.post<SessionPackage>('/packages', {
        client_id: clientId,
        service_id: serviceId,
        sessions: count,
        price_cents: priceCents,
        payment_method: method,
      });

      onSaved(response.data);
    } catch (err) {
      setSaving(false);
      setError(getApiErrorMessage(err, 'Não foi possível salvar.'));
    }
  };

  let note = 'Os próximos agendamentos desse serviço ficam inclusos.';

  if (full && priceCents !== null && priceCents < full) {
    note = `Desconto de ${formatPrice(full - priceCents)} sobre ${formatPrice(
      full,
    )} (${count} × ${formatPrice(service?.price_cents || 0)}). ${note}`;
  }

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
        aria-labelledby="sell-package-title"
      >
        <DialogHeader>
          <div>
            <h2 id="sell-package-title">Vender pacote</h2>
            <ModalSubtitle>{clientName}</ModalSubtitle>
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

        <ModalForm onSubmit={submit} noValidate>
          <Main>
            <ModalField hasError={false}>
              <span>Serviço</span>
              <Select
                value={serviceId}
                disabled={!services || services.length === 0}
                onChange={event => {
                  setServiceId(event.target.value);
                  suggest(
                    services?.find(item => item.id === event.target.value),
                    count,
                  );
                }}
              >
                {!services && <option value="">Carregando...</option>}
                {(services || []).map(item => (
                  <option key={item.id} value={item.id}>
                    {`${item.name} · ${formatPrice(item.price_cents)}`}
                  </option>
                ))}
              </Select>
              <FieldError />
            </ModalField>

            <FieldRow>
              <ModalField hasError={false}>
                <span>Sessões</span>
                <TextInput
                  type="number"
                  min={1}
                  max={100}
                  value={sessions}
                  onChange={event => {
                    setSessions(event.target.value);
                    suggest(service, Number(event.target.value));
                  }}
                />
                <FieldError />
              </ModalField>
              <ModalField hasError={false}>
                <span>Valor do pacote (R$)</span>
                <TextInput
                  value={price}
                  inputMode="decimal"
                  onChange={event => setPrice(event.target.value)}
                />
                <FieldError />
              </ModalField>
            </FieldRow>

            <SectionLabel>Como o cliente pagou?</SectionLabel>
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

            <Note>{`${note} Entra no caixa de hoje.`}</Note>
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
              {saving ? 'Salvando...' : 'Registrar venda'}
            </UIButton>
          </Footer>
        </ModalForm>
      </Dialog>
    </Overlay>
  );
};

// Pacotes de sessões na ficha do cliente: saldo, venda e cancelamento
const PackagesCard: React.FC<PackagesCardProps> = ({
  clientId,
  clientName,
}) => {
  const { addToast } = useToast();
  // undefined: carregando
  const [packages, setPackages] = useState<SessionPackage[] | undefined>();
  const [selling, setSelling] = useState(false);

  const load = useCallback(() => {
    api
      .get<SessionPackage[]>('/packages', { params: { client_id: clientId } })
      .then(response => setPackages(response.data))
      .catch(() => setPackages([]));
  }, [clientId]);

  useEffect(() => {
    load();
  }, [load]);

  const cancel = async (item: SessionPackage): Promise<void> => {
    if (
      // eslint-disable-next-line no-alert
      !window.confirm(
        `Cancelar o pacote de ${item.service_name}? Os horários marcados e ainda não feitos voltam ao preço normal. O valor pago não é estornado pelo sistema.`,
      )
    ) {
      return;
    }

    try {
      await api.post(`/packages/${item.id}/cancel`);
      addToast({ type: 'success', title: 'Pacote cancelado' });
      load();
    } catch (err) {
      addToast({
        type: 'error',
        title: 'Não foi possível',
        description: getApiErrorMessage(err, 'Tente novamente.'),
      });
    }
  };

  // Ativos e os que acabaram (os cancelados ficam de fora)
  const visible = (packages || []).filter(item => item.state !== 'canceled');
  const active = visible.filter(item => item.state === 'active').length;

  return (
    <Card>
      <CardHeader>
        <div>
          <h2>Pacotes</h2>
          <p>
            {active > 0
              ? `${active} ${active === 1 ? 'pacote ativo' : 'pacotes ativos'}`
              : 'Sessões compradas antes'}
          </p>
        </div>
      </CardHeader>
      <Body>
        {packages === undefined && <SkeletonBar width={180} />}
        {packages && visible.length === 0 && (
          <Empty>Nenhum pacote comprado.</Empty>
        )}
        {visible.length > 0 && (
          <List>
            {visible.slice(0, 4).map(item => (
              <li key={item.id}>
                <div>
                  {item.service_name}
                  <small>
                    {item.state === 'used_up'
                      ? 'Usado'
                      : `${item.used} de ${item.sessions}`}
                  </small>
                </div>
                <Bar
                  percent={Math.min(100, (item.used / item.sessions) * 100)}
                />
                <p>
                  {`${formatPrice(item.price_cents)} no ${PAYMENT_LABELS[
                    item.payment_method
                  ].toLowerCase()} em ${format(
                    parseISO(item.paid_at),
                    'dd/MM/yy',
                  )}`}
                  {item.state === 'active' && (
                    <>
                      {' · '}
                      <button type="button" onClick={() => cancel(item)}>
                        cancelar
                      </button>
                    </>
                  )}
                </p>
              </li>
            ))}
          </List>
        )}
        <Actions>
          <UIButton
            type="button"
            size="sm"
            variant="secondary"
            onClick={() => setSelling(true)}
          >
            <FiPackage />
            Vender pacote
          </UIButton>
        </Actions>
      </Body>

      {selling && (
        <SellPackageModal
          clientId={clientId}
          clientName={clientName}
          onClose={() => setSelling(false)}
          onSaved={item => {
            setSelling(false);
            addToast({
              type: 'success',
              title: 'Pacote vendido',
              description: `${item.sessions} sessões de ${item.service_name}`,
            });
            load();
          }}
        />
      )}
    </Card>
  );
};

export default PackagesCard;
