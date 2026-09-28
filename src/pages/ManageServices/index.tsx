import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Redirect } from 'react-router-dom';
import { FiCheck, FiEdit2, FiEye, FiEyeOff, FiPlus } from 'react-icons/fi';

import api from '../../services/api';
import { useAuth } from '../../hooks/Auth';
import { useToast } from '../../hooks/Toast';
import getApiErrorMessage from '../../utils/getApiErrorMessage';
import { formatPrice, parsePrice } from '../../utils/money';
import { formatDuration } from '../../utils/duration';

import AppLayout from '../../components/AppLayout';
import {
  Page,
  PageHeader,
  Card,
  CardHeader,
  CardBody,
  FieldGrid,
  Label,
  TextInput,
  Select,
  UIButton,
  Table,
  Badge,
} from '../../components/ui';

import {
  Columns,
  SideColumn,
  Form,
  ServiceRow,
  SkeletonBar,
  EmptyText,
  InlineRow,
  Counter,
} from './styles';

interface Service {
  id: string;
  name: string;
  duration_minutes: number;
  price_cents: number;
  active: boolean;
}

interface ServiceForm {
  name: string;
  duration_minutes: string;
  price: string;
}

const EMPTY_FORM: ServiceForm = { name: '', duration_minutes: '30', price: '' };

const BUFFER_OPTIONS = [0, 5, 10, 15, 20, 30, 45, 60];

const ManageServices: React.FC = () => {
  const { user } = useAuth();
  const { addToast } = useToast();

  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<ServiceForm>(EMPTY_FORM);
  // Serviço em edição; null = formulário de novo serviço
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [bufferMinutes, setBufferMinutes] = useState(0);
  const [savedBufferMinutes, setSavedBufferMinutes] = useState(0);
  const nameInputRef = useRef<HTMLInputElement>(null);

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

  const handleSubmit = useCallback(
    async (event: React.FormEvent) => {
      event.preventDefault();

      const name = form.name.trim();
      const duration = Number(form.duration_minutes);
      const priceCents = parsePrice(form.price);

      if (!name) {
        showError(null, 'Informe o nome do serviço.');
        return;
      }

      if (
        !Number.isInteger(duration) ||
        duration < 5 ||
        duration > 480 ||
        duration % 5 !== 0
      ) {
        showError(
          null,
          'A duração deve ser de 5 a 480 minutos, em múltiplos de 5.',
        );
        return;
      }

      if (priceCents === null) {
        showError(null, 'Informe o valor no formato 45,00.');
        return;
      }

      const data = {
        name,
        duration_minutes: duration,
        price_cents: priceCents,
      };

      setSaving(true);

      try {
        if (editingId) {
          const current = services.find(service => service.id === editingId);

          await api.put(`/services/${editingId}`, {
            ...data,
            active: current ? current.active : true,
          });
        } else {
          await api.post('/services', data);
        }

        addToast({
          type: 'success',
          title: editingId ? 'Serviço atualizado' : 'Serviço adicionado',
          description: `${name} · ${formatDuration(duration)} · ${formatPrice(
            priceCents,
          )}`,
        });

        setForm(EMPTY_FORM);
        setEditingId(null);
        await loadServices();
      } catch (err) {
        showError(err, 'Verifique os dados do serviço e tente novamente.');
      } finally {
        setSaving(false);
      }
    },
    [form, editingId, services, addToast, showError, loadServices],
  );

  const handleEdit = useCallback((service: Service) => {
    setEditingId(service.id);
    setForm({
      name: service.name,
      duration_minutes: String(service.duration_minutes),
      price: (service.price_cents / 100).toFixed(2).replace('.', ','),
    });
    nameInputRef.current?.focus();
  }, []);

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
                          editing={service.id === editingId}
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
                              onClick={() => handleEdit(service)}
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
                  <h2>{editingId ? 'Editar serviço' : 'Novo serviço'}</h2>
                  <p>Mudanças não alteram agendamentos já feitos.</p>
                </div>
              </CardHeader>

              <CardBody>
                <Form onSubmit={handleSubmit}>
                  <Label>
                    Nome
                    <TextInput
                      ref={nameInputRef}
                      value={form.name}
                      onChange={event =>
                        setForm({ ...form, name: event.target.value })
                      }
                      placeholder="Ex: Cabelo e barba"
                      maxLength={60}
                    />
                  </Label>

                  <FieldGrid>
                    <Label>
                      Duração (min)
                      <TextInput
                        type="number"
                        min={5}
                        max={480}
                        step={5}
                        value={form.duration_minutes}
                        onChange={event =>
                          setForm({
                            ...form,
                            duration_minutes: event.target.value,
                          })
                        }
                      />
                    </Label>

                    <Label>
                      Valor (R$)
                      <TextInput
                        value={form.price}
                        onChange={event =>
                          setForm({ ...form, price: event.target.value })
                        }
                        placeholder="45,00"
                        inputMode="decimal"
                      />
                    </Label>
                  </FieldGrid>

                  <InlineRow>
                    {editingId && (
                      <UIButton
                        type="button"
                        variant="secondary"
                        onClick={() => {
                          setEditingId(null);
                          setForm(EMPTY_FORM);
                        }}
                      >
                        Cancelar
                      </UIButton>
                    )}
                    <UIButton
                      type="submit"
                      disabled={saving}
                      style={{ flex: 1 }}
                    >
                      {editingId ? <FiCheck /> : <FiPlus />}
                      {editingId ? 'Salvar alterações' : 'Adicionar serviço'}
                    </UIButton>
                  </InlineRow>
                </Form>
              </CardBody>
            </Card>

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
    </AppLayout>
  );
};

export default ManageServices;
