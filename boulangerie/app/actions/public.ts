"use server";

import { prisma } from "@/lib/prisma";

export type LeadResult = { ok: boolean; error?: "name" | "phone" };

// Enregistre une demande de rappel depuis la vitrine.
// On ne collecte QUE prénom, nom, téléphone (+ message optionnel).
export async function submitLead(
  _prev: LeadResult | null,
  formData: FormData,
): Promise<LeadResult> {
  const firstName = String(formData.get("firstName") || "").trim();
  const lastName = String(formData.get("lastName") || "").trim();
  const phone = String(formData.get("phone") || "").trim();
  const message = String(formData.get("message") || "").trim();

  if (!firstName || !lastName) {
    return { ok: false, error: "name" };
  }
  const digits = phone.replace(/[^0-9]/g, "");
  if (digits.length < 8) {
    return { ok: false, error: "phone" };
  }

  await prisma.lead.create({
    data: {
      firstName,
      lastName,
      phone,
      message: message || null,
    },
  });

  return { ok: true };
}
