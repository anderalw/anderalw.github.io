import React, { useCallback, useEffect, useState } from 'react';
import styled from 'styled-components';
import { FiCheck, FiX } from 'react-icons/fi';

import api from '../../services/api';
import { useToast } from '../../hooks/Toast';
import getApiErrorMessage from '../../utils/getApiErrorMessage';
import { maskPhone, onlyDigits } from '../../utils/phone';

import { UIButton, TextInput } from '../../components/ui';
import { colors } from '../../styles/theme';
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
import { ClientDetails } from '../Clients/types';
import ProfileExtraFields from '../../components/ProfileExtraFields';
import {
  ExtraValues,
  extraPayload,
  toAddress,
  useProfileFields,
} from '../../utils/profileFields';
import { useVocabulary } from '../../hooks/Vocabulary';

interface EditClientModalProps {
  client: ClientDetails;
  onClose(): void;
  onSaved(client: ClientDetails): void;
}

type Field = 'name' | 'phone' | 'email' | 'form';

// Mais alto quando a barbearia pede CPF, nascimento ou endereço
const EditDialog = styled(CompactDialog)<{ tall: boolean }>`
  max-width: ${props => (props.tall ? '600px' : undefined)};
  height: min(${props => (props.tall ? '780px' : '400px')}, 100%);
`;

// Corrigir nome, telefone e e-mail do cliente
const EditClientModal: React.FC<EditClientModalProps> = ({
  client,
  onClose,
  onSaved,
}) => {
  const terms = useVocabulary();
  const { addToast } = useToast();

  const [name, setName] = useState(client.name);
  const [phone, setPhone] = useState(maskPhone(client.phone));
  const [email, setEmail] = useState(client.email || '');
  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({});
  const [saving, setSaving] = useState(false);
  const rules = useProfileFields('client_counter');
  const [extras, setExtras] = useState<ExtraValues>({
    cpf: client.cpf || '',
    birth_date: client.birth_date?.slice(0, 10) || '',
    address: toAddress(client.address),
  });
  const tall =
    !!rules &&
    ['cpf', 'birth_date', 'address'].some(field => rules[field as 'cpf']?.show);
  const showEmail = rules?.email?.show !== false;

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

      const next: Partial<Record<Field, string>> = {};

      if (!name.trim()) next.name = 'Informe o nome.';
      if (onlyDigits(phone).length < 10) {
        next.phone = 'Informe o telefone com DDD.';
      }
      if (email.trim() && !/^\S+@\S+\.\S+$/.test(email.trim())) {
        next.email = 'E-mail inválido.';
      }
      if (!email.trim() && client.has_account) {
        next.email = 'Este cliente entra no site com o e-mail.';
      }

      setErrors(next);

      if (Object.keys(next).length > 0) return;

      setSaving(true);

      try {
        const response = await api.put<ClientDetails>(`/clients/${client.id}`, {
          name: name.trim(),
          phone: onlyDigits(phone),
          ...(showEmail && { email: email.trim() || null }),
          notes: client.notes,
          ...extraPayload(rules, extras),
        });

        addToast({
          type: 'success',
          title: 'Dados atualizados',
          description: response.data.name,
        });

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
    [name, phone, email, showEmail, rules, extras, client, addToast, onSaved],
  );

  return (
    <Overlay
      onMouseDown={event => {
        if (event.target === event.currentTarget && !saving) onClose();
      }}
    >
      <EditDialog
        tall={tall}
        color={colors.primary}
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-client-title"
      >
        <DialogHeader>
          <div>
            <h2 id="edit-client-title">Editar dados</h2>
            <ModalSubtitle>
              {client.has_account
                ? 'O cliente tem conta no site e entra com este e-mail.'
                : `Cadastrado ${terms.byPlace} (sem conta no site).`}
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
                maxLength={100}
                autoFocus
                aria-invalid={!!errors.name}
                onChange={event => {
                  setName(event.target.value);
                  setErrors({});
                }}
              />
              <FieldError>{errors.name}</FieldError>
            </ModalField>

            <FieldRow>
              <ModalField hasError={!!errors.phone}>
                <span>Telefone</span>
                <TextInput
                  value={phone}
                  inputMode="tel"
                  placeholder="(11) 99999-0000"
                  aria-invalid={!!errors.phone}
                  onChange={event => {
                    setPhone(maskPhone(event.target.value));
                    setErrors({});
                  }}
                />
                <FieldError>{errors.phone}</FieldError>
              </ModalField>

              {showEmail && (
                <ModalField hasError={!!errors.email}>
                  <span>
                    E-mail{' '}
                    {!client.has_account &&
                      !rules?.email?.required &&
                      '(opcional)'}
                  </span>
                  <TextInput
                    type="email"
                    value={email}
                    maxLength={100}
                    aria-invalid={!!errors.email}
                    onChange={event => {
                      setEmail(event.target.value);
                      setErrors({});
                    }}
                  />
                  <FieldError>{errors.email}</FieldError>
                </ModalField>
              )}
            </FieldRow>

            <ProfileExtraFields
              rules={rules}
              values={extras}
              onChange={values => {
                setExtras(values);
                setErrors({});
              }}
            />

            <FieldError role="alert">{errors.form}</FieldError>
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
              {saving ? 'Salvando...' : 'Salvar alterações'}
            </UIButton>
          </Footer>
        </ModalForm>
      </EditDialog>
    </Overlay>
  );
};

export default EditClientModal;
