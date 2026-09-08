import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import yaml from '@modyfi/vite-plugin-yaml';

export default defineConfig({
  plugins: [react(), tailwindcss(), yaml()],
  test: {
    globals: true,
    environment: 'node',
  },
});
