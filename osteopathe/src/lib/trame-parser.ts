export type TrameToken =
  | { type: "text"; value: string }
  | { type: "chip"; value: string };

/**
 * Prend un texte brut (ex: "Douleur [légère] [modérée]")
 * et retourne un tableau de tokens.
 */
export function parseTrameContent(text: string): TrameToken[] {
  const tokens: TrameToken[] = [];
  let lastIndex = 0;
  const regex = /\[([^\]]+)\]/g;
  let match;

  while ((match = regex.exec(text)) !== null) {
    // Add text before the chip
    if (match.index > lastIndex) {
      tokens.push({
        type: "text",
        value: text.slice(lastIndex, match.index),
      });
    }

    // Add the chip
    tokens.push({
      type: "chip",
      value: match[1],
    });

    lastIndex = regex.lastIndex;
  }

  // Add remaining text
  if (lastIndex < text.length) {
    tokens.push({
      type: "text",
      value: text.slice(lastIndex),
    });
  }

  return tokens;
}
