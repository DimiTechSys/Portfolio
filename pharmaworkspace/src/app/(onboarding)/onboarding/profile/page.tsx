"use client";

import { useState, useEffect, useRef, type FormEvent, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { useSignedUrl } from "@/lib/storage/get-signed-url";
import { capture } from "@/lib/analytics/posthog";
import { ONBOARDING_EVENTS } from "@/lib/analytics/events";
import { useProfile } from "@/contexts/profile-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { WizardBackLink } from "@/components/onboarding/back-link";
import { User, Camera, Loader2 } from "lucide-react";

export default function ProfilePage() {
  const router = useRouter();
  const { profile: userProfile } = useProfile();
  // Le back link "← Officine" ne sert qu'aux titulaires (ils ont créé la
  // pharma à l'étape 1). Pour un invité, /onboarding/create est inaccessible
  // côté backend (anti-escalation dans /api/onboarding/create-pharmacy) et
  // côté middleware (strict-mode invité), autant ne pas le proposer en UI.
  const isTitulaire = userProfile?.role === "titulaire";

  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [userId, setUserId] = useState<string | null>(null);
  const [pharmacyId, setPharmacyId] = useState<string | null>(null);
  const [avatarPath, setAvatarPath] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { data: avatarSignedUrl } = useSignedUrl("attachments", avatarPath ?? undefined);

  // Récupère l'email et le profil depuis la session / la base
  useEffect(() => {
    const supabase = createClient();
    void (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user?.email) setEmail(user.email);
      if (!user) return;
      setUserId(user.id);

      const { data: row } = await supabase
        .from("profiles")
        .select("first_name, last_name, pharmacy_id, avatar_url")
        .eq("id", user.id)
        .maybeSingle();

      if (row?.first_name) setFirstName(row.first_name);
      if (row?.last_name) setLastName(row.last_name);
      if (row?.pharmacy_id) setPharmacyId(row.pharmacy_id);
      if (row?.avatar_url) setAvatarPath(row.avatar_url);
    })();
  }, []);

  async function handleAvatarChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!userId) {
      setError("Session expirée. Veuillez vous reconnecter.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("L'image est trop volumineuse (max 5 MB).");
      return;
    }

    setError(null);
    setUploading(true);
    try {
      const supabase = createClient();
      const ext = file.name.split(".").pop() ?? "jpg";
      const folder = pharmacyId ?? "unassigned";
      const path = `${folder}/avatars/${userId}_${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("attachments")
        .upload(path, file, { cacheControl: "3600", upsert: true });

      if (uploadError) throw uploadError;

      setAvatarPath(path);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erreur lors de l'upload de l'image.";
      setError(message);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!firstName.trim() || !lastName.trim()) {
      setError("Le prénom et le nom sont requis.");
      return;
    }

    setLoading(true);

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        setError("Session expirée. Veuillez vous reconnecter.");
        return;
      }

      // Met à jour la table profiles en base.
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          display_name: `${firstName.trim()} ${lastName.trim()}`,
          avatar_url: avatarPath,
        })
        .eq("id", user.id);

      if (profileError) {
        setError("Erreur lors de l'enregistrement. Réessayez.");
        return;
      }

      // user_metadata.profile_complete=true est un legacy flag pour l'ancien
      // middleware. Le nouveau getWizardStep lit first_name/last_name en DB
      // comme source de vérité : ce updateUser n'est plus critique. On le
      // fait en fire-and-forget pour ne pas bloquer le flow si la session
      // a un souci (vu en prod sur des sessions invité où updateUser hang
      // silencieusement et figeait le form en "Enregistrement…").
      void supabase.auth
        .updateUser({ data: { profile_complete: true } })
        .catch((err) => {
          console.warn("[profile] updateUser (non-critical) failed", err);
        });

      capture(ONBOARDING_EVENTS.profile_completed, {
        has_avatar: Boolean(avatarPath),
      });

      // Forward sequentiel selon le rôle :
      //   - Titulaire → /onboarding/invite (step 3) explicitement, même si
      //     le user y est déjà passé (onboarding_invites_handled=true). Le
      //     middleware autorise la nav back-and-forth via requestedIdx <= currentIdx.
      //   - Invité → /dashboard, le middleware route vers /waiting si pharma
      //     pas encore activée, sinon laisse passer.
      if (isTitulaire) {
        router.push("/onboarding/invite");
      } else {
        router.push("/dashboard");
      }
      router.refresh();
    } catch (err) {
      console.error("[profile] submit error", err);
      setError("Erreur réseau. Vérifiez votre connexion et réessayez.");
    } finally {
      // Si la navigation a réussi, le composant unmount → setState est no-op.
      // Si elle échoue, on libère le form pour permettre une nouvelle tentative.
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {isTitulaire && (
        <WizardBackLink href="/onboarding/create" label="Officine" />
      )}
      <div className="flex flex-col gap-1.5">
        <h1 className="text-xl font-semibold tracking-tight">Votre profil</h1>
        <p className="text-sm text-muted-foreground">
          Renseignez votre identité pour personnaliser votre espace.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col items-center gap-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleAvatarChange}
            className="hidden"
            accept="image/*,.heic,.heif"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading || loading}
            className="group relative flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-white bg-teal-100 text-teal-700 shadow-sm transition-transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2"
            aria-label="Choisir une photo de profil"
          >
            {avatarSignedUrl ? (
              <Image src={avatarSignedUrl} alt="Avatar" fill className="object-cover" sizes="96px" />
            ) : (
              <User size={36} />
            )}
            <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
              {uploading ? (
                <Loader2 className="h-6 w-6 animate-spin text-white" />
              ) : (
                <Camera className="h-6 w-6 text-white" />
              )}
            </div>
          </button>
          <p className="text-xs text-muted-foreground">Photo de profil (optionnelle)</p>
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            value={email}
            disabled
            className="bg-muted"
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="firstName">
            Prénom <span className="text-destructive">*</span>
          </Label>
          <Input
            id="firstName"
            placeholder="Marie"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            required
            autoFocus
            disabled={loading}
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="lastName">
            Nom <span className="text-destructive">*</span>
          </Label>
          <Input
            id="lastName"
            placeholder="Dupont"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            required
            disabled={loading}
          />
        </div>

        {error && (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        )}

        <Button
          type="submit"
          disabled={loading || !firstName.trim() || !lastName.trim()}
          className="w-full py-2"
        >
          {loading ? "Enregistrement…" : "Continuer"}
        </Button>
      </form>
    </div>
  );
}
