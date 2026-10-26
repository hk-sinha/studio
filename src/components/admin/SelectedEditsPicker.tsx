"use client";
import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { PICKER_MARK, applySelectedEdits, byPriority, undoSelectedEdits, type EditsPlan } from "@/lib/data";
import type { Project } from "@/lib/types";
import { Thumb } from "@/components/ui/Thumb";
import { btn } from "@/components/ui/button";
import { CircleNotch, WarningCircle } from "@/components/ui/icons";
import { ConfirmButton, errorText, useToast } from "./ui";

// Wording that implies shoots / event coverage. Kept edits should not carry it.
const SHOOT_WORDS = /photograph\w*|videograph\w*|shoot\w*|\bshot\b|camera\w*|cinematograph\w*|event coverage|wedding|after ?movie|captur\w*|documentr?a?ry/gi;

function Highlighted({ text }: { text: string }) {
  const parts = text.split(new RegExp(`(${SHOOT_WORDS.source})`, "gi"));
  return (
    <>
      {parts.map((part, i) =>
        new RegExp(`^(${SHOOT_WORDS.source})$`, "i").test(part) ? <mark key={i} className="rounded bg-rec/25 px-0.5 text-fg">{part}</mark> : part,
      )}
    </>
  );
}

/**
 * Selected Edits = hand-picked edits only. Tick the ones to keep: they become featured,
 * the rest are hidden (never deleted) and marked so Undo can bring them back.
 */
export function SelectedEditsPicker({ projects, reload }: { projects: Project[]; reload: () => Promise<void> }) {
  const notify = useToast();
  const edits = useMemo(() => projects.filter((p) => p.type === "edits").sort(byPriority), [projects]);
  const [open, setOpen] = useState(false);
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [desc, setDesc] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<"" | "apply" | "undo">("");

  // Start from what is live: featured edits are the current selection.
  useEffect(() => {
    setChecked(new Set(edits.filter((p) => p.featured).map((p) => p.id)));
    setDesc({});
  }, [edits]);

  const markedHidden = projects.filter((p) => p.hiddenBy === PICKER_MARK);
  const implies = (s: string) => new RegExp(SHOOT_WORDS.source, "i").test(s);
  const flaggedTitle = (p: Project) => implies(p.title);
  const flaggedDesc = (p: Project) => implies(desc[p.id] ?? p.description);
  const flagged = (p: Project) => flaggedTitle(p) || flaggedDesc(p);

  const plan: EditsPlan = useMemo(() => {
    const keep: string[] = [], unfeature: string[] = [], hide: string[] = [];
    const descriptions: Record<string, string> = {};
    edits.forEach((p) => {
      if (checked.has(p.id)) {
        if (!p.featured || p.isHidden) keep.push(p.id);
        const d = desc[p.id];
        if (d !== undefined && d.trim() !== p.description) descriptions[p.id] = d.trim();
      } else {
        if (p.featured) unfeature.push(p.id);
        if (!p.isHidden) hide.push(p.id);
      }
    });
    return { keep, unfeature, hide, descriptions };
  }, [edits, checked, desc]);

  const changes = plan.keep.length + plan.unfeature.length + plan.hide.length + Object.keys(plan.descriptions).length;
  const name = (id: string) => {
    const p = edits.find((x) => x.id === id);
    return p?.title || `Untitled edit (${p?.mediaId})`;
  };
  const keptWithFlags = edits.filter((p) => checked.has(p.id) && flagged(p)).length;

  const toggle = (id: string) =>
    setChecked((s) => {
      const n = new Set(s);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });

  async function apply() {
    setBusy("apply");
    try {
      await applySelectedEdits(plan);
      await reload();
      notify(`Selected Edits updated: ${checked.size} shown, ${plan.hide.length} hidden.`);
    } catch (e) {
      notify(errorText(e), "error");
    }
    setBusy("");
  }

  async function undo() {
    setBusy("undo");
    try {
      await undoSelectedEdits(markedHidden.map((p) => p.id));
      await reload();
      notify(`Restored ${markedHidden.length} edits to visible.`);
    } catch (e) {
      notify(errorText(e), "error");
    }
    setBusy("");
  }

  if (!edits.length) return null;

  return (
    <section className="rounded-card border border-line-strong bg-ink-900">
      <button onClick={() => setOpen((o) => !o)} aria-expanded={open} className="flex w-full flex-wrap items-center justify-between gap-3 p-5 text-left md:p-6">
        <span>
          <span className="block font-display text-xl uppercase">Selected Edits</span>
          <span className="text-sm text-muted">
            {checked.size} of {edits.length} edits selected. Only selected edits appear on the site; the rest are hidden, never deleted.
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
            <div className="grid gap-8 border-t border-line p-5 md:p-6 lg:grid-cols-[1fr_340px]">
              <ul className="flex flex-col divide-y divide-line">
                {edits.map((p) => {
                  const on = checked.has(p.id);
                  const text = desc[p.id] ?? p.description;
                  return (
                    <li key={p.id} className="py-3">
                      <label className="flex cursor-pointer items-center gap-4">
                        <input type="checkbox" checked={on} onChange={() => toggle(p.id)} className="size-4 shrink-0 accent-[#EDEDEA]" />
                        <span className={`media-box h-12 w-20 shrink-0 rounded-md bg-ink-850 ${on ? "" : "opacity-40"}`}><Thumb media={p.mediaId} shape={p.shape} /></span>
                        <span className="min-w-0 flex-1">
                          <span className={`block truncate text-[15px] ${p.title ? "" : "italic text-muted"}`}>{p.title || "Untitled edit"}</span>
                          <span className="text-[13px] text-muted">
                            {p.isHidden ? (p.hiddenBy === PICKER_MARK ? "Hidden by this picker" : "Hidden") : "Visible"}
                            {p.featured ? " · Selected" : ""}
                          </span>
                        </span>
                        {flagged(p) && <WarningCircle weight="light" size={18} className="shrink-0 text-[#FF8A8E]" aria-label="Description implies a shoot" />}
                      </label>
                      {on && (text || flagged(p)) && (
                        <div className="mt-3 pl-8">
                          {flaggedTitle(p) && (
                            <p className="mb-2 text-[13px] text-[#FFB3B5]">
                              Title implies a shoot: <Highlighted text={p.title} /> (rename it with the film&apos;s Edit button)
                            </p>
                          )}
                          {flaggedDesc(p) && (
                            <p className="mb-2 text-[13px] text-[#FFB3B5]">
                              Description implies a shoot: <Highlighted text={text} />
                            </p>
                          )}
                          <textarea
                            rows={2}
                            aria-label={`Description for ${p.title || "untitled edit"}`}
                            className="field-input resize-y text-sm"
                            value={text}
                            onChange={(e) => setDesc((d) => ({ ...d, [p.id]: e.target.value }))}
                            placeholder="Describe the edit, e.g. Beat-synced edit with motion titles."
                          />
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>

              <aside className="flex flex-col gap-4 lg:sticky lg:top-[140px] lg:self-start">
                <h3 className="text-sm font-medium text-muted">Pending changes</h3>
                {changes === 0 ? (
                  <p className="text-sm text-muted">Nothing to change. Tick or untick edits to build the list.</p>
                ) : (
                  <ul className="flex max-h-[360px] flex-col gap-3 overflow-y-auto text-sm" data-lenis-prevent>
                    {plan.keep.length > 0 && <DiffGroup label="Feature and show" tone="ok" items={plan.keep.map(name)} />}
                    {plan.hide.length > 0 && <DiffGroup label="Hide (isHidden: true)" tone="warn" items={plan.hide.map(name)} />}
                    {plan.unfeature.length > 0 && <DiffGroup label="Unfeature" tone="warn" items={plan.unfeature.map(name)} />}
                    {Object.keys(plan.descriptions).length > 0 && (
                      <DiffGroup label="New description" tone="ok" items={Object.entries(plan.descriptions).map(([id, d]) => `${name(id)}: "${d}"`)} />
                    )}
                  </ul>
                )}
                {keptWithFlags > 0 && (
                  <p className="flex items-start gap-2 text-[13px] text-[#FFB3B5]">
                    <WarningCircle weight="light" size={16} className="mt-px shrink-0" />
                    {keptWithFlags} selected {keptWithFlags === 1 ? "edit still describes" : "edits still describe"} a shoot.
                  </p>
                )}
                <button onClick={apply} disabled={!changes || !!busy} className={btn("primary", "md", "w-full")}>
                  {busy === "apply" ? <>Applying <CircleNotch weight="light" size={18} className="animate-spin" /></> : `Apply ${changes} ${changes === 1 ? "change" : "changes"}`}
                </button>
                {markedHidden.length > 0 && (
                  <ConfirmButton onConfirm={undo} armedLabel={`Restore ${markedHidden.length}?`} ariaLabel="Undo hiding" className={btn("ghost", "sm", "w-full")}>
                    {busy === "undo" ? <CircleNotch weight="light" size={16} className="animate-spin" /> : `Undo: show the ${markedHidden.length} hidden by this picker`}
                  </ConfirmButton>
                )}
              </aside>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

function DiffGroup({ label, items, tone }: { label: string; items: string[]; tone: "ok" | "warn" }) {
  return (
    <li>
      <p className={`mb-1 font-mono text-xs ${tone === "ok" ? "text-ok" : "text-[#FFB3B5]"}`}>{label} ({items.length})</p>
      <ul className="flex flex-col gap-0.5 text-muted">
        {items.map((t, i) => <li key={i} className="truncate">{t}</li>)}
      </ul>
    </li>
  );
}
