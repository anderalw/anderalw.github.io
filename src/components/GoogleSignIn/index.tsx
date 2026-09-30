import React, { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import { useHistory, useLocation } from 'react-router-dom';

import api from '../../services/api';
import clientHomeAfterLogin from '../../utils/clientHomeAfterLogin';
import { useAuth } from '../../hooks/Auth';
import { useTheme } from '../../hooks/Theme';
import { useToast } from '../../hooks/Toast';
import getApiErrorMessage from '../../utils/getApiErrorMessage';
import { colors } from '../../styles/theme';

// Tipos mínimos do Google Identity Services (script carregado sob demanda)
interface GoogleId {
  initialize(options: {
    client_id: string;
    callback(response: { credential: string }): void;
    ux_mode?: 'popup' | 'redirect';
  }): void;
  renderButton(
    element: HTMLElement,
    options: Record<string, string | number>,
  ): void;
}

declare global {
  interface Window {
    google?: { accounts: { id: GoogleId } };
  }
}

const SCRIPT_URL = 'https://accounts.google.com/gsi/client';

let scriptPromise: Promise<void> | null = null;

function loadScript(): Promise<void> {
  if (window.google?.accounts?.id) return Promise.resolve();

  if (!scriptPromise) {
    scriptPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script');

      script.src = SCRIPT_URL;
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => {
        scriptPromise = null;
        reject(new Error('Google indisponível'));
      };
      document.head.appendChild(script);
    });
  }

  return scriptPromise;
}

const Wrapper = styled.div`
  /* Altura do botão reservada: nada pula quando ele aparece */
  min-height: 44px;
  display: flex;
  justify-content: center;
`;

const Divider = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 20px 0;
  font-size: 12px;
  color: ${colors.textSubtle};
  text-transform: uppercase;
  letter-spacing: 0.06em;

  &::before,
  &::after {
    content: '';
    flex: 1;
    height: 1px;
    background: ${colors.border};
  }
`;

interface GoogleSignInProps {
  // 'signin': "Continuar com o Google"; 'signup': "Inscrever-se com o Google"
  mode?: 'signin' | 'signup';
}

// Botão "Continuar com o Google" para clientes. Só aparece se a barbearia
// configurou o login com Google (GOOGLE_CLIENT_ID no servidor)
const GoogleSignIn: React.FC<GoogleSignInProps> = ({ mode = 'signin' }) => {
  const { signInClientWithGoogle } = useAuth();
  const { theme } = useTheme();
  const { addToast } = useToast();
  const history = useHistory();
  const location = useLocation();
  const buttonRef = useRef<HTMLDivElement>(null);
  const [clientId, setClientId] = useState<string | null | undefined>(
    undefined,
  );

  useEffect(() => {
    api
      .get<{ client_id: string | null }>('/clients/sessions/google')
      .then(response => setClientId(response.data.client_id))
      .catch(() => setClientId(null));
  }, []);

  useEffect(() => {
    if (!clientId || !buttonRef.current) return;

    const element = buttonRef.current;
    let active = true;

    loadScript()
      .then(() => {
        if (!active || !window.google) return;

        window.google.accounts.id.initialize({
          client_id: clientId,
          ux_mode: 'popup',
          callback: async ({ credential }) => {
            try {
              const { created } = await signInClientWithGoogle(credential);

              addToast({
                type: 'success',
                title: created ? 'Conta criada com o Google' : 'Bem-vindo!',
                description: created
                  ? 'Falta só o seu telefone para agendar.'
                  : 'Você entrou com a sua conta Google.',
              });

              // Sem telefone, a rota leva para completar o cadastro
              history.push(clientHomeAfterLogin(location.state));
            } catch (err) {
              addToast({
                type: 'error',
                title: 'Não foi possível entrar com o Google',
                description: getApiErrorMessage(err, 'Tente novamente.'),
              });
            }
          },
        });

        element.innerHTML = '';
        window.google.accounts.id.renderButton(element, {
          type: 'standard',
          theme: theme === 'dark' ? 'filled_black' : 'outline',
          size: 'large',
          shape: 'rectangular',
          text: mode === 'signup' ? 'signup_with' : 'continue_with',
          logo_alignment: 'left',
          locale: 'pt-BR',
          width: Math.min(element.clientWidth || 360, 400),
        });
      })
      .catch(() => {
        if (active) setClientId(null);
      });

    // eslint-disable-next-line consistent-return
    return () => {
      active = false;
    };
  }, [
    clientId,
    theme,
    mode,
    signInClientWithGoogle,
    addToast,
    history,
    location.state,
  ]);

  // Sem configuração: nada (nem o divisor)
  if (clientId === null) return null;

  return (
    <>
      <Divider>ou</Divider>
      <Wrapper ref={buttonRef} aria-label="Entrar com o Google" />
    </>
  );
};

export default GoogleSignIn;
