import {
  addDoc,
  collection,
  deleteDoc,
  deleteField,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  setDoc,
  writeBatch,
  type DocumentData,
} from "firebase/firestore";
import { db } from "./firebase";
import { CERTIFICATIONS, DEFAULT_PROFILE, EDUCATION, TOOLKIT_DEFAULT, normalizeType } from "./config";
import type { Lead, Profile, Project, Testimonial } from "./types";

function toProject(id: string, d: DocumentData): Project {
  return {
    id,
    title: String(d.title ?? ""),
    description: String(d.description ?? ""),
    category: String(d.category ?? "video"),
    type: normalizeType(d.type, String(d.mediaId ?? "")),
    rawType: String(d.type ?? ""),
    shape: d.shape === "portrait" ? "portrait" : "landscape",
    mediaId: String(d.mediaId ?? ""),
    isHidden: !!d.isHidden,
    sortPriority: Number(d.sortPriority) || 0,
    timestamp: Number(d.timestamp) || 0,
    client: String(d.client ?? ""),
    featured: !!d.featured,
    tags: Array.isArray(d.tags) ? d.tags.map(String) : [],
    previewUrl: String(d.previewUrl ?? ""),
    hiddenBy: String(d.hiddenBy ?? ""),
  };
}

export const byPriority = (a: Project, b: Project) =>
  b.sortPriority - a.sortPriority || b.timestamp - a.timestamp;

/** Public order: featured (best work) first, then priority, then newest. */
export const byBest = (a: Project, b: Project) => Number(b.featured) - Number(a.featured) || byPriority(a, b);

/** What the public site may show. Edits are hand-picked: featured only. */
export const isPublic = (p: Project) => !p.isHidden && (p.type !== "edits" || p.featured);

/** All video projects (hidden included), highest priority first. */
export async function fetchProjects(): Promise<Project[]> {
  const snap = await getDocs(collection(db, "projects"));
  return snap.docs
    .map((s) => toProject(s.id, s.data()))
    .filter((p) => p.category === "video" && p.mediaId)
    .sort(byPriority);
}

export async function fetchProfile(): Promise<Profile> {
  const snap = await getDoc(doc(db, "settings", "profile"));
  const d = snap.exists() ? snap.data() : {};
  const out = { ...DEFAULT_PROFILE };
  (Object.keys(out) as (keyof Profile)[]).forEach((k) => {
    if (typeof d[k] === "string" && d[k].trim()) out[k] = d[k].trim();
  });
  return out;
}

/* ---------- Hero (lens) settings ---------- */
export interface HeroSettings {
  /** YouTube IDs that flash inside the lens on desktop/tablet, in order. Empty = automatic picks. */
  flashes: string[];
  /** Separate list for phones (portrait screen). Empty = automatic picks, 9:16 first. */
  flashesMobile: string[];
  /** Line shown on the black frame after the lens. */
  endLine: string;
}
export const DEFAULT_HERO: HeroSettings = { flashes: [], flashesMobile: [], endLine: "Every frame, directed." };

export async function fetchHeroSettings(): Promise<HeroSettings> {
  const snap = await getDoc(doc(db, "settings", "hero"));
  const d = snap.exists() ? snap.data() : {};
  return {
    flashes: Array.isArray(d.flashes) ? d.flashes.map(String).filter(Boolean) : [],
    flashesMobile: Array.isArray(d.flashesMobile) ? d.flashesMobile.map(String).filter(Boolean) : [],
    endLine: typeof d.endLine === "string" && d.endLine.trim() ? d.endLine.trim() : DEFAULT_HERO.endLine,
  };
}
export const saveHeroSettings = (h: HeroSettings) => setDoc(doc(db, "settings", "hero"), h);

/* ---------- About page: education + certifications ---------- */
export interface EducationItem { period: string; title: string; place: string }
export interface CertificationItem { year: string; title: string; issuer: string }
export interface AboutSettings { education: EducationItem[]; certifications: CertificationItem[] }
export const DEFAULT_ABOUT: AboutSettings = { education: EDUCATION, certifications: CERTIFICATIONS };

const str = (v: unknown) => String(v ?? "").trim();
export async function fetchAboutSettings(): Promise<AboutSettings> {
  const snap = await getDoc(doc(db, "settings", "about"));
  if (!snap.exists()) return DEFAULT_ABOUT;
  const d = snap.data();
  return {
    education: Array.isArray(d.education)
      ? d.education.map((e: Record<string, unknown>) => ({ period: str(e.period), title: str(e.title), place: str(e.place) })).filter((e: EducationItem) => e.title)
      : DEFAULT_ABOUT.education,
    certifications: Array.isArray(d.certifications)
      ? d.certifications.map((c: Record<string, unknown>) => ({ year: str(c.year), title: str(c.title), issuer: str(c.issuer) })).filter((c: CertificationItem) => c.title)
      : DEFAULT_ABOUT.certifications,
  };
}
export const saveAboutSettings = (a: AboutSettings) => setDoc(doc(db, "settings", "about"), a);

/* ---------- Final CTA background ("Got a launch coming up?") ---------- */
export type CtaKind = "image" | "video" | "youtube";
// Uploaded images are stored inline as a compressed data URL (free Spark plan, no Storage bucket).
export interface CtaMedia { url: string; kind: CtaKind }
export async function fetchCtaMedia(): Promise<CtaMedia | null> {
  const snap = await getDoc(doc(db, "settings", "cta"));
  const d = snap.exists() ? snap.data() : null;
  if (!d || typeof d.url !== "string" || !d.url) return null;
  return { url: d.url, kind: (["image", "video", "youtube"].includes(d.kind) ? d.kind : "image") as CtaKind };
}
export const saveCtaMedia = (m: CtaMedia | null) => setDoc(doc(db, "settings", "cta"), m ?? { url: "", kind: "image" });

/** Writes explicit category ids (only for the films passed in). */
export async function saveCategories(changes: Record<string, string>) {
  const batch = writeBatch(db);
  Object.entries(changes).forEach(([id, type]) => batch.set(doc(db, "projects", id), { type }, { merge: true }));
  await batch.commit();
}

export async function fetchToolkit(): Promise<string[]> {
  const snap = await getDoc(doc(db, "settings", "toolkit"));
  const tools = snap.exists() ? snap.data().tools : null;
  return Array.isArray(tools) && tools.length ? tools.map(String) : TOOLKIT_DEFAULT;
}

export async function fetchTestimonials(): Promise<Testimonial[]> {
  const snap = await getDocs(collection(db, "testimonials"));
  return snap.docs
    .map((s) => {
      const d = s.data();
      return {
        id: s.id,
        quote: String(d.quote ?? ""),
        name: String(d.name ?? ""),
        role: String(d.role ?? ""),
        company: String(d.company ?? ""),
        photoUrl: String(d.photoUrl ?? ""),
        order: Number(d.order) || 0,
      };
    })
    .filter((t) => t.quote && t.name)
    .sort((a, b) => a.order - b.order);
}

/* ---------- Contact form ---------- */
export async function submitLead(input: Omit<Lead, "id" | "status" | "createdAt">) {
  await addDoc(collection(db, "leads"), { ...input, status: "new", createdAt: serverTimestamp() });
}

/* ---------- Admin writes ---------- */
export type ProjectInput = Omit<Project, "id" | "category" | "timestamp" | "hiddenBy" | "rawType">;

export async function saveProject(input: ProjectInput, id?: string) {
  const data = { ...input, category: "video" };
  if (id) await setDoc(doc(db, "projects", id), data, { merge: true });
  else await addDoc(collection(db, "projects"), { ...data, timestamp: Date.now() });
}

export const updateProject = (id: string, patch: Partial<Project>) =>
  setDoc(doc(db, "projects", id), patch, { merge: true });

export const deleteProject = (id: string) => deleteDoc(doc(db, "projects", id));

/** Re-number priorities top to bottom (10 apart) in one atomic batch. */
export async function saveOrder(ids: string[]) {
  const batch = writeBatch(db);
  ids.forEach((id, i) => batch.set(doc(db, "projects", id), { sortPriority: (ids.length - i) * 10 }, { merge: true }));
  await batch.commit();
}

/* ---------- Selected Edits picker ---------- */
export const PICKER_MARK = "selected-edits";

export interface EditsPlan {
  /** Checked: featured, and shown even if it was hidden before. */
  keep: string[];
  /** Unchecked but currently featured: lose the flag. */
  unfeature: string[];
  /** Unchecked and currently visible: hidden, marked so Undo can restore them. */
  hide: string[];
  /** New edit-only descriptions, by project id. */
  descriptions: Record<string, string>;
}

export async function applySelectedEdits(plan: EditsPlan) {
  const batch = writeBatch(db);
  const ref = (id: string) => doc(db, "projects", id);
  plan.keep.forEach((id) => batch.set(ref(id), { featured: true, isHidden: false, hiddenBy: deleteField() }, { merge: true }));
  plan.unfeature.forEach((id) => batch.set(ref(id), { featured: false }, { merge: true }));
  plan.hide.forEach((id) => batch.set(ref(id), { isHidden: true, hiddenBy: PICKER_MARK }, { merge: true }));
  Object.entries(plan.descriptions).forEach(([id, description]) => batch.set(ref(id), { description }, { merge: true }));
  await batch.commit();
}

/** Restores only the films the picker hid; anything hidden by hand stays hidden. */
export async function undoSelectedEdits(ids: string[]) {
  const batch = writeBatch(db);
  ids.forEach((id) => batch.set(doc(db, "projects", id), { isHidden: false, hiddenBy: deleteField() }, { merge: true }));
  await batch.commit();
}

export const saveProfile = (p: Profile) => setDoc(doc(db, "settings", "profile"), p, { merge: true });
export const saveToolkit = (tools: string[]) => setDoc(doc(db, "settings", "toolkit"), { tools });

export async function saveTestimonial(t: Omit<Testimonial, "id">, id?: string) {
  if (id) await setDoc(doc(db, "testimonials", id), t);
  else await addDoc(collection(db, "testimonials"), t);
}
export const deleteTestimonial = (id: string) => deleteDoc(doc(db, "testimonials", id));

export async function fetchLeads(): Promise<Lead[]> {
  const snap = await getDocs(collection(db, "leads"));
  return snap.docs
    .map((s) => {
      const d = s.data();
      return {
        id: s.id,
        name: String(d.name ?? ""),
        email: String(d.email ?? ""),
        company: String(d.company ?? ""),
        type: String(d.type ?? ""),
        timeline: String(d.timeline ?? ""),
        message: String(d.message ?? ""),
        status: (["new", "contacted", "archived"].includes(d.status) ? d.status : "new") as Lead["status"],
        createdAt: d.createdAt?.toMillis?.() ?? 0,
      };
    })
    .sort((a, b) => b.createdAt - a.createdAt);
}
export const setLeadStatus = (id: string, status: Lead["status"]) =>
  setDoc(doc(db, "leads", id), { status }, { merge: true });
export const deleteLead = (id: string) => deleteDoc(doc(db, "leads", id));
