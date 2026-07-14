"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { submitLead, type LeadResult } from "@/app/actions/public";
import { Check, Loader2 } from "lucide-react";

export default function RecontactForm() {
  const t = useTranslations("contact");
  const [state, action, pending] = useActionState<LeadResult | null, FormData>(
    submitLead,
    null,
  );

  if (state?.ok) {
    return (
      <div className="card p-8 text-center fade-up">
        <div
          className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full"
          style={{ background: "rgba(201,162,75,.15)", color: "var(--color-gold-soft)" }}
        >
          <Check size={26} />
        </div>
        <h3 className="text-2xl mb-2">{t("successTitle")}</h3>
        <p style={{ color: "var(--color-cream-soft)" }}>{t("successText")}</p>
      </div>
    );
  }

  return (
    <form action={action} className="card p-6 sm:p-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="label" htmlFor="firstName">{t("firstName")}</label>
          <input id="firstName" name="firstName" className="field" required />
        </div>
        <div>
          <label className="label" htmlFor="lastName">{t("lastName")}</label>
          <input id="lastName" name="lastName" className="field" required />
        </div>
      </div>
      <div className="mt-4">
        <label className="label" htmlFor="phone">{t("phone")}</label>
        <input
          id="phone"
          name="phone"
          type="tel"
          inputMode="tel"
          className="field"
          placeholder="+213 ..."
          required
        />
      </div>
      <div className="mt-4">
        <label className="label" htmlFor="message">{t("message")}</label>
        <textarea
          id="message"
          name="message"
          className="field"
          rows={3}
          placeholder={t("messagePlaceholder")}
        />
      </div>

      {state?.error && (
        <p className="mt-3 text-sm" style={{ color: "#b4471f" }}>
          {state.error === "name" ? t("errName") : t("errPhone")}
        </p>
      )}

      <button type="submit" className="btn btn-gold mt-6 w-full" disabled={pending}>
        {pending ? (
          <>
            <Loader2 size={18} className="animate-spin" /> {t("sending")}
          </>
        ) : (
          t("submit")
        )}
      </button>
      <p className="mt-3 text-center text-xs" style={{ color: "var(--color-muted)" }}>
        {t("privacy")}
      </p>
    </form>
  );
}
