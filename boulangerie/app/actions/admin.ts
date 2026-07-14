"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import {
  checkAdminPassword,
  createSession,
  destroySession,
  isAuthenticated,
  setAdminPassword,
} from "@/lib/auth";
import { saveShopSettings } from "@/lib/settings";

async function assertAuth() {
  if (!(await isAuthenticated())) throw new Error("Non autorisé");
}

function toInt(v: FormDataEntryValue | null): number {
  const n = parseInt(String(v ?? "").replace(/[^0-9-]/g, ""), 10);
  return Number.isFinite(n) ? n : 0;
}

// ---------------- Authentification ----------------
export type LoginState = { error?: string } | null;

export async function loginAction(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const password = String(formData.get("password") || "");
  if (!(await checkAdminPassword(password))) {
    return { error: "Mot de passe incorrect." };
  }
  await createSession();
  redirect("/admin");
}

export async function logoutAction() {
  await destroySession();
  // Après déconnexion, on revient sur la vitrine du site.
  redirect("/");
}

// ---------------- Catalogue ----------------
export async function saveProduct(formData: FormData) {
  await assertAuth();
  const id = toInt(formData.get("id"));

  // Galerie : liste d'URLs (JSON). La couverture = première image.
  let images: string[] = [];
  try {
    const parsed = JSON.parse(String(formData.get("images") || "[]"));
    if (Array.isArray(parsed)) {
      images = parsed.map((u) => String(u).trim()).filter(Boolean);
    }
  } catch {
    images = [];
  }

  const data = {
    name: String(formData.get("name") || "").trim(),
    category: String(formData.get("category") || "").trim() || null,
    description: String(formData.get("description") || "").trim() || null,
    images,
    imageUrl: images[0] ?? null,
    priceDA: toInt(formData.get("priceDA")),
    costDA: toInt(formData.get("costDA")),
    sortOrder: toInt(formData.get("sortOrder")),
    visible: formData.get("visible") === "on",
  };
  if (!data.name) return;

  if (id) {
    await prisma.product.update({ where: { id }, data });
  } else {
    await prisma.product.create({ data });
  }
  revalidatePath("/admin/catalogue");
  revalidatePath("/");
}

export async function toggleProductVisible(formData: FormData) {
  await assertAuth();
  const id = toInt(formData.get("id"));
  const p = await prisma.product.findUnique({ where: { id } });
  if (p) {
    await prisma.product.update({ where: { id }, data: { visible: !p.visible } });
  }
  revalidatePath("/admin/catalogue");
  revalidatePath("/");
}

export async function deleteProduct(formData: FormData) {
  await assertAuth();
  const id = toInt(formData.get("id"));
  await prisma.product.delete({ where: { id } }).catch(() => {});
  revalidatePath("/admin/catalogue");
  revalidatePath("/");
}

// ---------------- Demandes (leads) ----------------
export async function updateLeadStatus(formData: FormData) {
  await assertAuth();
  const id = toInt(formData.get("id"));
  const status = String(formData.get("status") || "TO_CALL");
  await prisma.lead
    .update({
      where: { id },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      data: { status: status as any },
    })
    .catch(() => {});
  revalidatePath("/admin/demandes");
}

export async function deleteLead(formData: FormData) {
  await assertAuth();
  const id = toInt(formData.get("id"));
  await prisma.lead.delete({ where: { id } }).catch(() => {});
  revalidatePath("/admin/demandes");
}

// ---------------- Commandes ----------------
type ItemInput = {
  productId?: number | null;
  productName: string;
  qty: number;
  unitPriceDA: number;
  unitCostDA: number;
};

export async function createOrder(formData: FormData) {
  await assertAuth();
  const customerName = String(formData.get("customerName") || "").trim() || null;
  const customerPhone = String(formData.get("customerPhone") || "").trim() || null;
  const note = String(formData.get("note") || "").trim() || null;

  let items: ItemInput[] = [];
  try {
    items = JSON.parse(String(formData.get("items") || "[]"));
  } catch {
    items = [];
  }
  items = items.filter((i) => i.productName && i.qty > 0);
  if (items.length === 0) return;

  await prisma.order.create({
    data: {
      customerName,
      customerPhone,
      note,
      items: {
        create: items.map((i) => ({
          productId: i.productId ?? null,
          productName: i.productName,
          qty: i.qty,
          unitPriceDA: i.unitPriceDA,
          unitCostDA: i.unitCostDA,
        })),
      },
    },
  });
  revalidatePath("/admin/commandes");
  revalidatePath("/admin");
}

export async function deleteOrder(formData: FormData) {
  await assertAuth();
  const id = toInt(formData.get("id"));
  await prisma.order.delete({ where: { id } }).catch(() => {});
  revalidatePath("/admin/commandes");
  revalidatePath("/admin");
}

// ---------------- Paramètres ----------------
export async function saveSettingsAction(formData: FormData) {
  await assertAuth();
  await saveShopSettings({
    businessName: String(formData.get("businessName") || "").trim(),
    tagline: String(formData.get("tagline") || "").trim(),
    whatsappNumber: String(formData.get("whatsappNumber") || "").trim(),
    phoneNumber: String(formData.get("phoneNumber") || "").trim(),
    city: String(formData.get("city") || "").trim(),
  });
  revalidatePath("/admin/parametres");
  revalidatePath("/");
}

export type PasswordState = { ok?: boolean; error?: string } | null;

export async function changePasswordAction(
  _prev: PasswordState,
  formData: FormData,
): Promise<PasswordState> {
  await assertAuth();
  const current = String(formData.get("current") || "");
  const next = String(formData.get("next") || "");
  if (!(await checkAdminPassword(current))) {
    return { error: "Mot de passe actuel incorrect." };
  }
  if (next.length < 6) {
    return { error: "Le nouveau mot de passe doit faire au moins 6 caractères." };
  }
  await setAdminPassword(next);
  return { ok: true };
}
