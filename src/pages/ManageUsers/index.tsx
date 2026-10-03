import React, { useCallback, useEffect, useState } from 'react';
import { Redirect } from 'react-router-dom';
import {
  FiAlertTriangle,
  FiEdit2,
  FiPlus,
  FiPower,
  FiRotateCcw,
  FiTrash2,
} from 'react-icons/fi';

import api from '../../services/api';
import { useAuth } from '../../hooks/Auth';
import { useToast } from '../../hooks/Toast';
import getApiErrorMessage from '../../utils/getApiErrorMessage';
import avatarFallback from '../../utils/avatarFallback';

import AppLayout from '../../components/AppLayout';
import {
  Page,
  PageHeader,
  Card,
  UIButton,
  Table,
  Badge,
} from '../../components/ui';
import {
  SkeletonBar,
  ConfirmOverlay,
  ConfirmBox,
} from '../ManageProviders/styles';

import UserModal from './UserModal';
import RoleModal from './RoleModal';
import { PermissionItem, RoleItem, StaffUser } from './types';
import { Tabs, Tab, Person, Row, Muted } from './styles';

type View = 'users' | 'roles';

// O que precisa de confirmação antes
type Confirming =
  | { kind: 'deactivate'; user: StaffUser }
  | { kind: 'delete-role'; role: RoleItem };

const ManageUsers: React.FC = () => {
  const { user: me, can } = useAuth();
  const { addToast } = useToast();
  const allowed = can('team');

  const [view, setView] = useState<View>('users');
  const [users, setUsers] = useState<StaffUser[] | null>(null);
  const [roles, setRoles] = useState<RoleItem[] | null>(null);
  const [catalog, setCatalog] = useState<PermissionItem[]>([]);
  const [editingUser, setEditingUser] = useState<StaffUser | null | undefined>(
    undefined,
  );
  const [editingRole, setEditingRole] = useState<RoleItem | null | undefined>(
    undefined,
  );
  const [confirming, setConfirming] = useState<Confirming | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const [usersResponse, rolesResponse, catalogResponse] = await Promise.all(
        [
          api.get<StaffUser[]>('/users'),
          api.get<RoleItem[]>('/roles'),
          api.get<PermissionItem[]>('/roles/permissions'),
        ],
      );

      setUsers(usersResponse.data);
      setRoles(rolesResponse.data);
      setCatalog(catalogResponse.data);
    } catch (err) {
      setUsers(current => current || []);
      setRoles(current => current || []);
      addToast({
        type: 'error',
        title: 'Erro ao carregar',
        description: getApiErrorMessage(
          err,
          'Não foi possível carregar os usuários, tente novamente.',
        ),
      });
    }
  }, [addToast]);

  useEffect(() => {
    if (allowed) load();
  }, [allowed, load]);

  const setActive = useCallback(
    async (target: StaffUser, active: boolean) => {
      setBusy(true);

      try {
        await api.patch(`/users/${target.id}/active`, { active });

        addToast({
          type: 'success',
          title: active ? 'Usuário reativado' : 'Usuário desativado',
          description: active
            ? `${target.name} volta a entrar no sistema.`
            : `${target.name} não consegue mais entrar no sistema.`,
        });

        setConfirming(null);
        await load();
      } catch (err) {
        setConfirming(null);
        addToast({
          type: 'error',
          title: active
            ? 'Não foi possível reativar'
            : 'Não foi possível desativar',
          description: getApiErrorMessage(err, 'Tente novamente.'),
        });
      } finally {
        setBusy(false);
      }
    },
    [addToast, load],
  );

  const deleteRole = useCallback(
    async (role: RoleItem) => {
      setBusy(true);

      try {
        await api.delete(`/roles/${role.id}`);
        addToast({ type: 'success', title: `Perfil ${role.name} excluído` });
        setConfirming(null);
        await load();
      } catch (err) {
        setConfirming(null);
        addToast({
          type: 'error',
          title: 'Não foi possível excluir',
          description: getApiErrorMessage(err, 'Tente novamente.'),
        });
      } finally {
        setBusy(false);
      }
    },
    [addToast, load],
  );

  // Esc fecha a confirmação
  useEffect(() => {
    if (!confirming) return undefined;

    function handleKeyDown(event: KeyboardEvent): void {
      if (event.key === 'Escape' && !busy) setConfirming(null);
    }

    window.addEventListener('keydown', handleKeyDown);

    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [confirming, busy]);

  // Só quem gerencia a equipe (a API também valida)
  if (!allowed) {
    return <Redirect to="/dashboard" />;
  }

  const skeleton = (columns: number[]): JSX.Element[] =>
    [0, 1, 2].map(item => (
      <tr key={item}>
        {columns.map(width => (
          <td key={width}>
            <SkeletonBar width={width} />
          </td>
        ))}
        <td aria-hidden="true" />
      </tr>
    ));

  return (
    <AppLayout>
      <Page>
        <PageHeader>
          <div>
            <h1>Usuários</h1>
            <p>Quem entra no sistema e o que cada um pode fazer.</p>
          </div>
          <div>
            {view === 'users' ? (
              <UIButton
                type="button"
                disabled={!roles}
                onClick={() => setEditingUser(null)}
              >
                <FiPlus />
                Novo usuário
              </UIButton>
            ) : (
              <UIButton type="button" onClick={() => setEditingRole(null)}>
                <FiPlus />
                Novo perfil
              </UIButton>
            )}
          </div>
        </PageHeader>

        <Tabs role="tablist">
          <Tab
            type="button"
            role="tab"
            aria-selected={view === 'users'}
            selected={view === 'users'}
            onClick={() => setView('users')}
          >
            Usuários
          </Tab>
          <Tab
            type="button"
            role="tab"
            aria-selected={view === 'roles'}
            selected={view === 'roles'}
            onClick={() => setView('roles')}
          >
            Perfis de acesso
          </Tab>
        </Tabs>

        <Card>
          {view === 'users' ? (
            <Table>
              <thead>
                <tr>
                  <th>Usuário</th>
                  <th>Perfil</th>
                  <th>Barbeiro</th>
                  <th>Situação</th>
                  <th aria-label="Ações" />
                </tr>
              </thead>
              <tbody>
                {!users
                  ? skeleton([200, 100, 60, 70])
                  : users.map(item => {
                      const isYou = item.id === me.id;

                      return (
                        <Row key={item.id} inactive={!item.active}>
                          <td>
                            <Person>
                              <img
                                src={
                                  item.avatar_url || avatarFallback(item.name)
                                }
                                alt=""
                                onError={e => {
                                  e.currentTarget.src = avatarFallback(
                                    item.name,
                                  );
                                }}
                              />
                              <div>
                                <strong>
                                  {item.name}
                                  {isYou && <Badge tone="primary">Você</Badge>}
                                </strong>
                                <small>{item.email}</small>
                              </div>
                            </Person>
                          </td>
                          <td>
                            {item.role ? (
                              <Badge
                                tone={
                                  item.role.is_admin ? 'primary' : 'neutral'
                                }
                              >
                                {item.role.name}
                              </Badge>
                            ) : (
                              <Muted>Sem perfil</Muted>
                            )}
                          </td>
                          <td>{item.is_barber ? 'Sim' : <Muted>Não</Muted>}</td>
                          <td>
                            <Badge tone={item.active ? 'success' : 'neutral'}>
                              {item.active ? 'Ativo' : 'Desativado'}
                            </Badge>
                          </td>
                          <td className="actions">
                            <UIButton
                              type="button"
                              variant="ghost"
                              size="sm"
                              title={`Editar ${item.name}`}
                              onClick={() => setEditingUser(item)}
                            >
                              <FiEdit2 />
                              Editar
                            </UIButton>
                            {item.active ? (
                              <UIButton
                                type="button"
                                variant="ghost"
                                size="sm"
                                disabled={isYou}
                                title={
                                  isYou
                                    ? 'Você não pode desativar a sua própria conta'
                                    : `Desativar ${item.name}`
                                }
                                onClick={() =>
                                  setConfirming({
                                    kind: 'deactivate',
                                    user: item,
                                  })
                                }
                              >
                                <FiPower />
                                Desativar
                              </UIButton>
                            ) : (
                              <UIButton
                                type="button"
                                variant="ghost"
                                size="sm"
                                disabled={busy}
                                onClick={() => setActive(item, true)}
                              >
                                <FiRotateCcw />
                                Reativar
                              </UIButton>
                            )}
                          </td>
                        </Row>
                      );
                    })}
              </tbody>
            </Table>
          ) : (
            <Table>
              <thead>
                <tr>
                  <th>Perfil</th>
                  <th>Permissões</th>
                  <th>Usuários</th>
                  <th aria-label="Ações" />
                </tr>
              </thead>
              <tbody>
                {!roles
                  ? skeleton([140, 220, 40])
                  : roles.map(role => (
                      <Row key={role.id}>
                        <td>
                          <strong>{role.name}</strong>
                        </td>
                        <td>
                          {role.is_admin && 'Todas'}
                          {!role.is_admin &&
                            (role.permissions.length === 0 ? (
                              <Muted>Só a própria agenda</Muted>
                            ) : (
                              `${role.permissions.length} de ${catalog.length}`
                            ))}
                        </td>
                        <td>{role.users}</td>
                        <td className="actions">
                          <UIButton
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditingRole(role)}
                          >
                            <FiEdit2 />
                            {role.is_admin ? 'Ver' : 'Editar'}
                          </UIButton>
                          {!role.is_admin && (
                            <UIButton
                              type="button"
                              variant="ghost"
                              size="sm"
                              disabled={role.users > 0}
                              title={
                                role.users > 0
                                  ? 'Troque o perfil dos usuários antes de excluir'
                                  : `Excluir ${role.name}`
                              }
                              onClick={() =>
                                setConfirming({ kind: 'delete-role', role })
                              }
                            >
                              <FiTrash2 />
                              Excluir
                            </UIButton>
                          )}
                        </td>
                      </Row>
                    ))}
              </tbody>
            </Table>
          )}
        </Card>
      </Page>

      {editingUser !== undefined && roles && (
        <UserModal
          user={editingUser}
          roles={roles}
          isYou={editingUser?.id === me.id}
          onClose={() => setEditingUser(undefined)}
          onSaved={() => {
            setEditingUser(undefined);
            load();
          }}
        />
      )}

      {editingRole !== undefined && (
        <RoleModal
          role={editingRole}
          catalog={catalog}
          onClose={() => setEditingRole(undefined)}
          onSaved={() => {
            setEditingRole(undefined);
            load();
          }}
        />
      )}

      {confirming && (
        <ConfirmOverlay
          onMouseDown={event => {
            if (event.target === event.currentTarget && !busy) {
              setConfirming(null);
            }
          }}
        >
          <ConfirmBox
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="confirm-title"
          >
            <span className="icon">
              <FiAlertTriangle />
            </span>
            <h2 id="confirm-title">
              {confirming.kind === 'deactivate'
                ? `Desativar ${confirming.user.name}?`
                : `Excluir o perfil ${confirming.role.name}?`}
            </h2>
            <p>
              {confirming.kind === 'deactivate'
                ? 'A pessoa não consegue mais entrar no sistema e, se for barbeiro, sai da agenda e do site. Você pode reativar quando quiser.'
                : 'Nenhum usuário usa este perfil. Ele some da lista de perfis.'}
            </p>
            {confirming.kind === 'deactivate' && (
              <p className="note">
                Se ela tiver agendamentos futuros, remarque ou cancele antes.
              </p>
            )}
            <footer>
              <UIButton
                type="button"
                variant="secondary"
                onClick={() => setConfirming(null)}
                disabled={busy}
                autoFocus
              >
                Cancelar
              </UIButton>
              <UIButton
                type="button"
                variant="danger"
                disabled={busy}
                onClick={() =>
                  confirming.kind === 'deactivate'
                    ? setActive(confirming.user, false)
                    : deleteRole(confirming.role)
                }
              >
                {confirming.kind === 'deactivate' ? <FiPower /> : <FiTrash2 />}
                {busy && 'Aguarde...'}
                {!busy &&
                  (confirming.kind === 'deactivate' ? 'Desativar' : 'Excluir')}
              </UIButton>
            </footer>
          </ConfirmBox>
        </ConfirmOverlay>
      )}
    </AppLayout>
  );
};

export default ManageUsers;
