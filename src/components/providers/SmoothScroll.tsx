"use client";
import { createContext, useCallback, useContext, useEffect, useRef, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import Lenis from "lenis";
import { gsap, ScrollTrigger, prefersReducedMotion } from "@/lib/scroll";

interface ScrollApi {
  scrollTo: (target: number | string | HTMLElement, opts?: { duration?: number; offset?: number }) => void;
  lock: () => void;
  unlock: () => void;
}

const Ctx = createContext<ScrollApi | null>(null);

export function SmoothScroll({ children }: { children: ReactNode }) {
  const lenisRef = useRef<Lenis | null>(null);
  const locks = useRef(0);
  const pathname = usePathname();

  useEffect(() => {
    if (prefersReducedMotion()) return;
    const lenis = new Lenis({ lerp: 0.1, smoothWheel: true });
    lenisRef.current = lenis;
    lenis.on("scroll", ScrollTrigger.update);
    const tick = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);
    return () => {
      gsap.ticker.remove(tick);
      lenis.destroy();
      lenisRef.current = null;
    };
  }, []);

  // New page starts at the top (unless the URL targets an anchor).
  useEffect(() => {
    if (window.location.hash) return;
    lenisRef.current ? lenisRef.current.scrollTo(0, { immediate: true }) : window.scrollTo(0, 0);
  }, [pathname]);

  const scrollTo = useCallback<ScrollApi["scrollTo"]>((target, opts) => {
    const lenis = lenisRef.current;
    if (lenis) return lenis.scrollTo(target, { duration: opts?.duration ?? 1.3, offset: opts?.offset ?? 0 });
    const top =
      typeof target === "number"
        ? target
        : (typeof target === "string" ? document.querySelector(target) : target)?.getBoundingClientRect().top ?? 0;
    window.scrollTo({ top: typeof target === "number" ? top : top + window.scrollY + (opts?.offset ?? 0), behavior: prefersReducedMotion() ? "auto" : "smooth" });
  }, []);

  // Nested locks: a modal opened from the mobile menu must not unlock scrolling early.
  const lock = useCallback(() => {
    if (locks.current++ === 0) {
      lenisRef.current?.stop();
      document.documentElement.style.overflow = "hidden";
    }
  }, []);
  const unlock = useCallback(() => {
    locks.current = Math.max(0, locks.current - 1);
    if (locks.current === 0) {
      lenisRef.current?.start();
      document.documentElement.style.overflow = "";
    }
  }, []);

  return <Ctx.Provider value={{ scrollTo, lock, unlock }}>{children}</Ctx.Provider>;
}

export function useScrollApi() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useScrollApi must be used inside SmoothScroll");
  return v;
}
