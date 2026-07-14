import { NextRequest, NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";

export const runtime = "nodejs";

const BUCKET = "products";
const MAX_BYTES = 6 * 1024 * 1024; // 6 Mo (les photos sont compressées côté client)
const ALLOWED = ["image/jpeg", "image/png", "image/webp", "image/gif"];

// Upload d'une photo produit vers Supabase Storage (API REST). Réservé au gérant connecté.
export async function POST(req: NextRequest) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) {
    return NextResponse.json(
      { error: "Stockage non configuré (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY)." },
      { status: 500 },
    );
  }

  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Aucun fichier reçu." }, { status: 400 });
  }
  if (!ALLOWED.includes(file.type)) {
    return NextResponse.json({ error: "Format d'image non supporté." }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "Image trop lourde (max 6 Mo)." }, { status: 400 });
  }

  const ext = (file.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "");
  const stamp = Date.now().toString(36);
  const rand = Math.round(Math.random() * 1e9).toString(36);
  const path = `${stamp}-${rand}.${ext || "jpg"}`;

  const buffer = Buffer.from(await file.arrayBuffer());

  const res = await fetch(
    `${supabaseUrl}/storage/v1/object/${BUCKET}/${path}`,
    {
      method: "POST",
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
        "Content-Type": file.type,
        "cache-control": "public, max-age=31536000",
      },
      body: buffer,
    },
  );

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    return NextResponse.json(
      { error: `Échec de l'envoi (${res.status}).`, detail },
      { status: 500 },
    );
  }

  const publicUrl = `${supabaseUrl}/storage/v1/object/public/${BUCKET}/${path}`;
  return NextResponse.json({ url: publicUrl });
}
