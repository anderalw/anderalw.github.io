import React from 'react';
import { Redirect, Switch } from 'react-router-dom';

import Route from './Route';

import Landing from '../pages/Landing';
import SignIn from '../pages/SignIn';
import Dashboard from '../pages/Dashboard';
import CreateAppointment from '../pages/CreateAppointment';
import MyAppointments from '../pages/MyAppointments';
import SignInClient from '../pages/SignInClient';
import SignUpClient from '../pages/SignUpClient';
import CreateProvider from '../pages/CreateProvider';
import ManageServices from '../pages/ManageServices';

const Routes: React.FC = () => (
  <Switch>
    <Route path="/" exact component={Landing} />

    {/* Rotas dos Barbeiros */}
    <Route path="/barbeiro" exact component={SignIn} />
    <Route path="/dashboard" component={Dashboard} isPrivate />
    <Route path="/admin/create-provider" component={CreateProvider} isPrivate />
    <Route path="/admin/services" component={ManageServices} isPrivate />

    {/* Rotas dos Clientes */}
    <Route path="/cliente/login" component={SignInClient} />
    <Route path="/cliente/registo" component={SignUpClient} />
    <Route path="/agendar" component={CreateAppointment} isClient />
    <Route path="/meus-agendamentos" component={MyAppointments} isClient />

    {/* Rotas desconhecidas (ex: o antigo /barbeiro/registo) voltam ao início */}
    <Redirect to="/" />
  </Switch>
);

export default Routes;
