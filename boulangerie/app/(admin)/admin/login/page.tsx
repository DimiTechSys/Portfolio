import { isAuthenticated } from "@/lib/auth";
import { redirect } from "next/navigation";
import LoginForm from "./LoginForm";
import { getShopSettings } from "@/lib/settings";
import { ArrowLeft } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  if (await isAuthenticated()) redirect("/admin");
  const s = await getShopSettings();

  return (
    <main className="hero-vignette flex min-h-screen flex-col items-center justify-center px-6">
      {/* Bouton retour vers la vitrine */}
      <a
        href="/"
        className="absolute left-6 top-6 inline-flex items-center gap-2 text-sm"
        style={{ color: "var(--color-cream-soft)" }}
      >
        <ArrowLeft size={16} /> Retour au site
      </a>

      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <p className="eyebrow mb-3">Espace gérant</p>
          <h1 className="text-3xl">{s.businessName}</h1>
        </div>
        <LoginForm />
        <a
          href="/"
          className="mt-6 flex items-center justify-center gap-2 text-sm"
          style={{ color: "var(--color-cream-soft)" }}
        >
          <ArrowLeft size={15} /> Retour à la vitrine
        </a>
        <p className="mt-4 text-center text-xs" style={{ color: "var(--color-muted)" }}>
          Accès réservé à la gestion de la boulangerie.
        </p>
      </div>
    </main>
  );
}
