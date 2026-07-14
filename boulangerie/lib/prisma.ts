import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

// Connexion PostgreSQL (Supabase) via @prisma/adapter-pg.
// DATABASE_URL = connexion runtime (pooler Supabase en production).
//
// Initialisation PARESSEUSE : le client n'est créé qu'à la première utilisation,
// pour que la build ne plante pas si la variable d'env n'est pas encore présente.

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function createClient(): PrismaClient {
  const url = process.env.DATABASE_URL?.trim();
  if (!url) {
    throw new Error(
      "DATABASE_URL n'est pas défini. Renseignez l'URL PostgreSQL (Supabase).",
    );
  }
  // Connexion TLS au pooler Supabase (chiffrée, sans vérification stricte de la
  // chaîne de certificats — évite les échecs liés aux poolers / proxys réseau).
  const connectionString = url
    .replace(/([?&])sslmode=[^&]*/g, "$1")
    .replace(/[?&]$/, "");
  const adapter = new PrismaPg({
    connectionString,
    ssl: { rejectUnauthorized: false },
  });
  return new PrismaClient({ adapter });
}

function getPrisma(): PrismaClient {
  if (!globalForPrisma.prisma) globalForPrisma.prisma = createClient();
  return globalForPrisma.prisma;
}

// Proxy : diffère la création du client jusqu'au premier accès réel.
export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    const client = getPrisma();
    const value = Reflect.get(client, prop, client);
    return typeof value === "function" ? value.bind(client) : value;
  },
});
