"use client";
import { useEffect, useRef, type CSSProperties } from "react";
import Link from "next/link";
import { useSiteData } from "@/components/providers/SiteDataProvider";
import { Reveal } from "@/components/ui/Reveal";
import { Thumb } from "@/components/ui/Thumb";
import { VideoCard } from "@/components/ui/VideoCard";
import { ArrowRight } from "@/components/ui/icons";
import { nudge } from "@/components/ui/button";
import { SERVICES, categoryById } from "@/lib/config";
import { gsap, prefersReducedMotion, refreshScroll } from "@/lib/scroll";

// Each card sticks a header-height lower than the one before, so earlier headers stay visible.
const HEADER = { base: 88, step: 64, mobileBase: 76, mobileStep: 52 };

/**
 * What I make: sticky stacking Liquid Glass cards. Each service card pins near the top and the next
 * slides over it; covered cards shrink a little and dim (CSS sticky + scrubbed GSAP, no pinning).
 */
export function Services() {
  const { projects, status } = useSiteData();
  const list = useRef<HTMLOListElement>(null);

  useEffect(() => {
    if (prefersReducedMotion()) return;
    const ctx = gsap.context(() => {
      const items = gsap.utils.toArray<HTMLElement>(".stack-item");
      items.forEach((item, i) => {
        const next = items[i + 1];
        if (!next) return;
        const depth = items.length - 1 - i;
        // The next card's sticky offset differs per breakpoint, so read it on every refresh.
        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: next,
            start: "top bottom",
            end: () => `top top+=${parseFloat(getComputedStyle(next).top) || 0}`,
            scrub: true,
            invalidateOnRefresh: true,
          },
        });
        tl.to(item.querySelector(".stack-card"), { scale: 1 - 0.035 * Math.min(depth, 3), ease: "none" }, 0)
          .to(item.querySelector(".stack-shade"), { opacity: 0.55, ease: "none" }, 0);
      });
    }, list);
    refreshScroll();
    return () => ctx.revert();
  }, []);

  return (
    <section id="services" className="scroll-mt-20 py-[clamp(96px,12vw,160px)]">
      <div className="wrap">
        <Reveal as="h2" className="display mb-[clamp(40px,6vw,72px)] text-[clamp(36px,5vw,64px)]">What I make</Reveal>

        {/* flow-root: keeps the last card's bottom margin inside the list (no margin collapse). */}
        <ol ref={list} className="relative flow-root">
          {SERVICES.map((s, i) => {
            const inCat = projects.filter((p) => p.type === s.category);
            const backdrop = inCat.find((p) => p.shape === "landscape") ?? inCat[0];
            const media = inCat.slice(0, 2);
            // Sticky top + bottom margin is the same for every card, so they all release at once
            // and the deck leaves intact (headers keep their offsets instead of collapsing).
            const after = SERVICES.length - 1 - i;
            const style = {
              "--t": `${HEADER.mobileBase + i * HEADER.mobileStep}px`,
              "--t-md": `${HEADER.base + i * HEADER.step}px`,
              "--mb": `calc(10vh + ${after * HEADER.mobileStep}px)`,
              "--mb-md": `calc(10vh + ${after * HEADER.step}px)`,
            } as CSSProperties;
            return (
              <li
                key={s.category}
                className="stack-item sticky top-[var(--t)] mb-[var(--mb)] md:top-[var(--t-md)] md:mb-[var(--mb-md)]"
                style={style}
              >
                {/* One fixed height for every card: equal heights keep the deck aligned as it stacks and leaves. */}
                <article className="stack-card glass-strong relative isolate flex h-[500px] origin-top flex-col overflow-hidden rounded-[28px] md:h-[min(62vh,480px)]">
                  {backdrop && (
                    <span className="media-box absolute inset-0 -z-[2] rounded-[28px]">
                      <Thumb media={backdrop.mediaId} shape={backdrop.shape} className="scale-125 blur-[40px] brightness-[.38] saturate-[1.2]" />
                    </span>
                  )}
                  <span className="absolute inset-0 -z-[1] bg-gradient-to-b from-ink-950/30 via-ink-950/55 to-ink-950/80" />

                  {/* Header strip: stays visible when the next card stacks over this one. */}
                  <header className="flex h-[52px] shrink-0 items-center gap-4 border-b border-white/10 px-5 md:h-16 md:px-8">
                    <span className="font-display text-xl font-medium md:text-2xl">{String(i + 1).padStart(2, "0")}</span>
                    <h3 className="flex-1 truncate font-display text-lg uppercase tracking-[-0.01em] md:text-2xl">{s.title}</h3>
                    <Link href={`/work/?c=${s.category}`} className="liquid liquid-hover group hidden items-center gap-2 rounded-full px-4 py-1.5 text-[13px] sm:inline-flex">
                      See work <ArrowRight weight="light" size={14} className={nudge} />
                    </Link>
                  </header>

                  <div className="grid flex-1 content-between gap-6 p-5 md:grid-cols-[5fr_7fr] md:content-stretch md:gap-10 md:p-8">
                    <div className="flex flex-col justify-between gap-6">
                      <p className="max-w-[38ch] text-lg leading-relaxed text-fg/85 md:text-xl">{s.pitch}</p>
                      <div className="flex flex-wrap items-center gap-3">
                        {status === "ready" && (
                          <span className="liquid rounded-full px-3.5 py-1.5 font-mono text-xs text-muted">
                            {inCat.length} {inCat.length === 1 ? categoryById(s.category)?.singular.toLowerCase() : "films"}
                          </span>
                        )}
                        <Link href={`/work/?c=${s.category}`} className="group inline-flex items-center gap-2 text-[15px] text-muted transition-colors hover:text-fg sm:hidden">
                          See work <ArrowRight weight="light" size={16} className={nudge} />
                        </Link>
                      </div>
                    </div>

                    {/* Width-driven tiles keep the true 9:16 / 16:9 ratio at every size. */}
                    <div className="flex items-end justify-start gap-3 [--mh:200px] md:justify-end md:[--mh:min(38vh,290px)]">
                      {status === "loading" && <span className="skeleton block aspect-[9/16] w-[calc(var(--mh)*9/16)] rounded-card" />}
                      {media.map((p, k) => {
                        const ar = p.shape === "portrait" ? 9 / 16 : 16 / 9;
                        return (
                          <div key={p.id} className={`shrink-0 ${k > 0 ? "hidden md:block" : ""}`} style={{ width: `min(100%, calc(var(--mh) * ${ar}))`, aspectRatio: ar }}>
                            <VideoCard p={p} showCategory={false} />
                          </div>
                        );
                      })}
                      {status === "ready" && !media.length && (
                        <div className="liquid-lite grid h-[var(--mh)] flex-1 place-items-center rounded-card px-6 text-center text-sm text-muted">New work in this format is on the way.</div>
                      )}
                    </div>
                  </div>

                  {/* Dims only the body: the header strip stays crisp in the stack. */}
                  <span className="stack-shade pointer-events-none absolute inset-x-0 bottom-0 top-[52px] bg-ink-950 opacity-0 md:top-16" />
                </article>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
