import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { geocodeAddress } from "@/lib/geofencing/geocode";
import { apiError } from "@/lib/api/error-response";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Géocode l'adresse (Nominatim) et stocke lat/lng sur la pharmacie.
 * Best-effort : un échec de géocodage ne bloque jamais la création/màj.
 */
async function geocodePharmacy(
  service: SupabaseClient,
  pharmacyId: string,
  address: string | null
): Promise<void> {
  if (!address) return;
  const coords = await geocodeAddress(address);
  if (!coords) return;
  await service
    .from("pharmacies")
    .update({
      address_latitude: coords.lat,
      address_longitude: coords.lng,
      address_geocoded_at: new Date().toISOString(),
    })
    .eq("id", pharmacyId);
}

type Body = {
  name?: string;
  address?: string | null;
  finess?: string | null;
};

/**
 * Création OU mise à jour d'officine pendant l'onboarding (étape 1 du wizard).
 *
 * Cas couverts :
 * - Pas de pharmacy_id sur le profil → INSERT pharmacy + lie profil
 *   (`role='titulaire'`) + lie `pharmacy_acquisition.pharmacy_id` (P4-14).
 * - pharmacy_id existe ET role='titulaire' → UPDATE des fields (atteint quand
 *   l'utilisateur revient via wizard back link depuis l'étape 2+).
 * - pharmacy_id existe MAIS role !== 'titulaire' (user invité comme
 *   adjoint/préparateur) → ne touche rien et renvoie l'existant. Bloque
 *   l'escalation de privilège via cet endpoint.
 *
 * Contourne RLS via service role.
 */
export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  }

  const service = createServiceClient();
  if (!service) {
    return NextResponse.json(
      { error: "Configuration serveur Supabase incomplète." },
      { status: 500 }
    );
  }

  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ error: "JSON invalide." }, { status: 400 });
  }

  const name = body.name?.trim() ?? "";
  if (!name) {
    return NextResponse.json(
      { error: "Le nom de l'officine est requis." },
      { status: 400 }
    );
  }

  const address = body.address?.trim() || null;
  const finess = body.finess?.trim() || null;

  const { data: profile, error: profileReadError } = await service
    .from("profiles")
    .select("pharmacy_id, role")
    .eq("id", user.id)
    .maybeSingle();

  if (profileReadError) {
    return apiError(
      "[onboarding/create-pharmacy]",
      profileReadError,
      "Impossible de lire votre profil.",
      400
    );
  }

  // ─── UPDATE : pharmacy existe déjà ────────────────────────────────
  if (profile?.pharmacy_id) {
    if (profile.role !== "titulaire") {
      // Invité (adjoint / préparateur) : ne touche rien (anti-escalation).
      const { data: existing, error: existingError } = await service
        .from("pharmacies")
        .select("id, name")
        .eq("id", profile.pharmacy_id)
        .single();
      if (existingError || !existing) {
        return NextResponse.json(
          { error: "Votre profil est déjà rattaché à une officine." },
          { status: 409 }
        );
      }
      return NextResponse.json({ pharmacy: existing, alreadyLinked: true });
    }

    // Titulaire revient via back link → on UPDATE.
    const { data: updated, error: updateError } = await service
      .from("pharmacies")
      .update({ name, address, finess })
      .eq("id", profile.pharmacy_id)
      .select("id, name")
      .single();

    if (updateError || !updated) {
      return apiError(
        "[onboarding/create-pharmacy]",
        updateError,
        "Erreur lors de la mise à jour de l'officine.",
        400
      );
    }

    await geocodePharmacy(service, profile.pharmacy_id, address);

    return NextResponse.json({ pharmacy: updated, updated: true });
  }

  // ─── INSERT : nouvelle pharmacy ────────────────────────────────────
  // INSERT avec subscription_status='incomplete' = état initial bloquant.
  // L'utilisateur sera forcé sur /onboarding/activate tant qu'il n'aura pas
  // renseigné son IBAN / mandat SEPA (le middleware le wire via getWizardStep, contrat §B8 #6).
  const { data: pharmacy, error: insertError } = await service
    .from("pharmacies")
    .insert({ name, address, finess, subscription_status: "incomplete" })
    .select("id, name")
    .single();

  if (insertError || !pharmacy) {
    return apiError(
      "[onboarding/create-pharmacy]",
      insertError,
      "Erreur lors de la création.",
      400
    );
  }

  await geocodePharmacy(service, pharmacy.id, address);

  // Contrat §B8 #2 : on lie l'acquisition (créée par /signup, migration 0041)
  // à la pharmacy nouvellement créée.
  //
  // R3-4 : on ne fait plus confiance à user_metadata.acquisition_id (modifiable
  // par le client : un user invité pourrait y poser l'acquisition d'autrui). On
  // re-dérive depuis l'e-mail de la session : dernière acquisition de cet e-mail
  // pas encore liée à une pharmacy. Si absente (vieux compte avant le pivot
  // signup self-serve), on skip : pas de tracking funnel mais le flow fonctionne.
  if (user.email) {
    const emailNormalized = user.email.trim().toLowerCase();
    const { data: acquisition } = await service
      .from("pharmacy_acquisition")
      .select("id")
      .eq("email", emailNormalized)
      .is("pharmacy_id", null)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (acquisition) {
      const { error: acquisitionError } = await service
        .from("pharmacy_acquisition")
        .update({
          pharmacy_id: pharmacy.id,
          funnel_step: "pharmacy_created",
        })
        .eq("id", acquisition.id);
      if (acquisitionError) {
        console.error("[onboarding/create-pharmacy] failed to link acquisition", {
          acquisition_id: acquisition.id,
          pharmacy_id: pharmacy.id,
          code: acquisitionError.code,
        });
      }
    }
  }

  const profilePatch = { pharmacy_id: pharmacy.id, role: "titulaire" as const };

  const { data: updatedRows, error: profileError } = await service
    .from("profiles")
    .update(profilePatch)
    .eq("id", user.id)
    .select("id");

  if (profileError) {
    return apiError(
      "[onboarding/create-pharmacy]",
      profileError,
      "Erreur lors de la mise à jour du profil.",
      400
    );
  }

  if (!updatedRows?.length) {
    const { error: upsertError } = await service
      .from("profiles")
      .upsert({ id: user.id, ...profilePatch }, { onConflict: "id" });
    if (upsertError) {
      return apiError(
        "[onboarding/create-pharmacy]",
        upsertError,
        "Erreur lors de la mise à jour du profil.",
        400
      );
    }
  }

  return NextResponse.json({ pharmacy });
}
