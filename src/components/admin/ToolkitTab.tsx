"use client";
import { useEffect, useState, type FormEvent } from "react";
import { Reorder } from "motion/react";
import { fetchToolkit, saveToolkit } from "@/lib/data";
import { btn } from "@/components/ui/button";
import { CircleNotch, DotsSixVertical, Plus, X } from "@/components/ui/icons";
import { errorText, useToast } from "./ui";

/** Replaces the old skill-percentage sliders: the site now shows tools, not scores. */
export function ToolkitTab() {
  const notify = useToast();
  const [tools, setTools] = useState<string[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    fetchToolkit()
      .then(setTools)
      .catch((e) => notify(errorText(e), "error"))
      .finally(() => setLoading(false));
  }, [notify]);

  const update = (next: string[]) => { setTools(next); setDirty(true); };

  const add = (e: FormEvent) => {
    e.preventDefault();
    const name = input.trim();
    if (!name) return;
    if (tools.some((t) => t.toLowerCase() === name.toLowerCase())) return notify(`${name} is already in the list.`, "error");
    update([...tools, name]);
    setInput("");
  };

  async function save() {
    setBusy(true);
    try {
      await saveToolkit(tools);
      setDirty(false);
      notify("Toolkit saved.");
    } catch (e) {
      notify(errorText(e), "error");
    }
    setBusy(false);
  }

  return (
    <div className="flex max-w-2xl flex-col gap-8">
      <div>
        <h1 className="display text-[clamp(36px,4.6vw,56px)]">Toolkit</h1>
        <p className="mt-3 text-muted">The tools shown as chips on the home and About pages. Drag to set the order.</p>
      </div>

      <form onSubmit={add} className="flex gap-2">
        <label className="flex-1">
          <span className="sr-only">Tool name</span>
          <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Add a tool, e.g. DaVinci Resolve" className="field-input" maxLength={40} />
        </label>
        <button type="submit" className={btn("ghost", "md", "!h-auto")}><Plus weight="light" size={16} /> Add</button>
      </form>

      {loading ? (
        <div className="skeleton h-48 rounded-card" />
      ) : (
        <Reorder.Group axis="y" values={tools} onReorder={update} className="flex flex-col gap-2">
          {tools.map((t) => (
            <Reorder.Item key={t} value={t} className="flex cursor-grab select-none items-center gap-3 rounded-btn border border-line bg-ink-900 py-2 pl-2 pr-2 active:cursor-grabbing" whileDrag={{ scale: 1.02 }}>
              <DotsSixVertical weight="light" size={20} className="text-muted" />
              <span className="flex-1 text-[15px]">{t}</span>
              <button onClick={() => update(tools.filter((x) => x !== t))} aria-label={`Remove ${t}`} className="grid size-8 place-items-center rounded-md text-muted hover:text-fg">
                <X weight="light" size={16} />
              </button>
            </Reorder.Item>
          ))}
        </Reorder.Group>
      )}

      <div className="flex items-center gap-4">
        <button onClick={save} disabled={busy || !dirty} className={btn("primary")}>
          {busy ? <>Saving <CircleNotch weight="light" size={18} className="animate-spin" /></> : "Save toolkit"}
        </button>
        <span className="text-sm text-muted">{dirty ? "Unsaved changes" : "All changes saved"}</span>
      </div>
    </div>
  );
}
