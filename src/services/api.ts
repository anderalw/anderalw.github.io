import axios from 'axios';

const api = axios.create({
  // Definido no .env (ver .env.example). Sem ele, em desenvolvimento a API
  // passa pelo próprio servidor do Vite (/api, ver vite.config.ts), o que
  // funciona também de outro computador da rede
  baseURL:
    import.meta.env.VITE_API_URL ||
    (import.meta.env.DEV ? '/api' : 'http://localhost:3333'),
  // A API descobre a barbearia pelo endereço aberto no navegador (no
  // computador, o Vite repassa a requisição e o endereço se perderia)
  headers: { 'X-Tenant-Host': window.location.hostname },
});

export default api;
