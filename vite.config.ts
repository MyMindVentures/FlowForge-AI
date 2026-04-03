import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { createClient } from '@supabase/supabase-js';
import type { IncomingMessage, ServerResponse } from 'node:http';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';

function readJsonBody(request: IncomingMessage) {
  return new Promise<Record<string, unknown>>((resolve, reject) => {
    const chunks: Buffer[] = [];

    request.on('data', (chunk) => {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    });

    request.on('end', () => {
      try {
        const raw = Buffer.concat(chunks).toString('utf8');
        resolve(raw ? JSON.parse(raw) : {});
      } catch (error) {
        reject(error);
      }
    });

    request.on('error', reject);
  });
}

function sendJson(response: ServerResponse, statusCode: number, payload: Record<string, unknown>) {
  response.statusCode = statusCode;
  response.setHeader('Content-Type', 'application/json');
  response.end(JSON.stringify(payload));
}

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  const supabaseUrl = env.VITE_SUPABASE_URL;
  const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY;

  return {
    plugins: [
      react(),
      tailwindcss(),
      {
        name: 'flowforge-dev-email-otp',
        configureServer(server) {
          server.middlewares.use('/api/dev-auth/email-otp', async (request, response) => {
            if (request.method !== 'POST') {
              sendJson(response, 405, { error: 'Method not allowed.' });
              return;
            }

            if (!supabaseUrl || !serviceRoleKey) {
              sendJson(response, 503, { error: 'Development OTP is unavailable. Set SUPABASE_SERVICE_ROLE_KEY before starting the dev server.' });
              return;
            }

            try {
              const body = await readJsonBody(request);
              const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';

              if (!email) {
                sendJson(response, 400, { error: 'Email is required.' });
                return;
              }

              const adminClient = createClient(supabaseUrl, serviceRoleKey, {
                auth: {
                  autoRefreshToken: false,
                  persistSession: false,
                },
              });

              const { data, error } = await adminClient.auth.admin.generateLink({
                type: 'magiclink',
                email,
                options: {
                  data: {
                    flowforgeAuthMethod: 'email_otp',
                  },
                  redirectTo: env.VITE_AUTH_REDIRECT_URL || env.VITE_SUPABASE_URL,
                },
              });

              if (error) {
                sendJson(response, 400, { error: error.message });
                return;
              }

              sendJson(response, 200, {
                emailOtp: data.properties.email_otp,
              });
            } catch (error) {
              const message = error instanceof Error ? error.message : 'Failed to generate development OTP.';
              sendJson(response, 500, { error: message });
            }
          });
        },
      },
    ],
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: ['./src/tests/setup.tsx'],
      include: ['**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
      coverage: {
        provider: 'v8',
        reporter: ['text', 'json', 'html'],
        all: true,
        include: ['src/**/*.{ts,tsx}'],
        exclude: [
          'node_modules/',
          'src/tests/setup.tsx',
          '**/*.d.ts',
          '**/*.config.*',
          'dist/',
          'src/main.tsx',
          'src/vite-env.d.ts'
        ]
      }
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
    },
  };
});
