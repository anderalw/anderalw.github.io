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
  component: React.ComponentType;
}

// Página inicial de cada tipo de sessão
const homeByRole = {
  provider: '/dashboard',
  client: '/agendar',
};

const Route: React.FC<RouteProps> = ({
  isPrivate = false,
  isClient = false,
  component: Component,
  ...rest
}) => {
  const { role } = useAuth();

  let allowed: boolean;

  if (isPrivate) {
    allowed = role === 'provider';
  } else if (isClient) {
    allowed = role === 'client';
  } else {
    // Rotas públicas (login, registo, landing) só para quem não tem sessão
    allowed = !role;
  }

  let redirectTo: string;

  if (role) {
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
