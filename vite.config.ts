import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  // Os componentes importam React explicitamente (JSX clássico)
  plugins: [react({ jsxRuntime: 'classic' })],
  // Mesma porta do Create React App, que o backend já conhece
  server: { port: 3000, strictPort: true },
  preview: { port: 3000, strictPort: true },
  build: { outDir: 'build' },
});
