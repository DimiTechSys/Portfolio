"use client";

import type { KeyboardEvent } from "react";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { RichEditorToolbar } from "@/components/rich-editor-toolbar";
import {
  applyBroomToSegments,
  hasInteractiveMarkers,
  insertEmptyBubble,
  parseChoiceSegments,
  serializeChoiceSegments,
  type ChoiceSegment,
} from "@/lib/trame-choice-syntax";
import {
  filterTramesByMentionQuery,
  getActiveAtMention,
  readTramesFromStorage,
  replaceFirstTrameToken,
  type TrameFromStorage,
} from "@/lib/trame-at-expand";

export type TrameNotesFieldProps = {
  value: string;
  onValueChange: (value: string, caret: number) => void;
  notesRef: React.RefObject<HTMLTextAreaElement | null>;
  textareaClassName?: string;
  placeholder?: string;
  pendingCaretRef?: React.MutableRefObject<number | null>;
  textareaId?: string;
  /** Liste filtrable des trames quand on tape @ (ex. notes de consultation). */
  atCommandSuggestions?: boolean;
};

type AtSuggestionState = {
  /** Chaîne sérialisée sur laquelle start/end ont été calculés (même référence que les segments). */
  sourceSnapshot: string;
  start: number;
  end: number;
  query: string;
  items: TrameFromStorage[];
  selectedIndex: number;
};

/**
 * Toujours offrir des champs texte avant la 1re bulle et après la dernière,
 * pour pouvoir continuer à écrire en texte normal (sinon rien après `…›`).
 */
function ensureEditableTextAroundBubbles(segments: ChoiceSegment[]): ChoiceSegment[] {
  if (segments.length === 0) return [{ type: "text", value: "" }];
  let out = [...segments];
  if (out[0].type === "bubble") {
    out = [{ type: "text", value: "" }, ...out];
  }
  if (out[out.length - 1].type === "bubble") {
    out = [...out, { type: "text", value: "" }];
  }
  return out;
}

function normalizeSegments(segments: ChoiceSegment[]): ChoiceSegment[] {
  return ensureEditableTextAroundBubbles(segments.length === 0 ? [] : segments);
}

function valueOffsetBeforeSegment(segments: ChoiceSegment[], index: number): number {
  return serializeChoiceSegments(segments.slice(0, index)).length;
}

/** Retire une bulle vide et fusionne le texte autour ; null si la bulle n’est pas vide. */
function removeEmptyBubbleSegment(
  prev: ChoiceSegment[],
  segmentIndex: number,
): { merged: ChoiceSegment[]; caret: number } | null {
  const s = prev[segmentIndex];
  if (!s || s.type !== "bubble" || s.value.trim() !== "") return null;
  const caret = valueOffsetBeforeSegment(prev, segmentIndex);
  const trimmed = prev.filter((_, i) => i !== segmentIndex);
  const serialized = serializeChoiceSegments(trimmed);
  const merged = normalizeSegments(parseChoiceSegments(serialized));
  return { merged, caret };
}

/** Map global offset in serialized value to textarea or bubble input caret. */
function valueOffsetToFocus(
  segments: ChoiceSegment[],
  offset: number,
  valueLength: number,
): { kind: "text" | "bubble"; index: number; local: number } {
  if (segments.length === 0) return { kind: "text", index: 0, local: 0 };
  let pos = 0;
  for (let i = 0; i < segments.length; i++) {
    const s = segments[i];
    const len = serializeChoiceSegments([s]).length;
    const end = pos + len;
    if (offset > end) {
      pos = end;
      continue;
    }
    if (offset === end && i < segments.length - 1) {
      pos = end;
      continue;
    }
    if (s.type === "text") {
      return { kind: "text", index: i, local: Math.min(Math.max(0, offset - pos), s.value.length) };
    }
    const innerStart = pos + 1;
    const innerEnd = innerStart + s.value.length;
    if (offset < innerStart) return { kind: "bubble", index: i, local: 0 };
    if (offset <= innerEnd) return { kind: "bubble", index: i, local: offset - innerStart };
    return { kind: "bubble", index: i, local: s.value.length };
  }
  const lastIdx = segments.length - 1;
  const last = segments[lastIdx];
  if (last.type === "text") return { kind: "text", index: lastIdx, local: last.value.length };
  return { kind: "bubble", index: lastIdx, local: last.value.length };
}

export function TrameNotesField({
  value,
  onValueChange,
  notesRef,
  textareaClassName = "",
  placeholder = "",
  pendingCaretRef,
  textareaId,
  atCommandSuggestions = false,
}: TrameNotesFieldProps) {
  const [segments, setSegments] = useState<ChoiceSegment[]>(() => normalizeSegments(parseChoiceSegments(value)));
  const segmentsRef = useRef(segments);
  segmentsRef.current = segments;
  /** Premier clic = insérer bulle + actif ; second clic ou focus texte = texte normal uniquement. */
  const [bubbleModeActive, setBubbleModeActive] = useState(false);
  const [atSuggestion, setAtSuggestion] = useState<AtSuggestionState | null>(null);
  const atSuggestionRef = useRef<AtSuggestionState | null>(null);
  atSuggestionRef.current = atSuggestion;
  const skipParseRef = useRef(false);
  const pendingBubbleFocusRef = useRef<number | null>(null);
  const textRefs = useRef<(HTMLTextAreaElement | null)[]>([]);
  const bubbleRefs = useRef<(HTMLInputElement | null)[]>([]);
  const lastFocusedRef = useRef<{
    segmentIndex: number;
    kind: "text" | "bubble";
  } | null>(null);

  const pushToParent = useCallback(
    (serialized: string, caret: number) => {
      queueMicrotask(() => {
        const trames = readTramesFromStorage();
        const safeCaret =
          typeof caret === "number" && !Number.isNaN(caret)
            ? Math.min(Math.max(0, caret), serialized.length)
            : serialized.length;
        const { next, nextCaret } = replaceFirstTrameToken(serialized, safeCaret, trames, {
          forConsultation: true,
        });
        onValueChange(next, nextCaret);
      });
    },
    [onValueChange],
  );

  const applyAtSuggestionPick = useCallback(
    (command: string) => {
      const sug = atSuggestionRef.current;
      if (!sug) return;
      const source = sug.sourceSnapshot;
      const withAt = `${source.slice(0, sug.start)}@${command}${source.slice(sug.end)}`;
      const caretAfterAt = sug.start + 1 + command.length;
      const trames = readTramesFromStorage();
      const { next: expanded, nextCaret } = replaceFirstTrameToken(withAt, caretAfterAt, trames, {
        forConsultation: true,
      });
      skipParseRef.current = true;
      setSegments(normalizeSegments(parseChoiceSegments(expanded)));
      setAtSuggestion(null);
      /** Hors updater setSegments : expansion synchrone pour que le contenu trame remplace @commande (évite course avec queueMicrotask). */
      onValueChange(expanded, nextCaret);
    },
    [onValueChange],
  );

  const refreshAtSuggestionFromTextarea = useCallback(
    (segmentIndex: number) => {
      if (!atCommandSuggestions) return;
      const ta = textRefs.current[segmentIndex];
      if (!ta) return;
      const serialized = serializeChoiceSegments(segments);
      const base = valueOffsetBeforeSegment(segments, segmentIndex);
      const caret = base + ta.selectionStart;
      const m = getActiveAtMention(serialized, caret);
      if (!m) {
        setAtSuggestion(null);
        return;
      }
      const items = filterTramesByMentionQuery(readTramesFromStorage(), m.query);
      setAtSuggestion((prev) => ({
        sourceSnapshot: serialized,
        start: m.start,
        end: m.end,
        query: m.query,
        items,
        selectedIndex:
          prev && prev.query === m.query ? Math.min(prev.selectedIndex, Math.max(0, items.length - 1)) : 0,
      }));
    },
    [atCommandSuggestions, segments],
  );

  const handleTextKeyDown = useCallback(
    (segmentIndex: number, e: KeyboardEvent<HTMLTextAreaElement>) => {
      const sug = atSuggestionRef.current;
      if (!atCommandSuggestions || !sug) return;
      if (e.key === "Escape") {
        e.preventDefault();
        setAtSuggestion(null);
        return;
      }
      if (sug.items.length === 0) return;
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setAtSuggestion((prev) =>
          prev ? { ...prev, selectedIndex: Math.min(prev.selectedIndex + 1, prev.items.length - 1) } : null,
        );
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setAtSuggestion((prev) =>
          prev ? { ...prev, selectedIndex: Math.max(prev.selectedIndex - 1, 0) } : null,
        );
        return;
      }
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        const cmd = sug.items[sug.selectedIndex]?.command?.trim();
        if (cmd) applyAtSuggestionPick(cmd);
        return;
      }
      if (e.key === "Tab" && !e.shiftKey) {
        e.preventDefault();
        const cmd = sug.items[sug.selectedIndex]?.command?.trim();
        if (cmd) applyAtSuggestionPick(cmd);
      }
    },
    [atCommandSuggestions, applyAtSuggestionPick],
  );

  useEffect(() => {
    if (!atCommandSuggestions) setAtSuggestion(null);
  }, [atCommandSuggestions]);

  const markersPresent = hasInteractiveMarkers(value);

  useEffect(() => {
    if (skipParseRef.current) {
      skipParseRef.current = false;
      return;
    }
    setSegments(normalizeSegments(parseChoiceSegments(value)));
  }, [value]);

  const runBroom = useCallback(() => {
    const next = serializeChoiceSegments(applyBroomToSegments(segments));
    const caret = next.length;
    setBubbleModeActive(false);
    pushToParent(next, caret);
  }, [segments, pushToParent]);

  const getInsertRange = useCallback((): { start: number; end: number } => {
    const last = lastFocusedRef.current;
    if (last?.kind === "text") {
      const ta = textRefs.current[last.segmentIndex];
      if (ta && segments[last.segmentIndex]?.type === "text") {
        const base = valueOffsetBeforeSegment(segments, last.segmentIndex);
        return { start: base + ta.selectionStart, end: base + ta.selectionEnd };
      }
    }
    if (last?.kind === "bubble") {
      const segIdx = last.segmentIndex;
      if (segments[segIdx]?.type === "bubble") {
        const pos = valueOffsetBeforeSegment(segments, segIdx) + serializeChoiceSegments([segments[segIdx]]).length;
        return { start: pos, end: pos };
      }
    }
    return { start: value.length, end: value.length };
  }, [segments, value]);

  const insertBubbleAtCaret = useCallback(() => {
    const { start, end } = getInsertRange();
    const { next, nextCaret } = insertEmptyBubble(value, start, end);
    const nextSegs = normalizeSegments(parseChoiceSegments(next));
    skipParseRef.current = true;
    setSegments(nextSegs);
    pushToParent(next, nextCaret);

    let pos = 0;
    for (let i = 0; i < nextSegs.length; i++) {
      const s = nextSegs[i];
      if (s.type === "bubble") {
        const innerStart = pos + 1;
        if (innerStart === nextCaret) {
          pendingBubbleFocusRef.current = i;
          break;
        }
      }
      pos += serializeChoiceSegments([nextSegs[i]]).length;
    }
  }, [value, getInsertRange, pushToParent]);

  /** Place le curseur dans le texte juste après la bulle (fin de saisie dans la pilule). */
  const focusTextAfterBubble = useCallback(
    (bubbleSegmentIndex: number) => {
      setBubbleModeActive(false);
      let nextIdx = segments.findIndex((s, idx) => idx > bubbleSegmentIndex && s.type === "text");
      if (nextIdx < 0) {
        nextIdx = segments.findIndex((s) => s.type === "text");
      }
      if (nextIdx < 0) return;
      requestAnimationFrame(() => {
        const el = textRefs.current[nextIdx];
        if (!el) return;
        el.focus();
        const end = el.value.length;
        el.setSelectionRange(end, end);
        notesRef.current = el;
        lastFocusedRef.current = { segmentIndex: nextIdx, kind: "text" };
      });
    },
    [segments, notesRef],
  );

  const onBubbleModeToggle = useCallback(() => {
    if (bubbleModeActive) {
      setBubbleModeActive(false);
      const last = lastFocusedRef.current;
      if (last?.kind === "bubble") {
        focusTextAfterBubble(last.segmentIndex);
      }
      return;
    }
    insertBubbleAtCaret();
    setBubbleModeActive(true);
  }, [bubbleModeActive, insertBubbleAtCaret, focusTextAfterBubble]);

  useLayoutEffect(() => {
    if (pendingBubbleFocusRef.current !== null) {
      const idx = pendingBubbleFocusRef.current;
      pendingBubbleFocusRef.current = null;
      const el = bubbleRefs.current[idx];
      if (el) {
        el.focus();
        el.setSelectionRange(0, 0);
      }
      return;
    }

    const pref = pendingCaretRef;
    if (!pref || pref.current === null) return;
    const pos = pref.current;
    pref.current = null;
    const focus = valueOffsetToFocus(segments, pos, value.length);
    if (focus.kind === "text") {
      const el = textRefs.current[focus.index];
      if (el) {
        notesRef.current = el;
        el.focus();
        el.setSelectionRange(focus.local, focus.local);
      }
    } else {
      const el = bubbleRefs.current[focus.index];
      if (el) {
        el.focus();
        el.setSelectionRange(focus.local, focus.local);
      }
    }
  }, [value, segments, pendingCaretRef, notesRef]);

  function updateTextSegment(index: number, text: string) {
    setSegments((prev) => {
      const next = prev.map((s, i) => (i === index && s.type === "text" ? { type: "text" as const, value: text } : s));
      skipParseRef.current = true;
      const serialized = serializeChoiceSegments(next);
      const caret = valueOffsetBeforeSegment(prev, index) + text.length;
      pushToParent(serialized, caret);
      if (atCommandSuggestions) {
        const m = getActiveAtMention(serialized, caret);
        queueMicrotask(() => {
          if (m) {
            const items = filterTramesByMentionQuery(readTramesFromStorage(), m.query);
            setAtSuggestion({
              sourceSnapshot: serialized,
              start: m.start,
              end: m.end,
              query: m.query,
              items,
              selectedIndex: 0,
            });
          } else {
            setAtSuggestion(null);
          }
        });
      }
      return next;
    });
  }

  function updateBubbleValue(index: number, bubbleValue: string) {
    setSegments((prev) => {
      const next = prev.map((s, i) =>
        i === index && s.type === "bubble" ? { ...s, value: bubbleValue } : s,
      );
      if (bubbleValue.trim() === "") {
        const removed = removeEmptyBubbleSegment(next, index);
        if (removed) {
          skipParseRef.current = true;
          const payload = serializeChoiceSegments(removed.merged);
          const { caret } = removed;
          pushToParent(payload, caret);
          queueMicrotask(() => setBubbleModeActive(false));
          return removed.merged;
        }
      }
      skipParseRef.current = true;
      const serialized = serializeChoiceSegments(next);
      const caret = valueOffsetBeforeSegment(prev, index) + 1 + bubbleValue.length;
      pushToParent(serialized, caret);
      return next;
    });
  }

  function handleBubbleBlur(segmentIndex: number) {
    setSegments((prev) => {
      const removed = removeEmptyBubbleSegment(prev, segmentIndex);
      if (!removed) return prev;
      skipParseRef.current = true;
      const payload = serializeChoiceSegments(removed.merged);
      const { caret } = removed;
      pushToParent(payload, caret);
      queueMicrotask(() => setBubbleModeActive(false));
      return removed.merged;
    });
  }

  function toggleBubble(segmentIndex: number) {
    setSegments((prev) =>
      prev.map((s, i) =>
        i === segmentIndex && s.type === "bubble" ? { ...s, selected: !s.selected } : s,
      ),
    );
  }

  const firstTextSegmentIndex = segments.findIndex((s) => s.type === "text");

  return (
    <div className="trame-notes-field">
      <RichEditorToolbar
        bubbleModeActive={bubbleModeActive}
        onBubbleModeToggle={onBubbleModeToggle}
        onBroomFinalize={markersPresent ? runBroom : undefined}
      />
      <div className="trame-notes-field-interactive">
        {atCommandSuggestions && atSuggestion ? (
          <div
            className="trame-at-suggestions-bar"
            role="listbox"
            aria-label="Trames disponibles"
            aria-activedescendant={
              atSuggestion.items.length > 0 ? `trame-at-sug-${atSuggestion.selectedIndex}` : undefined
            }
          >
            {atSuggestion.items.length === 0 ? (
              <div className="trame-at-suggestions-bar__empty">Aucune trame ne correspond.</div>
            ) : (
              atSuggestion.items.map((t, idx) => {
                const cmd = t.command?.trim() ?? "";
                const active = idx === atSuggestion.selectedIndex;
                return (
                  <button
                    key={`${cmd}-${t.id ?? idx}`}
                    id={`trame-at-sug-${idx}`}
                    type="button"
                    role="option"
                    aria-selected={active}
                    className={`trame-at-suggestions-bar__chip${active ? " is-active" : ""}`}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      if (cmd) applyAtSuggestionPick(cmd);
                    }}
                    onMouseEnter={() => {
                      setAtSuggestion((prev) => (prev ? { ...prev, selectedIndex: idx } : null));
                    }}
                  >
                    <span className="trame-at-suggestions-bar__cmd">@{cmd}</span>
                    {t.name?.trim() ? (
                      <span className="trame-at-suggestions-bar__name">{t.name.trim()}</span>
                    ) : null}
                  </button>
                );
              })
            )}
          </div>
        ) : null}
        <div className="trame-notes-field-flow" role="group" aria-label="Texte et bulles d’options">
          {segments.map((seg, i) => {
            if (seg.type === "text") {
              const isFirstText = i === firstTextSegmentIndex;
              return (
                <span key={`t-${i}`} className="trame-notes-field-text-wrap">
                  <textarea
                    ref={(el) => {
                      textRefs.current[i] = el;
                    }}
                    id={isFirstText ? textareaId : undefined}
                    className={`trame-notes-field-text-chunk ${textareaClassName}`.trim()}
                    value={seg.value}
                    placeholder={isFirstText ? placeholder : undefined}
                    onChange={(e) => updateTextSegment(i, e.target.value)}
                    onFocus={() => {
                      setBubbleModeActive(false);
                      lastFocusedRef.current = { segmentIndex: i, kind: "text" };
                      const el = textRefs.current[i];
                      if (el) notesRef.current = el;
                    }}
                    onSelect={() => {
                      lastFocusedRef.current = { segmentIndex: i, kind: "text" };
                      refreshAtSuggestionFromTextarea(i);
                    }}
                    onKeyDown={(e) => handleTextKeyDown(i, e)}
                    onKeyUp={() => {
                      lastFocusedRef.current = { segmentIndex: i, kind: "text" };
                    }}
                    rows={1}
                    aria-label={isFirstText ? "Notes" : "Fragment de texte"}
                  />
                </span>
              );
            }
            const bubbleChars = Math.max(3, Math.min(48, seg.value.length + 2));
            return (
              <div
                key={`b-${i}`}
                className={`trame-notes-bubble-wrap${seg.selected ? " is-selected" : " is-struck"}`}
                title="Alt+clic : exclure ou réintégrer cette option avant le balai"
                onMouseDown={(e) => {
                  if (!e.altKey) return;
                  e.preventDefault();
                  toggleBubble(i);
                }}
              >
                <button
                  type="button"
                  className="trame-notes-bubble-sr"
                  tabIndex={-1}
                  aria-pressed={seg.selected}
                  onClick={() => toggleBubble(i)}
                >
                  {seg.selected ? "Exclure cette option du balai" : "Réintégrer cette option au balai"}
                </button>
                <input
                  ref={(el) => {
                    bubbleRefs.current[i] = el;
                  }}
                  type="text"
                  className="trame-notes-bubble-field"
                  style={{ width: `${bubbleChars}ch` }}
                  value={seg.value}
                  onChange={(e) => updateBubbleValue(i, e.target.value)}
                  onFocus={() => {
                    lastFocusedRef.current = { segmentIndex: i, kind: "bubble" };
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      focusTextAfterBubble(i);
                      return;
                    }
                    if (e.key === "Escape") {
                      e.preventDefault();
                      focusTextAfterBubble(i);
                      return;
                    }
                  }}
                  onBlur={() => handleBubbleBlur(i)}
                  placeholder="…"
                  aria-label="Option (bulle)"
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
