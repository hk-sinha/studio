"use client";
import { useEffect, useMemo, useRef, type CSSProperties } from "react";
import Link from "next/link";
import { useSiteData } from "@/components/providers/SiteDataProvider";
import { VideoCard } from "@/components/ui/VideoCard";
import { ArrowRight } from "@/components/ui/icons";
import { nudge } from "@/components/ui/button";
import { LEAD_TYPES } from "@/lib/config";
import type { Project } from "@/lib/types";
import { gsap, prefersReducedMotion, refreshScroll } from "@/lib/scroll";

const MIN_PER_ROW = 10;

/** Repeat a short list so each row is always wider than the screen plus its travel. */
function fill(list: Project[]) {
  if (!list.length) return [];
  const out: Project[] = [];
  while (out.length < MIN_PER_ROW) out.push(...list);
  return out;
}

const size = (p: Project): CSSProperties => ({
  width: `calc(var(--h) * ${p.shape === "portrait" ? 9 / 16 : 16 / 9})`,
  height: "var(--h)",
});

/**
 * Featured work, right after the hero: two rows that slide in opposite directions as the
 * page scrolls (top row to the right, bottom row to the left). Not pinned.
 */
export function FeaturedRows() {
  const { projects, status } = useSiteData();
  const root = useRef<HTMLElement>(null);
  const rowA = useRef<HTMLUListElement>(null);
  const rowB = useRef<HTMLUListElement>(null);

  const [top, bottom] = useMemo(() => {
    const lead = projects.filter((p) => LEAD_TYPES.includes(p.type)); // already best-first
    let a = lead.filter((p) => p.type === "ai_ads" || p.type === "ai_cinema");
    let b = lead.filter((p) => p.type === "motion_ads" || p.type === "showreels");
    // If one side is thin, deal the whole lead list across both rows instead.
    if (a.length < 3 || b.length < 3) {
      a = lead.filter((_, i) => i % 2 === 0);
      b = lead.filter((_, i) => i % 2 === 1);
    }
    return [fill(a), fill(b)];
  }, [projects]);

  useEffect(() => {
    // Capture the nodes now: GSAP re-evaluates these on revert, after React has cleared the refs.
    const section = root.current, a = rowA.current, b = rowB.current;
    if (!top.length || !section || !a || !b || prefersReducedMotion()) return;
    const ctx = gsap.context(() => {
      const travel = (el: HTMLElement) => Math.max(0, Math.min(el.scrollWidth - window.innerWidth, window.innerWidth * 0.55));
      const st = { trigger: section, start: "top bottom", end: "bottom top", scrub: 0.7, invalidateOnRefresh: true };
      gsap.fromTo(a, { x: () => -travel(a) }, { x: 0, ease: "none", scrollTrigger: st });
      gsap.fromTo(b, { x: 0 }, { x: () => -travel(b), ease: "none", scrollTrigger: { ...st } });
    }, section);
    refreshScroll();
    return () => ctx.revert();
  }, [top.length, bottom.length]);

  if (status === "ready" && !top.length) return null;

  // A render helper, not a component: a nested component would remount every render and drop the GSAP refs.
  const row = (items: Project[], refEl: React.RefObject<HTMLUListElement | null>, label: string) => (
    <ul ref={refEl} aria-label={label} className="flex w-max gap-4 will-change-transform">
      {status === "loading"
        ? Array.from({ length: 8 }, (_, i) => (
            <li key={i} className="shrink-0" style={{ width: `calc(var(--h) * ${i % 3 ? 9 / 16 : 16 / 9})`, height: "var(--h)" }}>
              <span className="skeleton block size-full rounded-card" />
            </li>
          ))
        : items.map((p, i) => {
            // Repeats are decorative copies: inert, so not focusable and hidden from assistive tech.
            const copy = items.findIndex((x) => x.id === p.id) !== i;
            return (
              <li key={`${p.id}-${i}`} className="shrink-0" style={size(p)} inert={copy || undefined}>
                <VideoCard p={p} eager={i < 4} bare />
              </li>
            );
          })}
    </ul>
  );

  return (
    <section ref={root} aria-labelledby="featured-title" className="relative overflow-hidden py-[clamp(72px,9vw,128px)]">
      <div className="wrap mb-10 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mb-4 text-xs uppercase tracking-[0.22em] text-muted">Featured work</p>
          <h2 id="featured-title" className="display text-[clamp(34px,4.6vw,60px)]">AI ads, motion<br />and cinema.</h2>
        </div>
        <Link href="/work/" className="liquid liquid-hover group inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm">
          See all work <ArrowRight weight="light" size={16} className={nudge} />
        </Link>
      </div>

      <div className="flex flex-col gap-4 [--h:170px] md:[--h:240px] xl:[--h:300px]">
        {row(top, rowA, "AI ads and AI cinema")}
        {row(bottom, rowB, "Motion ads and showreels")}
      </div>
    </section>
  );
}
