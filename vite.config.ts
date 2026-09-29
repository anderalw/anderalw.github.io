import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Backend local, para onde o servidor de desenvolvimento repassa a API e os
// arquivos (fotos). Assim o navegador só fala com a porta 3000 e o sistema
// abre também de outro computador da rede (http://IP-desta-máquina:3000)
const API = 'http://localhost:3333';

export default defineConfig({
  // Os componentes importam React explicitamente (JSX clássico)
  plugins: [react({ jsxRuntime: 'classic' })],
  // Mesma porta do Create React App, que o backend já conhece
  server: {
    port: 3000,
    strictPort: true,
    // Atende também pela rede local, não só em localhost
    host: true,
    proxy: {
      '/api': {
        target: API,
        changeOrigin: true,
        rewrite: path => path.replace(/^\/api/, ''),
      },
      '/files': { target: API, changeOrigin: true },
    },
  },
  preview: { port: 3000, strictPort: true },
  build: { outDir: 'build' },
});
