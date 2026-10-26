"use client";
import { useSiteData } from "@/components/providers/SiteDataProvider";
import { Reveal } from "@/components/ui/Reveal";

/** Client quotes only. Hidden until real testimonials are added in the admin panel. */
export function Proof() {
  const { testimonials } = useSiteData();
  if (!testimonials.length) return null;

  return (
    <section className="py-[clamp(96px,12vw,160px)]">
      <div className="wrap grid items-start gap-[clamp(48px,7vw,120px)] min-[900px]:grid-cols-2">
        <div>
          <p className="mb-5 text-xs uppercase tracking-[0.22em] text-muted">Clients say</p>
          <Reveal as="h2" className="display text-[clamp(36px,5vw,64px)]">In their<br />words.</Reveal>
        </div>

        <ul className="flex flex-col gap-4">
          {testimonials.slice(0, 3).map((t, i) => (
            <Reveal
              as="li"
              key={t.id}
              delay={i * 90}
              className={`rounded-card border border-line bg-ink-850 p-7 shadow-[inset_0_1px_0_rgb(255_255_255/0.04)] ${i === 1 ? "min-[900px]:ml-14" : ""}`}
            >
              <blockquote className="line-clamp-3 max-w-[46ch] text-[15px] text-muted">&ldquo;{t.quote}&rdquo;</blockquote>
              <div className="mt-5 flex items-center gap-3.5">
                {t.photoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={t.photoUrl} alt="" className="size-12 rounded-full object-cover grayscale" loading="lazy" />
                ) : (
                  <span className="grid size-12 shrink-0 place-items-center rounded-full border border-line-strong bg-ink-800 font-display text-[13px]">
                    {t.name.split(" ").map((w) => w[0]).slice(0, 2).join("")}
                  </span>
                )}
                <div>
                  <strong className="block text-[15px] font-medium">{t.name}</strong>
                  <span className="text-[13px] text-muted">{[t.role, t.company].filter(Boolean).join(", ")}</span>
                </div>
              </div>
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  );
}
