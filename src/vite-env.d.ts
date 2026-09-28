/// <reference types="vite/client" />

interface ImportMetaEnv {
  // Endereço da API (ver .env.example)
  readonly VITE_API_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
