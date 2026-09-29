import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  FiCalendar,
  FiScissors,
  FiSlash,
  FiUsers,
  FiUser,
  FiLogOut,
  FiPlusCircle,
  FiList,
} from 'react-icons/fi';

import { useAuth } from '../../hooks/Auth';
import avatarFallback from '../../utils/avatarFallback';

import {
  Shell,
  Sidebar,
  Brand,
  Nav,
  NavSection,
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

  return (
    <Shell>
      <Sidebar>
        <Brand to={isClient ? '/agendar' : '/dashboard'} title="GoBarber">
          <span>
            <FiScissors />
          </span>
          <strong>GoBarber</strong>
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

            {user.is_admin && (
              <>
                <NavSection>Administração</NavSection>
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
    </Shell>
  );
};

export default AppLayout;
