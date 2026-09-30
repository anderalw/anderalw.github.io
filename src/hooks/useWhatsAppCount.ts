import { useEffect, useState } from 'react';

import api from '../services/api';

// A cada quanto o menu confere se chegaram mensagens para enviar
const POLL_MS = 60 * 1000;

// Evento disparado pela tela do WhatsApp quando a fila muda
export const WHATSAPP_CHANGED = 'gobarber:whatsapp-changed';

export function notifyWhatsAppChanged(): void {
  window.dispatchEvent(new Event(WHATSAPP_CHANGED));
}

// Quantas mensagens de WhatsApp esperam o envio assistido (número no menu)
export default function useWhatsAppCount(enabled: boolean): number {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!enabled) return undefined;

    let active = true;

    const load = (): void => {
      api
        .get<{ pending: number }>('/whatsapp/messages/count')
        .then(response => {
          if (active) setCount(response.data.pending);
        })
        .catch(() => {
          // Sem a contagem, o menu fica sem o número
        });
    };

    load();

    const timer = window.setInterval(load, POLL_MS);

    window.addEventListener(WHATSAPP_CHANGED, load);

    return () => {
      active = false;
      window.clearInterval(timer);
      window.removeEventListener(WHATSAPP_CHANGED, load);
    };
  }, [enabled]);

  return count;
}
