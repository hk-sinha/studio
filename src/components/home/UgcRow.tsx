"use client";
import { useMemo, type CSSProperties } from "react";
import Link from "next/link";
import { useSiteData } from "@/components/providers/SiteDataProvider";
import { Reveal } from "@/components/ui/Reveal";
import { VideoCard } from "@/components/ui/VideoCard";
import { ArrowRight } from "@/components/ui/icons";
import { nudge } from "@/components/ui/button";
import { UGC_IN_ALL } from "@/lib/config";

/** UGC is the secondary offer: a short row of the best pieces, not a pinned showcase. */
export function UgcRow() {
  const { projects, status } = useSiteData();
  const all = useMemo(() => projects.filter((p) => p.type === "ugc"), [projects]);
  const items = all.slice(0, UGC_IN_ALL);
  if (status === "ready" && !items.length) return null;

  return (
    <section aria-labelledby="ugc-title" className="py-[clamp(96px,12vw,160px)]">
      <div className="wrap grid items-end gap-10 md:grid-cols-[4fr_8fr] md:gap-[clamp(40px,6vw,96px)]">
        <div>
          <Reveal as="p" className="mb-5 text-xs uppercase tracking-[0.22em] text-muted">UGC marketing</Reveal>
          <Reveal as="h2" id="ugc-title" delay={60} className="display text-[clamp(36px,5vw,64px)]">Made for<br />the feed.</Reveal>
          <Reveal as="p" delay={120} className="mt-6 max-w-[40ch] text-[17px] text-muted">
            UGC-style marketing content with motion-driven edits: creator-style reels and tutorials built for Instagram and YouTube Shorts.
          </Reveal>
          {all.length > 0 && (
            <Reveal delay={180} className="mt-8">
              <Link href="/work/?c=ugc" className="group inline-flex items-center gap-2 text-[15px] text-muted transition-colors hover:text-fg">
                See all {all.length} UGC pieces <ArrowRight weight="light" size={16} className={nudge} />
              </Link>
            </Reveal>
          )}
        </div>

        <ul className="no-scrollbar -mx-[clamp(16px,4vw,48px)] flex snap-x snap-mandatory items-end gap-4 overflow-x-auto px-[clamp(16px,4vw,48px)] md:mx-0 md:grid md:grid-cols-3 md:overflow-visible md:px-0">
          {status === "loading" &&
            Array.from({ length: 3 }, (_, i) => (
              <li key={i} className="aspect-[9/16] w-[60vw] max-w-[260px] shrink-0 md:w-auto md:max-w-none">
                <span className="skeleton block size-full rounded-card" />
              </li>
            ))}
          {items.map((p, i) => (
            <Reveal
              as="li"
              key={p.id}
              delay={i * 80}
              className="w-[60vw] max-w-[260px] shrink-0 snap-start md:w-auto md:max-w-none"
              style={{ aspectRatio: p.shape === "portrait" ? 9 / 16 : 16 / 9 } as CSSProperties}
            >
              <VideoCard p={p} showCategory={false} />
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  );
}
