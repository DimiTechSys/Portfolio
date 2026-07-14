import { Article, Message } from '../types';

export type ChatStreamPayload = {
  article: Article | null;
  history: Message[];
  question: string;
};

type SseParseResult = {
  tokens: string[];
  errorMessage: string | null;
  isDone: boolean;
};

function parseSseChunk(chunk: string): SseParseResult {
  const events = chunk.split('\n\n');
  const tokens: string[] = [];
  let errorMessage: string | null = null;
  let isDone = false;

  for (const event of events) {
    const lines = event.split('\n');
    const eventName = lines.find((line) => line.startsWith('event:'))?.replace('event:', '').trim();
    const dataLine = lines.find((line) => line.startsWith('data:'));
    const payload = dataLine?.replace('data:', '').trim();

    if (eventName === 'done') {
      isDone = true;
      continue;
    }

    if (!payload) continue;

    if (eventName === 'token') {
      try {
        const parsed = JSON.parse(payload) as { text?: string };
        if (parsed.text) tokens.push(parsed.text);
      } catch {
        // Ignore malformed chunks and keep streaming.
      }
      continue;
    }

    if (eventName === 'error') {
      try {
        const parsed = JSON.parse(payload) as { message?: string };
        errorMessage = parsed.message || 'Assistant stream failed';
      } catch {
        errorMessage = payload || 'Assistant stream failed';
      }
    }
  }

  return { tokens, errorMessage, isDone };
}

export async function streamAssistantReply(
  payload: ChatStreamPayload,
  onToken: (token: string) => void
): Promise<string> {
  const getFallbackReply = async (): Promise<string> => {
    console.log('[CHAT] Attempting fallback JSON endpoint...');
    const fallbackResponse = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!fallbackResponse.ok) {
      const fallbackText = await fallbackResponse.text().catch(() => '');
      console.error('[CHAT] Fallback failed:', fallbackResponse.status, fallbackText);
      throw new Error(fallbackText || `Fallback request failed (${fallbackResponse.status})`);
    }

    const result = await fallbackResponse.json();
    if (!result?.text) {
      console.error('[CHAT] Fallback returned no text:', result);
      throw new Error('Assistant fallback returned no text');
    }

    console.log('[CHAT] Fallback succeeded');
    return result.text;
  };

  try {
    console.log('[CHAT] Attempting stream endpoint...');
    const response = await fetch('/api/chat/stream', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok || !response.body) {
      console.warn('[CHAT] Stream endpoint failed or no body:', response.status);
      return await getFallbackReply();
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let fullText = '';
    let streamError: string | null = null;
    let gotDoneEvent = false;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lastBoundary = buffer.lastIndexOf('\n\n');
      if (lastBoundary === -1) continue;

      const completePart = buffer.slice(0, lastBoundary);
      buffer = buffer.slice(lastBoundary + 2);

      const parsed = parseSseChunk(completePart);
      if (parsed.errorMessage) {
        streamError = parsed.errorMessage;
      }
      if (parsed.isDone) {
        gotDoneEvent = true;
      }

      for (const token of parsed.tokens) {
        fullText += token;
        onToken(token);
      }
    }

    if (streamError) {
      console.warn('[CHAT] Stream had error event, falling back:', streamError);
      return await getFallbackReply();
    }

    if (!fullText.trim()) {
      console.warn('[CHAT] Stream returned empty text, falling back');
      return await getFallbackReply();
    }

    console.log('[CHAT] Stream succeeded');
    return fullText;
  } catch (error) {
    console.error('[CHAT] Stream error, falling back:', error);
    return await getFallbackReply();
  }
}
