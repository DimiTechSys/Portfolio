import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * `invite/complete` renvoie `skipped` lorsqu’il n’y a pas d’invitation en attente :
 * cas normal pour un titulaire ou un membre déjà rattaché.
 * On n’affiche une erreur que si le JWT indiquait une invitation et que le profil
 * n’a toujours pas d’officine.
 */
export async function skippedInviteCompleteIsError(
  supabase: SupabaseClient,
  userId: string,
  invitationToken?: string
): Promise<boolean> {
  if (!invitationToken?.trim()) return false;

  const { data: profile } = await supabase
    .from("profiles")
    .select("pharmacy_id")
    .eq("id", userId)
    .maybeSingle();

  return !profile?.pharmacy_id;
}
