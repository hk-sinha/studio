"use client";
import { useEffect, useState, type FormEvent } from "react";
import { fetchProfile, saveProfile } from "@/lib/data";
import { DEFAULT_PROFILE } from "@/lib/config";
import { youtubeId } from "@/lib/media";
import type { Profile } from "@/lib/types";
import { Thumb } from "@/components/ui/Thumb";
import { btn } from "@/components/ui/button";
import { CircleNotch } from "@/components/ui/icons";
import { Field, errorText, useToast } from "./ui";

export function ProfileTab() {
  const notify = useToast();
  const [v, setV] = useState<Profile>(DEFAULT_PROFILE);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    fetchProfile()
      .then(setV)
      .catch((e) => notify(errorText(e), "error"))
      .finally(() => setLoading(false));
  }, [notify]);

  const set = (k: keyof Profile, val: string) => { setV((s) => ({ ...s, [k]: val })); setDirty(true); };
  const reelId = youtubeId(v.showreelId);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await saveProfile({ ...v, showreelId: reelId ?? v.showreelId.trim() });
      setDirty(false);
      notify("Profile saved. The site updates on the next page load.");
    } catch (err) {
      notify(errorText(err), "error");
    }
    setBusy(false);
  }

  if (loading) return <div className="flex flex-col gap-4">{Array.from({ length: 5 }, (_, i) => <div key={i} className="skeleton h-14 rounded-btn" />)}</div>;

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-10">
      <div>
        <h1 className="display text-[clamp(36px,4.6vw,56px)]">Profile</h1>
        <p className="mt-3 text-muted">Contact details, bio and media used across the site.</p>
      </div>

      <section className="grid gap-x-8 gap-y-5 md:grid-cols-2">
        <h2 className="text-sm font-medium text-muted md:col-span-2">Contact</h2>
        <Field label="Email" htmlFor="pr-email"><input id="pr-email" type="email" className="field-input" value={v.email} onChange={(e) => set("email", e.target.value)} /></Field>
        <Field label="Phone / WhatsApp" htmlFor="pr-phone" help="Include the country code. WhatsApp links are built from this."><input id="pr-phone" className="field-input" value={v.phone} onChange={(e) => set("phone", e.target.value)} /></Field>
        <Field label="Address" htmlFor="pr-address" help="A city is enough, e.g. Vadodara, Gujarat, India."><input id="pr-address" className="field-input" value={v.address} onChange={(e) => set("address", e.target.value)} /></Field>
        <Field label="Map link" htmlFor="pr-map"><input id="pr-map" type="url" className="field-input" value={v.locationLink} onChange={(e) => set("locationLink", e.target.value)} placeholder="https://maps.app.goo.gl/..." /></Field>
      </section>

      <section className="grid gap-x-8 gap-y-5 border-t border-line pt-10 md:grid-cols-2">
        <h2 className="text-sm font-medium text-muted md:col-span-2">About</h2>
        <Field label="Bio" htmlFor="pr-about" help="Shown on the About page. Blank lines start a new paragraph." className="md:col-span-2">
          <textarea id="pr-about" rows={7} className="field-input resize-y" value={v.about} onChange={(e) => set("about", e.target.value)} />
        </Field>
        <Field label="Resume link" htmlFor="pr-resume"><input id="pr-resume" type="url" className="field-input" value={v.resumeLink} onChange={(e) => set("resumeLink", e.target.value)} /></Field>
        <Field label="Copyright line" htmlFor="pr-copy" help="Leave empty to show the current year automatically."><input id="pr-copy" className="field-input" value={v.copyright} onChange={(e) => set("copyright", e.target.value)} /></Field>
      </section>

      <section className="grid gap-x-8 gap-y-5 border-t border-line pt-10 md:grid-cols-[1fr_280px]">
        <h2 className="text-sm font-medium text-muted md:col-span-2">Media</h2>
        <div className="flex flex-col gap-5">
          <Field label="Showreel" htmlFor="pr-reel" help="YouTube link or ID. Plays from every Watch showreel button.">
            <input id="pr-reel" className="field-input" value={v.showreelId} onChange={(e) => set("showreelId", e.target.value)} />
          </Field>
          <Field label="Portrait photo URL" htmlFor="pr-portrait" help="Optional. A direct image link (ends in .jpg, .png or .webp). Shown in black and white. Without one, the showreel still is used.">
            <input id="pr-portrait" type="url" className="field-input" value={v.portraitUrl} onChange={(e) => set("portraitUrl", e.target.value)} />
          </Field>
        </div>
        <div className="media-box aspect-video rounded-thumb border border-line bg-ink-950">
          {reelId ? <Thumb media={reelId} shape="landscape" hi /> : <span className="absolute inset-0 grid place-items-center text-[13px] text-subtle">No valid showreel</span>}
        </div>
      </section>

      <div className="sticky bottom-4 flex items-center gap-4 rounded-card border border-line-strong bg-ink-900/95 p-4 backdrop-blur">
        <button type="submit" disabled={busy || !dirty} className={btn("primary")}>
          {busy ? <>Saving <CircleNotch weight="light" size={18} className="animate-spin" /></> : "Save changes"}
        </button>
        <span className="text-sm text-muted">{dirty ? "Unsaved changes" : "All changes saved"}</span>
      </div>
    </form>
  );
}
