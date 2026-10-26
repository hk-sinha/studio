"use client";
import { useEffect, useMemo, useRef } from "react";
import { useSiteData } from "@/components/providers/SiteDataProvider";
import { useUI } from "@/components/providers/UIProvider";
import { Thumb } from "@/components/ui/Thumb";
import { btn, nudge } from "@/components/ui/button";
import { ArrowRight, EnvelopeSimple, WhatsappLogo } from "@/components/ui/icons";
import { whatsappLink } from "@/lib/media";
import { LEAD_TYPES } from "@/lib/config";
import { gsap, prefersReducedMotion } from "@/lib/scroll";

export function FinalCta() {
  const { profile, projects, cta } = useSiteData();
  const { openContact } = useUI();
  const root = useRef<HTMLDivElement>(null);

  // Background: a landscape AI ad or motion piece that is not the showreel, in black and white.
  const bg = useMemo(
    () =>
      projects.find((p) => p.shape === "landscape" && LEAD_TYPES.includes(p.type) && p.mediaId !== profile.showreelId)?.mediaId ??
      profile.showreelId,
    [projects, profile.showreelId],
  );

  useEffect(() => {
    if (prefersReducedMotion()) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(".cta-media", { scale: 1.15 }, {
        scale: 1,
        ease: "none",
        scrollTrigger: { trigger: root.current, start: "top bottom", end: "bottom top", scrub: true },
      });
    }, root);
    return () => ctx.revert();
  }, []);

  return (
    <section className="pb-[clamp(96px,12vw,160px)]">
      <div className="wrap">
        <div ref={root} className="relative isolate flex min-h-[70vh] items-end overflow-hidden rounded-card border border-line">
          <div className="cta-media media-box absolute inset-0 -z-[2]">
            {/* Admin > CTA can set an uploaded/linked image or video; otherwise a film still. */}
            {cta?.kind === "image" ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={cta.url} alt="" loading="lazy" className="thumb thumb--image brightness-[.85]" />
            ) : cta?.kind === "video" ? (
              <video src={cta.url} autoPlay muted loop playsInline preload="metadata" className="thumb thumb--image brightness-[.85]" />
            ) : (
              <Thumb media={cta?.kind === "youtube" ? cta.url : bg} shape="landscape" hi className="brightness-[.85] contrast-[1.1] grayscale" />
            )}
          </div>
          <span className="absolute inset-0 -z-[1] bg-[linear-gradient(90deg,rgb(11_11_12/.55)_0%,rgb(11_11_12/.25)_60%,rgb(11_11_12/.1)_100%)]" />
          <div className="liquid-dark m-[clamp(12px,3vw,40px)] max-w-[720px] rounded-[24px] p-[clamp(24px,4vw,56px)]">
            <h2 className="display text-[clamp(40px,6vw,80px)]">Got a launch<br />coming up?</h2>
            <p className="mt-6 max-w-[44ch] text-[17px] text-muted">
              Tell me about the brand and the deadline. I reply with an approach and a quote within 24 hours.
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-x-8 gap-y-5">
              <button onClick={openContact} className={btn("primary")}>
                Start a project <ArrowRight weight="light" size={18} className={nudge} />
              </button>
              <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted">
                <a href={whatsappLink(profile.phone)} target="_blank" rel="noopener" className="inline-flex items-center gap-2 transition-colors hover:text-fg">
                  <WhatsappLogo weight="fill" size={18} /> WhatsApp
                </a>
                <a href={`mailto:${profile.email}`} className="inline-flex items-center gap-2 break-all transition-colors hover:text-fg">
                  <EnvelopeSimple weight="light" size={18} /> {profile.email}
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
