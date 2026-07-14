import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function isAccelerateOrDataProxyUrl(url: string): boolean {
  return (
    url.startsWith('prisma+postgres://') ||
    url.startsWith('prisma://') ||
    url.startsWith('prisma+mysql://')
  );
}

function createPrismaClient(): PrismaClient {
  const url = process.env.DATABASE_URL?.trim();
  if (!url) {
    throw new Error(
      'DATABASE_URL is not set. Prisma 7 needs a direct postgresql:// URL (with @prisma/adapter-pg) or a prisma+postgres:// Accelerate URL (accelerateUrl).'
    );
  }

  const log =
    process.env.NODE_ENV === 'development' ? (['query', 'error', 'warn'] as const) : (['error'] as const);

  if (isAccelerateOrDataProxyUrl(url)) {
    return new PrismaClient({
      accelerateUrl: url,
      log: [...log],
    });
  }

  const adapter = new PrismaPg(url);
  return new PrismaClient({
    adapter,
    log: [...log],
  });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
