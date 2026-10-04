import React, {
  createContext,
  useCallback,
  useState,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
} from 'react';
import api from '../services/api';

// Permissões da equipe (as mesmas chaves da API)
export type Permission =
  | 'agenda.all'
  | 'agenda.manage'
  | 'clients'
  | 'cash'
  | 'cash.close'
  | 'club'
  | 'whatsapp'
  | 'reports'
  | 'catalog'
  | 'settings'
  | 'team';

interface User {
  id: string;
  name: string;
  email: string;
  avatar_url: string;
  // Perfil Administrador (pode tudo)
  is_admin: boolean;
  // Atende clientes: tem coluna na agenda
  is_barber: boolean;
  role: { id: string; name: string } | null;
  // Tudo o que pode (perfil + as próprias)
  permissions: Permission[];
  // Ainda com a senha provisória (o e-mail): troca antes de usar o sistema
  must_change_password: boolean;
  // Dados do cadastro (os que a barbearia pede em Configurações → Cadastros)
  phone?: string | null;
  cpf?: string | null;
  birth_date?: string | null;
  address?: Record<string, string | null> | null;
}

interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
}

type Role = 'provider' | 'client';

// Só existe uma sessão de cada vez: ou de barbeiro (user) ou de cliente (client)
interface AuthState {
  token: string;
  role: Role;
  user?: User;
  client?: Client;
}

interface SigninCredentionals {
  email: string;
  password: string;
}

interface AuthContextData {
  user: User;
  client: Client;
  role?: Role;
  signIn(credentials: SigninCredentionals): Promise<void>;
  signInClient(credentials: SigninCredentionals): Promise<void>;
  // Botão "Continuar com o Google" (credential = token do Google).
  // created: a conta foi criada agora
  signInClientWithGoogle(credential: string): Promise<{ created: boolean }>;
  signOut(): void;
  updateUser(user: User): void;
  // Troca a senha provisória; a API devolve um token novo, sem restrição
  changeFirstPassword(password: string, confirmation: string): Promise<void>;
  // O usuário da equipe tem a permissão? (cliente: nunca)
  can(permission: Permission): boolean;
  updateClient(client: Client): void;
}

const STORAGE_KEYS = [
  '@GoBarber:token',
  '@GoBarber:user',
  '@GoBarber:client',
  // Chave usada pelo login de cliente antes da sessão unificada
  '@GoBarber:clientToken',
];

function clearStorage(): void {
  STORAGE_KEYS.forEach(key => localStorage.removeItem(key));
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export const AuthProvider: React.FC = ({ children }) => {
  const [data, setData] = useState<AuthState>(() => {
    const token = localStorage.getItem('@GoBarber:token');
    const user = localStorage.getItem('@GoBarber:user');
    const client = localStorage.getItem('@GoBarber:client');

    if (token && user) {
      api.defaults.headers.authorization = `Bearer ${token}`;

      return { token, role: 'provider', user: JSON.parse(user) };
    }

    if (token && client) {
      api.defaults.headers.authorization = `Bearer ${token}`;

      return { token, role: 'client', client: JSON.parse(client) };
    }

    return {} as AuthState;
  });

  const signIn = useCallback(async ({ email, password }) => {
    const response = await api.post('sessions', {
      email,
      password,
    });

    const { token, user } = response.data;

    clearStorage();
    localStorage.setItem('@GoBarber:token', token);
    localStorage.setItem('@GoBarber:user', JSON.stringify(user));

    api.defaults.headers.authorization = `Bearer ${token}`;

    setData({ token, role: 'provider', user });
  }, []);

  const signInClient = useCallback(async ({ email, password }) => {
    const response = await api.post('clients/sessions', {
      email,
      password,
    });

    const { token, client } = response.data;

    clearStorage();
    localStorage.setItem('@GoBarber:token', token);
    localStorage.setItem('@GoBarber:client', JSON.stringify(client));

    api.defaults.headers.authorization = `Bearer ${token}`;

    setData({ token, role: 'client', client });
  }, []);

  const signInClientWithGoogle = useCallback(async (credential: string) => {
    const response = await api.post('clients/sessions/google', {
      credential,
    });

    const { token, client, created } = response.data;

    clearStorage();
    localStorage.setItem('@GoBarber:token', token);
    localStorage.setItem('@GoBarber:client', JSON.stringify(client));

    api.defaults.headers.authorization = `Bearer ${token}`;

    setData({ token, role: 'client', client });

    return { created: !!created };
  }, []);

  const signOut = useCallback(() => {
    clearStorage();

    delete api.defaults.headers.authorization;

    setData({} as AuthState);
  }, []);

  // Token expirado ou emitido antes da separação barbeiro/cliente:
  // a API responde 401 e a sessão local é descartada.
  // useLayoutEffect roda antes dos useEffect das páginas, então o
  // interceptor já existe quando elas fazem a primeira requisição
  useLayoutEffect(() => {
    const interceptor = api.interceptors.response.use(
      response => response,
      error => {
        const isLoginRequest = String(error.config?.url).includes('sessions');

        if (error.response?.status === 401 && !isLoginRequest) {
          signOut();
        }

        return Promise.reject(error);
      },
    );

    return () => api.interceptors.response.eject(interceptor);
  }, [signOut]);

  const updateUser = useCallback(
    (user: User) => {
      localStorage.setItem('@GoBarber:user', JSON.stringify(user));

      setData({
        token: data.token,
        role: 'provider',
        user,
      });
    },
    [setData, data.token],
  );

  const updateClient = useCallback(
    (client: Client) => {
      localStorage.setItem('@GoBarber:client', JSON.stringify(client));

      setData({ token: data.token, role: 'client', client });
    },
    [setData, data.token],
  );

  const changeFirstPassword = useCallback(
    async (password: string, confirmation: string) => {
      const response = await api.put<{ token: string; user: User }>(
        '/profile/password',
        { password, password_confirmation: confirmation },
      );
      const { token, user } = response.data;

      localStorage.setItem('@GoBarber:token', token);
      localStorage.setItem('@GoBarber:user', JSON.stringify(user));

      api.defaults.headers.authorization = `Bearer ${token}`;

      setData({ token, role: 'provider', user });
    },
    [],
  );

  // Perfil e permissões atualizados a cada abertura do sistema (o
  // administrador pode ter mudado o perfil desde o login)
  useEffect(() => {
    if (data.role !== 'provider' || !data.token) return;

    api
      .get<User>('/profile')
      .then(response => {
        localStorage.setItem('@GoBarber:user', JSON.stringify(response.data));
        setData(current =>
          current.token === data.token
            ? { ...current, user: response.data }
            : current,
        );
      })
      .catch(() => {
        // Sem a API, fica o que estava guardado
      });
  }, [data.role, data.token]);

  const can = useCallback(
    (permission: Permission) =>
      data.role === 'provider' &&
      !!data.user?.permissions?.includes(permission),
    [data.role, data.user],
  );

  // Mesmo objeto enquanto nada muda, para não re-renderizar quem usa o contexto
  const value = useMemo(
    () => ({
      user: data.user as User,
      client: data.client as Client,
      role: data.role,
      signIn,
      signInClient,
      signInClientWithGoogle,
      signOut,
      updateUser,
      updateClient,
      can,
      changeFirstPassword,
    }),
    [
      data,
      can,
      changeFirstPassword,
      signIn,
      signInClient,
      signInClientWithGoogle,
      signOut,
      updateUser,
      updateClient,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export function useAuth(): AuthContextData {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
}
