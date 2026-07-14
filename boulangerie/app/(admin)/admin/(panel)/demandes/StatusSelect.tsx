"use client";

import { updateLeadStatus } from "@/app/actions/admin";

const OPTIONS = [
  { value: "TO_CALL", label: "À rappeler" },
  { value: "CALLED", label: "Rappelé" },
  { value: "CONVERTED", label: "Converti" },
  { value: "DROPPED", label: "Sans suite" },
];

export default function StatusSelect({ id, status }: { id: number; status: string }) {
  return (
    <form action={updateLeadStatus}>
      <input type="hidden" name="id" value={id} />
      <select
        name="status"
        defaultValue={status}
        className="field"
        style={{ padding: "0.45rem 0.6rem", fontSize: "0.85rem", width: "auto" }}
        onChange={(e) => e.currentTarget.form?.requestSubmit()}
      >
        {OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </form>
  );
}
