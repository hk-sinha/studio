"use client";
import { useEffect, useRef, useState } from "react";
import { useUI } from "@/components/providers/UIProvider";
import { Thumb } from "@/components/ui/Thumb";
import { useMediaQuery } from "@/components/ui/useMediaQuery";
import { Play } from "@/components/ui/icons";
import { categoryById } from "@/lib/config";
import { displayTitle, youtubeId } from "@/lib/media";
import type { Project } from "@/lib/types";

// Only one hover preview plays at a time across the whole site.
let stopActive: (() => void) | null = null;

const previewSrc = (id: string) =>
  `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&mute=1&controls=0&loop=1&playlist=${id}&playsinline=1&modestbranding=1&rel=0&disablekb=1&iv_load_policy=3&fs=0`;

/**
 * Video card that fills its parent (the parent sets the size and aspect ratio).
 * Click opens the player; on hover-capable pointers it plays a muted preview.
 */
/** bare: no play button, caption or player chrome (Featured work rows). */
export function VideoCard({ p, eager = false, showCategory = true, bare = false }: { p: Project; eager?: boolean; showCategory?: boolean; bare?: boolean }) {
  const { openVideo } = useUI();
  const canHover = useMediaQuery("(hover: hover) and (pointer: fine)");
  const reduce = useMediaQuery("(prefers-reduced-motion: reduce)");
  const [preview, setPreview] = useState(false);
  const [shown, setShown] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const title = displayTitle(p);
  const cat = categoryById(p.type);
  const id = youtubeId(p.mediaId);
  const meta = [p.title && showCategory ? cat?.singular : "", p.client].filter(Boolean).join(" · ");

  const stop = () => {
    clearTimeout(timer.current);
    setPreview(false);
    setShown(false);
  };

  useEffect(() => () => {
    clearTimeout(timer.current);
    if (stopActive === stop) stopActive = null;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onEnter = () => {
    if (!canHover || reduce || (!id && !p.previewUrl)) return;
    // Hover intent: skip cards the pointer only passes over.
    timer.current = setTimeout(() => {
      stopActive?.();
      stopActive = stop;
      setPreview(true);
    }, 350);
  };
  const onLeave = () => {
    if (stopActive === stop) stopActive = null;
    stop();
  };

  return (
    <button
      onClick={() => { stop(); openVideo({ media: p.mediaId, shape: p.shape, title }); }}
      onPointerEnter={onEnter}
      onPointerLeave={onLeave}
      aria-label={`Play ${title}`}
      className="media-box group block size-full rounded-card border border-line bg-ink-850 text-left"
    >
      <Thumb
        media={p.mediaId}
        shape={p.shape}
        hi={p.shape === "landscape"}
        eager={eager}
        className="brightness-[.82] transition-[filter,transform] duration-700 ease-expo group-hover:scale-[1.03] group-hover:brightness-100"
      />

      {preview && (
        <span aria-hidden="true" className={`pointer-events-none absolute inset-0 overflow-hidden transition-opacity duration-500 ${shown ? "opacity-100" : "opacity-0"}`}>
          {p.previewUrl ? (
            <video src={p.previewUrl} autoPlay muted loop playsInline onPlaying={() => setShown(true)} className="size-full object-cover" />
          ) : (
            id && (
              <iframe
                src={previewSrc(id)}
                title=""
                tabIndex={-1}
                allow="autoplay; encrypted-media"
                // YouTube fades its own controls in at first; wait before revealing the frame.
                onLoad={() => setTimeout(() => setShown(true), 1600)}
                // Slight overscale hides the player chrome at the edges.
                className="absolute left-1/2 top-1/2 h-[135%] w-[135%] -translate-x-1/2 -translate-y-1/2 border-0"
              />
            )
          )}
        </span>
      )}

      {!bare && (<>

      <span className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink-950/55 via-transparent to-transparent" />
      <span className="liquid-lite absolute right-3 top-3 grid size-10 place-items-center rounded-full text-white transition-[opacity,transform] duration-300 group-hover:scale-105 @max-[150px]:size-8 [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover:opacity-100 [@media(hover:hover)]:group-focus-visible:opacity-100">
        <Play weight="fill" size={14} />
      </span>
      {/* Frosted caption chip; hidden on cards too small to hold it. */}
      <span className="liquid-dark-lite absolute inset-x-2.5 bottom-2.5 rounded-[12px] px-3.5 py-2.5 @max-[150px]:hidden">
        <span className="line-clamp-2 block text-sm font-medium leading-snug">{title}</span>
        {meta && <span className="mt-0.5 block truncate text-xs text-muted">{meta}</span>}
      </span>
      </>)}
    </button>
  );
}
