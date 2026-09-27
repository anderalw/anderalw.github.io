import React from 'react';
import { Switch } from 'react-router-dom';

import Route from './Route';

import Landing from '../pages/Landing';
import SignIn from '../pages/SignIn';
import SignUp from '../pages/SignUp';
import Dashboard from '../pages/Dashboard';
import CreateAppointment from '../pages/CreateAppointment';
import SignInClient from '../pages/SignInClient';
import SignUpClient from '../pages/SignUpClient';
import CreateProvider from '../pages/CreateProvider';

const Routes: React.FC = () => (
  <Switch>
    <Route path="/" exact component={Landing} />

    {/* Rotas dos Barbeiros */}
    <Route path="/barbeiro" exact component={SignIn} />
    <Route path="/barbeiro/registo" component={SignUp} />
    <Route path="/dashboard" component={Dashboard} isPrivate />
    <Route path="/admin/create-provider" component={CreateProvider} isPrivate />

    {/* Rotas dos Clientes */}
    <Route path="/cliente/login" component={SignInClient} />
    <Route path="/cliente/registo" component={SignUpClient} />
    <Route path="/agendar" component={CreateAppointment} isClient />
  </Switch>
);

export default Routes;