import React, {
  createContext,
  useCallback,
  useState,
  useContext,
  useLayoutEffect,
} from 'react';
import api from '../services/api';

interface User {
  id: string;
  name: string;
  email: string;
  avatar_url: string;
  is_admin: boolean;
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
  signOut(): void;
  updateUser(user: User): void;
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

  return (
    <AuthContext.Provider
      value={{
        user: data.user as User,
        client: data.client as Client,
        role: data.role,
        signIn,
        signInClient,
        signOut,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthContextData {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
}
