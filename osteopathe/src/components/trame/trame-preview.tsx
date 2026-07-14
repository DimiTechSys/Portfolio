"use client";

import { parseTrameContent } from "@/lib/trame-parser";

interface TramePreviewProps {
  content: string;
}

export function TramePreview({ content }: TramePreviewProps) {
  const tokens = parseTrameContent(content);

  return (
    <div className="trame-preview-container">
      {tokens.map((token, idx) => (
        <span key={idx}>
          {token.type === "text" ? (
            token.value
          ) : (
            <span className="trame-bubble-preview">{token.value}</span>
          )}
        </span>
      ))}

      <style jsx>{`
        .trame-preview-container {
          padding: 1rem;
          border: 1px solid var(--border);
          border-radius: 8px;
          background: #fafafa;
          min-height: 50px;
          line-height: 1.6;
          font-size: 0.95rem;
          color: var(--foreground);
        }
        .trame-bubble-preview {
          display: inline-block;
          padding: 2px 8px;
          margin: 0 2px;
          border: 1px solid #d1d5db;
          border-radius: 12px;
          background: #fff;
          color: #6b7280;
          font-size: 0.9em;
        }
      `}</style>
    </div>
  );
}
