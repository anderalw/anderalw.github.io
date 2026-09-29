import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useHistory } from 'react-router-dom';
import {
  format,
  formatDistanceToNowStrict,
  isToday,
  isYesterday,
  parseISO,
  differenceInHours,
} from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';
import { FiCalendar, FiCheck, FiRepeat, FiXCircle } from 'react-icons/fi';

import api from '../../services/api';
import { useToast } from '../../hooks/Toast';
import { useNotifications } from '../../hooks/Notifications';
import getApiErrorMessage from '../../utils/getApiErrorMessage';

import AppLayout from '../../components/AppLayout';
import {
  Page,
  PageHeader,
  Card,
  CardHeader,
  UIButton,
} from '../../components/ui';
import {
  Tabs,
  DayTitle,
  Item,
  Icon,
  Dot,
  Skeleton,
  Empty,
  Footnote,
} from './styles';

interface NotificationItem {
  id: string;
  content: string;
  read: boolean;
  created_at: string;
  // Dia do agendamento citado: clicar abre a agenda nele
  date: string | null;
}

interface NotificationsResponse {
  notifications: NotificationItem[];
  unread: number;
}

// Quantas a API devolve (as mais recentes)
const LIMIT = 50;

// Tipo pelo texto: cancelado, remarcado/transferido ou novo
function toneOf(content: string): 'new' | 'moved' | 'canceled' {
  if (/cancelado/i.test(content)) return 'canceled';
  if (/remarcado|transferido/i.test(content)) return 'moved';

  return 'new';
}

const ICONS = {
  new: FiCalendar,
  moved: FiRepeat,
  canceled: FiXCircle,
};

function dayTitle(date: Date): string {
  if (isToday(date)) return 'Hoje';
  if (isYesterday(date)) return 'Ontem';

  return format(date, "EEEE, d 'de' MMMM", { locale: ptBR });
}

// "há 5 minutos" no mesmo dia recente; depois, só o horário
function timeLabel(date: Date): string {
  if (differenceInHours(Date.now(), date) < 12) {
    return formatDistanceToNowStrict(date, { locale: ptBR, addSuffix: true });
  }

  return format(date, 'HH:mm');
}

// Avisos de novos agendamentos, remarcações e cancelamentos do barbeiro
// logado. Clicar marca como lida e abre a agenda no dia do agendamento
const Notifications: React.FC = () => {
  const history = useHistory();
  const { addToast } = useToast();
  const { unread, setUnread } = useNotifications();

  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [onlyUnread, setOnlyUnread] = useState(false);
  const [markingAll, setMarkingAll] = useState(false);

  useEffect(() => {
    let active = true;

    setLoading(true);

    api
      .get<NotificationsResponse>('/notifications', {
        params: onlyUnread ? { unread: true } : {},
      })
      .then(response => {
        if (!active) return;

        setItems(response.data.notifications);
        setUnread(response.data.unread);
      })
      .catch(err => {
        if (!active) return;

        addToast({
          type: 'error',
          title: 'Erro ao carregar as notificações',
          description: getApiErrorMessage(err, 'Tente novamente.'),
        });
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [onlyUnread, addToast, setUnread]);

  // Agrupadas por dia, na ordem em que chegaram
  const groups = useMemo(() => {
    const byDay: { title: string; items: NotificationItem[] }[] = [];

    items.forEach(item => {
      const title = dayTitle(parseISO(item.created_at));
      const last = byDay[byDay.length - 1];

      if (last && last.title === title) {
        last.items.push(item);
      } else {
        byDay.push({ title, items: [item] });
      }
    });

    return byDay;
  }, [items]);

  const markAsRead = useCallback(
    async (item: NotificationItem) => {
      if (item.read) return;

      // Atualiza na hora; a API confirma em seguida
      setItems(current =>
        current.map(other =>
          other.id === item.id ? { ...other, read: true } : other,
        ),
      );
      setUnread(Math.max(0, unread - 1));

      try {
        await api.patch(`/notifications/${item.id}/read`);
      } catch {
        // Se falhar, a próxima atualização do contador corrige
      }
    },
    [unread, setUnread],
  );

  const handleOpen = useCallback(
    (item: NotificationItem) => {
      markAsRead(item);

      if (item.date) {
        history.push(
          `/dashboard?data=${format(parseISO(item.date), 'yyyy-MM-dd')}`,
        );
      }
    },
    [markAsRead, history],
  );

  const handleMarkAll = useCallback(async () => {
    setMarkingAll(true);

    try {
      await api.patch('/notifications/read-all');

      setItems(current =>
        onlyUnread ? [] : current.map(item => ({ ...item, read: true })),
      );
      setUnread(0);
    } catch (err) {
      addToast({
        type: 'error',
        title: 'Não foi possível marcar como lidas',
        description: getApiErrorMessage(err, 'Tente novamente.'),
      });
    } finally {
      setMarkingAll(false);
    }
  }, [onlyUnread, setUnread, addToast]);

  return (
    <AppLayout>
      <Page>
        <PageHeader>
          <div>
            <h1>Notificações</h1>
            <p>
              Novos agendamentos, remarcações e cancelamentos da sua agenda.
            </p>
          </div>
          <div>
            <UIButton
              type="button"
              variant="secondary"
              onClick={handleMarkAll}
              disabled={markingAll || unread === 0}
            >
              <FiCheck />
              Marcar todas como lidas
            </UIButton>
          </div>
        </PageHeader>

        <Card style={{ maxWidth: 820 }}>
          <CardHeader>
            <Tabs role="group" aria-label="Filtro">
              <button
                type="button"
                aria-pressed={!onlyUnread}
                onClick={() => setOnlyUnread(false)}
              >
                Todas
              </button>
              <button
                type="button"
                aria-pressed={onlyUnread}
                onClick={() => setOnlyUnread(true)}
              >
                Não lidas {unread > 0 && `(${unread})`}
              </button>
            </Tabs>
          </CardHeader>

          {loading &&
            [220, 300, 260].map(width => (
              <Skeleton key={width} aria-hidden="true">
                <span />
                <span style={{ width, height: 12 }} />
              </Skeleton>
            ))}

          {!loading && items.length === 0 && (
            <Empty>
              {onlyUnread
                ? 'Nenhuma notificação não lida.'
                : 'Nenhuma notificação por enquanto.'}
            </Empty>
          )}

          {!loading &&
            groups.map(group => (
              <section key={group.title}>
                <DayTitle>{group.title}</DayTitle>
                {group.items.map(item => {
                  const tone = toneOf(item.content);
                  const TypeIcon = ICONS[tone];
                  const created = parseISO(item.created_at);

                  return (
                    <Item
                      key={item.id}
                      type="button"
                      unread={!item.read}
                      clickable={!!item.date || !item.read}
                      title={
                        item.date ? 'Abrir o dia na agenda' : 'Marcar como lida'
                      }
                      onClick={() => handleOpen(item)}
                    >
                      <Icon tone={tone}>
                        <TypeIcon />
                      </Icon>
                      <p>{item.content}</p>
                      <time dateTime={item.created_at}>
                        {timeLabel(created)}
                      </time>
                      <Dot
                        visible={!item.read}
                        aria-label={item.read ? undefined : 'Não lida'}
                      />
                    </Item>
                  );
                })}
              </section>
            ))}

          {!loading && items.length === LIMIT && (
            <Footnote>Mostrando as {LIMIT} mais recentes.</Footnote>
          )}
        </Card>
      </Page>
    </AppLayout>
  );
};

export default Notifications;
