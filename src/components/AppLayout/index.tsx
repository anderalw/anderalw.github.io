import React, { useCallback, useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  FiBell,
  FiCalendar,
  FiDollarSign,
  FiScissors,
  FiSlash,
  FiUsers,
  FiShield,
  FiUser,
  FiLogOut,
  FiPlusCircle,
  FiList,
  FiUserCheck,
  FiInbox,
  FiBarChart2,
  FiSettings,
  FiAward,
} from 'react-icons/fi';
import { FaWhatsapp } from 'react-icons/fa';

import { useAuth } from '../../hooks/Auth';
import { useNotifications } from '../../hooks/Notifications';
import { useBranding } from '../../hooks/Branding';
import BrandMark, { BrandName } from '../BrandMark';
import ThemeToggle from '../ThemeToggle';
import avatarFallback from '../../utils/avatarFallback';
import NotificationsPanel from '../NotificationsPanel';
import useWhatsAppCount from '../../hooks/useWhatsAppCount';

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
  const { user, client, role, signOut, can } = useAuth();
  const isClient = role === 'client';
  const { unread } = useNotifications();
  const { branding } = useBranding();
  const unreadLabel = unread > 99 ? '99+' : String(unread);
  // Mensagens esperando o envio assistido
  const whatsappPending = useWhatsAppCount(
    role === 'provider' && can('whatsapp'),
  );
  // Itens de gestão que a pessoa pode ver
  const showReports = can('reports');
  const showCatalog = can('catalog');
  const showTeam = can('team');
  const showSettings = can('settings');
  const showManagement = showReports || showCatalog || showTeam || showSettings;
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

            {can('clients') && (
              <NavLink to="/clientes" title="Clientes">
                <FiUserCheck />
                <span>Clientes</span>
              </NavLink>
            )}
            {(can('cash') || can('cash.close')) && (
              <NavLink to="/caixa" title="Caixa">
                <FiInbox />
                <span>Caixa</span>
              </NavLink>
            )}
            {can('club') && (
              <NavLink to="/clube" title="Clube de assinatura">
                <FiAward />
                <span>Clube</span>
              </NavLink>
            )}
            {can('whatsapp') && (
              <NavLink
                to="/whatsapp"
                title={
                  whatsappPending > 0
                    ? `WhatsApp (${whatsappPending} para enviar)`
                    : 'WhatsApp'
                }
              >
                <FaWhatsapp />
                <span>WhatsApp</span>
                {whatsappPending > 0 && (
                  <NavBadge aria-label={`${whatsappPending} para enviar`}>
                    {whatsappPending > 99 ? '99+' : whatsappPending}
                  </NavBadge>
                )}
              </NavLink>
            )}

            {showManagement && <NavSection>Administração</NavSection>}
            {showReports && (
              <>
                <NavLink to="/admin/faturamento" title="Faturamento">
                  <FiDollarSign />
                  <span>Faturamento</span>
                </NavLink>
                <NavLink to="/admin/indicadores" title="Indicadores">
                  <FiBarChart2 />
                  <span>Indicadores</span>
                </NavLink>
              </>
            )}
            {showCatalog && (
              <NavLink to="/admin/servicos" title="Serviços">
                <FiScissors />
                <span>Serviços</span>
              </NavLink>
            )}
            {showTeam && (
              <>
                <NavLink to="/admin/usuarios" title="Usuários e perfis">
                  <FiShield />
                  <span>Usuários</span>
                </NavLink>
                <NavLink to="/admin/barbeiros" title="Barbeiros">
                  <FiUsers />
                  <span>Barbeiros</span>
                </NavLink>
              </>
            )}
            {showCatalog && (
              <NavLink to="/admin/motivos-bloqueio" title="Motivos de bloqueio">
                <FiSlash />
                <span>Motivos de bloqueio</span>
              </NavLink>
            )}
            {showSettings && (
              <NavLink to="/admin/configuracoes" title="Configurações">
                <FiSettings />
                <span>Configurações</span>
              </NavLink>
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

          <ThemeToggle />
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
