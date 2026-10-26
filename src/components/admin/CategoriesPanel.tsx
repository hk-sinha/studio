"use client";
import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { CATEGORIES, NEEDS_REVIEW, categoryById } from "@/lib/config";
import { byPriority, saveCategories } from "@/lib/data";
import type { Project, VideoType } from "@/lib/types";
import { Thumb } from "@/components/ui/Thumb";
import { btn } from "@/components/ui/button";
import { CircleNotch, WarningCircle } from "@/components/ui/icons";
import { Segmented, errorText, useToast } from "./ui";

const isNewId = (t: string) => CATEGORIES.some((c) => c.id === t);
/** Unclear films still on an old type value need a decision. */
const needsReview = (p: Project) => !!NEEDS_REVIEW[p.mediaId] && !isNewId(p.rawType);

/**
 * Review the automatic category mapping. Pick (or confirm) a category per film; Apply writes
 * explicit category ids for the confirmed rows only. Nothing changes until Apply.
 */
export function CategoriesPanel({ projects, reload }: { projects: Project[]; reload: () => Promise<void> }) {
  const notify = useToast();
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<"review" | "all">("review");
  const [pick, setPick] = useState<Record<string, VideoType>>({});
  const [confirmed, setConfirmed] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);

  const review = useMemo(() => projects.filter(needsReview).sort(byPriority), [projects]);
  const rows = useMemo(
    () => (view === "review" ? review : [...projects].sort((a, b) => CATEGORIES.findIndex((c) => c.id === a.type) - CATEGORIES.findIndex((c) => c.id === b.type) || byPriority(a, b))),
    [view, review, projects],
  );

  useEffect(() => {
    setPick(Object.fromEntries(projects.map((p) => [p.id, p.type])));
    setConfirmed(new Set());
  }, [projects]);

  const choose = (id: string, t: VideoType) => {
    setPick((s) => ({ ...s, [id]: t }));
    setConfirmed((s) => new Set(s).add(id));
  };
  const toggleConfirm = (id: string) =>
    setConfirmed((s) => {
      const n = new Set(s);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });

  // Write a row if it was confirmed and its stored value differs from the choice.
  const changes = useMemo(() => {
    const out: Record<string, VideoType> = {};
    projects.forEach((p) => {
      if (confirmed.has(p.id) && pick[p.id] && pick[p.id] !== p.rawType) out[p.id] = pick[p.id];
    });
    return out;
  }, [projects, confirmed, pick]);
  const n = Object.keys(changes).length;

  const counts = useMemo(() => {
    const m: Record<string, number> = {};
    projects.forEach((p) => (m[pick[p.id] ?? p.type] = (m[pick[p.id] ?? p.type] ?? 0) + 1));
    return m;
  }, [projects, pick]);

  async function apply() {
    setBusy(true);
    try {
      await saveCategories(changes);
      await reload();
      notify(`Saved categories for ${n} ${n === 1 ? "film" : "films"}.`);
    } catch (e) {
      notify(errorText(e), "error");
    }
    setBusy(false);
  }

  return (
    <section className="rounded-card border border-line-strong bg-ink-900">
      <button onClick={() => setOpen((o) => !o)} aria-expanded={open} className="flex w-full flex-wrap items-center justify-between gap-3 p-5 text-left md:p-6">
        <span>
          <span className="flex items-center gap-2 font-display text-xl uppercase">
            Categories
            {review.length > 0 && <span className="rounded-full bg-rec px-2 py-0.5 font-mono text-[11px] normal-case text-white">{review.length} to review</span>}
          </span>
          <span className="text-sm text-muted">
            {CATEGORIES.map((c) => `${c.label} ${counts[c.id] ?? 0}`).join(" · ")}
          </span>
        </span>
        <span className={btn("ghost", "sm")}>{open ? "Close" : "Review"}</span>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 200, damping: 30 }}
            className="overflow-hidden"
          >
            <div className="flex flex-col gap-5 border-t border-line p-5 md:p-6">
              <p className="max-w-[72ch] text-sm text-muted">
                Every film is already mapped automatically (old types stay untouched). Films that don&apos;t fit one category clearly are listed under
                Needs review. Pick a category, or tick Confirm to keep the suggestion, then Apply.
              </p>
              <div className="max-w-md">
                <Segmented<"review" | "all">
                  id="cat-view"
                  value={view}
                  onChange={setView}
                  options={[{ value: "review", label: `Needs review (${review.length})` }, { value: "all", label: `All films (${projects.length})` }]}
                />
              </div>

              {rows.length === 0 ? (
                <p className="text-sm text-muted">Nothing left to review. Switch to All films to move anything else.</p>
              ) : (
                <ul className="flex flex-col divide-y divide-line">
                  {rows.map((p) => {
                    const reason = needsReview(p) ? NEEDS_REVIEW[p.mediaId] : "";
                    return (
                      <li key={p.id} className="flex flex-wrap items-center gap-4 py-3">
                        <span className={`media-box h-12 w-20 shrink-0 rounded-md bg-ink-850 ${p.isHidden ? "opacity-40" : ""}`}><Thumb media={p.mediaId} shape={p.shape} /></span>
                        <span className="min-w-[200px] flex-1">
                          <span className={`block truncate text-[15px] ${p.title ? "" : "italic text-muted"}`}>{p.title || `Untitled (${p.mediaId})`}</span>
                          <span className="block text-[13px] text-subtle">
                            Stored as <code className="font-mono">{p.rawType || "none"}</code>{p.isHidden ? " · hidden" : ""}
                          </span>
                          {reason && (
                            <span className="mt-1 flex items-start gap-1.5 text-[13px] text-[#FFB3B5]">
                              <WarningCircle weight="light" size={15} className="mt-px shrink-0" /> {reason}
                            </span>
                          )}
                        </span>
                        <label className="sr-only" htmlFor={`cat-${p.id}`}>Category for {p.title || p.mediaId}</label>
                        <select id={`cat-${p.id}`} value={pick[p.id] ?? p.type} onChange={(e) => choose(p.id, e.target.value as VideoType)} className="field-input w-44 py-2 text-sm">
                          {CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
                        </select>
                        <label className="flex items-center gap-2 text-[13px] text-muted">
                          <input type="checkbox" checked={confirmed.has(p.id)} onChange={() => toggleConfirm(p.id)} className="size-4 accent-[#EDEDEA]" />
                          Confirm
                        </label>
                      </li>
                    );
                  })}
                </ul>
              )}

              <div className="flex flex-wrap items-center gap-4 border-t border-line pt-5">
                <button onClick={apply} disabled={!n || busy} className={btn("primary")}>
                  {busy ? <>Saving <CircleNotch weight="light" size={18} className="animate-spin" /></> : `Apply ${n} ${n === 1 ? "change" : "changes"}`}
                </button>
                {n > 0 && (
                  <span className="text-sm text-muted">
                    {Object.entries(changes).slice(0, 3).map(([id, t]) => `${projects.find((p) => p.id === id)?.title || "Untitled"} → ${categoryById(t)?.label}`).join(", ")}
                    {n > 3 ? ` and ${n - 3} more` : ""}
                  </span>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
