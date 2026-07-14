"use client";

import { useState, useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function ProductGallery({
  images,
  alt,
  fallbackName,
}: {
  images: string[];
  alt: string;
  fallbackName: string;
}) {
  const [index, setIndex] = useState(0);
  const touchX = useRef<number | null>(null);

  const has = images.length > 0;
  const count = images.length;
  const go = (i: number) => setIndex(((i % count) + count) % count);

  function onTouchStart(e: React.TouchEvent) {
    touchX.current = e.touches[0].clientX;
  }
  function onTouchEnd(e: React.TouchEvent) {
    if (touchX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchX.current;
    if (Math.abs(dx) > 40) go(index + (dx < 0 ? 1 : -1));
    touchX.current = null;
  }

  return (
    <div>
      <div
        className="card relative aspect-[4/3] w-full overflow-hidden"
        style={{ background: "var(--color-surface-2)" }}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        {has ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={images[index]}
            alt={`${alt} — photo ${index + 1}`}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <span style={{ fontFamily: "var(--font-serif)", color: "var(--color-gold-deep)", fontSize: "2.4rem" }}>
              {fallbackName}
            </span>
          </div>
        )}

        {count > 1 && (
          <>
            <button
              type="button"
              aria-label="Photo précédente"
              onClick={() => go(index - 1)}
              className="absolute left-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full"
              style={{ background: "rgba(0,0,0,.42)", color: "#fff", backdropFilter: "blur(4px)" }}
            >
              <ChevronLeft size={22} />
            </button>
            <button
              type="button"
              aria-label="Photo suivante"
              onClick={() => go(index + 1)}
              className="absolute right-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full"
              style={{ background: "rgba(0,0,0,.42)", color: "#fff", backdropFilter: "blur(4px)" }}
            >
              <ChevronRight size={22} />
            </button>
            <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5">
              {images.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  aria-label={`Aller à la photo ${i + 1}`}
                  onClick={() => go(i)}
                  className="h-2 rounded-full transition-all"
                  style={{
                    width: i === index ? 20 : 8,
                    background: i === index ? "var(--color-gold)" : "rgba(244,236,224,.5)",
                  }}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Miniatures */}
      {count > 1 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {images.map((src, i) => (
            <button
              key={`${src}-${i}`}
              type="button"
              onClick={() => go(i)}
              className="h-16 w-16 overflow-hidden rounded-lg"
              style={{ border: i === index ? "2px solid var(--color-gold)" : "1px solid var(--color-line)" }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt={`Miniature ${i + 1}`} className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
