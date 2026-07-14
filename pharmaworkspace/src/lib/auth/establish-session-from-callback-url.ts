import type { EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";

const EMAIL_OTP_TYPES = new Set<EmailOtpType>([
  "signup",
  "invite",
  "magiclink",
  "recovery",
  "email_change",
  "email",
]);

/**
 * Query + hash (hash wins for duplicate keys), same idea as @supabase/auth-js parseParametersFromURL.
 * On lit aussi le hash pour pouvoir DÉTECTER d'éventuels jetons implicites
 * (#access_token) et les rejeter explicitement — on ne les CONSOMME plus (cf. I1).
 */
function parseAuthParamsFromHref(href: string): Record<string, string> {
  const result: Record<string, string> = {};
  const url = new URL(href);
  if (url.hash?.startsWith("#")) {
    try {
      const hashParams = new URLSearchParams(url.hash.slice(1));
      hashParams.forEach((value, key) => {
        result[key] = value;
      });
    } catch {
      /* ignore */
    }
  }
  url.searchParams.forEach((value, key) => {
    result[key] = value;
  });
  return result;
}

function isEmailOtpType(value: string): value is EmailOtpType {
  return EMAIL_OTP_TYPES.has(value as EmailOtpType);
}

/**
 * Après clic sur un lien Supabase (invitation, magic link, etc.) :
 * - `?token_hash=&type=` → verifyOtp (liens e-mail au format token_hash)
 * - `?code=` → exchange PKCE (code_verifier présent dans le même navigateur)
 * - `#access_token=&refresh_token=` → setSession (flux implicite : c'est ce que
 *   GoTrue renvoie après /auth/v1/verify pour les liens invite/magiclink admin).
 *
 * Le flux OTP 8 chiffres (verifyOtp email/token) n'utilise ni le hash ni le code
 * et passe par les pages /verify — il n'est pas concerné.
 */
export async function establishSessionFromCallbackUrl(
  href: string
): Promise<{ error: Error | null }> {
  const params = parseAuthParamsFromHref(href);

  if (params.error || params.error_code) {
    const desc =
      params.error_description ?? params.error ?? "Erreur renvoyée par Supabase Auth.";
    return { error: new Error(desc) };
  }

  const tokenHash = params.token_hash;
  const otpType = params.type;
  if (tokenHash && otpType && isEmailOtpType(otpType)) {
    const supabase = createClient();
    const { error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: otpType,
    });
    return { error: error ?? null };
  }

  const code = params.code;
  if (code) {
    const supabase = createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    return { error: error ?? null };
  }

  // Flux implicite (#access_token&refresh_token) : GoTrue y redirige les liens
  // email invite/magiclink générés côté admin (auth.admin.generateLink, sans
  // challenge PKCE) — c'est le chemin d'acceptation d'invitation. On pose la
  // session puis on NETTOIE le hash (ne pas laisser les jetons dans l'historique).
  // NB I1 : le rejet du flux implicite (anti login-CSRF/fixation) a été retiré car
  // il cassait l'acceptation d'invitation. Pour regagner ce durcissement sans
  // casser les invitations, il faut migrer les liens email vers token_hash/PKCE
  // (templates Supabase {{ .TokenHash }} → /auth/callback?token_hash=&type=).
  if (params.access_token && params.refresh_token) {
    const supabase = createClient();
    const { error } = await supabase.auth.setSession({
      access_token: params.access_token,
      refresh_token: params.refresh_token,
    });
    if (typeof window !== "undefined") {
      const u = new URL(window.location.href);
      u.hash = "";
      window.history.replaceState({}, "", `${u.pathname}${u.search}`);
    }
    return { error: error ?? null };
  }

  return {
    error: new Error(
      "Paramètres d’authentification manquants dans l’URL (code ou token_hash)."
    ),
  };
}
