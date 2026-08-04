import type { ReactNode } from "react";

interface MarqueeProps {
  children: ReactNode;
  reverse?: boolean;
  speed?: number;
  className?: string;
}

export function Marquee({ children, reverse = false, speed = 30, className = "" }: MarqueeProps) {
  return (
    <div className={`overflow-hidden ${className}`}>
      <div
        className={`marquee-hover flex w-max ${
          reverse ? "animate-marquee-reverse" : "animate-marquee"
        }`}
        style={{ animationDuration: `${speed}s` }}
      >
        <div className="flex shrink-0 items-center">{children}</div>
        <div className="flex shrink-0 items-center" aria-hidden="true">
          {children}
        </div>
      </div>
    </div>
  );
}
