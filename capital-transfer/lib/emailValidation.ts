/** Basic RFC-style check: local@domain.tld — no spaces, must contain @ and a dot in host. */
export function isValidEmail(email: string): boolean {
  const t = email.trim();
  if (t.length < 5 || t.length > 254) return false;
  if (/\s/.test(t)) return false;
  const at = t.indexOf('@');
  if (at <= 0 || at !== t.lastIndexOf('@')) return false;
  const local = t.slice(0, at);
  const domain = t.slice(at + 1);
  if (local.length > 64 || domain.length < 3 || !domain.includes('.')) return false;
  if (domain.startsWith('.') || domain.endsWith('.')) return false;
  if (local.startsWith('.') || local.endsWith('.')) return false;
  const hostParts = domain.split('.');
  if (hostParts.some((p) => p.length === 0)) return false;
  const tld = hostParts[hostParts.length - 1];
  if (tld.length < 2 || !/^[a-zA-Z0-9-]+$/i.test(tld)) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(t);
}

export function normalizeEmail(email: string): string {
  return email.trim();
}
