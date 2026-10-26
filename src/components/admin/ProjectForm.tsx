"use client";
import { useEffect, useState, type FormEvent } from "react";
import { motion } from "motion/react";
import { CATEGORIES } from "@/lib/config";
import { saveProject, type ProjectInput } from "@/lib/data";
import { youtubeId } from "@/lib/media";
import type { Project, Shape, VideoType } from "@/lib/types";
import { Thumb } from "@/components/ui/Thumb";
import { btn } from "@/components/ui/button";
import { CircleNotch, X } from "@/components/ui/icons";
import { Field, Segmented, Toggle, errorText, useToast } from "./ui";

const blank = (priority: number): ProjectInput => ({
  title: "",
  description: "",
  type: "ai_ads",
  shape: "landscape",
  mediaId: "",
  isHidden: false,
  sortPriority: priority,
  client: "",
  featured: false,
  tags: [],
  previewUrl: "",
});

interface Props {
  editing: Project | null;
  nextPriority: number;
  onDone: (saved: boolean) => void;
}

export function ProjectForm({ editing, nextPriority, onDone }: Props) {
  const notify = useToast();
  const [v, setV] = useState<ProjectInput>(blank(nextPriority));
  const [tags, setTags] = useState("");
  const [mediaErr, setMediaErr] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (editing) {
      const { id: _id, category: _c, timestamp: _t, hiddenBy: _h, rawType: _r, ...rest } = editing;
      setV(rest);
      setTags(editing.tags.join(", "));
    } else {
      setV(blank(nextPriority));
      setTags("");
    }
    setMediaErr("");
  }, [editing, nextPriority]);

  const set = <K extends keyof ProjectInput>(k: K, val: ProjectInput[K]) => setV((s) => ({ ...s, [k]: val }));

  const onMedia = (raw: string) => {
    set("mediaId", raw);
    setMediaErr("");
    // Shorts links are always vertical.
    if (/\/shorts\//.test(raw)) set("shape", "portrait");
  };

  const id = youtubeId(v.mediaId);

  async function submit(e: FormEvent) {
    e.preventDefault();
    const raw = v.mediaId.trim();
    if (!raw) return setMediaErr("Paste a YouTube link or video ID.");
    if (!id && !/^https?:\/\//.test(raw)) return setMediaErr("That does not look like a YouTube link or 11-character video ID.");
    setBusy(true);
    try {
      await saveProject(
        {
          ...v,
          mediaId: id ?? raw, // store the bare ID, like the existing entries
          title: v.title.trim(),
          description: v.description.trim(),
          client: v.client.trim(),
          tags: tags.split(",").map((t) => t.trim()).filter(Boolean).slice(0, 6),
          previewUrl: v.previewUrl.trim(),
          sortPriority: Number(v.sortPriority) || 0,
        },
        editing?.id,
      );
      notify(editing ? "Film updated." : "Film added.");
      onDone(true);
    } catch (err) {
      notify(errorText(err), "error");
    }
    setBusy(false);
  }

  return (
    <motion.form
      onSubmit={submit}
      noValidate
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ type: "spring", stiffness: 260, damping: 28 }}
      className="rounded-card border border-line-strong bg-ink-900 p-5 md:p-8"
    >
      <div className="mb-7 flex items-center justify-between">
        <h2 className="font-display text-2xl uppercase">{editing ? "Edit film" : "Add a film"}</h2>
        <button type="button" onClick={() => onDone(false)} aria-label="Close form" className="grid size-9 place-items-center rounded-btn border border-line-strong text-muted hover:border-fg hover:text-fg">
          <X weight="light" size={18} />
        </button>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_300px]">
        <div className="flex flex-col gap-5">
          <Field label="YouTube link or video ID" htmlFor="p-media" error={mediaErr} help="Paste the full link (youtu.be, watch, or shorts). Only the ID is saved.">
            <input id="p-media" className="field-input" value={v.mediaId} onChange={(e) => onMedia(e.target.value)} placeholder="https://youtu.be/..." aria-invalid={!!mediaErr || undefined} autoFocus />
          </Field>
          <Field label="Title" htmlFor="p-title" help="Leave empty and the site shows the format name instead.">
            <input id="p-title" className="field-input" value={v.title} onChange={(e) => set("title", e.target.value)} maxLength={120} />
          </Field>
          <Field label="Description" htmlFor="p-desc" help="One or two sentences. Shown on the home page showcase.">
            <textarea id="p-desc" rows={3} className="field-input resize-y" value={v.description} onChange={(e) => set("description", e.target.value)} maxLength={400} />
          </Field>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Client" htmlFor="p-client">
              <input id="p-client" className="field-input" value={v.client} onChange={(e) => set("client", e.target.value)} placeholder="e.g. GO Charge" />
            </Field>
            <Field label="Format" htmlFor="p-type">
              <select id="p-type" className="field-input" value={v.type} onChange={(e) => set("type", e.target.value as VideoType)}>
                {CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
              </select>
            </Field>
          </div>
          <Field label="Preview clip URL" htmlFor="p-preview" help="Optional. A short muted .mp4 or .webm played on hover. Without it, the YouTube video previews muted.">
            <input id="p-preview" type="url" className="field-input" value={v.previewUrl} onChange={(e) => set("previewUrl", e.target.value)} placeholder="https://.../preview.mp4" />
          </Field>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Tags" htmlFor="p-tags" help="Comma separated, up to 6. e.g. Seedance, Ad reel">
              <input id="p-tags" className="field-input" value={tags} onChange={(e) => setTags(e.target.value)} />
            </Field>
            <Field label="Priority" htmlFor="p-priority" help="Higher shows first. Drag to reorder instead.">
              <input id="p-priority" type="number" className="field-input font-mono" value={v.sortPriority} onChange={(e) => set("sortPriority", Number(e.target.value))} />
            </Field>
          </div>
        </div>

        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium">Preview</span>
            <div className={`media-box mx-auto w-full rounded-thumb border border-line bg-ink-950 ${v.shape === "portrait" ? "aspect-[9/16] max-w-[200px]" : "aspect-video"}`}>
              {id ? (
                <Thumb media={id} shape={v.shape} hi={v.shape === "landscape"} />
              ) : (
                <span className="absolute inset-0 grid place-items-center p-4 text-center text-[13px] text-subtle">Paste a link to preview</span>
              )}
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium">Shape</span>
            <Segmented<Shape>
              id="shape"
              value={v.shape}
              onChange={(s) => set("shape", s)}
              options={[{ value: "landscape", label: "Landscape" }, { value: "portrait", label: "Portrait" }]}
            />
          </div>
          <Toggle checked={!v.isHidden} onChange={(on) => set("isHidden", !on)} label="Visible on site" description="Hidden films stay here but are not shown." />
          <Toggle
            checked={v.featured}
            onChange={(on) => set("featured", on)}
            label="Featured (best work)"
            description={
              v.type === "edits"
                ? "Edits only show featured films. Off means hidden from the site."
                : "Shown first in its category. Featured AI Ads, Motion Ads, AI Cinema and Showreels lead the home Featured work rows."
            }
          />
        </div>
      </div>

      <div className="mt-8 flex flex-wrap gap-3 border-t border-line pt-6">
        <button type="submit" disabled={busy} className={btn("primary")}>
          {busy ? <>Saving <CircleNotch weight="light" size={18} className="animate-spin" /></> : editing ? "Save changes" : "Add film"}
        </button>
        <button type="button" onClick={() => onDone(false)} className={btn("ghost")}>Cancel</button>
      </div>
    </motion.form>
  );
}
