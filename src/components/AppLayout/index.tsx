import React, { useCallback, useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  FiBell,
  FiCalendar,
  FiDollarSign,
  FiScissors,
  FiSlash,
  FiUsers,
  FiUser,
  FiLogOut,
  FiPlusCircle,
  FiList,
  FiUserCheck,
  FiInbox,
  FiBarChart2,
  FiSettings,
} from 'react-icons/fi';

import { useAuth } from '../../hooks/Auth';
import { useNotifications } from '../../hooks/Notifications';
import { useBranding } from '../../hooks/Branding';
import BrandMark, { BrandName } from '../BrandMark';
import avatarFallback from '../../utils/avatarFallback';
import NotificationsPanel from '../NotificationsPanel';

import {
  Shell,
  Sidebar,
  Brand,
  Nav,
  NavSection,
  NavBadge,
  NavButton,
  Extra,
  UserArea,
  UserInfo,
  ClientInfo,
  SignOutButton,
  Main,
} from './styles';

interface AppLayoutProps {
  // Conteúdo extra do menu lateral, abaixo dos links (ex: o calendário da
  // agenda)
  sidebarExtra?: React.ReactNode;
}

// Estrutura das telas com sessão (barbeiro ou cliente): menu lateral fixo e
// o conteúdo à direita
const AppLayout: React.FC<AppLayoutProps> = ({ sidebarExtra, children }) => {
  const { user, client, role, signOut } = useAuth();
  const isClient = role === 'client';
  const { unread } = useNotifications();
  const { branding } = useBranding();
  const unreadLabel = unread > 99 ? '99+' : String(unread);
  // Botão que abriu o painel de notificações (null = fechado)
  const [panelAnchor, setPanelAnchor] = useState<HTMLElement | null>(null);

  const closePanel = useCallback(() => {
    // Devolve o foco ao botão do menu
    panelAnchor?.focus();
    setPanelAnchor(null);
  }, [panelAnchor]);

  return (
    <Shell>
      <Sidebar>
        <Brand to={isClient ? '/agendar' : '/dashboard'} title={branding.name}>
          <BrandMark size={30} />
          <BrandName>{branding.name}</BrandName>
        </Brand>

        {isClient ? (
          <Nav aria-label="Menu principal">
            <NavLink to="/agendar" title="Agendar horário">
              <FiPlusCircle />
              <span>Agendar horário</span>
            </NavLink>
            <NavLink to="/meus-agendamentos" title="Meus agendamentos">
              <FiList />
              <span>Meus agendamentos</span>
            </NavLink>
          </Nav>
        ) : (
          <Nav aria-label="Menu principal">
            <NavLink to="/dashboard" title="Agenda">
              <FiCalendar />
              <span>Agenda</span>
            </NavLink>
            {/* Abre o painel suspenso, sem sair da tela atual */}
            <NavButton
              type="button"
              aria-haspopup="dialog"
              aria-expanded={!!panelAnchor}
              className={panelAnchor ? 'active' : undefined}
              title={
                unread > 0
                  ? `Notificações (${unread} não lidas)`
                  : 'Notificações'
              }
              onClick={event => {
                const button = event.currentTarget;

                setPanelAnchor(current => (current ? null : button));
              }}
            >
              <FiBell />
              <span>Notificações</span>
              {unread > 0 && (
                <NavBadge aria-label={`${unread} não lidas`}>
                  {unreadLabel}
                </NavBadge>
              )}
            </NavButton>

            <NavLink to="/clientes" title="Clientes">
              <FiUserCheck />
              <span>Clientes</span>
            </NavLink>
            <NavLink to="/caixa" title="Caixa">
              <FiInbox />
              <span>Caixa</span>
            </NavLink>

            {user.is_admin && (
              <>
                <NavSection>Administração</NavSection>
                <NavLink to="/admin/faturamento" title="Faturamento">
                  <FiDollarSign />
                  <span>Faturamento</span>
                </NavLink>
                <NavLink to="/admin/indicadores" title="Indicadores">
                  <FiBarChart2 />
                  <span>Indicadores</span>
                </NavLink>
                <NavLink to="/admin/servicos" title="Serviços">
                  <FiScissors />
                  <span>Serviços</span>
                </NavLink>
                <NavLink to="/admin/barbeiros" title="Barbeiros">
                  <FiUsers />
                  <span>Barbeiros</span>
                </NavLink>
                <NavLink
                  to="/admin/motivos-bloqueio"
                  title="Motivos de bloqueio"
                >
                  <FiSlash />
                  <span>Motivos de bloqueio</span>
                </NavLink>
                <NavLink to="/admin/configuracoes" title="Configurações">
                  <FiSettings />
                  <span>Configurações</span>
                </NavLink>
              </>
            )}
          </Nav>
        )}

        {sidebarExtra && <Extra>{sidebarExtra}</Extra>}

        <UserArea>
          {isClient ? (
            <ClientInfo title={client.email}>
              <img src={avatarFallback(client.name)} alt="" />
              <div>
                <strong>{client.name}</strong>
                <small>{client.email}</small>
              </div>
            </ClientInfo>
          ) : (
            <UserInfo to="/perfil" title="Meu perfil">
              <img
                src={user.avatar_url || avatarFallback(user.name)}
                alt=""
                onError={e => {
                  e.currentTarget.src = avatarFallback(user.name);
                }}
              />
              <div>
                <strong>{user.name}</strong>
                <small>
                  <FiUser />
                  Meu perfil
                </small>
              </div>
            </UserInfo>
          )}

          <SignOutButton type="button" onClick={signOut} title="Sair">
            <FiLogOut />
          </SignOutButton>
        </UserArea>
      </Sidebar>

      <Main>{children}</Main>

      {panelAnchor && (
        <NotificationsPanel anchor={panelAnchor} onClose={closePanel} />
      )}
    </Shell>
  );
};

export default AppLayout;
