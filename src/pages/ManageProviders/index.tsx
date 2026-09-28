import React, { useCallback, useEffect, useState } from 'react';
import { Redirect } from 'react-router-dom';
import {
  FiEdit2,
  FiPlus,
  FiPower,
  FiRotateCcw,
  FiAlertTriangle,
} from 'react-icons/fi';

import api from '../../services/api';
import { useAuth } from '../../hooks/Auth';
import { useToast } from '../../hooks/Toast';
import getApiErrorMessage from '../../utils/getApiErrorMessage';
import avatarFallback from '../../utils/avatarFallback';
import scheduleSummary from '../../utils/scheduleSummary';

import AppLayout from '../../components/AppLayout';
import {
  Page,
  PageHeader,
  Card,
  CardHeader,
  UIButton,
  Table,
  Badge,
} from '../../components/ui';

import ProviderModal, { TeamMember } from './ProviderModal';
import {
  MemberRow,
  MemberCell,
  SkeletonBar,
  Counter,
  ConfirmOverlay,
  ConfirmBox,
} from './styles';

// Modal aberto: novo barbeiro (null) ou edição de um existente
type ModalState = { member: TeamMember | null } | null;

const ManageProviders: React.FC = () => {
  const { user } = useAuth();
  const { addToast } = useToast();

  const [team, setTeam] = useState<TeamMember[] | null>(null);
  const [modal, setModal] = useState<ModalState>(null);
  const [confirming, setConfirming] = useState<TeamMember | null>(null);
  const [changingId, setChangingId] = useState<string | null>(null);

  const loadTeam = useCallback(async () => {
    try {
      const response = await api.get<TeamMember[]>('/users');
      setTeam(response.data);
    } catch (err) {
      setTeam(current => current || []);
      addToast({
        type: 'error',
        title: 'Erro ao carregar a equipe',
        description: getApiErrorMessage(
          err,
          'Não foi possível carregar os barbeiros, tente novamente.',
        ),
      });
    }
  }, [addToast]);

  useEffect(() => {
    if (user.is_admin) loadTeam();
  }, [user.is_admin, loadTeam]);

  const handleSaved = useCallback(() => {
    setModal(null);
    loadTeam();
  }, [loadTeam]);

  const setActive = useCallback(
    async (member: TeamMember, active: boolean) => {
      setChangingId(member.id);

      try {
        await api.patch(`/users/${member.id}/active`, { active });

        addToast({
          type: 'success',
          title: active ? 'Barbeiro reativado' : 'Barbeiro desativado',
          description: active
            ? `${member.name} volta a aparecer na agenda e para os clientes.`
            : `${member.name} não aparece mais para os clientes e não consegue entrar.`,
        });

        setConfirming(null);
        await loadTeam();
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
        setChangingId(null);
      }
    },
    [addToast, loadTeam],
  );

  // Esc fecha a confirmação
  useEffect(() => {
    if (!confirming) return undefined;

    function handleKeyDown(event: KeyboardEvent): void {
      if (event.key === 'Escape' && !changingId) setConfirming(null);
    }

    window.addEventListener('keydown', handleKeyDown);

    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [confirming, changingId]);

  // Só administradores gerenciam a equipe (a API também valida)
  if (!user.is_admin) {
    return <Redirect to="/dashboard" />;
  }

  const activeCount = team ? team.filter(member => member.active).length : 0;

  return (
    <AppLayout>
      <Page>
        <PageHeader>
          <div>
            <h1>Barbeiros</h1>
            <p>A equipe da barbearia e os dias e horários de atendimento.</p>
          </div>
          <div>
            <UIButton type="button" onClick={() => setModal({ member: null })}>
              <FiPlus />
              Novo barbeiro
            </UIButton>
          </div>
        </PageHeader>

        <Card>
          <CardHeader>
            <h2>Equipe</h2>
            <Counter>
              {team
                ? `${activeCount} ${activeCount === 1 ? 'ativo' : 'ativos'}`
                : '–'}
            </Counter>
          </CardHeader>

          <Table>
            <thead>
              <tr>
                <th>Barbeiro</th>
                <th>Atendimento</th>
                <th>Situação</th>
                <th aria-label="Ações" />
              </tr>
            </thead>
            <tbody>
              {!team
                ? [0, 1, 2].map(item => (
                    <tr key={item}>
                      <td>
                        <SkeletonBar width={180} />
                      </td>
                      <td>
                        <SkeletonBar width={220} />
                      </td>
                      <td>
                        <SkeletonBar width={60} />
                      </td>
                      <td aria-hidden="true" />
                    </tr>
                  ))
                : team.map(member => {
                    const isYou = member.id === user.id;
                    const summary = scheduleSummary(member.schedules);

                    return (
                      <MemberRow key={member.id} inactive={!member.active}>
                        <td>
                          <MemberCell>
                            <img
                              src={
                                member.avatar_url || avatarFallback(member.name)
                              }
                              alt=""
                              onError={e => {
                                e.currentTarget.src = avatarFallback(
                                  member.name,
                                );
                              }}
                            />
                            <div>
                              <strong>
                                {member.name}
                                {isYou && <Badge tone="primary">Você</Badge>}
                                {member.is_admin && !isYou && (
                                  <Badge>Admin</Badge>
                                )}
                              </strong>
                              <small>{member.email}</small>
                            </div>
                          </MemberCell>
                        </td>
                        <td className="schedule" title={summary}>
                          {summary || (
                            <span className="empty">Sem horários</span>
                          )}
                        </td>
                        <td>
                          <Badge tone={member.active ? 'success' : 'neutral'}>
                            {member.active ? 'Ativo' : 'Desativado'}
                          </Badge>
                        </td>
                        <td className="actions">
                          <UIButton
                            type="button"
                            variant="ghost"
                            size="sm"
                            title={`Editar ${member.name}`}
                            onClick={() => setModal({ member })}
                          >
                            <FiEdit2 />
                            Editar
                          </UIButton>
                          {member.active ? (
                            <UIButton
                              type="button"
                              variant="ghost"
                              size="sm"
                              disabled={isYou}
                              title={
                                isYou
                                  ? 'Você não pode desativar a sua própria conta'
                                  : `Desativar ${member.name}`
                              }
                              onClick={() => setConfirming(member)}
                            >
                              <FiPower />
                              Desativar
                            </UIButton>
                          ) : (
                            <UIButton
                              type="button"
                              variant="ghost"
                              size="sm"
                              disabled={changingId === member.id}
                              onClick={() => setActive(member, true)}
                            >
                              <FiRotateCcw />
                              Reativar
                            </UIButton>
                          )}
                        </td>
                      </MemberRow>
                    );
                  })}
            </tbody>
          </Table>
        </Card>
      </Page>

      {modal && (
        <ProviderModal
          member={modal.member}
          onClose={() => setModal(null)}
          onSaved={handleSaved}
        />
      )}

      {confirming && (
        <ConfirmOverlay
          onMouseDown={event => {
            if (event.target === event.currentTarget && !changingId) {
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
            <h2 id="confirm-title">{`Desativar ${confirming.name}?`}</h2>
            <p>
              Ele deixa de aparecer para os clientes e na agenda e não consegue
              mais entrar no sistema. Os horários ficam guardados e você pode
              reativar quando quiser.
            </p>
            <p className="note">
              Se ele tiver agendamentos futuros, remarque ou cancele antes.
            </p>
            <footer>
              <UIButton
                type="button"
                variant="secondary"
                onClick={() => setConfirming(null)}
                disabled={!!changingId}
                autoFocus
              >
                Cancelar
              </UIButton>
              <UIButton
                type="button"
                variant="danger"
                onClick={() => setActive(confirming, false)}
                disabled={!!changingId}
              >
                <FiPower />
                {changingId ? 'Desativando...' : 'Desativar'}
              </UIButton>
            </footer>
          </ConfirmBox>
        </ConfirmOverlay>
      )}
    </AppLayout>
  );
};

export default ManageProviders;
