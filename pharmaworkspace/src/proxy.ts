// src/middleware.ts
import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import { getWizardStep } from "@/lib/onboarding/wizard-state";

// Routes that never require authentication.
// Convention pivot self-serve : toutes les pages du route group `(marketing)`
// doivent être publiques.
const PUBLIC_ROUTES = [
  "/",
  "/signup",
  "/login",
  "/verify",
  "/auth/callback",
  "/api/auth/callback",
  // P4-05 : pages légales publiques (ouvertes depuis le click-wrap signup).
  "/conditions-generales",
  "/dpa",
  "/privacy",
  // P4-03 / P4-04 : pages tarifs et sécurité publiques (CTAs depuis landing).
  "/tarifs",
  "/securite",
  // CONSENT-01 : politique cookies publique (linkée depuis le bandeau CNIL).
  "/cookies",
  // Mentions légales LCEN, linkées depuis le footer marketing.
  "/mentions-legales",
];

/**
 * Routes publiques où un user **déjà authentifié** ne doit pas rester :
 * - `/` (landing publique) → /dashboard
 * - `/login`, `/verify` → /dashboard (sinon il refait une auth qui sert à rien)
 * - `/signup` → /dashboard (a déjà un compte, pas besoin d'en créer un)
 *
 * `/auth/callback` est exclu volontairement : il a besoin de tourner même
 * pour un user authentifié (il échange le code OAuth/OTP de la session
 * fraîche).
 */
const LOGGED_IN_REDIRECT_FROM = new Set(["/", "/signup", "/login", "/verify"]);

/** L’auth se fait dans la route (Bearer / cookies) ; le proxy ne lit pas Authorization. */
function isPublicRoute(pathname: string): boolean {
  if (PUBLIC_ROUTES.includes(pathname)) return true;
  if (pathname.startsWith("/api/invite")) return true;
  // P4-05 : /api/signup/start est appelé par un visiteur non-loggué pour
  // déclencher le magic link OTP. /api/signup/confirm est appelé par un
  // user authentifié dans /auth/callback (la session est établie juste
  // avant), on le whitelist quand même pour robustesse.
  if (pathname.startsWith("/api/signup/")) return true;
  // P4-13b : Stripe envoie le webhook sans cookie de session. La vérif d'auth
  // se fait dans le handler via `stripe.webhooks.constructEvent` (signature).
  // Sans cette exception, le middleware redirige le POST Stripe vers /login (307).
  if (pathname === "/api/stripe/webhook") return true;
  // Send Email Hook Supabase : appelé serveur-à-serveur sans cookie de session.
  // L'auth se fait dans le handler via la signature Standard Webhooks
  // (SEND_EMAIL_HOOK_SECRET). Sans cette exception, le POST est redirigé (307).
  if (pathname === "/api/auth/send-email-hook") return true;
  // Outil d'aperçu/test des emails, dev-only (la route elle-même renvoie 404
  // en production). Accessible sans session pour pouvoir l'ouvrir directement.
  if (pathname.startsWith("/api/dev/")) return true;
  return false;
}

/**
 * Redirige en CONSERVANT les cookies rafraîchis par updateSession(). Sans ça, un
 * token Supabase renouvelé pendant getUser() est perdu au redirect : le navigateur
 * garde l'ancien refresh token (déjà consommé/roté) → déconnexion au prochain
 * refresh. C'est le piège documenté de @supabase/ssr en middleware — il se
 * manifeste typiquement après un aller-retour externe (retour de Stripe Checkout),
 * où l'utilisateur se retrouve délogué et forcé de se reconnecter.
 */
function redirectPreservingSession(
  url: URL,
  base: NextResponse,
): NextResponse {
  const response = NextResponse.redirect(url);
  base.cookies.getAll().forEach((cookie) => response.cookies.set(cookie));
  return response;
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Note : la tentative R3-6 d'un CSP avec nonce per-requête a été retirée
  // (incompatible avec les pages du route group `(marketing)` qui sont
  // statiquement prerenderisées — leur HTML cached ne contient pas le nonce).
  // Le CSP statique avec `'unsafe-inline'` est rétabli dans next.config.ts.
  // Pour réactiver le nonce strict, il faudra soit force-dynamic toutes les
  // pages publiques, soit servir un CSP conditionnel par pathname depuis ce
  // middleware (ticket séparé `chore/csp-nonce-authenticated-only`).
  const { user, supabaseResponse, supabase } = await updateSession(request);

  // ── Public routes ───────────────────────────────────────────────
  if (isPublicRoute(pathname)) {
    // P4-01 (pivot self-serve) : `/` est désormais la landing marketing publique.
    // Un user déjà authentifié qui tape `/` (ou /login, /verify) est redirigé
    // vers `/dashboard`. `/auth/callback` n'est PAS redirigé car il fait
    // l'échange de code OAuth/OTP.
    if (user && LOGGED_IN_REDIRECT_FROM.has(pathname)) {
      const url = request.nextUrl.clone();
      url.pathname = "/dashboard";
      return redirectPreservingSession(url, supabaseResponse);
    }
    return supabaseResponse;
  }

  // /onboarding/activate/success = retour de Stripe Checkout. On l'autorise AVANT
  // le check `!user` : au retour d'un paiement externe, le cookie de session peut
  // ne pas être présent côté serveur sur cette 1ʳᵉ requête (aller-retour cross-site).
  // Rediriger vers /login ferait perdre le contexte (et le session_id) et
  // forcerait une reconnexion. La page récupère l'état côté client via des appels
  // same-origin (qui, eux, envoient toujours le cookie), puis redirige vers `/`.
  // Elle gère aussi le cas d'une session réellement absente (bouton de reconnexion).
  if (pathname.startsWith("/onboarding/activate/success")) {
    return supabaseResponse;
  }

  // ── Everything below requires authentication ────────────────────
  if (!user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    // pathname + search : on conserve la query string (ex. ?session_id du retour
    // Stripe) pour qu'elle survive au login et permette le rattrapage d'activation.
    url.searchParams.set("next", `${pathname}${request.nextUrl.search}`);
    return redirectPreservingSession(url, supabaseResponse);
  }

  // Les routes API renvoient du JSON : ne pas appliquer les redirections onboarding (307).
  // /api/stripe/* et /api/onboarding/* sont les endpoints qui font PROGRESSER le wizard,
  // ils ne doivent jamais être bloqués par les checks ci-dessous.
  if (pathname.startsWith("/api/")) {
    return supabaseResponse;
  }

  // ── Wizard onboarding guard (P2-01 + P4-13b) ─────────────────────
  //
  // `getWizardStep` (contrat §B8 #6) interroge la DB pour déterminer où en est
  // l'utilisateur dans le tunnel d'inscription. 4 étapes pages + 1 état terminal :
  //   'create'   → step 1 : pharmacie pas encore créée
  //   'profile'  → step 2 : profil utilisateur (first_name/last_name vides)
  //   'invite'   → step 3 : invitation équipe (user_metadata.onboarding_invites_handled !== true)
  //   'activate' → step 4 : IBAN / mandat SEPA à renseigner (subscription_status NULL ou 'incomplete')
  //   'done'     → wizard fini, accès produit conditionné par subscription_status
  //
  // Note perf : l'ancien fast-path via `app_metadata.pharmacy_id` (P2-08 Auth Hook)
  // a été retiré ici pour simplicité : getWizardStep lit profiles + pharmacies à
  // chaque requête authentifiée. À optimiser plus tard si nécessaire (cache 60s,
  // ou claims JWT enrichis avec le step courant).
  const wizardStep = await getWizardStep(supabase, user.id);

  // Fetch role pour les checks de sécurité role-based (admin, étapes
  // titulaire-only en back-nav, etc.). getWizardStep fait déjà sa propre
  // query profiles ; on en refait une dédiée pour ne pas modifier sa
  // signature publique (contrat §B8 #6 stable).
  const { data: profileRoleRow } = await supabase
    .from("profiles")
    .select("role, pharmacy_id")
    .eq("id", user.id)
    .maybeSingle();
  const userRole = (profileRoleRow?.role as string | null | undefined) ?? null;
  const pharmacyId =
    (profileRoleRow?.pharmacy_id as string | null | undefined) ?? null;
  const isTitulaire = userRole === "titulaire";

  // Branche `waiting` : invité dont la pharma n'est pas encore activée.
  // L'invité peut être sur /onboarding/waiting (état d'attente) ou revenir
  // sur /onboarding/profile (pour corriger son nom). Tout autre chemin
  // /onboarding/* ou hors `/` redirige vers waiting.
  if (wizardStep === "waiting") {
    if (
      pathname === "/onboarding/waiting" ||
      pathname === "/onboarding/profile"
    ) {
      return supabaseResponse;
    }
    const url = request.nextUrl.clone();
    url.pathname = "/onboarding/waiting";
    return redirectPreservingSession(url, supabaseResponse);
  }

  if (wizardStep !== "done") {
    // Mode strict pour les invités : pas de nav-back, accès uniquement à
    // l'étape courante. Les étapes 'create' / 'invite' / 'activate' sont
    // titulaire-only (création pharma + invitation équipe + activation SEPA) :
    // un invité ne doit jamais y accéder, même via URL directe ou back-nav.
    if (!isTitulaire) {
      const expectedPath = `/onboarding/${wizardStep}`;
      if (pathname !== expectedPath) {
        const url = request.nextUrl.clone();
        url.pathname = expectedPath;
        return redirectPreservingSession(url, supabaseResponse);
      }
      return supabaseResponse;
    }

    // Titulaire : autorise la navigation back vers les étapes déjà complétées.
    // Logique : l'utilisateur peut visiter une étape PASSÉE (indice <= courant),
    // mais pas SAUTER en avant (indice > courant) : dans ce cas on redirige
    // vers l'étape attendue. Idem pour toute route /onboarding/* non-reconnue.
    const STEP_ORDER = ["create", "profile", "invite", "activate"] as const;
    const currentIdx = STEP_ORDER.indexOf(wizardStep as (typeof STEP_ORDER)[number]);
    const requestedIdx = STEP_ORDER.findIndex(
      (s) => pathname === `/onboarding/${s}`,
    );

    if (requestedIdx === -1 || requestedIdx > currentIdx) {
      const url = request.nextUrl.clone();
      url.pathname = `/onboarding/${wizardStep}`;
      return redirectPreservingSession(url, supabaseResponse);
    }

    return supabaseResponse;
  }

  // ── wizardStep === 'done' : gestion subscription_status terminale ─
  //
  // Si l'abonnement est `canceled` ou `unpaid`, on bloque tout sauf /billing/*
  // (page de réactivation Customer Portal Stripe).
  if (pharmacyId) {
    const { data: pharmacy } = await supabase
      .from("pharmacies")
      .select("subscription_status")
      .eq("id", pharmacyId)
      .maybeSingle();
    const subStatus = pharmacy?.subscription_status as string | null | undefined;

    if (subStatus === "canceled" || subStatus === "unpaid") {
      if (!pathname.startsWith("/billing")) {
        const url = request.nextUrl.clone();
        url.pathname = "/billing/reactivate";
        return redirectPreservingSession(url, supabaseResponse);
      }
      return supabaseResponse;
    }
  }

  // Bloque `/admin/*` pour les non-titulaires. Le route group (admin) est
  // réservé à la gestion équipe / paramètres officine = titulaire uniquement.
  // Belt-and-suspenders : les pages admin font aussi leurs propres checks
  // côté composant, mais le middleware est la première ligne de défense.
  if (pathname.startsWith("/admin") && !isTitulaire) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return redirectPreservingSession(url, supabaseResponse);
  }

  // Onboarded users should not access onboarding pages
  if (pathname.startsWith("/onboarding")) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return redirectPreservingSession(url, supabaseResponse);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * Match all routes except:
     * - _next/static
     * - _next/image
     * - favicon.ico, sitemap.xml, robots.txt
     * - public assets
     * - PostHog ingest endpoints
     */
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|ingest|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};