import React, { useCallback, useEffect, useState } from 'react';
import { Redirect } from 'react-router-dom';
import { FiArrowLeft } from 'react-icons/fi';

import api from '../../services/api';
import { useAuth } from '../../hooks/Auth';
import { useToast } from '../../hooks/Toast';
import getApiErrorMessage from '../../utils/getApiErrorMessage';
import { formatPrice, parsePrice } from '../../utils/money';

import {
  Container,
  Content,
  BackLink,
  Card,
  Row,
  Field,
  PrimaryButton,
  SecondaryButton,
  ServiceList,
  ServiceItem,
  StatusTag,
  EmptyText,
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

function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;

  if (hours === 0) return `${rest} min`;

  return rest === 0 ? `${hours} h` : `${hours} h ${rest} min`;
}

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

  return (
    <Container>
      <Content>
        <BackLink to="/dashboard">
          <FiArrowLeft />
          Voltar ao painel
        </BackLink>

        <h1>Serviços</h1>

        <Card>
          <h2>Intervalo entre atendimentos</h2>
          <p>
            Tempo livre depois de cada atendimento, antes do próximo horário
            disponível.
          </p>

          <Row>
            <Field>
              <span>Intervalo</span>
              <select
                value={bufferMinutes}
                onChange={event => setBufferMinutes(Number(event.target.value))}
              >
                {BUFFER_OPTIONS.map(option => (
                  <option key={option} value={option}>
                    {option === 0 ? 'Sem intervalo' : `${option} min`}
                  </option>
                ))}
              </select>
            </Field>

            <PrimaryButton
              type="button"
              onClick={handleSaveBuffer}
              disabled={loading || bufferMinutes === savedBufferMinutes}
            >
              Salvar intervalo
            </PrimaryButton>
          </Row>
        </Card>

        <Card>
          <h2>{editingId ? 'Editar serviço' : 'Novo serviço'}</h2>
          <p>
            A duração define o tempo que o agendamento ocupa na agenda. Mudar o
            valor ou a duração não altera agendamentos já feitos.
          </p>

          <form onSubmit={handleSubmit}>
            <Row>
              <Field grow>
                <span>Nome</span>
                <input
                  value={form.name}
                  onChange={event =>
                    setForm({ ...form, name: event.target.value })
                  }
                  placeholder="Ex: Cabelo e barba"
                  maxLength={60}
                />
              </Field>

              <Field>
                <span>Duração (min)</span>
                <input
                  type="number"
                  min={5}
                  max={480}
                  step={5}
                  value={form.duration_minutes}
                  onChange={event =>
                    setForm({ ...form, duration_minutes: event.target.value })
                  }
                />
              </Field>

              <Field>
                <span>Valor (R$)</span>
                <input
                  value={form.price}
                  onChange={event =>
                    setForm({ ...form, price: event.target.value })
                  }
                  placeholder="45,00"
                  inputMode="decimal"
                  style={{ width: 110 }}
                />
              </Field>

              <PrimaryButton type="submit" disabled={saving}>
                {editingId ? 'Salvar alterações' : 'Adicionar'}
              </PrimaryButton>

              {editingId && (
                <SecondaryButton
                  type="button"
                  onClick={() => {
                    setEditingId(null);
                    setForm(EMPTY_FORM);
                  }}
                >
                  Cancelar
                </SecondaryButton>
              )}
            </Row>
          </form>

          {!loading && services.length === 0 && (
            <EmptyText>
              Nenhum serviço cadastrado. Os clientes só conseguem agendar depois
              que houver pelo menos um serviço ativo.
            </EmptyText>
          )}

          <ServiceList>
            {services.map(service => (
              <ServiceItem key={service.id} inactive={!service.active}>
                <div className="info">
                  <strong>
                    {service.name}
                    <StatusTag active={service.active}>
                      {service.active ? 'Ativo' : 'Desativado'}
                    </StatusTag>
                  </strong>
                  <small>{formatDuration(service.duration_minutes)}</small>
                </div>

                <span className="price">
                  {formatPrice(service.price_cents)}
                </span>

                <div className="actions">
                  <SecondaryButton
                    type="button"
                    onClick={() => handleEdit(service)}
                  >
                    Editar
                  </SecondaryButton>
                  <SecondaryButton
                    type="button"
                    onClick={() => handleToggleActive(service)}
                  >
                    {service.active ? 'Desativar' : 'Reativar'}
                  </SecondaryButton>
                </div>
              </ServiceItem>
            ))}
          </ServiceList>
        </Card>
      </Content>
    </Container>
  );
};

export default ManageServices;
