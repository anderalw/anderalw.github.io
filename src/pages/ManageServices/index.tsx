import React, { useCallback, useEffect, useState } from 'react';
import { Redirect } from 'react-router-dom';
import {
  FiArrowDown,
  FiArrowUp,
  FiEdit2,
  FiEye,
  FiEyeOff,
  FiPlus,
} from 'react-icons/fi';

import api from '../../services/api';
import { useAuth } from '../../hooks/Auth';
import { useToast } from '../../hooks/Toast';
import getApiErrorMessage from '../../utils/getApiErrorMessage';
import { formatPrice } from '../../utils/money';
import { formatDuration } from '../../utils/duration';

import AppLayout from '../../components/AppLayout';
import EmptyState from '../../components/EmptyState';
import AreaTabs from '../../components/AreaTabs';
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
  InlineRow,
  Counter,
} from './styles';

// Modal aberto: novo serviço (null) ou edição de um existente
type ModalState = { service: Service | null } | null;

const BUFFER_OPTIONS = [0, 5, 10, 15, 20, 30, 45, 60];

const ManageServices: React.FC = () => {
  const { can } = useAuth();
  // A tela é de quem tem a permissão (a API também confere)
  const allowed = can('catalog');
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
    if (!allowed) return;

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
  }, [allowed, loadServices, showError]);

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

  // Sobe ou desce um serviço; a ordem da lista é a do site e a de agendar
  const handleMove = useCallback(
    async (index: number, step: -1 | 1) => {
      const target = index + step;

      if (target < 0 || target >= services.length) return;

      const reordered = [...services];
      [reordered[index], reordered[target]] = [
        reordered[target],
        reordered[index],
      ];
      // Muda na hora; se a API recusar, volta como estava
      setServices(reordered);

      try {
        const response = await api.put<Service[]>('/services/order', {
          ids: reordered.map(service => service.id),
        });

        setServices(response.data);
      } catch (err) {
        showError(err, 'Não foi possível mudar a ordem.');
        loadServices();
      }
    },
    [services, loadServices, showError],
  );

  // Só administradores gerenciam serviços (a API também valida)
  if (!allowed) {
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
              O que os clientes podem agendar e os motivos para bloquear um
              horário na agenda.
            </p>
          </div>
          <div>
            <UIButton type="button" onClick={() => setModal({ service: null })}>
              <FiPlus />
              Novo serviço
            </UIButton>
          </div>
        </PageHeader>

        <AreaTabs area="catalog" />

        <Columns>
          <Card>
            <CardHeader>
              <div>
                <h2>Catálogo</h2>
                <p>Use as setas para mudar a ordem em que aparecem no site.</p>
              </div>
              <Counter>
                {loading
                  ? '–'
                  : `${activeCount} ${activeCount === 1 ? 'ativo' : 'ativos'}`}
              </Counter>
            </CardHeader>

            {!loading && services.length === 0 ? (
              <EmptyState
                icon="scissors"
                title="Nenhum serviço cadastrado"
                description="Os clientes só conseguem agendar depois que houver pelo menos um serviço ativo."
                action={
                  <UIButton
                    type="button"
                    size="sm"
                    onClick={() => setModal({ service: null })}
                  >
                    <FiPlus />
                    Novo serviço
                  </UIButton>
                }
              />
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
                    : services.map((service, index) => (
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
                              title="Subir"
                              aria-label={`Subir ${service.name}`}
                              disabled={index === 0}
                              onClick={() => handleMove(index, -1)}
                            >
                              <FiArrowUp />
                            </UIButton>
                            <UIButton
                              type="button"
                              variant="ghost"
                              size="sm"
                              title="Descer"
                              aria-label={`Descer ${service.name}`}
                              disabled={index === services.length - 1}
                              onClick={() => handleMove(index, 1)}
                            >
                              <FiArrowDown />
                            </UIButton>
                            <UIButton
                              type="button"
                              variant="ghost"
                              size="sm"
                              title="Editar"
                              aria-label={`Editar ${service.name}`}
                              onClick={() => setModal({ service })}
                            >
                              <FiEdit2 />
                            </UIButton>
                            <UIButton
                              type="button"
                              variant="ghost"
                              size="sm"
                              title={
                                service.active
                                  ? 'Desativar (some do site)'
                                  : 'Reativar'
                              }
                              aria-label={`${
                                service.active ? 'Desativar' : 'Reativar'
                              } ${service.name}`}
                              onClick={() => handleToggleActive(service)}
                            >
                              {service.active ? <FiEyeOff /> : <FiEye />}
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
