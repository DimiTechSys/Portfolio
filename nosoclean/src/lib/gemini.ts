import Anthropic from '@anthropic-ai/sdk';
import { Article, Message } from '../types';

const apiKey = process.env.ANTHROPIC_API_KEY;

const client = apiKey
  ? new Anthropic({
      apiKey,
      dangerouslyAllowBrowser: true,
    })
  : null;

const defaultSystemPrompt = `You are Nosoclean AI, an expert assistant specialized in hygiene, disinfection, sterilization protocols, and regulatory best practices.

Audience: professionals in hospital, pharmaceutical, food industry, collective catering/hospitality, and dental sectors.

Behavior rules:
- Answer with practical, operational recommendations.
- Keep a premium expert tone: concise, clear, and authoritative.
- Prioritize safety, compliance, and risk reduction.
- If the answer is not in provided context, state that explicitly and then provide best-effort guidance.
- Respond in the same language as the user (French or English).
- Never invent official standards references with fake numbers.
`;

export async function askClaude(article: Article | null, history: Message[], question: string): Promise<string> {
  if (!client) {
    return 'Anthropic API key is missing. Add `ANTHROPIC_API_KEY` in your `.env` file.';
  }

  const configuredPrompt = process.env.NOSOCLEAN_SYSTEM_PROMPT || defaultSystemPrompt;
  const fileIds = (process.env.ANTHROPIC_FILE_IDS || '')
    .split(',')
    .map(id => id.trim())
    .filter(Boolean);
  const optionalFileContext =
    fileIds.length > 0
      ? `\n\nReference files uploaded in Anthropic file store: ${fileIds.join(', ')}.\nUse them when relevant and mention when your answer is based on these reference files.`
      : '';

  const articleContext = article
    ? `Current article metadata:
- Sector: ${article.category}
- Title: ${article.title}
- Date: ${article.date}
- Author: ${article.author.name} (${article.author.role})

Current article content:
${article.content}`
    : `No specific article is selected.
Answer with general Nosoclean expert guidance across Hospitalier, Pharma, Agroalimentaire, Collectivite, and Dentaire contexts.`;

  const systemPrompt = `${configuredPrompt}

${articleContext}
${optionalFileContext}`;

  const messages: Anthropic.Messages.MessageParam[] = [
    ...history.map(h => {
      const role: 'assistant' | 'user' = h.role === 'model' ? 'assistant' : 'user';
      return {
        role,
        content: h.text,
      };
    }),
    { role: 'user', content: question },
  ];

  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 700,
    system: systemPrompt,
    messages,
  });

  const text = response.content
    .filter(block => block.type === 'text')
    .map(block => block.text)
    .join('\n')
    .trim();

  return text || "I'm sorry, I couldn't process that request.";
}
