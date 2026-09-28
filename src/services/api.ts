import axios from 'axios';

const api = axios.create({
  // Definido no .env (ver .env.example); o padrão é a API local
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3333',
});

export default api;
