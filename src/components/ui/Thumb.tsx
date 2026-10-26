"use client";
import { useEffect, useState } from "react";
import { thumbUrl, youtubeId } from "@/lib/media";
import type { Shape } from "@/lib/types";

interface Props {
  media: string;
  shape: Shape;
  /** Try the 1280px thumbnail (landscape only; falls back silently). */
  hi?: boolean;
  alt?: string;
  eager?: boolean;
  className?: string;
}

/** Must sit inside a `.media-box` (size container). Crops YouTube's baked-in bars. */
export function Thumb({ media, shape, hi = false, alt = "", eager = false, className = "" }: Props) {
  const id = youtubeId(media);
  const [src, setSrc] = useState(id ? thumbUrl(id) : media);

  useEffect(() => {
    setSrc(id ? thumbUrl(id) : media);
    if (!id || !hi || shape !== "landscape") return;
    let alive = true;
    const probe = new Image();
    // YouTube answers a missing maxres thumbnail with a 120px stub.
    probe.onload = () => alive && probe.naturalWidth > 120 && setSrc(probe.src);
    probe.src = thumbUrl(id, "maxresdefault");
    return () => {
      alive = false;
    };
  }, [id, media, hi, shape]);

  const variant = id ? `thumb--${shape}` : "thumb--image";
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      loading={eager ? "eager" : "lazy"}
      decoding="async"
      draggable={false}
      className={`thumb ${variant} ${className}`}
    />
  );
}
