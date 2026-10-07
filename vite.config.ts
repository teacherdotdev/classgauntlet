import adapter from '@sveltejs/adapter-static';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig, loadEnv, type Plugin } from 'vite';
import { GET as turnLogins } from './api/turn.ts';

/**
 * On Vercel, api/turn.ts runs as its own function. During `vite dev` there is
 * no Vercel, so this answers /api/turn the same way, using TURN_KEY_ID and
 * TURN_KEY_API_TOKEN from .env.local.
 */
function devTurnLogins(): Plugin {
  return {
    name: 'dev-turn-logins',
    configureServer(server) {
      Object.assign(process.env, loadEnv(server.config.mode, process.cwd(), 'TURN_'));
      server.middlewares.use('/api/turn', async (_request, response) => {
        const answer = await turnLogins();
        response.statusCode = answer.status;
        response.setHeader('Content-Type', 'application/json');
        response.end(await answer.text());
      });
    },
  };
}

export default defineConfig({
  plugins: [
    devTurnLogins(),
    sveltekit({
      // There is no game server: the teacher's browser runs the game and every
      // page is a plain file. `fallback` lets /join?code=… open the app directly.
      adapter: adapter({ fallback: 'index.html' }),
      version: { pollInterval: 5 * 60_000 },
    }),
  ],
  envPrefix: ['VITE_', 'CF_BEACON_TOKEN'],
  server: { allowedHosts: ['.exe.xyz', '.edtechathon.com'] },
});
