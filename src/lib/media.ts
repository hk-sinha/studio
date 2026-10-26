import type { Project } from "./types";
import { categoryById } from "./config";

// mediaId is usually a bare YouTube ID, but older entries may hold a full URL.
export function youtubeId(media: string): string | null {
  const m = media.trim();
  if (/^[\w-]{11}$/.test(m)) return m;
  const match = m.match(/(?:youtu\.be\/|v=|\/shorts\/|\/embed\/|\/live\/)([\w-]{11})/);
  return match ? match[1] : null;
}

export const thumbUrl = (id: string, q: "hqdefault" | "maxresdefault" = "hqdefault") =>
  `https://i.ytimg.com/vi/${id}/${q}.jpg`;

export const embedUrl = (id: string) =>
  `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0&playsinline=1&modestbranding=1`;

export const watchUrl = (id: string) => `https://www.youtube.com/watch?v=${id}`;

export function displayTitle(p: Project) {
  return p.title.trim() || categoryById(p.type)?.singular || "Video";
}

const ENTITIES: Record<string, string> = { copy: "©", reg: "®", trade: "™", amp: "&", nbsp: " ", middot: "·" };

/** The old admin stored HTML like "Copyright &copy; 2026"; React would print the entity literally. */
export const decodeEntities = (s: string) =>
  s
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&([a-z]+);/gi, (m, name) => ENTITIES[name.toLowerCase()] ?? m);

export const whatsappLink = (phone: string, text?: string) => {
  const digits = phone.replace(/\D/g, "");
  return `https://wa.me/${digits}${text ? `?text=${encodeURIComponent(text)}` : ""}`;
};

/** Files in /public, prefixed with the GitHub Pages base path when there is one. */
export const asset = (path: string) => `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}${path}`;
