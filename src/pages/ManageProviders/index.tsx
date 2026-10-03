import React, { useCallback, useEffect, useState } from 'react';
import { Redirect } from 'react-router-dom';
import { FiClock, FiPlus, FiUserMinus, FiAlertTriangle } from 'react-icons/fi';

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

import ProviderModal, { Candidate, TeamMember } from './ProviderModal';
import {
  MemberRow,
  MemberCell,
  SkeletonBar,
  Counter,
  ConfirmOverlay,
  ConfirmBox,
} from './styles';

// Modal aberto: adicionar barbeiro (null) ou os horários de um existente
type ModalState = { member: TeamMember | null } | null;

const ManageProviders: React.FC = () => {
  const { user, can } = useAuth();
  const { addToast } = useToast();
  const allowed = can('team');

  const [team, setTeam] = useState<TeamMember[] | null>(null);
  // Usuários ativos que ainda não atendem (para adicionar)
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [modal, setModal] = useState<ModalState>(null);
  const [confirming, setConfirming] = useState<TeamMember | null>(null);
  const [changingId, setChangingId] = useState<string | null>(null);

  const loadTeam = useCallback(async () => {
    try {
      const [barbers, users] = await Promise.all([
        api.get<TeamMember[]>('/barbers'),
        api.get<Array<Candidate & { active: boolean; is_barber: boolean }>>(
          '/users',
        ),
      ]);

      setTeam(barbers.data);
      setCandidates(users.data.filter(item => item.active && !item.is_barber));
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
    if (allowed) loadTeam();
  }, [allowed, loadTeam]);

  const handleSaved = useCallback(() => {
    setModal(null);
    loadTeam();
  }, [loadTeam]);

  const removeBarber = useCallback(
    async (member: TeamMember) => {
      setChangingId(member.id);

      try {
        await api.delete(`/barbers/${member.id}`);

        addToast({
          type: 'success',
          title: 'Saiu da agenda',
          description: `${member.name} continua com acesso ao sistema, mas não atende mais.`,
        });

        setConfirming(null);
        await loadTeam();
      } catch (err) {
        setConfirming(null);
        addToast({
          type: 'error',
          title: 'Não foi possível tirar da agenda',
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

  // Só quem gerencia a equipe (a API também valida)
  if (!allowed) {
    return <Redirect to="/dashboard" />;
  }

  const activeCount = team ? team.filter(member => member.active).length : 0;

  return (
    <AppLayout>
      <Page>
        <PageHeader>
          <div>
            <h1>Barbeiros</h1>
            <p>Quem atende na barbearia e os dias e horários de cada um.</p>
          </div>
          <div>
            <UIButton
              type="button"
              disabled={!team}
              onClick={() => setModal({ member: null })}
            >
              <FiPlus />
              Adicionar barbeiro
            </UIButton>
          </div>
        </PageHeader>

        <Card>
          <CardHeader>
            <h2>Na agenda</h2>
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
                            title={`Horários de ${member.name}`}
                            onClick={() => setModal({ member })}
                          >
                            <FiClock />
                            Horários
                          </UIButton>
                          <UIButton
                            type="button"
                            variant="ghost"
                            size="sm"
                            title={`Tirar ${member.name} da agenda`}
                            onClick={() => setConfirming(member)}
                          >
                            <FiUserMinus />
                            Tirar da agenda
                          </UIButton>
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
          candidates={candidates}
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
            <h2 id="confirm-title">{`Tirar ${confirming.name} da agenda?`}</h2>
            <p>
              Ele deixa de aparecer na agenda e para os clientes, mas continua
              entrando no sistema com o perfil dele. Os horários ficam guardados
              se ele voltar a atender.
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
                onClick={() => removeBarber(confirming)}
                disabled={!!changingId}
              >
                <FiUserMinus />
                {changingId ? 'Tirando...' : 'Tirar da agenda'}
              </UIButton>
            </footer>
          </ConfirmBox>
        </ConfirmOverlay>
      )}
    </AppLayout>
  );
};

export default ManageProviders;
