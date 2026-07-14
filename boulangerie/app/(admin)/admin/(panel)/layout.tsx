import { requireAuth } from "@/lib/auth";
import { getShopSettings } from "@/lib/settings";
import AdminNav from "./AdminNav";
import { logoutAction } from "@/app/actions/admin";
import { LogOut } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function PanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAuth();
  const s = await getShopSettings();

  return (
    <div className="min-h-screen" style={{ background: "var(--color-ink)" }}>
      <header
        className="sticky top-0 z-20"
        style={{
          background: "rgba(250,246,238,.85)",
          backdropFilter: "blur(8px)",
          borderBottom: "1px solid var(--color-line)",
        }}
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-4">
          <div className="flex items-center gap-3">
            <span style={{ fontFamily: "var(--font-serif)", fontSize: "1.25rem" }}>
              {s.businessName}
            </span>
            <span
              className="rounded-full px-2 py-0.5 text-[10px] uppercase tracking-widest"
              style={{ background: "var(--color-surface-2)", color: "var(--color-gold-soft)" }}
            >
              Gérant
            </span>
          </div>
          <div className="flex items-center gap-2">
            <a
              href="/"
              className="btn btn-ghost"
              style={{ padding: "0.5rem 1rem", fontSize: "0.82rem" }}
            >
              Voir la vitrine
            </a>
            <form action={logoutAction}>
              <button className="btn btn-ghost" style={{ padding: "0.5rem 1rem", fontSize: "0.82rem" }}>
                <LogOut size={16} /> Déconnexion
              </button>
            </form>
          </div>
        </div>
        <AdminNav />
      </header>

      <main className="mx-auto max-w-6xl px-5 py-8">{children}</main>
    </div>
  );
}
