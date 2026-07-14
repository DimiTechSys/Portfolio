import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import crypto from "crypto";

// Pour les migrations/seed, on privilégie la connexion directe (DIRECT_URL).
const url = (process.env.DIRECT_URL || process.env.DATABASE_URL || "").trim();
if (!url) throw new Error("DATABASE_URL/DIRECT_URL non défini pour le seed.");
// Outil local : on ne vérifie pas le certificat (réseaux avec proxy TLS).
const connectionString = url.replace(/([?&])sslmode=[^&]*/g, "$1").replace(/[?&]$/, "");
const adapter = new PrismaPg({ connectionString, ssl: { rejectUnauthorized: false } });
const prisma = new PrismaClient({ adapter });

function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

async function setSetting(key: string, value: string) {
  await prisma.setting.upsert({
    where: { key },
    create: { key, value },
    update: { value },
  });
}

async function main() {
  // Paramètres de l'enseigne (modifiables ensuite dans l'espace gérant).
  await setSetting("businessName", "La Mie Dorée");
  await setSetting(
    "tagline",
    "La boulangerie de prestige des belles adresses d'Alger.",
  );
  await setSetting("whatsappNumber", "213555000000");
  await setSetting("phoneNumber", "+213 555 00 00 00");
  await setSetting("city", "Alger, Algérie");

  // Mot de passe initial du back-office — seulement s'il n'existe pas déjà,
  // pour ne pas écraser un mot de passe changé par le gérant.
  const existing = await prisma.setting.findUnique({
    where: { key: "adminPasswordHash" },
  });
  if (!existing) {
    const pw = process.env.ADMIN_PASSWORD || "maison2026";
    await setSetting("adminPasswordHash", hashPassword(pw));
    console.log(`Mot de passe back-office initialisé : "${pw}"`);
  }

  // Catalogue d'exemple — à remplacer par vos vrais produits et photos.
  const count = await prisma.product.count();
  if (count === 0) {
    await prisma.product.createMany({
      data: [
        {
          name: "Croissant pur beurre",
          category: "Viennoiseries",
          description: "Feuilletage artisanal, beurre AOP, cuit chaque matin.",
          imageUrl: "/products/croissant.jpg",
          priceDA: 80,
          costDA: 35,
          sortOrder: 1,
        },
        {
          name: "Pain au chocolat",
          category: "Viennoiseries",
          description: "Deux barres de chocolat noir, feuilletage croustillant.",
          imageUrl: "/products/pain-au-chocolat.jpg",
          priceDA: 90,
          costDA: 40,
          sortOrder: 2,
        },
        {
          name: "Baguette de tradition",
          category: "Pains",
          description: "Levain naturel, fermentation lente 24h, croûte dorée.",
          imageUrl:
            "https://images.unsplash.com/photo-1549931319-a545dcf3bc73?w=900&q=80",
          priceDA: 60,
          costDA: 22,
          sortOrder: 3,
        },
        {
          name: "Éclair au café",
          category: "Pâtisseries",
          description: "Pâte à choux, crème pâtissière café, glaçage miroir.",
          imageUrl: "/products/eclair-cafe.jpg",
          priceDA: 180,
          costDA: 70,
          sortOrder: 4,
        },
        {
          name: "Tarte au citron meringuée",
          category: "Pâtisseries",
          description: "Crème de citron de Menton, meringue italienne flambée.",
          imageUrl:
            "https://images.unsplash.com/photo-1519915028121-7d3463d20b13?w=900&q=80",
          priceDA: 250,
          costDA: 95,
          sortOrder: 5,
        },
        {
          name: "Plateau petit-déjeuner signature",
          category: "Coffrets",
          description:
            "Assortiment de viennoiseries pour les cafés et hôtels partenaires.",
          imageUrl: "/products/plateau-boulanger.jpg",
          priceDA: 1200,
          costDA: 520,
          sortOrder: 6,
        },
      ],
    });
    console.log("Catalogue d'exemple créé.");
  }

  console.log("Seed terminé.");
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
