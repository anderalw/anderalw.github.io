import React, { useCallback, useEffect, useState } from 'react';
import { Redirect } from 'react-router-dom';
import { FiEdit2, FiEye, FiEyeOff, FiPlus } from 'react-icons/fi';

import api from '../../services/api';
import { useAuth } from '../../hooks/Auth';
import { useToast } from '../../hooks/Toast';
import getApiErrorMessage from '../../utils/getApiErrorMessage';
import { formatPrice } from '../../utils/money';
import { formatDuration } from '../../utils/duration';

import AppLayout from '../../components/AppLayout';
import {
  Page,
  PageHeader,
  Card,
  CardHeader,
  CardBody,
  Label,
  Select,
  UIButton,
  Table,
  Badge,
} from '../../components/ui';

import ServiceModal, { Service } from './ServiceModal';
import {
  Columns,
  SideColumn,
  ServiceRow,
  SkeletonBar,
  EmptyText,
  InlineRow,
  Counter,
} from './styles';

// Modal aberto: novo serviço (null) ou edição de um existente
type ModalState = { service: Service | null } | null;

const BUFFER_OPTIONS = [0, 5, 10, 15, 20, 30, 45, 60];

const ManageServices: React.FC = () => {
  const { user } = useAuth();
  const { addToast } = useToast();

  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<ModalState>(null);
  const [bufferMinutes, setBufferMinutes] = useState(0);
  const [savedBufferMinutes, setSavedBufferMinutes] = useState(0);

  const showError = useCallback(
    (err: unknown, fallback: string) => {
      addToast({
        type: 'error',
        title: 'Não foi possível salvar',
        description: getApiErrorMessage(err, fallback),
      });
    },
    [addToast],
  );

  const loadServices = useCallback(async () => {
    const response = await api.get<Service[]>('/services/all');
    setServices(response.data);
  }, []);

  useEffect(() => {
    if (!user.is_admin) return;

    Promise.all([
      loadServices(),
      api.get('/settings/agenda').then(response => {
        setBufferMinutes(response.data.buffer_minutes);
        setSavedBufferMinutes(response.data.buffer_minutes);
      }),
    ])
      .catch(err =>
        showError(
          err,
          'Não foi possível carregar os serviços, tente novamente.',
        ),
      )
      .finally(() => setLoading(false));
  }, [user.is_admin, loadServices, showError]);

  const handleSaveBuffer = useCallback(async () => {
    try {
      await api.put('/settings/agenda', { buffer_minutes: bufferMinutes });
      setSavedBufferMinutes(bufferMinutes);

      addToast({
        type: 'success',
        title: 'Intervalo salvo',
        description:
          bufferMinutes === 0
            ? 'Os atendimentos podem ser marcados em sequência.'
            : `Haverá ${bufferMinutes} min livres depois de cada atendimento.`,
      });
    } catch (err) {
      showError(err, 'Não foi possível salvar o intervalo.');
    }
  }, [bufferMinutes, addToast, showError]);

  const handleSaved = useCallback(() => {
    setModal(null);
    loadServices();
  }, [loadServices]);

  const handleToggleActive = useCallback(
    async (service: Service) => {
      try {
        await api.put(`/services/${service.id}`, {
          name: service.name,
          duration_minutes: service.duration_minutes,
          price_cents: service.price_cents,
          active: !service.active,
        });

        await loadServices();
      } catch (err) {
        showError(err, 'Não foi possível alterar o serviço.');
      }
    },
    [loadServices, showError],
  );

  // Só administradores gerenciam serviços (a API também valida)
  if (!user.is_admin) {
    return <Redirect to="/dashboard" />;
  }

  const activeCount = services.filter(service => service.active).length;

  return (
    <AppLayout>
      <Page>
        <PageHeader>
          <div>
            <h1>Serviços</h1>
            <p>
              O que os clientes podem agendar, com a duração que ocupa na agenda
              e o valor.
            </p>
          </div>
          <div>
            <UIButton type="button" onClick={() => setModal({ service: null })}>
              <FiPlus />
              Novo serviço
            </UIButton>
          </div>
        </PageHeader>

        <Columns>
          <Card>
            <CardHeader>
              <h2>Catálogo</h2>
              <Counter>
                {loading
                  ? '–'
                  : `${activeCount} ${activeCount === 1 ? 'ativo' : 'ativos'}`}
              </Counter>
            </CardHeader>

            {!loading && services.length === 0 ? (
              <EmptyText>
                Nenhum serviço cadastrado. Os clientes só conseguem agendar
                depois que houver pelo menos um serviço ativo.
              </EmptyText>
            ) : (
              <Table>
                <thead>
                  <tr>
                    <th>Serviço</th>
                    <th className="num">Duração</th>
                    <th className="num">Valor</th>
                    <th>Situação</th>
                    <th aria-label="Ações" />
                  </tr>
                </thead>
                <tbody>
                  {loading
                    ? [180, 140, 200, 160].map(width => (
                        <tr key={width}>
                          <td>
                            <SkeletonBar width={width} />
                          </td>
                          <td>
                            <SkeletonBar width={50} />
                          </td>
                          <td>
                            <SkeletonBar width={70} />
                          </td>
                          <td>
                            <SkeletonBar width={60} />
                          </td>
                          <td aria-hidden="true" />
                        </tr>
                      ))
                    : services.map(service => (
                        <ServiceRow
                          key={service.id}
                          inactive={!service.active}
                          editing={!!modal && modal.service?.id === service.id}
                        >
                          <td className="name">
                            <strong>{service.name}</strong>
                          </td>
                          <td className="num">
                            {formatDuration(service.duration_minutes)}
                          </td>
                          <td className="num">
                            {formatPrice(service.price_cents)}
                          </td>
                          <td>
                            <Badge
                              tone={service.active ? 'success' : 'neutral'}
                            >
                              {service.active ? 'Ativo' : 'Desativado'}
                            </Badge>
                          </td>
                          <td className="actions">
                            <UIButton
                              type="button"
                              variant="ghost"
                              size="sm"
                              title={`Editar ${service.name}`}
                              onClick={() => setModal({ service })}
                            >
                              <FiEdit2 />
                              Editar
                            </UIButton>
                            <UIButton
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => handleToggleActive(service)}
                            >
                              {service.active ? <FiEyeOff /> : <FiEye />}
                              {service.active ? 'Desativar' : 'Reativar'}
                            </UIButton>
                          </td>
                        </ServiceRow>
                      ))}
                </tbody>
              </Table>
            )}
          </Card>

          <SideColumn>
            <Card>
              <CardHeader>
                <div>
                  <h2>Intervalo entre atendimentos</h2>
                  <p>Tempo livre depois de cada atendimento.</p>
                </div>
              </CardHeader>

              <CardBody>
                <InlineRow>
                  <Label>
                    Intervalo
                    <Select
                      value={bufferMinutes}
                      onChange={event =>
                        setBufferMinutes(Number(event.target.value))
                      }
                    >
                      {BUFFER_OPTIONS.map(option => (
                        <option key={option} value={option}>
                          {option === 0 ? 'Sem intervalo' : `${option} min`}
                        </option>
                      ))}
                    </Select>
                  </Label>

                  <UIButton
                    type="button"
                    variant="secondary"
                    onClick={handleSaveBuffer}
                    disabled={loading || bufferMinutes === savedBufferMinutes}
                  >
                    Salvar
                  </UIButton>
                </InlineRow>
              </CardBody>
            </Card>
          </SideColumn>
        </Columns>
      </Page>

      {modal && (
        <ServiceModal
          service={modal.service}
          onClose={() => setModal(null)}
          onSaved={handleSaved}
        />
      )}
    </AppLayout>
  );
};

export default ManageServices;
