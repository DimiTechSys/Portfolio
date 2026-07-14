import Anthropic from '@anthropic-ai/sdk';

export const config = { runtime: 'edge' };

const defaultSystemPrompt = `You are Nosoclean AI, an expert assistant specialized in hygiene, disinfection, sterilization protocols, and regulatory best practices.

Audience: professionals in hospital, pharmaceutical, food industry, collective catering/hospitality, and dental sectors.

Behavior rules:
- Prioritize the selected article content and metadata when answering.
- If the user's question is directly related to the selected article, answer based primarily on that article.
- If the article does not contain enough information, use your broader expert knowledge.
- Keep a premium expert tone: concise, clear, and authoritative.
- Prioritize safety, compliance, and risk reduction.
- If the answer is not in provided context, state that explicitly and then provide best-effort guidance.
- Respond in the same language as the user (French or English).
- Never invent official standards references with fake numbers.
`;

export default async function handler(req: Request) {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  const anthropicApiKey = process.env.ANTHROPIC_API_KEY;
  const anthropicModel = process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-6';

  if (!anthropicApiKey) {
    return new Response(JSON.stringify({ error: 'ANTHROPIC_API_KEY is missing on the server' }), { 
      status: 500, 
      headers: { 'Content-Type': 'application/json' } 
    });
  }

  const anthropic = new Anthropic({ apiKey: anthropicApiKey });
  const { history = [], question = '', article = null } = await req.json().catch(() => ({}));

  const configuredPrompt = process.env.NOSOCLEAN_SYSTEM_PROMPT || defaultSystemPrompt;
  const fileIds = (process.env.ANTHROPIC_FILE_IDS || '')
    .split(',')
    .map((id) => id.trim())
    .filter(Boolean);

  const optionalFileContext =
    fileIds.length > 0
      ? `\n\nReference files uploaded in Anthropic file store: ${fileIds.join(', ')}.\nUse them when relevant and mention when your answer is based on these reference files.`
      : '';

  const articleContext = article
    ? `Current article metadata:\n- Sector: ${article.category}\n- Title: ${article.title}\n- Date: ${article.date}\n- Author: ${article.author?.name || 'Unknown'} (${article.author?.role || 'Unknown'})\n\nCurrent article content:\n${article.content}`
    : `No specific article is selected.\nAnswer with general Nosoclean expert guidance across Hospitalier, Pharma, Agroalimentaire, Collectivite, and Dentaire contexts.`;

  const systemPrompt = `${configuredPrompt}\n\n${articleContext}\n${optionalFileContext}`;

  const messages: Anthropic.Messages.MessageParam[] = [
    ...history.map((h: any) => ({
      role: h.role === 'model' ? 'assistant' : 'user',
      content: String(h.text || ''),
    })),
    { role: 'user', content: question },
  ];

  try {
    const stream = await anthropic.messages.create({
      model: anthropicModel,
      max_tokens: 700,
      system: systemPrompt,
      messages,
      stream: true,
    });

    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const event of stream) {
            if (
              event.type === 'content_block_delta' &&
              event.delta.type === 'text_delta' &&
              event.delta.text
            ) {
              controller.enqueue(encoder.encode(`event: token\n`));
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: event.delta.text })}\n\n`));
            }
          }
          controller.enqueue(encoder.encode('event: done\ndata: {}\n\n'));
          controller.close();
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Unknown stream error';
          controller.enqueue(encoder.encode(`event: error\ndata: ${JSON.stringify({ message })}\n\n`));
          controller.close();
        }
      }
    });

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/event-stream; charset=utf-8',
        'Cache-Control': 'no-cache, no-transform',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown assistant error';
    return new Response(JSON.stringify({ error: message }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
