"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

type RotatingTextProps = {
  words: string[];
  /** Délai entre deux mots, en ms. */
  interval?: number;
  className?: string;
};

export function RotatingText({ words, interval = 2000, className }: RotatingTextProps) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setIndex((prev) => (prev === words.length - 1 ? 0 : prev + 1));
    }, interval);
    return () => clearTimeout(timeoutId);
  }, [index, words, interval]);

  return (
    <span className="relative flex w-full justify-center overflow-hidden text-center md:pb-4 md:pt-1">
      &nbsp;
      {words.map((word, i) => (
        <motion.span
          key={word}
          className={cn("absolute font-semibold", className)}
          initial={{ opacity: 0, y: -100 }}
          transition={{ type: "spring", stiffness: 50 }}
          animate={
            index === i
              ? { y: 0, opacity: 1 }
              : { y: index > i ? -150 : 150, opacity: 0 }
          }
        >
          {word}
        </motion.span>
      ))}
    </span>
  );
}
