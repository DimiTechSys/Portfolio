"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useProfile } from "@/contexts/profile-context";

export default function OnboardingPage() {
  const router = useRouter();
  const { profile, loading, signOut } = useProfile();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-muted border-t-primary" />
      </div>
    );
  }

  // If user already has a pharmacy_id (came from invite), go directly to profile
  if (profile?.pharmacy_id) {
    router.replace("/onboarding/profile");
    return null;
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2 text-center">
        <h1 className="text-xl font-semibold tracking-tight">
          Bienvenue sur PharmaWorkspace
        </h1>
        <p className="text-sm text-muted-foreground">
          Configurez votre espace de travail pour commencer.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        <Button
          onClick={() => router.push("/onboarding/create")}
          className="w-full"
        >
          Je suis titulaire : créer mon officine
        </Button>

        <div className="relative flex items-center py-2">
          <div className="flex-grow border-t" />
          <span className="mx-4 flex-shrink-0 text-xs text-muted-foreground">
            ou
          </span>
          <div className="flex-grow border-t" />
        </div>

        <p className="text-center text-sm text-muted-foreground">
          Vous avez reçu une invitation ? Utilisez le lien envoyé par email pour
          rejoindre l&apos;officine de votre titulaire.
        </p>
      </div>

      <button
        type="button"
        onClick={signOut}
        className="mx-auto text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground"
      >
        Se déconnecter
      </button>
    </div>
  );
}
