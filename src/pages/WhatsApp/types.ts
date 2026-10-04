export type MessageKind =
  | 'reminder'
  | 'appointment_created'
  | 'appointment_rescheduled'
  | 'appointment_canceled'
  | 'series_created'
  | 'series_canceled'
  | 'waitlist_slot'
  | 'membership_due'
  | 'membership_overdue';

export type MessageStatus =
  | 'pending'
  | 'sent'
  | 'failed'
  | 'skipped'
  | 'expired';

export interface WhatsAppMessage {
  id: string;
  kind: MessageKind;
  client_id: string | null;
  client_name: string;
  // 5511999990000
  phone: string | null;
  body: string;
  status: MessageStatus;
  provider: string;
  error: string | null;
  created_at: string;
  sent_at: string | null;
  expires_at: string | null;
  // Abre o WhatsApp com a mensagem pronta
  wa_link: string | null;
}

export const KIND_LABELS: Record<MessageKind, string> = {
  reminder: 'Lembrete (confirmar)',
  appointment_created: 'Horário marcado',
  appointment_rescheduled: 'Horário remarcado',
  appointment_canceled: 'Horário cancelado',
  series_created: 'Cliente fixo: horários',
  series_canceled: 'Cliente fixo: cancelados',
  waitlist_slot: 'Vaga da lista de espera',
  membership_due: 'Assinatura: vencimento',
  membership_overdue: 'Assinatura: em atraso',
};

export const STATUS_LABELS: Record<MessageStatus, string> = {
  pending: 'Para enviar',
  sent: 'Enviada',
  failed: 'Falhou',
  skipped: 'Não enviada',
  expired: 'Perdeu o prazo',
};

// "5511999990000" -> "(11) 99999-0000"
export function formatWhatsApp(phone: string | null): string {
  if (!phone) return 'Sem telefone válido';

  const local = phone.startsWith('55') ? phone.slice(2) : phone;
  const ddd = local.slice(0, 2);
  const number = local.slice(2);
  const split = number.length - 4;

  return `(${ddd}) ${number.slice(0, split)}-${number.slice(split)}`;
}
