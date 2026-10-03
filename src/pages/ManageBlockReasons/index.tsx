import React, { useCallback, useEffect, useState } from 'react';
import { Redirect } from 'react-router-dom';
import { FiEdit2, FiPlus, FiTrash2 } from 'react-icons/fi';

import api from '../../services/api';
import { useAuth } from '../../hooks/Auth';
import { useToast } from '../../hooks/Toast';
import getApiErrorMessage from '../../utils/getApiErrorMessage';

import AppLayout from '../../components/AppLayout';
import {
  Page,
  PageHeader,
  Card,
  CardHeader,
  UIButton,
  Table,
} from '../../components/ui';
import {
  ServiceRow,
  SkeletonBar,
  EmptyText,
  Counter,
} from '../ManageServices/styles';

import ReasonModal, { BlockReason } from './ReasonModal';

// Modal aberto: novo motivo (null) ou edição de um existente
type ModalState = { reason: BlockReason | null } | null;

// Cadastro dos motivos que aparecem ao bloquear um horário na agenda
const ManageBlockReasons: React.FC = () => {
  const { can } = useAuth();
  // A tela é de quem tem a permissão (a API também confere)
  const allowed = can('catalog');
  const { addToast } = useToast();

  const [reasons, setReasons] = useState<BlockReason[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<ModalState>(null);
  // Motivo aguardando a confirmação da exclusão
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadReasons = useCallback(async () => {
    const response = await api.get<BlockReason[]>('/block-reasons');
    setReasons(response.data);
  }, []);

  useEffect(() => {
    if (!allowed) return;

    loadReasons()
      .catch(err =>
        addToast({
          type: 'error',
          title: 'Erro ao carregar os motivos',
          description: getApiErrorMessage(err, 'Tente novamente.'),
        }),
      )
      .finally(() => setLoading(false));
  }, [allowed, loadReasons, addToast]);

  const handleSaved = useCallback(() => {
    setModal(null);
    loadReasons();
  }, [loadReasons]);

  const handleDelete = useCallback(
    async (reason: BlockReason) => {
      setDeleting(true);

      try {
        await api.delete(`/block-reasons/${reason.id}`);
        await loadReasons();

        addToast({
          type: 'success',
          title: 'Motivo excluído',
          description: `${reason.name} não aparece mais ao bloquear horários.`,
        });
      } catch (err) {
        addToast({
          type: 'error',
          title: 'Não foi possível excluir',
          description: getApiErrorMessage(err, 'Tente novamente.'),
        });
      } finally {
        setDeleting(false);
        setConfirmingId(null);
      }
    },
    [loadReasons, addToast],
  );

  // Só administradores cadastram motivos (a API também valida)
  if (!allowed) {
    return <Redirect to="/dashboard" />;
  }

  return (
    <AppLayout>
      <Page>
        <PageHeader>
          <div>
            <h1>Motivos de bloqueio</h1>
            <p>
              As opções para escolher ao bloquear um horário na agenda (almoço,
              férias...).
            </p>
          </div>
          <div>
            <UIButton type="button" onClick={() => setModal({ reason: null })}>
              <FiPlus />
              Novo motivo
            </UIButton>
          </div>
        </PageHeader>

        <Card style={{ maxWidth: 720 }}>
          <CardHeader>
            <h2>Motivos</h2>
            <Counter>{loading ? '–' : reasons.length}</Counter>
          </CardHeader>

          {!loading && reasons.length === 0 ? (
            <EmptyText>
              Nenhum motivo cadastrado. É preciso pelo menos um para bloquear
              horários.
            </EmptyText>
          ) : (
            <Table>
              <thead>
                <tr>
                  <th>Motivo</th>
                  <th aria-label="Ações" />
                </tr>
              </thead>
              <tbody>
                {loading
                  ? [140, 100, 120].map(width => (
                      <tr key={width}>
                        <td>
                          <SkeletonBar width={width} />
                        </td>
                        <td aria-hidden="true" />
                      </tr>
                    ))
                  : reasons.map(reason => (
                      <ServiceRow
                        key={reason.id}
                        inactive={false}
                        editing={
                          confirmingId === reason.id ||
                          (!!modal && modal.reason?.id === reason.id)
                        }
                      >
                        <td className="name">
                          <strong>{reason.name}</strong>
                        </td>
                        <td className="actions">
                          {confirmingId === reason.id ? (
                            <>
                              <UIButton
                                type="button"
                                variant="danger"
                                size="sm"
                                disabled={deleting}
                                onClick={() => handleDelete(reason)}
                              >
                                <FiTrash2 />
                                {deleting ? 'Excluindo...' : 'Confirmar'}
                              </UIButton>
                              <UIButton
                                type="button"
                                variant="ghost"
                                size="sm"
                                disabled={deleting}
                                onClick={() => setConfirmingId(null)}
                              >
                                Cancelar
                              </UIButton>
                            </>
                          ) : (
                            <>
                              <UIButton
                                type="button"
                                variant="ghost"
                                size="sm"
                                title={`Editar ${reason.name}`}
                                onClick={() => setModal({ reason })}
                              >
                                <FiEdit2 />
                                Editar
                              </UIButton>
                              <UIButton
                                type="button"
                                variant="ghost"
                                size="sm"
                                title={`Excluir ${reason.name}`}
                                onClick={() => setConfirmingId(reason.id)}
                              >
                                <FiTrash2 />
                                Excluir
                              </UIButton>
                            </>
                          )}
                        </td>
                      </ServiceRow>
                    ))}
              </tbody>
            </Table>
          )}
        </Card>
      </Page>

      {modal && (
        <ReasonModal
          reason={modal.reason}
          onClose={() => setModal(null)}
          onSaved={handleSaved}
        />
      )}
    </AppLayout>
  );
};

export default ManageBlockReasons;
