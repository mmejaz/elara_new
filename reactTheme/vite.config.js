import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    // Bind on all interfaces so wildcard tenant subdomains (acme.lvh.me, …)
    // reach the dev server from the host and from inside Docker.
    host: true,
    port: 5173,
    strictPort: false,
    // Accept any *.lvh.me host (Vite blocks unknown Host headers by default).
    allowedHosts: ['.lvh.me'],
    // The page is served from a tenant subdomain but the HMR websocket needs a
    // stable, resolvable host; lvh.me → 127.0.0.1 works from any subdomain.
    hmr: {
      host: 'lvh.me',
    },
    // Bind-mounted source in Docker (esp. on Windows/WSL) doesn't emit native
    // file-change events into the container, so HMR misses edits. Poll instead.
    watch: {
      usePolling: true,
      interval: 300,
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.ts',
    css: false,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/**/*.test.{ts,tsx}',
        'src/test/**',
        'src/main.tsx',
        'src/vite-env.d.ts',
        'src/**/*.d.ts',
      ],
    },
  },
})
