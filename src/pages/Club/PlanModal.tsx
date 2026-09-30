import React, { useCallback, useEffect, useState } from 'react';
import styled from 'styled-components';
import { FiCheck, FiX } from 'react-icons/fi';

import api from '../../services/api';
import getApiErrorMessage from '../../utils/getApiErrorMessage';
import { formatPrice, parsePrice } from '../../utils/money';
import { centsToInput } from '../../utils/payment';
import { UIButton, TextInput, Select } from '../../components/ui';
import WeekdayPicker from '../../components/WeekdayPicker';
import { colors, radius } from '../../styles/theme';
import { Overlay, CloseButton } from '../Dashboard/AppointmentDetails/styles';
import { DialogHeader, Main, Footer } from '../Dashboard/modalLayout';
import {
  CompactDialog,
  ModalSubtitle,
  ModalForm,
  ModalField,
  FieldError,
  FieldRow,
} from '../ManageServices/styles';
import { Plan } from './types';

interface CatalogService {
  id: string;
  name: string;
  price_cents: number;
  active: boolean;
}

interface PlanModalProps {
  // null: novo plano
  plan: Plan | null;
  onClose(): void;
  onSaved(plan: Plan): void;
}

type Field = 'name' | 'price' | 'items' | 'weekdays' | 'form';

const ALL_DAYS = [0, 1, 2, 3, 4, 5, 6];
const INTERVALS = [0, 3, 5, 7, 10, 14, 15, 21, 30];
const DISCOUNTS = [0, 5, 10, 15, 20, 25, 30, 40, 50];
const QUANTITIES = Array.from({ length: 10 }, (_, index) => index + 1);

const Dialog = styled(CompactDialog)`
  max-width: 720px;
  height: min(780px, 100%);
`;

const SectionLabel = styled.span`
  display: block;
  margin-bottom: 8px;
  font-size: 13px;
  font-weight: 500;
  color: ${colors.textMuted};
`;

// Serviços do catálogo: altura fixa com rolagem
const ServiceList = styled.ul`
  list-style: none;
  height: 140px;
  overflow-y: auto;
  border: 1px solid ${colors.border};
  border-radius: ${radius.md};
  background: ${colors.sunken};

  li {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 6px 12px;
    border-bottom: 1px solid ${colors.border};
  }

  label {
    flex: 1;
    display: flex;
    align-items: center;
    gap: 10px;
    min-width: 0;
    font-size: 14px;
    color: ${colors.text};
    cursor: pointer;
  }

  input[type='checkbox'] {
    width: 16px;
    height: 16px;
    accent-color: ${colors.primary};
  }

  small {
    color: ${colors.textSubtle};
    font-size: 12px;
  }

  select {
    width: 150px;
    height: 32px;
    font-size: 13px;
  }
`;

const Check = styled.label`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin-top: 4px;
  font-size: 14px;
  color: ${colors.text};
  cursor: pointer;

  input {
    width: 16px;
    height: 16px;
    accent-color: ${colors.primary};
  }
`;

// Criar ou editar um plano do clube
const PlanModal: React.FC<PlanModalProps> = ({ plan, onClose, onSaved }) => {
  const [services, setServices] = useState<CatalogService[] | null>(null);
  const [name, setName] = useState(plan?.name || '');
  const [price, setPrice] = useState(
    plan ? centsToInput(plan.price_cents) : '',
  );
  const [description, setDescription] = useState(plan?.description || '');
  // service_id -> quantidade por mês (null = ilimitado)
  const [items, setItems] = useState<Map<string, number | null>>(
    () =>
      new Map(
        (plan?.items || []).map(item => [item.service_id, item.quantity]),
      ),
  );
  const [interval, setIntervalDays] = useState(plan?.min_interval_days || 0);
  const [weekdays, setWeekdays] = useState<number[]>(
    plan?.weekdays || ALL_DAYS,
  );
  const [discount, setDiscount] = useState(plan?.discount_percent || 0);
  const [active, setActive] = useState(plan ? plan.active : true);
  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({});
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
      .get<CatalogService[]>('/services/all')
      .then(response =>
        // Desativados só aparecem se já estão no plano
        setServices(
          response.data.filter(
            service => service.active || items.has(service.id),
          ),
        ),
      )
      .catch(() => setServices([]));
    // Só ao abrir
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggleService = (id: string): void => {
    setItems(current => {
      const next = new Map(current);

      if (next.has(id)) {
        next.delete(id);
      } else {
        next.set(id, null);
      }

      return next;
    });
    setErrors({});
  };

  const handleSubmit = useCallback(
    async (event: React.FormEvent) => {
      event.preventDefault();

      const next: Partial<Record<Field, string>> = {};
      const priceCents = parsePrice(price);

      if (!name.trim()) next.name = 'Informe o nome.';
      if (priceCents === null || priceCents < 100) {
        next.price = 'Informe a mensalidade. Ex: 99,00';
      }
      if (items.size === 0) next.items = 'Marque pelo menos um serviço.';
      if (weekdays.length === 0) next.weekdays = 'Marque pelo menos um dia.';

      setErrors(next);

      if (Object.keys(next).length > 0) return;

      setSaving(true);

      const body = {
        name: name.trim(),
        description: description.trim() || null,
        price_cents: priceCents,
        items: Array.from(items.entries()).map(([service_id, quantity]) => ({
          service_id,
          quantity,
        })),
        min_interval_days: interval || null,
        weekdays: weekdays.length === 7 ? null : weekdays,
        discount_percent: discount,
        active,
      };

      try {
        const response = plan
          ? await api.put<Plan>(`/memberships/plans/${plan.id}`, body)
          : await api.post<Plan>('/memberships/plans', body);

        onSaved(response.data);
      } catch (err) {
        setSaving(false);
        setErrors({
          form: getApiErrorMessage(
            err,
            'Não foi possível salvar, tente novamente.',
          ),
        });
      }
    },
    [
      name,
      price,
      description,
      items,
      interval,
      weekdays,
      discount,
      active,
      plan,
      onSaved,
    ],
  );

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
        aria-labelledby="plan-title"
      >
        <DialogHeader>
          <div>
            <h2 id="plan-title">{plan ? 'Editar plano' : 'Novo plano'}</h2>
            <ModalSubtitle>
              {plan
                ? 'Mudanças valem para os próximos agendamentos dos assinantes.'
                : 'Mensalidade, serviços incluídos e as regras de uso.'}
            </ModalSubtitle>
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
            <FieldRow>
              <ModalField hasError={!!errors.name}>
                <span>Nome</span>
                <TextInput
                  value={name}
                  maxLength={60}
                  autoFocus
                  placeholder="Ex: Corte ilimitado"
                  onChange={event => {
                    setName(event.target.value);
                    setErrors({});
                  }}
                />
                <FieldError>{errors.name}</FieldError>
              </ModalField>

              <ModalField hasError={!!errors.price}>
                <span>Mensalidade (R$)</span>
                <TextInput
                  value={price}
                  inputMode="decimal"
                  placeholder="99,00"
                  onChange={event => {
                    setPrice(event.target.value);
                    setErrors({});
                  }}
                />
                <FieldError>{errors.price}</FieldError>
              </ModalField>
            </FieldRow>

            <ModalField hasError={false}>
              <span>Descrição (opcional, aparece no site)</span>
              <TextInput
                value={description}
                maxLength={300}
                placeholder="Ex: Corte sempre em dia, sem pagar a cada visita."
                onChange={event => setDescription(event.target.value)}
              />
              <FieldError />
            </ModalField>

            <SectionLabel>Serviços incluídos</SectionLabel>
            <ServiceList aria-label="Serviços incluídos">
              {!services && (
                <li>
                  <small>Carregando serviços...</small>
                </li>
              )}
              {(services || []).map(service => {
                const checked = items.has(service.id);

                return (
                  <li key={service.id}>
                    <label htmlFor={`plan-service-${service.id}`}>
                      <input
                        id={`plan-service-${service.id}`}
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleService(service.id)}
                      />
                      {service.name}
                      <small>{formatPrice(service.price_cents)}</small>
                    </label>
                    <Select
                      aria-label={`Quantidade de ${service.name} por mês`}
                      disabled={!checked}
                      value={checked ? String(items.get(service.id) ?? '') : ''}
                      onChange={event => {
                        const { value } = event.target;

                        setItems(current =>
                          new Map(current).set(
                            service.id,
                            value ? Number(value) : null,
                          ),
                        );
                      }}
                    >
                      <option value="">Ilimitado</option>
                      {QUANTITIES.map(quantity => (
                        <option key={quantity} value={quantity}>
                          {`${quantity}× por mês`}
                        </option>
                      ))}
                    </Select>
                  </li>
                );
              })}
            </ServiceList>
            <FieldError style={{ display: 'block', marginBottom: 12 }}>
              {errors.items}
            </FieldError>

            <FieldRow>
              <ModalField hasError={false}>
                <span>Intervalo mínimo entre usos</span>
                <Select
                  value={interval}
                  onChange={event =>
                    setIntervalDays(Number(event.target.value))
                  }
                >
                  {INTERVALS.map(days => (
                    <option key={days} value={days}>
                      {days === 0 ? 'Sem mínimo' : `${days} dias`}
                    </option>
                  ))}
                </Select>
                <FieldError />
              </ModalField>

              <ModalField hasError={false}>
                <span>Desconto nos outros serviços</span>
                <Select
                  value={discount}
                  onChange={event => setDiscount(Number(event.target.value))}
                >
                  {DISCOUNTS.map(percent => (
                    <option key={percent} value={percent}>
                      {percent === 0 ? 'Sem desconto' : `${percent}%`}
                    </option>
                  ))}
                </Select>
                <FieldError />
              </ModalField>
            </FieldRow>

            <SectionLabel>Dias em que o plano vale</SectionLabel>
            <WeekdayPicker
              selected={weekdays}
              onToggle={day => {
                setWeekdays(current =>
                  current.includes(day)
                    ? current.filter(item => item !== day)
                    : [...current, day].sort(),
                );
                setErrors({});
              }}
            />
            <FieldError style={{ display: 'block', marginTop: 6 }}>
              {errors.weekdays}
            </FieldError>

            {plan && (
              <Check htmlFor="plan-active">
                <input
                  id="plan-active"
                  type="checkbox"
                  checked={active}
                  onChange={event => setActive(event.target.checked)}
                />
                Aceita novas assinaturas (aparece no site)
              </Check>
            )}

            <FieldError role="alert" style={{ display: 'block', marginTop: 8 }}>
              {errors.form}
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
              {saving && 'Salvando...'}
              {!saving && (plan ? 'Salvar plano' : 'Criar plano')}
            </UIButton>
          </Footer>
        </ModalForm>
      </Dialog>
    </Overlay>
  );
};

export default PlanModal;
