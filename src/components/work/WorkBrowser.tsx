"use client";
import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, LayoutGroup, motion, useReducedMotion } from "motion/react";
import { useSiteData } from "@/components/providers/SiteDataProvider";
import { VideoCard } from "@/components/ui/VideoCard";
import { btn, nudge } from "@/components/ui/button";
import { ArrowRight, FilmSlate } from "@/components/ui/icons";
import { CATEGORIES, LEGACY_TYPES, UGC_IN_ALL, categoryById, type Category } from "@/lib/config";
import type { Project, VideoType } from "@/lib/types";

type Filter = "all" | VideoType;
const spring = { type: "spring" as const, stiffness: 100, damping: 20 };

/** Accepts new ids and the old ones (?c=ad_reels still lands on AI Ads). */
function parseFilter(raw: string | null): Filter {
  if (!raw) return "all";
  if (categoryById(raw)) return raw as VideoType;
  return LEGACY_TYPES[raw] ?? "all";
}

export function WorkBrowser() {
  const { projects, status, retry } = useSiteData();
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const reduce = !!useReducedMotion();
  const [filter, setFilter] = useState<Filter>(() => parseFilter(params.get("c")));

  // Back/forward and links like /work/?c=ugc update the filter.
  useEffect(() => setFilter(parseFilter(params.get("c"))), [params]);

  // Projects arrive public-only and best-first; group them in category priority order.
  const groups = useMemo(
    () => CATEGORIES.map((c) => ({ c, items: projects.filter((p) => p.type === c.id) })),
    [projects],
  );

  const choose = (f: Filter) => {
    setFilter(f);
    router.replace(f === "all" ? pathname : `${pathname}?c=${f}`, { scroll: false });
  };

  const pills: { id: Filter; label: string; count: number }[] = [
    { id: "all", label: "All", count: projects.length },
    ...groups.map(({ c, items }) => ({ id: c.id, label: c.label, count: items.length })),
  ];

  const visibleGroups = filter === "all" ? groups.filter((g) => g.items.length) : groups.filter((g) => g.c.id === filter);

  return (
    <div className="wrap pb-[clamp(96px,12vw,160px)]">
      <LayoutGroup>
        <div role="tablist" aria-label="Filter work" className="no-scrollbar -mx-[clamp(16px,4vw,48px)] mb-12 flex gap-2 overflow-x-auto px-[clamp(16px,4vw,48px)] md:mx-0 md:flex-wrap md:px-0">
          {pills.map((p) => {
            const on = filter === p.id;
            return (
              <button
                key={p.id}
                role="tab"
                aria-selected={on}
                onClick={() => choose(p.id)}
                className={`relative h-10 shrink-0 rounded-full border px-4 text-sm transition-colors ${on ? "border-transparent text-ink-950" : "border-line-strong text-muted hover:text-fg"}`}
              >
                {on && <motion.span layoutId="work-pill" transition={spring} className="absolute inset-0 rounded-full bg-fg" />}
                <span className="relative">
                  {p.label}
                  {status === "ready" && <span className={`ml-2 font-mono text-xs ${on ? "text-ink-950/60" : "text-subtle"}`}>{p.count}</span>}
                </span>
              </button>
            );
          })}
        </div>
      </LayoutGroup>

      {status === "loading" && <RowsSkeleton />}

      {status === "error" && (
        <div className="flex flex-col items-start gap-5 rounded-card border border-line bg-ink-850 p-8">
          <p className="text-muted">The work could not load. Check your connection and try again.</p>
          <button onClick={retry} className={btn("ghost", "sm")}>Try again</button>
        </div>
      )}

      {status === "ready" && (
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={filter}
            initial={reduce ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, y: -8 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col gap-[clamp(56px,8vw,96px)]"
          >
            {visibleGroups.map(({ c, items }) =>
              items.length === 0 ? (
                <Empty key={c.id} c={c} onAll={() => choose("all")} />
              ) : (
                <Section
                  key={c.id}
                  c={c}
                  items={filter === "all" && c.id === "ugc" ? items.slice(0, UGC_IN_ALL) : items}
                  total={items.length}
                  heading={filter === "all"}
                  onSeeAll={() => choose(c.id)}
                  reduce={reduce}
                />
              ),
            )}
            {filter === "all" && projects.length === 0 && <Empty onAll={() => {}} />}
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
}

function Section({ c, items, total, heading, onSeeAll, reduce }: { c: Category; items: Project[]; total: number; heading: boolean; onSeeAll: () => void; reduce: boolean }) {
  return (
    <section aria-label={c.label}>
      {heading && (
        <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <h2 className="font-display text-[clamp(26px,3vw,36px)] uppercase leading-none tracking-[-0.01em]">
            {c.label}
            <span className="ml-3 align-middle font-mono text-sm normal-case tracking-normal text-subtle">{total}</span>
          </h2>
          {items.length < total && (
            <button onClick={onSeeAll} className="group inline-flex items-center gap-2 text-[15px] text-muted transition-colors hover:text-fg">
              See all {total} <ArrowRight weight="light" size={16} className={nudge} />
            </button>
          )}
        </div>
      )}
      <ul className={`jrows ${c.size === "featured" ? "jrows--featured" : "jrows--standard"}`}>
        {items.map((p, i) => (
          <motion.li
            key={p.id}
            className="jrow-item"
            style={{ "--ar": p.shape === "portrait" ? 9 / 16 : 16 / 9 } as CSSProperties}
            initial={reduce ? false : { opacity: 0, y: 24, scale: 0.98 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            viewport={{ once: true, amount: 0.15 }}
            transition={{ type: "spring", stiffness: 100, damping: 20, delay: reduce ? 0 : (i % 6) * 0.05 }}
          >
            {/* The section or filter already names the category. */}
            <VideoCard p={p} showCategory={false} />
          </motion.li>
        ))}
      </ul>
    </section>
  );
}

function Empty({ c, onAll }: { c?: Category; onAll: () => void }) {
  const edits = c?.id === "edits";
  return (
    <div className="flex flex-col items-start gap-4 rounded-card border border-line bg-ink-850 p-10">
      <FilmSlate weight="light" size={36} className="text-muted" />
      <p className="display text-3xl">{edits ? "Being curated." : "Nothing here yet."}</p>
      <p className="max-w-[44ch] text-muted">
        {edits ? "A short list of hand-picked edits is on the way. AI ads and motion graphics are live now." : "New work in this format is on the way."}
      </p>
      {c && <button onClick={onAll} className={btn("ghost", "sm")}>See all work</button>}
    </div>
  );
}

function RowsSkeleton() {
  const ars = [16 / 9, 9 / 16, 9 / 16, 16 / 9, 9 / 16, 9 / 16];
  return (
    <ul className="jrows jrows--featured" aria-hidden="true">
      {ars.map((ar, i) => (
        <li key={i} className="jrow-item" style={{ "--ar": ar } as CSSProperties}>
          <span className="skeleton block size-full rounded-card" />
        </li>
      ))}
    </ul>
  );
}
