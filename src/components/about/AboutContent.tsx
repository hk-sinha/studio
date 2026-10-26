"use client";
import { useSiteData } from "@/components/providers/SiteDataProvider";
import { useUI } from "@/components/providers/UIProvider";
import { Reveal } from "@/components/ui/Reveal";
import { btn, nudge } from "@/components/ui/button";
import { ArrowRight, DownloadSimple } from "@/components/ui/icons";
import { asset } from "@/lib/media";

// The avatar is cut off only at the bottom of its frame: fade that edge into the page.
const EDGE_FADE = "linear-gradient(to bottom, #000 70%, transparent 99%)";

export function AboutContent() {
  const { profile, toolkit, about } = useSiteData();
  const { openContact } = useUI();
  const paragraphs = profile.about.split(/\n+/).filter(Boolean);

  return (
    <>
      <section className="wrap grid items-end gap-[clamp(24px,4vw,64px)] pt-[calc(68px+clamp(48px,7vw,96px))] md:grid-cols-[5fr_6fr]">
        <div className="pb-[clamp(56px,9vw,120px)]">
          <p className="mb-5 animate-[fadeUp_.9s_var(--ease-expo)_both] text-xs uppercase tracking-[0.22em] text-muted">About</p>
          <h1 className="display animate-[fadeUp_.9s_var(--ease-expo)_.06s_both] text-[clamp(44px,7vw,104px)]">Himanshu<br />Kumar Sinha</h1>
          <p className="mt-7 max-w-[40ch] animate-[fadeUp_.9s_var(--ease-expo)_.12s_both] text-lg text-muted">
            AI video director and motion designer. Realistic AI ads and motion graphics first, UGC-style marketing content alongside. Script to final edit, under one roof.
          </p>
          <div className="mt-9 flex animate-[fadeUp_.9s_var(--ease-expo)_.18s_both] flex-wrap gap-3">
            <button onClick={openContact} className={btn("primary")}>
              Start a project <ArrowRight weight="light" size={18} className={nudge} />
            </button>
            <a href={profile.resumeLink} target="_blank" rel="noopener" className={btn("ghost")}>
              <DownloadSimple weight="light" size={18} /> Download CV
            </a>
          </div>
        </div>
        {profile.portraitUrl ? (
          // A photo set in Admin > Profile wins; it may have a background, so it keeps a frame.
          <Reveal className="media-box mb-[clamp(56px,9vw,120px)] aspect-[4/5] w-full rounded-card bg-ink-850 max-md:aspect-[16/11]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={profile.portraitUrl} alt="Himanshu Kumar Sinha" className="thumb thumb--image grayscale" />
            <span className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent from-60% to-ink-950" />
          </Reveal>
        ) : (
          // Default: the background-removed cutout, free-standing (no box), sitting on the section edge.
          <Reveal className="relative flex justify-center self-end md:justify-end">
            <span aria-hidden="true" className="pointer-events-none absolute inset-x-[6%] bottom-0 top-[12%] rounded-full bg-[radial-gradient(closest-side,rgb(237_237_234/0.13),rgb(110_130_165/0.06)_55%,transparent)]" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={asset("/about/portrait.webp")}
              alt="Himanshu Kumar Sinha"
              width={929}
              height={979}
              fetchPriority="high"
              className="relative h-auto w-full max-w-[620px] object-contain object-bottom"
              style={{ maskImage: EDGE_FADE, WebkitMaskImage: EDGE_FADE }}
            />
          </Reveal>
        )}
      </section>

      <section className="wrap grid gap-[clamp(40px,6vw,96px)] border-t border-line py-[clamp(72px,9vw,120px)] md:grid-cols-[4fr_7fr]">
        <Reveal as="h2" className="display text-[clamp(32px,4vw,52px)]">The short<br />version.</Reveal>
        <div className="flex max-w-[62ch] flex-col gap-5 text-[17px] leading-relaxed text-muted">
          {paragraphs.map((p, i) => <Reveal as="p" key={i} delay={i * 60}>{p}</Reveal>)}
        </div>
      </section>

      <section className="wrap grid gap-[clamp(40px,6vw,96px)] border-t border-line py-[clamp(72px,9vw,120px)] md:grid-cols-[4fr_7fr]">
        <Reveal as="h2" className="display text-[clamp(32px,4vw,52px)]">Toolkit</Reveal>
        <Reveal as="ul" delay={80} className="flex flex-wrap content-start gap-2.5">
          {toolkit.map((t) => (
            <li key={t} className="inline-flex h-11 items-center rounded-full border border-line-strong px-5 text-[15px]">{t}</li>
          ))}
        </Reveal>
      </section>

      {/* Edited in Admin > Education; each list (and the whole section) hides while empty. */}
      {(about.education.length > 0 || about.certifications.length > 0) && (
      <section className="wrap grid gap-[clamp(40px,6vw,96px)] border-t border-line py-[clamp(72px,9vw,120px)] md:grid-cols-[4fr_7fr]">
        <Reveal as="h2" className="display text-[clamp(32px,4vw,52px)]">Education<br />&amp; training</Reveal>
        <div className="grid gap-10 sm:grid-cols-2">
          {about.education.length > 0 && (
          <Reveal>
            <h3 className="mb-5 text-[13px] font-medium text-muted">Education</h3>
            <ul className="flex flex-col gap-6">
              {about.education.map((e, i) => (
                <li key={`${e.title}-${i}`}>
                  <p className="font-mono text-xs text-subtle">{e.period}</p>
                  <p className="mt-1.5 text-[17px] font-medium leading-snug">{e.title}</p>
                  <p className="text-[15px] text-muted">{e.place}</p>
                </li>
              ))}
            </ul>
          </Reveal>
          )}
          {about.certifications.length > 0 && (
          <Reveal delay={80}>
            <h3 className="mb-5 text-[13px] font-medium text-muted">Certifications</h3>
            <ul className="flex flex-col gap-6">
              {about.certifications.map((c, i) => (
                <li key={`${c.title}-${i}`}>
                  <p className="font-mono text-xs text-subtle">{c.year}</p>
                  <p className="mt-1.5 text-[17px] font-medium leading-snug">{c.title}</p>
                  <p className="text-[15px] text-muted">{c.issuer}</p>
                </li>
              ))}
            </ul>
          </Reveal>
          )}
        </div>
      </section>
      )}
    </>
  );
}
