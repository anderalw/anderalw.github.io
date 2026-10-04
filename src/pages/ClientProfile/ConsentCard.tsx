import React, { useCallback, useEffect, useState } from 'react';
import styled from 'styled-components';
import { format, parseISO } from 'date-fns';
import { FiCheck, FiPrinter } from 'react-icons/fi';

import api from '../../services/api';
import { useToast } from '../../hooks/Toast';
import { useBranding } from '../../hooks/Branding';
import getApiErrorMessage from '../../utils/getApiErrorMessage';
import { colors } from '../../styles/theme';
import {
  Card,
  CardHeader,
  CardBody,
  UIButton,
  Badge,
} from '../../components/ui';
import { SkeletonBar } from '../ManageServices/styles';

interface ConsentStatus {
  text: string;
  version: string;
  required: boolean;
  accepted: boolean;
  accepted_at: string | null;
  in_person: boolean;
}

interface ConsentCardProps {
  clientId: string;
  clientName: string;
  clientCpf?: string | null;
}

const Body = styled(CardBody)`
  min-height: 112px;
`;

const Muted = styled.p`
  font-size: 13px;
  line-height: 1.5;
  color: ${colors.textMuted};
`;

const Buttons = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 14px;
`;

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

// Termo de consentimento na ficha: se o cliente aceitou o texto atual, o
// aceite feito na recepção (com o termo impresso e assinado) e a impressão
const ConsentCard: React.FC<ConsentCardProps> = ({
  clientId,
  clientName,
  clientCpf,
}) => {
  const { addToast } = useToast();
  const { branding } = useBranding();
  const [status, setStatus] = useState<ConsentStatus | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api
      .get<ConsentStatus>(`/clients/${clientId}/consent`)
      .then(response => setStatus(response.data))
      .catch(() => setStatus(null));
  }, [clientId]);

  const register = useCallback(async () => {
    if (!status) return;

    setSaving(true);

    try {
      const response = await api.post<ConsentStatus>(
        `/clients/${clientId}/consent`,
        { version: status.version },
      );

      setStatus(response.data);
      addToast({
        type: 'success',
        title: 'Aceite registrado',
        description: clientName,
      });
    } catch (err) {
      addToast({
        type: 'error',
        title: 'Não foi possível registrar',
        description: getApiErrorMessage(err, 'Tente novamente.'),
      });
    } finally {
      setSaving(false);
    }
  }, [status, clientId, clientName, addToast]);

  // Folha para assinar no papel
  const print = useCallback(() => {
    if (!status) return;

    const page = window.open('', '_blank', 'width=720,height=900');

    if (!page) return;

    const paragraphs = status.text
      .split(/\n\s*\n/)
      .map(item => `<p>${escapeHtml(item).replace(/\n/g, '<br>')}</p>`)
      .join('');

    page.document.write(`<!doctype html><html lang="pt-BR"><head>
<meta charset="utf-8"><title>Termo de consentimento</title>
<style>
  body { font-family: system-ui, sans-serif; max-width: 640px; margin: 40px auto; padding: 0 24px; color: #111; line-height: 1.6; font-size: 14px; }
  h1 { font-size: 18px; margin-bottom: 4px; }
  .meta { color: #555; margin-bottom: 24px; }
  .sign { margin-top: 64px; display: flex; gap: 32px; }
  .sign div { flex: 1; border-top: 1px solid #111; padding-top: 6px; font-size: 13px; }
</style></head><body>
<h1>Termo de consentimento · ${escapeHtml(branding.name)}</h1>
<div class="meta">${escapeHtml(clientName)}${
      clientCpf ? ` · CPF ${escapeHtml(clientCpf)}` : ''
    }</div>
${paragraphs}
<div class="sign"><div>Assinatura</div><div>Data: ____/____/______</div></div>
<script>window.onload = function () { window.print(); };</script>
</body></html>`);
    page.document.close();
  }, [status, branding.name, clientName, clientCpf]);

  let content: React.ReactNode = <SkeletonBar width={200} />;

  if (status) {
    content = (
      <>
        <Muted>
          {status.accepted && status.accepted_at
            ? `Aceito em ${format(
                parseISO(status.accepted_at),
                "dd/MM/yyyy 'às' HH:mm",
              )} ${status.in_person ? 'na recepção' : 'pelo site'}.`
            : 'Ainda não aceitou o termo atual. Pelo site, o aceite é pedido no próximo agendamento.'}
        </Muted>
        <Buttons>
          {!status.accepted && (
            <UIButton
              type="button"
              size="sm"
              disabled={saving}
              onClick={register}
            >
              <FiCheck />
              Registrar aceite na recepção
            </UIButton>
          )}
          <UIButton type="button" size="sm" variant="ghost" onClick={print}>
            <FiPrinter />
            Imprimir para assinar
          </UIButton>
        </Buttons>
      </>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div>
          <h2>Termo de consentimento</h2>
          <p>Aceite do texto atual</p>
        </div>
        {status && (
          <Badge tone={status.accepted ? 'success' : 'neutral'}>
            {status.accepted ? 'Aceito' : 'Pendente'}
          </Badge>
        )}
      </CardHeader>
      <Body>{content}</Body>
    </Card>
  );
};

export default ConsentCard;
