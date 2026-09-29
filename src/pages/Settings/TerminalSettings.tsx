import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import { FiCreditCard, FiExternalLink } from 'react-icons/fi';

import api from '../../services/api';
import { useToast } from '../../hooks/Toast';
import getApiErrorMessage from '../../utils/getApiErrorMessage';
import { colors, radius } from '../../styles/theme';
import {
  Card,
  CardHeader,
  CardBody,
  Select,
  UIButton,
} from '../../components/ui';
import { Field, FieldLabel } from './styles';

interface TerminalSettingsData {
  provider: string | null;
  provider_label: string | null;
  devices: Array<{ id: string; name: string }>;
  available: Array<{ key: string; label: string }>;
}

const Devices = styled.ul`
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 8px;

  li {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 12px;
    border: 1px solid ${colors.border};
    border-radius: ${radius.md};
    background: ${colors.sunken};
    font-size: 14px;
    color: ${colors.text};

    svg {
      width: 16px;
      height: 16px;
      color: ${colors.primary};
    }
  }
`;

const Note = styled.p`
  margin-top: 16px;
  padding: 12px 14px;
  border-radius: ${radius.md};
  background: ${colors.surfaceHover};
  font-size: 13px;
  line-height: 1.5;
  color: ${colors.textMuted};
`;

// Cobrança integrada na maquininha: qual operadora a barbearia usa
const TerminalSettings: React.FC = () => {
  const { addToast } = useToast();
  const [data, setData] = useState<TerminalSettingsData | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api
      .get<TerminalSettingsData>('/card-charges/settings')
      .then(response => setData(response.data))
      .catch(() => setData(null));
  }, []);

  const change = useCallback(
    async (provider: string) => {
      setSaving(true);

      try {
        const response = await api.put<TerminalSettingsData>(
          '/card-charges/settings',
          { provider: provider || null },
        );

        setData(response.data);
        addToast({
          type: 'success',
          title: response.data.provider
            ? 'Maquininha ativada'
            : 'Maquininha desligada',
          description: response.data.provider
            ? 'A opção "Cobrar na maquininha" aparece ao registrar o atendimento.'
            : 'Os pagamentos voltam a ser registrados só à mão.',
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
    },
    [addToast],
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
      </CardHeader>
      <CardBody>
        <Field>
          <FieldLabel htmlFor="terminal-provider">Operadora</FieldLabel>
          <Select
            id="terminal-provider"
            value={data?.provider || ''}
            disabled={!data || saving}
            onChange={event => change(event.target.value)}
            style={{ maxWidth: 360 }}
          >
            <option value="">Desligada (registro manual)</option>
            {(data?.available || []).map(option => (
              <option key={option.key} value={option.key}>
                {option.label}
              </option>
            ))}
          </Select>
        </Field>

        {data && data.devices.length > 0 && (
          <Field>
            <span>Maquininhas</span>
            <Devices>
              {data.devices.map(device => (
                <li key={device.id}>
                  <FiCreditCard />
                  {device.name}
                </li>
              ))}
            </Devices>
          </Field>
        )}

        {data?.provider === 'simulator' && (
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

        <Note>
          O simulador serve para testar o fluxo sem maquininha: a cobrança
          aparece na &quot;maquininha virtual&quot;, onde você aprova no
          crédito, débito ou Pix, ou recusa. As operadoras reais (Mercado Pago
          Point, Stone, Cielo LIO) entram nesta lista quando forem integradas.
        </Note>
      </CardBody>
    </Card>
  );
};

export default TerminalSettings;
