import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import Anthropic from '@anthropic-ai/sdk';
import path from 'path';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  const stripQuotes = (value: string | undefined) => {
    if (!value) return undefined;
    const trimmed = value.trim();
    if (trimmed.startsWith('"') && trimmed.endsWith('"')) {
      return trimmed.slice(1, -1);
    }
    return trimmed;
  };

  const anthropicApiKey = stripQuotes(env.ANTHROPIC_API_KEY);
  const anthropicModel = stripQuotes(env.ANTHROPIC_MODEL) || 'claude-sonnet-4-6';

  const anthropic = anthropicApiKey
    ? new Anthropic({
        apiKey: anthropicApiKey,
      })
    : null;

  const defaultSystemPrompt = `You are Nosoclean AI, an expert assistant specialized in hygiene, disinfection, sterilization protocols, and regulatory best practices.`;

  const assistantApiPlugin = {
    name: 'nosoclean-assistant-api',
    configureServer(server: any) {
      server.middlewares.use(async (req: any, res: any, next: any) => {
        if (!req.url.startsWith('/api/chat')) {
          return next();
        }

        if (req.method !== 'POST') {
          res.statusCode = 405;
          res.end('Method not allowed');
          return;
        }

        if (!anthropic) {
          res.statusCode = 500;
          res.end(JSON.stringify({ error: 'ANTHROPIC_API_KEY is missing' }));
          return;
        }

        // Parse body for Vite dev server (it doesn't parse it by default)
        const chunks: Buffer[] = [];
        for await (const chunk of req) {
          chunks.push(chunk);
        }
        const body = JSON.parse(Buffer.concat(chunks).toString('utf8'));

        const { history = [], question = '', article = null } = body;
        const isStream = req.url.includes('/stream');

        const configuredPrompt = env.NOSOCLEAN_SYSTEM_PROMPT || defaultSystemPrompt;
        const fileIds = (env.ANTHROPIC_FILE_IDS || '').split(',').map((id) => id.trim()).filter(Boolean);
        const articleContext = article ? `Context: ${article.content}` : '';
        const systemPrompt = `${configuredPrompt}\n\n${articleContext}`;

        const messages: any[] = [
          ...history.map((h: any) => ({
            role: h.role === 'model' ? 'assistant' : 'user',
            content: String(h.text || ''),
          })),
          { role: 'user', content: question },
        ];

        if (isStream) {
          res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
          try {
            const stream = await anthropic.messages.create({
              model: anthropicModel,
              max_tokens: 700,
              system: systemPrompt,
              messages,
              stream: true,
            });

            for await (const event of stream) {
              if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
                res.write(`event: token\ndata: ${JSON.stringify({ text: event.delta.text })}\n\n`);
              }
            }
            res.write('event: done\ndata: {}\n\n');
            res.end();
          } catch (e: any) {
            res.write(`event: error\ndata: ${JSON.stringify({ message: e.message })}\n\n`);
            res.end();
          }
        } else {
          try {
            const response = await anthropic.messages.create({
              model: anthropicModel,
              max_tokens: 700,
              system: systemPrompt,
              messages,
            });
            const text = (response.content[0] as any).text;
            res.end(JSON.stringify({ text }));
          } catch (e: any) {
            res.statusCode = 500;
            res.end(JSON.stringify({ error: e.message }));
          }
        }
      });
    },
  };

  return {
    plugins: [react(), tailwindcss(), assistantApiPlugin],
    define: {
      'process.env.ANTHROPIC_FILE_IDS': JSON.stringify(env.ANTHROPIC_FILE_IDS),
      'process.env.NOSOCLEAN_SYSTEM_PROMPT': JSON.stringify(env.NOSOCLEAN_SYSTEM_PROMPT),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      port: 3000,
      host: '0.0.0.0',
      hmr: process.env.DISABLE_HMR !== 'true',
    },
  };
});
