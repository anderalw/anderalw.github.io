import React, { useCallback, useState } from 'react';
import { useHistory } from 'react-router-dom';
import styled from 'styled-components';

import api from '../../services/api';
import { useAuth } from '../../hooks/Auth';
import { useToast } from '../../hooks/Toast';
import getApiErrorMessage from '../../utils/getApiErrorMessage';
import { maskPhone, onlyDigits } from '../../utils/phone';
import { colors } from '../../styles/theme';

import AuthLayout from '../../components/AuthLayout';
import { UIButton, TextInput } from '../../components/ui';
import ProfileExtraFields from '../../components/ProfileExtraFields';
import {
  ExtraValues,
  extraPayload,
  useProfileFields,
} from '../../utils/profileFields';

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 16px;

  label span {
    display: block;
    margin-bottom: 6px;
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

const FieldLabel = styled.label``;

// Depois do primeiro login com Google: confirma o nome e pede o telefone
// (a barbearia precisa dele para falar com o cliente)
const CompleteProfile: React.FC = () => {
  const { client, updateClient, signOut } = useAuth();
  const { addToast } = useToast();
  const history = useHistory();

  const [name, setName] = useState(client?.name || '');
  const [phone, setPhone] = useState(
    client?.phone ? maskPhone(client.phone) : '',
  );
  const [error, setError] = useState('');
  const rules = useProfileFields('client_site');
  const [extras, setExtras] = useState<ExtraValues>({});
  const asksMore = !!rules && Object.values(rules).some(rule => rule?.show);
  const [saving, setSaving] = useState(false);

  const handleSubmit = useCallback(
    async (event: React.FormEvent) => {
      event.preventDefault();

      if (name.trim().length < 2) {
        setError('Informe o seu nome.');
        return;
      }

      if (onlyDigits(phone).length < 10) {
        setError('Informe o telefone com DDD.');
        return;
      }

      setSaving(true);

      try {
        const response = await api.put('/clients/me', {
          name: name.trim(),
          phone: onlyDigits(phone),
          ...extraPayload(rules, extras),
        });

        updateClient(response.data);
        addToast({
          type: 'success',
          title: 'Cadastro completo',
          description: 'Agora é só escolher o horário.',
        });
        history.push('/agendar');
      } catch (err) {
        setError(getApiErrorMessage(err, 'Não foi possível salvar.'));
        setSaving(false);
      }
    },
    [name, phone, rules, extras, updateClient, addToast, history],
  );

  return (
    <AuthLayout
      title={asksMore ? 'Complete o seu cadastro' : 'Falta só o telefone'}
      subtitle="A barbearia usa o telefone para avisar sobre o seu horário, se precisar."
      footer={
        <p>
          Não é você?{' '}
          <button
            type="button"
            onClick={signOut}
            style={{
              border: 0,
              background: 'none',
              color: colors.primary,
              font: 'inherit',
              cursor: 'pointer',
            }}
          >
            Sair
          </button>
        </p>
      }
    >
      <Form onSubmit={handleSubmit} noValidate>
        <FieldLabel htmlFor="complete-name">
          <span>Nome</span>
          <TextInput
            id="complete-name"
            value={name}
            maxLength={100}
            autoComplete="name"
            onChange={event => {
              setName(event.target.value);
              setError('');
            }}
          />
        </FieldLabel>
        <FieldLabel htmlFor="complete-phone">
          <span>Telefone (com DDD)</span>
          <TextInput
            id="complete-phone"
            value={phone}
            inputMode="tel"
            autoComplete="tel"
            placeholder="(11) 99999-0000"
            autoFocus
            onChange={event => {
              setPhone(maskPhone(event.target.value));
              setError('');
            }}
          />
        </FieldLabel>
        <ProfileExtraFields
          rules={rules}
          values={extras}
          onChange={values => {
            setExtras(values);
            setError('');
          }}
        />
        <small role="alert">{error}</small>
        <UIButton type="submit" disabled={saving}>
          {saving ? 'Salvando...' : 'Continuar'}
        </UIButton>
      </Form>
    </AuthLayout>
  );
};

export default CompleteProfile;
