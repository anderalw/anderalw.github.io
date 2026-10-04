import React, { useCallback, useEffect, useState } from 'react';
import { FiCheck, FiX } from 'react-icons/fi';

import api from '../../services/api';
import { useToast } from '../../hooks/Toast';
import getApiErrorMessage from '../../utils/getApiErrorMessage';
import { formatPrice, parsePrice } from '../../utils/money';
import { formatDuration } from '../../utils/duration';

import { UIButton, TextInput } from '../../components/ui';
import { colors } from '../../styles/theme';
import { Overlay, CloseButton } from '../Dashboard/AppointmentDetails/styles';
import { DialogHeader, Main, Footer } from '../Dashboard/modalLayout';

import {
  CompactDialog,
  ModalSubtitle,
  ModalForm,
  FieldRow,
  ModalField,
  FieldError,
  Hint,
} from './styles';
import { useFeatures, useSegmentExamples } from '../../hooks/Vocabulary';

export interface Service {
  id: string;
  name: string;
  duration_minutes: number;
  price_cents: number;
  // Sinal para garantir o horário (null = sem sinal)
  deposit_cents?: number | null;
  active: boolean;
}

interface ServiceModalProps {
  // null = novo serviço
  service: Service | null;
  onClose(): void;
  onSaved(): void;
}

interface FormErrors {
  name?: string;
  duration?: string;
  price?: string;
  deposit?: string;
}

// Modal para cadastrar ou editar um serviço: nome, duração e valor, com
// tamanho fixo e os erros de cada campo embaixo dele
const ServiceModal: React.FC<ServiceModalProps> = ({
  service,
  onClose,
  onSaved,
}) => {
  const examples = useSegmentExamples();
  const features = useFeatures();
  const { addToast } = useToast();
  const isNew = !service;

  const [name, setName] = useState(service?.name || '');
  const [duration, setDuration] = useState(
    String(service?.duration_minutes || 30),
  );
  const [price, setPrice] = useState(
    service ? (service.price_cents / 100).toFixed(2).replace('.', ',') : '',
  );
  const [deposit, setDeposit] = useState(
    service?.deposit_cents
      ? (service.deposit_cents / 100).toFixed(2).replace('.', ',')
      : '',
  );
  const [errors, setErrors] = useState<FormErrors>({});
  const [saving, setSaving] = useState(false);

  // Esc fecha o modal (a não ser no meio do salvamento)
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent): void {
      if (event.key === 'Escape' && !saving) onClose();
    }

    window.addEventListener('keydown', handleKeyDown);

    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, saving]);

  const handleSubmit = useCallback(
    async (event: React.FormEvent) => {
      event.preventDefault();

      const cleanName = name.trim();
      const minutes = Number(duration);
      const priceCents = parsePrice(price);
      const found: FormErrors = {};

      if (!cleanName) {
        found.name = 'Informe o nome do serviço.';
      }

      if (
        !Number.isInteger(minutes) ||
        minutes < 5 ||
        minutes > 480 ||
        minutes % 5 !== 0
      ) {
        found.duration = 'De 5 a 480 minutos, em múltiplos de 5.';
      }

      if (priceCents === null) {
        found.price = 'Use o formato 45,00.';
      }

      // Em branco = sem sinal
      const depositCents = deposit.trim() ? parsePrice(deposit) : null;

      if (features.deposit && deposit.trim()) {
        if (depositCents === null) {
          found.deposit = 'Use o formato 50,00.';
        } else if (priceCents !== null && depositCents > priceCents) {
          found.deposit = 'O sinal não pode passar do valor.';
        }
      }

      setErrors(found);

      if (Object.keys(found).length > 0 || priceCents === null) return;

      const data = {
        name: cleanName,
        duration_minutes: minutes,
        price_cents: priceCents,
        ...(features.deposit && { deposit_cents: depositCents || null }),
      };

      setSaving(true);

      try {
        if (service) {
          await api.put(`/services/${service.id}`, {
            ...data,
            active: service.active,
          });
        } else {
          await api.post('/services', data);
        }

        addToast({
          type: 'success',
          title: isNew ? 'Serviço adicionado' : 'Serviço atualizado',
          description: `${cleanName} · ${formatDuration(
            minutes,
          )} · ${formatPrice(priceCents)}`,
        });

        onSaved();
      } catch (err) {
        setSaving(false);
        addToast({
          type: 'error',
          title: 'Não foi possível salvar',
          description: getApiErrorMessage(
            err,
            'Verifique os dados do serviço e tente novamente.',
          ),
        });
      }
    },
    [
      name,
      duration,
      price,
      deposit,
      features.deposit,
      service,
      isNew,
      addToast,
      onSaved,
    ],
  );

  return (
    <Overlay
      onMouseDown={event => {
        if (event.target === event.currentTarget && !saving) onClose();
      }}
    >
      <CompactDialog
        color={colors.primary}
        style={features.deposit ? { height: 'min(500px, 100%)' } : undefined}
        role="dialog"
        aria-modal="true"
        aria-labelledby="service-modal-title"
      >
        <DialogHeader>
          <div>
            <h2 id="service-modal-title">
              {isNew ? 'Novo serviço' : `Editar ${service?.name}`}
            </h2>
            <ModalSubtitle>
              A duração define quanto tempo o agendamento ocupa na agenda.
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
            <ModalField hasError={!!errors.name}>
              <span>Nome</span>
              <TextInput
                value={name}
                onChange={event => setName(event.target.value)}
                placeholder={`Ex: ${examples.service}`}
                maxLength={60}
                autoFocus
                aria-invalid={!!errors.name}
              />
              <FieldError>{errors.name}</FieldError>
            </ModalField>

            <FieldRow>
              <ModalField hasError={!!errors.duration}>
                <span>Duração (min)</span>
                <TextInput
                  type="number"
                  min={5}
                  max={480}
                  step={5}
                  value={duration}
                  onChange={event => setDuration(event.target.value)}
                  aria-invalid={!!errors.duration}
                />
                <FieldError>{errors.duration}</FieldError>
              </ModalField>

              <ModalField hasError={!!errors.price}>
                <span>Valor (R$)</span>
                <TextInput
                  value={price}
                  onChange={event => setPrice(event.target.value)}
                  placeholder="45,00"
                  inputMode="decimal"
                  aria-invalid={!!errors.price}
                />
                <FieldError>{errors.price}</FieldError>
              </ModalField>
            </FieldRow>

            {features.deposit && (
              <FieldRow>
                <ModalField hasError={!!errors.deposit}>
                  <span>Sinal (R$)</span>
                  <TextInput
                    value={deposit}
                    onChange={event => setDeposit(event.target.value)}
                    placeholder="Sem sinal"
                    inputMode="decimal"
                    aria-invalid={!!errors.deposit}
                  />
                  <FieldError>{errors.deposit}</FieldError>
                </ModalField>
                <Hint style={{ alignSelf: 'center' }}>
                  Pago antes para garantir o horário. Em branco, sem sinal.
                </Hint>
              </FieldRow>
            )}

            {!isNew && (
              <Hint>Mudanças não alteram agendamentos já feitos.</Hint>
            )}
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
              {!saving && (isNew ? 'Adicionar serviço' : 'Salvar alterações')}
            </UIButton>
          </Footer>
        </ModalForm>
      </CompactDialog>
    </Overlay>
  );
};

export default ServiceModal;
