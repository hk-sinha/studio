"use client";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") gsap.registerPlugin(ScrollTrigger);

export { gsap, ScrollTrigger };

let timer: ReturnType<typeof setTimeout> | undefined;

/**
 * Sections mount their ScrollTriggers at different times (some wait for Firestore),
 * so positions must be re-sorted by page order and recomputed after each one.
 */
export function refreshScroll() {
  clearTimeout(timer);
  timer = setTimeout(() => {
    ScrollTrigger.sort();
    ScrollTrigger.refresh();
  }, 60);
}

export const prefersReducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
