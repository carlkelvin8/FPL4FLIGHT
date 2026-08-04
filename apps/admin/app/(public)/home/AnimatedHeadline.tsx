"use client";

import { useEffect, useState } from "react";

interface AnimatedHeadlineProps {
  text: string;
  className?: string;
  delayBase?: number;
}

export function AnimatedHeadline({ text, className = "", delayBase = 70 }: AnimatedHeadlineProps) {
  const words = text.split(" ");
  const [start, setStart] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setStart(true), 150);
    return () => clearTimeout(t);
  }, []);

  return (
    <span className={className}>
      {words.map((word, i) => (
        <span
          key={i}
          className={`inline-block overflow-hidden align-bottom ${
            i < words.length - 1 ? "mr-[0.24em]" : ""
          }`}
        >
          <span
            className={`inline-block ${start ? "animate-word-in" : "opacity-0"}`}
            style={{ animationDelay: `${i * delayBase}ms` }}
          >
            {word}
          </span>
        </span>
      ))}
    </span>
  );
}
