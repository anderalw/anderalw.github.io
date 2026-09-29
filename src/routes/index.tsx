import React from 'react';
import { Redirect, Switch } from 'react-router-dom';

import Route from './Route';

import Landing from '../pages/Landing';
import SignIn from '../pages/SignIn';
import ForgotPassword from '../pages/ForgotPassword';
import ResetPassword from '../pages/ResetPassword';
import Dashboard from '../pages/Dashboard';
import Profile from '../pages/Profile';
import CreateAppointment from '../pages/CreateAppointment';
import MyAppointments from '../pages/MyAppointments';
import SignInClient from '../pages/SignInClient';
import SignUpClient from '../pages/SignUpClient';
import ManageProviders from '../pages/ManageProviders';
import ManageServices from '../pages/ManageServices';
import ManageBlockReasons from '../pages/ManageBlockReasons';
import Notifications from '../pages/Notifications';

const Routes: React.FC = () => (
  <Switch>
    <Route path="/" exact component={Landing} />

    {/* Rotas dos Barbeiros */}
    <Route path="/barbeiro" exact component={SignIn} />
    <Route path="/barbeiro/esqueci-senha" component={ForgotPassword} />
    {/* Link enviado no e-mail de recuperação (backend) */}
    <Route path="/barbeiro/redefinir-senha" component={ResetPassword} />
    <Route path="/dashboard" component={Dashboard} isPrivate />
    <Route path="/perfil" component={Profile} isPrivate />
    <Route path="/notificacoes" component={Notifications} isPrivate />
    <Route path="/admin/servicos" component={ManageServices} isPrivate />
    <Route path="/admin/barbeiros" component={ManageProviders} isPrivate />
    <Route
      path="/admin/motivos-bloqueio"
      component={ManageBlockReasons}
      isPrivate
    />
    {/* Endereços antigos das telas de administração */}
    <Redirect from="/admin/services" to="/admin/servicos" />
    <Redirect from="/admin/create-provider" to="/admin/barbeiros" />

    {/* Rotas dos Clientes */}
    <Route path="/cliente/login" component={SignInClient} />
    <Route path="/cliente/cadastro" component={SignUpClient} />
    <Route path="/agendar" component={CreateAppointment} isClient />
    <Route path="/meus-agendamentos" component={MyAppointments} isClient />

    {/* Rotas desconhecidas (ex: o antigo /barbeiro/registo) voltam ao início */}
    <Redirect to="/" />
  </Switch>
);

export default Routes;
