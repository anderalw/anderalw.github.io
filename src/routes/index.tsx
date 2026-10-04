import React from 'react';
import { Redirect, Switch } from 'react-router-dom';

import Route from './Route';

import Landing from '../pages/Landing';
import SignIn from '../pages/SignIn';
import ForgotPassword, { ClientForgotPassword } from '../pages/ForgotPassword';
import ResetPassword, { ClientResetPassword } from '../pages/ResetPassword';
import Dashboard from '../pages/Dashboard';
import Profile from '../pages/Profile';
import CreateAppointment from '../pages/CreateAppointment';
import MyAppointments from '../pages/MyAppointments';
import SignInClient from '../pages/SignInClient';
import SignUpClient from '../pages/SignUpClient';
import ManageProviders from '../pages/ManageProviders';
import ManageUsers from '../pages/ManageUsers';
import UserPage from '../pages/ManageUsers/UserPage';
import ChangePassword from '../pages/ChangePassword';
import ManageServices from '../pages/ManageServices';
import ManageBlockReasons from '../pages/ManageBlockReasons';
import Revenue from '../pages/Revenue';
import ConfirmAppointment from '../pages/ConfirmAppointment';
import Clients from '../pages/Clients';
import ClientProfile from '../pages/ClientProfile';
import CashRegister from '../pages/CashRegister';
import Club from '../pages/Club';
import WhatsApp from '../pages/WhatsApp';
import Insights from '../pages/Insights';
import Settings from '../pages/Settings';
import CompleteProfile from '../pages/CompleteProfile';
import VirtualTerminal from '../pages/VirtualTerminal';

const Routes: React.FC = () => (
  <Switch>
    <Route path="/" exact component={Landing} isOpen />

    {/* Rotas dos Barbeiros */}
    <Route path="/barbeiro" exact component={SignIn} />
    <Route path="/barbeiro/esqueci-senha" component={ForgotPassword} />
    {/* Link enviado no e-mail de recuperação (backend) */}
    <Route path="/barbeiro/redefinir-senha" component={ResetPassword} />
    {/* Primeiro acesso: troca da senha provisória */}
    <Route path="/trocar-senha" component={ChangePassword} isPrivate />
    <Route path="/dashboard" component={Dashboard} isPrivate />
    <Route path="/perfil" component={Profile} isPrivate />
    <Route path="/clientes" exact component={Clients} isPrivate />
    <Route path="/clientes/:id" component={ClientProfile} isPrivate />
    <Route path="/caixa" component={CashRegister} isPrivate />
    <Route path="/clube" component={Club} isPrivate />
    <Route path="/whatsapp" component={WhatsApp} isPrivate />
    <Route path="/maquininha-virtual" component={VirtualTerminal} isPrivate />
    <Route path="/admin/servicos" component={ManageServices} isPrivate />
    <Route path="/admin/usuarios" exact component={ManageUsers} isPrivate />
    <Route path="/admin/usuarios/:id" component={UserPage} isPrivate />
    <Route path="/admin/barbeiros" component={ManageProviders} isPrivate />
    <Route path="/admin/faturamento" component={Revenue} isPrivate />
    <Route path="/admin/indicadores" component={Insights} isPrivate />
    <Route path="/admin/configuracoes" component={Settings} isPrivate />
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
    <Route path="/cliente/esqueci-senha" component={ClientForgotPassword} />
    {/* Link enviado no e-mail de recuperação do cliente */}
    <Route path="/cliente/redefinir-senha" component={ClientResetPassword} />
    {/* Link do e-mail da véspera: funciona com ou sem login */}
    <Route path="/confirmar-agendamento" component={ConfirmAppointment} />
    <Route
      path="/cliente/completar-cadastro"
      component={CompleteProfile}
      isClient
    />
    <Route path="/agendar" component={CreateAppointment} isClient />
    <Route path="/meus-agendamentos" component={MyAppointments} isClient />

    {/* Rotas desconhecidas (ex: o antigo /barbeiro/registo) voltam ao início */}
    <Redirect to="/" />
  </Switch>
);

export default Routes;
