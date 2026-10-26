"use client";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Reorder } from "motion/react";
import { CATEGORIES, LEAD_TYPES, MAX_FLASHES, categoryById } from "@/lib/config";
import { DEFAULT_HERO, fetchHeroSettings, saveHeroSettings, type HeroSettings } from "@/lib/data";
import { displayTitle, youtubeId } from "@/lib/media";
import type { Project } from "@/lib/types";
import { Thumb } from "@/components/ui/Thumb";
import { btn } from "@/components/ui/button";
import { CircleNotch, DotsSixVertical, MagnifyingGlass, Plus, X } from "@/components/ui/icons";
import { Field, Segmented, errorText, useToast } from "./ui";

/** Choose the films that flash inside the hero lens, and the line on the black end frame. */
export function HeroTab({ projects }: { projects: Project[] }) {
  const notify = useToast();
  const [v, setV] = useState<HeroSettings>(DEFAULT_HERO);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<string>("lead");
  const [link, setLink] = useState("");
  const [linkErr, setLinkErr] = useState("");

  useEffect(() => {
    fetchHeroSettings()
      .then(setV)
      .catch((e) => notify(errorText(e), "error"))
      .finally(() => setLoading(false));
  }, [notify]);

  const update = (next: Partial<HeroSettings>) => { setV((s) => ({ ...s, ...next })); setDirty(true); };
  const byMedia = (m: string) => projects.find((p) => p.mediaId === m || youtubeId(p.mediaId) === m);

  // Desktop and phones have separate lists: a phone screen is portrait, so 9:16 films fill it.
  const [device, setDevice] = useState<"desktop" | "phone">("desktop");
  const key = device === "desktop" ? "flashes" : "flashesMobile";
  const list = v[key];
  const setList = (next: string[]) => update({ [key]: next } as Partial<HeroSettings>);
  const full = list.length >= MAX_FLASHES;
  const preferred = device === "desktop" ? "landscape" : "portrait";

  const add = (media: string) => {
    if (full || list.includes(media)) return;
    setList([...list, media]);
  };

  const addLink = (e: FormEvent) => {
    e.preventDefault();
    const id = youtubeId(link);
    if (!id) return setLinkErr("Paste a YouTube link or an 11-character video ID.");
    setLinkErr("");
    add(id);
    setLink("");
  };

  const candidates = useMemo(() => {
    const term = q.trim().toLowerCase();
    return projects
      .filter((p) => (cat === "lead" ? LEAD_TYPES.includes(p.type) : cat === "all" ? true : p.type === cat))
      .filter((p) => !term || [p.title, p.client, p.mediaId].join(" ").toLowerCase().includes(term))
      // The screen's own orientation first: it fills the frame best.
      .sort((a, b) => Number(b.shape === preferred) - Number(a.shape === preferred));
  }, [projects, q, cat, preferred]);

  async function save() {
    setBusy(true);
    try {
      await saveHeroSettings({ flashes: v.flashes, flashesMobile: v.flashesMobile, endLine: v.endLine.trim() || DEFAULT_HERO.endLine });
      setDirty(false);
      notify("Hero saved. Reload the site to see the new flashes.");
    } catch (e) {
      notify(errorText(e), "error");
    }
    setBusy(false);
  }

  if (loading) return <div className="skeleton h-64 rounded-card" />;

  return (
    <div className="flex flex-col gap-10">
      <div>
        <h1 className="display text-[clamp(36px,4.6vw,56px)]">Hero</h1>
        <p className="mt-3 max-w-[64ch] text-muted">
          The films that flash inside the lens after the dolly-in, in order, and the line on the black frame that follows.
          Desktop and phones have separate lists. Leave a list empty to pick automatically from your AI ads, motion ads,
          AI cinema and showreels (16:9 films for desktop, 9:16 films for phones).
        </p>
      </div>

      <div className="flex max-w-md flex-col gap-2">
        <span className="text-sm font-medium">Editing flashes for</span>
        <Segmented<"desktop" | "phone">
          id="hero-device"
          value={device}
          onChange={setDevice}
          options={[
            { value: "desktop", label: `Desktop & tablet (${v.flashes.length})` },
            { value: "phone", label: `Phone (${v.flashesMobile.length})` },
          ]}
        />
      </div>

      <section className="grid gap-8 lg:grid-cols-[1fr_1.2fr]">
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium">Lens flashes ({list.length}/{MAX_FLASHES})</h2>
            {list.length > 0 && <button onClick={() => setList([])} className="text-[13px] text-muted hover:text-fg">Reset to automatic</button>}
          </div>

          {list.length === 0 ? (
            <p className="rounded-card border border-dashed border-line-strong p-6 text-sm text-muted">{`Automatic: the site picks the flashes (${device === "desktop" ? "16:9" : "9:16"} films first). Add films from the right to choose them yourself.`}</p>
          ) : (
            <Reorder.Group axis="y" values={list} onReorder={setList} className="flex flex-col gap-2">
              {list.map((m, i) => {
                const p = byMedia(m);
                return (
                  <Reorder.Item key={m} value={m} className="flex cursor-grab select-none items-center gap-3 rounded-btn border border-line bg-ink-900 p-2 pr-3 active:cursor-grabbing" whileDrag={{ scale: 1.02 }}>
                    <DotsSixVertical weight="light" size={20} className="shrink-0 text-muted" />
                    <span className="w-5 font-mono text-xs text-subtle">{i + 1}</span>
                    <span className="media-box h-12 w-20 shrink-0 rounded-md bg-ink-850"><Thumb media={m} shape={p?.shape ?? "landscape"} /></span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[15px]">{p ? displayTitle(p) : `YouTube ${m}`}</span>
                      <span className="text-[13px] text-muted">{p ? `${categoryById(p.type)?.label}${p.shape !== preferred ? " · cropped to fill the screen" : ""}` : "Pasted link"}</span>
                    </span>
                    <button onClick={() => setList(list.filter((x) => x !== m))} aria-label="Remove" className="grid size-8 place-items-center rounded-md text-muted hover:text-fg">
                      <X weight="light" size={16} />
                    </button>
                  </Reorder.Item>
                );
              })}
            </Reorder.Group>
          )}

          <form onSubmit={addLink} className="flex flex-col gap-2">
            <label htmlFor="flash-link" className="text-sm font-medium">Or paste any YouTube link</label>
            <div className="flex gap-2">
              <input id="flash-link" value={link} onChange={(e) => setLink(e.target.value)} placeholder="https://youtu.be/..." className="field-input" aria-invalid={!!linkErr || undefined} />
              <button type="submit" disabled={full} className={btn("ghost", "md", "!h-auto")}><Plus weight="light" size={16} /> Add</button>
            </div>
            {linkErr && <p className="text-[13px] text-[#FF8A8E]">{linkErr}</p>}
          </form>

          <Field label="End line" htmlFor="end-line" help="Shown on the black frame after the lens, above the category pills.">
            <input id="end-line" className="field-input" value={v.endLine} maxLength={48} onChange={(e) => update({ endLine: e.target.value })} />
          </Field>
        </div>

        <div className="flex flex-col gap-3">
          <h2 className="text-sm font-medium">Add from your films</h2>
          <div className="flex gap-2">
            <label className="relative flex-1">
              <span className="sr-only">Search</span>
              <MagnifyingGlass weight="light" size={18} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search" className="field-input pl-10" />
            </label>
            <label className="w-44">
              <span className="sr-only">Category</span>
              <select value={cat} onChange={(e) => setCat(e.target.value)} className="field-input">
                <option value="lead">Lead formats</option>
                <option value="all">All films</option>
                {CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
              </select>
            </label>
          </div>
          <ul className="grid max-h-[520px] grid-cols-2 gap-3 overflow-y-auto pr-1 sm:grid-cols-3" data-lenis-prevent>
            {candidates.map((p) => {
              const on = list.includes(p.mediaId);
              return (
                <li key={p.id}>
                  <button
                    onClick={() => (on ? setList(list.filter((x) => x !== p.mediaId)) : add(p.mediaId))}
                    disabled={!on && full}
                    aria-pressed={on}
                    className={`group w-full overflow-hidden rounded-thumb border text-left transition-colors disabled:opacity-40 ${on ? "border-fg" : "border-line hover:border-line-strong"}`}
                  >
                    <span className="media-box block aspect-video bg-ink-850">
                      <Thumb media={p.mediaId} shape={p.shape} />
                      {on && <span className="absolute right-2 top-2 rounded-full bg-fg px-2 py-0.5 font-mono text-[11px] text-ink-950">{list.indexOf(p.mediaId) + 1}</span>}
                    </span>
                    <span className="block truncate px-2.5 py-2 text-[13px]">{displayTitle(p)}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      <div className="sticky bottom-4 flex items-center gap-4 rounded-card border border-line-strong bg-ink-900/95 p-4 backdrop-blur">
        <button onClick={save} disabled={busy || !dirty} className={btn("primary")}>
          {busy ? <>Saving <CircleNotch weight="light" size={18} className="animate-spin" /></> : "Save hero"}
        </button>
        <span className="text-sm text-muted">{dirty ? "Unsaved changes" : "All changes saved"}</span>
      </div>
    </div>
  );
}
