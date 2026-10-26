"use client";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { AnimatePresence, motion } from "motion/react";
import { deleteTestimonial, fetchTestimonials, saveTestimonial } from "@/lib/data";
import type { LoadState, Testimonial } from "@/lib/types";
import { btn } from "@/components/ui/button";
import { CircleNotch, PencilSimple, Plus, Quotes, Trash } from "@/components/ui/icons";
import { ConfirmButton, EmptyState, Field, errorText, iconBtn, useToast } from "./ui";

const EMPTY: Omit<Testimonial, "id"> = { quote: "", name: "", role: "", company: "", photoUrl: "", order: 0 };

export function TestimonialsTab() {
  const notify = useToast();
  const [items, setItems] = useState<Testimonial[]>([]);
  const [state, setState] = useState<LoadState>("loading");
  const [editing, setEditing] = useState<string | "new" | null>(null);
  const [v, setV] = useState(EMPTY);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const load = useCallback(async () => {
    try {
      setItems(await fetchTestimonials());
      setState("ready");
    } catch (e) {
      setState("error");
      notify(errorText(e), "error");
    }
  }, [notify]);
  useEffect(() => { load(); }, [load]);

  const open = (t?: Testimonial) => {
    setErr("");
    if (t) { const { id: _id, ...rest } = t; setV(rest); setEditing(t.id); }
    else { setV({ ...EMPTY, order: items.length + 1 }); setEditing("new"); }
  };

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!v.quote.trim() || !v.name.trim()) return setErr("A quote and a name are required.");
    setBusy(true);
    try {
      await saveTestimonial({ ...v, quote: v.quote.trim(), name: v.name.trim(), order: Number(v.order) || 0 }, editing === "new" ? undefined : editing ?? undefined);
      notify("Testimonial saved.");
      setEditing(null);
      await load();
    } catch (e) {
      notify(errorText(e), "error");
    }
    setBusy(false);
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="display text-[clamp(36px,4.6vw,56px)]">Testimonials</h1>
          <p className="mt-3 max-w-[60ch] text-muted">Real quotes only. The home page shows the first three next to your stats, and hides the block while this list is empty.</p>
        </div>
        {!editing && <button onClick={() => open()} className={btn("primary", "sm")}><Plus weight="light" size={16} /> Add testimonial</button>}
      </div>

      <AnimatePresence>
        {editing && (
          <motion.form
            onSubmit={submit}
            noValidate
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="grid gap-5 rounded-card border border-line-strong bg-ink-900 p-5 md:grid-cols-2 md:p-8"
          >
            <Field label="Quote" htmlFor="t-quote" help="Keep it to 2 or 3 lines. Longer quotes are trimmed on the site." className="md:col-span-2">
              <textarea id="t-quote" rows={3} className="field-input resize-y" value={v.quote} onChange={(e) => setV({ ...v, quote: e.target.value })} maxLength={320} autoFocus />
            </Field>
            <Field label="Name" htmlFor="t-name"><input id="t-name" className="field-input" value={v.name} onChange={(e) => setV({ ...v, name: e.target.value })} /></Field>
            <Field label="Role" htmlFor="t-role"><input id="t-role" className="field-input" value={v.role} onChange={(e) => setV({ ...v, role: e.target.value })} placeholder="e.g. Marketing Lead" /></Field>
            <Field label="Company" htmlFor="t-company"><input id="t-company" className="field-input" value={v.company} onChange={(e) => setV({ ...v, company: e.target.value })} /></Field>
            <Field label="Photo URL" htmlFor="t-photo" help="Optional. Initials are shown without one.">
              <input id="t-photo" type="url" className="field-input" value={v.photoUrl} onChange={(e) => setV({ ...v, photoUrl: e.target.value })} />
            </Field>
            <Field label="Order" htmlFor="t-order" help="Lower shows first."><input id="t-order" type="number" className="field-input font-mono" value={v.order} onChange={(e) => setV({ ...v, order: Number(e.target.value) })} /></Field>
            {err && <p className="text-sm text-[#FF8A8E] md:col-span-2">{err}</p>}
            <div className="flex gap-3 md:col-span-2">
              <button type="submit" disabled={busy} className={btn("primary")}>{busy ? <>Saving <CircleNotch weight="light" size={18} className="animate-spin" /></> : "Save"}</button>
              <button type="button" onClick={() => setEditing(null)} className={btn("ghost")}>Cancel</button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {state === "loading" && <div className="skeleton h-32 rounded-card" />}
      {state === "ready" && items.length === 0 && !editing && (
        <EmptyState icon={<Quotes weight="light" size={32} />} title="No testimonials yet">
          Ask AIMHIGH AI, GO Charge or Total Health Solution for two lines about working with you, then add them here.
        </EmptyState>
      )}

      <ul className="grid gap-3 md:grid-cols-2">
        {items.map((t) => (
          <li key={t.id} className="flex flex-col gap-4 rounded-card border border-line bg-ink-900 p-5">
            <blockquote className="text-[15px] text-muted">&ldquo;{t.quote}&rdquo;</blockquote>
            <div className="mt-auto flex items-center justify-between gap-3">
              <p className="text-sm"><strong className="font-medium">{t.name}</strong> <span className="text-muted">{[t.role, t.company].filter(Boolean).join(", ")}</span></p>
              <div className="flex gap-1.5">
                <button onClick={() => open(t)} aria-label={`Edit ${t.name}`} className={iconBtn}><PencilSimple weight="light" size={16} /></button>
                <ConfirmButton
                  onConfirm={async () => { try { await deleteTestimonial(t.id); await load(); notify("Deleted."); } catch (e) { notify(errorText(e), "error"); } }}
                  ariaLabel={`Delete ${t.name}`}
                  armedLabel="Delete?"
                  className={iconBtn}
                >
                  <Trash weight="light" size={16} />
                </ConfirmButton>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
