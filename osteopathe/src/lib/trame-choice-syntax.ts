/** Single-option bubble: ‹text› (U+2039 / U+203A). Legacy [x] and [[a|b]] are migrated on parse. */

const BUBBLE_OPEN = "\u2039"; // ‹
const BUBBLE_CLOSE = "\u203A"; // ›

export type ChoiceSegment =
  | { type: "text"; value: string }
  | { type: "bubble"; value: string; selected: boolean };

/** Converts legacy [[a|b|c]] to ‹a›‹b›‹c› and [x] to ‹x›. Leaves text without [ unchanged except at bracket sites. */
export function migrateLegacyToBubbles(input: string): string {
  if (!input.includes("[")) return input;

  let out = "";
  let i = 0;
  const len = input.length;
  while (i < len) {
    if (input[i] === "[" && input[i + 1] === "[") {
      const close = input.indexOf("]]", i + 2);
      if (close === -1) {
        out += input.slice(i);
        break;
      }
      const inner = input.slice(i + 2, close);
      const parts = inner.split("|").map((s) => s.trim()).filter(Boolean);
      if (parts.length >= 2) {
        out += parts.map((p) => `${BUBBLE_OPEN}${p}${BUBBLE_CLOSE}`).join("");
      } else {
        out += `${BUBBLE_OPEN}${inner}${BUBBLE_CLOSE}`;
      }
      i = close + 2;
    } else if (input[i] === "[") {
      const close = input.indexOf("]", i + 1);
      if (close === -1) {
        out += input.slice(i);
        break;
      }
      const inner = input.slice(i + 1, close);
      out += `${BUBBLE_OPEN}${inner}${BUBBLE_CLOSE}`;
      i = close + 1;
    } else {
      const nextBracket = input.indexOf("[", i);
      const end = nextBracket === -1 ? len : nextBracket;
      out += input.slice(i, end);
      i = end;
    }
  }
  return out;
}

export function hasInteractiveMarkers(text: string): boolean {
  return migrateLegacyToBubbles(text).includes(BUBBLE_OPEN);
}

export function parseChoiceSegments(input: string): ChoiceSegment[] {
  const normalized = migrateLegacyToBubbles(input);
  const out: ChoiceSegment[] = [];
  let i = 0;
  while (i < normalized.length) {
    const open = normalized.indexOf(BUBBLE_OPEN, i);
    if (open === -1) {
      const rest = normalized.slice(i);
      if (rest) out.push({ type: "text", value: rest });
      break;
    }
    if (open > i) {
      out.push({ type: "text", value: normalized.slice(i, open) });
    }
    const close = normalized.indexOf(BUBBLE_CLOSE, open + 1);
    if (close === -1) {
      out.push({ type: "text", value: normalized.slice(open) });
      break;
    }
    const inner = normalized.slice(open + BUBBLE_OPEN.length, close);
    out.push({ type: "bubble", value: inner, selected: true });
    i = close + BUBBLE_CLOSE.length;
  }
  return mergeAdjacentText(out);
}

function mergeAdjacentText(segments: ChoiceSegment[]): ChoiceSegment[] {
  const out: ChoiceSegment[] = [];
  for (const s of segments) {
    if (s.type === "text" && out.length > 0 && out[out.length - 1].type === "text") {
      (out[out.length - 1] as { type: "text"; value: string }).value += s.value;
    } else {
      out.push(s);
    }
  }
  return out;
}

export function serializeChoiceSegments(segments: ChoiceSegment[]): string {
  return segments
    .map((s) => {
      if (s.type === "text") return s.value;
      return `${BUBBLE_OPEN}${s.value}${BUBBLE_CLOSE}`;
    })
    .join("");
}

export function applyBroomToSegments(segments: ChoiceSegment[]): ChoiceSegment[] {
  const next: ChoiceSegment[] = [];
  for (const s of segments) {
    if (s.type === "text") {
      next.push(s);
    } else if (s.type === "bubble") {
      if (s.selected) {
        next.push({ type: "text", value: s.value });
      }
    }
  }
  return mergeAdjacentText(next);
}

/** Insert an empty bubble ‹› at selection [start,end); caret ends between the two marks. */
export function insertEmptyBubble(text: string, start: number, end: number): { next: string; nextCaret: number } {
  const insert = `${BUBBLE_OPEN}${BUBBLE_CLOSE}`;
  const next = text.slice(0, start) + insert + text.slice(end);
  return { next, nextCaret: start + BUBBLE_OPEN.length };
}
