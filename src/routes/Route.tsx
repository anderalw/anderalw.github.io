import React from 'react';
import {
  RouteProps as ReactDOMRouteProps,
  Route as ReactDOMRoute,
  Redirect,
} from 'react-router-dom';
import { useAuth } from '../hooks/Auth';

interface RouteProps extends ReactDOMRouteProps {
  // Rota exclusiva de barbeiros
  isPrivate?: boolean;
  // Rota exclusiva de clientes
  isClient?: boolean;
  // Aberta a todos, com ou sem sessão (ex: o site da barbearia)
  isOpen?: boolean;
  component: React.ComponentType;
}

// Onde o cliente informa o telefone (login com Google não traz)
export const COMPLETE_PROFILE = '/cliente/completar-cadastro';

// Página inicial de cada tipo de sessão
const homeByRole = {
  provider: '/dashboard',
  client: '/agendar',
};

const Route: React.FC<RouteProps> = ({
  isPrivate = false,
  isClient = false,
  isOpen = false,
  component: Component,
  ...rest
}) => {
  const { role, client } = useAuth();

  let allowed: boolean;

  if (isOpen) {
    allowed = true;
  } else if (isPrivate) {
    allowed = role === 'provider';
  } else if (isClient) {
    allowed = role === 'client';
  } else {
    // Rotas públicas (login, cadastro, página inicial) só para quem não tem sessão
    allowed = !role;
  }

  let redirectTo: string;

  const mustComplete =
    role === 'client' &&
    isClient &&
    !client?.phone &&
    rest.path !== COMPLETE_PROFILE;

  if (mustComplete) {
    allowed = false;
    redirectTo = COMPLETE_PROFILE;
  } else if (role) {
    redirectTo = homeByRole[role];
  } else {
    redirectTo = isClient ? '/cliente/login' : '/';
  }

  return (
    <ReactDOMRoute
      {...rest}
      render={({ location }) => {
        return allowed ? (
          <Component />
        ) : (
          <Redirect
            to={{
              pathname: redirectTo,
              state: { from: location },
            }}
          />
        );
      }}
    />
  );
};

export default Route;
