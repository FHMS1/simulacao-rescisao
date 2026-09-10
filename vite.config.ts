/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  // Raiz por padrão (Cloudflare/Netlify/Vercel servem em '/'). O GitHub Pages
  // serve em /<repo>/, então o workflow define DEPLOY_BASE para esse caso.
  base: process.env.DEPLOY_BASE ?? '/',
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
  },
});
