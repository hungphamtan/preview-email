import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
/// <reference types="vitest" />

// https://vite.dev/config/
export default defineConfig({
  base: './',
  plugins: [react()],
  // @ts-expect-error vitest config — resolved via vitest/config types at test time
  test: {
    environment: 'jsdom',
  },
})
