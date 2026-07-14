export type PatientCivility = "" | "M" | "Mme";

export type PatientV2 = {
  id: string;
  /** Civilité affichée avant le nom (N/A = non renseigné). */
  civility?: PatientCivility;
  lastName: string;
  firstName: string;
  birthDate: string;
  socialSecurity?: string;
  recommendedBy?: string;
  comment?: string;
  country: string;
  address: string;
  address2?: string;
  postalCode: string;
  city: string;
  phone: string;
  email: string;
  createdAt: string;
  lastVisitAt?: string;
  visitCount?: number;
};

const STORAGE_V2 = "patients_v2";
const STORAGE_LEGACY = "patients";

function splitLegacyFullName(fullName: string) {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return { lastName: "", firstName: "" };
  if (parts.length === 1) return { lastName: parts[0] ?? "", firstName: "" };
  return { lastName: parts[0] ?? "", firstName: parts.slice(1).join(" ") };
}

function isLegacyPatient(raw: unknown): raw is {
  id: string;
  fullName: string;
  birthDate: string;
  createdAt: string;
} {
  if (!raw || typeof raw !== "object") return false;
  const o = raw as Record<string, unknown>;
  return (
    typeof o.id === "string" &&
    typeof o.fullName === "string" &&
    typeof o.birthDate === "string" &&
    typeof o.createdAt === "string"
  );
}

export function loadPatients(): PatientV2[] {
  if (typeof window === "undefined") return [];

  const rawV2 = window.localStorage.getItem(STORAGE_V2);
  if (rawV2) {
    try {
      const parsed = JSON.parse(rawV2) as unknown[];
      if (!Array.isArray(parsed)) return [];
      return parsed
        .filter((item): item is Record<string, unknown> => !!item && typeof item === "object")
        .map((item) => {
          const { pin: _drop, ...rest } = item as Record<string, unknown> & { civility?: string };
          if (rest.civility === "M.") rest.civility = "M";
          return rest as PatientV2;
        });
    } catch {
      // fall through to legacy migration
    }
  }

  const rawLegacy = window.localStorage.getItem(STORAGE_LEGACY);
  if (!rawLegacy) return [];
  try {
    const parsed = JSON.parse(rawLegacy) as unknown[];
    if (!Array.isArray(parsed)) return [];
    const migrated: PatientV2[] = parsed.map((item) => {
      if (isLegacyPatient(item)) {
        const { lastName, firstName } = splitLegacyFullName(item.fullName);
        return {
          id: item.id,
          lastName,
          firstName,
          birthDate: item.birthDate,
          country: "France",
          address: "",
          postalCode: "",
          city: "",
          phone: "",
          email: "",
          createdAt: item.createdAt,
        };
      }
      const { pin: _legacyPin, ...rest } = item as Record<string, unknown> & { civility?: string };
      if (rest.civility === "M.") rest.civility = "M";
      return rest as PatientV2;
    });
    window.localStorage.setItem(STORAGE_V2, JSON.stringify(migrated));
    return migrated;
  } catch {
    return [];
  }
}

export function savePatients(patients: PatientV2[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_V2, JSON.stringify(patients));
}

export function getPatientById(id: string): PatientV2 | null {
  return loadPatients().find((p) => p.id === id) ?? null;
}

export function touchLastVisit(patientId: string) {
  const all = loadPatients();
  const now = new Date().toISOString();
  const next = all.map((p) => {
    if (p.id !== patientId) return p;
    const visits = (p.visitCount ?? 0) + 1;
    return { ...p, lastVisitAt: now, visitCount: visits };
  });
  savePatients(next);
}

type ConsultationRow = { patientId?: string };

function removeConsultationsForPatient(patientId: string) {
  if (typeof window === "undefined") return;
  const raw = window.localStorage.getItem("consultations");
  if (!raw) return;
  try {
    const parsed = JSON.parse(raw) as ConsultationRow[];
    if (!Array.isArray(parsed)) return;
    const next = parsed.filter((row) => row.patientId !== patientId);
    window.localStorage.setItem("consultations", JSON.stringify(next));
  } catch {
    // ignore corrupted storage
  }
}

export function deletePatientById(patientId: string) {
  if (typeof window === "undefined") return;
  const all = loadPatients();
  const next = all.filter((p) => p.id !== patientId);
  savePatients(next);
  removeConsultationsForPatient(patientId);
}
