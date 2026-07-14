/**
 * Dates de naissance saisies au format français (jj/mm/aaaa ou jj.mm.aaaa)
 * ou ISO (aaaa-mm-jj). Les chaînes jj/mm/aaaa ne sont jamais interprétées
 * comme du mm/jj/aaaa (comportement de `Date.parse` en US).
 */

function validateYMD(year: number, month: number, day: number): Date | null {
  if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) return null;
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  const d = new Date(year, month - 1, day);
  if (d.getFullYear() !== year || d.getMonth() !== month - 1 || d.getDate() !== day) return null;
  return d;
}

export function parsePatientBirthDateString(raw: string): Date | null {
  const s = raw.trim();
  if (!s) return null;

  const iso = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (iso) {
    const y = Number(iso[1]);
    const m = Number(iso[2]);
    const d = Number(iso[3]);
    return validateYMD(y, m, d);
  }

  const dmy = s.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})$/);
  if (dmy) {
    const day = Number(dmy[1]);
    const month = Number(dmy[2]);
    const year = Number(dmy[3]);
    return validateYMD(year, month, day);
  }

  return null;
}

export function calendarAgeFromDate(birth: Date, now = new Date()): number {
  let age = now.getFullYear() - birth.getFullYear();
  const m = now.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age -= 1;
  return Math.max(0, age);
}

export function patientAgeFromBirthString(raw: string, now = new Date()): number | null {
  const d = parsePatientBirthDateString(raw);
  if (!d) return null;
  return calendarAgeFromDate(d, now);
}

export function formatPatientBirthDateFr(raw: string): string {
  const d = parsePatientBirthDateString(raw);
  if (!d) return raw;
  return d.toLocaleDateString("fr-FR");
}
