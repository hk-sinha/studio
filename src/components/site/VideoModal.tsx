"use client";
import { useEffect } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useScrollApi } from "@/components/providers/SmoothScroll";
import { useDialog } from "@/components/ui/useDialog";
import { embedUrl, youtubeId } from "@/lib/media";
import type { Shape } from "@/lib/types";
import { ArrowSquareOut, X } from "@/components/ui/icons";

export interface VideoTarget {
  media: string;
  shape: Shape;
  title?: string;
}

export function VideoModal({ target, onClose }: { target: VideoTarget | null; onClose: () => void }) {
  const open = !!target;
  const { lock, unlock } = useScrollApi();
  const ref = useDialog(open, onClose);

  useEffect(() => {
    if (!open) return;
    lock();
    return unlock;
  }, [open, lock, unlock]);

  const id = target ? youtubeId(target.media) : null;
  const portrait = target?.shape === "portrait";

  return (
    <AnimatePresence>
      {target && (
        <motion.div
          ref={ref}
          role="dialog"
          aria-modal="true"
          aria-label={target.title ? `Playing ${target.title}` : "Video player"}
          className="fixed inset-0 z-[60] flex flex-col items-center justify-center gap-4 p-4 md:p-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="absolute inset-0 bg-ink-950/85 backdrop-blur-md" onClick={onClose} />

          <motion.div
            className={`relative overflow-hidden rounded-card bg-ink-900 shadow-[0_30px_80px_rgb(0_0_0/0.5)] ${
              portrait ? "aspect-[9/16] h-[min(80dvh,880px)] max-w-full" : "aspect-video w-[min(1100px,100%)]"
            }`}
            initial={{ scale: 0.96, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.97, opacity: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 28 }}
          >
            {id ? (
              <iframe
                src={embedUrl(id)}
                title={target.title || "Video player"}
                allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
                allowFullScreen
                className="absolute inset-0 h-full w-full border-0"
              />
            ) : (
              <div className="absolute inset-0 grid place-items-center p-6 text-center">
                <a href={target.media} target="_blank" rel="noopener" className="inline-flex items-center gap-2 text-muted hover:text-fg">
                  Open this video <ArrowSquareOut weight="light" size={18} />
                </a>
              </div>
            )}
          </motion.div>

          {target.title && <p className="relative max-w-[60ch] text-center text-sm text-muted">{target.title}</p>}

          <button
            onClick={onClose}
            aria-label="Close video"
            className="absolute right-4 top-4 grid size-11 place-items-center rounded-full border border-line-strong bg-ink-950/60 transition-colors hover:border-fg md:right-6 md:top-6"
          >
            <X weight="light" size={20} />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
