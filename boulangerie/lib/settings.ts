import { prisma } from "./prisma";

export type ShopSettings = {
  businessName: string;
  tagline: string;
  whatsappNumber: string; // format international sans "+", ex. 213555000000
  phoneNumber: string; // numéro affiché / cliquable, ex. +213 555 00 00 00
  city: string;
};

const DEFAULTS: ShopSettings = {
  businessName: "La Mie Dorée",
  tagline: "La boulangerie de prestige des belles adresses d'Alger.",
  whatsappNumber: "213555000000",
  phoneNumber: "+213 555 00 00 00",
  city: "Alger, Algérie",
};

export async function getSetting(key: string): Promise<string | null> {
  const row = await prisma.setting.findUnique({ where: { key } });
  return row?.value ?? null;
}

export async function setSetting(key: string, value: string): Promise<void> {
  await prisma.setting.upsert({
    where: { key },
    create: { key, value },
    update: { value },
  });
}

export async function getShopSettings(): Promise<ShopSettings> {
  const rows = await prisma.setting.findMany();
  const map = new Map(rows.map((r) => [r.key, r.value]));
  return {
    businessName: map.get("businessName") || DEFAULTS.businessName,
    tagline: map.get("tagline") || DEFAULTS.tagline,
    whatsappNumber: map.get("whatsappNumber") || DEFAULTS.whatsappNumber,
    phoneNumber: map.get("phoneNumber") || DEFAULTS.phoneNumber,
    city: map.get("city") || DEFAULTS.city,
  };
}

export async function saveShopSettings(s: Partial<ShopSettings>): Promise<void> {
  const entries = Object.entries(s).filter(([, v]) => v !== undefined);
  for (const [key, value] of entries) {
    await setSetting(key, String(value));
  }
}

// Construit un lien WhatsApp « cliquer pour discuter » avec un message pré-rempli.
export function waLink(number: string, text: string): string {
  const clean = (number || "").replace(/[^0-9]/g, "");
  return `https://wa.me/${clean}?text=${encodeURIComponent(text)}`;
}
