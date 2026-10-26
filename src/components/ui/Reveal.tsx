"use client";
import { useEffect, useRef, type CSSProperties, type ElementType, type ReactNode } from "react";

interface Props {
  as?: ElementType;
  delay?: number;
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
  [key: string]: unknown;
}

/** Fades content up once it enters the viewport. CSS-only motion, no library. */
export function Reveal({ as: Tag = "div", delay = 0, className = "", style, children, ...rest }: Props) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add("is-in");
          io.disconnect();
        }
      },
      { rootMargin: "0px 0px -12% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <Tag ref={ref} className={`reveal ${className}`} style={{ ...style, ["--reveal-delay" as string]: `${delay}ms` }} {...rest}>
      {children}
    </Tag>
  );
}
