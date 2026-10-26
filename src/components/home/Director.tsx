"use client";
import Link from "next/link";
import { useSiteData } from "@/components/providers/SiteDataProvider";
import { useUI } from "@/components/providers/UIProvider";
import { Reveal } from "@/components/ui/Reveal";
import { Thumb } from "@/components/ui/Thumb";
import { btn, nudge } from "@/components/ui/button";
import { ArrowRight, Play } from "@/components/ui/icons";

export function Director() {
  const { profile, toolkit } = useSiteData();
  const { openVideo } = useUI();
  const showreel = () => openVideo({ media: profile.showreelId, shape: "landscape", title: "Showreel" });

  return (
    <section id="about" className="py-[clamp(96px,12vw,160px)]">
      <div className="wrap grid items-center gap-[clamp(40px,7vw,120px)] md:grid-cols-[5fr_6fr]">
        <Reveal className="media-box aspect-[16/11] rounded-card bg-ink-850 md:aspect-[4/5]">
          {profile.portraitUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={profile.portraitUrl} alt="Himanshu Kumar Sinha" className="thumb thumb--image grayscale" loading="lazy" />
          ) : (
            // No portrait yet: the showreel still doubles as a play button.
            <button onClick={showreel} aria-label="Play showreel" className="group absolute inset-0">
              <Thumb media={profile.showreelId} shape="landscape" hi className="grayscale transition-transform duration-[1.4s] ease-expo group-hover:scale-105" />
              <span className="absolute left-1/2 top-1/2 grid size-[76px] -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-white/25 bg-ink-950/45 text-white backdrop-blur-md transition-colors group-hover:border-transparent group-hover:bg-rec-strong">
                <Play weight="fill" size={22} />
              </span>
            </button>
          )}
          <span className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent from-55% to-ink-950" />
        </Reveal>

        <div>
          <Reveal as="p" className="mb-5 text-xs uppercase tracking-[0.22em] text-muted">About</Reveal>
          <Reveal as="h2" delay={60} className="display mb-7 text-[clamp(36px,5vw,64px)]">
            Director first.<br />AI second.
          </Reveal>
          <Reveal as="ul" delay={120} aria-label="Toolkit" className="mb-7 flex flex-wrap gap-2">
            {toolkit.map((t) => (
              <li key={t} className="liquid inline-flex h-8 items-center rounded-full px-3.5 text-[13px] text-fg/80">{t}</li>
            ))}
          </Reveal>
          <Reveal as="p" delay={180} className="max-w-[52ch] text-[17px] text-muted">
            I script, storyboard and direct every frame, then build it with AI generation and motion design. Ad-ready films, no shoot needed.
          </Reveal>
          <Reveal delay={240} className="mt-9 flex flex-wrap items-center gap-7">
            <button onClick={showreel} className={btn("ghost")}>
              <Play weight="fill" size={14} /> Watch showreel
            </button>
            <Link href="/about/" className="group inline-flex items-center gap-2 text-[15px] text-muted transition-colors hover:text-fg">
              About me <ArrowRight weight="light" size={16} className={nudge} />
            </Link>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
