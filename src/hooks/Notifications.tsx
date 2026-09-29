import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import api from '../services/api';
import { useAuth } from './Auth';

interface NotificationsContextData {
  // Notificações não lidas do barbeiro logado (0 para clientes)
  unread: number;
  // Atualiza o número (ex: depois de marcar como lida)
  setUnread(unread: number): void;
  refreshUnread(): Promise<void>;
}

// De quanto em quanto tempo o contador do menu é atualizado
const POLL_INTERVAL = 60 * 1000;

const NotificationsContext = createContext<NotificationsContextData>(
  {} as NotificationsContextData,
);

// Contador de notificações não lidas, compartilhado entre o menu lateral e a
// tela de notificações. Atualiza a cada minuto e quando a aba volta ao foco
export const NotificationsProvider: React.FC = ({ children }) => {
  const { role } = useAuth();
  const [unread, setUnread] = useState(0);

  const refreshUnread = useCallback(async () => {
    try {
      const response = await api.get<{ unread: number }>(
        '/notifications/unread-count',
      );

      setUnread(response.data.unread);
    } catch {
      // Falha momentânea (rede, sessão): mantém o último número
    }
  }, []);

  useEffect(() => {
    if (role !== 'provider') {
      setUnread(0);
      return undefined;
    }

    refreshUnread();

    const interval = setInterval(refreshUnread, POLL_INTERVAL);
    const handleFocus = (): void => {
      refreshUnread();
    };

    window.addEventListener('focus', handleFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
    };
  }, [role, refreshUnread]);

  const value = useMemo(
    () => ({ unread, setUnread, refreshUnread }),
    [unread, refreshUnread],
  );

  return (
    <NotificationsContext.Provider value={value}>
      {children}
    </NotificationsContext.Provider>
  );
};

export function useNotifications(): NotificationsContextData {
  return useContext(NotificationsContext);
}
