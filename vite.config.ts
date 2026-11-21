import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    target: 'es2019',
    // Keep the initial download small; scene configs are split out with dynamic import().
    chunkSizeWarningLimit: 300,
  },
  test: {
    environment: 'node',
  },
} as never);
