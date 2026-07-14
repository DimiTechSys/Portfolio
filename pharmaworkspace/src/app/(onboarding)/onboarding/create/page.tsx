"use client";

import { useState, useEffect, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { capture } from "@/lib/analytics/posthog";
import { ONBOARDING_EVENTS } from "@/lib/analytics/events";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";

/**
 * Étape 1 du wizard onboarding : création de l'officine OU édition si on
 * revient ici via wizard back link depuis une étape ultérieure.
 *
 * Au mount :
 *  - Si profile.pharmacy_id existe → fetch pharmacy, pré-remplit le form, bascule
 *    en mode "édition" (button label "Continuer", event PostHog `pharmacy_updated`).
 *  - Sinon → mode "création" classique.
 *
 * Le backend `/api/onboarding/create-pharmacy` détecte le mode via la présence
 * de pharmacy_id côté serveur (avec une vérif `role='titulaire'` pour bloquer
 * l'escalation de privilège, cf. route.ts).
 */
export default function CreatePharmacyPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [finess, setFiness] = useState("");
  const [pharmacyId, setPharmacyId] = useState<string | null>(null);
  const [initializing, setInitializing] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isUpdating = pharmacyId !== null;
  const isValid = name.trim().length > 0;

  useEffect(() => {
    const supabase = createClient();
    void (async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) return;

        const { data: profile } = await supabase
          .from("profiles")
          .select("pharmacy_id")
          .eq("id", user.id)
          .maybeSingle();

        if (profile?.pharmacy_id) {
          const { data: pharmacy } = await supabase
            .from("pharmacies")
            .select("id, name, address, finess")
            .eq("id", profile.pharmacy_id)
            .maybeSingle();
          if (pharmacy) {
            setPharmacyId(pharmacy.id);
            setName(pharmacy.name ?? "");
            setAddress(pharmacy.address ?? "");
            setFiness(pharmacy.finess ?? "");
          }
        }
      } finally {
        setInitializing(false);
      }
    })();
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError("Le nom de l'officine est requis.");
      return;
    }

    setLoading(true);

    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setError("Session expirée. Veuillez vous reconnecter.");
        return;
      }

      const controller = new AbortController();
      const timeout = window.setTimeout(() => controller.abort(), 30_000);

      let res: Response;
      try {
        res = await fetch("/api/onboarding/create-pharmacy", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: name.trim(),
            address: address.trim() || null,
            finess: finess.trim() || null,
          }),
          signal: controller.signal,
        });
      } finally {
        window.clearTimeout(timeout);
      }

      let payload: {
        pharmacy?: { id: string; name: string };
        updated?: boolean;
        alreadyLinked?: boolean;
        error?: string;
      };
      try {
        payload = (await res.json()) as typeof payload;
      } catch {
        setError(
          `Réponse serveur invalide (${res.status}). Réessayez ou ouvrez /onboarding/profile.`
        );
        return;
      }

      if (!res.ok || !payload.pharmacy) {
        setError(payload.error ?? "Erreur. Réessayez.");
        return;
      }

      const pharmacy = payload.pharmacy;

      // Sync user_metadata (le proxy lit profiles.pharmacy_id en base ; ce
      // updateUser est best-effort pour la fast-path JWT future).
      void supabase.auth
        .updateUser({
          data: { pharmacy_id: pharmacy.id, role: "titulaire" },
        })
        .catch(() => {});

      capture(
        isUpdating
          ? ONBOARDING_EVENTS.pharmacy_updated
          : ONBOARDING_EVENTS.pharmacy_created,
        {
          pharmacy_id: pharmacy.id,
          pharmacy_name: pharmacy.name,
          has_finess: Boolean(finess.trim()),
        }
      );

      router.push("/onboarding/profile");
      router.refresh();
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") {
        setError("Délai dépassé. Vérifiez votre connexion et réessayez.");
      } else {
        setError("Erreur réseau. Réessayez.");
      }
    } finally {
      setLoading(false);
    }
  }

  if (initializing) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <h1 className="text-xl font-semibold tracking-tight">
          {isUpdating ? "Votre officine" : "Créer votre officine"}
        </h1>
        <p className="text-sm text-muted-foreground">
          {isUpdating
            ? "Modifiez les informations si besoin avant de continuer."
            : "Renseignez les informations de votre pharmacie."}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="name">
            Nom de l&apos;officine <span className="text-destructive">*</span>
          </Label>
          <Input
            id="name"
            placeholder="Pharmacie du Centre"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            autoFocus
            disabled={loading}
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="address">Adresse</Label>
          <Input
            id="address"
            placeholder="12 rue de la Santé, 75013 Paris"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            disabled={loading}
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="finess">N° FINESS</Label>
          <Input
            id="finess"
            placeholder="750012345"
            value={finess}
            onChange={(e) => setFiness(e.target.value)}
            disabled={loading}
            maxLength={9}
          />
        </div>

        {error && (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        )}

        <Button
          type="submit"
          disabled={loading || !isValid}
          className="w-full"
        >
          {loading
            ? isUpdating
              ? "Enregistrement…"
              : "Création…"
            : isUpdating
              ? "Continuer"
              : "Créer l'officine"}
        </Button>
      </form>
    </div>
  );
}
