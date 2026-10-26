"use client";
import { useEffect, useRef } from "react";
import { useSiteData } from "@/components/providers/SiteDataProvider";
import { useUI } from "@/components/providers/UIProvider";
import { btn, nudge } from "@/components/ui/button";
import { useMediaQuery } from "@/components/ui/useMediaQuery";
import { ArrowRight, Play } from "@/components/ui/icons";
import { createLensRenderer } from "@/lib/lens";
import Link from "next/link";
import { CATEGORIES, LEAD_TYPES } from "@/lib/config";
import { gsap, prefersReducedMotion, refreshScroll } from "@/lib/scroll";

export function Hero() {
  const { flashes, flashesMobile, hero, profile } = useSiteData();
  // Same breakpoint as the lens renderer: below 900px the frame is a portrait phone screen.
  const phone = useMediaQuery("(max-width: 899px)");
  const { openContact, openVideo, setHeroLight, heroEnd } = useUI();
  const root = useRef<HTMLElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const lens = useRef<ReturnType<typeof createLensRenderer> | null>(null);

  // Renderer lifecycle
  useEffect(() => {
    const r = createLensRenderer(canvas.current!);
    lens.current = r;
    const ro = new ResizeObserver(() => r.resize());
    ro.observe(canvas.current!);
    return () => {
      ro.disconnect();
      r.dispose();
      lens.current = null;
    };
  }, []);

  // Films that flash inside the lens: picked in Admin > Hero (separate lists for desktop and
  // phones), else the best lead pieces in the screen's orientation.
  useEffect(() => {
    lens.current?.setFlashes(phone ? flashesMobile : flashes);
  }, [phone, flashes, flashesMobile]);

  // Scroll choreography
  useEffect(() => {
    setHeroLight(true);
    const el = root.current!;
    const ctx = gsap.context(() => {
      if (prefersReducedMotion()) {
        lens.current?.render(0);
        heroEnd.current = el.offsetHeight;
        document.documentElement.classList.add("intro-done");
        return;
      }

      gsap.timeline({ delay: 0.15, onComplete: () => document.documentElement.classList.add("intro-done") })
        .fromTo(".hero-line > span", { y: "105%" }, { y: 0, duration: 1.05, ease: "expo.out", stagger: 0.09 })
        .fromTo(".hero-fade", { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.9, ease: "expo.out", stagger: 0.08 }, "-=0.65");

      const mm = gsap.matchMedia();
      mm.add("(min-width: 900px)", () => build(2.5));
      mm.add("(max-width: 899px)", () => build(1.8));

      function build(lengthInScreens: number) {
        const st = { p: 0 };
        let light = true;
        gsap.timeline({
          defaults: { ease: "none" },
          scrollTrigger: {
            trigger: el,
            start: "top top",
            end: () => "+=" + Math.round(window.innerHeight * lengthInScreens),
            pin: true,
            scrub: 0.6,
            invalidateOnRefresh: true,
            refreshPriority: 10,
            onRefresh: (self) => { heroEnd.current = self.end; },
          },
        })
          .to(st, {
            p: 1,
            duration: 1,
            onUpdate: () => {
              lens.current?.render(st.p);
              const l = st.p < 0.5;
              if (l !== light) setHeroLight((light = l));
            },
          }, 0)
          .to(".hero-copy", { y: -48, autoAlpha: 0, duration: 0.26 }, 0.1)
          .to(".hero-band", { yPercent: 100, duration: 0.16 }, 0.14)
          .fromTo(".hero-end", { autoAlpha: 0, y: 24 }, { autoAlpha: 1, y: 0, duration: 0.08 }, 0.81)
          // Glass category pills follow the line; the frame then holds and scrolls away into the work.
          .fromTo(".hero-pill", { autoAlpha: 0, y: 16 }, { autoAlpha: 1, y: 0, duration: 0.06, stagger: 0.012 }, 0.86);
      }
    }, el);
    refreshScroll();

    return () => {
      ctx.revert();
      setHeroLight(false);
      heroEnd.current = 0;
    };
  }, [setHeroLight, heroEnd]);

  // The outer div is React-owned: GSAP inserts its pin-spacer inside it, so on route
  // change React removes the div (whose parent never changed) without a DOM conflict.
  return (
    <div>
    <section ref={root} aria-label="Introduction" className="relative h-[100dvh] min-h-[600px] overflow-hidden bg-paper text-paper-ink">
      <canvas ref={canvas} aria-hidden="true" className="absolute inset-0 size-full" />
      <div aria-hidden="true" className="hero-band absolute inset-x-0 -bottom-px h-11 bg-ink-950 min-[900px]:h-16" />

      <div className="hero-copy wrap relative z-[2] flex h-full flex-col justify-start pt-[calc(68px+9vh)] min-[900px]:justify-center min-[900px]:pt-[68px]">
        <h1 className="display text-[clamp(40px,4.4vw,72px)]">
          <span className="hero-line block overflow-hidden pb-[0.04em]"><span className="block">Realistic AI ads</span></span>
          <span className="hero-line block overflow-hidden pb-[0.04em]"><span className="block">for brands that lead.</span></span>
        </h1>
        <p className="hero-fade mt-7 max-w-[30ch] text-[17px] leading-[1.55] text-paper-muted min-[900px]:max-w-[34ch] min-[900px]:text-lg">
          AI ad films, motion ads and AI cinema for brands, plus UGC-style marketing content with motion-driven edits.
        </p>
        <div className="hero-fade mt-9 flex flex-wrap gap-3">
          <button onClick={openContact} className={btn("paper")}>
            Start a project <ArrowRight weight="light" size={18} className={nudge} />
          </button>
          <button
            onClick={() => openVideo({ media: profile.showreelId, shape: "landscape", title: "Showreel" })}
            className={btn("paper-ghost")}
          >
            <Play weight="fill" size={14} /> Watch showreel
          </button>
        </div>
      </div>

      <div className="hero-end pointer-events-none invisible absolute inset-0 z-[2] flex flex-col items-center justify-center gap-9 px-6 text-center opacity-0">
        <p className="display text-[clamp(30px,4.6vw,68px)] text-fg">{hero.endLine}</p>
        <nav aria-label="Browse work by format" className="pointer-events-auto flex max-w-[640px] flex-wrap justify-center gap-2.5">
          {CATEGORIES.filter((c) => LEAD_TYPES.includes(c.id)).map((c) => (
            <Link key={c.id} href={`/work/?c=${c.id}`} className="hero-pill liquid liquid-hover invisible rounded-full px-5 py-2.5 text-sm text-fg opacity-0">
              {c.label}
            </Link>
          ))}
        </nav>
      </div>
    </section>
    </div>
  );
}
