import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
        proxy: {
          // SSE streaming endpoint - direct to service (bypass gateway)
          '/api/service/v1/executions': {
            target: 'http://localhost:8081',
            changeOrigin: true,
            secure: false,
            ws: false,
            // Critical: configure for SSE streaming
            configure: (proxy, options) => {
              proxy.on('proxyReq', (proxyReq, req, res) => {
                console.log('[SSE Proxy] Request:', req.method, req.url, '-> http://localhost:8081');
              });
              proxy.on('proxyRes', (proxyRes, req, res) => {
                console.log('[SSE Proxy] Response status:', proxyRes.statusCode);
                // Disable buffering for SSE
                proxyRes.headers['cache-control'] = 'no-cache';
                proxyRes.headers['connection'] = 'keep-alive';
                proxyRes.headers['x-accel-buffering'] = 'no';
              });
              proxy.on('error', (err, req, res) => {
                console.error('[SSE Proxy] Error:', err.message);
              });
            },
          },
          // All other API requests routed through gateway
          '/api': {
            target: 'http://localhost:8080',
            changeOrigin: true,
            secure: false,
          },
        },
      },
      plugins: [react()],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
