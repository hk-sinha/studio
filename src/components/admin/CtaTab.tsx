"use client";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { fetchCtaMedia, saveCtaMedia, type CtaMedia } from "@/lib/data";
import { youtubeId } from "@/lib/media";
import { Thumb } from "@/components/ui/Thumb";
import { btn } from "@/components/ui/button";
import { CircleNotch, DownloadSimple, Trash } from "@/components/ui/icons";
import { ConfirmButton, Field, errorText, useToast } from "./ui";

// Firestore documents cap at 1 MiB, so uploads are shrunk to fit well under it.
const MAX_BYTES = 750_000;

/** Resize to at most 1920px wide and re-encode as WebP, lowering quality until it fits. */
async function compress(f: File): Promise<string> {
  const img = await createImageBitmap(f);
  for (const width of [1920, 1600, 1280]) {
    const scale = Math.min(1, width / img.width);
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(img.width * scale);
    canvas.height = Math.round(img.height * scale);
    canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height);
    for (const q of [0.82, 0.7, 0.58, 0.45]) {
      const url = canvas.toDataURL("image/webp", q);
      if (url.length <= MAX_BYTES) return url;
    }
  }
  throw new Error("This image is too detailed to fit. Try a smaller or simpler image.");
}

/** Background image or video for the "Got a launch coming up?" section. */
export function CtaTab() {
  const notify = useToast();
  const [media, setMedia] = useState<CtaMedia | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [link, setLink] = useState("");
  const [err, setErr] = useState("");
  const file = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchCtaMedia().then(setMedia).catch((e) => notify(errorText(e), "error")).finally(() => setLoading(false));
  }, [notify]);

  async function persist(next: CtaMedia | null, msg: string) {
    await saveCtaMedia(next);
    setMedia(next);
    notify(msg);
  }

  async function upload(f: File) {
    setErr("");
    if (f.type.startsWith("video/")) return setErr("Videos can't be uploaded on the free plan. Put it on YouTube (unlisted is fine) and paste the link below.");
    if (!f.type.startsWith("image/")) return setErr("Choose an image (JPG, PNG, WebP).");
    setBusy(true);
    try {
      await persist({ url: await compress(f), kind: "image" }, "Uploaded. The CTA uses it from the next page load.");
    } catch (e) {
      setErr(errorText(e));
    }
    setBusy(false);
  }

  async function useLink(e: FormEvent) {
    e.preventDefault();
    setErr("");
    const raw = link.trim();
    const yt = youtubeId(raw);
    if (yt) return persist({ url: yt, kind: "youtube" }, "Saved: the CTA shows that video's still.").then(() => setLink(""));
    if (!/^https:\/\//.test(raw)) return setErr("Paste a YouTube link, or a direct https link to an image or .mp4/.webm file.");
    const kind = /\.(mp4|webm|mov)(\?|$)/i.test(raw) ? "video" : "image";
    await persist({ url: raw, kind }, "Saved.").catch((x) => setErr(errorText(x)));
    setLink("");
  }

  if (loading) return <div className="skeleton h-64 rounded-card" />;

  return (
    <div className="flex max-w-3xl flex-col gap-10">
      <div>
        <h1 className="display text-[clamp(36px,4.6vw,56px)]">CTA</h1>
        <p className="mt-3 text-muted">The background of the &ldquo;Got a launch coming up?&rdquo; section. Without one, a still from your films is used.</p>
      </div>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-medium text-muted">Current</h2>
        <div className="media-box aspect-video rounded-card border border-line bg-ink-950">
          {!media ? (
            <span className="absolute inset-0 grid place-items-center text-sm text-subtle">Automatic (film still)</span>
          ) : media.kind === "image" ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={media.url} alt="" className="thumb thumb--image" />
          ) : media.kind === "video" ? (
            <video src={media.url} autoPlay muted loop playsInline className="thumb thumb--image" />
          ) : (
            <Thumb media={media.url} shape="landscape" hi />
          )}
        </div>
        {media && (
          <ConfirmButton onConfirm={() => persist(null, "Back to automatic.").catch((e) => setErr(errorText(e)))} armedLabel="Remove it?" ariaLabel="Remove CTA media" className={btn("ghost", "sm", "self-start")}>
            <Trash weight="light" size={16} /> Remove (use automatic)
          </ConfirmButton>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-medium text-muted">Upload</h2>
        <input ref={file} type="file" accept="image/*" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) upload(f); e.target.value = ""; }} />
        <button onClick={() => file.current?.click()} disabled={busy} className={btn("primary", "md", "self-start")}>
          {busy ? <>Uploading <CircleNotch weight="light" size={18} className="animate-spin" /></> : <><DownloadSimple weight="light" size={18} className="rotate-180" /> Choose image</>}
        </button>
        <p className="text-[13px] text-muted">JPG, PNG or WebP, any size: it&rsquo;s resized and compressed automatically. For a video, use a YouTube link below (it plays as the film still) or a direct .mp4 link.</p>
      </section>

      <form onSubmit={useLink} className="flex flex-col gap-3">
        <h2 className="text-sm font-medium text-muted">Or attach a link</h2>
        <Field label="YouTube link, or direct image/video URL" htmlFor="cta-link">
          <div className="flex gap-2">
            <input id="cta-link" value={link} onChange={(e) => setLink(e.target.value)} placeholder="https://..." className="field-input" />
            <button type="submit" className={btn("ghost", "md", "!h-auto")}>Use link</button>
          </div>
        </Field>
      </form>

      {err && <p role="alert" className="rounded-btn border border-rec/40 bg-rec/10 px-4 py-3 text-sm text-[#FFB3B5]">{err}</p>}
    </div>
  );
}
