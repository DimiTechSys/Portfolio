/** Expansion des raccourcis @commande avec le contenu des trames (localStorage). */

import { migrateLegacyToBubbles } from "@/lib/trame-choice-syntax";

export type TrameFromStorage = {
  id?: string;
  name?: string;
  command: string;
  content?: string;
  /** Si false, la trame n’est pas proposée pour les notes de consultation. */
  useInConsultations?: boolean;
};

function isWordChar(ch: string) {
  return /[\p{L}\p{N}_]/u.test(ch);
}

export function readTramesFromStorage(): TrameFromStorage[] {
  if (typeof window === "undefined") return [];
  const rawTrames = window.localStorage.getItem("trames");
  if (!rawTrames) return [];
  try {
    const parsed = JSON.parse(rawTrames) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item): item is TrameFromStorage => item != null && typeof item === "object");
  } catch {
    return [];
  }
}

export function buildTrameMap(
  trames: TrameFromStorage[],
  opts?: { forConsultation?: boolean },
): Map<string, string> {
  const map = new Map<string, string>();
  for (const trame of trames) {
    if (opts?.forConsultation && trame.useInConsultations === false) continue;
    const command = trame.command?.trim();
    if (!command) continue;
    const content = typeof trame.content === "string" ? trame.content : "";
    if (!map.has(command)) map.set(command, content);
  }
  return map;
}

/**
 * Détecte une saisie @… en cours (curseur dans ou juste après la commande).
 * Retourne les positions globales dans la chaîne sérialisée.
 */
export function getActiveAtMention(
  value: string,
  caret: number,
): { start: number; end: number; query: string } | null {
  const c = Math.min(Math.max(0, caret), value.length);
  let i = c - 1;
  while (i >= 0 && value[i] !== "@") {
    const ch = value[i];
    if (ch === " " || ch === "\n" || ch === "\t" || ch === "\r") return null;
    i -= 1;
  }
  if (i < 0 || value[i] !== "@") return null;
  const beforeOk = i === 0 || !isWordChar(value[i - 1]);
  if (!beforeOk) return null;
  const query = value.slice(i + 1, c);
  if (/\s/.test(query)) return null;
  return { start: i, end: c, query };
}

/** Trames utilisables en consultation, une entrée par commande (ordre stable). */
export function listTramesForConsultationMentions(trames: TrameFromStorage[]): TrameFromStorage[] {
  const seen = new Set<string>();
  const out: TrameFromStorage[] = [];
  for (const t of trames) {
    if (t.useInConsultations === false) continue;
    const cmd = t.command?.trim();
    if (!cmd) continue;
    if (seen.has(cmd)) continue;
    seen.add(cmd);
    out.push(t);
  }
  out.sort((a, b) => (a.command ?? "").localeCompare(b.command ?? "", "fr"));
  return out;
}

/** Filtre par préfixe sur la commande ou sous-chaîne sur le nom. */
export function filterTramesByMentionQuery(trames: TrameFromStorage[], query: string): TrameFromStorage[] {
  const base = listTramesForConsultationMentions(trames);
  const q = query.trim().toLowerCase();
  if (!q) return base;
  return base.filter((t) => {
    const cmd = (t.command ?? "").toLowerCase();
    const name = (t.name ?? "").toLowerCase();
    return cmd.startsWith(q) || name.includes(q);
  });
}

/**
 * Remplace le premier jeton @commande complet par le contenu de la trame.
 * Peut enchaîner plusieurs remplacements (boucle interne).
 */
export function replaceFirstTrameToken(
  value: string,
  caret: number,
  trames: TrameFromStorage[],
  opts?: { forConsultation?: boolean },
): { next: string; nextCaret: number } {
  const map = buildTrameMap(trames, opts);
  if (!map.size) return { next: value, nextCaret: caret };

  const commands = [...map.keys()].sort((a, b) => b.length - a.length);

  let s = value;
  let c = caret;

  for (let guard = 0; guard < 50; guard += 1) {
    let best: { i: number; j: number; command: string } | null = null;

    for (let i = 0; i < s.length; i += 1) {
      if (s[i] !== "@") continue;
      const beforeOk = i === 0 || !isWordChar(s[i - 1]);
      if (!beforeOk) continue;

      const rest = s.slice(i + 1);
      let matchedCommand: string | null = null;
      for (const command of commands) {
        if (rest.startsWith(command)) {
          matchedCommand = command;
          break;
        }
      }
      if (!matchedCommand) continue;

      const j = i + 1 + matchedCommand.length;
      const nextChar = j < s.length ? s[j] : "";
      const canExpand = j === s.length || !isWordChar(nextChar);
      if (!canExpand) continue;

      if (!best || i < best.i || (i === best.i && matchedCommand.length > best.command.length)) {
        best = { i, j, command: matchedCommand };
      }
    }

    if (!best) break;

    const replacement = map.get(best.command) ?? "";
    const before = s.slice(0, best.i);
    const after = s.slice(best.j);
    const delta = replacement.length - (best.j - best.i);

    s = `${before}${replacement}${after}`;

    if (c <= best.i) {
      // inchangé
    } else if (c > best.i && c <= best.j) {
      c = best.i + replacement.length;
    } else {
      c += delta;
    }
  }

  return { next: s, nextCaret: c };
}

/** Pour enregistrement : migrer les anciens marqueurs puis tout développer. */
export function finalizeNotesForSaveWithTrames(value: string, trames: TrameFromStorage[]): string {
  let s = migrateLegacyToBubbles(value);
  for (let guard = 0; guard < 50; guard += 1) {
    const { next } = replaceFirstTrameToken(s, s.length, trames, { forConsultation: true });
    if (next === s) break;
    s = next;
  }
  return s;
}
