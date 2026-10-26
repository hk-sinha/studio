"use client";
import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, Reorder, motion, useDragControls } from "motion/react";
import { CATEGORIES, categoryById } from "@/lib/config";
import { deleteProject, isPublic, saveOrder, updateProject } from "@/lib/data";
import { displayTitle } from "@/lib/media";
import type { LoadState, Project } from "@/lib/types";
import { Thumb } from "@/components/ui/Thumb";
import { btn } from "@/components/ui/button";
import {
  ArrowsDownUp, CircleNotch, DotsSixVertical, Eye, EyeSlash, FilmSlate, MagnifyingGlass, PencilSimple, Plus, Rows, SquaresFour, Star, Trash,
} from "@/components/ui/icons";
import { ProjectForm } from "./ProjectForm";
import { SelectedEditsPicker } from "./SelectedEditsPicker";
import { CategoriesPanel } from "./CategoriesPanel";
import { ConfirmButton, EmptyState, errorText, iconBtn, useToast } from "./ui";

type View = "grid" | "list";

export function ProjectsTab({ projects, state, reload }: { projects: Project[]; state: LoadState; reload: () => Promise<void> }) {
  const notify = useToast();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Project | null>(null);
  const [q, setQ] = useState("");
  const [format, setFormat] = useState("all");
  const [vis, setVis] = useState<"all" | "visible" | "hidden">("all");
  const [view, setView] = useState<View>("grid");
  const [reordering, setReordering] = useState(false);
  const [order, setOrder] = useState<Project[]>([]);
  const [savingOrder, setSavingOrder] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    try { if (localStorage.getItem("hks-admin-view") === "list") setView("list"); } catch { /* storage unavailable */ }
  }, []);
  const changeView = (v: View) => {
    setView(v);
    try { localStorage.setItem("hks-admin-view", v); } catch { /* storage unavailable */ }
  };

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return projects.filter((p) =>
      (format === "all" || p.type === format) &&
      (vis === "all" || (vis === "hidden" ? !isPublic(p) : isPublic(p))) &&
      (!term || [p.title, p.description, p.client, p.mediaId, ...p.tags].join(" ").toLowerCase().includes(term)),
    );
  }, [projects, q, format, vis]);

  const nextPriority = (projects[0]?.sortPriority ?? 0) + 10;
  const featuredCount = projects.filter((p) => p.featured).length;

  const openNew = () => { setEditing(null); setFormOpen(true); window.scrollTo({ top: 0, behavior: "smooth" }); };
  const openEdit = (p: Project) => { setEditing(p); setFormOpen(true); window.scrollTo({ top: 0, behavior: "smooth" }); };
  const closeForm = async (saved: boolean) => {
    setFormOpen(false);
    setEditing(null);
    if (saved) await reload();
  };

  async function patch(p: Project, change: Partial<Project>, msg: string) {
    setBusyId(p.id);
    try {
      await updateProject(p.id, change);
      await reload();
      notify(msg);
    } catch (e) {
      notify(errorText(e), "error");
    }
    setBusyId(null);
  }

  async function remove(p: Project) {
    setBusyId(p.id);
    try {
      await deleteProject(p.id);
      await reload();
      notify(`Deleted "${displayTitle(p)}".`);
    } catch (e) {
      notify(errorText(e), "error");
    }
    setBusyId(null);
  }

  const startReorder = () => { setOrder(projects); setReordering(true); setFormOpen(false); };
  async function commitOrder() {
    setSavingOrder(true);
    try {
      await saveOrder(order.map((p) => p.id));
      await reload();
      setReordering(false);
      notify("New order saved. The site shows films in this order.");
    } catch (e) {
      notify(errorText(e), "error");
    }
    setSavingOrder(false);
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="display text-[clamp(36px,4.6vw,56px)]">Films</h1>
          <p className="mt-3 text-muted">
            {state === "ready" ? `${projects.length} films, ${projects.filter(isPublic).length} on the site, ${featuredCount} featured.` : "Loading films..."}
          </p>
        </div>
        {!reordering && (
          <div className="flex flex-wrap gap-2">
            <button onClick={startReorder} disabled={state !== "ready" || projects.length < 2} className={btn("ghost", "sm")}>
              <ArrowsDownUp weight="light" size={16} /> Reorder
            </button>
            <button onClick={openNew} className={btn("primary", "sm")}>
              <Plus weight="light" size={16} /> Add film
            </button>
          </div>
        )}
      </div>

      <AnimatePresence>
        {formOpen && <ProjectForm key={editing?.id ?? "new"} editing={editing} nextPriority={nextPriority} onDone={closeForm} />}
      </AnimatePresence>

      {state === "ready" && !formOpen && !reordering && (
        <>
          <CategoriesPanel projects={projects} reload={reload} />
          <SelectedEditsPicker projects={projects} reload={reload} />
        </>
      )}

      {reordering ? (
        <ReorderList order={order} setOrder={setOrder} saving={savingOrder} onSave={commitOrder} onCancel={() => setReordering(false)} />
      ) : (
        <>
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <label className="relative flex-1">
              <span className="sr-only">Search films</span>
              <MagnifyingGlass weight="light" size={18} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search title, client, tag or ID" className="field-input pl-10" />
            </label>
            <div className="flex gap-2">
              <label className="flex-1 md:w-48 md:flex-none">
                <span className="sr-only">Format</span>
                <select value={format} onChange={(e) => setFormat(e.target.value)} className="field-input">
                  <option value="all">All formats</option>
                  {CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
                </select>
              </label>
              <label className="flex-1 md:w-36 md:flex-none">
                <span className="sr-only">Visibility</span>
                <select value={vis} onChange={(e) => setVis(e.target.value as typeof vis)} className="field-input">
                  <option value="all">All</option>
                  <option value="visible">Visible</option>
                  <option value="hidden">Hidden</option>
                </select>
              </label>
              <div className="flex rounded-btn border border-line-strong p-1" role="group" aria-label="Layout">
                <button onClick={() => changeView("grid")} aria-pressed={view === "grid"} aria-label="Grid view" className={`grid size-9 place-items-center rounded-[7px] ${view === "grid" ? "bg-fg text-ink-950" : "text-muted"}`}><SquaresFour weight="light" size={18} /></button>
                <button onClick={() => changeView("list")} aria-pressed={view === "list"} aria-label="List view" className={`grid size-9 place-items-center rounded-[7px] ${view === "list" ? "bg-fg text-ink-950" : "text-muted"}`}><Rows weight="light" size={18} /></button>
              </div>
            </div>
          </div>

          {state === "loading" && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: 8 }, (_, i) => <div key={i} className="skeleton aspect-[4/3.4] rounded-card" />)}
            </div>
          )}
          {state === "error" && (
            <EmptyState icon={<FilmSlate weight="light" size={32} />} title="Could not load films">
              <button onClick={reload} className={btn("ghost", "sm", "mt-2")}>Try again</button>
            </EmptyState>
          )}
          {state === "ready" && projects.length === 0 && (
            <EmptyState icon={<FilmSlate weight="light" size={32} />} title="No films yet">
              Add your first film with a YouTube link. It appears on the site straight away.
            </EmptyState>
          )}
          {state === "ready" && projects.length > 0 && filtered.length === 0 && (
            <EmptyState icon={<MagnifyingGlass weight="light" size={32} />} title="No matches">
              Nothing matches these filters. Clear the search or pick another format.
            </EmptyState>
          )}

          {filtered.length > 0 && (
            <motion.ul layout className={view === "grid" ? "grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" : "flex flex-col divide-y divide-line border-y border-line"}>
              <AnimatePresence initial={false}>
                {filtered.map((p) => (
                  <motion.li
                    key={p.id}
                    layout
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.96 }}
                    transition={{ type: "spring", stiffness: 100, damping: 20 }}
                    className={view === "grid" ? "flex flex-col overflow-hidden rounded-card border border-line bg-ink-900" : "flex items-center gap-4 py-3"}
                  >
                    <div className={`media-box shrink-0 bg-ink-850 ${view === "grid" ? "aspect-video w-full" : "h-14 w-24 rounded-md"} ${p.isHidden ? "opacity-40" : ""}`}>
                      <Thumb media={p.mediaId} shape={p.shape} />
                      {view === "grid" && (
                        <span className="absolute left-3 top-3 flex gap-1.5">
                          {p.isHidden ? <Badge>Hidden</Badge> : !isPublic(p) && <Badge>Not selected</Badge>}
                          {p.featured && <Badge>Featured</Badge>}
                          {p.shape === "portrait" && <Badge>9:16</Badge>}
                        </span>
                      )}
                    </div>
                    <div className={`min-w-0 flex-1 ${view === "grid" ? "p-4 pb-2" : ""}`}>
                      <p className={`truncate text-[15px] font-medium ${p.title ? "" : "italic text-muted"}`}>{p.title || `Untitled ${categoryById(p.type)?.singular.toLowerCase()}`}</p>
                      <p className="mt-0.5 truncate text-[13px] text-muted">
                        {categoryById(p.type)?.label} <span className="font-mono text-subtle">&middot; {p.sortPriority}</span>
                        {view === "list" && p.isHidden && " · Hidden"}
                        {view === "list" && p.featured && " · Featured"}
                      </p>
                    </div>
                    <div className={`flex items-center gap-1.5 ${view === "grid" ? "px-4 pb-4 pt-1" : ""}`}>
                      <button onClick={() => openEdit(p)} aria-label={`Edit ${displayTitle(p)}`} className={iconBtn}><PencilSimple weight="light" size={16} /></button>
                      <button
                        onClick={() => patch(p, { isHidden: !p.isHidden }, p.isHidden ? "Now visible on the site." : "Hidden from the site.")}
                        disabled={busyId === p.id}
                        aria-label={p.isHidden ? "Show on site" : "Hide from site"}
                        className={iconBtn}
                      >
                        {busyId === p.id ? <CircleNotch weight="light" size={16} className="animate-spin" /> : p.isHidden ? <EyeSlash weight="light" size={16} /> : <Eye weight="light" size={16} />}
                      </button>
                      <button
                        onClick={() => patch(p, { featured: !p.featured }, p.featured ? "No longer featured." : "Featured as best work.")}
                        disabled={busyId === p.id}
                        aria-label={p.featured ? "Unfeature" : "Feature as best work"}
                        className={`${iconBtn} ${p.featured ? "!border-fg !text-fg" : ""}`}
                      >
                        <Star weight={p.featured ? "fill" : "light"} size={16} />
                      </button>
                      <ConfirmButton onConfirm={() => remove(p)} ariaLabel={`Delete ${displayTitle(p)}`} armedLabel="Delete?" className={`${iconBtn} ml-auto hover:!border-rec hover:!text-[#FF8A8E]`}>
                        <Trash weight="light" size={16} />
                      </ConfirmButton>
                    </div>
                  </motion.li>
                ))}
              </AnimatePresence>
            </motion.ul>
          )}
        </>
      )}
    </div>
  );
}

function Badge({ children }: { children: React.ReactNode }) {
  return <span className="rounded-full bg-ink-950/80 px-2 py-0.5 text-[11px] text-fg backdrop-blur">{children}</span>;
}

function ReorderList({ order, setOrder, saving, onSave, onCancel }: { order: Project[]; setOrder: (p: Project[]) => void; saving: boolean; onSave: () => void; onCancel: () => void }) {
  return (
    <div className="flex flex-col gap-5">
      <div className="sticky top-[118px] z-10 flex flex-wrap items-center justify-between gap-3 rounded-card border border-line-strong bg-ink-900/95 p-4 backdrop-blur">
        <p className="text-sm text-muted">Drag films by the handle. Top of the list shows first on the site.</p>
        <div className="flex gap-2">
          <button onClick={onCancel} className={btn("ghost", "sm")}>Cancel</button>
          <button onClick={onSave} disabled={saving} className={btn("primary", "sm")}>
            {saving ? <>Saving <CircleNotch weight="light" size={16} className="animate-spin" /></> : "Save order"}
          </button>
        </div>
      </div>
      <Reorder.Group axis="y" values={order} onReorder={setOrder} className="flex flex-col gap-2">
        {order.map((p, i) => <ReorderRow key={p.id} p={p} index={i} />)}
      </Reorder.Group>
    </div>
  );
}

function ReorderRow({ p, index }: { p: Project; index: number }) {
  const controls = useDragControls();
  return (
    <Reorder.Item
      value={p}
      dragListener={false}
      dragControls={controls}
      className="flex select-none items-center gap-4 rounded-btn border border-line bg-ink-900 p-2 pr-4"
      whileDrag={{ scale: 1.02, boxShadow: "0 20px 40px -15px rgb(0 0 0 / 0.7)" }}
    >
      <button
        onPointerDown={(e) => controls.start(e)}
        aria-label={`Drag ${displayTitle(p)}`}
        className="grid size-10 cursor-grab touch-none place-items-center rounded-md text-muted hover:text-fg active:cursor-grabbing"
      >
        <DotsSixVertical weight="light" size={20} />
      </button>
      <span className="w-8 font-mono text-xs text-subtle">{index + 1}</span>
      <span className={`media-box h-12 w-20 shrink-0 rounded-md bg-ink-850 ${p.isHidden ? "opacity-40" : ""}`}><Thumb media={p.mediaId} shape={p.shape} /></span>
      <span className="min-w-0 flex-1 truncate text-[15px]">{displayTitle(p)}</span>
      <span className="hidden text-[13px] text-muted sm:inline">{categoryById(p.type)?.label}{p.isHidden ? " · Hidden" : ""}</span>
    </Reorder.Item>
  );
}
