import React, { useCallback, useEffect, useState } from 'react';
import styled from 'styled-components';
import { Link } from 'react-router-dom';
import { FiArrowLeft, FiCreditCard, FiSmartphone, FiX } from 'react-icons/fi';

import api from '../../services/api';
import { useToast } from '../../hooks/Toast';
import getApiErrorMessage from '../../utils/getApiErrorMessage';
import { formatPrice } from '../../utils/money';
import { colors, radius } from '../../styles/theme';

interface SimDevice {
  id: string;
  name: string;
  external_id: string;
  active: boolean;
  charge: {
    external_id: string;
    amount_cents: number;
    description: string;
  } | null;
}

type Result = 'credit' | 'debit' | 'pix' | 'rejected';

const POLL_MS = 1500;

const Page = styled.div`
  min-height: 100vh;
  padding: 24px;
  background: ${colors.background};

  header {
    display: flex;
    align-items: center;
    gap: 16px;
    max-width: 900px;
    margin: 0 auto 28px;

    a {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      color: ${colors.textMuted};
      font-size: 14px;
      text-decoration: none;
    }

    h1 {
      font-size: 20px;
      color: ${colors.text};
    }

    p {
      font-size: 13px;
      color: ${colors.textMuted};
    }
  }
`;

const Devices = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 32px;
`;

// O "aparelho": corpo escuro com uma tela clara, como as maquininhas
const Device = styled.div`
  width: 280px;
  padding: 18px 16px 22px;
  border-radius: 28px;
  background: #1f1f24;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.35),
    inset 0 0 0 2px rgba(255, 255, 255, 0.06);

  > span {
    display: block;
    margin-bottom: 12px;
    font-size: 12px;
    text-align: center;
    color: rgba(255, 255, 255, 0.6);
  }
`;

const Screen = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  height: 300px;
  padding: 18px;
  border-radius: 14px;
  background: #f4f6f8;
  color: #1f2328;
  text-align: center;

  small {
    font-size: 12px;
    color: #57606a;
  }

  strong {
    font-size: 34px;
    font-weight: 700;
    font-variant-numeric: tabular-nums;
  }

  p {
    font-size: 13px;
    color: #57606a;
  }
`;

const Keys = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
  width: 100%;
  margin-top: 12px;

  button {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    height: 42px;
    border: 0;
    border-radius: ${radius.md};
    background: #ffffff;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.15);
    color: #1f2328;
    font: inherit;
    font-size: 14px;
    font-weight: 600;

    &:hover:not(:disabled) {
      background: #e8eef5;
    }

    &:disabled {
      opacity: 0.5;
    }

    svg {
      width: 15px;
      height: 15px;
    }
  }

  button.reject {
    grid-column: 1 / -1;
    color: #cf222e;
  }
`;

// Maquininha virtual: faz o papel do cliente passando o cartão, para testar
// a cobrança integrada sem uma maquininha de verdade. Abra em outra aba (ou
// no celular) ao lado da agenda
const VirtualTerminal: React.FC = () => {
  const { addToast } = useToast();
  const [devices, setDevices] = useState<SimDevice[] | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState('');

  const load = useCallback(() => {
    api
      .get<SimDevice[]>('/card-charges/simulator')
      .then(response => {
        setDevices(response.data);
        setError('');
      })
      .catch(err =>
        setError(
          getApiErrorMessage(err, 'Não foi possível falar com o servidor.'),
        ),
      );
  }, []);

  useEffect(() => {
    load();

    const timer = window.setInterval(load, POLL_MS);

    return () => window.clearInterval(timer);
  }, [load]);

  const resolve = useCallback(
    async (device: SimDevice, result: Result) => {
      if (!device.charge) return;

      setBusy(device.id);

      try {
        await api.post(`/card-charges/simulator/${device.charge.external_id}`, {
          result,
        });
        addToast({
          type: result === 'rejected' ? 'error' : 'success',
          title:
            result === 'rejected' ? 'Pagamento recusado' : 'Pagamento aprovado',
          description: device.name,
        });
        load();
      } catch (err) {
        addToast({
          type: 'error',
          title: 'Não foi possível',
          description: getApiErrorMessage(err, 'Tente novamente.'),
        });
      } finally {
        setBusy(null);
      }
    },
    [addToast, load],
  );

  return (
    <Page>
      <header>
        <Link to="/admin/configuracoes/integracoes">
          <FiArrowLeft />
          Configurações
        </Link>
        <div>
          <h1>Maquininha virtual</h1>
          <p>
            Simula o cliente pagando. Mande a cobrança pela agenda e aprove ou
            recuse aqui.
          </p>
        </div>
      </header>

      {error && (
        <p style={{ textAlign: 'center', color: colors.danger }}>{error}</p>
      )}

      {devices && devices.length === 0 && !error && (
        <p style={{ textAlign: 'center', color: colors.textMuted }}>
          Nenhuma maquininha cadastrada no simulador. Cadastre em Configurações
          → Maquininha de cartão.
        </p>
      )}

      <Devices>
        {(devices || []).map(device => (
          <Device key={device.id}>
            <span>
              {device.name} · {device.external_id}
              {!device.active && ' (desativada)'}
            </span>
            <Screen>
              {device.charge ? (
                <>
                  <small>Valor a pagar</small>
                  <strong>{formatPrice(device.charge.amount_cents)}</strong>
                  <p>{device.charge.description}</p>
                  <Keys>
                    <button
                      type="button"
                      disabled={busy === device.id}
                      onClick={() => resolve(device, 'credit')}
                    >
                      <FiCreditCard />
                      Crédito
                    </button>
                    <button
                      type="button"
                      disabled={busy === device.id}
                      onClick={() => resolve(device, 'debit')}
                    >
                      <FiCreditCard />
                      Débito
                    </button>
                    <button
                      type="button"
                      disabled={busy === device.id}
                      onClick={() => resolve(device, 'pix')}
                    >
                      <FiSmartphone />
                      Pix
                    </button>
                    <button
                      type="button"
                      className="reject"
                      disabled={busy === device.id}
                      onClick={() => resolve(device, 'rejected')}
                    >
                      <FiX />
                      Recusar
                    </button>
                  </Keys>
                </>
              ) : (
                <>
                  <FiCreditCard size={36} color="#8c959f" />
                  <p>Aguardando cobrança...</p>
                </>
              )}
            </Screen>
          </Device>
        ))}
      </Devices>
    </Page>
  );
};

export default VirtualTerminal;
