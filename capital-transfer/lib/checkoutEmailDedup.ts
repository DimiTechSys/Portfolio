import { prisma } from '@/lib/prisma';

const KEY_PREFIX = 'checkout_confirm_email_sent:';

export function checkoutEmailDedupKey(sessionId: string): string {
  return `${KEY_PREFIX}${sessionId}`;
}

export async function wasCheckoutConfirmationEmailSent(sessionId: string): Promise<boolean> {
  try {
    const row = await prisma.config.findUnique({
      where: { key: checkoutEmailDedupKey(sessionId) },
    });
    return !!row;
  } catch (e) {
    console.error('[checkout-email-dedup] findUnique failed:', e);
    return false;
  }
}

export async function markCheckoutConfirmationEmailSent(sessionId: string): Promise<void> {
  const key = checkoutEmailDedupKey(sessionId);
  try {
    await prisma.config.upsert({
      where: { key },
      create: { key, value: '1' },
      update: { value: '1' },
    });
  } catch (e) {
    console.error('[checkout-email-dedup] upsert failed:', e);
  }
}
