import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { format, formatDistanceToNow, parseISO } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';
import { FiCheckCircle } from 'react-icons/fi';
import { FaWhatsapp } from 'react-icons/fa';

import api from '../../services/api';
import { useAuth } from '../../hooks/Auth';
import { useToast } from '../../hooks/Toast';
import { notifyWhatsAppChanged } from '../../hooks/useWhatsAppCount';
import getApiErrorMessage from '../../utils/getApiErrorMessage';
import AppLayout from '../../components/AppLayout';
import { Page, PageHeader, Card, Table, UIButton } from '../../components/ui';
import { SkeletonBar } from '../ManageServices/styles';

import {
  KIND_LABELS,
  STATUS_LABELS,
  WhatsAppMessage,
  formatWhatsApp,
} from './types';
import {
  Tabs,
  Tab,
  ModeNote,
  Grid,
  MessageCard,
  Bubble,
  KindChip,
  SendButton,
  Empty,
  StatusText,
} from './styles';

interface Status {
  pending: number;
  enabled: boolean;
  automatic: boolean;
  provider_label: string | null;
}

type View = 'pending' | 'history';

// Mensagens de WhatsApp para os clientes: no envio assistido, a fila para
// enviar com um clique; e o histórico do que saiu
const WhatsApp: React.FC = () => {
  const { can } = useAuth();
  const { addToast } = useToast();
  const [view, setView] = useState<View>('pending');
  const [status, setStatus] = useState<Status | null>(null);
  // null: carregando
  const [messages, setMessages] = useState<WhatsAppMessage[] | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(() => {
    setMessages(null);

    Promise.all([
      api.get<Status>('/whatsapp/messages/count'),
      api.get<WhatsAppMessage[]>('/whatsapp/messages', {
        params: { list: view },
      }),
    ])
      .then(([statusResponse, list]) => {
        setStatus(statusResponse.data);
        setMessages(list.data);
      })
      .catch(err => {
        setMessages([]);
        addToast({
          type: 'error',
          title: 'Não foi possível carregar as mensagens',
          description: getApiErrorMessage(err, 'Tente novamente.'),
        });
      });
  }, [view, addToast]);

  useEffect(() => {
    load();
  }, [load]);

  const handle = useCallback(
    async (message: WhatsAppMessage, action: 'sent' | 'skip') => {
      // Abre o WhatsApp já com o texto (antes da requisição, para o
      // navegador não bloquear a nova aba)
      if (action === 'sent' && message.wa_link) {
        window.open(message.wa_link, '_blank', 'noopener');
      }

      setBusy(message.id);

      try {
        await api.post(`/whatsapp/messages/${message.id}/${action}`);
        setMessages(current =>
          (current || []).filter(item => item.id !== message.id),
        );
        setStatus(current =>
          current ? { ...current, pending: current.pending - 1 } : current,
        );
        notifyWhatsAppChanged();
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
    [addToast],
  );

  let modeNote: React.ReactNode = null;

  if (status && !status.enabled) {
    modeNote = (
      <ModeNote warning>
        O WhatsApp está desligado: nenhuma mensagem nova entra aqui.{' '}
        {can('settings') ? (
          <>
            Ligue em{' '}
            <Link to="/admin/configuracoes/integracoes/whatsapp">
              Configurações
            </Link>
            .
          </>
        ) : (
          'Peça para o administrador ligar nas Configurações.'
        )}
      </ModeNote>
    );
  } else if (status?.automatic) {
    modeNote = (
      <ModeNote>
        {`Envio automático (${status.provider_label}): as mensagens saem sozinhas. Aqui ficam só as que precisam de atenção e o histórico.`}
      </ModeNote>
    );
  } else if (status) {
    modeNote = (
      <ModeNote>
        Envio assistido: &quot;Enviar no WhatsApp&quot; abre a conversa com o
        texto pronto; é só apertar enviar. As mensagens somem daqui quando
        perdem o prazo (ex.: o horário já passou).
      </ModeNote>
    );
  }

  return (
    <AppLayout>
      <Page>
        <PageHeader>
          <div>
            <h1>WhatsApp</h1>
            <p>
              Lembretes, confirmações, avisos da lista de espera e do clube.
            </p>
          </div>
        </PageHeader>

        {modeNote}

        <Tabs role="tablist">
          <Tab
            type="button"
            role="tab"
            aria-selected={view === 'pending'}
            selected={view === 'pending'}
            onClick={() => setView('pending')}
          >
            {`Para enviar${status ? ` (${status.pending})` : ''}`}
          </Tab>
          <Tab
            type="button"
            role="tab"
            aria-selected={view === 'history'}
            selected={view === 'history'}
            onClick={() => setView('history')}
          >
            Histórico
          </Tab>
        </Tabs>

        {view === 'pending' && messages && messages.length === 0 && (
          <Empty>
            <FiCheckCircle />
            Nenhuma mensagem para enviar agora.
          </Empty>
        )}

        {view === 'pending' && (!messages || messages.length > 0) && (
          <Grid>
            {!messages &&
              [1, 2].map(key => (
                <MessageCard key={key}>
                  <header>
                    <SkeletonBar width={160} />
                  </header>
                  <Bubble />
                  <footer>
                    <SkeletonBar width={140} />
                  </footer>
                </MessageCard>
              ))}
            {(messages || []).map(message => (
              <MessageCard key={message.id}>
                <header>
                  <div>
                    <strong>{message.client_name}</strong>
                    <small>
                      {`${formatWhatsApp(
                        message.phone,
                      )} · ${formatDistanceToNow(parseISO(message.created_at), {
                        locale: ptBR,
                        addSuffix: true,
                      })}`}
                    </small>
                  </div>
                  <KindChip>{KIND_LABELS[message.kind]}</KindChip>
                </header>
                <Bubble>{message.body}</Bubble>
                <footer>
                  <SendButton
                    type="button"
                    disabled={busy === message.id || !message.wa_link}
                    onClick={() => handle(message, 'sent')}
                  >
                    <FaWhatsapp />
                    Enviar no WhatsApp
                  </SendButton>
                  <UIButton
                    type="button"
                    size="sm"
                    variant="ghost"
                    disabled={busy === message.id}
                    onClick={() => handle(message, 'skip')}
                  >
                    Pular
                  </UIButton>
                </footer>
              </MessageCard>
            ))}
          </Grid>
        )}

        {view === 'history' && (
          <Card>
            <Table>
              <thead>
                <tr>
                  <th>Quando</th>
                  <th>Cliente</th>
                  <th>Mensagem</th>
                  <th>Situação</th>
                </tr>
              </thead>
              <tbody>
                {!messages &&
                  [1, 2, 3].map(key => (
                    <tr key={key}>
                      <td>
                        <SkeletonBar width={90} />
                      </td>
                      <td>
                        <SkeletonBar width={140} />
                      </td>
                      <td>
                        <SkeletonBar width={120} />
                      </td>
                      <td>
                        <SkeletonBar width={80} />
                      </td>
                    </tr>
                  ))}
                {messages && messages.length === 0 && (
                  <tr>
                    <td colSpan={4}>Nada enviado ainda.</td>
                  </tr>
                )}
                {(messages || []).map(message => {
                  let tone: 'success' | 'danger' | 'neutral' = 'neutral';

                  if (message.status === 'sent') tone = 'success';
                  if (message.status === 'failed') tone = 'danger';

                  return (
                    <tr key={message.id} title={message.body}>
                      <td>
                        {format(
                          parseISO(message.sent_at || message.created_at),
                          'dd/MM HH:mm',
                        )}
                      </td>
                      <td>{message.client_name}</td>
                      <td>{KIND_LABELS[message.kind]}</td>
                      <td>
                        <StatusText tone={tone}>
                          {STATUS_LABELS[message.status]}
                        </StatusText>
                        {message.error && (
                          <small style={{ display: 'block', fontSize: 12 }}>
                            {message.error}
                          </small>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </Table>
          </Card>
        )}
      </Page>
    </AppLayout>
  );
};

export default WhatsApp;
