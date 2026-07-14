import { prisma } from "@/lib/prisma";
import { getShopSettings, waLink } from "@/lib/settings";
import { deleteLead } from "@/app/actions/admin";
import StatusSelect from "./StatusSelect";
import { Phone, MessageCircle, Trash2 } from "lucide-react";

export const dynamic = "force-dynamic";

const STATUS_BADGE: Record<string, { label: string; color: string; bg: string }> = {
  TO_CALL: { label: "À rappeler", color: "#8a6a12", bg: "rgba(201,162,75,.18)" },
  CALLED: { label: "Rappelé", color: "#2f6d99", bg: "rgba(99,150,190,.16)" },
  CONVERTED: { label: "Converti", color: "#2b7a4f", bg: "rgba(60,160,100,.16)" },
  DROPPED: { label: "Sans suite", color: "#6f6354", bg: "rgba(120,110,95,.14)" },
};

export default async function DemandesPage() {
  const [leads, s] = await Promise.all([
    prisma.lead.findMany({ orderBy: { createdAt: "desc" } }),
    getShopSettings(),
  ]);

  return (
    <div>
      <h1 className="text-3xl mb-1">Demandes de rappel</h1>
      <p className="mb-8" style={{ color: "var(--color-muted)" }}>
        Les coordonnées laissées par les clients sur la vitrine.
      </p>

      {leads.length === 0 ? (
        <div className="card p-10 text-center" style={{ color: "var(--color-muted)" }}>
          Aucune demande pour le moment.
        </div>
      ) : (
        <div className="space-y-3">
          {leads.map((l) => {
            const badge = STATUS_BADGE[l.status] || STATUS_BADGE.TO_CALL;
            const wa = waLink(
              l.phone,
              `Bonjour ${l.firstName}, merci pour votre intérêt envers ${s.businessName}.`,
            );
            return (
              <div key={l.id} className="card p-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-3">
                      <span className="text-xl" style={{ fontFamily: "var(--font-serif)" }}>
                        {l.firstName} {l.lastName}
                      </span>
                      <span
                        className="rounded-full px-2.5 py-0.5 text-[11px]"
                        style={{ color: badge.color, background: badge.bg }}
                      >
                        {badge.label}
                      </span>
                    </div>
                    <div className="mt-1 text-sm" style={{ color: "var(--color-cream-soft)" }}>
                      {l.phone}
                    </div>
                    {l.message && (
                      <p className="mt-2 text-sm" style={{ color: "var(--color-muted)" }}>
                        « {l.message} »
                      </p>
                    )}
                    <div className="mt-1 text-xs" style={{ color: "var(--color-muted)" }}>
                      {new Date(l.createdAt).toLocaleString("fr-FR")}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <a
                      href={`tel:${l.phone.replace(/[^0-9+]/g, "")}`}
                      className="btn btn-ghost"
                      style={{ padding: "0.5rem 0.9rem", fontSize: "0.82rem" }}
                    >
                      <Phone size={15} /> Appeler
                    </a>
                    <a
                      href={wa}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-wa"
                      style={{ padding: "0.5rem 0.9rem", fontSize: "0.82rem" }}
                    >
                      <MessageCircle size={15} /> WhatsApp
                    </a>
                    <StatusSelect id={l.id} status={l.status} />
                    <form action={deleteLead}>
                      <input type="hidden" name="id" value={l.id} />
                      <button
                        className="btn btn-ghost"
                        style={{ padding: "0.5rem 0.7rem" }}
                        title="Supprimer"
                      >
                        <Trash2 size={15} />
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
