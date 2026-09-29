// Tipos da lista e da ficha de clientes (GET /clients/directory e /:id)

export interface ClientSummary {
  // Atendimentos concluídos
  completed: number;
  no_shows: number;
  // Faltas entre os últimos 10 agendamentos (base do alerta)
  recent_no_shows: number;
  canceled: number;
  total_cents: number;
  last_visit: string | null;
  next_appointment: string | null;
}

export interface ClientProfile {
  id: string;
  name: string;
  email: string | null;
  phone: string;
  notes: string | null;
  // Criou a conta no site (entra com e-mail e senha)
  has_account: boolean;
  created_at: string;
  summary: ClientSummary;
  no_show_alert: boolean;
}

export interface ClientHistoryItem {
  id: string;
  date: string;
  end_date: string;
  provider: { id: string; name: string } | null;
  service: { id: string; name: string } | null;
  price_cents: number | null;
  attendance: 'completed' | 'no_show' | null;
  canceled_at: string | null;
  canceled_by: 'provider' | 'client' | null;
  confirmed_at: string | null;
}

export interface ClientDetails extends ClientProfile {
  appointments: ClientHistoryItem[];
}

export interface ClientsPage {
  clients: ClientProfile[];
  total: number;
  page: number;
  per_page: number;
}

export interface NoShowPolicy {
  // Faltas entre os últimos 10 agendamentos para o alerta (0 = desligado)
  alert_threshold: number;
  // Quem está com alerta não agenda pelo site
  block_online: boolean;
}

// Quantos agendamentos entram na conta das faltas (igual à API)
export const RECENT_APPOINTMENTS = 10;
