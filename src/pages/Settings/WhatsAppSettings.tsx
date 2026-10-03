import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import { FiSave } from 'react-icons/fi';

import api from '../../services/api';
import { useToast } from '../../hooks/Toast';
import getApiErrorMessage from '../../utils/getApiErrorMessage';
import { colors, radius } from '../../styles/theme';
import {
  Badge,
  Card,
  CardHeader,
  CardBody,
  Select,
  TextInput,
  UIButton,
} from '../../components/ui';
import { Field, FieldLabel } from './styles';

type Group = 'reminder' | 'appointments' | 'waitlist' | 'membership';

interface CredentialField {
  key: string;
  label: string;
  secret: boolean;
  required: boolean;
  placeholder?: string;
  help?: string;
}

interface WhatsAppSettingsData {
  provider: string | null;
  provider_label: string | null;
  automatic: boolean;
  groups: Group[];
  available: Array<{
    key: string;
    label: string;
    description: string;
    automatic: boolean;
    credential_fields: CredentialField[];
  }>;
  upcoming: Array<{ key: string; label: string }>;
  credentials: Record<string, string>;
}

const GROUPS: Array<{ key: Group; label: string; description: string }> = [
  {
    key: 'reminder',
    label: 'Lembrete com confirmação',
    description:
      'Na véspera, com o link para o cliente confirmar ou cancelar (vale também para quem não tem e-mail).',
  },
  {
    key: 'appointments',
    label: 'Horário marcado, remarcado ou cancelado',
    description: 'Avisa o cliente a cada mudança, inclusive do cliente fixo.',
  },
  {
    key: 'waitlist',
    label: 'Vaga na lista de espera',
    description:
      'Quando abre um horário no dia que o cliente estava esperando.',
  },
  {
    key: 'membership',
    label: 'Mensalidade do clube',
    description: '3 dias antes do vencimento e quando atrasa.',
  },
];

const Groups = styled.ul`
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 8px;

  label {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    padding: 10px 12px;
    border: 1px solid ${colors.border};
    border-radius: ${radius.md};
    background: ${colors.sunken};
    cursor: pointer;
  }

  input {
    width: 16px;
    height: 16px;
    margin-top: 2px;
    accent-color: ${colors.primary};
  }

  strong {
    display: block;
    font-size: 14px;
    font-weight: 500;
    color: ${colors.text};
  }

  small {
    font-size: 12px;
    color: ${colors.textMuted};
  }
`;

const Help = styled.p`
  margin-top: 8px;
  max-width: 560px;
  font-size: 13px;
  line-height: 1.5;
  color: ${colors.textMuted};

  a {
    color: ${colors.primary};
  }
`;

const Actions = styled.div`
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;
`;

// WhatsApp: forma de envio e quais mensagens vão para os clientes
const WhatsAppSettings: React.FC = () => {
  const { addToast } = useToast();
  const [data, setData] = useState<WhatsAppSettingsData | null>(null);
  const [provider, setProvider] = useState('');
  const [groups, setGroups] = useState<Group[]>([]);
  const [values, setValues] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const receive = useCallback((next: WhatsAppSettingsData) => {
    setData(next);
    setProvider(next.provider || '');
    setGroups(next.groups);
    setValues({});
  }, []);

  useEffect(() => {
    api
      .get<WhatsAppSettingsData>('/whatsapp/settings')
      .then(response => receive(response.data))
      .catch(() => setData(null));
  }, [receive]);

  const option = data?.available.find(item => item.key === provider) || null;
  const changed =
    !!data &&
    (provider !== (data.provider || '') ||
      groups.slice().sort().join() !== data.groups.slice().sort().join() ||
      Object.values(values).some(Boolean));

  const save = useCallback(async () => {
    setSaving(true);

    try {
      const response = await api.put<WhatsAppSettingsData>(
        '/whatsapp/settings',
        { provider: provider || null, credentials: values, groups },
      );

      receive(response.data);
      addToast({
        type: 'success',
        title: response.data.provider
          ? 'WhatsApp ligado'
          : 'WhatsApp desligado',
        description: response.data.provider
          ? response.data.provider_label || ''
          : 'Nenhuma mensagem nova será preparada.',
      });
    } catch (err) {
      addToast({
        type: 'error',
        title: 'Não foi possível salvar',
        description: getApiErrorMessage(err, 'Tente novamente.'),
      });
    } finally {
      setSaving(false);
    }
  }, [provider, values, groups, receive, addToast]);

  return (
    <Card>
      <CardHeader>
        <div>
          <h2>WhatsApp</h2>
          <p>Lembretes e avisos para os clientes pelo WhatsApp.</p>
        </div>
        {data && (
          <Badge tone={data.provider ? 'success' : 'neutral'}>
            {data.provider ? 'Ligado' : 'Desligado'}
          </Badge>
        )}
      </CardHeader>
      <CardBody>
        <Field>
          <FieldLabel htmlFor="whatsapp-provider">Forma de envio</FieldLabel>
          <Select
            id="whatsapp-provider"
            value={provider}
            disabled={!data || saving}
            onChange={event => setProvider(event.target.value)}
            style={{ maxWidth: 420 }}
          >
            <option value="">Desligado</option>
            {(data?.available || []).map(item => (
              <option key={item.key} value={item.key}>
                {item.label}
              </option>
            ))}
            {!!data?.upcoming.length && (
              <optgroup label="Em breve">
                {data.upcoming.map(item => (
                  <option key={item.key} value={item.key} disabled>
                    {item.label}
                  </option>
                ))}
              </optgroup>
            )}
          </Select>
          <Help>
            {option
              ? option.description
              : 'Desligado: os avisos continuam só por e-mail.'}{' '}
            {option && !option.automatic && (
              <>
                As mensagens aparecem em <Link to="/whatsapp">WhatsApp</Link>,
                no menu.
              </>
            )}
          </Help>
        </Field>

        {option &&
          option.credential_fields.map(field => {
            const saved =
              data?.provider === option.key ? data.credentials[field.key] : '';

            return (
              <Field key={field.key}>
                <FieldLabel htmlFor={`wa-${field.key}`}>
                  {field.label}
                </FieldLabel>
                <TextInput
                  id={`wa-${field.key}`}
                  type={field.secret ? 'password' : 'text'}
                  autoComplete="off"
                  value={values[field.key] ?? ''}
                  placeholder={
                    field.secret && saved
                      ? `${saved} (em branco mantém a atual)`
                      : field.placeholder
                  }
                  style={{ maxWidth: 420 }}
                  onChange={event => {
                    const { value } = event.target;

                    setValues(prev => ({ ...prev, [field.key]: value }));
                  }}
                />
                {field.help && <small>{field.help}</small>}
              </Field>
            );
          })}

        <Field>
          <span>Mensagens</span>
          <Groups>
            {GROUPS.map(group => (
              <li key={group.key}>
                <label htmlFor={`wa-group-${group.key}`}>
                  <input
                    id={`wa-group-${group.key}`}
                    type="checkbox"
                    checked={groups.includes(group.key)}
                    disabled={!data}
                    onChange={event =>
                      setGroups(current =>
                        event.target.checked
                          ? [...current, group.key]
                          : current.filter(item => item !== group.key),
                      )
                    }
                  />
                  <span>
                    <strong>{group.label}</strong>
                    <small>{group.description}</small>
                  </span>
                </label>
              </li>
            ))}
          </Groups>
        </Field>

        <Actions>
          <UIButton type="button" disabled={!changed || saving} onClick={save}>
            <FiSave />
            {saving ? 'Salvando...' : 'Salvar'}
          </UIButton>
        </Actions>
      </CardBody>
    </Card>
  );
};

export default WhatsAppSettings;
