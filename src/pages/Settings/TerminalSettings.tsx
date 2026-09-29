import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import {
  FiCreditCard,
  FiEdit2,
  FiExternalLink,
  FiLink,
  FiPlus,
  FiTrash2,
  FiZap,
} from 'react-icons/fi';

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
import TerminalDeviceModal, { RegisteredDevice } from './TerminalDeviceModal';

interface CredentialField {
  key: string;
  label: string;
  secret: boolean;
  required: boolean;
  placeholder?: string;
  help?: string;
}

interface ProviderOption {
  key: string;
  label: string;
  setup_help: string;
  device_id_label: string;
  device_id_help: string;
  credential_fields: CredentialField[];
}

interface TerminalSettingsData {
  provider: string | null;
  provider_label: string | null;
  connected: boolean;
  available: ProviderOption[];
  registered: RegisteredDevice[];
  // Segredos mascarados (••••1234)
  credentials: Record<string, string>;
}

const Section = styled.div`
  margin-top: 24px;
  padding-top: 20px;
  border-top: 1px solid ${colors.border};

  > header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 12px;

    h3 {
      font-size: 15px;
      font-weight: 600;
      color: ${colors.text};
    }
  }
`;

const SetupHelp = styled.p`
  margin-bottom: 16px;
  font-size: 13px;
  line-height: 1.5;
  color: ${colors.textMuted};
`;

const Credentials = styled.form`
  display: flex;
  flex-direction: column;
  gap: 14px;
  max-width: 420px;

  label > span {
    display: block;
    margin-bottom: 6px;
    font-size: 13px;
    font-weight: 500;
    color: ${colors.textMuted};
  }

  label > small {
    display: block;
    margin-top: 6px;
    font-size: 12px;
    color: ${colors.textSubtle};
  }
`;

const Actions = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
`;

// Espaço reservado: a mensagem aparece sem empurrar o resto
const Message = styled.small<{ error: boolean }>`
  display: block;
  min-height: 18px;
  font-size: 12px;
  color: ${props => (props.error ? colors.danger : colors.success)};
`;

const Devices = styled.ul`
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 8px;

  li {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 10px 12px;
    border: 1px solid ${colors.border};
    border-radius: ${radius.md};
    background: ${colors.sunken};

    > svg {
      width: 18px;
      height: 18px;
      flex-shrink: 0;
      color: ${colors.primary};
    }

    div {
      flex: 1;
      min-width: 0;
    }

    strong {
      display: block;
      font-size: 14px;
      font-weight: 500;
      color: ${colors.text};
    }

    small {
      font-size: 12px;
      color: ${colors.textSubtle};
    }
  }

  li.inactive {
    opacity: 0.65;
  }
`;

const Empty = styled.p`
  padding: 16px;
  border: 1px dashed ${colors.borderStrong};
  border-radius: ${radius.md};
  font-size: 13px;
  text-align: center;
  color: ${colors.textMuted};
`;

const IconButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  border: 0;
  border-radius: ${radius.md};
  background: transparent;
  color: ${colors.textMuted};

  svg {
    width: 15px;
    height: 15px;
  }

  &:hover:not(:disabled) {
    background: ${colors.surfaceHover};
    color: ${colors.text};
  }

  &.danger:hover:not(:disabled) {
    background: ${colors.dangerSoft};
    color: ${colors.danger};
  }
`;

// Cobrança integrada na maquininha: a operadora, a conta da barbearia nela e
// as maquininhas cadastradas
const TerminalSettings: React.FC = () => {
  const { addToast } = useToast();
  const [data, setData] = useState<TerminalSettingsData | null>(null);
  // Operadora escolhida no select (só vale depois de conectar)
  const [selected, setSelected] = useState('');
  const [values, setValues] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string; error: boolean }>({
    text: '',
    error: false,
  });
  // undefined: fechado; null: nova maquininha
  const [editing, setEditing] = useState<RegisteredDevice | null | undefined>(
    undefined,
  );
  const [busyDevice, setBusyDevice] = useState<string | null>(null);

  const receive = useCallback((next: TerminalSettingsData) => {
    setData(next);
    setSelected(next.provider || '');
    setValues({});
  }, []);

  useEffect(() => {
    api
      .get<TerminalSettingsData>('/card-charges/settings/admin')
      .then(response => receive(response.data))
      .catch(() => setData(null));
  }, [receive]);

  const option = data?.available.find(item => item.key === selected) || null;
  // A conta mostrada é a da operadora em uso
  const current = !!data && selected === data.provider;
  const connected = current && !!data?.connected;

  const save = useCallback(
    async (provider: string, credentials: Record<string, string>) => {
      setSaving(true);
      setMessage({ text: '', error: false });

      try {
        const response = await api.put<TerminalSettingsData>(
          '/card-charges/settings',
          { provider: provider || null, credentials },
        );

        receive(response.data);

        if (response.data.provider) {
          setMessage({ text: 'Conta conectada.', error: false });
        }

        addToast({
          type: 'success',
          title: response.data.provider
            ? 'Maquininha conectada'
            : 'Maquininha desligada',
          description: response.data.provider
            ? 'Cadastre as maquininhas da barbearia para cobrar pela agenda.'
            : 'Os pagamentos voltam a ser registrados só à mão.',
        });
      } catch (err) {
        setMessage({
          text: getApiErrorMessage(err, 'Não foi possível conectar.'),
          error: true,
        });
      } finally {
        setSaving(false);
      }
    },
    [addToast, receive],
  );

  const chooseProvider = (key: string): void => {
    setSelected(key);
    setValues({});
    setMessage({ text: '', error: false });

    // Desligar não precisa de mais nada
    if (!key && data?.provider) save('', {});
  };

  const testConnection = useCallback(async () => {
    setSaving(true);
    setMessage({ text: '', error: false });

    try {
      await api.post('/card-charges/settings/test');
      setMessage({ text: 'Conexão funcionando.', error: false });
    } catch (err) {
      setMessage({
        text: getApiErrorMessage(err, 'A operadora não respondeu.'),
        error: true,
      });
    } finally {
      setSaving(false);
    }
  }, []);

  const toggleDevice = useCallback(
    async (device: RegisteredDevice) => {
      setBusyDevice(device.id);

      try {
        const response = await api.put<TerminalSettingsData>(
          `/card-charges/devices/${device.id}`,
          { active: !device.active },
        );

        receive(response.data);
      } catch (err) {
        addToast({
          type: 'error',
          title: 'Não foi possível alterar',
          description: getApiErrorMessage(err, 'Tente novamente.'),
        });
      } finally {
        setBusyDevice(null);
      }
    },
    [addToast, receive],
  );

  const removeDevice = useCallback(
    async (device: RegisteredDevice) => {
      // eslint-disable-next-line no-alert
      if (!window.confirm(`Remover a maquininha "${device.name}"?`)) return;

      setBusyDevice(device.id);

      try {
        const response = await api.delete<TerminalSettingsData>(
          `/card-charges/devices/${device.id}`,
        );

        receive(response.data);
        addToast({
          type: 'success',
          title: 'Maquininha removida',
          description: device.name,
        });
      } catch (err) {
        addToast({
          type: 'error',
          title: 'Não foi possível remover',
          description: getApiErrorMessage(err, 'Tente novamente.'),
        });
      } finally {
        setBusyDevice(null);
      }
    },
    [addToast, receive],
  );

  return (
    <Card style={{ marginTop: 24 }}>
      <CardHeader>
        <div>
          <h2>Maquininha de cartão</h2>
          <p>
            Manda a cobrança direto para a maquininha e marca o atendimento como
            pago quando o cliente paga.
          </p>
        </div>
        {data?.provider && (
          <Badge tone={data.connected ? 'success' : 'neutral'}>
            {data.connected ? 'Conectada' : 'Não conectada'}
          </Badge>
        )}
      </CardHeader>
      <CardBody>
        <Field>
          <FieldLabel htmlFor="terminal-provider">Operadora</FieldLabel>
          <Select
            id="terminal-provider"
            value={selected}
            disabled={!data || saving}
            onChange={event => chooseProvider(event.target.value)}
            style={{ maxWidth: 360 }}
          >
            <option value="">Desligada (registro manual)</option>
            {(data?.available || []).map(item => (
              <option key={item.key} value={item.key}>
                {item.label}
              </option>
            ))}
          </Select>
        </Field>

        {option && data && (
          <Section>
            <header>
              <h3>Conta na operadora</h3>
            </header>
            <SetupHelp>{option.setup_help}</SetupHelp>

            <Credentials
              noValidate
              onSubmit={event => {
                event.preventDefault();
                save(option.key, values);
              }}
            >
              {option.credential_fields.map(field => {
                const saved = current ? data.credentials[field.key] : '';

                return (
                  <label key={field.key} htmlFor={`cred-${field.key}`}>
                    <span>
                      {field.label}
                      {!field.required && ' (opcional)'}
                    </span>
                    <TextInput
                      id={`cred-${field.key}`}
                      type={field.secret ? 'password' : 'text'}
                      autoComplete="off"
                      value={values[field.key] ?? (field.secret ? '' : saved)}
                      placeholder={
                        field.secret && saved
                          ? `${saved} (em branco mantém a atual)`
                          : field.placeholder
                      }
                      onChange={event => {
                        const { value } = event.target;

                        setValues(prev => ({ ...prev, [field.key]: value }));
                        setMessage({ text: '', error: false });
                      }}
                    />
                    {field.help && <small>{field.help}</small>}
                  </label>
                );
              })}

              <Actions>
                <UIButton type="submit" disabled={saving}>
                  <FiLink />
                  {connected ? 'Salvar alterações' : 'Conectar'}
                </UIButton>
                {connected && (
                  <UIButton
                    type="button"
                    variant="secondary"
                    disabled={saving}
                    onClick={testConnection}
                  >
                    <FiZap />
                    Testar conexão
                  </UIButton>
                )}
              </Actions>
              <Message error={message.error} role="status">
                {saving ? 'Falando com a operadora...' : message.text}
              </Message>
            </Credentials>
          </Section>
        )}

        {connected && option && data && (
          <Section>
            <header>
              <h3>Maquininhas da barbearia</h3>
              <UIButton
                type="button"
                size="sm"
                variant="secondary"
                onClick={() => setEditing(null)}
              >
                <FiPlus />
                Adicionar maquininha
              </UIButton>
            </header>

            {data.registered.length === 0 ? (
              <Empty>
                Nenhuma maquininha cadastrada. Adicione as da barbearia para
                aparecer a opção &quot;Cobrar na maquininha&quot; na agenda.
              </Empty>
            ) : (
              <Devices>
                {data.registered.map(device => (
                  <li
                    key={device.id}
                    className={device.active ? undefined : 'inactive'}
                  >
                    <FiCreditCard />
                    <div>
                      <strong>{device.name}</strong>
                      <small>
                        {option.device_id_label}: {device.external_id}
                      </small>
                    </div>
                    <Badge tone={device.active ? 'success' : 'neutral'}>
                      {device.active ? 'Ativa' : 'Desativada'}
                    </Badge>
                    <UIButton
                      type="button"
                      size="sm"
                      variant="ghost"
                      disabled={busyDevice === device.id}
                      onClick={() => toggleDevice(device)}
                      style={{ width: 76 }}
                    >
                      {device.active ? 'Desativar' : 'Ativar'}
                    </UIButton>
                    <IconButton
                      type="button"
                      aria-label={`Renomear ${device.name}`}
                      title="Renomear"
                      disabled={busyDevice === device.id}
                      onClick={() => setEditing(device)}
                    >
                      <FiEdit2 />
                    </IconButton>
                    <IconButton
                      type="button"
                      className="danger"
                      aria-label={`Remover ${device.name}`}
                      title="Remover"
                      disabled={busyDevice === device.id}
                      onClick={() => removeDevice(device)}
                    >
                      <FiTrash2 />
                    </IconButton>
                  </li>
                ))}
              </Devices>
            )}

            {data.provider === 'simulator' && (
              <UIButton
                as={Link}
                to="/maquininha-virtual"
                target="_blank"
                variant="secondary"
                size="sm"
                style={{ marginTop: 16 }}
              >
                <FiExternalLink />
                Abrir a maquininha virtual
              </UIButton>
            )}
          </Section>
        )}

        {editing !== undefined && option && (
          <TerminalDeviceModal
            device={editing}
            providerLabel={option.label}
            deviceIdLabel={option.device_id_label}
            deviceIdHelp={option.device_id_help}
            onClose={() => setEditing(undefined)}
            onSaved={(next, name) => {
              const adding = editing === null;

              setEditing(undefined);
              receive(next as TerminalSettingsData);
              addToast({
                type: 'success',
                title: adding ? 'Maquininha adicionada' : 'Nome alterado',
                description: name,
              });
            }}
          />
        )}
      </CardBody>
    </Card>
  );
};

export default TerminalSettings;
